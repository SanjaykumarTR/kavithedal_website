"""
Views for Orders App — PayU payment integration.
"""
import hashlib
import hmac
import json
import logging
import uuid
from datetime import date, timedelta

import requests as http_requests
from django.conf import settings
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.utils import is_authorized_admin
from .models import CartCheckoutSession, DeliveryZone, EbookPurchase, Order, Payment, UserLibrary
from .serializers import (
    DeliveryZoneSerializer, OrderCreateSerializer, OrderSerializer,
    PaymentSerializer, UserLibraryListSerializer, UserLibrarySerializer,
)

logger = logging.getLogger('apps')

# ============= PAYU UTILITY FUNCTIONS =============

def _payu_configured():
    """Return True when PayU credentials are set in env."""
    return bool(
        getattr(settings, 'PAYU_KEY', '') and
        getattr(settings, 'PAYU_SALT', '')
    )


def _payu_base_url():
    """Get PayU base URL based on environment."""
    env = getattr(settings, 'PAYU_ENV', 'sandbox')
    base_url = getattr(settings, 'PAYU_BASE_URL', '')
    if base_url:
        return base_url.rstrip('/')
    # Default: use sandbox or production
    return 'https://sandbox.juspay.in' if env == 'sandbox' else 'https://api.juspay.in'


def _generate_payu_hash(key, txnid, amount, productinfo, firstname, email, salt, **kwargs):
    """
    Generate PayU SHA-512 hash.

    Format: key|txnid|amount|productinfo|firstname|email|||||||||||salt

    Additional optional fields: udf1-udf5 (user-defined fields)

    Args:
        key: PayU merchant key
        txnid: Transaction ID (must be unique)
        amount: Transaction amount (2 decimal places)
        productinfo: Product description
        firstname: Customer's first name
        email: Customer's email
        salt: PayU merchant salt
        **kwargs: Optional fields (udf1-udf5)

    Returns:
        str: SHA-512 hash string
    """
    # Ensure amount has 2 decimal places
    amount_str = f"{float(amount):.2f}"

    # Build hash string in PayU format
    hash_string = (
        f"{key}|{txnid}|{amount_str}|{productinfo}|{firstname}|{email}"
        f"|||||||||||{salt}"
    )

    # Generate SHA-512 hash
    generated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest().lower()

    logger.info(f"PayU hash generated: txnid={txnid}, hash={generated_hash[:20]}...")
    return generated_hash


def _generate_txnid(prefix, uid):
    """
    Generate a unique PayU transaction ID.

    Format: kv-{prefix}-{unique_hex}

    PayU limits: max 50 chars, alphanumeric + hyphen + underscore only.

    Args:
        prefix: 'eb' (ebook), 'ph' (physical), 'ct' (cart)
        uid: UUID or unique identifier

    Returns:
        str: Transaction ID
    """
    hex_part = str(uid).replace('-', '')[:20]
    return f'kv-{prefix}-{hex_part}'


def _payu_make_order_id(prefix, uid):
    """Alias for _generate_txnid for backward compatibility."""
    return _generate_txnid(prefix, uid)


def _normalize_phone(phone):
    """Normalize phone number for PayU (accepts various formats)."""
    phone = str(phone).strip().replace(' ', '').replace('-', '').replace('+', '')
    # Remove country code if present (PayU typically expects 10-digit)
    if phone.startswith('91') and len(phone) == 12:
        phone = phone[2:]
    return phone[:10] or '9999999999'


# ============= PAYMENT HELPERS =============

def calculate_delivery_charge(total_price):
    """
    Calculate delivery charge for physical books based on order total.
      < ₹500  → ₹40
      ₹500–₹999 → ₹30
      ≥ ₹1000 → ₹20
    eBooks always get ₹0.
    """
    total = float(total_price)
    if total <= 0:
        return 0
    if total < 500:
        return 40
    elif total < 1000:
        return 30
    return 20


# ============= EMAIL HELPERS =============

def _send_customer_email(customer_email, customer_name, book_titles,
                          order_type, amount, order_id, estimated_delivery=None):
    """Send order confirmation email to the customer."""
    from django.core.mail import send_mail

    if isinstance(book_titles, list):
        book_list = '\n'.join(f'  • {t}' for t in book_titles)
    else:
        book_list = f'  • {book_titles}'

    order_type_label = 'eBook' if order_type == 'ebook' else 'Physical Book'

    if order_type == 'ebook':
        delivery_section = (
            'Your eBook is now available in your library.\n'
            'Visit https://kavithedal.com/library to read it.'
        )
    else:
        delivery_section = 'Your book will be shipped to your address.'
        if estimated_delivery:
            delivery_section += f'\nEstimated delivery: {estimated_delivery}'

    subject = 'Order Confirmed — Kavithedal Publications'
    message = f"""Dear {customer_name},

Thank you for your purchase! Your payment has been received successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Book(s):
{book_list}

Type    : {order_type_label}
Amount  : ₹{amount}
Order ID: {order_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{delivery_section}

View your orders: https://kavithedal.com/user-dashboard

For any queries, contact us at kavithedalpublications@gmail.com

Warm regards,
Kavithedal Publications
"""
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [customer_email], fail_silently=False)
    except Exception as exc:
        logger.error('Failed to send customer email to %s: %s', customer_email, exc)


def _send_admin_email_for_purchase(purchase):
    """Send admin notification email for a completed eBook purchase."""
    from django.core.mail import send_mail

    subject = f'New eBook Purchase: {purchase.book.title}'
    message = f"""
New eBook Purchase Details:

Customer Name : {purchase.user_name}
Customer Email: {purchase.email}
Phone         : {purchase.phone}
Address       : {purchase.address}

Book Name     : {purchase.book.title}
Price         : ₹{purchase.price}
Payment Status: {purchase.payment_status}
Order Date    : {purchase.order_date}

Automated notification — Kavithedal Publications.
"""
    admin_email = getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL)
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [admin_email], fail_silently=False)
    except Exception as exc:
        logger.error('Failed to send admin email for purchase %s: %s', purchase.id, exc)


# ============= PERMISSIONS =============

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user or is_authorized_admin(request.user)


# ============= VIEWSETS =============

class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order CRUD operations."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if is_authorized_admin(user):
            return Order.objects.all().select_related('book', 'book__author', 'user', 'delivery_zone')
        return Order.objects.filter(user=user).select_related('book', 'book__author', 'delivery_zone')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def simulate_payment(self, request, pk=None):
        """Simulate payment — only available when PayU is NOT configured (local dev)."""
        if _payu_configured():
            return Response(
                {'error': 'Payment simulation is not available when PayU is configured.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'error': 'Payment already processed or cancelled'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Payment.objects.create(
            order=order,
            payu_order_id=f'sim_{order.id}',
            payu_payment_id=f'sim_pay_{order.id}',
            amount=order.total_price,
            status='completed',
            payment_method='simulated',
            transaction_id=f'sim_txn_{order.id}',
        )
        order.status = 'completed'
        order.payment_status = 'paid'
        order.save()
        if order.order_type == 'ebook':
            UserLibrary.objects.get_or_create(
                user=order.user, book=order.book, defaults={'order': order}
            )
        return Response({
            'status': 'Payment successful',
            'order_id': str(order.id),
            'message': 'Payment simulated successfully!',
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_authorized_admin(user):
            return Payment.objects.all().select_related('order', 'order__book')
        return Payment.objects.filter(order__user=user).select_related('order', 'order__book')


class DeliveryZoneViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DeliveryZoneSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return DeliveryZone.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def by_pincode(self, request):
        pincode = request.query_params.get('pincode')
        if not pincode:
            return Response({'error': 'pincode is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            zone = DeliveryZone.objects.get(pincode=pincode, is_active=True)
            return Response(DeliveryZoneSerializer(zone).data)
        except DeliveryZone.DoesNotExist:
            return Response({
                'pincode': pincode, 'city': 'Unknown', 'state': 'Unknown',
                'zone_type': 'national', 'delivery_charge': '100.00',
                'min_delivery_days': 5, 'max_delivery_days': 10,
                'delivery_time': '5-10 Days', 'is_active': True,
                'message': 'Delivery available with standard charges',
            })

    @action(detail=False, methods=['post'])
    def calculate_delivery(self, request):
        pincode = (request.data.get('pincode') or '').strip()
        book_price = float(request.data.get('book_price', 0) or 0)
        delivery_charge = calculate_delivery_charge(book_price)

        if pincode.startswith('636'):
            min_days, max_days = 2, 3
        elif pincode.startswith('600'):
            min_days, max_days = 3, 5
        else:
            min_days, max_days = 5, 7

        estimated_date = date.today() + timedelta(days=max_days)
        return Response({
            'pincode': pincode,
            'delivery_charge': delivery_charge,
            'book_price': book_price,
            'total_price': book_price + delivery_charge,
            'min_delivery_days': min_days,
            'max_delivery_days': max_days,
            'estimated_delivery_date': estimated_date.strftime('%Y-%m-%d'),
            'message': 'Delivery charge calculated successfully',
        })


class UserLibraryViewSet(viewsets.ModelViewSet):
    serializer_class = UserLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserLibrary.objects.filter(
            user=self.request.user
        ).select_related('book', 'book__author', 'order')

    def get_serializer_class(self):
        if self.action == 'list':
            return UserLibraryListSerializer
        return UserLibrarySerializer

    @action(detail=False, methods=['get'])
    def check_access(self, request):
        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response({'error': 'book_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        has_access = UserLibrary.objects.filter(
            user=request.user, book_id=book_id
        ).exists()
        return Response({'has_access': has_access, 'book_id': book_id})


# ============= PAYU PAYMENT VIEWS =============

class CreateOrderView(APIView):
    """
    Create a PayU payment order for a single physical or ebook purchase.

    Simulation mode (no PayU keys): auto-completes the order instantly.
    Production mode: returns PayU payment parameters for form submission.

    POST /api/orders/create-order/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        order_type = request.data.get('order_type', 'physical')

        if not book_id:
            return Response({'error': 'book_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.books.models import Book
        try:
            book = Book.objects.get(id=book_id, is_active=True)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        if order_type == 'ebook' and UserLibrary.objects.filter(
            user=request.user, book=book
        ).exists():
            return Response(
                {'error': 'You already own this eBook'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate price
        if order_type == 'ebook':
            unit_price = book.ebook_price
            if not unit_price:
                return Response({'error': 'eBook price not set'}, status=status.HTTP_400_BAD_REQUEST)
            delivery_charge = 0
            total_price = float(unit_price)
        else:
            unit_price = book.physical_price or book.price
            if not unit_price:
                return Response({'error': 'Physical book price not set'}, status=status.HTTP_400_BAD_REQUEST)
            delivery_charge = calculate_delivery_charge(float(unit_price))
            total_price = float(unit_price) + delivery_charge

        # Estimate delivery for physical books
        shipping_pincode = request.data.get('shipping_pincode', '')
        estimated_delivery_date = None
        if order_type == 'physical' and shipping_pincode:
            max_days = (3 if shipping_pincode.startswith('636')
                        else 5 if shipping_pincode.startswith('600') else 7)
            estimated_delivery_date = date.today() + timedelta(days=max_days)

        # Create Order record
        order = Order.objects.create(
            user=request.user,
            book=book,
            order_type=order_type,
            quantity=1,
            book_price=unit_price,
            delivery_charge=delivery_charge,
            total_price=total_price,
            status='processing',
            delivery_status='pending',
            payment_status='pending',
            full_name=request.data.get('full_name', ''),
            email=request.data.get('email', ''),
            phone=request.data.get('phone', ''),
            shipping_address=request.data.get('shipping_address', ''),
            shipping_city=request.data.get('shipping_city', ''),
            shipping_state=request.data.get('shipping_state', ''),
            shipping_pincode=shipping_pincode,
            estimated_delivery_date=estimated_delivery_date,
        )

        # Simulation mode (local dev without PayU keys)
        if not _payu_configured():
            Payment.objects.create(
                order=order,
                payu_order_id=f'sim_{order.id}',
                payu_payment_id=f'sim_pay_{order.id}',
                amount=total_price,
                status='completed',
                payment_method='simulated',
                transaction_id=f'sim_txn_{order.id}',
            )
            order.status = 'completed'
            order.payment_status = 'paid'
            order.save()
            if order_type == 'ebook':
                UserLibrary.objects.get_or_create(
                    user=request.user, book=book, defaults={'order': order}
                )
            return Response({
                'order_id': str(order.id),
                'status': 'completed',
                'purchased': True,
                'book_title': book.title,
                'book_cover': book.cover_image.url if book.cover_image else None,
                'delivery_charge': delivery_charge,
                'total_price': total_price,
                'estimated_delivery_date': (
                    estimated_delivery_date.strftime('%Y-%m-%d')
                    if estimated_delivery_date else None
                ),
            })

        # Production: Generate PayU parameters
        prefix = 'eb' if order_type == 'ebook' else 'ph'
        payu_order_id = _generate_txnid(prefix, order.id)

        # PayU success/failure return URLs
        success_url = (
            f"{settings.FRONTEND_URL}/payment-success"
            f"?order_id={payu_order_id}&type={order_type}"
        )
        failure_url = (
            f"{settings.FRONTEND_URL}/payment-failure"
            f"?order_id={payu_order_id}&type={order_type}"
        )

        # Prepare product info
        product_info = book.title

        # Get customer details
        firstname = request.data.get('full_name', request.user.get_full_name() or 'Customer')
        email = request.data.get('email', request.user.email)
        phone = _normalize_phone(request.data.get('phone', request.user.phone or '9999999999'))

        # Generate hash
        key = settings.PAYU_KEY
        salt = settings.PAYU_SALT

        hash_value = _generate_payu_hash(
            key=key,
            txnid=payu_order_id,
            amount=total_price,
            productinfo=product_info,
            firstname=firstname,
            email=email,
            salt=salt,
        )

        # Store PayU order ID on Order record
        order.payu_order_id = payu_order_id
        order.save(update_fields=['payu_order_id'])

        # Return PayU payment parameters
        return Response({
            'order_id': str(order.id),
            'payu_order_id': payu_order_id,
            'amount': total_price,
            'product_info': product_info,
            'firstname': firstname,
            'email': email,
            'phone': phone,
            'surl': success_url,
            'furl': failure_url,
            'hash': hash_value,
            'key': settings.PAYU_KEY,  # PayU needs key on frontend
            'book_title': book.title,
            'book_cover': book.cover_image.url if book.cover_image else None,
            'delivery_charge': delivery_charge,
            'estimated_delivery_date': (
                estimated_delivery_date.strftime('%Y-%m-%d')
                if estimated_delivery_date else None
            ),
        })


class EbookPurchaseView(APIView):
    """
    Create a PayU payment order for dedicated eBook checkout.
    Collects user_name, phone, address before initiating payment.

    Simulation mode: auto-completes and adds book to library.
    Production mode: returns PayU payment parameters.

    POST /api/orders/ebook-purchase/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        user_name = request.data.get('user_name', '').strip()
        email = request.data.get('email', request.user.email).strip()
        phone = request.data.get('phone', '').strip()
        address = request.data.get('address', '').strip()

        if not all([book_id, user_name, email, phone, address]):
            return Response(
                {'error': 'All fields are required: book_id, user_name, email, phone, address'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.books.models import Book
        try:
            book = Book.objects.get(id=book_id, is_active=True)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        if UserLibrary.objects.filter(user=request.user, book=book).exists():
            return Response(
                {'error': 'You already own this eBook'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        unit_price = book.ebook_price
        if not unit_price:
            return Response({'error': 'eBook price not set'}, status=status.HTTP_400_BAD_REQUEST)

        # Create EbookPurchase record
        purchase = EbookPurchase.objects.create(
            user=request.user,
            book=book,
            user_name=user_name,
            email=email,
            phone=phone,
            address=address,
            price=unit_price,
            payment_status='initiated',
        )

        # Simulation mode
        if not _payu_configured():
            purchase.payment_status = 'completed'
            purchase.transaction_id = f'sim_{purchase.id}'
            purchase.payu_order_id = f'sim_{purchase.id}'
            purchase.save()
            UserLibrary.objects.get_or_create(user=request.user, book=book, defaults={'order': None})
            _send_admin_email_for_purchase(purchase)
            return Response({
                'purchase_id': str(purchase.id),
                'status': 'completed',
                'book_title': book.title,
            })

        # Production: Generate PayU parameters
        payu_order_id = _generate_txnid('eb', purchase.id)
        success_url = (
            f"{settings.FRONTEND_URL}/payment-success"
            f"?order_id={payu_order_id}&type=ebook"
        )
        failure_url = (
            f"{settings.FRONTEND_URL}/payment-failure"
            f"?order_id={payu_order_id}&type=ebook"
        )

        product_info = book.title
        firstname = user_name
        email_addr = email
        phone_num = _normalize_phone(phone)

        # Generate hash
        key = settings.PAYU_KEY
        salt = settings.PAYU_SALT

        hash_value = _generate_payu_hash(
            key=key,
            txnid=payu_order_id,
            amount=float(unit_price),
            productinfo=product_info,
            firstname=firstname,
            email=email_addr,
            salt=salt,
        )

        # Store PayU order ID
        purchase.payu_order_id = payu_order_id
        purchase.save(update_fields=['payu_order_id'])

        return Response({
            'purchase_id': str(purchase.id),
            'payu_order_id': payu_order_id,
            'amount': float(unit_price),
            'product_info': product_info,
            'firstname': firstname,
            'email': email_addr,
            'phone': phone_num,
            'surl': success_url,
            'furl': failure_url,
            'hash': hash_value,
            'key': settings.PAYU_KEY,
            'book_title': book.title,
            'book_cover': book.cover_image.url if book.cover_image else None,
        })


class CartCheckoutView(APIView):
    """
    Create a PayU payment order for multi-item cart checkout.
    Items are stored server-side for tamper-proofing.

    Simulation mode: creates orders directly without PayU.
    Production mode: returns PayU payment parameters.

    POST /api/orders/cart-checkout/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get('items', [])
        total_amount = float(request.data.get('total_amount', 0) or 0)

        if not items:
            return Response({'error': 'No items in cart'}, status=status.HTTP_400_BAD_REQUEST)
        if total_amount <= 0:
            return Response({'error': 'Invalid total amount'}, status=status.HTTP_400_BAD_REQUEST)

        session_uuid = uuid.uuid4()
        payu_order_id = _generate_txnid('ct', session_uuid)

        # Simulation mode
        if not _payu_configured():
            return self._simulate_cart(request, items, total_amount, session_uuid)

        # Store items server-side
        CartCheckoutSession.objects.create(
            id=session_uuid,
            user=request.user,
            payu_order_id=payu_order_id,
            items=items,
            total_amount=total_amount,
            status='pending',
        )

        success_url = (
            f"{settings.FRONTEND_URL}/payment-success"
            f"?order_id={payu_order_id}&type=cart"
        )
        failure_url = (
            f"{settings.FRONTEND_URL}/payment-failure"
            f"?order_id={payu_order_id}&type=cart"
        )

        # Generic product info for cart
        product_info = f"{len(items)} item(s) from Kavithedal Publications"
        firstname = request.user.get_full_name() or 'Customer'
        email = request.user.email
        phone = _normalize_phone(request.data.get('phone', '9999999999'))

        # Generate hash
        key = settings.PAYU_KEY
        salt = settings.PAYU_SALT

        hash_value = _generate_payu_hash(
            key=key,
            txnid=payu_order_id,
            amount=total_amount,
            productinfo=product_info,
            firstname=firstname,
            email=email,
            salt=salt,
        )

        return Response({
            'payu_order_id': payu_order_id,
            'amount': total_amount,
            'product_info': product_info,
            'firstname': firstname,
            'email': email,
            'phone': phone,
            'surl': success_url,
            'furl': failure_url,
            'hash': hash_value,
            'key': settings.PAYU_KEY,
            'session_id': str(session_uuid),
        })

    def _simulate_cart(self, request, items, total_amount, session_uuid):
        """Create orders directly (dev mode — no PayU configured)."""
        from apps.books.models import Book

        physical_total = sum(
            float(i.get('price', 0)) * int(i.get('qty', 1))
            for i in items if i.get('book_type', 'physical') != 'ebook'
        )
        total_delivery = calculate_delivery_charge(physical_total)
        delivery_assigned = False
        created_orders = []

        # Generate a fake PayU order ID for simulation
        payu_order_id = f"sim_{session_uuid.hex[:12]}"

        for item in items:
            try:
                book = Book.objects.get(id=item['book_id'])
                item_delivery = 0
                if item.get('book_type', 'physical') != 'ebook' and not delivery_assigned:
                    item_delivery = total_delivery
                    delivery_assigned = True
                item_total = float(item.get('price', 0)) * int(item.get('qty', 1)) + item_delivery

                order = Order.objects.create(
                    user=request.user, book=book,
                    order_type=item.get('book_type', 'physical'),
                    quantity=item.get('qty', 1),
                    book_price=item.get('price', 0),
                    delivery_charge=item_delivery,
                    total_price=item_total,
                    status='completed', delivery_status='pending', payment_status='paid',
                    payu_order_id=payu_order_id,
                    payu_payment_id=f'sim_pay_{session_uuid.hex[:8]}',
                    transaction_id=f'sim_txn_{session_uuid.hex[:12]}',
                    full_name=request.user.get_full_name() or '',
                    email=request.user.email,
                )
                Payment.objects.create(
                    order=order,
                    payu_order_id=payu_order_id,
                    payu_payment_id=f'sim_pay_{session_uuid.hex[:8]}',
                    amount=item_total, status='completed',
                    payment_method='simulated',
                    transaction_id=f'sim_txn_{session_uuid.hex[:12]}',
                )
                if order.order_type == 'ebook':
                    UserLibrary.objects.get_or_create(
                        user=request.user, book=book, defaults={'order': order}
                    )
                created_orders.append(str(order.id))
            except Book.DoesNotExist:
                continue

        return Response({
            'status': 'completed',
            'message': f'{len(created_orders)} order(s) created successfully',
            'order_ids': created_orders,
            'payu_order_id': payu_order_id,
        })


# ============= PAYU CALLBACK VERIFICATION =============

class PayuVerifyPaymentView(APIView):
    """
    Verify PayU payment response hash and update order status.

    POST /api/orders/verify-payu-payment/
    Called from frontend after PayU redirects back to success/failure URLs.

    IMPORTANT: Always verify the hash from PayU response before updating database.
    """
    permission_classes = [permissions.AllowAny]  # PayU may call without session

    def post(self, request):
        """
        Verify PayU payment callback.

        Expected PayU response fields:
        - key: Merchant key
        - txnid: Transaction ID
        - amount: Amount
        - productinfo: Product info
        - firstname: Customer name
        - email: Customer email
        - status: success/failure
        - hash: SHA-512 hash from PayU
        - Optional: udf1-udf5, bank_ref_num, mihpayid
        """
        data = request.data

        # Extract fields
        received_key = data.get('key', '')
        received_txnid = data.get('txnid', '')
        received_amount = data.get('amount', '')
        received_productinfo = data.get('productinfo', '')
        received_firstname = data.get('firstname', '')
        received_email = data.get('email', '')
        received_status = data.get('status', '')
        received_hash = data.get('hash', '')

        logger.info(f"PayU callback received: txnid={received_txnid}, status={received_status}")

        # Verify hash - NEVER TRUST FRONTEND DATA without hash verification
        expected_hash = self._verify_payu_hash(data)
        if not expected_hash:
            logger.error(f"PayU hash verification failed for txnid={received_txnid}")
            return Response(
                {'error': 'Hash verification failed - possible tampering'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if expected_hash != received_hash:
            logger.error(f"PayU hash mismatch: expected={expected_hash}, received={received_hash}")
            return Response(
                {'error': 'Hash mismatch - invalid payment data'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update payment records based on status
        is_success = received_status.lower() == 'success'
        return self._process_payment(received_txnid, is_success, data)

    def _verify_payu_hash(self, data):
        """
        Verify PayU SHA-512 hash.

        Hash format for success:
        key|txnid|amount|productinfo|firstname|email|||||||||||salt

        For failure (if provided):
        key|txnid|amount|productinfo|firstname|email|||||||||||salt (same format)
        """
        try:
            key = settings.PAYU_KEY
            salt = settings.PAYU_SALT

            # Build verification string
            hash_string = (
                f"{key}|{data.get('txnid','')}|{data.get('amount','')}|"
                f"{data.get('productinfo','')}|{data.get('firstname','')}|{data.get('email','')}"
                f"|||||||||||{salt}"
            )

            expected_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest().lower()
            return expected_hash
        except Exception as e:
            logger.error(f"PayU hash verification error: {e}")
            return None

    def _process_payment(self, payu_order_id, is_success, payu_data):
        """
        Update EbookPurchase, Order, or CartCheckoutSession based on PayU confirmation.
        """
        try:
            # Extract PayU payment ID
            payu_payment_id = payu_data.get('mihpayid', '')

            if is_success:
                # 1. EbookPurchase
                try:
                    purchase = EbookPurchase.objects.get(
                        user__email=payu_data.get('email', ''),
                        payu_order_id=payu_order_id,
                        payment_status='initiated'
                    )
                    with transaction.atomic():
                        purchase.payment_status = 'completed'
                        purchase.payu_payment_id = payu_payment_id
                        purchase.transaction_id = payu_payment_id
                        purchase.save(update_fields=['payment_status', 'payu_payment_id', 'transaction_id'])

                        # Add to user library
                        UserLibrary.objects.get_or_create(
                            user=purchase.user, book=purchase.book, defaults={'order': None}
                        )

                        _send_admin_email_for_purchase(purchase)
                        _send_customer_email(
                            customer_email=purchase.email,
                            customer_name=purchase.user_name,
                            book_titles=purchase.book.title,
                            order_type='ebook',
                            amount=float(purchase.price),
                            order_id=str(purchase.id),
                        )

                    logger.info(f"PayU e-book purchase completed: purchase_id={purchase.id}")
                    return Response({
                        'status': 'success',
                        'paid': True,
                        'type': 'ebook',
                        'purchase_id': str(purchase.id),
                        'book_title': purchase.book.title,
                    })
                except EbookPurchase.DoesNotExist:
                    pass

                # 2. Order (from CreateOrderView)
                try:
                    order = Order.objects.get(
                        payu_order_id=payu_order_id,
                        payment_status='pending'
                    )
                    with transaction.atomic():
                        Payment.objects.create(
                            order=order,
                            payu_order_id=payu_order_id,
                            payu_payment_id=payu_payment_id,
                            amount=order.total_price,
                            status='completed',
                            payment_method='payu',
                            transaction_id=payu_payment_id,
                        )
                        order.payment_status = 'paid'
                        order.status = 'completed'
                        order.payu_payment_id = payu_payment_id
                        order.transaction_id = payu_payment_id
                        order.save(update_fields=['payment_status', 'status', 'payu_payment_id', 'transaction_id'])

                        # Grant ebook access if applicable
                        if order.order_type == 'ebook':
                            UserLibrary.objects.get_or_create(
                                user=order.user, book=order.book, defaults={'order': order}
                            )

                        _send_customer_email(
                            customer_email=order.email or order.user.email,
                            customer_name=order.full_name or order.user.email,
                            book_titles=order.book.title,
                            order_type=order.order_type,
                            amount=float(order.total_price),
                            order_id=str(order.id),
                            estimated_delivery=(
                                order.estimated_delivery_date.strftime('%d %b %Y')
                                if order.estimated_delivery_date else None
                            ),
                        )

                    logger.info(f"PayU order completed: order_id={order.id}")
                    return Response({
                        'status': 'success',
                        'paid': True,
                        'type': order.order_type,
                        'order_id': str(order.id),
                        'book_title': order.book.title,
                    })
                except Order.DoesNotExist:
                    pass

                # 3. CartCheckoutSession
                try:
                    cart_session = CartCheckoutSession.objects.get(
                        payu_order_id=payu_order_id,
                        status='pending'
                    )
                    self._complete_cart(request, cart_session, payu_order_id, payu_data)
                    return Response({
                        'status': 'success',
                        'paid': True,
                        'type': 'cart',
                    })
                except CartCheckoutSession.DoesNotExist:
                    pass

                # No matching order found
                logger.error(f"PayU: No matching order found for payu_order_id={payu_order_id}")
                return Response(
                    {'error': 'Order not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            else:  # Payment failed
                with transaction.atomic():
                    EbookPurchase.objects.filter(
                        payu_order_id=payu_order_id,
                        payment_status='initiated'
                    ).update(payment_status='failed')
                    Order.objects.filter(
                        payu_order_id=payu_order_id,
                        payment_status='pending'
                    ).update(payment_status='failed', status='cancelled')
                    CartCheckoutSession.objects.filter(
                        payu_order_id=payu_order_id,
                        status='pending'
                    ).update(status='failed')

                logger.info(f"PayU payment failed for order_id={payu_order_id}")
                return Response({
                    'status': 'failure',
                    'paid': False,
                })

        except Exception as e:
            logger.error(f"PayU payment processing error: {e}", exc_info=True)
            return Response(
                {'error': 'Payment processing failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _complete_cart(self, request, cart_session, payu_order_id, payu_data):
        """Create Order records from cart session after successful payment."""
        from apps.books.models import Book

        items = cart_session.items
        total_amount = cart_session.total_amount

        physical_total = sum(
            float(i.get('price', 0)) * int(i.get('qty', 1))
            for i in items if i.get('book_type', 'physical') != 'ebook'
        )
        total_delivery = calculate_delivery_charge(physical_total)
        delivery_assigned = False
        book_titles = []

        with transaction.atomic():
            for item in items:
                try:
                    book = Book.objects.get(id=item['book_id'])
                    item_delivery = 0
                    if item.get('book_type', 'physical') != 'ebook' and not delivery_assigned:
                        item_delivery = total_delivery
                        delivery_assigned = True
                    item_total = float(item.get('price', 0)) * int(item.get('qty', 1)) + item_delivery

                    order = Order.objects.create(
                        user=request.user, book=book,
                        order_type=item.get('book_type', 'physical'),
                        quantity=item.get('qty', 1),
                        book_price=item.get('price', 0),
                        delivery_charge=item_delivery,
                        total_price=item_total,
                        status='completed',
                        delivery_status='pending',
                        payment_status='paid',
                        payu_order_id=payu_order_id,
                        payu_payment_id=payu_data.get('mihpayid', ''),
                        transaction_id=payu_data.get('mihpayid', ''),
                        full_name=request.user.get_full_name() or '',
                        email=request.user.email,
                    )
                    Payment.objects.create(
                        order=order,
                        payu_order_id=payu_order_id,
                        payu_payment_id=payu_data.get('mihpayid', ''),
                        amount=item_total,
                        status='completed',
                        payment_method='payu',
                        transaction_id=payu_data.get('mihpayid', ''),
                    )
                    if order.order_type == 'ebook':
                        UserLibrary.objects.get_or_create(
                            user=request.user, book=book, defaults={'order': order}
                        )
                    book_titles.append(book.title)
                except Book.DoesNotExist:
                    continue

            cart_session.status = 'completed'
            cart_session.save(update_fields=['status'])

        # Send confirmation email
        _send_customer_email(
            customer_email=request.user.email,
            customer_name=request.user.get_full_name() or request.user.email,
            book_titles=book_titles,
            order_type='physical',
            amount=float(total_amount),
            order_id=payu_order_id,
        )

        logger.info(f"PayU cart order completed: cart_id={cart_session.id}, orders={len(book_titles)}")


class CalculateDeliveryView(APIView):
    """Public endpoint — calculate delivery charge."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        items_total = float(request.data.get('items_total', 0) or 0)
        delivery_charge = calculate_delivery_charge(items_total)
        return Response({
            'items_total': round(items_total, 2),
            'delivery_charge': delivery_charge,
            'final_total': round(items_total + delivery_charge, 2),
        })

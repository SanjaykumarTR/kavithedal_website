"""
URL Configuration for Orders App — PayU payment integration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, PaymentViewSet, UserLibraryViewSet,
    CreateOrderView, EbookPurchaseView, CartCheckoutView,
    PayuVerifyPaymentView, DeliveryZoneViewSet, CalculateDeliveryView,
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'library', UserLibraryViewSet, basename='library')
router.register(r'delivery-zones', DeliveryZoneViewSet, basename='delivery-zone')

urlpatterns = [
    # Delivery zone actions
    path('delivery-zones/calculate/', DeliveryZoneViewSet.as_view({'post': 'calculate_delivery'}), name='calculate-delivery'),
    path('delivery-zones/check/', DeliveryZoneViewSet.as_view({'get': 'by_pincode'}), name='by-pincode'),

    # Router-generated URLs
    path('', include(router.urls)),

    # Single-book purchase (physical or ebook)
    path('create-order/', CreateOrderView.as_view(), name='create-order'),

    # Dedicated eBook checkout
    path('ebook-purchase/', EbookPurchaseView.as_view(), name='ebook-purchase'),

    # Cart checkout (multi-item)
    path('cart-checkout/', CartCheckoutView.as_view(), name='cart-checkout'),

    # PayU payment verification (called from frontend after PayU redirect)
    path('verify-payu-payment/', PayuVerifyPaymentView.as_view(), name='verify-payu-payment'),

    # Delivery charge calculator
    path('calculate-delivery/', CalculateDeliveryView.as_view(), name='calculate-delivery-total'),
]

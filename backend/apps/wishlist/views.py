from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.books.models import Book
from .models import Wishlist
from .serializers import WishlistSerializer


class WishlistView(APIView):
    """
    GET  /api/wishlist/        — list the current user's wishlist
    POST /api/wishlist/        — add a book (body: { "book_id": "<uuid>" })
    DELETE /api/wishlist/      — remove a book (body: { "book_id": "<uuid>" })
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related(
            'book', 'book__author'
        )
        serializer = WishlistSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        book_id = request.data.get('book_id')
        if not book_id:
            return Response(
                {'error': 'book_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            book = Book.objects.get(id=book_id, is_active=True)
        except Book.DoesNotExist:
            return Response(
                {'error': 'Book not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        item, created = Wishlist.objects.get_or_create(user=request.user, book=book)
        serializer = WishlistSerializer(item, context={'request': request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        book_id = request.data.get('book_id')
        if not book_id:
            return Response(
                {'error': 'book_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = Wishlist.objects.filter(
            user=request.user, book_id=book_id
        ).delete()

        if deleted:
            return Response({'message': 'Removed from wishlist'})
        return Response(
            {'error': 'Item not in wishlist'},
            status=status.HTTP_404_NOT_FOUND,
        )

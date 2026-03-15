from rest_framework import serializers
from .models import Wishlist
from apps.books.serializers import BookSerializer


class WishlistSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'book', 'created_at']
        read_only_fields = ['id', 'created_at']

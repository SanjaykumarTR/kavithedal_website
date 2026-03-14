"""
Serializers for Authors App.
"""
from django.conf import settings
from rest_framework import serializers
from .models import Author


def _photo_url(field_file, request=None):
    """Return an absolute URL for the author photo, repairing malformed Cloudinary URLs."""
    from apps.books.serializers import _cloudinary_url
    if not field_file:
        return None

    stored_name = None
    try:
        stored_name = field_file.name
    except Exception:
        pass

    if stored_name:
        fixed = _cloudinary_url(stored_name, resource_type='image')
        if fixed:
            return fixed

    try:
        url = field_file.url
    except Exception:
        url = None

    if url and (url.startswith('http://') or url.startswith('https://')):
        return url

    if url and request is not None:
        return request.build_absolute_uri(url)
    return url


class AuthorSerializer(serializers.ModelSerializer):
    """
    Serializer for Author model.
    """
    books_count = serializers.ReadOnlyField()
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = [
            'id', 'name', 'biography', 'photo', 'email', 'mobile_number',
            'social_links', 'books_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'books_count', 'created_at', 'updated_at']

    def get_photo(self, obj):
        return _photo_url(obj.photo, self.context.get('request'))


class AuthorListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for Author list view.
    """
    books_count = serializers.ReadOnlyField()
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ['id', 'name', 'photo', 'biography', 'email', 'mobile_number', 'books_count']

    def get_photo(self, obj):
        return _photo_url(obj.photo, self.context.get('request'))

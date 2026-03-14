"""
Serializers for Authors App.
"""
from django.conf import settings
from rest_framework import serializers
from .models import Author


def _photo_url(field_file, request=None):
    """Return an absolute URL for the author photo regardless of storage backend."""
    if not field_file:
        return None

    # If the stored name is already an absolute URL
    try:
        stored_name = field_file.name
        if stored_name and isinstance(stored_name, str):
            if stored_name.startswith('http://') or stored_name.startswith('https://'):
                return stored_name
    except Exception:
        stored_name = None

    try:
        url = field_file.url
    except Exception:
        url = None

    if url and (url.startswith("http://") or url.startswith("https://")):
        return url

    # Cloudinary fallback
    cloud = getattr(settings, 'CLOUDINARY_STORAGE', {}).get('CLOUD_NAME', '')
    if cloud and stored_name:
        clean = str(stored_name).lstrip('/')
        if clean.startswith('media/'):
            clean = clean[6:]
        if not clean.startswith('http'):
            return f'https://res.cloudinary.com/{cloud}/image/upload/{clean}'

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

"""
Custom Cloudinary storage classes for Kavithedal Publications.

The default MediaCloudinaryStorage uses RESOURCE_TYPE = 'raw', which uploads
images as raw files. While Cloudinary serves raw files with the correct MIME
type, using RESOURCE_TYPE = 'image' guarantees proper CDN delivery, image
transformations, and browser rendering for book covers and author photos.
"""
try:
    from cloudinary_storage.storage import MediaCloudinaryStorage

    class ImageCloudinaryStorage(MediaCloudinaryStorage):
        """Storage for image fields — uploads as Cloudinary 'image' type."""
        RESOURCE_TYPE = 'image'

except (ImportError, Exception):
    # cloudinary_storage not installed or not configured (local dev).
    # Fall back to the default storage so imports never break.
    from django.core.files.storage import FileSystemStorage as ImageCloudinaryStorage  # noqa: F401

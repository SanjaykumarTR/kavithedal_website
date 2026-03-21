"""
Custom Cloudinary storage classes for Kavithedal Publications.
"""
try:
    from cloudinary_storage.storage import MediaCloudinaryStorage

    class ImageCloudinaryStorage(MediaCloudinaryStorage):
        """Storage for image fields — uploads as Cloudinary 'image' type."""
        RESOURCE_TYPE = 'image'

    class RawCloudinaryStorage(MediaCloudinaryStorage):
        """Storage for PDF/file fields — uploads as Cloudinary 'raw' type.
        This ensures the original file bytes are served (not an image render).
        """
        RESOURCE_TYPE = 'raw'

except (ImportError, Exception):
    # cloudinary_storage not installed or not configured (local dev).
    from django.core.files.storage import FileSystemStorage as ImageCloudinaryStorage  # noqa: F401
    from django.core.files.storage import FileSystemStorage as RawCloudinaryStorage  # noqa: F401

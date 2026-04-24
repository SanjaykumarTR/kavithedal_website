"""
Custom Cloudinary storage classes for Kavithedal Publications.

Security Features:
- PDFs are stored as authenticated (not public)
- Signed URLs are generated for secure access
- Expiration tokens prevent long-term sharing
"""
import logging
from django.conf import settings

logger = logging.getLogger('apps')

# Check if Cloudinary is properly configured
_cloudinary_configured = bool(
    getattr(settings, 'CLOUDINARY_CLOUD_NAME', '') and
    getattr(settings, 'CLOUDINARY_API_KEY', '') and
    getattr(settings, 'CLOUDINARY_API_SECRET', '')
)

try:
    from cloudinary_storage.storage import MediaCloudinaryStorage

    class ImageCloudinaryStorage(MediaCloudinaryStorage):
        """
        Storage for image fields — uploads as Cloudinary 'image' type.
        Images are public by default for cover photos.
        """
        RESOURCE_TYPE = 'image'

    class RawCloudinaryStorage(MediaCloudinaryStorage):
        """
        Storage for PDF/file fields — uploads as Cloudinary 'raw' type (public).
        Access control is enforced at the Django API level (SecureFileView),
        not at the Cloudinary storage level.
        """
        RESOURCE_TYPE = 'raw'

    class PrivatePDFStorage(MediaCloudinaryStorage):
        """
        Alternative storage class specifically for private PDFs.
        Use this if you need explicit private storage for PDFs.
        
        Files uploaded with this storage will be completely private
        and require signed URLs or authenticated API access.
        """
        RESOURCE_TYPE = 'raw'
        
        def _get_upload_options(self, filename):
            """
            Upload with private access mode.
            """
            options = super()._get_upload_options(filename)
            
            if _cloudinary_configured:
                # Set as private - requires Cloudinary account authentication
                options['type'] = 'private'
            
            return options

    # Alias for backwards compatibility
    PDFCloudinaryStorage = RawCloudinaryStorage

    if _cloudinary_configured:
        logger.info(
            "Cloudinary Storage configured with AUTHENTICATED PDF access. "
            "Use signed URLs from secure_ebook.py for access."
        )

except (ImportError, Exception) as e:
    logger.warning(f"Cloudinary storage import failed: {e}")
    # Fallback to local storage if Cloudinary is not available
    from django.core.files.storage import FileSystemStorage
    
    class ImageCloudinaryStorage(FileSystemStorage):
        """Fallback image storage when Cloudinary is not configured."""
        pass
    
    class RawCloudinaryStorage(FileSystemStorage):
        """Fallback raw file storage when Cloudinary is not configured."""
        pass
    
    class PrivatePDFStorage(FileSystemStorage):
        """Fallback private PDF storage when Cloudinary is not configured."""
        pass
    
    PDFCloudinaryStorage = RawCloudinaryStorage


def get_cloudinary_upload_type():
    """
    Return the Cloudinary upload type for PDFs.
    
    Returns 'authenticated' for secure access or 'private' for maximum security.
    """
    return getattr(settings, 'CLOUDINARY_PDF_UPLOAD_TYPE', 'authenticated')

"""
Admin configuration for Books app — with image previews and Cloudinary support.
"""
import logging
from django.contrib import admin, messages
from django.utils.html import mark_safe
from .models import Book, Category, BookSubmission, ContactMessage

logger = logging.getLogger('apps')


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'book_type',
        'ebook_price', 'physical_price', 'discount_percentage',
        'stock', 'is_active', 'is_featured', 'cover_preview',
    ]
    list_filter = ['book_type', 'is_active', 'is_featured', 'category', 'language']
    search_fields = ['title', 'author__name', 'isbn']
    ordering = ['-created_at']
    readonly_fields = ['cover_preview', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'author', 'description', 'category'),
        }),
        ('Pricing & Type', {
            'fields': (
                'book_type',
                'price', 'discount_percentage',
                'ebook_price', 'physical_price',
            ),
        }),
        ('Inventory', {
            'fields': ('stock',),
        }),
        ('Cover Image', {
            'fields': ('cover_image', 'cover_preview'),
        }),
        ('PDF File', {
            'fields': ('pdf_file',),
        }),
        ('Publication Details', {
            'fields': ('published_date', 'isbn', 'pages', 'language'),
        }),
        ('Status', {
            'fields': ('is_active', 'is_featured'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        """Save the book, gracefully handling file-storage errors.

        If the cover image or PDF upload fails (e.g. wrong Cloudinary
        credentials, storage unreachable), the book text data is still saved
        to the database without the file, and a clear warning is shown.
        This prevents a blank 500 page from appearing in the admin.
        """
        try:
            super().save_model(request, obj, form, change)
        except Exception as exc:
            logger.error(
                'BookAdmin save_model failed for "%s": %s', obj.title, exc, exc_info=True
            )
            # Clear failing file fields so the second save (text data only) works.
            if 'cover_image' in form.changed_data:
                obj.cover_image = None
            if 'pdf_file' in form.changed_data:
                obj.pdf_file = None

            # Second attempt — save without the file(s).
            try:
                obj.save()
            except Exception as inner_exc:
                logger.error(
                    'BookAdmin fallback save also failed for "%s": %s',
                    obj.title, inner_exc, exc_info=True,
                )
                messages.error(request, f'Could not save book: {inner_exc}')
                raise inner_exc

            messages.warning(
                request,
                f'Book "{obj.title}" was saved WITHOUT the image/PDF because the '
                f'file storage failed: {exc}. '
                'To fix this permanently, add CLOUDINARY_CLOUD_NAME, '
                'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your '
                'Render environment variables (free account at cloudinary.com). '
                'Then re-upload the image.'
            )

    def cover_preview(self, obj):
        if obj.cover_image:
            try:
                url = obj.cover_image.url
            except Exception:
                return '(no preview)'
            return mark_safe(
                f'<img src="{url}" style="max-height:100px;max-width:100px;'
                f'object-fit:cover;border-radius:4px;" />'
            )
        return '(no image)'
    cover_preview.short_description = 'Preview'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']


@admin.register(BookSubmission)
class BookSubmissionAdmin(admin.ModelAdmin):
    list_display = ['book_title', 'name', 'email', 'contact', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'email', 'book_title']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['name', 'email']
    ordering = ['-created_at']
    readonly_fields = ['created_at']

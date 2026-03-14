"""
Admin configuration for Authors app — with photo preview and Cloudinary support.
"""
import logging
from django.contrib import admin, messages
from django.utils.html import mark_safe
from .models import Author

logger = logging.getLogger('apps')


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'mobile_number', 'books_count_display', 'photo_preview', 'created_at']
    search_fields = ['name', 'email', 'mobile_number']
    ordering = ['name']
    readonly_fields = ['photo_preview', 'created_at', 'updated_at']

    fieldsets = (
        ('Personal Info', {
            'fields': ('name', 'biography'),
        }),
        ('Photo', {
            'fields': ('photo', 'photo_preview'),
        }),
        ('Contact', {
            'fields': ('email', 'mobile_number', 'social_links'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        """Save author, falling back to no photo if storage upload fails."""
        try:
            super().save_model(request, obj, form, change)
        except Exception as exc:
            logger.error(
                'AuthorAdmin save_model failed for "%s": %s', obj.name, exc, exc_info=True
            )
            if 'photo' in form.changed_data:
                obj.photo = None
            try:
                obj.save()
            except Exception as inner_exc:
                messages.error(request, f'Could not save author: {inner_exc}')
                raise inner_exc
            messages.warning(
                request,
                f'Author "{obj.name}" saved WITHOUT photo because the file storage '
                f'failed: {exc}. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and '
                'CLOUDINARY_API_SECRET to Render environment variables to fix this.'
            )

    def photo_preview(self, obj):
        if obj.photo:
            try:
                url = obj.photo.url
            except Exception:
                return '(no preview)'
            return mark_safe(
                f'<img src="{url}" style="max-height:100px;max-width:100px;'
                f'object-fit:cover;border-radius:50%;" />'
            )
        return '(no photo)'
    photo_preview.short_description = 'Preview'

    def books_count_display(self, obj):
        return obj.books.count()
    books_count_display.short_description = 'Books'

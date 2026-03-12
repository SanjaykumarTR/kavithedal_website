"""
Admin configuration for Accounts app — User management for Kavithedal Publications.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import AdminUser, AdminOTP


@admin.register(AdminUser)
class AdminUserAdmin(BaseUserAdmin):
    """Custom admin for AdminUser model with role-based management."""
    
    list_display = ['email', 'username', 'role', 'is_active', 'is_staff', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Login Credentials', {
            'fields': ('username', 'email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone', 'profile_image')
        }),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Timestamps', {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_active', 'is_staff'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    def get_readonly_fields(self, request, obj=None):
        """Make password field readonly for existing users."""
        if obj:
            return ['created_at', 'updated_at', 'last_login']
        return self.readonly_fields


@admin.register(AdminOTP)
class AdminOTPAdmin(admin.ModelAdmin):
    """Admin for managing OTP codes for admin login."""
    
    list_display = ['user', 'otp_code', 'is_used', 'created_at', 'expires_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__email', 'otp_code']
    ordering = ['-created_at']
    readonly_fields = ['id', 'user', 'otp_code', 'created_at', 'expires_at']
    
    def has_add_permission(self, request):
        """OTP codes are created programmatically, not via admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """OTP codes cannot be edited once created."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deleting old OTP records."""
        return True
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import RegistroAuditoria, User


@admin.register(User)
class SmartWashUserAdmin(UserAdmin):
    list_display = ("username", "email", "rol", "is_active", "is_staff")
    list_filter = ("rol", "is_active", "is_staff")
    fieldsets = UserAdmin.fieldsets + (("SmartWash", {"fields": ("rol",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("SmartWash", {"fields": ("rol",)}),)


@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    """Solo lectura: los registros de auditoria no se editan ni se borran."""

    list_display = ("usuario_nombre", "tipo_usuario", "accion", "fecha")
    list_filter = ("tipo_usuario", "accion")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

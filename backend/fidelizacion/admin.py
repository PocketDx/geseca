from django.contrib import admin

from core.admin import AutoriaAdminMixin

from .models import ReglaDescuento


@admin.register(ReglaDescuento)
class ReglaDescuentoAdmin(AutoriaAdminMixin):
    list_display = ("nombre", "tipo", "valor", "clasificacion_cliente", "activa", "vigente_desde")
    list_filter = ("tipo", "activa", "clasificacion_cliente")
    search_fields = ("nombre",)

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario interno de SmartWash.

    Se define desde el scaffolding porque cambiar AUTH_USER_MODEL despues de la
    primera migracion es costoso. El rol se persiste ya (T3 / SCRUM-55) pero
    todavia NO se aplica control de acceso: eso corresponde a T8 / SCRUM-57.
    """

    class Rol(models.TextChoices):
        ADMINISTRADOR = "administrador", "Administrador"
        RECEPCIONISTA = "recepcionista", "Recepcionista"
        OPERARIO = "operario", "Operario"

    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.OPERARIO)

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"


class RegistroAuditoria(models.Model):
    """Historial de acciones sobre una cuenta interna.

    Se alimenta por senal (ver accounts/signals.py) a partir de los
    guardados de User, no de las vistas: asi queda completo sin importar
    si el cambio vino de la API, del admin o de un comando de gestion.
    Inmutable a proposito: no hay endpoint ni admin que permita editar o
    borrar un registro, solo crearlo.
    """

    class TipoUsuario(models.TextChoices):
        ADMINISTRADOR = "administrador", "Administrador"
        RECEPCIONISTA = "recepcionista", "Recepcionista"
        OPERARIO = "operario", "Operario"
        CLIENTE = "cliente", "Cliente"

    class Accion(models.TextChoices):
        CREADO = "creado", "Creado"
        EDITADO = "editado", "Editado"
        ACTIVADO = "activado", "Activado"
        DESACTIVADO = "desactivado", "Desactivado"
        INICIO_SESION = "inicio_sesion", "Inicio de sesión"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registros_auditoria",
    )
    usuario_nombre = models.CharField(max_length=150, blank=True)
    tipo_usuario = models.CharField(max_length=20, choices=TipoUsuario.choices)
    accion = models.CharField(max_length=20, choices=Accion.choices)
    detalle = models.CharField(max_length=255, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-fecha",)
        verbose_name = "registro de auditoría"
        verbose_name_plural = "registros de auditoría"

    def __str__(self):
        return f"{self.usuario_nombre or 'anonimo'} · {self.accion} · {self.fecha:%Y-%m-%d %H:%M}"

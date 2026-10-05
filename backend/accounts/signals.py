from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import RegistroAuditoria, User

CAMPOS_AUDITADOS = {
    "username": "usuario",
    "email": "correo",
    "first_name": "nombre",
    "last_name": "apellido",
    "rol": "rol",
    "password": "contraseña",
}


def _solo_ultimo_acceso(update_fields):
    # login() guarda last_login con update_fields; no es una edicion de la cuenta.
    return update_fields is not None and set(update_fields) == {"last_login"}


@receiver(pre_save, sender=User)
def _guardar_estado_previo(sender, instance, update_fields=None, **kwargs):
    instance._estado_previo = (
        User.objects.filter(pk=instance.pk).values("is_active", *CAMPOS_AUDITADOS).first()
        if instance.pk and not _solo_ultimo_acceso(update_fields)
        else None
    )


def _campos_cambiados(instance, previo):
    cambios = []
    for campo, etiqueta in CAMPOS_AUDITADOS.items():
        if previo[campo] == getattr(instance, campo):
            continue
        cambios.append(f"rol: {previo['rol']} → {instance.rol}" if campo == "rol" else etiqueta)
    return cambios


@receiver(post_save, sender=User)
def _registrar_auditoria_usuario(sender, instance, created, update_fields=None, **kwargs):
    if _solo_ultimo_acceso(update_fields):
        return

    previo = instance._estado_previo
    if created:
        accion, partes = RegistroAuditoria.Accion.CREADO, [f"rol: {instance.rol}"]
    elif previo["is_active"] and not instance.is_active:
        accion, partes = RegistroAuditoria.Accion.DESACTIVADO, []
    elif not previo["is_active"] and instance.is_active:
        accion, partes = RegistroAuditoria.Accion.ACTIVADO, []
    else:
        accion, partes = RegistroAuditoria.Accion.EDITADO, _campos_cambiados(instance, previo)

    # Solo las vistas saben quien hace el cambio; el admin y la consola no lo marcan.
    realizado_por = getattr(instance, "_realizado_por", None)
    if realizado_por is not None:
        partes.append(f"por {realizado_por.get_username()}")

    RegistroAuditoria.objects.create(
        usuario=instance,
        usuario_nombre=instance.get_username(),
        tipo_usuario=instance.rol,
        accion=accion,
        detalle=" · ".join(partes)[:255],
    )


@receiver(user_logged_in)
def _registrar_inicio_de_sesion(sender, request, user, **kwargs):
    RegistroAuditoria.objects.create(
        usuario=user,
        usuario_nombre=user.get_username(),
        tipo_usuario=user.rol,
        accion=RegistroAuditoria.Accion.INICIO_SESION,
    )

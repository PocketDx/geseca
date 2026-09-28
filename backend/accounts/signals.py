from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import RegistroAuditoria, User


@receiver(pre_save, sender=User)
def _guardar_estado_previo(sender, instance, **kwargs):
    # No hay forma de saber si un guardado (des)activa la cuenta sin leer
    # el valor anterior de is_active antes de que el UPDATE lo pise.
    instance._is_active_previo = (
        User.objects.filter(pk=instance.pk).values_list("is_active", flat=True).first()
        if instance.pk
        else None
    )


@receiver(post_save, sender=User)
def _registrar_auditoria_usuario(sender, instance, created, **kwargs):
    if created:
        accion = RegistroAuditoria.Accion.CREADO
    else:
        anterior = instance._is_active_previo
        if anterior is True and not instance.is_active:
            accion = RegistroAuditoria.Accion.DESACTIVADO
        elif anterior is False and instance.is_active:
            accion = RegistroAuditoria.Accion.ACTIVADO
        else:
            accion = RegistroAuditoria.Accion.EDITADO

    RegistroAuditoria.objects.create(
        usuario=instance,
        usuario_nombre=instance.get_username(),
        tipo_usuario=instance.rol,
        accion=accion,
    )

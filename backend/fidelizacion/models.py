from django.db import models

from clientes.models import Cliente
from core.models import ModeloConAutoria


class ReglaDescuento(ModeloConAutoria):
    """Regla de descuento configurable (HU08 / SCRUM-74).

    Queda disponible para aplicarse en ordenes futuras; esta historia solo
    cubre su configuracion (crear/editar), no la aplicacion automatica en
    una orden, que es un alcance distinto.
    """

    class Tipo(models.TextChoices):
        PORCENTAJE = "porcentaje", "Porcentaje"
        MONTO_FIJO = "monto_fijo", "Monto fijo"

    nombre = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    clasificacion_cliente = models.CharField(
        max_length=30,
        choices=Cliente.Clasificacion.choices,
        blank=True,
        help_text="Vacio = aplica a cualquier clasificacion de cliente.",
    )
    activa = models.BooleanField(default=True)
    vigente_desde = models.DateField()
    vigente_hasta = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ("-vigente_desde", "nombre")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(valor__gte=0), name="regla_descuento_valor_no_negativo"
            ),
            models.CheckConstraint(
                # La regla de negocio (HU08): un descuento porcentual no
                # puede superar el 100% del valor de la orden. Un monto
                # fijo no tiene ese tope: es una suma, no un porcentaje.
                # (Un literal, no Tipo.PORCENTAJE: el cuerpo de Meta no ve
                # los nombres de la clase que lo contiene.)
                condition=~models.Q(tipo="porcentaje") | models.Q(valor__lte=100),
                name="regla_descuento_porcentaje_no_supera_100",
            ),
            models.CheckConstraint(
                condition=models.Q(vigente_hasta__isnull=True)
                | models.Q(vigente_hasta__gt=models.F("vigente_desde")),
                name="regla_descuento_vigencia_coherente",
            ),
        ]

    def __str__(self):
        return self.nombre

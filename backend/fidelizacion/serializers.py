from rest_framework import serializers

from .models import ReglaDescuento


class ReglaDescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglaDescuento
        fields = (
            "id",
            "nombre",
            "tipo",
            "valor",
            "clasificacion_cliente",
            "activa",
            "vigente_desde",
            "vigente_hasta",
        )

    def validate(self, attrs):
        tipo = attrs.get("tipo", getattr(self.instance, "tipo", None))
        valor = attrs.get("valor", getattr(self.instance, "valor", None))
        if tipo == ReglaDescuento.Tipo.PORCENTAJE and valor is not None and valor > 100:
            raise serializers.ValidationError(
                {"valor": "Un descuento porcentual no puede superar el 100% del valor de la orden."}
            )
        return attrs

    def create(self, validated_data):
        instancia = ReglaDescuento(**validated_data)
        instancia.registrar_autoria(self.context["request"].user)
        instancia.save()
        return instancia

    def update(self, instance, validated_data):
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)
        instance.registrar_autoria(self.context["request"].user)
        instance.save()
        return instance

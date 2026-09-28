from rest_framework import serializers

from .models import RegistroAuditoria, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "rol")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})

class ActuarComoSerializer(serializers.Serializer):
    username = serializers.CharField()


class HistorialAccionSerializer(serializers.ModelSerializer):
    """Historial de un usuario puntual (HU04): /api/usuarios/{id}/historial."""

    class Meta:
        model = RegistroAuditoria
        fields = ("id", "accion", "detalle", "fecha")


class AccionAuditoriaSerializer(serializers.ModelSerializer):
    """Trazabilidad global entre usuarios (HU04): /api/usuarios/trazabilidad."""

    usuario_id = serializers.IntegerField(read_only=True)
    usuario = serializers.CharField(source="usuario_nombre", read_only=True)

    class Meta:
        model = RegistroAuditoria
        fields = ("id", "usuario_id", "usuario", "tipo_usuario", "accion", "detalle", "fecha")
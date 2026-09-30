from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
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


class PasswordResetRequestSerializer(serializers.Serializer):
    # No se valida que la cuenta exista: la respuesta debe ser la misma en
    # ambos casos para no revelar que cuentas estan registradas.
    identificador = serializers.CharField(max_length=254)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    default_error_messages = {"invalid_link": "El enlace de recuperación no es válido o expiró."}

    def validate(self, attrs):
        try:
            pk = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=pk, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            self.fail("invalid_link")

        if not default_token_generator.check_token(user, attrs["token"]):
            self.fail("invalid_link")

        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class UsuarioAdminSerializer(serializers.ModelSerializer):
    """Agrega is_active a UserSerializer, que /auth/me no expone porque no lo necesita."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "rol", "is_active")


class UsuarioInternoSerializer(serializers.ModelSerializer):
    # Obligatoria al crear; opcional al editar (PATCH sin password no la toca).
    password = serializers.CharField(write_only=True, required=False, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "rol", "is_active", "password")
        read_only_fields = ("is_active",)  # se cambia solo via el endpoint de desactivar

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "La contraseña es obligatoria al crear un usuario."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance


class HistorialAccionSerializer(serializers.ModelSerializer):
    """Historial de un usuario puntual: /api/usuarios/{id}/historial."""

    class Meta:
        model = RegistroAuditoria
        fields = ("id", "accion", "detalle", "fecha")


class AccionAuditoriaSerializer(serializers.ModelSerializer):
    """Trazabilidad global entre usuarios: /api/usuarios/trazabilidad."""

    usuario_id = serializers.IntegerField(read_only=True)
    usuario = serializers.CharField(source="usuario_nombre", read_only=True)

    class Meta:
        model = RegistroAuditoria
        fields = ("id", "usuario_id", "usuario", "tipo_usuario", "accion", "detalle", "fecha")

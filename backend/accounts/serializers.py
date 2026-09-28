from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "rol")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})

class ActuarComoSerializer(serializers.Serializer):
    username = serializers.CharField()


class UsuarioAdminSerializer(serializers.ModelSerializer):
    """Usuario interno para la pantalla de administracion (HU03): agrega
    is_active, que UserSerializer no expone porque /auth/me no lo necesita."""

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
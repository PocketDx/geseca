import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema  # <-- Importamos extend_schema

from .models import RegistroAuditoria
from .serializers import (
    AccionAuditoriaSerializer,
    HistorialAccionSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
    UsuarioAdminSerializer,
    UsuarioInternoSerializer,
)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    #! Crea la sesion de Django. El navegador recibe la cookie de sesion.

    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: UserSerializer, 401: dict},
        summary="Iniciar sesión",
    )
    def post(self, request):
        data = LoginSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user = authenticate(request, **data.validated_data)
        if user is None:
            return Response(
                {"detail": "Credenciales invalidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    @extend_schema(
        request=None,
        responses={204: None},
        summary="Cerrar sesión",
    )
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class MeView(APIView):
    """Usuario autenticado. Endpoint privado: responde 403 si no hay sesion.

    Ademas siembra la cookie csrftoken, que el frontend necesita antes del login.
    """

    @extend_schema(
        responses={200: UserSerializer},
        summary="Obtener usuario actual",
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data)


logger = logging.getLogger(__name__)

MENSAJE_RECUPERACION = (
    "Si la cuenta existe, recibiras un correo con los pasos a seguir."
)


@method_decorator(csrf_protect, name="dispatch")
class RecuperarPasswordView(APIView):
    """Envia el enlace de recuperacion al correo de la cuenta.

    Responde siempre lo mismo, exista o no la cuenta, e incluso si el envio
    falla: cualquier diferencia permitiria averiguar que cuentas existen.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "recuperar-password"

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: dict},
        summary="Solicitar recuperación de contraseña",
    )
    def post(self, request):
        data = PasswordResetRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        identificador = data.validated_data["identificador"]

        usuarios = (
            get_user_model()
            .objects.filter(
                Q(username=identificador) | Q(email__iexact=identificador),
                is_active=True,
            )
            .exclude(email="")
        )
        for usuario in usuarios:
            try:
                enviar_correo_recuperacion(usuario)
            except Exception:
                logger.exception(
                    "No se pudo enviar el correo de recuperacion a %s", usuario.pk
                )

        return Response({"detail": MENSAJE_RECUPERACION})


def enviar_correo_recuperacion(usuario):
    uid = urlsafe_base64_encode(force_bytes(usuario.pk))
    token = default_token_generator.make_token(usuario)
    enlace = (
        f"{settings.FRONTEND_URL}/restablecer-password?uid={uid}&token={token}"
    )
    minutos = settings.PASSWORD_RESET_TIMEOUT // 60
    send_mail(
        subject="SmartWash - Recuperar contraseña",
        message=(
            f"Hola {usuario.get_short_name() or usuario.username},\n\n"
            f"Para crear una contraseña nueva entra a este enlace:\n{enlace}\n\n"
            f"El enlace vence en {minutos} minutos y solo se puede usar una vez.\n"
            "Si no lo solicitaste, ignora este correo."
        ),
        from_email=None,
        recipient_list=[usuario.email],
    )


@method_decorator(csrf_protect, name="dispatch")
class ConfirmarRecuperacionPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: dict, 400: dict},
        summary="Confirmar nueva contraseña",
    )
    def post(self, request):
        data = PasswordResetConfirmSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        data.save()
        return Response({"detail": "Contraseña actualizada. Ya puedes iniciar sesión."})


from .serializers import ActuarComoSerializer  # agrega este import junto a los otros de .serializers

# Cuentas fijas que puede tomar el selector de desarrollo. Nunca se acepta un
# username fuera de esta lista, aunque el request lo pida.
USUARIOS_DESARROLLO = ("admin", "recepcion", "operario1", "operario2")


@method_decorator(csrf_protect, name="dispatch")
class ActuarComoView(APIView):
    """Cambia la sesion a una cuenta sembrada, sin pedir contrasena.

    Solo existe con DEBUG=True: en produccion responde 404 en ambos metodos,
    asi que el selector del frontend se oculta solo. Se elimina en T8 (SCRUM-57).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not settings.DEBUG:
            raise Http404
        usuarios = get_user_model().objects.filter(username__in=USUARIOS_DESARROLLO)
        return Response(UserSerializer(usuarios, many=True).data)

    def post(self, request):
        if not settings.DEBUG:
            raise Http404
        data = ActuarComoSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        username = data.validated_data["username"]
        if username not in USUARIOS_DESARROLLO:
            return Response(
                {"detail": "Cuenta no permitida."}, status=status.HTTP_400_BAD_REQUEST
            )
        usuario = get_object_or_404(get_user_model(), username=username)
        login(request, usuario)
        return Response(UserSerializer(usuario).data)


class UsuarioInternoListCreateView(generics.ListCreateAPIView):
    queryset = get_user_model().objects.all().order_by("username")

    def get_serializer_class(self):
        return UsuarioAdminSerializer if self.request.method == "GET" else UsuarioInternoSerializer


class UsuarioInternoDetailView(generics.RetrieveUpdateAPIView):
    """Sin destroy: la baja es "desactivar", no borrar (ver UsuarioDesactivarView)."""

    queryset = get_user_model().objects.all()
    serializer_class = UsuarioInternoSerializer


class UsuarioDesactivarView(APIView):
    def post(self, request, pk):
        usuario = get_object_or_404(get_user_model(), pk=pk)
        usuario.is_active = False
        usuario.save(update_fields=["is_active"])
        return Response(UsuarioAdminSerializer(usuario).data)


class HistorialUsuarioView(generics.ListAPIView):
    serializer_class = HistorialAccionSerializer

    def get_queryset(self):
        return RegistroAuditoria.objects.filter(usuario_id=self.kwargs["pk"])


class TrazabilidadView(generics.ListAPIView):
    serializer_class = AccionAuditoriaSerializer

    def get_queryset(self):
        queryset = RegistroAuditoria.objects.all()
        tipo_usuario = self.request.query_params.get("rol")
        if tipo_usuario:
            queryset = queryset.filter(tipo_usuario=tipo_usuario)
        return queryset

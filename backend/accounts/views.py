from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.http import urlsafe_base64_decode
from django.core.exceptions import ValidationError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    UserSerializer,
    UsuarioAdminSerializer,
    UsuarioInternoSerializer,
)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    """Crea la sesion de Django. El navegador recibe la cookie de sesion.

    APIView es csrf_exempt por defecto y DRF solo exige CSRF a peticiones ya
    autenticadas, por eso el login se protege explicitamente (login CSRF).
    """

    permission_classes = [AllowAny]

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


# * solicitud de contraseña
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = PasswordResetRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        email = data.validated_data["email"]

        usuarios = get_user_model().objects.filter(email__iexact=email, is_active=True)

        for usuario in usuarios:
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))

            token = default_token_generator.make_token(usuario)

            enlace = f"http://localhost:3000/restablecer-password/{uid}/{token}/"

            send_mail(
                subject="Recuperación de contraseña - SmartWash",
                message=(
                    "Has solicitado recuperar tu contraseña.\n\n"
                    f"Ingresa al siguiente enlace:\n{enlace}\n\n"
                    "Si no solicitaste este cambio, ignora este mensaje."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
            )

        return Response(
            {
                "detail": (
                    "Si existe una cuenta asociada a ese correo, "
                    "recibirá un enlace para recuperar su contraseña."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uid, token):
        data = PasswordResetConfirmSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        nueva_password = data.validated_data["new_password"]

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            usuario = get_user_model().objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            return Response(
                {"detail": "Enlace de recuperación inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(usuario, token):
            return Response(
                {"detail": "El enlace de recuperación es inválido o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.set_password(nueva_password)
        usuario.save()

        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class MeView(APIView):
    """Usuario autenticado. Endpoint privado: responde 403 si no hay sesion.

    Ademas siembra la cookie csrftoken, que el frontend necesita antes del login.
    """

    def get(self, request):
        return Response(UserSerializer(request.user).data)


from .serializers import (
    ActuarComoSerializer,
)  # agrega este import junto a los otros de .serializers

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
        return (
            UsuarioAdminSerializer
            if self.request.method == "GET"
            else UsuarioInternoSerializer
        )


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

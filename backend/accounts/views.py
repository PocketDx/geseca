from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema  # <-- Importamos extend_schema

from .serializers import LoginSerializer, UserSerializer


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

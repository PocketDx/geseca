from django.urls import path

from .views import (
    ActuarComoView,
    ConfirmarRecuperacionPasswordView,
    HistorialUsuarioView,
    LoginView,
    LogoutView,
    MeView,
    RecuperarPasswordView,
    TrazabilidadView,
    UsuarioActivarView,
    UsuarioDesactivarView,
    UsuarioInternoDetailView,
    UsuarioInternoListCreateView,
)

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/recuperar-password", RecuperarPasswordView.as_view(), name="recuperar-password"),
    path(
        "auth/confirmar-recuperacion",
        ConfirmarRecuperacionPasswordView.as_view(),
        name="confirmar-recuperacion",
    ),
    path("auth/actuar-como", ActuarComoView.as_view(), name="actuar-como"),
    path("usuarios", UsuarioInternoListCreateView.as_view(), name="usuarios"),
    path("usuarios/trazabilidad", TrazabilidadView.as_view(), name="usuarios-trazabilidad"),
    path("usuarios/<int:pk>", UsuarioInternoDetailView.as_view(), name="usuario-detalle"),
    path("usuarios/<int:pk>/historial", HistorialUsuarioView.as_view(), name="usuario-historial"),
    path("usuarios/<int:pk>/desactivar", UsuarioDesactivarView.as_view(), name="usuario-desactivar"),
    path("usuarios/<int:pk>/activar", UsuarioActivarView.as_view(), name="usuario-activar"),
]

from django.urls import path

from .views import (
    ActuarComoView,
    LoginView,
    LogoutView,
    MeView,
    UsuarioDesactivarView,
    UsuarioInternoDetailView,
    UsuarioInternoListCreateView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/actuar-como", ActuarComoView.as_view(), name="actuar-como"),
    path("usuarios", UsuarioInternoListCreateView.as_view(), name="usuarios"),
    path(
        "usuarios/<int:pk>", UsuarioInternoDetailView.as_view(), name="usuario-detalle"
    ),
    path(
        "usuarios/<int:pk>/desactivar",
        UsuarioDesactivarView.as_view(),
        name="usuario-desactivar",
    ),
    path(
        "auth/password-reset", PasswordResetRequestView.as_view(), name="password-reset"
    ),
    path(
        "auth/password-reset/<uid>/<token>",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]

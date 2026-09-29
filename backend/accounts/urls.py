from django.urls import path

from .views import (
    ActuarComoView,
    HistorialUsuarioView,
    LoginView,
    LogoutView,
    MeView,
    TrazabilidadView,
)

urlpatterns = [
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/actuar-como", ActuarComoView.as_view(), name="actuar-como"),
    path("usuarios/trazabilidad", TrazabilidadView.as_view(), name="usuarios-trazabilidad"),
    path("usuarios/<int:pk>/historial", HistorialUsuarioView.as_view(), name="usuario-historial"),
]

from django.urls import path

from .views import ReglaDescuentoDetailView, ReglaDescuentoListCreateView

urlpatterns = [
    path("reglas-descuento", ReglaDescuentoListCreateView.as_view(), name="reglas-descuento"),
    path(
        "reglas-descuento/<int:pk>",
        ReglaDescuentoDetailView.as_view(),
        name="regla-descuento-detalle",
    ),
]

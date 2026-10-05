from django.urls import path

from .views import ClienteDetailView, ClienteListCreateView

urlpatterns = [
    path("clientes", ClienteListCreateView.as_view(), name="clientes"),
    path("clientes/<int:pk>", ClienteDetailView.as_view(), name="cliente-detalle"),
]

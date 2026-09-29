from rest_framework import generics

from .models import ReglaDescuento
from .serializers import ReglaDescuentoSerializer


class ReglaDescuentoListCreateView(generics.ListCreateAPIView):
    queryset = ReglaDescuento.objects.all()
    serializer_class = ReglaDescuentoSerializer


class ReglaDescuentoDetailView(generics.RetrieveUpdateAPIView):
    queryset = ReglaDescuento.objects.all()
    serializer_class = ReglaDescuentoSerializer

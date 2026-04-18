from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer
from usuarios.permissions import EsEmpleadoOAdmin

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [EsEmpleadoOAdmin()]
        return [permissions.IsAuthenticated()]

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'stock_bajo']:
            return [EsEmpleadoOAdmin()]
        return [permissions.IsAuthenticated()]

    # Endpoint extra: productos con stock bajo
    @action(detail=False, methods=['get'], url_path='stock-bajo')
    def stock_bajo(self, request):
        productos = Producto.objects.filter(stock_actual__lte=F('stock_minimo'), estado=True)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
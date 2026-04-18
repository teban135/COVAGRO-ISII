from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MovimientoInventario
from .serializers import MovimientoInventarioSerializer
from usuarios.permissions import EsEmpleadoOAdmin

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.select_related('producto').all().order_by('-fecha')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [EsEmpleadoOAdmin]
    http_method_names = ['get', 'post']  # Solo lectura y entradas manuales, sin editar ni borrar

    # Endpoint extra: movimientos por producto
    @action(detail=False, methods=['get'], url_path='por-producto/(?P<producto_id>[^/.]+)')
    def por_producto(self, request, producto_id=None):
        movimientos = MovimientoInventario.objects.filter(producto=producto_id)
        serializer = self.get_serializer(movimientos, many=True)
        return Response(serializer.data)
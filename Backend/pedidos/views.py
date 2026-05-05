from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import EstadoPedido, Pedido, DetallePedido, HistorialEstado, Notificacion
from .serializers import (
    EstadoPedidoSerializer, PedidoSerializer, DetallePedidoSerializer,
    HistorialEstadoSerializer, NotificacionSerializer
)
from productos.models import Producto
from inventario.models import MovimientoInventario
from usuarios.permissions import EsEmpleadoOAdmin

class EstadoPedidoViewSet(viewsets.ModelViewSet):
    queryset = EstadoPedido.objects.all()
    serializer_class = EstadoPedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [EsEmpleadoOAdmin]

    def get_queryset(self):
        return Notificacion.objects.all().order_by('-fecha')

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        notif.leida = True
        notif.save()
        return Response({'status': 'notificación leída'})

    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        Notificacion.objects.filter(leida=False).update(leida=True)
        return Response({'status': 'todas las notificaciones marcadas como leídas'})

class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Pedido.objects.select_related('id_cliente', 'id_empleado', 'id_estado').prefetch_related('detalles').all()
        if hasattr(user, 'es_cliente') and user.es_cliente:
            return queryset.filter(id_cliente=user)
        return queryset

    # Endpoint extra: inactivar pedido
    @action(detail=True, methods=['patch'], url_path='inactivar')
    def inactivar(self, request, pk=None):
        pedido = self.get_object()
        estado_inactivo = EstadoPedido.objects.filter(nombre='INACTIVO').first()
        if not estado_inactivo:
            return Response({'error': 'Estado INACTIVO no existe'}, status=400)
        pedido.id_estado = estado_inactivo
        pedido.save()
        return Response({'mensaje': 'Pedido inactivado correctamente'})

    # Endpoint extra: pedidos por cliente
    @action(detail=False, methods=['get'], url_path='por-cliente/(?P<cliente_id>[^/.]+)')
    def por_cliente(self, request, cliente_id=None):
        # Si es cliente, solo puede ver el suyo
        if request.user.es_cliente and str(request.user.id) != str(cliente_id):
            return Response({'error': 'No tiene permiso para ver pedidos de otro usuario'}, status=403)
            
        pedidos = Pedido.objects.filter(id_cliente=cliente_id)
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='reporte-consolidado', permission_classes=[EsEmpleadoOAdmin])
    def reporte_consolidado(self, request):
        periodo = request.query_params.get('periodo', 'diario')
        hoy = timezone.now()
        
        if periodo == 'diario':
            inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
            fin = inicio + timedelta(days=1)
        else:
            inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if inicio.month == 12:
                fin = inicio.replace(year=inicio.year + 1, month=1)
            else:
                fin = inicio.replace(month=inicio.month + 1)
        
        pedidos_periodo = Pedido.objects.filter(
            fecha__range=(inicio, fin),
            id_estado__nombre='ENTREGADO'
        )
        
        ventas_totales = pedidos_periodo.aggregate(total=Sum('total'))['total'] or 0
        cantidad_pedidos = pedidos_periodo.count()
        
        # Agregación por categoría
        por_categoria = DetallePedido.objects.filter(
            id_pedido__in=pedidos_periodo
        ).values(
            nombre=F('id_producto__id_categoria__nombre')
        ).annotate(
            valor=Sum('subtotal')
        ).order_by('-valor')
        
        # Agregación por producto
        por_producto = DetallePedido.objects.filter(
            id_pedido__in=pedidos_periodo
        ).values(
            nombre=F('id_producto__nombre')
        ).annotate(
            valor=Sum('subtotal')
        ).order_by('-valor')
        
        return Response({
            'periodo': periodo,
            'inicio': inicio,
            'fin': fin,
            'ventas_totales': ventas_totales,
            'cantidad_pedidos': cantidad_pedidos,
            'por_categoria': list(por_categoria),
            'por_producto': list(por_producto)
        })

    # Crear pedido con detalles y descuento de stock en una sola transacción
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy() # Hacer copia para modificar
        detalles_data = data.pop('detalles', [])

        # Si el usuario es cliente, forzar que el pedido sea para él mismo
        if request.user.es_cliente:
            data['id_cliente'] = request.user.id
            # Si no se envía estado, poner el inicial (PENDIENTE usualmente id=1 o por nombre)
            if 'id_estado' not in data:
                estado_inicial = EstadoPedido.objects.filter(nombre='PENDIENTE').first()
                if estado_inicial:
                    data['id_estado'] = estado_inicial.id

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        pedido = serializer.save()

        total = 0
        try:
            for detalle in detalles_data:
                producto = Producto.objects.select_for_update().get(pk=detalle['id_producto'])
                cantidad = int(detalle['cantidad'])

                if producto.stock_actual < cantidad:
                    # Forzamos rollback levantando una excepción controlada
                    raise ValueError(f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock_actual}')

                precio_un = float(detalle['precio_unitario'])
                subtotal = cantidad * precio_un
                
                DetallePedido.objects.create(
                    id_pedido=pedido,
                    id_producto=producto,
                    cantidad=cantidad,
                    precio_unitario=precio_un,
                    subtotal=subtotal
                )

                # Descontar stock y registrar movimiento
                producto.stock_actual -= cantidad
                producto.save()

                MovimientoInventario.objects.create(
                    producto=producto,
                    tipo='salida',
                    cantidad=cantidad,
                    referencia=f'Pedido #{pedido.id}'
                )

                total += subtotal

            pedido.total = total
            pedido.save()

            # Crear notificación para el admin
            try:
                Notificacion.objects.create(
                    tipo='NUEVO_PEDIDO',
                    mensaje=f"Nuevo pedido #{pedido.id} de {pedido.id_cliente.nombre if pedido.id_cliente else 'Cliente desconocido'}",
                    id_pedido=pedido
                )
            except Exception as e:
                print(f"Error creando notificación: {e}")

        except ValueError as e:
            # Error de negocio (stock)
            transaction.set_rollback(True)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Otro error inesperado
            transaction.set_rollback(True)
            return Response({'error': f'Error procesando el pedido: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(self.get_serializer(pedido).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_instance = serializer.save()
        
        # Si el estado cambió, registrar en historial y notificar
        if old_instance.id_estado != new_instance.id_estado:
            HistorialEstado.objects.create(
                id_pedido=new_instance,
                id_estado=new_instance.id_estado,
                id_usuario=self.request.user
            )
            Notificacion.objects.create(
                tipo='CAMBIO_ESTADO',
                mensaje=f"El pedido #{new_instance.id} cambió a {new_instance.id_estado.nombre}",
                id_pedido=new_instance
            )

class DetallePedidoViewSet(viewsets.ModelViewSet):
    queryset = DetallePedido.objects.all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [permissions.IsAuthenticated]
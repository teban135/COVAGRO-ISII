from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
import json
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

    from django.utils.decorators import method_decorator
    from django.views.decorators.cache import cache_page
    
    @method_decorator(cache_page(60 * 5))
    @action(detail=False, methods=['get'], url_path='reporte-consolidado', permission_classes=[EsEmpleadoOAdmin])
    def reporte_consolidado(self, request):
        from django.core.paginator import Paginator
        
        periodo = request.query_params.get('periodo', 'diario')
        hoy = timezone.now()
        
        inicio = None
        fin = None
        todos_pedidos_periodo = Pedido.objects.all()
        
        if periodo == 'diario':
            inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
            fin = inicio + timedelta(days=1)
            todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__range=(inicio, fin))
        elif periodo == 'mensual':
            inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if inicio.month == 12:
                fin = inicio.replace(year=inicio.year + 1, month=1)
            else:
                fin = inicio.replace(month=inicio.month + 1)
            todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__range=(inicio, fin))
        elif periodo == 'dia':
            fecha_str = request.query_params.get('fecha')
            if fecha_str:
                try:
                    fecha = timezone.datetime.strptime(fecha_str, '%Y-%m-%d').date()
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__date=fecha)
                except ValueError:
                    pass
        elif periodo == 'mes':
            mes_str = request.query_params.get('mes_anio')
            if mes_str:
                try:
                    year, month = map(int, mes_str.split('-'))
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__year=year, fecha__month=month)
                except ValueError:
                    pass
        elif periodo == 'anio':
            anio_str = request.query_params.get('anio')
            if anio_str:
                try:
                    year = int(anio_str)
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__year=year)
                except ValueError:
                    pass
        elif periodo == 'rango':
            fecha_inicio_str = request.query_params.get('fecha_inicio')
            fecha_fin_str = request.query_params.get('fecha_fin')
            if fecha_inicio_str and fecha_fin_str:
                try:
                    fecha_inicio = timezone.datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
                    fecha_fin = timezone.datetime.strptime(fecha_fin_str, '%Y-%m-%d')
                    fecha_inicio = timezone.make_aware(fecha_inicio) if timezone.is_naive(fecha_inicio) else fecha_inicio
                    fecha_fin = timezone.make_aware(fecha_fin) if timezone.is_naive(fecha_fin) else fecha_fin
                    fecha_fin = fecha_fin + timedelta(days=1)
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__range=(fecha_inicio, fecha_fin))
                except ValueError:
                    pass


        # Para las métricas solo usamos ENTREGADO
        pedidos_entregados = todos_pedidos_periodo.filter(id_estado__nombre='ENTREGADO')

        ventas_totales = pedidos_entregados.aggregate(total=Sum('total'))['total'] or 0
        cantidad_pedidos = pedidos_entregados.count()
        
        # Agregación por categoría (solo de entregados)
        por_categoria = DetallePedido.objects.filter(
            id_pedido__in=pedidos_entregados
        ).values(
            nombre=F('id_producto__id_categoria__nombre')
        ).annotate(
            valor=Sum('subtotal')
        ).order_by('-valor')
        
        # Agregación por producto (solo de entregados)
        por_producto = DetallePedido.objects.filter(
            id_pedido__in=pedidos_entregados
        ).values(
            nombre=F('id_producto__nombre')
        ).annotate(
            valor=Sum('subtotal')
        ).order_by('-valor')
        
        # Paginate results - MOSTRAR TODOS LOS PEDIDOS (sin filtro de estado)
        page_number = request.query_params.get('page', 1)
        paginator = Paginator(todos_pedidos_periodo.order_by('-fecha'), 10)
        page_obj = paginator.get_page(page_number)
        pedidos_serializados = self.get_serializer(page_obj.object_list, many=True).data
        
        
        
        # Incluir pedidos importados si los hay
        imported_orders = request.session.get('imported_orders', {}).get('orders', [])
        
        return Response({
            'periodo': periodo,
            'inicio': inicio,
            'fin': fin,
            'ventas_totales': ventas_totales,
            'cantidad_pedidos': cantidad_pedidos,
            'por_categoria': list(por_categoria),
            'por_producto': list(por_producto),
            'pedidos_paginados': pedidos_serializados,
            'pedidos_importados': imported_orders,
            'tiene_importados': len(imported_orders) > 0,
            'paginacion': {
                'total_pages': paginator.num_pages,
                'current_page': page_obj.number,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'total_items': paginator.count
            }
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

    # ==================== EXPORTACIÓN E IMPORTACIÓN DE PEDIDOS ====================

    @action(detail=False, methods=['post'], url_path='export-pedidos')
    def export_pedidos(self, request):
        """
        Exporta los pedidos del reporte consolidado como JSON descargable.
        Acepta los mismos parámetros de filtro que reporte-consolidado.
        """
        periodo = request.query_params.get('periodo', 'diario')
        hoy = timezone.now()
        
        todos_pedidos_periodo = Pedido.objects.all()
        
        if periodo == 'diario':
            inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
            fin = inicio + timedelta(days=1)
            todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__range=(inicio, fin))
        elif periodo == 'dia':
            fecha_str = request.query_params.get('fecha')
            if fecha_str:
                try:
                    fecha = timezone.datetime.strptime(fecha_str, '%Y-%m-%d').date()
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__date=fecha)
                except ValueError:
                    pass
        elif periodo == 'mes':
            mes_str = request.query_params.get('mes_anio')
            if mes_str:
                try:
                    year, month = map(int, mes_str.split('-'))
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__year=year, fecha__month=month)
                except ValueError:
                    pass
        elif periodo == 'anio':
            anio_str = request.query_params.get('anio')
            if anio_str:
                try:
                    year = int(anio_str)
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__year=year)
                except ValueError:
                    pass
        elif periodo == 'rango':
            fecha_inicio_str = request.query_params.get('fecha_inicio')
            fecha_fin_str = request.query_params.get('fecha_fin')
            if fecha_inicio_str and fecha_fin_str:
                try:
                    fecha_inicio = timezone.datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
                    fecha_fin = timezone.datetime.strptime(fecha_fin_str, '%Y-%m-%d')
                    fecha_inicio = timezone.make_aware(fecha_inicio) if timezone.is_naive(fecha_inicio) else fecha_inicio
                    fecha_fin = timezone.make_aware(fecha_fin) if timezone.is_naive(fecha_fin) else fecha_fin
                    fecha_fin = fecha_fin + timedelta(days=1)
                    todos_pedidos_periodo = todos_pedidos_periodo.filter(fecha__range=(fecha_inicio, fecha_fin))
                except ValueError:
                    pass

        # Serializar pedidos
        pedidos_data = self.get_serializer(todos_pedidos_periodo, many=True).data
        
        # Construir JSON de exportación
        export_data = {
            "exported_at": timezone.now().isoformat(),
            "source": getattr(request.user, 'nombre', 'Sistema'),
            "user_id": request.user.id,
            "periodo": periodo,
            "orders": pedidos_data
        }
        
        # Retornar como archivo descargable
        response = HttpResponse(
            json.dumps(export_data, indent=4, ensure_ascii=False, default=str),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="pedidos_export.json"'
        return response

    @action(detail=False, methods=['post'], url_path='import-pedidos')
    def import_pedidos(self, request):
        """
        Importa pedidos desde un archivo JSON y los almacena en la sesión.
        Los pedidos NO se guardan en la base de datos, solo en la sesión.
        """
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No se proporcionó archivo'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            archivo = request.FILES['file']
            contenido = archivo.read().decode('utf-8')
            datos_importados = json.loads(contenido)
            
            # Validar estructura básica
            if 'orders' not in datos_importados:
                return Response(
                    {'error': 'El JSON no contiene el campo "orders"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Guardar en sesión
            request.session['imported_orders'] = datos_importados
            request.session.modified = True
            
            return Response({
                'status': 'success',
                'message': f'Se importaron {len(datos_importados["orders"])} pedidos correctamente',
                'count': len(datos_importados["orders"]),
                'imported_at': timezone.now().isoformat(),
                'source': datos_importados.get('source', 'Desconocido')
            })
            
        except json.JSONDecodeError:
            return Response(
                {'error': 'El archivo no es un JSON válido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error importando pedidos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='get-imported-pedidos')
    def get_imported_pedidos(self, request):
        """
        Obtiene los pedidos importados desde la sesión actual.
        """
        imported_data = request.session.get('imported_orders', None)
        
        if not imported_data:
            return Response({
                'status': 'success',
                'imported': False,
                'orders': [],
                'count': 0
            })
        
        return Response({
            'status': 'success',
            'imported': True,
            'exported_at': imported_data.get('exported_at'),
            'source': imported_data.get('source', 'Desconocido'),
            'orders': imported_data.get('orders', []),
            'count': len(imported_data.get('orders', []))
        })

    @action(detail=False, methods=['post'], url_path='clear-imported-pedidos')
    def clear_imported_pedidos(self, request):
        """
        Limpia los pedidos importados de la sesión.
        """
        if 'imported_orders' in request.session:
            del request.session['imported_orders']
            request.session.modified = True
        
        return Response({
            'status': 'success',
            'message': 'Pedidos importados eliminados correctamente'
        })

class DetallePedidoViewSet(viewsets.ModelViewSet):
    queryset = DetallePedido.objects.all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [permissions.IsAuthenticated]
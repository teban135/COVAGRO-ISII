from rest_framework import serializers
from .models import EstadoPedido, Pedido, DetallePedido, HistorialEstado, Notificacion

class EstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPedido
        fields = '__all__'

class DetallePedidoSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.ReadOnlyField(source='id_producto.nombre')
    class Meta:
        model = DetallePedido
        fields = '__all__'

class HistorialEstadoSerializer(serializers.ModelSerializer):
    nombre_estado = serializers.ReadOnlyField(source='id_estado.nombre')
    nombre_usuario = serializers.ReadOnlyField(source='id_usuario.nombre')
    class Meta:
        model = HistorialEstado
        fields = '__all__'

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    historial = HistorialEstadoSerializer(many=True, read_only=True)
    nombre_cliente = serializers.ReadOnlyField(source='id_cliente.nombre')
    nombre_estado = serializers.ReadOnlyField(source='id_estado.nombre')

    class Meta:
        model = Pedido
        fields = '__all__'
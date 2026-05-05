from django.db import models
from usuarios.models import Usuario
from productos.models import Producto

class EstadoPedido(models.Model):
    nombre = models.CharField(max_length=30)
    descripcion = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.nombre

class Pedido(models.Model):
    id_cliente = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='pedidos_cliente')
    id_empleado = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='pedidos_empleado', null=True, blank=True)
    id_estado = models.ForeignKey(EstadoPedido, on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    canal = models.CharField(max_length=20, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"Pedido #{self.id} - {self.id_cliente.nombre if self.id_cliente else 'Sin cliente'}"

class DetallePedido(models.Model):
    id_pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

class HistorialEstado(models.Model):
    id_pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='historial')
    id_estado = models.ForeignKey(EstadoPedido, on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, help_text="Usuario que realizó el cambio")

    class Meta:
        verbose_name_plural = "Historial de Estados"

class Notificacion(models.Model):
    TIPOS = [
        ('NUEVO_PEDIDO', 'Nuevo Pedido'),
        ('CAMBIO_ESTADO', 'Cambio de Estado'),
        ('STOCK_BAJO', 'Stock Bajo'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPOS)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)
    id_pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Notificaciones"
        ordering = ['-fecha']
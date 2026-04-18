from django.db import models
from productos.models import Producto

class MovimientoInventario(models.Model):
    TIPOS = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
    ]
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    tipo = models.CharField(max_length=10, choices=TIPOS)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    referencia = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.tipo} - {self.producto} ({self.cantidad})"
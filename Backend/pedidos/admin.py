from django.contrib import admin
from .models import EstadoPedido, Pedido, DetallePedido
admin.site.register(EstadoPedido)
admin.site.register(Pedido)
admin.site.register(DetallePedido)
from rest_framework.routers import DefaultRouter
from .views import EstadoPedidoViewSet, PedidoViewSet, DetallePedidoViewSet

router = DefaultRouter()
router.register(r'estados-pedido', EstadoPedidoViewSet)
router.register(r'pedidos', PedidoViewSet, basename='pedidos')
router.register(r'detalle-pedido', DetallePedidoViewSet)

urlpatterns = router.urls  # ← esta línea es la que expone los patrones
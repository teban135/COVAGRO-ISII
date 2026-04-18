from rest_framework.routers import DefaultRouter
from .views import MovimientoInventarioViewSet

router = DefaultRouter()
router.register(r'movimientos', MovimientoInventarioViewSet)
urlpatterns = router.urls
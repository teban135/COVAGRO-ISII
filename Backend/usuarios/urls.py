from rest_framework.routers import DefaultRouter
from .views import RolViewSet, UsuarioViewSet

router = DefaultRouter()
router.register(r'roles', RolViewSet)
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
urlpatterns = router.urls
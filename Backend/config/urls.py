from django.http import JsonResponse
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from usuarios.views import CustomTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

api_patterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('usuarios/', include('usuarios.urls')),
    path('productos/', include('productos.urls')),
    path('pedidos/', include('pedidos.urls')),
    path('inventario/', include('inventario.urls')),
]

# Vista simple para la raíz
def home(request):
    return JsonResponse({"status": "ok", "message": "Backend Covagro funcionando"})

urlpatterns = [
    path('', home),  # <-- nueva ruta para "/"
    path('admin/', admin.site.urls),
    path('api/', include(api_patterns)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

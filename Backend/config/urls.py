from django.http import JsonResponse
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from usuarios.views import CustomTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

# API principal
api_patterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Alias frontend esperados
    path('', include('productos.urls')),
    path('', include('pedidos.urls')),
    path('', include('usuarios.urls')),
    path('inventario/', include('inventario.urls')),
]

# Home
def home(request):
    return JsonResponse({
        "status": "ok",
        "message": "Backend Covagro funcionando"
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include(api_patterns)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

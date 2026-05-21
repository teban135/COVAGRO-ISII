from rest_framework import viewsets, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Rol, Usuario
from .serializers import RolSerializer, UsuarioSerializer, CustomTokenObtainPairSerializer
from .permissions import EsAdmin

class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada que usa el serializer que acepta email"""
    serializer_class = CustomTokenObtainPairSerializer

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [EsAdmin()]

class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [EsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'es_admin') and user.es_admin:
            return Usuario.objects.all()
        return Usuario.objects.filter(id=user.id)
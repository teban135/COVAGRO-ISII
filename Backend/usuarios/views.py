from rest_framework import viewsets, permissions
from .models import Rol, Usuario
from .serializers import RolSerializer, UsuarioSerializer
from .permissions import EsAdmin

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
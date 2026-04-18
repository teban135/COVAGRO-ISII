from rest_framework import serializers
from .models import Rol, Usuario

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'telefono', 'id_rol', 'canal', 'estado' if hasattr(Usuario, 'estado') else 'is_active']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Asegurar que el campo se llame 'estado' para el frontend si es necesario
        if 'is_active' in ret:
            ret['estado'] = ret.pop('is_active')
        return ret
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Rol, Usuario

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para acepar email en lugar de username"""
    email = serializers.EmailField()
    username = serializers.CharField(read_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email y contraseña son requeridos')
        
        # Buscar usuario por email
        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError('Email o contraseña incorrectos')
        
        # Validar contraseña
        if not user.check_password(password):
            raise serializers.ValidationError('Email o contraseña incorrectos')
        
        if not user.is_active:
            raise serializers.ValidationError('Este usuario está inactivo')
        
        # Generar tokens
        refresh = self.get_token(user)
        data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

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
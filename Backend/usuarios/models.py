from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class Rol(models.Model):
    nombre = models.CharField(max_length=30)

    def __str__(self):
        return self.nombre

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El usuario debe tener un correo electrónico')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        # Buscar el rol ADMIN o crearlo si no existe
        rol_admin, _ = Rol.objects.get_or_create(nombre='ADMIN')
        extra_fields.setdefault('id_rol', rol_admin)
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    id_rol = models.ForeignKey(Rol, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    canal = models.CharField(max_length=20, blank=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    def __str__(self):
        return self.email

    @property
    def es_admin(self):
        return self.id_rol.nombre.upper() == 'ADMIN'

    @property
    def es_empleado(self):
        return self.id_rol.nombre.upper() == 'EMPLEADO'

    @property
    def es_cliente(self):
        return self.id_rol.nombre.upper() == 'CLIENTE'

    def save(self, *args, **kwargs):
        from django.contrib.auth.hashers import make_password
        # Encripta la contraseña si no está en formato hash (Django usa prefijos como pbkdf2_sha256$)
        if self.password and not self.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

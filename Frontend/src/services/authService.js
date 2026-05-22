import api from './api'

// Hace login contra Django JWT y devuelve datos del usuario
export const loginService = async (email, password) => {
    // 1) Obtener tokens JWT + datos del usuario en una sola llamada
    const tokenRes = await api.post('/token/', { email: email, password })
    const { access, refresh, usuario } = tokenRes.data
    
    // 2) Guardar tokens en localStorage
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)

    // 3) Validar que el usuario existe en la respuesta
    if (!usuario) throw new Error('Usuario no encontrado en la respuesta del servidor')

    // 4) Retornar datos del usuario formateados
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol || 'CLIENTE', // Viene del backend en mayúsculas
        rol_id: usuario.rol_id,
        canal: usuario.canal || 'presencial',
        es_admin: usuario.es_admin,
        es_empleado: usuario.es_empleado,
        es_cliente: usuario.es_cliente,
        estado: usuario.estado,
    }
}

export const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('covagro_usuario')
}
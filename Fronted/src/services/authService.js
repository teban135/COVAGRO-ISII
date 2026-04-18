import api from './api'

// Hace login contra Django JWT y devuelve datos del usuario
export const loginService = async (email, password) => {
    // 1) Obtener tokens JWT
    const tokenRes = await api.post('/token/', { email: email, password })
    const { access, refresh } = tokenRes.data
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)

    // 2) Obtener datos del usuario por email
    const usuariosRes = await api.get('/usuarios/')
    const usuario = usuariosRes.data.find(u => u.email === email)
    if (!usuario) throw new Error('Usuario no encontrado')

    // 3) Obtener nombre del rol
    const rolesRes = await api.get('/roles/')
    const rol = rolesRes.data.find(r => r.id === usuario.id_rol)

    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rol ? rol.nombre.toUpperCase() : 'CLIENTE',
        canal: usuario.canal || 'presencial',
    }
}

export const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('covagro_usuario')
}
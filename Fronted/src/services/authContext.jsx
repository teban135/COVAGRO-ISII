import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const u = localStorage.getItem('covagro_usuario')
        if (u) setUsuario(JSON.parse(u))
        setCargando(false)
    }, [])

    const login = (datos) => {
        localStorage.setItem('covagro_usuario', JSON.stringify(datos))
        setUsuario(datos)
    }

    const logout = () => {
        localStorage.removeItem('covagro_usuario')
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        setUsuario(null)
    }

    return (
        <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
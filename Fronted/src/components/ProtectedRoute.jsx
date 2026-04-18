import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/authContext'

export default function ProtectedRoute({ children, roles }) {
    const { usuario, cargando } = useAuth()

    if (cargando) return <div className="loading-spinner">🌿 Cargando...</div>
    if (!usuario) return <Navigate to="/login" replace />
    if (roles && !roles.includes(usuario.rol)) return <Navigate to="/login" replace />

    return children
}
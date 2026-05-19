import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext'
import { loginService } from '../services/authService'

// Mapa de redirección según rol
const RUTA_POR_ROL = {
    CLIENTE: '/catalogo',
    EMPLEADO: '/pedidos',
    ADMIN: '/pedidos',
}

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)
        try {
            const usuario = await loginService(email, password)
            login(usuario)
            navigate(RUTA_POR_ROL[usuario.rol] || '/catalogo')
        } catch (err) {
            setError('Usuario o contraseña incorrectos')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-leaf">🌿</div>
                    <div className="login-logo">COV<span>AGRO</span></div>
                    <div className="login-sub">Sistema de Gestión de Pedidos · Covarachía</div>
                </div>

                <div className="login-body">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="login-error">⚠️ {error}</div>}

                        <label className="form-label">Correo electrónico</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <label className="form-label">Contraseña</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <button className="btn-login" type="submit" disabled={cargando}>
                            {cargando ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    El sistema detecta automáticamente su rol · © 2025 COVAGRO
                </div>
            </div>
        </div>
    )
}
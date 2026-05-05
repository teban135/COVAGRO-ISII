import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../services/authContext'

export default function NotificationBell() {
    const { usuario } = useAuth()
    const [notificaciones, setNotificaciones] = useState([])
    const [abierto, setAbierto] = useState(false)
    const menuRef = useRef(null)

    // Solo cargar si es Admin o Empleado
    const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'EMPLEADO'

    const cargarNotificaciones = async () => {
        if (!esAdmin) return
        try {
            const res = await api.get('/notificaciones/')
            setNotificaciones(res.data)
        } catch (err) {
            console.error("Error cargando notificaciones", err)
        }
    }

    useEffect(() => {
        cargarNotificaciones()
        // Opcional: Polling cada 30 segundos
        const interval = setInterval(cargarNotificaciones, 30000)
        return () => clearInterval(interval)
    }, [])

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setAbierto(false)
            }
        }
        document.addEventListener('mousedown', handleClickFuera)
        return () => document.removeEventListener('mousedown', handleClickFuera)
    }, [])

    const marcarLeida = async (id) => {
        try {
            await api.post(`/notificaciones/${id}/marcar_leida/`)
            setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, leida: true } : n))
        } catch (err) {
            console.error(err)
        }
    }

    const unreadCount = notificaciones.filter(n => !n.leida).length

    if (!esAdmin) return null

    return (
        <div className="notif-wrapper" ref={menuRef}>
            <button className="notif-bell" onClick={() => setAbierto(!abierto)}>
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {abierto && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        Notificaciones
                    </div>
                    <div className="notif-list">
                        {notificaciones.length === 0 ? (
                            <div className="notif-empty">No hay notificaciones</div>
                        ) : (
                            notificaciones.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`notif-item ${!n.leida ? 'unread' : ''}`}
                                    onClick={() => marcarLeida(n.id)}
                                >
                                    <div className="notif-type">
                                        {n.tipo === 'NUEVO_PEDIDO' ? '📦' : '📝'}
                                    </div>
                                    <div className="notif-body">
                                        <div className="notif-msg">{n.mensaje}</div>
                                        <div className="notif-date">
                                            {new Date(n.fecha).toLocaleString('es-CO', { 
                                                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' 
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

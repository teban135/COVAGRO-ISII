import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { useAuth } from '../services/authContext'

const ESTADO_CLASS = {
    PENDIENTE: 'estado-pendiente',
    CONFIRMADO: 'estado-confirmado',
    ENTREGADO: 'estado-entregado',
    INACTIVO: 'estado-inactivo',
}

export default function MisPedidos() {
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [pedidos, setPedidos] = useState([])
    const [estados, setEstados] = useState([])
    const [filtro, setFiltro] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        if (!usuario?.id) return
        Promise.all([
            api.get(`/pedidos/por-cliente/${usuario.id}/`),
            api.get('/estados-pedido/'),
        ]).then(([p, e]) => {
            setPedidos(p.data)
            setEstados(e.data)
            setCargando(false)
        }).catch(() => setCargando(false))
    }, [usuario])

    const getNombreEstado = (id) =>
        estados.find(e => e.id === id)?.nombre?.toUpperCase() || ''

    const formatFecha = (f) => new Date(f).toLocaleDateString('es-CO')

    const filtrados = filtro
        ? pedidos.filter(p => getNombreEstado(p.id_estado) === filtro)
        : pedidos

    const totalGastado = pedidos
        .filter(p => getNombreEstado(p.id_estado) !== 'INACTIVO')
        .reduce((acc, p) => acc + Number(p.total), 0)

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="page-title">Mis Pedidos</div>
                        <div className="page-sub">Historial y seguimiento de tus pedidos</div>
                    </div>
                    <div className="topbar-right">
                        <button
                            className="btn btn-verde btn-sm"
                            onClick={() => navigate('/nuevo-pedido')}
                        >
                            ➕ Nuevo Pedido
                        </button>
                    </div>
                </div>

                <div className="content-body">
                    {/* Resumen */}
                    <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                        <div className="stat-card">
                            <div className="stat-label">Total pedidos</div>
                            <div className="stat-value">{pedidos.length}</div>
                            <div className="stat-desc">Realizados</div>
                        </div>
                        <div className="stat-card amarillo">
                            <div className="stat-label">Pendientes</div>
                            <div className="stat-value">
                                {pedidos.filter(p => getNombreEstado(p.id_estado) === 'PENDIENTE').length}
                            </div>
                            <div className="stat-desc">En proceso</div>
                        </div>
                        <div className="stat-card tierra">
                            <div className="stat-label">Total gastado</div>
                            <div className="stat-value">${(totalGastado / 1000).toFixed(0)}K</div>
                            <div className="stat-desc">Pedidos activos</div>
                        </div>
                    </div>

                    {/* Filtro por estado */}
                    <div className="filtros">
                        <span className="filtro-label">Estado:</span>
                        <select
                            className="filtro-select"
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {estados.map(e => (
                                <option key={e.id} value={e.nombre.toUpperCase()}>
                                    {e.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <span className="table-title">Historial de pedidos</span>
                        </div>
                        {cargando ? (
                            <div className="loading-spinner">🌿 Cargando tus pedidos...</div>
                        ) : filtrados.length === 0 ? (
                            <div className="loading-spinner">
                                {pedidos.length === 0
                                    ? '📦 Aún no has realizado ningún pedido.'
                                    : 'Sin pedidos para el estado seleccionado.'}
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>N° Pedido</th>
                                        <th>Fecha</th>
                                        <th>Canal</th>
                                        <th>Observaciones</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map(p => {
                                        const estado = getNombreEstado(p.id_estado)
                                        return (
                                            <tr key={p.id}>
                                                <td><strong>#PED-{String(p.id).padStart(3, '0')}</strong></td>
                                                <td>{formatFecha(p.fecha)}</td>
                                                <td style={{ textTransform: 'capitalize' }}>{p.canal || 'web'}</td>
                                                <td style={{ color: 'var(--gris)', fontSize: '12px' }}>
                                                    {p.observaciones || '—'}
                                                </td>
                                                <td><strong>${Number(p.total).toLocaleString('es-CO')}</strong></td>
                                                <td>
                                                    <span className={`estado ${ESTADO_CLASS[estado] || ''}`}>
                                                        {estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
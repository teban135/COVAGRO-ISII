import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import Breadcrumbs from '../components/Breadcrumbs'
import Spinner from '../components/Spinner'
import api from '../services/api'

const ESTADO_CLASS = {
    PENDIENTE: 'estado-pendiente',
    CONFIRMADO: 'estado-confirmado',
    ENTREGADO: 'estado-entregado',
    INACTIVO: 'estado-inactivo',
}

export default function ConsultarPedidos() {
    const navigate = useNavigate()
    const [pedidos, setPedidos] = useState([])
    const [estados, setEstados] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [filtro, setFiltro] = useState('')
    const [cargando, setCargando] = useState(true)
    const [modal, setModal] = useState(null) // pedido a inactivar

    useEffect(() => {
        Promise.all([
            api.get('/pedidos/'),
            api.get('/estados-pedido/'),
            api.get('/usuarios/'),
        ]).then(([p, e, u]) => {
            setPedidos(p.data)
            setEstados(e.data)
            setUsuarios(u.data)
            setCargando(false)
        })
    }, [])

    const getNombreEstado = (id) => estados.find(e => e.id === id)?.nombre?.toUpperCase() || ''
    const getNombreUsuario = (id) => usuarios.find(u => u.id === id)?.nombre || `#${id}`
    const formatFecha = (f) => new Date(f).toLocaleDateString('es-CO')

    const filtrados = filtro
        ? pedidos.filter(p => getNombreEstado(p.id_estado) === filtro)
        : pedidos

    const inactivar = async () => {
        await api.patch(`/pedidos/${modal.id}/inactivar/`)
        setPedidos(prev => prev.map(p =>
            p.id === modal.id
                ? { ...p, id_estado: estados.find(e => e.nombre.toUpperCase() === 'INACTIVO')?.id || p.id_estado }
                : p
        ))
        setModal(null)
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Breadcrumbs />
                <div className="topbar" style={{ marginTop: '0' }}>
                    <div>
                        <div className="page-title">Gestionar Pedidos</div>
                        <div className="page-sub">Gestión y seguimiento de pedidos</div>
                    </div>
                    <div className="topbar-right">
                        <NotificationBell />
                        <button className="btn btn-verde btn-sm" onClick={() => navigate('/pedido-empleado')}>
                            ➕ Nuevo Pedido
                        </button>
                    </div>
                </div>

                <div className="content-body">
                    <div className="filtros">
                        <span className="filtro-label">Estado:</span>
                        <select
                            className="filtro-select"
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {estados.map(e => (
                                <option key={e.id} value={e.nombre.toUpperCase()}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <span className="table-title">Lista de pedidos</span>
                        </div>
                        {cargando ? (
                            <Spinner />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>N° Pedido</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Canal</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gris)' }}>Sin pedidos</td></tr>
                                    ) : filtrados.map(p => {
                                        const estado = getNombreEstado(p.id_estado)
                                        const inactivo = estado === 'INACTIVO'
                                        return (
                                            <tr key={p.id}>
                                                <td><strong>#PED-{String(p.id).padStart(3, '0')}</strong></td>
                                                <td>{formatFecha(p.fecha)}</td>
                                                <td>{getNombreUsuario(p.id_cliente)}</td>
                                                <td>{p.canal || 'presencial'}</td>
                                                <td><strong>${Number(p.total).toLocaleString('es-CO')}</strong></td>
                                                <td>
                                                    <span className={`estado ${ESTADO_CLASS[estado] || ''}`}>{estado}</span>
                                                </td>
                                                <td style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        className="btn btn-verde btn-sm"
                                                        onClick={() => navigate(`/pedidos/${p.id}/editar`)}
                                                    >✏️ Editar</button>
                                                    {!inactivo && (
                                                        <button
                                                            className="btn btn-rojo btn-sm"
                                                            onClick={() => setModal(p)}
                                                        >🚫 Inactivar</button>
                                                    )}
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

            {/* Modal confirmación inactivar */}
            {modal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">⚠️ Confirmar inactivación</div>
                        <div className="modal-body">
                            <p>¿Está seguro de inactivar el pedido <strong>#PED-{String(modal.id).padStart(3, '0')}</strong>?</p>
                            <div className="pedido-resumen">
                                <div><strong>Cliente:</strong> {getNombreUsuario(modal.id_cliente)}</div>
                                <div><strong>Total:</strong> ${Number(modal.total).toLocaleString('es-CO')}</div>
                                <div><strong>Fecha:</strong> {formatFecha(modal.fecha)}</div>
                            </div>
                            <p>Esta acción cambiará el estado a <strong>INACTIVO</strong> y no podrá revertirse fácilmente.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
                            <button className="btn btn-rojo" onClick={inactivar}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
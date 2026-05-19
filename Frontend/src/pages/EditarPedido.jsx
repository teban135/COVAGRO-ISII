import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'

export default function EditarPedido() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [pedido, setPedido] = useState(null)
    const [estados, setEstados] = useState([])
    const [productos, setProductos] = useState([])
    const [estadoId, setEstadoId] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([
            api.get(`/pedidos/${id}/`),
            api.get('/estados-pedido/'),
            api.get('/productos/'),
        ]).then(([p, e, pr]) => {
            setPedido(p.data)
            setEstados(e.data)
            setProductos(pr.data)
            setEstadoId(p.data.id_estado)
            setObservaciones(p.data.observaciones || '')
            setCargando(false)
        })
    }, [id])

    const getNombreProd = (id) => productos.find(p => p.id === id)?.nombre || `#${id}`

    const guardar = async () => {
        setError(''); setGuardando(true)
        try {
            await api.patch(`/pedidos/${id}/`, { id_estado: estadoId, observaciones })
            setExito(true)
            setTimeout(() => navigate('/pedidos'), 1500)
        } catch {
            setError('Error al guardar los cambios.')
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="loading-spinner">🌿 Cargando pedido...</div>
            </main>
        </div>
    )

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="page-title">Editar Pedido</div>
                        <div className="page-sub">#PED-{String(id).padStart(3, '0')} · Modificar estado u observaciones</div>
                    </div>
                </div>

                <div className="content-body">
                    {exito && <div className="notif-success">✅ Pedido actualizado correctamente.</div>}
                    {error && <div className="notif-danger">⚠️ {error}</div>}

                    <div className="form-card">
                        <div className="form-card-header">📋 Datos del pedido</div>
                        <div className="form-card-body">
                            <div className="form-row">
                                <div className="fg">
                                    <label>Estado del pedido</label>
                                    <select value={estadoId} onChange={e => setEstadoId(Number(e.target.value))}>
                                        {estados.map(e => (
                                            <option key={e.id} value={e.id}>{e.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="fg">
                                    <label>Canal</label>
                                    <input type="text" value={pedido?.canal || ''} disabled style={{ opacity: 0.6 }} />
                                </div>
                            </div>
                            <div className="fg">
                                <label>Observaciones</label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detalles del pedido (solo lectura) */}
                    {pedido?.detalles?.length > 0 && (
                        <div className="table-card">
                            <div className="table-header">
                                <span className="table-title">Productos del pedido</span>
                                <strong style={{ color: 'var(--tierra)' }}>
                                    Total: ${Number(pedido.total).toLocaleString('es-CO')}
                                </strong>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio unit.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedido.detalles.map(d => (
                                        <tr key={d.id}>
                                            <td>{getNombreProd(d.id_producto)}</td>
                                            <td>{d.cantidad}</td>
                                            <td>${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
                                            <td><strong>${Number(d.subtotal).toLocaleString('es-CO')}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/pedidos')}>Cancelar</button>
                        <button className="btn btn-verde" onClick={guardar} disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
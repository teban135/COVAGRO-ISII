import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { useAuth } from '../services/authContext'

export default function NuevoPedidoEmp() {
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [productos, setProductos] = useState([])
    const [clientes, setClientes] = useState([])
    const [clienteId, setClienteId] = useState('')
    const [canal, setCanal] = useState('presencial')
    const [observaciones, setObservaciones] = useState('')
    const [lineas, setLineas] = useState([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])
    const [enviando, setEnviando] = useState(false)
    const [exito, setExito] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([api.get('/productos/'), api.get('/usuarios/')]).then(([p, u]) => {
            setProductos(p.data.filter(x => x.estado && x.stock_actual > 0))
            // Filtrar solo usuarios con rol CLIENTE (id_rol === 1)
            setClientes(u.data.filter(x => x.id_rol === 1))
        })
    }, [])

    const actualizarLinea = (i, campo, valor) => {
        const nuevas = [...lineas]
        nuevas[i][campo] = valor
        if (campo === 'id_producto') {
            const prod = productos.find(p => p.id === Number(valor))
            nuevas[i].precio_unitario = prod ? Number(prod.precio) : 0
        }
        setLineas(nuevas)
    }

    const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio_unitario, 0)

    const enviar = async () => {
        if (!clienteId) { setError('Seleccione un cliente'); return }
        if (lineas.some(l => !l.id_producto)) { setError('Complete todos los productos'); return }
        setError(''); setEnviando(true)
        try {
            const estadosRes = await api.get('/estados-pedido/')
            const pendiente = estadosRes.data.find(e => e.nombre.toUpperCase() === 'PENDIENTE')

            await api.post('/pedidos/', {
                id_cliente: Number(clienteId),
                id_empleado: usuario.id,
                id_estado: pendiente?.id || 1,
                canal,
                observaciones,
                detalles: lineas.map(l => ({
                    id_producto: Number(l.id_producto),
                    cantidad: Number(l.cantidad),
                    precio_unitario: l.precio_unitario,
                })),
            })
            setExito(true)
            setTimeout(() => navigate('/pedidos'), 2000)
        } catch {
            setError('Error al registrar el pedido. Verifique el stock.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="page-title">Nuevo Pedido</div>
                        <div className="page-sub">Registro de pedido en punto físico o por llamada</div>
                    </div>
                </div>

                <div className="content-body">
                    {exito && <div className="notif-success">✅ Pedido registrado. Redirigiendo...</div>}
                    {error && <div className="notif-danger">⚠️ {error}</div>}

                    <div className="form-card">
                        <div className="form-card-header">📋 Datos del Pedido</div>
                        <div className="form-card-body">
                            <div className="form-row">
                                <div className="fg">
                                    <label>Cliente</label>
                                    <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                                        <option value="">— Seleccionar cliente —</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="fg">
                                    <label>Canal</label>
                                    <select value={canal} onChange={e => setCanal(e.target.value)}>
                                        <option value="presencial">Presencial</option>
                                        <option value="telefono">Teléfono</option>
                                        <option value="web">Web</option>
                                    </select>
                                </div>
                            </div>
                            <div className="fg">
                                <label>Observaciones</label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Ej: El cliente llama desde la finca, entrega el martes."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-card">
                        <div className="form-card-header">🧪 Productos</div>
                        <div className="form-card-body">
                            <div className="prod-header">
                                <span>Producto</span><span>Stock</span>
                                <span>Cantidad</span><span>Precio unit.</span><span></span>
                            </div>
                            {lineas.map((linea, i) => {
                                const prod = productos.find(p => p.id === Number(linea.id_producto))
                                return (
                                    <div key={i} className="prod-row">
                                        <select value={linea.id_producto} onChange={e => actualizarLinea(i, 'id_producto', e.target.value)}>
                                            <option value="">— Seleccionar —</option>
                                            {productos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                            ))}
                                        </select>
                                        <span style={{ fontSize: '12px', color: 'var(--gris)' }}>
                                            {prod ? `${prod.stock_actual} uds` : '—'}
                                        </span>
                                        <input
                                            type="number" min={1} max={prod?.stock_actual || 999}
                                            value={linea.cantidad}
                                            onChange={e => actualizarLinea(i, 'cantidad', Number(e.target.value))}
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tierra)' }}>
                                            ${Number(linea.precio_unitario).toLocaleString('es-CO')}
                                        </span>
                                        <button className="btn-remove" onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))}>×</button>
                                    </div>
                                )
                            })}
                            <button className="btn-add-prod" onClick={() => setLineas([...lineas, { id_producto: '', cantidad: 1, precio_unitario: 0 }])}>
                                ＋ Agregar producto
                            </button>
                        </div>
                        <div className="form-actions">
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--tierra)' }}>
                                Total: ${total.toLocaleString('es-CO')}
                            </span>
                            <button className="btn btn-outline" onClick={() => navigate('/pedidos')}>Cancelar</button>
                            <button className="btn btn-verde" onClick={enviar} disabled={enviando}>
                                {enviando ? 'Registrando...' : 'Registrar pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
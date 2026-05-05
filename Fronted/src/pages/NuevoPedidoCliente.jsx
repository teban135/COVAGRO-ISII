import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { useAuth } from '../services/authContext'

export default function NuevoPedidoCliente() {
    const { usuario } = useAuth()
    const navigate = useNavigate()

    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [observaciones, setObservaciones] = useState('')
    const [lineas, setLineas] = useState([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])
    const [enviando, setEnviando] = useState(false)
    const [exito, setExito] = useState(false)
    const [error, setError] = useState('')

    const getNombreCat = (id) => categorias.find(c => c.id === id)?.nombre || '—'

    useEffect(() => {
        Promise.all([
            api.get('/productos/'),
            api.get('/categorias/'),
        ]).then(([p, c]) => {
            setProductos(p.data.filter(x => x.estado && x.stock_actual > 0))
            setCategorias(c.data)
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

    const agregarLinea = () =>
        setLineas([...lineas, { id_producto: '', cantidad: 1, precio_unitario: 0 }])

    const eliminarLinea = (i) =>
        setLineas(lineas.filter((_, idx) => idx !== i))

    const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio_unitario, 0)

    const enviar = async () => {
        if (lineas.some(l => !l.id_producto)) { setError('Seleccione un producto en cada línea'); return }
        setError(''); setEnviando(true)
        try {
            // Obtener estado PENDIENTE (id=1 por convención, o buscarlo)
            const estadosRes = await api.get('/estados-pedido/')
            const pendiente = estadosRes.data.find(e => e.nombre.toUpperCase() === 'PENDIENTE')

            await api.post('/pedidos/', {
                id_cliente: usuario.id,
                id_estado: pendiente?.id || 1,
                canal: 'web',
                observaciones,
                detalles: lineas.map(l => ({
                    id_producto: Number(l.id_producto),
                    cantidad: Number(l.cantidad),
                    precio_unitario: l.precio_unitario,
                })),
            })
            setExito(true)
            setTimeout(() => navigate('/mis-pedidos'), 2000)
        } catch (e) {
            let msg = 'Error al enviar el pedido.'
            if (e.response?.data) {
                if (e.response.data.error) msg = e.response.data.error
                else if (e.response.data.detail) msg = e.response.data.detail
                else {
                    // Si es un error de validación de campos (ej: {id_estado: ["..."]})
                    msg = Object.entries(e.response.data)
                        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                        .join(' | ')
                }
            }
            setError(msg)
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
                        <div className="page-sub">Solicite sus insumos agrícolas en línea</div>
                    </div>
                </div>

                <div className="content-body">
                    {exito && (
                        <div className="notif-success">✅ Pedido enviado correctamente. Redirigiendo...</div>
                    )}
                    {error && (
                        <div className="notif-danger">⚠️ {error}</div>
                    )}

                    <div className="form-card">
                        <div className="form-card-header">📋 Información del Pedido</div>
                        <div className="form-card-body">
                            <div className="fg">
                                <label>Observaciones</label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Ej: Entregar en la mañana antes de las 10am."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-card">
                        <div className="form-card-header">🧪 Productos</div>
                        <div className="form-card-body">
                            <div className="prod-header">
                                <span>Producto</span>
                                <span>Categoría</span>
                                <span>Cantidad</span>
                                <span>Precio unit.</span>
                                <span></span>
                            </div>

                            {lineas.map((linea, i) => {
                                const prod = productos.find(p => p.id === Number(linea.id_producto))
                                return (
                                    <div key={i} className="prod-row">
                                        <select
                                            value={linea.id_producto}
                                            onChange={e => actualizarLinea(i, 'id_producto', e.target.value)}
                                        >
                                            <option value="">— Seleccionar —</option>
                                            {productos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                            ))}
                                        </select>

                                        <span style={{ fontSize: '12px', color: 'var(--gris)' }}>
                                            {prod ? getNombreCat(prod.id_categoria) : '—'}
                                        </span>

                                        <input
                                            type="number"
                                            min={1}
                                            max={prod?.stock_actual || 999}
                                            value={linea.cantidad}
                                            onChange={e => actualizarLinea(i, 'cantidad', Number(e.target.value))}
                                        />

                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tierra)' }}>
                                            ${Number(linea.precio_unitario).toLocaleString('es-CO')}
                                        </span>

                                        <button className="btn-remove" onClick={() => eliminarLinea(i)}>×</button>
                                    </div>
                                )
                            })}

                            <button className="btn-add-prod" onClick={agregarLinea}>＋ Agregar producto</button>
                        </div>

                        <div className="form-actions">
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--tierra)' }}>
                                Total estimado: ${total.toLocaleString('es-CO')}
                            </span>
                            <button className="btn btn-outline" onClick={() => navigate('/catalogo')}>Cancelar</button>
                            <button className="btn btn-verde" onClick={enviar} disabled={enviando}>
                                {enviando ? 'Enviando...' : 'Enviar pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
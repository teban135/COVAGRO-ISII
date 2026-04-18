import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import api from '../services/api'
import { useAuth } from '../services/authContext'

const ESTADO_CLASS = {
    PENDIENTE: 'estado-pendiente',
    CONFIRMADO: 'estado-confirmado',
    ENTREGADO: 'estado-entregado',
    INACTIVO: 'estado-inactivo',
}

export default function Reportes() {
    const { usuario } = useAuth()
    const isAdmin = usuario?.rol === 'ADMIN'

    const [pedidos, setPedidos] = useState([])
    const [productos, setProductos] = useState([])
    const [estados, setEstados] = useState([])
    const [categorias, setCategorias] = useState([])
    const [tipoReporte, setTipoReporte] = useState('diario')
    const [consolidado, setConsolidado] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        setCargando(true)
        Promise.all([
            api.get('/pedidos/'),
            api.get('/productos/'),
            api.get('/estados-pedido/'),
            api.get('/categorias/'),
            api.get(`/pedidos/reporte-consolidado/?periodo=${tipoReporte}`)
        ]).then(([p, pr, e, c, cons]) => {
            setPedidos(p.data)
            setProductos(pr.data)
            setEstados(e.data)
            setCategorias(c.data)
            setConsolidado(cons.data)
            setCargando(false)
        }).catch(err => {
            console.error("Error cargando reportes:", err)
            setCargando(false)
        })
    }, [tipoReporte])

    const getNombreEstado = (id) => estados.find(e => e.id === id)?.nombre?.toUpperCase() || ''

    const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo)

    const maxProd = Math.max(...categorias.map(c =>
        productos.filter(p => p.id_categoria === c.id).length
    ), 1)

    const maxConsCat = Math.max(...(consolidado?.por_categoria?.map(c => Number(c.valor)) || [1]), 1)

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <div className="page-title">Reporte Consolidado</div>
                            <div className="page-sub">
                                {tipoReporte === 'diario' ? 'Resumen del día de hoy' : 'Resumen del mes actual'}
                            </div>
                        </div>
                        
                        {isAdmin && (
                            <div className="bg-white p-1 rounded-lg flex shadow-sm border border-gray-100" style={{ background: 'white', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                                <button 
                                    className={`px-4 py-2 rounded-md transition-all ${tipoReporte === 'diario' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        cursor: 'pointer',
                                        backgroundColor: tipoReporte === 'diario' ? 'var(--verde-oscuro)' : 'transparent',
                                        color: tipoReporte === 'diario' ? 'white' : 'var(--texto-medio)'
                                    }}
                                    onClick={() => setTipoReporte('diario')}
                                >
                                    ☀️ Diario
                                </button>
                                <button 
                                    className={`px-4 py-2 rounded-md transition-all ${tipoReporte === 'mensual' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '6px', 
                                        border: 'none', 
                                        cursor: 'pointer',
                                        backgroundColor: tipoReporte === 'mensual' ? 'var(--verde-oscuro)' : 'transparent',
                                        color: tipoReporte === 'mensual' ? 'white' : 'var(--texto-medio)'
                                    }}
                                    onClick={() => setTipoReporte('mensual')}
                                >
                                    📅 Mensual
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="content-body">
                    {cargando ? (
                        <div className="loading-spinner">🌿 Cargando datos...</div>
                    ) : (
                        <>
                            <div className="cards-grid">
                                <StatCard
                                    label="Ventas totales"
                                    value={`$${Number(consolidado?.ventas_totales || 0).toLocaleString('es-CO')}`}
                                    desc={`${consolidado?.cantidad_pedidos || 0} pedidos entregados`}
                                    variante="verde"
                                />
                                <StatCard 
                                    label="Promedio por pedido" 
                                    value={`$${(consolidado?.cantidad_pedidos > 0 ? (consolidado.ventas_totales / consolidado.cantidad_pedidos) : 0).toLocaleString('es-CO', {maximumFractionDigits: 0})}`} 
                                    desc="Ticket promedio" 
                                    variante="tierra" 
                                />
                                <StatCard label="Stock bajo" value={stockBajo.length} desc="Productos por reponer" variante="rojo" />
                                <StatCard label="Total productos" value={productos.length} desc="En catálogo" variante="amarillo" />
                            </div>

                            <div className="reporte-grid">
                                <div className="chart-card">
                                    <div className="chart-title">💰 Ventas por categoría ({tipoReporte})</div>
                                    <div className="bar-chart">
                                        {consolidado?.por_categoria?.length > 0 ? (
                                            consolidado.por_categoria.map((cat, idx) => {
                                                const pct = Math.round((Number(cat.valor) / maxConsCat) * 110)
                                                return (
                                                    <div key={idx} className="bar-col">
                                                        <div className="bar-val">${(Number(cat.valor) / 1000).toFixed(0)}k</div>
                                                        <div className="bar" style={{ height: `${pct}px`, background: 'var(--verde-medio)' }} />
                                                        <div className="bar-label">{cat.nombre?.slice(0, 8)}</div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div style={{ color: 'var(--texto-suave)', padding: '2rem', textAlign: 'center', width: '100%' }}>
                                                No hay ventas registradas en este periodo.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <div className="chart-title">📊 Top productos ({tipoReporte})</div>
                                    <div className="bar-chart">
                                        {consolidado?.por_producto?.length > 0 ? (
                                            consolidado.por_producto.slice(0, 5).map((prod, idx) => {
                                                const maxVal = Math.max(...consolidado.por_producto.map(p => Number(p.valor)), 1)
                                                const pct = Math.round((Number(prod.valor) / maxVal) * 110)
                                                return (
                                                    <div key={idx} className="bar-col">
                                                        <div className="bar-val">${(Number(prod.valor) / 1000).toFixed(0)}k</div>
                                                        <div className="bar" style={{ height: `${pct}px`, background: 'var(--verde-claro)' }} />
                                                        <div className="bar-label">{prod.nombre?.slice(0, 8)}</div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div style={{ color: 'var(--texto-suave)', padding: '2rem', textAlign: 'center', width: '100%' }}>
                                                Sin datos de productos.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabla stock */}
                            <div className="table-card">
                                <div className="table-header">
                                    <span className="table-title">Reporte de existencias</span>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Stock actual</th>
                                            <th>Stock mínimo</th>
                                            <th>Estado stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productos.map(p => {
                                            const bajo = p.stock_actual <= p.stock_minimo
                                            const medio = p.stock_actual <= p.stock_minimo * 2 && !bajo
                                            const cat = categorias.find(c => c.id === p.id_categoria)?.nombre || ''
                                            return (
                                                <tr key={p.id}>
                                                    <td><strong>{p.nombre}</strong></td>
                                                    <td>{cat}</td>
                                                    <td>{p.stock_actual} uds</td>
                                                    <td>{p.stock_minimo} uds</td>
                                                    <td>
                                                        {bajo
                                                            ? <span className="estado estado-inactivo">Stock bajo</span>
                                                            : medio
                                                                ? <span className="estado estado-pendiente">Moderado</span>
                                                                : <span className="estado estado-confirmado">Suficiente</span>
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Últimos pedidos */}
                            <div className="table-card">
                                <div className="table-header">
                                    <span className="table-title">Últimos pedidos</span>
                                </div>
                                <table>
                                    <thead>
                                        <tr><th>N° Pedido</th><th>Fecha</th><th>Canal</th><th>Total</th><th>Estado</th></tr>
                                    </thead>
                                    <tbody>
                                        {[...pedidos].reverse().slice(0, 10).map(p => {
                                            const estado = getNombreEstado(p.id_estado)
                                            return (
                                                <tr key={p.id}>
                                                    <td><strong>#PED-{String(p.id).padStart(3, '0')}</strong></td>
                                                    <td>{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                                                    <td>{p.canal}</td>
                                                    <td>${Number(p.total).toLocaleString('es-CO')}</td>
                                                    <td><span className={`estado ${ESTADO_CLASS[estado] || ''}`}>{estado}</span></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
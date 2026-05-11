import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import NotificationBell from '../components/NotificationBell'
import Breadcrumbs from '../components/Breadcrumbs'
import Spinner from '../components/Spinner'
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
    const [fechaSel, setFechaSel] = useState('')
    const [mesSel, setMesSel] = useState('')
    const [anioSel, setAnioSel] = useState('')
    const [fechaInicioSel, setFechaInicioSel] = useState('')
    const [fechaFinSel, setFechaFinSel] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    
    const [consolidado, setConsolidado] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        setCargando(true)
        let qParams = `periodo=${tipoReporte}&page=${paginaActual}`
        if (tipoReporte === 'dia' && fechaSel) qParams += `&fecha=${fechaSel}`
        if (tipoReporte === 'mes' && mesSel) qParams += `&mes_anio=${mesSel}`
        if (tipoReporte === 'anio' && anioSel) qParams += `&anio=${anioSel}`
        if (tipoReporte === 'rango' && fechaInicioSel && fechaFinSel) qParams += `&fecha_inicio=${fechaInicioSel}&fecha_fin=${fechaFinSel}`

        Promise.all([
            api.get('/productos/'),
            api.get('/estados-pedido/'),
            api.get('/categorias/'),
            api.get(`/pedidos/reporte-consolidado/?${qParams}`)
        ]).then(([pr, e, c, cons]) => {
            setProductos(pr.data)
            setEstados(e.data)
            setCategorias(c.data)
            setConsolidado(cons.data)
            if (cons.data.pedidos_paginados) {
                setPedidos(cons.data.pedidos_paginados)
            }
            setCargando(false)
        }).catch(err => {
            console.error("Error cargando reportes:", err)
            setCargando(false)
        })
    }, [tipoReporte, fechaSel, mesSel, anioSel, fechaInicioSel, fechaFinSel, paginaActual])

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
                <Breadcrumbs />
                <div className="topbar" style={{ marginTop: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <div className="page-title">Reporte Consolidado</div>
                            <div className="page-sub">
                                Resumen consolidado de operaciones
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <NotificationBell />
                            {isAdmin && (
                                <div className="bg-white p-1 rounded-lg flex shadow-sm border border-gray-100" style={{ background: 'white', padding: '4px', borderRadius: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <select 
                                        value={tipoReporte} 
                                        onChange={(e) => { setTipoReporte(e.target.value); setPaginaActual(1); }}
                                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="diario">☀️ Diario</option>
                                        <option value="mensual">📅 Mensual</option>
                                        <option value="dia">📅 Por Día</option>
                                        <option value="mes">📅 Por Mes</option>
                                        <option value="anio">📅 Por Año</option>
                                        <option value="rango">📅 Por Rango</option>
                                    </select>

                                    {tipoReporte === 'dia' && (
                                        <input type="date" value={fechaSel} onChange={(e) => { setFechaSel(e.target.value); setPaginaActual(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                    )}
                                    {tipoReporte === 'mes' && (
                                        <input type="month" value={mesSel} onChange={(e) => { setMesSel(e.target.value); setPaginaActual(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                    )}
                                    {tipoReporte === 'anio' && (
                                        <input type="number" placeholder="Ej. 2024" value={anioSel} onChange={(e) => { setAnioSel(e.target.value); setPaginaActual(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '100px' }} />
                                    )}
                                    {tipoReporte === 'rango' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input type="date" value={fechaInicioSel} onChange={(e) => { setFechaInicioSel(e.target.value); setPaginaActual(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                            <span style={{color: '#666'}}>a</span>
                                            <input type="date" value={fechaFinSel} onChange={(e) => { setFechaFinSel(e.target.value); setPaginaActual(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="content-body">
                    {cargando ? (
                        <Spinner />
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

                            {/* Últimos pedidos (Paginado) */}
                            <div className="table-card">
                                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="table-title">Pedidos del Periodo</span>
                                    {consolidado?.paginacion && consolidado.paginacion.total_items > 0 && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#666' }}>Página {consolidado.paginacion.current_page} de {consolidado.paginacion.total_pages}</span>
                                            <button 
                                                disabled={!consolidado.paginacion.has_previous}
                                                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', cursor: consolidado.paginacion.has_previous ? 'pointer' : 'not-allowed', opacity: consolidado.paginacion.has_previous ? 1 : 0.5 }}
                                            >
                                                Anterior
                                            </button>
                                            <button 
                                                disabled={!consolidado.paginacion.has_next}
                                                onClick={() => setPaginaActual(p => p + 1)}
                                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', cursor: consolidado.paginacion.has_next ? 'pointer' : 'not-allowed', opacity: consolidado.paginacion.has_next ? 1 : 0.5 }}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <table>
                                    <thead>
                                        <tr><th>N° Pedido</th><th>Fecha</th><th>Canal</th><th>Total</th><th>Estado</th></tr>
                                    </thead>
                                    <tbody>
                                        {pedidos.length > 0 ? pedidos.map(p => {
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
                                        }) : (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>No hay pedidos en este periodo.</td></tr>
                                        )}
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
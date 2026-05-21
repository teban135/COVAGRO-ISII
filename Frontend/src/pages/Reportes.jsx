import React, { useState, useEffect, useRef } from 'react'
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
    const fileInputRef = useRef(null)

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
    
    // Estados para importación/exportación
    const [pedidosImportados, setPedidosImportados] = useState([])
    const [mostrarImportados, setMostrarImportados] = useState(false)
    const [mensajeExportacion, setMensajeExportacion] = useState('')
    const [mensajeImportacion, setMensajeImportacion] = useState('')
    const [tiposErrores, setTiposErrores] = useState({})
    
    // Estado para pedidos expandidos
    const [pedidoExpandido, setPedidoExpandido] = useState(null)

    useEffect(() => {
        cargarReporte()
        cargarPedidosImportados()
    }, [tipoReporte, fechaSel, mesSel, anioSel, fechaInicioSel, fechaFinSel, paginaActual])

    const cargarReporte = () => {
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
    }

    const cargarPedidosImportados = () => {
        api.get('/pedidos/get-imported-pedidos/')
            .then(res => {
                if (res.data.imported && res.data.orders.length > 0) {
                    setPedidosImportados(res.data.orders)
                    setMostrarImportados(true)
                }
            })
            .catch(err => console.error("Error cargando pedidos importados:", err))
    }

    const getNombreEstado = (id) => estados.find(e => e.id === id)?.nombre?.toUpperCase() || ''

    const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo)

    const maxProd = Math.max(...categorias.map(c =>
        productos.filter(p => p.id_categoria === c.id).length
    ), 1)

    const maxConsCat = Math.max(...(consolidado?.por_categoria?.map(c => Number(c.valor)) || [1]), 1)

    // Funciones de exportación e importación
    const handleExportarPedidos = () => {
        let qParams = `periodo=${tipoReporte}`
        if (tipoReporte === 'dia' && fechaSel) qParams += `&fecha=${fechaSel}`
        if (tipoReporte === 'mes' && mesSel) qParams += `&mes_anio=${mesSel}`
        if (tipoReporte === 'anio' && anioSel) qParams += `&anio=${anioSel}`
        if (tipoReporte === 'rango' && fechaInicioSel && fechaFinSel) qParams += `&fecha_inicio=${fechaInicioSel}&fecha_fin=${fechaFinSel}`

        api.post(
            `/pedidos/export-pedidos/?${qParams}`,
            {},
            { responseType: 'blob' }
        ).then(response => {
            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.json`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)
            setMensajeExportacion('✅ Pedidos exportados correctamente')
            setTimeout(() => setMensajeExportacion(''), 3000)
        }).catch(err => {
            console.error('Error exportando:', err)
            setMensajeExportacion('❌ Error al exportar pedidos')
            setTimeout(() => setMensajeExportacion(''), 3000)
        })
    }

    const handleImportarPedidos = (e) => {
        const archivo = e.target.files?.[0]
        if (!archivo) return

        const formData = new FormData()
        formData.append('file', archivo)

        api.post('/pedidos/import-pedidos/', formData)
            .then(res => {
                setMensajeImportacion(`✅ ${res.data.message}`)
                cargarPedidosImportados()
                cargarReporte()
                setTimeout(() => setMensajeImportacion(''), 3000)
            })
            .catch(err => {
                const msg = err.response?.data?.error || 'Error al importar'
                setMensajeImportacion(`❌ ${msg}`)
                setTimeout(() => setMensajeImportacion(''), 3000)
            })
            .finally(() => {
                if (fileInputRef.current) fileInputRef.current.value = ''
            })
    }

    const handleLimpiarImportados = () => {
        if (confirm('¿Deseas eliminar los pedidos importados?')) {
            api.post('/pedidos/clear-imported-pedidos/', {})
                .then(() => {
                    setPedidosImportados([])
                    setMostrarImportados(false)
                    setMensajeImportacion('✅ Pedidos importados eliminados')
                    cargarReporte()
                    setTimeout(() => setMensajeImportacion(''), 3000)
                })
                .catch(err => {
                    setMensajeImportacion('❌ Error al limpiar pedidos importados')
                    setTimeout(() => setMensajeImportacion(''), 3000)
                })
        }
    }

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
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <NotificationBell />
                            {isAdmin && (
                                <>
                                    {/* Botones de exportación/importación */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            onClick={handleExportarPedidos}
                                            title="Descargar pedidos en JSON"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #2ecc71',
                                                background: '#f0fdf4',
                                                color: '#27ae60',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e8f9f1'}
                                            onMouseLeave={(e) => e.target.style.background = '#f0fdf4'}
                                        >
                                            ⬇️ Exportar JSON
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Importar pedidos desde JSON"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #3498db',
                                                background: '#f0f8ff',
                                                color: '#2980b9',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#e6f2ff'}
                                            onMouseLeave={(e) => e.target.style.background = '#f0f8ff'}
                                        >
                                            ⬆️ Importar JSON
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportarPedidos}
                                            style={{ display: 'none' }}
                                        />
                                        {pedidosImportados.length > 0 && (
                                            <button
                                                onClick={handleLimpiarImportados}
                                                title="Limpiar pedidos importados"
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e74c3c',
                                                    background: '#fff5f5',
                                                    color: '#c0392b',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🗑️ Limpiar ({pedidosImportados.length})
                                            </button>
                                        )}
                                    </div>

                                    {/* Mensajes de estado */}
                                    {mensajeExportacion && (
                                        <div style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: mensajeExportacion.includes('✅') ? '#d4edda' : '#f8d7da',
                                            color: mensajeExportacion.includes('✅') ? '#155724' : '#721c24',
                                            fontSize: '0.9rem'
                                        }}>
                                            {mensajeExportacion}
                                        </div>
                                    )}
                                    {mensajeImportacion && (
                                        <div style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: mensajeImportacion.includes('✅') ? '#d4edda' : '#f8d7da',
                                            color: mensajeImportacion.includes('✅') ? '#155724' : '#721c24',
                                            fontSize: '0.9rem'
                                        }}>
                                            {mensajeImportacion}
                                        </div>
                                    )}

                                    {/* Filtros */}
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
                                </>
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
                                    <div>
                                        <span className="table-title">Pedidos del Periodo</span>
                                        <div style={{fontSize: '0.85rem', color: '#999', marginTop: '4px'}}>Haz clic en un pedido para ver detalles</div>
                                    </div>
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
                                        <tr><th>N° Pedido</th><th>Cliente</th><th>Fecha</th><th>Canal</th><th>Total</th><th>Estado</th><th style={{width: '40px'}}>Detalles</th></tr>
                                    </thead>
                                    <tbody>
                                        {pedidos.length > 0 ? pedidos.map(p => {
                                            const estado = getNombreEstado(p.id_estado)
                                            const expandido = pedidoExpandido === p.id
                                            return (
                                                <React.Fragment key={p.id}>
                                                    {/* Fila principal del pedido */}
                                                    <tr 
                                                        onClick={() => setPedidoExpandido(expandido ? null : p.id)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            background: expandido ? '#f0f8ff' : 'transparent',
                                                            transition: 'all 0.2s',
                                                            borderLeft: expandido ? '4px solid #3498db' : 'none'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = expandido ? '#f0f8ff' : '#fafafa'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = expandido ? '#f0f8ff' : 'transparent'}
                                                    >
                                                        <td><strong>#PED-{String(p.id).padStart(3, '0')}</strong></td>
                                                        <td>{p.nombre_cliente || 'N/A'}</td>
                                                        <td>{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                                                        <td>{p.canal || '-'}</td>
                                                        <td><strong>${Number(p.total).toLocaleString('es-CO')}</strong></td>
                                                        <td><span className={`estado ${ESTADO_CLASS[estado] || ''}`}>{estado}</span></td>
                                                        <td style={{textAlign: 'center'}}>
                                                            <span style={{fontSize: '1.2rem', transition: 'transform 0.2s'}}>
                                                                {expandido ? '▼' : '▶'}
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Fila de detalles expandible */}
                                                    {expandido && (
                                                        <tr style={{background: '#f0f8ff', borderTop: '2px solid #3498db'}}>
                                                            <td colSpan="7" style={{padding: '0'}}>
                                                                <div style={{padding: '20px', background: '#f8fbff'}}>
                                                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                                                        {/* Información del cliente */}
                                                                        <div style={{borderRight: '1px solid #ddd', paddingRight: '20px'}}>
                                                                            <h4 style={{color: '#2c3e50', marginTop: 0, marginBottom: '10px'}}>👤 Información del Cliente</h4>
                                                                            <table style={{width: '100%', fontSize: '0.9rem'}}>
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td style={{fontWeight: '500', color: '#555', width: '40%'}}>Nombre:</td>
                                                                                        <td style={{color: '#333'}}>{p.nombre_cliente || 'N/A'}</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style={{fontWeight: '500', color: '#555'}}>Empleado:</td>
                                                                                        <td style={{color: '#333'}}>{p.nombre_empleado || 'N/A'}</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style={{fontWeight: '500', color: '#555'}}>Fecha:</td>
                                                                                        <td style={{color: '#333'}}>{new Date(p.fecha).toLocaleDateString('es-CO')} {new Date(p.fecha).toLocaleTimeString('es-CO', {hour: '2-digit', minute: '2-digit'})}</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style={{fontWeight: '500', color: '#555'}}>Canal:</td>
                                                                                        <td style={{color: '#333'}}>{p.canal || '-'}</td>
                                                                                    </tr>
                                                                                    {p.observaciones && (
                                                                                        <tr>
                                                                                            <td style={{fontWeight: '500', color: '#555', verticalAlign: 'top'}}>Notas:</td>
                                                                                            <td style={{color: '#666', fontSize: '0.85rem'}}>{p.observaciones}</td>
                                                                                        </tr>
                                                                                    )}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                        {/* Detalles de productos */}
                                                                        <div style={{paddingLeft: '20px'}}>
                                                                            <h4 style={{color: '#2c3e50', marginTop: 0, marginBottom: '10px'}}>📦 Productos Comprados</h4>
                                                                            {p.detalles && p.detalles.length > 0 ? (
                                                                                <div style={{fontSize: '0.9rem'}}>
                                                                                    {p.detalles.map((detalle, idx) => (
                                                                                        <div key={idx} style={{
                                                                                            marginBottom: '12px',
                                                                                            padding: '10px',
                                                                                            background: '#fff',
                                                                                            borderRadius: '4px',
                                                                                            border: '1px solid #e0e8f0'
                                                                                        }}>
                                                                                            <div style={{fontWeight: '500', color: '#333', marginBottom: '4px'}}>
                                                                                                {detalle.nombre_producto || `Producto #${detalle.id_producto}`}
                                                                                            </div>
                                                                                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.85rem'}}>
                                                                                                <div>
                                                                                                    <span style={{color: '#666'}}>Cantidad:</span>
                                                                                                    <div style={{color: '#2c3e50', fontWeight: '500'}}>{detalle.cantidad} uds</div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span style={{color: '#666'}}>P. Unitario:</span>
                                                                                                    <div style={{color: '#2c3e50', fontWeight: '500'}}>${Number(detalle.precio_unitario).toLocaleString('es-CO')}</div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span style={{color: '#666'}}>Subtotal:</span>
                                                                                                    <div style={{color: '#27ae60', fontWeight: '600'}}>${Number(detalle.subtotal).toLocaleString('es-CO')}</div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    <div style={{
                                                                                        marginTop: '12px',
                                                                                        paddingTop: '12px',
                                                                                        borderTop: '2px solid #e0e8f0',
                                                                                        display: 'flex',
                                                                                        justifyContent: 'space-between',
                                                                                        fontWeight: '600',
                                                                                        color: '#27ae60',
                                                                                        fontSize: '1.1rem'
                                                                                    }}>
                                                                                        <span>Total del Pedido:</span>
                                                                                        <span>${Number(p.total).toLocaleString('es-CO')}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div style={{color: '#999', fontStyle: 'italic'}}>Sin detalles disponibles</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        }) : (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>No hay pedidos en este periodo.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pedidos importados (si los hay) */}
                            {mostrarImportados && pedidosImportados.length > 0 && (
                                <div className="table-card" style={{ borderLeft: '4px solid #3498db', background: '#f8fbff' }}>
                                    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#2980b9' }}>
                                        <div>
                                            <span className="table-title">📥 Pedidos Importados ({pedidosImportados.length})</span>
                                            <div style={{fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px'}}>Sesión temporal - No guardados en BD</div>
                                        </div>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr><th>N° Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th style={{width: '40px'}}>Detalles</th></tr>
                                        </thead>
                                        <tbody>
                                            {pedidosImportados.map((p, idx) => {
                                                const estado = p.nombre_estado || p.id_estado || 'N/A'
                                                const expandido = pedidoExpandido === `imp-${p.id}-${idx}`
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr 
                                                            onClick={() => setPedidoExpandido(expandido ? null : `imp-${p.id}-${idx}`)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                background: expandido ? '#f0f8ff' : 'transparent',
                                                                opacity: 0.9,
                                                                transition: 'all 0.2s',
                                                                borderLeft: expandido ? '4px solid #3498db' : 'none'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = expandido ? '#f0f8ff' : '#fafafa'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = expandido ? '#f0f8ff' : 'transparent'}
                                                        >
                                                            <td><strong>#{p.id || `IMP-${idx}`}</strong></td>
                                                            <td>{p.nombre_cliente || p.id_cliente || 'N/A'}</td>
                                                            <td>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : 'N/A'}</td>
                                                            <td><strong>${Number(p.total || 0).toLocaleString('es-CO')}</strong></td>
                                                            <td><span className={`estado ${ESTADO_CLASS[estado] || ''}`} style={{ opacity: 0.7 }}>{estado}</span></td>
                                                            <td style={{textAlign: 'center'}}>
                                                                <span style={{fontSize: '1.2rem', transition: 'transform 0.2s'}}>
                                                                    {expandido ? '▼' : '▶'}
                                                                </span>
                                                            </td>
                                                        </tr>

                                                        {expandido && (
                                                            <tr style={{background: '#f0f8ff', borderTop: '2px solid #3498db', opacity: 0.9}}>
                                                                <td colSpan="6" style={{padding: '0'}}>
                                                                    <div style={{padding: '20px', background: '#f8fbff'}}>
                                                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                                                            <div style={{borderRight: '1px solid #ddd', paddingRight: '20px'}}>
                                                                                <h4 style={{color: '#2c3e50', marginTop: 0, marginBottom: '10px'}}>👤 Información del Cliente</h4>
                                                                                <table style={{width: '100%', fontSize: '0.9rem'}}>
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td style={{fontWeight: '500', color: '#555', width: '40%'}}>Nombre:</td>
                                                                                            <td style={{color: '#333'}}>{p.nombre_cliente || 'N/A'}</td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td style={{fontWeight: '500', color: '#555'}}>Empleado:</td>
                                                                                            <td style={{color: '#333'}}>{p.nombre_empleado || 'N/A'}</td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td style={{fontWeight: '500', color: '#555'}}>Fecha:</td>
                                                                                            <td style={{color: '#333'}}>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : 'N/A'}</td>
                                                                                        </tr>
                                                                                        {p.observaciones && (
                                                                                            <tr>
                                                                                                <td style={{fontWeight: '500', color: '#555', verticalAlign: 'top'}}>Notas:</td>
                                                                                                <td style={{color: '#666', fontSize: '0.85rem'}}>{p.observaciones}</td>
                                                                                            </tr>
                                                                                        )}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>

                                                                            <div style={{paddingLeft: '20px'}}>
                                                                                <h4 style={{color: '#2c3e50', marginTop: 0, marginBottom: '10px'}}>📦 Productos Comprados</h4>
                                                                                {p.detalles && p.detalles.length > 0 ? (
                                                                                    <div style={{fontSize: '0.9rem'}}>
                                                                                        {p.detalles.map((detalle, didx) => (
                                                                                            <div key={didx} style={{
                                                                                                marginBottom: '12px',
                                                                                                padding: '10px',
                                                                                                background: '#fff',
                                                                                                borderRadius: '4px',
                                                                                                border: '1px solid #e0e8f0'
                                                                                            }}>
                                                                                                <div style={{fontWeight: '500', color: '#333', marginBottom: '4px'}}>
                                                                                                    {detalle.nombre_producto || `Producto #${detalle.id_producto}`}
                                                                                                </div>
                                                                                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.85rem'}}>
                                                                                                    <div>
                                                                                                        <span style={{color: '#666'}}>Cantidad:</span>
                                                                                                        <div style={{color: '#2c3e50', fontWeight: '500'}}>{detalle.cantidad} uds</div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span style={{color: '#666'}}>P. Unitario:</span>
                                                                                                        <div style={{color: '#2c3e50', fontWeight: '500'}}>${Number(detalle.precio_unitario).toLocaleString('es-CO')}</div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span style={{color: '#666'}}>Subtotal:</span>
                                                                                                        <div style={{color: '#27ae60', fontWeight: '600'}}>${Number(detalle.subtotal).toLocaleString('es-CO')}</div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                        <div style={{
                                                                                            marginTop: '12px',
                                                                                            paddingTop: '12px',
                                                                                            borderTop: '2px solid #e0e8f0',
                                                                                            display: 'flex',
                                                                                            justifyContent: 'space-between',
                                                                                            fontWeight: '600',
                                                                                            color: '#27ae60',
                                                                                            fontSize: '1.1rem'
                                                                                        }}>
                                                                                            <span>Total del Pedido:</span>
                                                                                            <span>${Number(p.total || 0).toLocaleString('es-CO')}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div style={{color: '#999', fontStyle: 'italic'}}>Sin detalles disponibles</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import NotificationBell from '../components/NotificationBell'
import Breadcrumbs from '../components/Breadcrumbs'
import Spinner from '../components/Spinner'
import api from '../services/api'

export default function Inventario() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [catFiltro, setCatFiltro] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        Promise.all([api.get('/productos/'), api.get('/categorias/')]).then(([p, c]) => {
            setProductos(p.data)
            setCategorias(c.data)
            setCargando(false)
        })
    }, [])

    const getNombreCat = (id) => categorias.find(c => c.id === id)?.nombre || ''

    const filtrados = productos.filter(p => {
        const cat = getNombreCat(p.id_categoria).toLowerCase()
        const matchCat = !catFiltro || cat.includes(catFiltro.toLowerCase())
        const matchBus = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return matchCat && matchBus
    })

    const total = productos.length
    const bajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length
    const medio = productos.filter(p => p.stock_actual > p.stock_minimo && p.stock_actual <= p.stock_minimo * 2).length
    const numCats = categorias.length

    const getPct = (p) => {
        if (!p.stock_minimo) return 100
        const pct = (p.stock_actual / (p.stock_minimo * 3)) * 100
        return Math.min(pct, 100)
    }
    const getNivel = (p) => {
        if (p.stock_actual <= p.stock_minimo) return 'bajo'
        if (p.stock_actual <= p.stock_minimo * 2) return 'medio'
        return ''
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Breadcrumbs />
                <div className="topbar" style={{ marginTop: '0' }}>
                    <div>
                        <div className="page-title">Inventario</div>
                        <div className="page-sub">Control de existencias y stock</div>
                    </div>
                    <div className="topbar-right">
                        <NotificationBell />
                    </div>
                </div>

                <div className="content-body">
                    <div className="cards-grid">
                        <StatCard label="Total productos" value={total} desc="En catálogo" />
                        <StatCard label="Stock bajo" value={bajo} desc="Requieren atención" variante="rojo" />
                        <StatCard label="Stock medio" value={medio} desc="Monitorear" variante="amarillo" />
                        <StatCard label="Categorías" value={numCats} desc="En sistema" variante="tierra" />
                    </div>

                    <div className="filtros">
                        <span className="filtro-label">Categoría:</span>
                        <select className="filtro-select" value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
                            <option value="">Todas</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                            ))}
                        </select>
                        <input
                            className="filtro-input"
                            type="text"
                            placeholder="Buscar producto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <span className="table-title">Existencias de productos</span>
                        </div>
                        {cargando ? (
                            <Spinner />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>Stock actual</th>
                                        <th>Stock mínimo</th>
                                        <th>Nivel</th>
                                        <th>Precio</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map(p => {
                                        const nivel = getNivel(p)
                                        return (
                                            <tr key={p.id}>
                                                <td>
                                                    <strong style={nivel === 'bajo' ? { color: 'var(--rojo)' } : {}}>
                                                        {nivel === 'bajo' ? '⚠️ ' : ''}{p.nombre}
                                                    </strong>
                                                </td>
                                                <td>{getNombreCat(p.id_categoria)}</td>
                                                <td>
                                                    <strong style={nivel === 'bajo' ? { color: 'var(--rojo)' } : {}}>
                                                        {p.stock_actual}
                                                    </strong>
                                                </td>
                                                <td>{p.stock_minimo}</td>
                                                <td>
                                                    <div className="stock-bar">
                                                        <div className={`stock-fill ${nivel}`} style={{ width: `${getPct(p)}%` }} />
                                                    </div>
                                                </td>
                                                <td>${Number(p.precio).toLocaleString('es-CO')}</td>
                                                <td>
                                                    <span className={`estado ${p.estado ? 'estado-confirmado' : 'estado-inactivo'}`}>
                                                        {p.estado ? 'Activo' : 'Inactivo'}
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
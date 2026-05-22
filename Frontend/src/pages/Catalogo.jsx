import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import api from '../services/api'

const EMOJI_CAT = { fertilizante: '🌱', herbicida: '🌾', veneno: '🐛', pecuario: '🐄' }
const CSS_CAT = { fertilizante: 'fert', herbicida: 'herb', veneno: 'vene', pecuario: 'pecu' }

const BASE_MEDIA = 'http://127.0.0.1:8000/media/'

export default function Catalogo() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [catFiltro, setCatFiltro] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        Promise.all([api.get('/productos/'), api.get('/categorias/')]).then(([p, c]) => {
            setProductos(p.data.filter(x => x.estado))
            setCategorias(c.data)
            setCargando(false)
        })
    }, [])

    const getNombreCat = (id) => categorias.find(c => c.id === id)?.nombre?.toLowerCase() || ''

    const filtrados = productos.filter(p => {
        const cat = getNombreCat(p.id_categoria)
        const matchCat = !catFiltro || cat === catFiltro.toLowerCase()
        const matchBus = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return matchCat && matchBus
    })

    const getImgClass = (id) => CSS_CAT[getNombreCat(id)] || 'fert'
    const getEmoji = (id) => EMOJI_CAT[getNombreCat(id)] || '🌿'

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="topbar">
                    <div>
                        <div className="page-title">Catálogo de Productos</div>
                        <div className="page-sub">Insumos agrícolas y pecuarios disponibles</div>
                    </div>
                    <div className="topbar-right">
                        <NotificationBell />
                        <input
                            className="filtro-input"
                            type="text"
                            placeholder="🔍 Buscar producto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                        <select
                            className="filtro-select"
                            value={catFiltro}
                            onChange={e => setCatFiltro(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.nombre.toLowerCase()}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="content-body">
                    {cargando ? (
                        <div className="loading-spinner">🌿 Cargando productos...</div>
                    ) : (
                        <>
                            <div className="catalogo-grid">
                                {filtrados.map(p => {
                                    const bajo = p.stock_actual <= p.stock_minimo
                                    return (
                                        <div key={p.id} className="prod-card">
                                            <div className={`prod-card-img ${getImgClass(p.id_categoria)}`}>
                                                {p.imagen
                                                    ? <img 
                                                        src={p.imagen.startsWith('http') ? p.imagen : `${BASE_MEDIA}${p.imagen}`} 
                                                        alt={p.nombre} 
                                                      />
                                                    : getEmoji(p.id_categoria)
                                                }
                                            </div>
                                            <div className="prod-card-body">
                                                <div className="prod-card-name">{p.nombre}</div>
                                                <div className="prod-card-cat">
                                                    {getNombreCat(p.id_categoria)}
                                                </div>
                                                <div className="prod-card-precio">
                                                    ${Number(p.precio).toLocaleString('es-CO')}
                                                </div>
                                                <div className={`prod-card-stock ${bajo ? 'bajo' : ''}`}>
                                                    {bajo
                                                        ? `⚠️ Pocas unidades (${p.stock_actual} uds)`
                                                        : `✅ Disponible (${p.stock_actual} uds)`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {filtrados.length === 0 && (
                                <div className="loading-spinner">Sin productos para los filtros seleccionados.</div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
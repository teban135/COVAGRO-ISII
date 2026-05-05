import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authContext'

// Menús según rol
const MENUS = {
    CLIENTE: [
        { icon: '🌿', label: 'Catálogo', to: '/catalogo' },
        { icon: '📦', label: 'Nuevo Pedido', to: '/nuevo-pedido' },
        { icon: '📋', label: 'Mis Pedidos', to: '/mis-pedidos' },
    ],
    EMPLEADO: [
        { section: 'Pedidos' },
        { icon: '➕', label: 'Nuevo Pedido', to: '/pedido-empleado' },
        { icon: '📋', label: 'Gestionar Pedidos', to: '/pedidos' },
        { section: 'Inventario' },
        { icon: '🗃️', label: 'Inventario', to: '/inventario' },
        { section: 'Análisis' },
        { icon: '📊', label: 'Reportes', to: '/reportes' },
    ],
    ADMIN: [
        { section: 'Pedidos' },
        { icon: '➕', label: 'Nuevo Pedido', to: '/pedido-empleado' },
        { icon: '📋', label: 'Gestionar Pedidos', to: '/pedidos' },
        { section: 'Inventario' },
        { icon: '🗃️', label: 'Inventario', to: '/inventario' },
        { section: 'Administración' },
        { icon: '📊', label: 'Reportes', to: '/reportes' },
    ],
}

const AVATARES = { CLIENTE: '👤', EMPLEADO: '🌾', ADMIN: '🌿' }
const ROL_LABEL = { CLIENTE: 'Portal Cliente', EMPLEADO: 'Empleado', ADMIN: 'Administrador' }

export default function Sidebar() {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()
    const items = MENUS[usuario?.rol] || MENUS.CLIENTE

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">COV<span>AGRO</span></div>
                <div className="sidebar-role">{ROL_LABEL[usuario?.rol]}</div>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">{AVATARES[usuario?.rol]}</div>
                <div>
                    <div className="user-name">{usuario?.nombre}</div>
                    <div className="user-role-tag">{usuario?.rol?.toLowerCase()}</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {items.map((item, i) =>
                    item.section ? (
                        <div key={i} className="nav-section">{item.section}</div>
                    ) : (
                        <NavLink
                            key={i}
                            to={item.to}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    )
                )}
            </nav>

            <div className="sidebar-bottom">
                <button className="btn-logout" onClick={handleLogout}>
                    ⬅ Cerrar sesión
                </button>
            </div>
        </aside>
    )
}
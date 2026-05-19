import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './services/authContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import NuevoPedidoCliente from './pages/NuevoPedidoCliente'
import MisPedidos from './pages/MisPedidos'
import NuevoPedidoEmp from './pages/NuevoPedidoEmp'
import ConsultarPedidos from './pages/ConsultarPedidos'
import EditarPedido from './pages/EditarPedido'
import Inventario from './pages/Inventario'
import Reportes from './pages/Reportes'

const RUTA_DEFAULT = { CLIENTE: '/catalogo', EMPLEADO: '/pedidos', ADMIN: '/pedidos' }

function RedirectDefault() {
  const { usuario } = useAuth()
  return <Navigate to={usuario ? (RUTA_DEFAULT[usuario.rol] || '/catalogo') : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ── CLIENTE ── */}
        <Route path="/catalogo" element={
          <ProtectedRoute roles={['CLIENTE', 'EMPLEADO', 'ADMIN']}>
            <Catalogo />
          </ProtectedRoute>
        } />
        <Route path="/nuevo-pedido" element={
          <ProtectedRoute roles={['CLIENTE']}>
            <NuevoPedidoCliente />
          </ProtectedRoute>
        } />
        <Route path="/mis-pedidos" element={
          <ProtectedRoute roles={['CLIENTE']}>
            <MisPedidos />
          </ProtectedRoute>
        } />

        {/* ── EMPLEADO / ADMIN ── */}
        <Route path="/pedido-empleado" element={
          <ProtectedRoute roles={['EMPLEADO', 'ADMIN']}>
            <NuevoPedidoEmp />
          </ProtectedRoute>
        } />
        <Route path="/pedidos" element={
          <ProtectedRoute roles={['EMPLEADO', 'ADMIN']}>
            <ConsultarPedidos />
          </ProtectedRoute>
        } />
        <Route path="/pedidos/:id/editar" element={
          <ProtectedRoute roles={['EMPLEADO', 'ADMIN']}>
            <EditarPedido />
          </ProtectedRoute>
        } />
        <Route path="/inventario" element={
          <ProtectedRoute roles={['EMPLEADO', 'ADMIN']}>
            <Inventario />
          </ProtectedRoute>
        } />

        {/* ── ADMIN ── */}
        <Route path="/reportes" element={
          <ProtectedRoute roles={['ADMIN', 'EMPLEADO']}>
            <Reportes />
          </ProtectedRoute>
        } />

        <Route path="*" element={<RedirectDefault />} />
      </Routes>
    </BrowserRouter>
  )
}
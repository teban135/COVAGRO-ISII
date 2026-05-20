# Graph Report - Covagro-SII  (2026-05-20)

## Corpus Check
- 80 files · ~125,724 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 338 nodes · 568 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edb587cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 29 edges
2. `Producto` - 18 edges
3. `PedidoViewSet` - 16 edges
4. `Usuario` - 16 edges
5. `NotificacionViewSet` - 15 edges
6. `EstadoPedido` - 14 edges
7. `Pedido` - 14 edges
8. `DetallePedido` - 14 edges
9. `EstadoPedidoViewSet` - 14 edges
10. `DetallePedidoViewSet` - 14 edges

## Surprising Connections (you probably didn't know these)
- `MovimientoInventario` --uses--> `Producto`  [INFERRED]
  Backend/inventario/models.py → Backend/productos/models.py
- `Meta` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/inventario/serializers.py → Backend/inventario/models.py
- `EstadoPedidoViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py
- `NotificacionViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py
- `PedidoViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py

## Communities (44 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (30): Breadcrumbs(), NotificationBell(), ProtectedRoute(), AVATARES, MENUS, ROL_LABEL, Sidebar(), Spinner() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (14): AbstractBaseUser, BaseUserManager, PermissionsMixin, Rol, Usuario, UsuarioManager, EsAdmin, EsCliente (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (18): DetallePedido, EstadoPedido, HistorialEstado, Meta, Notificacion, Pedido, DetallePedidoSerializer, EstadoPedidoSerializer (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (7): Categoria, CategoriaSerializer, Meta, ProductoSerializer, CategoriaViewSet, ProductoViewSet, EsEmpleadoOAdmin

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (28): dependencies, axios, bootstrap, react, react-dom, react-router-dom, devDependencies, autoprefixer (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (21): Automated Tests, Covagro-SII Implementation Plan, Cronograma Sugerido, Manual Verification, [MODIFY] Frontend Report Tables, [MODIFY] Frontend Templates, [MODIFY] [models.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/pedidos/models.py), [MODIFY] Performance & UX (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (5): AppConfig, InventarioConfig, PedidosConfig, ProductosConfig, UsuariosConfig

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (4): MovimientoInventario, Meta, MovimientoInventarioSerializer, MovimientoInventarioViewSet

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (28): dependencies, axios, bootstrap, react, react-dom, react-router-dom, devDependencies, autoprefixer (+20 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): 🚀 Automatización, code:bash (git clone <URL_DEL_REPOSITORIO>), code:bash (npm install), code:bash (npm run dev), code:bash (cd Backend), code:bash (python -m venv venv), code:powershell (venv\Scripts\activate), code:bash (source venv/bin/activate) (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.43
Nodes (4): Login(), RUTA_POR_ROL, loginService(), logout()

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **88 isolated node(s):** `Migration`, `Migration`, `name`, `private`, `version` (+83 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Usuario` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Producto` connect `Community 2` to `Community 35`, `Community 3`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `EsEmpleadoOAdmin` connect `Community 3` to `Community 1`, `Community 2`, `Community 35`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `Producto` (e.g. with `MovimientoInventario` and `EstadoPedido`) actually correct?**
  _`Producto` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `PedidoViewSet` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`PedidoViewSet` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Usuario` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`Usuario` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `NotificacionViewSet` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`NotificacionViewSet` has 13 INFERRED edges - model-reasoned connections that need verification._
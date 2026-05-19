# Graph Report - Covagro-SII  (2026-05-19)

## Corpus Check
- 78 files · ~125,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 261 nodes · 421 edges · 35 communities (23 shown, 12 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9f2b9fb`
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 19 edges
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
- `Meta` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/inventario/serializers.py → Backend/inventario/models.py
- `EstadoPedidoViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py
- `NotificacionViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py
- `PedidoViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py
- `DetallePedidoViewSet` --uses--> `MovimientoInventario`  [INFERRED]
  Backend/pedidos/views.py → Backend/inventario/models.py

## Communities (35 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (25): NotificationBell(), ProtectedRoute(), AVATARES, MENUS, ROL_LABEL, Sidebar(), CSS_CAT, EMOJI_CAT (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (15): AbstractBaseUser, BaseUserManager, Meta, PermissionsMixin, Rol, Usuario, UsuarioManager, EsAdmin (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (16): DetallePedido, EstadoPedido, HistorialEstado, Notificacion, Pedido, DetallePedidoSerializer, EstadoPedidoSerializer, HistorialEstadoSerializer (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (12): MovimientoInventario, Meta, MovimientoInventarioSerializer, MovimientoInventarioViewSet, Categoria, Producto, CategoriaSerializer, Meta (+4 more)

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

## Knowledge Gaps
- **60 isolated node(s):** `Migration`, `Migration`, `name`, `private`, `version` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Usuario` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Producto` connect `Community 3` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `EsEmpleadoOAdmin` connect `Community 3` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `Producto` (e.g. with `MovimientoInventario` and `EstadoPedido`) actually correct?**
  _`Producto` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `PedidoViewSet` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`PedidoViewSet` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Usuario` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`Usuario` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `NotificacionViewSet` (e.g. with `EstadoPedido` and `Pedido`) actually correct?**
  _`NotificacionViewSet` has 13 INFERRED edges - model-reasoned connections that need verification._
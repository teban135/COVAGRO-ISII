# Covagro-SII Implementation Plan

This plan outlines the steps to resolve existing bugs (static files/images) and implement new features (Order Management, In-App Notifications, Report Customization, and Admin UI Improvements).

## User Review Required

> [!IMPORTANT]
> **In-App Notifications**: As requested, notifications will be handled strictly within the web application for the administrator. No external services (Email/SMS) will be integrated at this stage.

> [!NOTE]
> **Renaming**: "Consultar pedido" will be rebranded to "Gestionar pedido" across the entire application (Frontend labels and Backend API routes where applicable).

## Proposed Changes

---

### Phase 0: Error Identification & Debugging

#### [MODIFY] [settings.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/config/settings.py)
- Audit `STATIC_URL`, `STATIC_ROOT`, and `STATICFILES_DIRS`.
- Ensure `DEBUG=True` allows Django to serve static files in development.

#### [MODIFY] Frontend Templates
- Validate that images in `Fronted/src/assets` are imported correctly in React components.
- Ensure `public/` folder is used for static assets that shouldn't be processed by Vite.

---

### Phase 1: Order Management & Notifications

#### [MODIFY] [models.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/pedidos/models.py)
- Refine `Pedido` (Order) model to include status history and client details.
- [NEW] Create `Notificacion` model to store in-app alerts for the admin.

#### [MODIFY] [views.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/pedidos/views.py)
- Implement logic to trigger a `Notificacion` entry whenever a new order is created or a status changes.
- Rename endpoints from `consultar-pedido` to `gestionar-pedido`.

#### [NEW] Notification Component (Frontend)
- Create a `NotificationBell` component in React to display unread alerts for the admin.

---

### Phase 2: Report Customization

#### [MODIFY] [views.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/inventario/views.py) (or relevant report view)
- Implement backend logic to handle four specific filter types:
  1. **Day**: Filter by a specific day (e.g., `2024-05-05`).
  2. **Month**: Filter by a specific month (e.g., `2024-05`).
  3. **Year**: Filter by a specific year (e.g., `2024`).
  4. **Range**: Filter between two dates (`start_date` and `end_date`).
- Use Django ORM's `__date`, `__month`, and `__year` lookups for efficiency.
- Use Django `Paginator` to limit results per page.

#### [MODIFY] Frontend Report Tables
- Implement UI filters (Date pickers).
- Add pagination controls.

---

### Phase 3: Admin Interface Improvements

#### [MODIFY] [urls.py](file:///c:/Users/Usuario/Ing%20Sistemas/8vo%20semestre/Software%20II/Covagro-SII/Backend/config/urls.py)
- Clean up and organize API routes.

#### [NEW] Breadcrumbs Component
- Add a navigation utility to show the user's current location in the admin panel.

#### [MODIFY] Performance & UX
- Add loading spinners to API-dependent components.
- Implement basic caching for static reports.

---

## Verification Plan

### Automated Tests
- `python manage.py test`: Verify order validation and notification triggers.
- Frontend: Ensure images load (check 404s in console).

### Manual Verification
1. Create a test order and verify the Admin sees a new notification in the dashboard.
2. Filter reports by date and verify the results match the expected range.
3. Check the "Gestionar pedido" page for correct naming and functionality.

---

## Cronograma Sugerido

| Semana | Actividades Clave | Entregables |
| :--- | :--- | :--- |
| **1** | **Debugging & Static Files**: Corregir rutas de imágenes, configurar `STATICFILES_DIRS`. | Frontend renderiza imágenes correctamente. |
| **2** | **Gestión de Pedidos & Notificaciones**: Modelos de Pedido, lógica de estados y Notificaciones In-App (Backend + Frontend). | Flujo de pedidos funcional con alertas en tiempo real. |
| **3** | **Reportes Dinámicos**: Implementar filtros por **día, mes, año y rango de fechas personalizado**. Optimización de consultas ORM. | Filtros de reportes 100% funcionales (Día/Mes/Año/Rango). |
| **4** | **Paginación & UI Admin**: Refactorizar tablas con paginación, agregar Breadcrumbs y Spinners de carga. | Interfaz de admin optimizada y fluida. |

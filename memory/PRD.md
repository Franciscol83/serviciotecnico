# PRD - Tecno Nacho SAS (Sistema de Gestión de Servicio Técnico)

## Problema Original
Tecno Nacho SAS requiere un sistema completo PWA para gestionar servicios técnicos en campo:
- Gestión de usuarios multirol (Admin, Supervisor, Asesor, Técnico)
- Órdenes de servicio con catálogo, items múltiples y facturación
- Calendario 24h personalizado con disponibilidad de técnicos
- Reportes técnicos con fotos, materiales, firma digital y exportación a PDF
- Integración con WorldOffice (SQL Server) - estructura `primer_nombre, segundo_nombre, primer_apellido, segundo_apellido`
- Dashboard KPI
- Inventario de materiales y herramientas
- Chat en tiempo real (Socket.IO)
- Notificaciones push (PWA móvil/desktop)
- **Logs de auditoría** para trazabilidad de acciones críticas

## Stack
- **Frontend:** React 19, Tailwind, Shadcn UI, FullCalendar, react-signature-canvas, jsPDF, Socket.IO-client, PWA
- **Backend:** FastAPI, Pydantic, python-socketio, pywebpush 2.3.0
- **Database:** MongoDB (Motor async)
- **Auth:** httpOnly cookies (JWT-based custom)

## Idioma
**Español** (comunicación con el usuario y UI estrictamente en español)

## Estado Actual (Feb 2026)

### Implementado y funcionando
- ✅ Autenticación httpOnly cookie + JWT
- ✅ CRUD completo de Usuarios con roles
- ✅ CRUD de Órdenes de Servicio (con items múltiples, aprobar/anular)
- ✅ Catálogo de Tipos de Servicio
- ✅ Inventario con stock, movimientos y alertas
- ✅ Reportes Técnicos con fotos, materiales, firma digital, exportación PDF
- ✅ Calendario con disponibilidad por técnico
- ✅ Dashboard con KPIs
- ✅ Chat real-time con Socket.IO (multi-usuario, sesiones, typing indicators)
- ✅ Migración de schema a estructura WorldOffice
- ✅ PWA con service worker y manifest
- ✅ Refactorización Services.js (1022→335 LOC) y CrearReporte.js (707→289 LOC)
- ✅ Web Push Notifications (VAPID) + integración con chat
- ✅ **Push Notifications extendidas: crear/aprobar/anular/agregar-item de servicios + reportes completados** [Feb 2026]
- ✅ **Logs de Auditoría: backend + frontend con filtros, paginación, stats (`/audit-logs`)** [Feb 2026]
- ✅ Captura automática de IP, user-agent en logs de auditoría
- ✅ Tracking de login_success, login_failed con razón, logout

### En pausa / esperando credenciales
- ⏸️ Sincronización SQL Server WorldOffice (esperando VPN/credenciales del usuario)
- ⏸️ Integración WooCommerce para inventario (esperando API Key)

## Roadmap Restante

### P1 - Próximos pasos sugeridos
- Validación E2E real de push notifications en dispositivo móvil (instalación PWA + permiso real)
- Audit logs para cambios de usuarios (crear, editar, desactivar, cambio de password)
- Audit logs para inventario (ajustes de stock, movimientos)

### P2 - Backlog
- Notificaciones por Email (Resend) - requiere API key del usuario
- Notificaciones por SMS (Twilio) - requiere credenciales del usuario
- Exportación de audit logs a CSV/Excel
- Búsqueda avanzada en audit logs por rango de fechas

## Arquitectura

```
/app/
├── backend/
│   ├── models/        (user, service, service_type, reporte, inventario, mensaje, audit_log)
│   ├── routes/        (auth, users, services, service_types, reportes, inventario, worldoffice, chat, notifications, audit_logs)
│   ├── services/      (push_service.py, audit_service.py)
│   ├── middleware/    (auth.py)
│   ├── scripts/       (migrate_to_worldoffice.py)
│   ├── tests/         (pytest)
│   └── server.py      (FastAPI + Socket.IO ASGI)
└── frontend/
    ├── src/
    │   ├── api/                          (client.js: authAPI, usersAPI, servicesAPI, reportesAPI, inventarioAPI, chatAPI, auditAPI)
    │   ├── services/                     (socket.js, notifications.js)
    │   ├── contexts/                     (AuthContext.js, ThemeContext.js)
    │   ├── components/
    │   │   ├── layout/                   (MainLayout, Sidebar, Navbar)
    │   │   ├── ui/                       (shadcn)
    │   │   ├── services/                 (ServiceCard, ServiceFilters, ServiceModal, serviceHelpers + sections/)
    │   │   ├── reportes/                 (ServiceSelector, MaterialesSection, FotosSection, FirmaSection, ReporteModal)
    │   │   └── notifications/            (PushNotificationsCard)
    │   └── pages/                        (Dashboard, Services, CrearReporte, ReportesLista, ReporteDetalle, Chat, Calendar, Users, Inventario, Configuracion, ServiceTypes, AuditLogs, Login)
    └── public/                            (manifest.json, service-worker.js con handlers push/notificationclick)
```

## Endpoints clave
- `POST /api/auth/login`, `/logout` (cookie httpOnly, ahora con audit)
- `GET/POST /api/services` (CRUD órdenes + audit + push al técnico)
- `POST /api/services/{id}/aprobar`, `/anular`, `/agregar-item` (+ audit + push)
- `GET/POST /api/reportes` (+ audit + push a admins/supervisores)
- `GET/POST /api/inventario`
- `GET/POST /api/chat/mensajes`, `/conversaciones` (+ push si destinatario offline)
- `GET /api/notifications/vapid-public-key`, `POST /subscribe`, `/unsubscribe`, `/test`
- `GET /api/notifications/status`
- `GET /api/audit-logs` (paginado, filtrable por acción/entidad/usuario_id)
- `GET /api/audit-logs/stats` (totales agrupados)
- Socket.IO: `connect`, `authenticate`, `send_message`, `typing`, `message_read`

## Variables de entorno requeridas
**backend/.env:**
- `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `ENVIRONMENT`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

**frontend/.env:**
- `REACT_APP_BACKEND_URL`

## Notas Importantes
- Babel-metadata-plugin tiene try/catch defensivo permanente
- Todos los archivos de páginas grandes ahora <350 LOC
- WorldOffice integration está pausada - solo schema sync
- En navegadores reales se solicita permiso al usuario; en headless tests aparece "Permiso bloqueado" (esperado)
- Audit logs son inmutables (best-effort: no rompen la request principal aunque falle el log)
- Push notifications son fire-and-forget (no bloquean el flujo principal)

## Eventos que generan Push Notification
| Evento | Destinatario | Tag |
|---|---|---|
| Mensaje de chat (destinatario offline) | Usuario destinatario | `chat-{conversacion_id}` |
| Crear orden | Técnico asignado | `service-{id}` |
| Aprobar orden | Técnico asignado | `service-aprobado-{id}` |
| Anular orden | Técnico asignado | `service-anulado-{id}` |
| Agregar item a orden | Técnico asignado | `service-item-{id}` |
| Crear reporte | Todos los admin + supervisor (excepto creador) | `reporte-{id}` |

## Acciones registradas en Audit Log
- `login_success`, `login_failed`, `logout`
- `crear_servicio`, `aprobar_servicio`, `anular_servicio`, `agregar_item_servicio`
- `crear_reporte`
- (Roadmap P1) `actualizar_usuario`, `cambio_password`, `crear_usuario`, `ajuste_inventario`

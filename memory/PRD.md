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
- ✅ **Refactorización Services.js (1022→335 LOC) y CrearReporte.js (707→289 LOC)** [Feb 2026]
- ✅ **Web Push Notifications con VAPID + integración con chat (envía push si destinatario offline)** [Feb 2026]

### En pausa / esperando credenciales
- ⏸️ Sincronización SQL Server WorldOffice (esperando VPN/credenciales del usuario)
- ⏸️ Integración WooCommerce para inventario (esperando API Key)

## Roadmap Restante

### P1 - Próximos pasos sugeridos
- Validación E2E real de push notifications en dispositivo móvil (instalación PWA + permiso real)
- Push notifications para otros eventos: nueva orden asignada al técnico, aprobación de orden, reporte completado

### P2 - Backlog
- Notificaciones por Email (Resend) y SMS (Twilio)
- Logs de auditoría e historial de cambios
- Materials Request flow (parte de Phase 5B/5C)

## Arquitectura

```
/app/
├── backend/
│   ├── models/        (user, service, service_type, reporte, inventario, mensaje)
│   ├── routes/        (auth, users, services, service_types, reportes, inventario, worldoffice, chat, notifications)
│   ├── services/      (push_service.py)
│   ├── middleware/    (auth.py)
│   ├── scripts/       (migrate_to_worldoffice.py)
│   ├── tests/         (pytest)
│   └── server.py      (FastAPI + Socket.IO ASGI)
└── frontend/
    ├── src/
    │   ├── api/                          (client.js axios)
    │   ├── services/                     (socket.js, notifications.js)
    │   ├── contexts/                     (AuthContext.js)
    │   ├── components/
    │   │   ├── layout/                   (MainLayout, Sidebar_NEW)
    │   │   ├── ui/                       (shadcn)
    │   │   ├── services/                 (ServiceCard, ServiceFilters, ServiceModal, serviceHelpers + sections/)
    │   │   ├── reportes/                 (ServiceSelector, MaterialesSection, FotosSection, FirmaSection, ReporteModal)
    │   │   └── notifications/            (PushNotificationsCard)
    │   └── pages/                        (Dashboard, Services, CrearReporte, ReportesLista, Chat, Calendar, Users, Inventario, Configuracion, ServiceTypes, Login)
    └── public/                            (manifest.json, service-worker.js con handlers push/notificationclick)
```

## Endpoints clave
- `POST /api/auth/login` (cookie httpOnly)
- `GET/POST /api/services` (CRUD órdenes)
- `POST /api/services/{id}/aprobar`, `/anular`, `/agregar-item`
- `GET/POST /api/reportes`
- `GET/POST /api/inventario`
- `GET/POST /api/chat/mensajes`, `/conversaciones`
- `GET /api/notifications/vapid-public-key`
- `POST /api/notifications/subscribe`, `/unsubscribe`, `/test`
- `GET /api/notifications/status`
- Socket.IO: `connect`, `authenticate`, `send_message`, `typing`, `message_read`

## Variables de entorno requeridas
**backend/.env:**
- `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `ENVIRONMENT`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (generadas Feb 2026)

**frontend/.env:**
- `REACT_APP_BACKEND_URL`

## Notas Importantes
- Babel-metadata-plugin tiene try/catch defensivo permanente (después del refactor ya no es necesario pero queda como salvaguarda)
- Todos los archivos de páginas grandes ahora <350 LOC para mantener estabilidad del compilador
- WorldOffice integration está pausada - solo schema sync (no SQL Server live connection)
- En navegadores reales se solicita permiso al usuario; en headless tests aparece "Permiso bloqueado" (esperado)

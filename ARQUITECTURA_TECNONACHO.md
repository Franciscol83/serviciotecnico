# 🏗️ Arquitectura Técnica - Sistema de Gestión Tecno Nacho SAS

## 📊 Información General del Proyecto

**Empresa:** Tecno Nacho SAS  
**Sistema:** Gestión de Servicios Técnicos  
**Versión:** 2.0 (Diciembre 2025)  
**Estado:** En desarrollo activo - Fase 4 completada

---

## 🎯 Stack Tecnológico

### **Frontend**
```
Framework: React 19
Router: React Router v6
Estilos: Tailwind CSS
Componentes: Shadcn UI
Estado: React Hooks + Context API
```

**Dependencias clave:**
- `axios` (v1.7.9) - Cliente HTTP
- `fullcalendar` (v6.1.15) - Calendario interactivo
- `recharts` (v2.15.0) - Gráficas y visualización
- `react-signature-canvas` (v1.0.6) - Firma digital
- `jspdf` + `html2canvas` - Generación de PDFs
- `lucide-react` - Iconos

### **Backend**
```
Framework: FastAPI
Lenguaje: Python 3.11
Validación: Pydantic v2
Base de Datos: MongoDB (Motor async driver)
Autenticación: JWT (python-jose)
Seguridad: bcrypt
```

**Dependencias clave:**
- `fastapi` (v0.115.6)
- `motor` (v3.6.0) - MongoDB async
- `python-jose[cryptography]` - JWT
- `bcrypt` - Hash de contraseñas
- `python-multipart` - Upload de archivos

### **Infraestructura**
```
Contenedor: Kubernetes
Proxy: Nginx Ingress
Gestor de procesos: Supervisor
Hot Reload: Activo (desarrollo)
```

---

## 📂 Estructura de Directorios

```
/app/
│
├── backend/                          # Servidor FastAPI
│   ├── models/                       # Modelos de datos (Pydantic)
│   │   ├── user.py                   # Usuario (múltiples roles)
│   │   ├── service.py                # Orden de servicio
│   │   ├── service_type.py           # Catálogo de tipos
│   │   └── reporte.py                # Reporte técnico
│   │
│   ├── routes/                       # Endpoints API REST
│   │   ├── auth.py                   # POST /api/auth/login, /register
│   │   ├── users.py                  # CRUD usuarios (/api/users)
│   │   ├── services.py               # CRUD órdenes (/api/services)
│   │   ├── service_types.py          # CRUD tipos (/api/service-types)
│   │   └── reportes.py               # Reportes + Estadísticas (/api/reportes)
│   │
│   ├── middleware/                   # Middlewares personalizados
│   │   └── auth.py                   # JWT verification + role checker
│   │
│   ├── utils/                        # Utilidades
│   │   ├── jwt_handler.py            # create_token(), verify_token()
│   │   ├── password.py               # hash_password(), verify_password()
│   │   └── dependencies.py           # get_database() dependency
│   │
│   ├── tests/                        # Tests automatizados (pytest)
│   │   ├── test_services_fase2.py
│   │   └── test_users_roles_reportes.py
│   │
│   ├── server.py                     # Aplicación principal FastAPI
│   ├── requirements.txt              # Dependencias Python
│   └── .env                          # Variables de entorno
│       └── MONGO_URL=mongodb://...
│       └── DB_NAME=tecnonacho
│       └── JWT_SECRET=...
│
├── frontend/                         # Aplicación React
│   ├── public/
│   │   └── logo-tecnonacho.png       # Logo de la empresa
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn UI components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   └── ... (otros componentes)
│   │   │   │
│   │   │   ├── layout/               # Componentes de layout
│   │   │   │   ├── Sidebar.js        # Navegación lateral
│   │   │   │   ├── MainLayout.js     # Layout principal
│   │   │   │   └── Navbar.js         # (obsoleto - a eliminar)
│   │   │   │
│   │   │   └── ProtectedRoute.js     # HOC para rutas protegidas
│   │   │
│   │   ├── contexts/                 # React Contexts (estado global)
│   │   │   ├── AuthContext.js        # Autenticación y usuario actual
│   │   │   └── ThemeContext.js       # Tema claro/oscuro
│   │   │
│   │   ├── pages/                    # Páginas de la aplicación
│   │   │   ├── Login.js              # Pantalla de inicio de sesión
│   │   │   ├── Dashboard.js          # Dashboard con KPIs y gráficas
│   │   │   ├── Users.js              # Gestión de usuarios (múltiples roles)
│   │   │   ├── Services.js           # Gestión de órdenes de servicio
│   │   │   ├── ServiceTypes.js       # Catálogo de tipos de servicio
│   │   │   ├── Calendar.js           # Calendario 24h con disponibilidad
│   │   │   └── Reportes.js           # Reportes técnicos (fotos + firma)
│   │   │
│   │   ├── api/
│   │   │   └── client.js             # Cliente Axios + interceptores
│   │   │
│   │   ├── App.js                    # Router principal
│   │   ├── App.css                   # Estilos globales
│   │   └── index.js                  # Punto de entrada
│   │
│   ├── package.json                  # Dependencias Node
│   ├── tailwind.config.js            # Configuración Tailwind
│   └── .env                          # Variables de entorno
│       └── REACT_APP_BACKEND_URL=https://soporte-hispano.preview.emergentagent.com
│
├── test_reports/                     # Reportes de testing
│   ├── iteration_1.json
│   └── iteration_2.json
│
└── test_result.md                    # Estado de testing actual
```

---

## 🔄 **Flujo de Arquitectura**

### **Diagrama de Comunicación:**

```
┌─────────────────┐
│   Usuario Web   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│      React Frontend (:3000)             │
│  • AuthContext (JWT token storage)     │
│  • API Client (axios interceptors)     │
│  • Protected Routes                     │
└────────┬────────────────────────────────┘
         │ HTTP/HTTPS
         │ REACT_APP_BACKEND_URL
         ↓
┌─────────────────────────────────────────┐
│      Nginx Ingress (Kubernetes)         │
│  • /api/* → Backend :8001               │
│  • /* → Frontend :3000                  │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│    FastAPI Backend (:8001)              │
│  • JWT Middleware                       │
│  • Role-based Authorization             │
│  • Business Logic                       │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│      MongoDB Database                   │
│  Collections:                           │
│  • users                                │
│  • services                             │
│  • service_types                        │
│  • reportes                             │
└─────────────────────────────────────────┘
```

---

## 🗄️ **Modelo de Datos**

### **Collection: users**
```javascript
{
  id: "uuid",
  email: "admin@tecnonacho.com",
  nombre_completo: "Administrador",
  password_hash: "bcrypt_hash",
  role: "admin",              // Rol principal
  roles: ["admin", "tecnico"], // Múltiples roles
  activo: true,
  profile: {
    telefono: "...",
    direccion: "...",
    codigo_worldoffice: "..."
  },
  fecha_creacion: "2025-12-05T...",
  fecha_actualizacion: "2025-12-05T..."
}
```

### **Collection: services (Órdenes de Servicio)**
```javascript
{
  id: "uuid",
  numero_caso: "TN-2026-00001",  // Secuencial anual
  tipo_servicio_id: "uuid",
  tipo_servicio_nombre: "Reparación PC",
  cliente: {
    nombre: "Juan Pérez",
    email: "juan@example.com",
    telefono: "3001234567",
    tipo_documento: "cc",
    numero_documento: "123456789"
  },
  ubicacion_servicio: "en_local" | "por_fuera",
  fecha_agendada: "2026-01-15T10:00:00",
  tecnico_asignado_id: "uuid",
  tecnico_asignado_nombre: "Carlos Técnico",
  estado: "pendiente_aprobacion" | "aprobado" | "en_proceso" | "completado" | "anulado",
  items_servicio: [
    {
      tipo_servicio_id: "uuid",
      tipo_servicio_nombre: "Instalación RAM",
      agregado_en: "2026-01-10T..."
    }
  ],
  medio_pago: "efectivo" | "tarjeta" | "transferencia",
  codigo_worldoffice: "WO12345",
  observaciones: "Cliente reporta...",
  recomendaciones: "Se recomienda...",
  modificaciones: [
    {
      tipo: "creacion" | "item_agregado" | "aprobacion" | "anulacion",
      timestamp: "...",
      usuario_nombre: "...",
      detalles: {}
    }
  ]
}
```

### **Collection: reportes (Reportes Técnicos)**
```javascript
{
  id: "uuid",
  servicio_id: "uuid",
  tecnico_id: "uuid",
  tecnico_nombre: "Carlos Técnico",
  trabajo_realizado: "Se instaló RAM...",
  observaciones_tecnico: "Cliente satisfecho",
  tiempo_dedicado_horas: 2.5,
  problemas_encontrados: "Slot RAM defectuoso",
  recomendaciones: "Cambiar motherboard",
  materiales_consumidos: [
    {
      nombre: "RAM DDR4 8GB",
      cantidad: 2,
      unidad: "unidades",
      observaciones: "..."
    }
  ],
  fotos: [
    {
      url: "data:image/png;base64,...",
      descripcion: "Antes de la reparación",
      timestamp: "2026-01-15T14:30:00"
    }
  ],
  firma_cliente_base64: "data:image/png;base64,...",
  cliente_firma_nombre: "Juan Pérez",
  fecha_creacion: "2026-01-15T16:00:00",
  fecha_completado: null,
  completado: false
}
```

### **Collection: service_types (Catálogo)**
```javascript
{
  id: "uuid",
  nombre: "Reparación de PC",
  descripcion: "Diagnóstico y reparación...",
  categoria: "hardware",
  precio_base: 50000,
  tiempo_estimado_horas: 2,
  activo: true,
  fecha_creacion: "2025-12-01T..."
}
```

---

## 🔐 **Seguridad y Autenticación**

### **JWT Flow:**
```
1. Usuario envía email + password → POST /api/auth/login
2. Backend verifica credenciales (bcrypt)
3. Backend genera JWT token con payload:
   {
     "sub": user_id,
     "email": user.email,
     "role": user.role,
     "exp": timestamp + 7 días
   }
4. Frontend almacena token en localStorage
5. Todas las requests incluyen: Authorization: Bearer {token}
6. Middleware verifica token y extrae usuario actual
7. Decorator require_roles() valida permisos
```

### **Roles y Permisos:**

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso total: usuarios, tipos de servicio, servicios, reportes, estadísticas |
| **Supervisor** | Ver usuarios, gestionar servicios, ver reportes, aprobar órdenes |
| **Asesor** | Crear órdenes (requieren aprobación), ver calendario |
| **Técnico** | Ver servicios asignados, crear reportes, materiales |

**Múltiples roles:** Un usuario puede tener varios roles simultáneamente (ej: Supervisor + Técnico)

---

## 📡 **Endpoints API**

### **Autenticación (`/api/auth`)**
```
POST   /login          # Login con email/password
POST   /register       # Crear nuevo usuario (admin only)
GET    /me             # Obtener usuario actual
POST   /logout         # Cerrar sesión
```

### **Usuarios (`/api/users`)**
```
GET    /               # Listar usuarios (admin, supervisor)
GET    /{id}           # Obtener usuario específico
PUT    /{id}           # Actualizar usuario (roles, perfil)
DELETE /{id}           # Eliminar usuario (admin only)
PUT    /{id}/change-password  # Cambiar contraseña
```

### **Servicios (`/api/services`)**
```
GET    /               # Listar órdenes (filtros: estado, técnico)
POST   /               # Crear orden de servicio
GET    /{id}           # Obtener orden específica
PUT    /{id}           # Actualizar orden
PUT    /{id}/aprobar   # Aprobar orden (supervisor/admin)
PUT    /{id}/anular    # Anular orden con razón
POST   /{id}/agregar-item  # Agregar servicio adicional a orden
GET    /stats          # Estadísticas básicas
```

### **Tipos de Servicio (`/api/service-types`)**
```
GET    /               # Listar tipos (filtro: activo)
POST   /               # Crear tipo de servicio
GET    /{id}           # Obtener tipo específico
PUT    /{id}           # Actualizar tipo
DELETE /{id}           # Desactivar tipo
```

### **Reportes (`/api/reportes`)**
```
GET    /estadisticas   # KPIs completos (Power BI compatible)
GET    /               # Listar reportes (filtro: servicio_id)
POST   /               # Crear reporte técnico
GET    /{id}           # Obtener reporte específico
PUT    /{id}           # Actualizar reporte
DELETE /{id}           # Eliminar reporte (admin/supervisor)
```

---

## 🎨 **Arquitectura Frontend**

### **Patrones de Diseño:**

#### **1. Context API para Estado Global**
```javascript
// AuthContext.js
- Maneja autenticación
- Almacena usuario actual y token
- Métodos: login(), logout(), isAuthenticated

// ThemeContext.js
- Maneja tema claro/oscuro
- Persiste preferencia en localStorage
```

#### **2. Protected Routes**
```javascript
<ProtectedRoute allowedRoles={["admin", "supervisor"]}>
  <Users />
</ProtectedRoute>

// Verifica:
// - Usuario autenticado (token válido)
// - Rol autorizado para acceder
// - Redirige a /login si falla
```

#### **3. API Client con Interceptores**
```javascript
// Request Interceptor:
- Agrega token JWT automáticamente a todas las requests

// Response Interceptor:
- Detecta 401 (unauthorized)
- Limpia localStorage
- Redirige a login
```

### **Componentes Principales:**

#### **MainLayout**
```
┌─────────────────────────────────┐
│ Sidebar (collapsed/expanded)    │
│  • Logo                          │
│  • User info                     │
│  • Navigation menu               │
│  • Theme toggle                  │
│  • Logout                        │
├─────────────────────────────────┤
│         Main Content             │
│      {children}                  │
└─────────────────────────────────┘
```

#### **Páginas y Funcionalidades:**

1. **Dashboard.js**
   - KPIs: Total servicios, reportes, técnicos, tiempo promedio
   - Gráficas (Recharts):
     - Servicios por estado (BarChart)
     - Servicios por técnico (BarChart)
     - Cumplimiento de técnicos (LineChart)
   - Consume: `GET /api/reportes/estadisticas`

2. **Users.js**
   - Lista de usuarios con roles múltiples
   - Modal con checkboxes para asignar varios roles
   - Selector de rol principal
   - CRUD completo

3. **Services.js**
   - Gestión de órdenes de servicio
   - Formulario con ubicación, facturación, items adicionales
   - Filtros por estado
   - Acciones: Aprobar, Anular, Agregar Item

4. **Calendar.js**
   - FullCalendar con vista de 24h
   - Muestra servicios agendados
   - Leyenda de disponibilidad de técnicos
   - Colores por estado del servicio

5. **Reportes.js** ⭐ NUEVO
   - Formulario de reporte técnico completo
   - Selector de servicio (aprobados/en proceso)
   - Materiales: agregar dinámicamente con unidades
   - Fotos: múltiples uploads con preview y descripción
   - Firma digital: canvas interactivo con botones guardar/limpiar
   - Validaciones: campos obligatorios antes de submit

---

## 🔒 **Seguridad Implementada**

### **Backend:**
1. **Password Hashing:** bcrypt con salt
2. **JWT Tokens:** Expiración 7 días, secret key en .env
3. **Role-Based Access Control (RBAC):**
   ```python
   @router.post("", dependencies=[Depends(require_roles(["admin", "supervisor"]))])
   async def create_service(...):
   ```
4. **Validación de entrada:** Pydantic models en todos los endpoints
5. **CORS configurado** para permitir frontend
6. **Exclusión de datos sensibles:** `password_hash` nunca se envía en responses

### **Frontend:**
1. **Token en localStorage:** Se incluye automáticamente en headers
2. **Auto-logout en 401:** Interceptor de Axios
3. **Protected Routes:** Verificación de rol antes de renderizar
4. **Validación de formularios:** Antes de enviar al backend

---

## 🚀 **Deployment y Environment**

### **Variables de Entorno:**

**Backend (.env):**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=tecnonacho
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
```

**Frontend (.env):**
```bash
REACT_APP_BACKEND_URL=https://soporte-hispano.preview.emergentagent.com
```

### **Configuración de Servicios:**

**Supervisor:**
```ini
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001 --reload
directory=/app/backend

[program:frontend]
command=yarn start
directory=/app/frontend
environment=PORT=3000

[program:mongodb]
command=mongod --dbpath /data/db
```

**Nginx Ingress Rules:**
- `/api/*` → Backend :8001
- `/*` → Frontend :3000

---

## 📊 **Integración con Power BI**

### **Endpoint de Estadísticas:**
```
GET /api/reportes/estadisticas
Authorization: Bearer {token}

Response:
{
  "resumen": {
    "total_servicios": 150,
    "total_reportes": 120,
    "total_tecnicos": 8,
    "tiempo_promedio_horas": 2.5
  },
  "servicios_por_estado": {...},
  "servicios_por_tecnico": {...},
  "servicios_por_tipo": {...},
  "servicios_por_ubicacion": {...},
  "materiales_mas_consumidos": {...},
  "cumplimiento_tecnicos": [...],
  "servicios_por_mes": [...]
}
```

**Conexión desde Power BI:**
1. Usar conector "Web" o "API REST"
2. URL: `https://soporte-hispano.preview.emergentagent.com/api/reportes/estadisticas`
3. Headers: `Authorization: Bearer {token}`
4. Transformar JSON en tablas de Power Query

---

## 🧪 **Testing**

### **Framework de Testing:**
- **Backend:** pytest con fixtures
- **Frontend:** Playwright (automatizado)

### **Cobertura Actual:**
- ✅ Autenticación y autorización
- ✅ CRUD de usuarios (múltiples roles)
- ✅ CRUD de servicios con catálogo
- ✅ CRUD de reportes técnicos
- ✅ Endpoint de estadísticas
- ✅ Validaciones de formularios
- ✅ UI components rendering

**Test files:**
- `/app/backend/tests/test_services_fase2.py`
- `/app/backend/tests/test_users_roles_reportes.py`

---

## 📈 **Estado Actual del Proyecto**

### **✅ Completado (100%):**
- ✅ FASE 1: Autenticación y gestión de usuarios (con múltiples roles)
- ✅ FASE 2: Gestión de órdenes de servicio con catálogo
- ✅ FASE 3: Calendario propio con vista 24h
- ✅ FASE 4: Reportes técnicos con fotos y firma digital
- ✅ FASE 4: Dashboard de KPIs con gráficas

### **🟡 En Progreso:**
- 🟡 Generación de PDF para reportes (próximo)

### **🔵 Pendiente:**
- 🔵 FASE 5: Gestión de inventario de materiales
- 🔵 FASE 6: Chat en tiempo real (Socket.IO)
- 🔵 FASE 7: Notificaciones Email/SMS
- 🔵 FASE 8: Histórico y auditoría completo

---

## 🔧 **Comandos Útiles**

### **Desarrollo:**
```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.out.log

# Run tests
cd /app/backend && pytest tests/ -v

# Install dependencies
cd /app/backend && pip install package_name && pip freeze > requirements.txt
cd /app/frontend && yarn add package_name
```

### **Database:**
```bash
# Connect to MongoDB
mongosh tecnonacho

# Queries útiles
db.users.find({}, {password_hash: 0}).pretty()
db.services.countDocuments()
db.reportes.find({completado: false})
```

---

## 📞 **Información de Contacto**

**Desarrollado para:** Tecno Nacho SAS  
**Plataforma:** Emergent AI  
**Fecha:** Diciembre 2025  
**Preview URL:** https://soporte-hispano.preview.emergentagent.com

---

## 📝 **Notas Técnicas Importantes**

1. **MongoDB ObjectId:** Siempre excluir `_id` en queries usando `{"_id": 0}`
2. **Fechas:** Usar `datetime.now(timezone.utc)` para consistency
3. **Rutas API:** Todas deben tener prefijo `/api` para Kubernetes ingress
4. **Environment Variables:** NUNCA hardcodear URLs, puertos o credenciales
5. **Hot Reload:** Cambios en código se reflejan automáticamente
6. **Supervisor Restart:** Solo necesario para cambios en .env o nuevas dependencias

---

## 🎓 **Mejores Prácticas Implementadas**

✅ Separación de responsabilidades (models, routes, middleware)  
✅ Validación de datos con Pydantic  
✅ Manejo de errores consistente  
✅ Logging de todas las acciones importantes  
✅ UI responsiva (mobile-first con Tailwind)  
✅ Modo oscuro/claro  
✅ Accesibilidad (semantic HTML, ARIA labels)  
✅ Testing automatizado  
✅ Código documentado con comentarios  

---

## 🚀 **Próximos Pasos Recomendados**

1. Implementar generación de PDF para reportes
2. Agregar módulo de gestión de materiales/inventario
3. Implementar chat en tiempo real
4. Agregar notificaciones por email/SMS
5. Considerar migración a PostgreSQL para mejor performance

---

**Última actualización:** 5 de Diciembre, 2025  
**Mantenedor:** Equipo de desarrollo Tecno Nacho SAS

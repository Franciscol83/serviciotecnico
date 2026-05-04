# 📖 GUÍA COMPLETA: Flujo de Servicios - Tecno Nacho SAS

## 🔄 ESTADOS DEL SERVICIO

El sistema maneja 6 estados diferentes:

1. **pendiente_aprobacion** 🟡 - Servicio creado, esperando aprobación
2. **aprobado** 🟢 - Servicio aprobado, listo para asignar técnico
3. **en_proceso** 🔵 - Técnico trabajando en el servicio
4. **completado** ✅ - Servicio finalizado con reporte
5. **cancelado** ⛔ - Servicio cancelado antes de completar
6. **anulado** ❌ - Servicio anulado (problema administrativo)

---

## 📋 FLUJO COMPLETO PASO A PASO

### **PASO 1: CREAR SERVICIO** (Admin/Asesor/Supervisor)

#### 1.1 Acceder a la creación:
```
1. Ir a "📝 Servicios" en el menú
2. Click en botón "Crear Servicio" (esquina superior derecha)
```

#### 1.2 Llenar información del cliente (Estructura WorldOffice):
```
✅ Primer Nombre: Ej. Juan
✅ Segundo Nombre: Ej. Carlos (opcional)
✅ Primer Apellido: Ej. Pérez
✅ Segundo Apellido: Ej. González (opcional)
✅ Email: Ej. juan.perez@example.com
✅ Teléfono: Ej. 3001234567
✅ Dirección: Ej. Calle 123 #45-67, Bogotá
```

#### 1.3 Información de facturación (Servicios por fuera):
```
- Tipo Documento: Cédula / NIT / Pasaporte
- Número Documento: 1234567890
- Medio de Pago: Efectivo / Tarjeta / Transferencia
```

#### 1.4 Detalles del servicio:
```
✅ Tipo de Servicio: Seleccionar (Ej: "Configuración de PC")
✅ Observaciones: Descripción del problema
✅ Ubicación: "En local" o "Por fuera"
✅ Técnico Asignado: Seleccionar técnico
✅ Fecha Agendada: Seleccionar fecha/hora
✅ Recomendaciones: (Opcional)
```

#### 1.5 Agregar servicios adicionales (Opcional):
```
- Click en "+ Agregar Servicio Adicional"
- Seleccionar otro tipo de servicio
- Agregar observaciones
```

#### 1.6 Guardar:
```
✅ Click en "Crear Servicio"
📋 Se genera caso número automático: TN-2026-00001
🟡 Estado inicial: "pendiente_aprobacion"
```

---

### **PASO 2: APROBAR SERVICIO** (Admin/Supervisor)

#### 2.1 Ver servicios pendientes:
```
1. Ir a "📝 Servicios"
2. Ver lista de servicios
3. Buscar servicios con estado 🟡 "Pendiente Aprobación"
```

#### 2.2 Revisar y aprobar:
```
1. Click en el servicio para ver detalles
2. Revisar información del cliente y servicio
3. Click en "✅ Aprobar" (botón verde)
4. Confirmar aprobación
```

**Resultado:**
```
✅ Estado cambia a: "aprobado" 🟢
✅ Técnico recibe notificación (si configurado)
✅ Servicio aparece en lista de reportes disponibles
```

---

### **PASO 3: TÉCNICO INICIA TRABAJO** (Técnico)

#### 3.1 Ver servicios asignados:
```
1. Login como técnico
2. Ir a "📝 Servicios"
3. Ver solo servicios asignados a ti
4. Filtrar por estado "Aprobado" 🟢
```

#### 3.2 Cambiar estado a "En Proceso":
```
1. Click en el servicio
2. Click en "🔵 Iniciar Trabajo"
3. Confirmar
```

**Resultado:**
```
🔵 Estado cambia a: "en_proceso"
⏱️ Se registra fecha/hora de inicio
📱 Técnico puede comenzar a trabajar
```

---

### **PASO 4: CREAR REPORTE TÉCNICO** (Técnico)

#### 4.1 Acceder a crear reporte:
```
1. Ir a "📋 Reportes"
2. Click en "Crear Reporte"
```

#### 4.2 Seleccionar servicio:
```
✅ Filtro de búsqueda: Buscar por caso número o cliente
✅ Filtro de estado: Seleccionar "En Proceso" o "Aprobado"
✅ Contador muestra: "Mostrando X de Y servicios"
✅ Seleccionar servicio del dropdown
```

#### 4.3 Llenar información del reporte:
```
📝 Observaciones del Técnico:
   - Descripción detallada del trabajo realizado
   
⏱️ Tiempo Dedicado:
   - Horas trabajadas (Ej: 2.5 horas)
   
🔧 Trabajo Realizado:
   - Detalle técnico del trabajo
   
⚠️ Problemas Encontrados:
   - Cualquier inconveniente encontrado
   
💡 Recomendaciones:
   - Sugerencias para el cliente
```

#### 4.4 Agregar materiales consumidos:
```
1. Click en "+ Agregar Material"
2. Nombre: Ej. "Cable HDMI 2m"
3. Cantidad: Ej. 1
4. Precio Unitario: Ej. 25000
5. Precio Total: Se calcula automáticamente
6. Repetir para cada material
```

#### 4.5 Agregar fotos del trabajo:
```
Opción 1: 📸 Tomar Foto (Móvil)
   - Click en "Tomar Foto"
   - Permite usar cámara directamente
   
Opción 2: 📁 Subir Archivo
   - Click en "Subir Archivo"
   - Seleccionar múltiples fotos
   
✅ Máximo 5MB por foto
✅ Puedes subir múltiples fotos
```

#### 4.6 Firma digital del cliente:
```
1. Entregar dispositivo al cliente
2. Cliente firma en el área designada
3. Nombre del cliente: Confirmar nombre
4. Guardar firma
```

#### 4.7 Finalizar reporte:
```
✅ Verificar toda la información
✅ Click en "Guardar Reporte"
✅ Confirmar creación
```

**Resultado:**
```
✅ Reporte creado exitosamente
✅ Estado del servicio cambia a: "completado" ✅
✅ Se puede generar PDF del reporte
✅ Servicio desaparece de lista de "En Proceso"
✅ Aparece en estadísticas del Dashboard
```

---

### **PASO 5: VER SERVICIO COMPLETADO** (Admin/Supervisor)

#### 5.1 Ver servicios completados:
```
1. Ir a "📝 Servicios"
2. Filtrar o buscar servicio completado
3. Estado muestra: ✅ "Completado"
```

#### 5.2 Ver reporte asociado:
```
1. Click en el servicio
2. Ver detalles del reporte
3. Opción: "📄 Descargar PDF"
```

#### 5.3 Estadísticas actualizadas:
```
Dashboard muestra:
✅ Total Servicios: +1
✅ Reportes Completados: +1
✅ Tiempo Promedio: Actualizado
```

---

## 🔄 CAMBIOS DE ESTADO MANUALES

### **Cambiar Estado de Servicio:**

#### Desde la vista de Servicios:
```
1. Click en el servicio
2. Ver botones de acción según estado actual:
   
   Si está "Pendiente": 
   - ✅ Aprobar
   - ⛔ Cancelar
   
   Si está "Aprobado":
   - 🔵 Iniciar Trabajo
   - ⛔ Cancelar
   
   Si está "En Proceso":
   - ✅ Completar (si hay reporte)
   - ⛔ Cancelar
   
   Si está "Completado":
   - 📄 Ver/Descargar PDF
   - ❌ Anular (solo admin)
```

---

## 📊 RESUMEN DEL FLUJO

```
┌─────────────────────┐
│  1. CREAR SERVICIO  │ → 🟡 Pendiente Aprobación
│  (Admin/Asesor)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. APROBAR         │ → 🟢 Aprobado
│  (Admin/Supervisor) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. INICIAR TRABAJO │ → 🔵 En Proceso
│  (Técnico)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. CREAR REPORTE   │ → ✅ Completado
│  (Técnico)          │    (Automático)
└─────────────────────┘
```

---

## ⚠️ CASOS ESPECIALES

### **Cancelar un Servicio:**
```
¿Cuándo? Cliente cancela o no se puede realizar
¿Quién? Admin, Supervisor, Asesor
¿Cómo?
1. Abrir servicio
2. Click en "⛔ Cancelar"
3. Escribir motivo de cancelación
4. Confirmar
Resultado: Estado → "cancelado" ⛔
```

### **Anular un Servicio:**
```
¿Cuándo? Error administrativo, facturación incorrecta
¿Quién? Solo Admin
¿Cómo?
1. Abrir servicio completado
2. Click en "❌ Anular"
3. Escribir motivo de anulación
4. Confirmar
Resultado: Estado → "anulado" ❌
```

---

## 🎯 TUS 21 SERVICIOS ACTUALES

### **Estado Actual:**
```
✅ Total: 21 servicios
🔵 En Proceso: 3 servicios
❓ Resto: 18 servicios (otros estados)
✅ Completados: 0 (necesitan reporte)
```

### **Para Finalizar los 3 en Proceso:**

**Opción 1: Crear reportes reales**
```
1. Ir a "📋 Reportes"
2. Click "Crear Reporte"
3. Seleccionar cada servicio "En Proceso"
4. Llenar información real del trabajo
5. Agregar fotos y firma
6. Guardar
→ Estado cambia automáticamente a "Completado" ✅
```

**Opción 2: Completar manualmente (sin reporte)**
```
1. Ir a "📝 Servicios"
2. Buscar servicio "En Proceso"
3. Click en el servicio
4. Click en "✅ Marcar como Completado"
5. Confirmar
→ Estado cambia a "Completado" ✅
(Sin reporte asociado)
```

---

## 🧪 PRUEBAS COMPLETAS RECOMENDADAS

### **DÍA 1: Testing de Servicios (Hoy)**

**1. Crear Servicio Completo (30 min):**
```
✅ Crear servicio nuevo
✅ Verificar estructura WorldOffice (nombres separados)
✅ Asignar técnico
✅ Agendar fecha
✅ Verificar aparece en lista
```

**2. Aprobar y Procesar (20 min):**
```
✅ Aprobar el servicio creado
✅ Cambiar a "En Proceso"
✅ Verificar cambios de estado
```

**3. Crear Reporte Completo (45 min):**
```
✅ Ir a Reportes
✅ Seleccionar servicio con filtro/búsqueda
✅ Llenar todos los campos
✅ Agregar material consumido
✅ Subir 2-3 fotos
✅ Agregar firma digital
✅ Guardar y verificar estado → "Completado"
```

**4. Verificar Dashboard (10 min):**
```
✅ Ver estadísticas actualizadas
✅ Verificar contadores
✅ Verificar tiempo promedio
```

**5. Completar los 3 servicios pendientes (30 min):**
```
✅ Crear reportes para los 3 servicios "En Proceso"
✅ Verificar que cambien a "Completado"
✅ Total completados: 4 (1 nuevo + 3 existentes)
```

### **DÍA 2: Deployment y Chat (Mañana)**

**1. Preparación Deployment (1 hora):**
```
✅ Configurar MongoDB Atlas
✅ Obtener connection string
✅ Preparar variables de entorno
✅ Revisar documentación DEPLOYMENT_HOSTINGER.md
```

**2. Testing de Chat (1 hora):**
```
✅ Probar envío de mensajes
✅ Verificar Socket.IO en tiempo real
✅ Testing con 2 usuarios simultáneos
✅ Verificar notificaciones de lectura
```

**3. Deployment a Hostinger (2 horas):**
```
✅ Subir código al servidor
✅ Instalar dependencias
✅ Configurar Nginx
✅ Configurar SSL
✅ Probar en producción
```

---

## 📱 PRUEBA EN MÓVIL (PWA)

```
1. Abrir desde celular: https://soporte-hispano.preview.emergentagent.com
2. Login como técnico
3. Ir a Reportes
4. Crear reporte:
   ✅ Usar filtro de búsqueda
   ✅ Tomar foto directa con cámara 📸
   ✅ Agregar firma digital
   ✅ Guardar
5. Verificar funcionamiento offline (si configurado)
```

---

## 🆘 AYUDA RÁPIDA

### **No puedo cambiar estado de servicio:**
```
→ Verificar tu rol (Admin, Supervisor, etc.)
→ Algunos cambios requieren permisos específicos
```

### **No aparece servicio en Reportes:**
```
→ Verificar que esté en estado "Aprobado" o "En Proceso"
→ Usar filtro de búsqueda por caso número
→ Verificar filtro de estado
```

### **No puedo subir fotos:**
```
→ Verificar tamaño (máx 5MB)
→ En móvil: Dar permisos de cámara
→ Usar botón "📸 Tomar Foto" en móvil
```

---

## ✅ CHECKLIST DE TESTING COMPLETO

**Antes de Deployment:**
- [ ] Crear servicio con estructura WorldOffice
- [ ] Aprobar servicio
- [ ] Cambiar a "En Proceso"
- [ ] Crear reporte completo (con fotos y firma)
- [ ] Verificar estado cambia a "Completado"
- [ ] Descargar PDF del reporte
- [ ] Verificar Dashboard actualizado
- [ ] Probar filtros y búsqueda
- [ ] Probar en móvil (responsive)
- [ ] Completar los 3 servicios pendientes
- [ ] Verificar Chat carga sin errores
- [ ] Todas las páginas funcionan correctamente

---

**¡Listo para comenzar las pruebas!** 🚀

Si tienes alguna duda en cualquier paso, avísame y te ayudo. 😊

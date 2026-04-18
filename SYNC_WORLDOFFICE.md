# 🔄 Sincronización Programada WorldOffice

## Descripción

Sistema de sincronización batch que ejecuta cada 12 horas para mantener sincronizados los datos entre WorldOffice (SQL Server) y MongoDB.

---

## 🎯 Qué se Sincroniza

### WorldOffice → MongoDB (Lectura)

1. **Clientes**
   - Código, nombre, NIT, dirección, teléfono, email, ciudad
   - Se guardan en colección: `clientes_worldoffice`
   - Identificador único: NIT

2. **Productos/Servicios**
   - Código, nombre, descripción, precio venta, stock, IVA
   - Se guardan en colección: `productos_worldoffice`
   - Identificador único: Código

3. **Inventario**
   - Stock actual de productos
   - Actualiza items de inventario que tengan `codigo_worldoffice`
   - Sincroniza: cantidad, precio_unitario

### MongoDB → WorldOffice (Escritura - Futuro)

4. **Servicios Completados** *(Pendiente de implementar)*
   - Exportar servicios completados para facturación
   - Requiere permisos de escritura en WorldOffice

---

## ⚙️ Configuración

### Archivos Principales

```
/app/backend/
├── scripts/
│   ├── sync_worldoffice.py     # Script principal de sincronización
│   ├── run_sync.sh              # Wrapper bash para cron
│   └── worldoffice_cron         # Configuración de cron job
├── .env.worldoffice             # Credenciales WorldOffice
└── logs/
    ├── sync_worldoffice.log     # Log detallado de sincronización
    └── cron_sync.log            # Log de ejecuciones cron
```

### Variables de Entorno (.env.worldoffice)

```bash
SQLSERVER_HOST=SERTECNO
SQLSERVER_INSTANCE=WORLDOFFICE14
SQLSERVER_DATABASE=Melissa_2023
SQLSERVER_USER=Jabes
SQLSERVER_PASSWORD=Jabes2026
SQLSERVER_ENCRYPT=false
SQLSERVER_TRUST_CERT=true
```

---

## 📅 Horario de Sincronización

**Por defecto:** Cada 12 horas
- 2:00 AM
- 2:00 PM

**Archivo cron:** `/app/backend/scripts/worldoffice_cron`

```cron
# Ejecutar a las 2:00 AM y 2:00 PM todos los días
0 2,14 * * * /app/backend/scripts/run_sync.sh >> /app/logs/cron_sync.log 2>&1
```

### Cambiar Frecuencia

Edita `worldoffice_cron` según necesites:

```cron
# Cada 6 horas (4 veces al día)
0 */6 * * * /app/backend/scripts/run_sync.sh

# Cada hora (testing)
0 * * * * /app/backend/scripts/run_sync.sh

# Solo de lunes a viernes a las 8 AM
0 8 * * 1-5 /app/backend/scripts/run_sync.sh

# Cada 24 horas a las 3 AM
0 3 * * * /app/backend/scripts/run_sync.sh
```

---

## 🚀 Instalación y Activación

### 1. Instalar Cron Job

```bash
# Copiar archivo de configuración
sudo cp /app/backend/scripts/worldoffice_cron /etc/cron.d/worldoffice-sync

# Dar permisos correctos
sudo chmod 0644 /etc/cron.d/worldoffice-sync

# Reiniciar cron
sudo service cron restart

# Verificar que está instalado
crontab -l
```

### 2. Crear Directorios de Logs

```bash
mkdir -p /app/logs
chmod 755 /app/logs
```

### 3. Probar Sincronización Manual

```bash
# Ejecutar sincronización inmediata
/app/backend/scripts/run_sync.sh

# Ver log en tiempo real
tail -f /app/logs/sync_worldoffice.log
```

---

## 📊 Endpoints API

### Sincronización Manual (POST)

**Solo Admin**

```bash
POST /api/worldoffice/sync/manual
Authorization: Bearer YOUR_TOKEN
```

Respuesta:
```json
{
  "message": "Sincronización iniciada en segundo plano",
  "pid": 12345,
  "info": "Revisa /app/logs/sync_worldoffice.log para ver el progreso"
}
```

### Ver Logs de Sincronización (GET)

**Admin y Supervisor**

```bash
GET /api/worldoffice/sync/logs?limit=10
Authorization: Bearer YOUR_TOKEN
```

Respuesta:
```json
{
  "total": 10,
  "logs": [
    {
      "fecha": "2025-12-20T02:00:00Z",
      "tipo": "sincronizacion_worldoffice",
      "exitoso": true,
      "estadisticas": {
        "clientes_sincronizados": 450,
        "productos_sincronizados": 320,
        "inventario_actualizado": 25,
        "servicios_exportados": 0,
        "errores": []
      }
    }
  ]
}
```

---

## 🔍 Monitoreo

### Ver Log en Tiempo Real

```bash
tail -f /app/logs/sync_worldoffice.log
```

### Ver Últimas Ejecuciones Cron

```bash
tail -f /app/logs/cron_sync.log
```

### Consultar Estado en MongoDB

```javascript
// Logs de sincronización
db.logs_sincronizacion.find().sort({fecha: -1}).limit(5)

// Clientes sincronizados
db.clientes_worldoffice.countDocuments()

// Ver último cliente sincronizado
db.clientes_worldoffice.find().sort({ultima_sync: -1}).limit(1)
```

---

## 🐛 Troubleshooting

### Problema: Cron no se ejecuta

**Verificar:**
```bash
# Ver si cron está corriendo
sudo service cron status

# Ver logs del sistema
sudo tail -f /var/log/syslog | grep CRON

# Verificar permisos del script
ls -la /app/backend/scripts/run_sync.sh
```

**Solución:**
```bash
chmod +x /app/backend/scripts/run_sync.sh
sudo service cron restart
```

### Problema: Error de conexión a WorldOffice

**Verificar:**
1. Servidor SERTECNO accesible desde red
2. SQL Server está corriendo
3. Puerto 1433 abierto
4. Credenciales correctas en `.env.worldoffice`

**Probar conexión:**
```bash
# Ejecutar script manualmente para ver errores
cd /app/backend
python3 scripts/sync_worldoffice.py
```

### Problema: Error de conexión a MongoDB

**Verificar:**
```bash
# Probar conexión
mongo --eval "db.adminCommand('ping')"

# Ver variable MONGO_URL
cat /app/backend/.env | grep MONGO_URL
```

---

## 📈 Estadísticas de Sincronización

Cada sincronización guarda estadísticas en MongoDB:

```javascript
{
  "fecha": ISODate("2025-12-20T02:00:00Z"),
  "tipo": "sincronizacion_worldoffice",
  "exitoso": true,
  "estadisticas": {
    "clientes_sincronizados": 450,
    "productos_sincronizados": 320,
    "inventario_actualizado": 25,
    "servicios_exportados": 0,
    "errores": []
  }
}
```

### Dashboard de Sincronización (Futuro)

Puedes crear un dashboard en el frontend mostrando:
- Última sincronización
- Total de clientes/productos sincronizados
- Gráfico de sincronizaciones exitosas/fallidas
- Errores recientes

---

## 🔐 Seguridad

1. **Solo Lectura:** Por defecto, solo se lee de WorldOffice
2. **Credenciales:** Guardadas en `.env.worldoffice` (NO subir a Git)
3. **Permisos API:** Solo Admin puede ejecutar sync manual
4. **Logs:** Guardados localmente, accesibles solo por admin

---

## ✅ Checklist de Deployment

- [ ] Archivo `.env.worldoffice` configurado
- [ ] Driver ODBC instalado (`unixodbc`)
- [ ] Directorio `/app/logs` creado
- [ ] Script `run_sync.sh` ejecutable
- [ ] Cron job instalado en `/etc/cron.d/`
- [ ] Cron service reiniciado
- [ ] Primera sincronización manual exitosa
- [ ] Logs verificados
- [ ] Conexión WorldOffice confirmada
- [ ] MongoDB con colecciones creadas

---

## 🎯 Próximas Mejoras

1. **Escritura en WorldOffice:**
   - Crear pre-facturas automáticamente
   - Enviar servicios completados

2. **Sincronización Inteligente:**
   - Solo sincronizar cambios (delta)
   - Detección de conflictos

3. **Notificaciones:**
   - Email cuando sincronización falla
   - Alertas de errores críticos

4. **Dashboard:**
   - Ver estado de sincronización en tiempo real
   - Estadísticas visuales

---

## 📞 Soporte

Para problemas con la sincronización:
1. Revisar logs: `/app/logs/sync_worldoffice.log`
2. Ejecutar sincronización manual para debugging
3. Verificar conectividad con WorldOffice
4. Contactar administrador de WorldOffice para permisos

**Logs importantes:**
- `/app/logs/sync_worldoffice.log` - Detalle de sincronización
- `/app/logs/cron_sync.log` - Ejecuciones cron
- `/var/log/syslog` - Logs del sistema (cron)

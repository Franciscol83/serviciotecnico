# 🚀 Guía de Deployment en Hostinger - Tecno Nacho SAS

**Fecha:** Diciembre 2025  
**Aplicación:** Sistema de Gestión de Servicios Técnicos  
**Stack:** React (Frontend) + FastAPI (Backend) + MongoDB

---

## 📋 Requisitos Previos en Hostinger

### 1. Servicios Necesarios
- ✅ **VPS o Cloud Hosting** (Node.js + Python compatible)
- ✅ **MongoDB** (puede ser MongoDB Atlas o instalado en el VPS)
- ✅ **Dominio configurado** (ej: tudominio.com)
- ✅ **Certificado SSL** (Let's Encrypt)

### 2. Accesos que Necesitas
- SSH al servidor
- Panel de control de Hostinger
- Acceso a DNS para configurar subdominios (opcional)

---

## 🔧 PASO 1: Configurar Variables de Entorno

### Backend (.env)
Crea el archivo `/app/backend/.env` con:

```env
# Base de Datos
MONGO_URL="mongodb://tu-usuario:tu-password@tu-servidor:27017/tecnonacho_db"
DB_NAME="tecnonacho_db"

# CORS - Usa tu dominio de producción
CORS_ORIGINS="https://tudominio.com,https://www.tudominio.com"

# Entorno
ENVIRONMENT="production"

# JWT Secret (CAMBIA ESTE VALOR)
JWT_SECRET="tu-secreto-super-seguro-aqui-minimo-32-caracteres"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS=24
```

**⚠️ IMPORTANTE:**
- Reemplaza `MONGO_URL` con tu string de conexión real
- Cambia `JWT_SECRET` por un valor único y seguro
- Actualiza `CORS_ORIGINS` con tu dominio real

### Frontend (.env)
Crea el archivo `/app/frontend/.env` con:

```env
# URL del Backend en Producción
REACT_APP_BACKEND_URL=https://tudominio.com

# Configuración de WebSocket (si aplica)
WDS_SOCKET_PORT=443

# Health Check
ENABLE_HEALTH_CHECK=false
```

**⚠️ IMPORTANTE:**
- `REACT_APP_BACKEND_URL` debe apuntar a tu dominio donde estará el backend

---

## 🗄️ PASO 2: Configurar MongoDB

### Opción A: MongoDB Atlas (Recomendado)
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Configura usuario y contraseña
4. Whitelist IP del servidor Hostinger
5. Obtén el string de conexión:
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/tecnonacho_db
   ```
6. Úsalo en `MONGO_URL`

### Opción B: MongoDB en el mismo VPS
```bash
# Instalar MongoDB en Ubuntu/Debian
sudo apt update
sudo apt install mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# String de conexión local:
MONGO_URL="mongodb://localhost:27017/tecnonacho_db"
```

---

## 📦 PASO 3: Preparar el Código

### 3.1 Build del Frontend
```bash
cd /ruta/a/tu/proyecto/frontend
yarn install
yarn build
```

Esto creará una carpeta `build/` con archivos estáticos optimizados.

### 3.2 Preparar Backend
```bash
cd /ruta/a/tu/proyecto/backend
pip install -r requirements.txt
```

---

## 🌐 PASO 4: Configurar Nginx (Servidor Web)

Crea el archivo `/etc/nginx/sites-available/tecnonacho`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Frontend (archivos estáticos de React)
    location / {
        root /var/www/tecnonacho/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Backend API (proxy a FastAPI)
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Tamaño máximo de archivos (para subida de fotos)
    client_max_body_size 20M;
}
```

**Activar el sitio:**
```bash
sudo ln -s /etc/nginx/sites-available/tecnonacho /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 PASO 5: Certificado SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot configurará automáticamente SSL en Nginx.

---

## 🚀 PASO 6: Configurar Servicios Systemd

### Backend (FastAPI) - `/etc/systemd/system/tecnonacho-backend.service`

```ini
[Unit]
Description=Tecno Nacho Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/tecnonacho/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Activar el servicio:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable tecnonacho-backend
sudo systemctl start tecnonacho-backend
sudo systemctl status tecnonacho-backend
```

---

## ✅ PASO 7: Verificar Deployment

### 7.1 Verificar Backend
```bash
curl https://tudominio.com/api/health
# Debería retornar: {"status":"healthy"}
```

### 7.2 Verificar Frontend
- Abre `https://tudominio.com` en el navegador
- Login con: `admin@tecnonacho.com` / `admin123`
- Verifica que puedas navegar por todas las secciones

### 7.3 Verificar Cookies httpOnly
- Abre DevTools → Application → Cookies
- Deberías ver `access_token` con `HttpOnly ✓`

---

## 🔄 PASO 8: Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
# 1. Pull cambios del repositorio
cd /var/www/tecnonacho
git pull origin main

# 2. Rebuild frontend
cd frontend
yarn install
yarn build

# 3. Reiniciar backend
cd ../backend
pip install -r requirements.txt
sudo systemctl restart tecnonacho-backend

# 4. Recargar Nginx (si cambió configuración)
sudo systemctl reload nginx
```

---

## 📊 PASO 9: Monitoreo y Logs

### Ver logs del backend:
```bash
sudo journalctl -u tecnonacho-backend -f
```

### Ver logs de Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Ver status de servicios:
```bash
sudo systemctl status tecnonacho-backend
sudo systemctl status nginx
sudo systemctl status mongod  # Si usas MongoDB local
```

---

## 🛡️ PASO 10: Seguridad Adicional

### 10.1 Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 10.2 Backup Automático de MongoDB
```bash
# Crear script de backup en /usr/local/bin/backup-mongo.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URL" --out=/backups/mongo_$DATE
find /backups -type d -mtime +7 -delete  # Eliminar backups antiguos
```

Agregar a crontab (daily a las 2 AM):
```bash
0 2 * * * /usr/local/bin/backup-mongo.sh
```

---

## 📝 Checklist Final Pre-Deploy

- [ ] Variables de entorno configuradas (backend + frontend)
- [ ] MongoDB accesible y funcionando
- [ ] Certificado SSL instalado
- [ ] Nginx configurado y corriendo
- [ ] Backend service corriendo en systemd
- [ ] Frontend buildeado y servido por Nginx
- [ ] CORS configurado con dominio correcto
- [ ] JWT_SECRET cambiado por valor seguro
- [ ] Firewall configurado
- [ ] Logs accesibles y monitoreados
- [ ] Backup de base de datos configurado

---

## 🆘 Troubleshooting Común

### Error: "CORS policy blocked"
**Solución:** Verifica que `CORS_ORIGINS` en backend/.env tenga tu dominio exacto.

### Error: "502 Bad Gateway"
**Solución:** El backend no está corriendo. Verifica:
```bash
sudo systemctl status tecnonacho-backend
sudo journalctl -u tecnonacho-backend -n 50
```

### Error: "Cannot connect to MongoDB"
**Solución:** Verifica MONGO_URL y que MongoDB esté corriendo:
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('ping')"
```

### Login no funciona (cookie no se setea)
**Solución:** Verifica que:
- SSL está activo (HTTPS)
- `ENVIRONMENT=production` en backend/.env
- Dominio en `CORS_ORIGINS` coincide con el usado en el navegador

---

## 📞 Contacto y Soporte

**Desarrollado por:** Emergent AI  
**Email Soporte:** soporte@tecnonacho.com  
**Documentación Técnica:** `/app/ARQUITECTURA_TECNONACHO.md`

---

**✅ ¡Tu aplicación está lista para producción!**

Una vez completados estos pasos, tu equipo podrá acceder a la aplicación desde cualquier navegador en:
- **Frontend:** https://tudominio.com
- **API:** https://tudominio.com/api

**Credenciales iniciales:**
- **Admin:** admin@tecnonacho.com / admin123
- **Nota:** Cambia estas credenciales inmediatamente después del primer login.

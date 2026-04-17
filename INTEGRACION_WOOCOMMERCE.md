# Integración WooCommerce - Tecno Nacho

## 📦 Información del Sitio Web

**URL:** https://tecnonacho.com/shop/  
**Plataforma:** Hostinger + WooCommerce  
**Tema:** Mac Flury  

---

## 🔌 API de WooCommerce

WooCommerce incluye una API REST nativa que nos permitirá sincronizar productos e inventario.

### **Endpoints Disponibles:**

**Base URL:** `https://tecnonacho.com/wp-json/wc/v3/`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/products` | GET | Listar productos |
| `/products/{id}` | GET | Obtener producto específico |
| `/products` | POST | Crear producto |
| `/products/{id}` | PUT | Actualizar producto |
| `/products/categories` | GET | Categorías de productos |
| `/system_status` | GET | Estado del sistema |

---

## 🔑 Credenciales Necesarias

Para conectarnos a la API de WooCommerce necesitamos:

### **1. Consumer Key**
- Se genera desde: WooCommerce → Settings → Advanced → REST API
- Formato: `ck_xxxxxxxxxxxxxxxxxxxx`

### **2. Consumer Secret**  
- Se genera junto con el Consumer Key
- Formato: `cs_xxxxxxxxxxxxxxxxxxxx`

### **3. Permisos**
- Read/Write access (para sincronización completa)

---

## 📋 Pasos para Obtener las Credenciales

**El programador de la web debe:**

1. Iniciar sesión en WordPress Admin: `https://tecnonacho.com/wp-admin`
2. Ir a: **WooCommerce** → **Ajustes** → **Avanzado** → **API REST**
3. Click en **Agregar clave**
4. Configurar:
   - **Descripción:** "Integración Sistema Gestión Tecno Nacho"
   - **Usuario:** Seleccionar un administrador
   - **Permisos:** **Lectura/Escritura**
5. Click en **Generar clave API**
6. **Copiar y guardar** el Consumer Key y Consumer Secret

⚠️ **Importante:** El Consumer Secret solo se muestra una vez. Debe copiarse inmediatamente.

---

## 🚀 Funcionalidades de Integración Propuestas

### **Fase 1: Sincronización de Productos**
- Importar catálogo de productos desde WooCommerce
- Sincronizar imágenes, descripciones, especificaciones
- Actualizar precios automáticamente

### **Fase 2: Sincronización de Inventario**
- Stock en tiempo real
- Alertas cuando stock bajo en la web
- Actualizar stock de web cuando se consume material

### **Fase 3: Creación de Órdenes**
- Crear órdenes en WooCommerce desde el sistema de gestión
- Sincronizar estados de órdenes
- Exportar reportes técnicos como notas de la orden

---

## 💻 Implementación Técnica

### **Backend (Python/FastAPI)**

```python
import requests
from requests.auth import HTTPBasicAuth

# Configuración
WOOCOMMERCE_URL = "https://tecnonacho.com/wp-json/wc/v3/"
CONSUMER_KEY = os.environ.get('WOOCOMMERCE_CONSUMER_KEY')
CONSUMER_SECRET = os.environ.get('WOOCOMMERCE_CONSUMER_SECRET')

# Obtener productos
def get_products():
    response = requests.get(
        f"{WOOCOMMERCE_URL}products",
        auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET),
        params={"per_page": 100}
    )
    return response.json()

# Actualizar stock
def update_stock(product_id, quantity):
    response = requests.put(
        f"{WOOCOMMERCE_URL}products/{product_id}",
        auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET),
        json={"stock_quantity": quantity}
    )
    return response.json()
```

### **Frontend**

```javascript
// Botón "Ver en Tienda Web"
<a 
  href={`https://tecnonacho.com/producto/${material.slug}`}
  target="_blank"
  className="btn-primary"
>
  Ver en Catálogo Web
</a>
```

---

## 📊 Mapeo de Datos

### **Producto WooCommerce → Material Inventario**

| Campo WooCommerce | Campo Sistema Gestión |
|-------------------|----------------------|
| `id` | `woocommerce_id` |
| `name` | `nombre` |
| `description` | `descripcion` |
| `sku` | `codigo_sku` |
| `price` | `precio_unitario` |
| `stock_quantity` | `cantidad_stock` |
| `images[0].src` | `imagen_url` |
| `permalink` | `url_producto_web` |
| `categories` | `categoria` |

---

## ⏱️ Sincronización Automática

### **Opción 1: Webhook (Recomendado)**
WooCommerce puede enviar webhooks cuando:
- Se actualiza el stock
- Se crea/modifica un producto
- Se realiza una venta

**Configuración:** WooCommerce → Settings → Advanced → Webhooks

### **Opción 2: Cron Job**
- Sincronización cada X horas
- Más simple pero menos eficiente

---

## 🔒 Seguridad

- ✅ Credenciales almacenadas en variables de entorno (`.env`)
- ✅ HTTPS obligatorio para todas las peticiones
- ✅ Rate limiting: max 100 peticiones/minuto
- ✅ Validación de firmas de webhook

---

## 📝 Checklist de Implementación

- [ ] Obtener Consumer Key y Consumer Secret del programador
- [ ] Agregar credenciales a `.env` del backend
- [ ] Crear modelo `WooCommerceProduct` en el backend
- [ ] Implementar endpoint de sincronización `/api/inventario/sync-woocommerce`
- [ ] Crear comando de importación inicial
- [ ] Configurar webhooks en WooCommerce
- [ ] Probar sincronización de stock bidireccional
- [ ] Documentar proceso para el equipo

---

## 📞 Contacto

**Programador web:** [Pendiente nombre/contacto]  
**Solicitar acceso a:** WooCommerce API REST  

---

**Última actualización:** Diciembre 2025  
**Estado:** ⏳ Esperando credenciales de acceso

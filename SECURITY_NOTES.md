# Notas de Seguridad - Tecno Nacho SAS

## ⚠️ Almacenamiento de Tokens en localStorage

### Estado Actual
Actualmente, los tokens JWT se almacenan en `localStorage` para mantener la sesión del usuario.

**Archivos afectados:**
- `/app/frontend/src/contexts/AuthContext.js` - Líneas 17, 22, 45
- `/app/frontend/src/api/client.js` - Línea 17

### Vulnerabilidad
`localStorage` es vulnerable a ataques XSS (Cross-Site Scripting). Si un atacante logra inyectar código malicioso en la aplicación, puede robar los tokens almacenados.

### Recomendaciones de Mejora para Producción

#### Opción 1: Cookies HttpOnly (Más Segura) ⭐
```javascript
// Backend: Configurar cookie en la respuesta
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,  // No accesible desde JavaScript
    secure=True,    // Solo HTTPS
    samesite="strict",  // Protección CSRF
    max_age=7*24*60*60  // 7 días
)

// Frontend: El navegador envía automáticamente la cookie
// No necesitas almacenar el token manualmente
```

**Ventajas:**
- ✅ Protección contra XSS
- ✅ Protección contra CSRF (con samesite)
- ✅ Tokens no accesibles desde JavaScript

**Desventajas:**
- ⚠️ Requiere configurar CORS correctamente
- ⚠️ Más complejo en arquitecturas de microservicios

#### Opción 2: sessionStorage (Mejor que localStorage)
```javascript
// Usar sessionStorage en lugar de localStorage
sessionStorage.setItem('token', token);

// Se borra automáticamente al cerrar el navegador
```

**Ventajas:**
- ✅ Se limpia automáticamente al cerrar el navegador
- ✅ Menos persistente que localStorage

**Desventajas:**
- ⚠️ Aún vulnerable a XSS
- ⚠️ Usuario debe volver a iniciar sesión en cada pestaña nueva

#### Opción 3: Content Security Policy (CSP)
Implementar CSP headers para mitigar XSS:

```python
# Backend: server.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregar CSP headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

### Plan de Implementación Recomendado

**Fase 1 - Corto Plazo (Mejoras inmediatas):**
1. ✅ Implementar CSP headers
2. ✅ Validar y sanitizar todas las entradas de usuario
3. ✅ Usar HTTPS en producción

**Fase 2 - Mediano Plazo (Migración segura):**
1. Migrar a cookies `httpOnly` para tokens de autenticación
2. Implementar refresh tokens con corta duración
3. Agregar rate limiting en endpoints de autenticación

**Fase 3 - Largo Plazo (Hardening):**
1. Auditoría de seguridad completa
2. Penetration testing
3. Monitoreo de seguridad en producción

### Referencias
- [OWASP: Token Storage Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN: HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Última actualización:** Diciembre 2025  
**Estado:** ⚠️ En revisión - Mejoras de seguridad pendientes para producción

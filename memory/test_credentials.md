# Credenciales de Prueba - Tecno Nacho SAS

## Usuario Administrador
- **Email:** `admin@tecnonacho.com`
- **Contraseña:** `admin123`
- **Rol:** admin

## Tipo de autenticación
- Cookie httpOnly (no JWT en localStorage)
- Para tests con curl: usar `-c cookies.txt` en login y `-b cookies.txt` en requests subsiguientes

## URLs
- Frontend: `https://soporte-hispano.preview.emergentagent.com`
- Backend API base: `https://soporte-hispano.preview.emergentagent.com/api`
- Login endpoint: `POST /api/auth/login`

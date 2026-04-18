from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from datetime import datetime, timezone

# Importar rutas
from routes import auth, users, services, service_types, reportes, inventario, worldoffice, chat

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Tecno Nacho SAS - API", version="2.0.0")

# Socket.IO Server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses for enhanced security"""
    response = await call_next(request)
    
    # Content Security Policy - Protects against XSS attacks
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://soporte-hispano.preview.emergentagent.com;"
    )
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # XSS protection (legacy browsers)
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions policy
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Tecno Nacho SAS API - Sistema de Gestión de Servicio Técnico", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(service_types.router)
api_router.include_router(services.router)
api_router.include_router(reportes.router)
api_router.include_router(inventario.router)
api_router.include_router(worldoffice.router)
api_router.include_router(chat.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    """Cliente conectado a Socket.IO"""
    logger.info(f"Cliente conectado: {sid}")

@sio.event
async def disconnect(sid):
    """Cliente desconectado de Socket.IO"""
    logger.info(f"Cliente desconectado: {sid}")
    # Actualizar estado offline en DB
    try:
        usuarios_online = await db.usuarios_online.find_one({"socket_id": sid})
        if usuarios_online:
            await db.usuarios_online.update_one(
                {"socket_id": sid},
                {"$set": {"online": False, "ultimo_visto": datetime.now(timezone.utc)}}
            )
    except Exception as e:
        logger.error(f"Error actualizando estado offline: {e}")

@sio.event
async def authenticate(sid, data):
    """Autenticar usuario en Socket.IO"""
    try:
        usuario_id = data.get('usuario_id')
        if not usuario_id:
            await sio.emit('error', {'message': 'usuario_id requerido'}, room=sid)
            return
        
        # Registrar usuario online
        await db.usuarios_online.update_one(
            {"usuario_id": usuario_id},
            {
                "$set": {
                    "socket_id": sid,
                    "online": True,
                    "ultimo_visto": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
        await sio.emit('authenticated', {'usuario_id': usuario_id}, room=sid)
        logger.info(f"Usuario autenticado: {usuario_id} (sid: {sid})")
    except Exception as e:
        logger.error(f"Error en authenticate: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def send_message(sid, data):
    """Enviar mensaje en tiempo real"""
    try:
        destinatario_id = data.get('destinatario_id')
        mensaje = data.get('mensaje')
        
        # Buscar socket del destinatario
        destinatario_online = await db.usuarios_online.find_one({"usuario_id": destinatario_id})
        
        if destinatario_online and destinatario_online.get('online'):
            # Enviar mensaje al destinatario
            await sio.emit('new_message', mensaje, room=destinatario_online['socket_id'])
        
        # Confirmar entrega al remitente
        await sio.emit('message_delivered', {'mensaje_id': mensaje.get('id')}, room=sid)
        
    except Exception as e:
        logger.error(f"Error en send_message: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def typing(sid, data):
    """Usuario está escribiendo"""
    try:
        destinatario_id = data.get('destinatario_id')
        remitente_id = data.get('remitente_id')
        
        destinatario_online = await db.usuarios_online.find_one({"usuario_id": destinatario_id})
        
        if destinatario_online and destinatario_online.get('online'):
            await sio.emit('user_typing', {'remitente_id': remitente_id}, room=destinatario_online['socket_id'])
    except Exception as e:
        logger.error(f"Error en typing: {e}")

@sio.event
async def stop_typing(sid, data):
    """Usuario dejó de escribir"""
    try:
        destinatario_id = data.get('destinatario_id')
        remitente_id = data.get('remitente_id')
        
        destinatario_online = await db.usuarios_online.find_one({"usuario_id": destinatario_id})
        
        if destinatario_online and destinatario_online.get('online'):
            await sio.emit('user_stop_typing', {'remitente_id': remitente_id}, room=destinatario_online['socket_id'])
    except Exception as e:
        logger.error(f"Error en stop_typing: {e}")

@sio.event
async def message_read(sid, data):
    """Marcar mensaje como leído"""
    try:
        mensaje_id = data.get('mensaje_id')
        remitente_id = data.get('remitente_id')
        
        # Buscar socket del remitente para notificarle
        remitente_online = await db.usuarios_online.find_one({"usuario_id": remitente_id})
        
        if remitente_online and remitente_online.get('online'):
            await sio.emit('message_read_receipt', {'mensaje_id': mensaje_id}, room=remitente_online['socket_id'])
    except Exception as e:
        logger.error(f"Error en message_read: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Montar Socket.IO como aplicación ASGI
socket_app = socketio.ASGIApp(sio, app)
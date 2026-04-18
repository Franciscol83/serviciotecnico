"""
Modelos para Chat y Mensajería
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Mensaje(BaseModel):
    """Modelo de mensaje de chat"""
    id: str
    conversacion_id: str
    remitente_id: str
    remitente_nombre: str
    destinatario_id: str
    destinatario_nombre: str
    texto: str
    tipo: str = "texto"  # texto, imagen, archivo
    archivo_url: Optional[str] = None
    fecha: datetime
    leido: bool = False
    fecha_lectura: Optional[datetime] = None


class MensajeCreate(BaseModel):
    """Datos para crear un mensaje"""
    destinatario_id: str
    texto: str
    tipo: str = "texto"
    archivo_url: Optional[str] = None


class MensajeUpdate(BaseModel):
    """Actualizar estado del mensaje"""
    leido: bool = True


class Conversacion(BaseModel):
    """Conversación entre dos usuarios"""
    id: str
    usuario1_id: str
    usuario1_nombre: str
    usuario2_id: str
    usuario2_nombre: str
    ultimo_mensaje: Optional[str] = None
    fecha_ultimo_mensaje: Optional[datetime] = None
    mensajes_no_leidos_usuario1: int = 0
    mensajes_no_leidos_usuario2: int = 0
    fecha_creacion: datetime


class UsuarioOnline(BaseModel):
    """Estado online de un usuario"""
    usuario_id: str
    socket_id: str
    ultimo_visto: datetime
    online: bool = True

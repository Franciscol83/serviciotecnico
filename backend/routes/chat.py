"""
Rutas API para Chat
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4
import os

from models.mensaje import Mensaje, MensajeCreate, MensajeUpdate, Conversacion
from middleware.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_db():
    """Obtener conexión a MongoDB"""
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


@router.get("/conversaciones")
async def get_conversaciones(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener lista de conversaciones del usuario actual
    """
    db = get_db()
    user_id = current_user["id"]
    
    try:
        # Buscar conversaciones donde el usuario participa
        conversaciones = await db.conversaciones.find({
            "$or": [
                {"usuario1_id": user_id},
                {"usuario2_id": user_id}
            ]
        }, {"_id": 0}).sort("fecha_ultimo_mensaje", -1).to_list(100)
        
        # Agregar info de usuarios online
        for conv in conversaciones:
            # Determinar el "otro" usuario
            otro_usuario_id = conv["usuario2_id"] if conv["usuario1_id"] == user_id else conv["usuario1_id"]
            
            # Verificar si está online
            usuario_online = await db.usuarios_online.find_one({"usuario_id": otro_usuario_id})
            conv["otro_usuario_online"] = usuario_online.get("online", False) if usuario_online else False
            
            # Calcular mensajes no leídos
            if conv["usuario1_id"] == user_id:
                conv["mensajes_no_leidos"] = conv.get("mensajes_no_leidos_usuario1", 0)
            else:
                conv["mensajes_no_leidos"] = conv.get("mensajes_no_leidos_usuario2", 0)
        
        return {
            "total": len(conversaciones),
            "conversaciones": conversaciones
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conversaciones: {str(e)}")


@router.get("/mensajes/{usuario_id}")
async def get_mensajes(
    usuario_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener mensajes con un usuario específico
    """
    db = get_db()
    
    try:
        # Buscar mensajes entre ambos usuarios
        mensajes = await db.mensajes.find({
            "$or": [
                {"remitente_id": current_user["id"], "destinatario_id": usuario_id},
                {"remitente_id": usuario_id, "destinatario_id": current_user["id"]}
            ]
        }, {"_id": 0}).sort("fecha", 1).limit(limit).to_list(limit)
        
        return {
            "total": len(mensajes),
            "mensajes": mensajes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo mensajes: {str(e)}")


@router.post("/mensajes")
async def crear_mensaje(
    mensaje_data: MensajeCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear un nuevo mensaje
    """
    db = get_db()
    
    try:
        # Verificar que el destinatario existe
        destinatario = await db.users.find_one({"id": mensaje_data.destinatario_id}, {"_id": 0})
        if not destinatario:
            raise HTTPException(status_code=404, detail="Destinatario no encontrado")
        
        # Crear mensaje
        mensaje = {
            "id": str(uuid4()),
            "remitente_id": current_user["id"],
            "remitente_nombre": current_user["nombre_completo"],
            "destinatario_id": mensaje_data.destinatario_id,
            "destinatario_nombre": destinatario["nombre_completo"],
            "texto": mensaje_data.texto,
            "tipo": mensaje_data.tipo,
            "archivo_url": mensaje_data.archivo_url,
            "fecha": datetime.now(timezone.utc),
            "leido": False,
            "fecha_lectura": None
        }
        
        await db.mensajes.insert_one(mensaje)
        
        # Crear o actualizar conversación
        conversacion_id = f"{min(current_user['id'], mensaje_data.destinatario_id)}_{max(current_user['id'], mensaje_data.destinatario_id)}"
        
        conversacion = await db.conversaciones.find_one({"id": conversacion_id})
        
        if conversacion:
            # Actualizar conversación existente
            update_data = {
                "ultimo_mensaje": mensaje_data.texto[:50],
                "fecha_ultimo_mensaje": datetime.now(timezone.utc)
            }
            
            # Incrementar contador de no leídos del destinatario
            if conversacion["usuario1_id"] == mensaje_data.destinatario_id:
                update_data["mensajes_no_leidos_usuario1"] = conversacion.get("mensajes_no_leidos_usuario1", 0) + 1
            else:
                update_data["mensajes_no_leidos_usuario2"] = conversacion.get("mensajes_no_leidos_usuario2", 0) + 1
            
            await db.conversaciones.update_one(
                {"id": conversacion_id},
                {"$set": update_data}
            )
        else:
            # Crear nueva conversación
            nueva_conversacion = {
                "id": conversacion_id,
                "usuario1_id": min(current_user['id'], mensaje_data.destinatario_id),
                "usuario1_nombre": current_user["nombre_completo"] if current_user['id'] < mensaje_data.destinatario_id else destinatario["nombre_completo"],
                "usuario2_id": max(current_user['id'], mensaje_data.destinatario_id),
                "usuario2_nombre": destinatario["nombre_completo"] if current_user['id'] < mensaje_data.destinatario_id else current_user["nombre_completo"],
                "ultimo_mensaje": mensaje_data.texto[:50],
                "fecha_ultimo_mensaje": datetime.now(timezone.utc),
                "mensajes_no_leidos_usuario1": 1 if min(current_user['id'], mensaje_data.destinatario_id) == mensaje_data.destinatario_id else 0,
                "mensajes_no_leidos_usuario2": 1 if max(current_user['id'], mensaje_data.destinatario_id) == mensaje_data.destinatario_id else 0,
                "fecha_creacion": datetime.now(timezone.utc)
            }
            await db.conversaciones.insert_one(nueva_conversacion)
        
        mensaje.pop("_id", None)
        return mensaje
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando mensaje: {str(e)}")


@router.put("/mensajes/{mensaje_id}/leer")
async def marcar_como_leido(
    mensaje_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marcar mensaje como leído
    """
    db = get_db()
    
    try:
        # Verificar que el mensaje existe y el usuario es el destinatario
        mensaje = await db.mensajes.find_one({
            "id": mensaje_id,
            "destinatario_id": current_user["id"]
        })
        
        if not mensaje:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
        # Actualizar mensaje
        await db.mensajes.update_one(
            {"id": mensaje_id},
            {
                "$set": {
                    "leido": True,
                    "fecha_lectura": datetime.now(timezone.utc)
                }
            }
        )
        
        # Actualizar contador de conversación
        conversacion_id = f"{min(current_user['id'], mensaje['remitente_id'])}_{max(current_user['id'], mensaje['remitente_id'])}"
        conversacion = await db.conversaciones.find_one({"id": conversacion_id})
        
        if conversacion:
            if conversacion["usuario1_id"] == current_user["id"]:
                await db.conversaciones.update_one(
                    {"id": conversacion_id},
                    {"$set": {"mensajes_no_leidos_usuario1": max(0, conversacion.get("mensajes_no_leidos_usuario1", 0) - 1)}}
                )
            else:
                await db.conversaciones.update_one(
                    {"id": conversacion_id},
                    {"$set": {"mensajes_no_leidos_usuario2": max(0, conversacion.get("mensajes_no_leidos_usuario2", 0) - 1)}}
                )
        
        return {"message": "Mensaje marcado como leído"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando mensaje: {str(e)}")


@router.get("/usuarios")
async def get_usuarios_chat(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener lista de usuarios disponibles para chat
    """
    db = get_db()
    
    try:
        # Obtener todos los usuarios activos excepto el actual
        usuarios = await db.users.find({
            "id": {"$ne": current_user["id"]},
            "activo": True
        }, {
            "_id": 0,
            "id": 1,
            "nombre_completo": 1,
            "email": 1,
            "role": 1
        }).to_list(500)
        
        # Agregar estado online
        for usuario in usuarios:
            estado_online = await db.usuarios_online.find_one({"usuario_id": usuario["id"]})
            usuario["online"] = estado_online.get("online", False) if estado_online else False
            usuario["ultimo_visto"] = estado_online.get("ultimo_visto") if estado_online else None
        
        return {
            "total": len(usuarios),
            "usuarios": usuarios
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo usuarios: {str(e)}")

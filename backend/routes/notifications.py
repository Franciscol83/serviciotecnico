"""
Rutas API para Web Push Notifications (VAPID)
"""
import os
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

from middleware.auth import get_current_user
from services.push_service import send_push_to_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionPayload(BaseModel):
    endpoint: str
    keys: PushKeys
    expirationTime: Optional[int] = None
    user_agent: Optional[str] = Field(default=None, description="User agent del navegador")


class TestNotificationPayload(BaseModel):
    title: str = "Notificación de prueba"
    body: str = "Esto es una prueba desde Tecno Nacho"
    url: Optional[str] = "/"


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Devuelve la clave pública VAPID que el frontend usará para suscribirse."""
    public_key = os.environ.get("VAPID_PUBLIC_KEY", "")
    if not public_key:
        raise HTTPException(status_code=500, detail="VAPID_PUBLIC_KEY no configurada")
    return {"public_key": public_key}


@router.post("/subscribe")
async def subscribe(
    payload: PushSubscriptionPayload,
    current_user: dict = Depends(get_current_user),
):
    """Registra (o actualiza) una suscripción push para el usuario actual."""
    db = get_db()
    user_id = current_user["id"]

    doc = {
        "user_id": user_id,
        "endpoint": payload.endpoint,
        "keys": payload.keys.model_dump(),
        "user_agent": payload.user_agent,
        "fecha_actualizacion": datetime.now(timezone.utc),
    }

    # Upsert por endpoint (un dispositivo = un endpoint único)
    result = await db.push_subscriptions.update_one(
        {"endpoint": payload.endpoint},
        {
            "$set": doc,
            "$setOnInsert": {"fecha_creacion": datetime.now(timezone.utc)},
        },
        upsert=True,
    )

    return {
        "success": True,
        "created": result.upserted_id is not None,
        "user_id": user_id,
    }


@router.post("/unsubscribe")
async def unsubscribe(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Elimina una suscripción push (al desactivar notificaciones)."""
    db = get_db()
    endpoint = payload.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="endpoint requerido")

    result = await db.push_subscriptions.delete_one({
        "endpoint": endpoint,
        "user_id": current_user["id"],
    })
    return {"success": True, "deleted": result.deleted_count}


@router.get("/status")
async def status(current_user: dict = Depends(get_current_user)):
    """Devuelve cuántas suscripciones tiene activas el usuario actual."""
    db = get_db()
    count = await db.push_subscriptions.count_documents({"user_id": current_user["id"]})
    return {"subscribed": count > 0, "devices": count}


@router.post("/test")
async def send_test(
    payload: TestNotificationPayload,
    current_user: dict = Depends(get_current_user),
):
    """Envía una notificación de prueba al usuario actual (para validar setup)."""
    result = await send_push_to_user(
        user_id=current_user["id"],
        title=payload.title,
        body=payload.body,
        url=payload.url,
        tag="test-notification",
    )
    return {"success": True, "result": result}

"""
Servicio de Auditoría - registro inmutable de acciones críticas
"""
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Request

from models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def _get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


async def log_action(
    accion: str,
    entidad: str,
    usuario: Optional[Dict[str, Any]] = None,
    entidad_id: Optional[str] = None,
    detalles: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    success: bool = True,
    error_message: Optional[str] = None,
) -> None:
    """
    Registra una acción crítica en la colección audit_logs.
    Best-effort: nunca falla la request principal por errores aquí.
    """
    try:
        db = _get_db()

        ip = None
        user_agent = None
        if request is not None:
            try:
                # X-Forwarded-For tiene prioridad en entornos detrás de proxy
                xff = request.headers.get("x-forwarded-for")
                if xff:
                    ip = xff.split(",")[0].strip()
                else:
                    ip = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
            except Exception:
                pass

        log = AuditLog(
            usuario_id=(usuario or {}).get("id"),
            usuario_nombre=(usuario or {}).get("nombre_completo"),
            usuario_role=(usuario or {}).get("role"),
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            detalles=detalles or {},
            ip=ip,
            user_agent=user_agent,
            success=success,
            error_message=error_message,
        )

        doc = log.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat()
        await db.audit_logs.insert_one(doc)
    except Exception as e:
        logger.error(f"Audit log fallo (no crítico): {e}")

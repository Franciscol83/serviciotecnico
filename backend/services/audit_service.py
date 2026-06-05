"""
Servicio de Auditoría - registro inmutable de acciones críticas
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import Request

from models.audit_log import AuditLog
from utils.database import get_db

logger = logging.getLogger(__name__)


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
        db = get_db()

        ip = None
        user_agent = None
        if request is not None:
            try:
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

        # Storar datetime nativo (no ISO string) para permitir range queries
        doc = log.model_dump()
        # doc["timestamp"] ya es datetime con tz UTC desde el modelo
        await db.audit_logs.insert_one(doc)
    except Exception as e:
        logger.error(f"Audit log fallo (no crítico): {e}")


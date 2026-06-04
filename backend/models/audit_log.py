"""
Modelo de Audit Log - registro inmutable de acciones críticas
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import uuid4
from pydantic import BaseModel, Field


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Quien realizó la acción
    usuario_id: Optional[str] = None
    usuario_nombre: Optional[str] = None
    usuario_role: Optional[str] = None

    # Qué hizo
    accion: str = Field(..., description="Ej: 'crear_servicio', 'aprobar_servicio', 'login', 'logout', 'crear_reporte', 'anular_servicio'")
    entidad: str = Field(..., description="Tipo de entidad afectada: 'service', 'reporte', 'user', 'inventario', 'auth'")
    entidad_id: Optional[str] = Field(default=None, description="ID de la entidad afectada")

    # Detalles adicionales (JSON libre)
    detalles: Dict[str, Any] = Field(default_factory=dict)

    # Contexto
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Lista paginada de logs"""
    logs: list
    total: int
    page: int
    page_size: int

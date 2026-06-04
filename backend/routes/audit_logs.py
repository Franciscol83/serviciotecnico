"""
Rutas API para consultar Logs de Auditoría
Solo Admin y Supervisor pueden consultar
"""
import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from middleware.auth import require_roles

router = APIRouter(prefix="/audit-logs", tags=["Auditoría"])


def get_db():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


@router.get("")
async def list_audit_logs(
    accion: Optional[str] = Query(None, description="Filtrar por acción (ej: 'crear_servicio')"),
    entidad: Optional[str] = Query(None, description="Filtrar por entidad (ej: 'service', 'reporte')"),
    usuario_id: Optional[str] = Query(None, description="Filtrar por usuario"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_roles(["admin", "supervisor"])),
):
    """Lista logs de auditoría paginados y filtrables."""
    db = get_db()

    query = {}
    if accion:
        query["accion"] = accion
    if entidad:
        query["entidad"] = entidad
    if usuario_id:
        query["usuario_id"] = usuario_id

    total = await db.audit_logs.count_documents(query)

    cursor = (
        db.audit_logs.find(query, {"_id": 0})
        .sort("timestamp", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    logs = await cursor.to_list(page_size)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total else 0,
    }


@router.get("/stats")
async def audit_stats(
    current_user: dict = Depends(require_roles(["admin", "supervisor"])),
):
    """Estadísticas agregadas por acción y por entidad."""
    db = get_db()

    pipeline_acciones = [
        {"$group": {"_id": "$accion", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    pipeline_entidades = [
        {"$group": {"_id": "$entidad", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    acciones = await db.audit_logs.aggregate(pipeline_acciones).to_list(50)
    entidades = await db.audit_logs.aggregate(pipeline_entidades).to_list(50)
    total = await db.audit_logs.count_documents({})

    return {
        "total": total,
        "por_accion": [{"accion": a["_id"], "count": a["count"]} for a in acciones],
        "por_entidad": [{"entidad": e["_id"], "count": e["count"]} for e in entidades],
    }

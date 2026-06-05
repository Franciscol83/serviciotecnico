"""
Rutas API para consultar Logs de Auditoría
Solo Admin y Supervisor pueden consultar
"""
import csv
import io
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse

from middleware.auth import require_roles
from utils.database import get_db

router = APIRouter(prefix="/audit-logs", tags=["Auditoría"])


@router.get("")
async def list_audit_logs(
    accion: Optional[str] = Query(None, description="Filtrar por acción (ej: 'crear_servicio')"),
    entidad: Optional[str] = Query(None, description="Filtrar por entidad (ej: 'service', 'reporte')"),
    usuario_id: Optional[str] = Query(None, description="Filtrar por usuario"),
    desde: Optional[datetime] = Query(None, description="Fecha desde (ISO 8601)"),
    hasta: Optional[datetime] = Query(None, description="Fecha hasta (ISO 8601)"),
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
    if desde or hasta:
        rng = {}
        if desde:
            rng["$gte"] = desde
        if hasta:
            rng["$lte"] = hasta
        query["timestamp"] = rng

    total = await db.audit_logs.count_documents(query)

    cursor = (
        db.audit_logs.find(query, {"_id": 0})
        .sort("timestamp", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    logs = await cursor.to_list(page_size)

    # Convertir datetime → ISO para JSON
    for log in logs:
        ts = log.get("timestamp")
        if hasattr(ts, "isoformat"):
            log["timestamp"] = ts.isoformat()

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


@router.get("/export")
async def export_audit_logs(
    accion: Optional[str] = Query(None),
    entidad: Optional[str] = Query(None),
    usuario_id: Optional[str] = Query(None),
    desde: Optional[datetime] = Query(None),
    hasta: Optional[datetime] = Query(None),
    current_user: dict = Depends(require_roles(["admin", "supervisor"])),
):
    """Exporta logs de auditoría a CSV. Aplica los mismos filtros que la lista."""
    db = get_db()

    query = {}
    if accion:
        query["accion"] = accion
    if entidad:
        query["entidad"] = entidad
    if usuario_id:
        query["usuario_id"] = usuario_id
    if desde or hasta:
        rng = {}
        if desde:
            rng["$gte"] = desde
        if hasta:
            rng["$lte"] = hasta
        query["timestamp"] = rng

    cursor = db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(10000)
    logs = await cursor.to_list(10000)

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    writer.writerow([
        "ID", "Fecha", "Usuario", "Rol", "Acción", "Entidad", "Entidad ID",
        "Estado", "IP", "User Agent", "Detalles", "Error",
    ])
    for log in logs:
        ts = log.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else (ts or "")
        import json as _json
        writer.writerow([
            log.get("id", ""),
            ts_str,
            log.get("usuario_nombre") or "",
            log.get("usuario_role") or "",
            log.get("accion") or "",
            log.get("entidad") or "",
            log.get("entidad_id") or "",
            "Éxito" if log.get("success", True) else "Error",
            log.get("ip") or "",
            log.get("user_agent") or "",
            _json.dumps(log.get("detalles") or {}, ensure_ascii=False),
            log.get("error_message") or "",
        ])

    output.seek(0)
    # BOM UTF-8 para Excel
    csv_bytes = b"\xef\xbb\xbf" + output.getvalue().encode("utf-8")
    filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


"""
Endpoints de analítica para el Dashboard - usa datos de servicios, reportes y audit logs.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query

from middleware.auth import require_roles
from utils.database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _start_of_day_utc(d: datetime) -> datetime:
    return d.replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("/dashboard")
async def dashboard_analytics(
    dias: int = Query(30, ge=1, le=365, description="Ventana de tiempo en días"),
    current_user: dict = Depends(require_roles(["admin", "supervisor"])),
):
    """Métricas agregadas para el dashboard (últimos N días)."""
    db = get_db()
    ahora = datetime.now(timezone.utc)
    desde = _start_of_day_utc(ahora - timedelta(days=dias - 1))

    # 1) Órdenes por día (basado en services.fecha_creacion)
    pipeline_ordenes = [
        {"$addFields": {
            "_ts": {"$cond": [
                {"$eq": [{"$type": "$fecha_creacion"}, "string"]},
                {"$dateFromString": {"dateString": "$fecha_creacion", "onError": None}},
                "$fecha_creacion",
            ]}
        }},
        {"$match": {"_ts": {"$gte": desde}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$_ts"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    ordenes_dia = await db.services.aggregate(pipeline_ordenes).to_list(400)

    # 2) Servicios por estado (todo el histórico, snapshot actual)
    pipeline_estado = [
        {"$group": {"_id": "$estado", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    por_estado = await db.services.aggregate(pipeline_estado).to_list(20)

    # 3) Top técnicos por reportes completados en el período
    pipeline_tecnicos = [
        {"$addFields": {
            "_ts": {"$cond": [
                {"$eq": [{"$type": "$fecha_creacion"}, "string"]},
                {"$dateFromString": {"dateString": "$fecha_creacion", "onError": None}},
                "$fecha_creacion",
            ]}
        }},
        {"$match": {"_ts": {"$gte": desde}}},
        {"$group": {
            "_id": {"id": "$tecnico_id", "nombre": "$tecnico_nombre"},
            "reportes": {"$sum": 1},
            "horas": {"$sum": {"$ifNull": ["$tiempo_dedicado_horas", 0]}},
        }},
        {"$sort": {"reportes": -1}},
        {"$limit": 10},
    ]
    top_tecnicos_raw = await db.reportes.aggregate(pipeline_tecnicos).to_list(20)
    top_tecnicos = [
        {
            "tecnico_id": t["_id"].get("id"),
            "tecnico_nombre": t["_id"].get("nombre") or "—",
            "reportes": t["reportes"],
            "horas": round(t.get("horas") or 0, 1),
        }
        for t in top_tecnicos_raw
    ]

    # 4) Actividad por hora del día (audit_logs entidad service, último período)
    pipeline_horas = [
        {"$match": {
            "entidad": "service",
            "timestamp": {"$gte": desde},
        }},
        {"$group": {
            "_id": {"$hour": "$timestamp"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    actividad_por_hora_raw = await db.audit_logs.aggregate(pipeline_horas).to_list(24)

    # Asegurar 24 buckets (0-23) con 0 si no hay datos
    horas_dict = {h["_id"]: h["count"] for h in actividad_por_hora_raw}
    actividad_por_hora = [
        {"hora": h, "count": horas_dict.get(h, 0)} for h in range(24)
    ]

    # 5) Distribución por tipo de servicio (período)
    pipeline_tipos = [
        {"$addFields": {
            "_ts": {"$cond": [
                {"$eq": [{"$type": "$fecha_creacion"}, "string"]},
                {"$dateFromString": {"dateString": "$fecha_creacion", "onError": None}},
                "$fecha_creacion",
            ]}
        }},
        {"$match": {"_ts": {"$gte": desde}}},
        {"$group": {"_id": "$tipo_servicio_nombre", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    por_tipo_raw = await db.services.aggregate(pipeline_tipos).to_list(20)
    por_tipo = [{"tipo": t["_id"] or "—", "count": t["count"]} for t in por_tipo_raw]

    # 6) Resumen counters
    total_servicios = await db.services.count_documents({})
    total_reportes = await db.reportes.count_documents({})
    total_materiales = await db.inventario.count_documents({"activo": True})
    stock_bajo = await db.inventario.count_documents({
        "activo": True,
        "$expr": {"$lte": ["$cantidad_stock", "$stock_minimo"]},
    })

    return {
        "rango_dias": dias,
        "desde": desde.isoformat(),
        "hasta": ahora.isoformat(),
        "resumen": {
            "total_servicios": total_servicios,
            "total_reportes": total_reportes,
            "total_materiales": total_materiales,
            "materiales_stock_bajo": stock_bajo,
        },
        "ordenes_por_dia": [{"fecha": d["_id"], "count": d["count"]} for d in ordenes_dia],
        "ordenes_por_estado": [{"estado": d["_id"] or "—", "count": d["count"]} for d in por_estado],
        "top_tecnicos": top_tecnicos,
        "actividad_por_hora": actividad_por_hora,
        "ordenes_por_tipo": por_tipo,
    }

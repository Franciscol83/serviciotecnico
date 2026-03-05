from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.reporte import Reporte, ReporteCreate, ReporteUpdate, MaterialConsumido, FotoTrabajo
from middleware.auth import get_current_user, require_roles
from utils.dependencies import get_db

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.post("", response_model=Reporte, status_code=status.HTTP_201_CREATED)
async def create_reporte(
    reporte_data: ReporteCreate,
    current_user: dict = Depends(require_roles(["admin", "supervisor", "tecnico"]))
):
    """
    Crear un nuevo reporte técnico
    - Solo técnicos, supervisores y admins pueden crear reportes
    """
    db = get_db()
    
    # Verificar que el servicio existe
    servicio = await db.services.find_one({"id": reporte_data.servicio_id})
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Verificar si ya existe un reporte para este servicio
    reporte_existente = await db.reportes.find_one({"servicio_id": reporte_data.servicio_id})
    if reporte_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un reporte para este servicio"
        )
    
    # Crear reporte
    reporte_dict = reporte_data.model_dump()
    reporte_obj = Reporte(
        **reporte_dict,
        tecnico_id=current_user["id"],
        tecnico_nombre=current_user["nombre_completo"]
    )
    
    # Convertir a dict y serializar
    doc = reporte_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    if doc.get('fecha_completado'):
        doc['fecha_completado'] = doc['fecha_completado'].isoformat()
    
    # Serializar fotos
    for foto in doc['fotos']:
        foto['timestamp'] = foto['timestamp'].isoformat()
    
    # Insertar en la base de datos
    await db.reportes.insert_one(doc)
    
    return reporte_obj

@router.get("", response_model=List[Reporte])
async def get_reportes(
    servicio_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener reportes
    - Puede filtrar por servicio_id
    """
    db = get_db()
    
    filter_query = {}
    if servicio_id:
        filter_query["servicio_id"] = servicio_id
    
    reportes = await db.reportes.find(filter_query, {"_id": 0}).sort("fecha_creacion", -1).to_list(1000)
    
    # Convertir timestamps
    for reporte in reportes:
        if isinstance(reporte.get('fecha_creacion'), str):
            reporte['fecha_creacion'] = datetime.fromisoformat(reporte['fecha_creacion'])
        if reporte.get('fecha_completado') and isinstance(reporte['fecha_completado'], str):
            reporte['fecha_completado'] = datetime.fromisoformat(reporte['fecha_completado'])
        
        # Convertir timestamps en fotos
        for foto in reporte.get('fotos', []):
            if isinstance(foto.get('timestamp'), str):
                foto['timestamp'] = datetime.fromisoformat(foto['timestamp'])
    
    return reportes

@router.get("/{reporte_id}", response_model=Reporte)
async def get_reporte(
    reporte_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener un reporte por ID"""
    db = get_db()
    
    reporte = await db.reportes.find_one({"id": reporte_id}, {"_id": 0})
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )
    
    # Convertir timestamps
    if isinstance(reporte.get('fecha_creacion'), str):
        reporte['fecha_creacion'] = datetime.fromisoformat(reporte['fecha_creacion'])
    if reporte.get('fecha_completado') and isinstance(reporte['fecha_completado'], str):
        reporte['fecha_completado'] = datetime.fromisoformat(reporte['fecha_completado'])
    
    for foto in reporte.get('fotos', []):
        if isinstance(foto.get('timestamp'), str):
            foto['timestamp'] = datetime.fromisoformat(foto['timestamp'])
    
    return Reporte(**reporte)

@router.put("/{reporte_id}", response_model=Reporte)
async def update_reporte(
    reporte_id: str,
    reporte_data: ReporteUpdate,
    current_user: dict = Depends(require_roles(["admin", "supervisor", "tecnico"]))
):
    """
    Actualizar un reporte
    - Técnicos solo pueden actualizar sus propios reportes
    """
    db = get_db()
    
    # Verificar que el reporte existe
    reporte = await db.reportes.find_one({"id": reporte_id})
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )
    
    # Verificar permisos
    if current_user["role"] == "tecnico" and reporte["tecnico_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes actualizar tus propios reportes"
        )
    
    # Preparar actualización
    update_data = reporte_data.model_dump(exclude_unset=True)
    
    # Si se marca como completado, agregar fecha
    if update_data.get("completado") and not reporte.get("completado"):
        update_data["fecha_completado"] = datetime.now(timezone.utc).isoformat()
    
    # Serializar fotos si existen
    if "fotos" in update_data:
        for foto in update_data["fotos"]:
            if isinstance(foto.get("timestamp"), datetime):
                foto["timestamp"] = foto["timestamp"].isoformat()
    
    # Actualizar en la base de datos
    await db.reportes.update_one(
        {"id": reporte_id},
        {"$set": update_data}
    )
    
    # Obtener reporte actualizado
    updated_reporte = await db.reportes.find_one({"id": reporte_id}, {"_id": 0})
    
    # Convertir timestamps
    if isinstance(updated_reporte.get('fecha_creacion'), str):
        updated_reporte['fecha_creacion'] = datetime.fromisoformat(updated_reporte['fecha_creacion'])
    if updated_reporte.get('fecha_completado') and isinstance(updated_reporte['fecha_completado'], str):
        updated_reporte['fecha_completado'] = datetime.fromisoformat(updated_reporte['fecha_completado'])
    
    for foto in updated_reporte.get('fotos', []):
        if isinstance(foto.get('timestamp'), str):
            foto['timestamp'] = datetime.fromisoformat(foto['timestamp'])
    
    return Reporte(**updated_reporte)

@router.delete("/{reporte_id}")
async def delete_reporte(
    reporte_id: str,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Eliminar un reporte
    - Solo admin y supervisor pueden eliminar
    """
    db = get_db()
    
    result = await db.reportes.delete_one({"id": reporte_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reporte no encontrado"
        )
    
    return {"message": "Reporte eliminado exitosamente"}
    


@router.get("/estadisticas")
async def get_estadisticas(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener estadísticas generales para dashboards y Power BI
    Devuelve KPIs y datos para visualización
    """
    db = get_db()
    
    # Obtener todos los servicios y reportes
    servicios = await db.services.find({}, {"_id": 0}).to_list(10000)
    reportes = await db.reportes.find({}, {"_id": 0}).to_list(10000)
    usuarios = await db.users.find({"role": "tecnico", "activo": True}, {"_id": 0}).to_list(1000)
    
    # KPI 1: Servicios por estado
    servicios_por_estado = {}
    for s in servicios:
        estado = s.get("estado", "desconocido")
        servicios_por_estado[estado] = servicios_por_estado.get(estado, 0) + 1
    
    # KPI 2: Servicios por técnico
    servicios_por_tecnico = {}
    for s in servicios:
        tecnico = s.get("tecnico_asignado_nombre", "Sin asignar")
        servicios_por_tecnico[tecnico] = servicios_por_tecnico.get(tecnico, 0) + 1
    
    # KPI 3: Servicios por tipo
    servicios_por_tipo = {}
    for s in servicios:
        tipo = s.get("tipo_servicio_nombre", "Desconocido")
        servicios_por_tipo[tipo] = servicios_por_tipo.get(tipo, 0) + 1
    
    # KPI 4: Servicios por ubicación
    servicios_por_ubicacion = {"en_local": 0, "por_fuera": 0}
    for s in servicios:
        ubicacion = s.get("ubicacion_servicio", "por_fuera")
        servicios_por_ubicacion[ubicacion] += 1
    
    # KPI 5: Materiales más consumidos
    materiales_consumidos = {}
    for r in reportes:
        for mat in r.get("materiales_consumidos", []):
            nombre = mat.get("nombre", "Desconocido")
            cantidad = mat.get("cantidad", 0)
            if nombre in materiales_consumidos:
                materiales_consumidos[nombre] += cantidad
            else:
                materiales_consumidos[nombre] = cantidad
    
    # KPI 6: Tiempo promedio por servicio
    tiempos = [r.get("tiempo_dedicado_horas", 0) for r in reportes if r.get("tiempo_dedicado_horas")]
    tiempo_promedio = sum(tiempos) / len(tiempos) if tiempos else 0
    
    # KPI 7: Tasa de cumplimiento por técnico
    cumplimiento_tecnicos = []
    for tecnico in usuarios:
        tecnico_id = tecnico["id"]
        tecnico_nombre = tecnico["nombre_completo"]
        
        # Servicios asignados
        servicios_asignados = [s for s in servicios if s.get("tecnico_asignado_id") == tecnico_id]
        total_asignados = len(servicios_asignados)
        
        # Servicios completados
        completados = len([s for s in servicios_asignados if s.get("estado") == "completado"])
        
        # Tasa de cumplimiento
        tasa = (completados / total_asignados * 100) if total_asignados > 0 else 0
        
        cumplimiento_tecnicos.append({
            "tecnico": tecnico_nombre,
            "total_asignados": total_asignados,
            "completados": completados,
            "tasa_cumplimiento": round(tasa, 2)
        })
    
    # KPI 8: Servicios por mes (últimos 6 meses)
    from datetime import datetime, timedelta
    import calendar
    
    servicios_por_mes = []
    hoy = datetime.now()
    for i in range(6):
        mes_fecha = hoy - timedelta(days=30 * i)
        mes_nombre = calendar.month_name[mes_fecha.month]
        
        count = len([
            s for s in servicios 
            if isinstance(s.get("fecha_creacion"), str) and 
            mes_fecha.strftime("%Y-%m") in s["fecha_creacion"]
        ])
        
        servicios_por_mes.append({
            "mes": mes_nombre,
            "cantidad": count
        })
    
    servicios_por_mes.reverse()
    
    return {
        "resumen": {
            "total_servicios": len(servicios),
            "total_reportes": len(reportes),
            "total_tecnicos": len(usuarios),
            "tiempo_promedio_horas": round(tiempo_promedio, 2)
        },
        "servicios_por_estado": servicios_por_estado,
        "servicios_por_tecnico": servicios_por_tecnico,
        "servicios_por_tipo": servicios_por_tipo,
        "servicios_por_ubicacion": servicios_por_ubicacion,
        "materiales_mas_consumidos": dict(sorted(materiales_consumidos.items(), key=lambda x: x[1], reverse=True)[:10]),
        "cumplimiento_tecnicos": cumplimiento_tecnicos,
        "servicios_por_mes": servicios_por_mes
    }

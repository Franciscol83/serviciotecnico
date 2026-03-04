from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
import os
from datetime import datetime, timezone

from models.service import (
    Servicio, ServicioCreate, ServicioUpdate, ServicioAnular, 
    ServicioStats, ModificacionServicio, EstadoServicio, 
    AgregarItemServicio, ItemServicio
)
from middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/services", tags=["Servicios"])

# Función helper para obtener la base de datos
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

async def get_next_caso_numero() -> str:
    """Generar el siguiente número de caso secuencial"""
    db = get_db()
    
    # Obtener el año actual
    year = datetime.now(timezone.utc).year
    prefix = f"TN-{year}-"
    
    # Buscar el último número del año
    last_service = await db.services.find_one(
        {"caso_numero": {"$regex": f"^{prefix}"}},
        sort=[("caso_numero", -1)]
    )
    
    if last_service:
        # Extraer el número y sumar 1
        last_num = int(last_service["caso_numero"].split("-")[-1])
        next_num = last_num + 1
    else:
        next_num = 1
    
    return f"{prefix}{next_num:05d}"  # TN-2025-00001

@router.post("", response_model=Servicio, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServicioCreate,
    current_user: dict = Depends(require_roles(["admin", "supervisor", "asesor"]))
):
    """
    Crear una nueva orden de servicio
    - Puede incluir múltiples servicios en items_adicionales
    - Asesor: crea con estado 'pendiente_aprobacion'
    - Supervisor/Admin: crea con estado 'aprobado'
    - Si ubicacion_servicio es 'en_local', fecha_agendada no es requerida
    """
    db = get_db()
    
    # Validar fecha agendada según ubicación
    if service_data.ubicacion_servicio == "por_fuera" and not service_data.fecha_agendada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fecha agendada es requerida para servicios por fuera del local"
        )
    
    # Verificar que el tipo de servicio principal existe
    tipo_servicio = await db.service_types.find_one({"id": service_data.tipo_servicio_id, "activo": True})
    if not tipo_servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado o inactivo"
        )
    
    # Verificar que el técnico existe
    tecnico = await db.users.find_one({"id": service_data.tecnico_asignado_id, "role": "tecnico"})
    if not tecnico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Técnico no encontrado"
        )
    
    # Generar número de caso
    caso_numero = await get_next_caso_numero()
    
    # Determinar estado inicial según rol
    estado_inicial = "aprobado" if current_user["role"] in ["admin", "supervisor"] else "pendiente_aprobacion"
    
    # Procesar items adicionales
    items_servicio = []
    tipos_servicios_nombres = [tipo_servicio["nombre"]]
    
    for item_data in service_data.items_adicionales:
        tipo_adicional = await db.service_types.find_one({"id": item_data["tipo_servicio_id"], "activo": True})
        if not tipo_adicional:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipo de servicio {item_data['tipo_servicio_id']} no encontrado"
            )
        
        item = ItemServicio(
            tipo_servicio_id=item_data["tipo_servicio_id"],
            tipo_servicio_nombre=tipo_adicional["nombre"],
            observaciones=item_data.get("observaciones", ""),
            agregado_por_id=current_user["id"],
            agregado_por_nombre=current_user["nombre_completo"]
        )
        items_servicio.append(item)
        tipos_servicios_nombres.append(tipo_adicional["nombre"])
    
    # Crear servicio
    service_dict = service_data.model_dump(exclude={"items_adicionales"})
    service_obj = Servicio(
        **service_dict,
        caso_numero=caso_numero,
        tipo_servicio_nombre=tipo_servicio["nombre"],
        items_servicio=items_servicio,
        estado=estado_inicial,
        tecnico_asignado_nombre=tecnico["nombre_completo"],
        tecnico_asignado_original=service_data.tecnico_asignado_id,
        creado_por_id=current_user["id"],
        creado_por_nombre=current_user["nombre_completo"],
        creado_por_role=current_user["role"],
    )
    
    # Si es supervisor/admin, ya está aprobado
    if estado_inicial == "aprobado":
        service_obj.aprobado_por_id = current_user["id"]
        service_obj.aprobado_por_nombre = current_user["nombre_completo"]
        service_obj.fecha_aprobacion = datetime.now(timezone.utc)
    
    # Agregar modificación de creación
    modificacion = ModificacionServicio(
        tipo="creacion",
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre_completo"],
        usuario_role=current_user["role"],
        detalles={
            "estado": estado_inicial,
            "tecnico": tecnico["nombre_completo"],
            "servicios": tipos_servicios_nombres,
            "ubicacion": service_data.ubicacion_servicio,
            "total_servicios": len(tipos_servicios_nombres)
        }
    )
    service_obj.modificaciones.append(modificacion)
    
    # Convertir a dict y serializar
    doc = service_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    if doc.get('fecha_agendada'):
        doc['fecha_agendada'] = doc['fecha_agendada'].isoformat()
    if doc.get('fecha_aprobacion'):
        doc['fecha_aprobacion'] = doc['fecha_aprobacion'].isoformat()
    
    # Serializar modificaciones
    for mod in doc['modificaciones']:
        mod['timestamp'] = mod['timestamp'].isoformat()
    
    # Serializar items de servicio
    for item in doc['items_servicio']:
        item['agregado_en'] = item['agregado_en'].isoformat()
    
    # Insertar en la base de datos
    await db.services.insert_one(doc)
    
    return service_obj

@router.get("", response_model=List[Servicio])
async def get_services(
    estado: Optional[EstadoServicio] = None,
    tecnico_id: Optional[str] = None,
    creado_por_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener servicios (filtrados según rol)
    - Admin/Supervisor: Ve todos
    - Asesor: Ve los que creó
    - Técnico: Ve solo los asignados a él
    """
    db = get_db()
    
    # Construir filtro según rol
    filter_query = {}
    
    if current_user["role"] == "tecnico":
        filter_query["tecnico_asignado_id"] = current_user["id"]
    elif current_user["role"] == "asesor":
        filter_query["creado_por_id"] = current_user["id"]
    
    # Filtros adicionales
    if estado:
        filter_query["estado"] = estado
    if tecnico_id and current_user["role"] in ["admin", "supervisor"]:
        filter_query["tecnico_asignado_id"] = tecnico_id
    if creado_por_id and current_user["role"] in ["admin", "supervisor"]:
        filter_query["creado_por_id"] = creado_por_id
    
    services = await db.services.find(filter_query, {"_id": 0}).sort("fecha_creacion", -1).to_list(1000)
    
    # Convertir timestamps
    for service in services:
        if isinstance(service.get('fecha_creacion'), str):
            service['fecha_creacion'] = datetime.fromisoformat(service['fecha_creacion'])
        if service.get('fecha_agendada') and isinstance(service['fecha_agendada'], str):
            service['fecha_agendada'] = datetime.fromisoformat(service['fecha_agendada'])
        if service.get('fecha_aprobacion') and isinstance(service['fecha_aprobacion'], str):
            service['fecha_aprobacion'] = datetime.fromisoformat(service['fecha_aprobacion'])
        if service.get('fecha_completado') and isinstance(service['fecha_completado'], str):
            service['fecha_completado'] = datetime.fromisoformat(service['fecha_completado'])
        if service.get('fecha_anulado') and isinstance(service['fecha_anulado'], str):
            service['fecha_anulado'] = datetime.fromisoformat(service['fecha_anulado'])
        
        # Convertir timestamps en modificaciones
        for mod in service.get('modificaciones', []):
            if isinstance(mod['timestamp'], str):
                mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
        
        # Convertir timestamps en items de servicio
        for item in service.get('items_servicio', []):
            if isinstance(item.get('agregado_en'), str):
                item['agregado_en'] = datetime.fromisoformat(item['agregado_en'])
        
        # Asegurar que campos nuevos existan (compatibilidad con datos viejos)
        if 'ubicacion_servicio' not in service:
            service['ubicacion_servicio'] = 'por_fuera'
        if 'items_servicio' not in service:
            service['items_servicio'] = []
    
    return services

@router.get("/stats", response_model=ServicioStats)
async def get_service_stats(current_user: dict = Depends(get_current_user)):
    """Obtener estadísticas de servicios"""
    db = get_db()
    
    # Filtro según rol
    filter_query = {}
    if current_user["role"] == "tecnico":
        filter_query["tecnico_asignado_id"] = current_user["id"]
    elif current_user["role"] == "asesor":
        filter_query["creado_por_id"] = current_user["id"]
    
    # Contar por estado
    pipeline = [
        {"$match": filter_query},
        {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
    ]
    
    results = await db.services.aggregate(pipeline).to_list(100)
    
    stats = {
        "total": 0,
        "pendiente_aprobacion": 0,
        "aprobado": 0,
        "en_proceso": 0,
        "completado": 0,
        "cancelado": 0,
        "anulado": 0,
    }
    
    for result in results:
        estado = result["_id"]
        count = result["count"]
        stats[estado] = count
        stats["total"] += count
    
    return ServicioStats(**stats)

@router.get("/{service_id}", response_model=Servicio)
async def get_service(service_id: str, current_user: dict = Depends(get_current_user)):
    """Obtener un servicio específico"""
    db = get_db()
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Verificar permisos
    if current_user["role"] == "tecnico" and service["tecnico_asignado_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este servicio"
        )
    elif current_user["role"] == "asesor" and service["creado_por_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este servicio"
        )
    
    # Convertir timestamps
    if isinstance(service.get('fecha_creacion'), str):
        service['fecha_creacion'] = datetime.fromisoformat(service['fecha_creacion'])
    if service.get('fecha_agendada') and isinstance(service['fecha_agendada'], str):
        service['fecha_agendada'] = datetime.fromisoformat(service['fecha_agendada'])
    if service.get('fecha_aprobacion') and isinstance(service['fecha_aprobacion'], str):
        service['fecha_aprobacion'] = datetime.fromisoformat(service['fecha_aprobacion'])
    if service.get('fecha_completado') and isinstance(service['fecha_completado'], str):
        service['fecha_completado'] = datetime.fromisoformat(service['fecha_completado'])
    if service.get('fecha_anulado') and isinstance(service['fecha_anulado'], str):
        service['fecha_anulado'] = datetime.fromisoformat(service['fecha_anulado'])
    
    for mod in service.get('modificaciones', []):
        if isinstance(mod['timestamp'], str):
            mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
    
    return Servicio(**service)

@router.put("/{service_id}", response_model=Servicio)
async def update_service(
    service_id: str,
    service_data: ServicioUpdate,
    current_user: dict = Depends(require_roles(["admin", "supervisor", "asesor"]))
):
    """
    Actualizar un servicio
    Solo Admin y Supervisor pueden cambiar todo
    Asesor solo puede editar si es suyo y está en pendiente_aprobacion
    """
    db = get_db()
    
    # Verificar que existe
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Verificar permisos
    if current_user["role"] == "asesor":
        if existing_service["creado_por_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes editar tus propios servicios"
            )
        if existing_service["estado"] != "pendiente_aprobacion":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes editar servicios pendientes de aprobación"
            )
    
    # Preparar datos de actualización
    update_data = service_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    # Registrar modificación
    modificacion = ModificacionServicio(
        tipo="modificacion",
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre_completo"],
        usuario_role=current_user["role"],
        detalles=update_data
    )
    
    # Si se cambió el técnico, actualizar nombre
    if "tecnico_asignado_id" in update_data:
        tecnico = await db.users.find_one({"id": update_data["tecnico_asignado_id"], "role": "tecnico"})
        if not tecnico:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Técnico no encontrado"
            )
        update_data["tecnico_asignado_nombre"] = tecnico["nombre_completo"]
        modificacion.tipo = "reasignacion"
    
    # Serializar fechas
    if update_data.get('fecha_agendada'):
        update_data['fecha_agendada'] = update_data['fecha_agendada'].isoformat()
    
    # Agregar modificación al histórico
    await db.services.update_one(
        {"id": service_id},
        {
            "$set": update_data,
            "$push": {"modificaciones": modificacion.model_dump()}
        }
    )
    
    # Obtener servicio actualizado
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    # Convertir timestamps
    if isinstance(updated_service.get('fecha_creacion'), str):
        updated_service['fecha_creacion'] = datetime.fromisoformat(updated_service['fecha_creacion'])
    if updated_service.get('fecha_agendada') and isinstance(updated_service['fecha_agendada'], str):
        updated_service['fecha_agendada'] = datetime.fromisoformat(updated_service['fecha_agendada'])
    
    for mod in updated_service.get('modificaciones', []):
        if isinstance(mod['timestamp'], str):
            mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
    
    return Servicio(**updated_service)

@router.put("/{service_id}/aprobar", response_model=Servicio)
async def aprobar_service(
    service_id: str,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """Aprobar un servicio (solo Admin y Supervisor)"""
    db = get_db()
    
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    if service["estado"] != "pendiente_aprobacion":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio no está pendiente de aprobación"
        )
    
    # Actualizar estado
    modificacion = ModificacionServicio(
        tipo="aprobacion",
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre_completo"],
        usuario_role=current_user["role"],
        detalles={"estado_anterior": "pendiente_aprobacion", "estado_nuevo": "aprobado"}
    )
    
    await db.services.update_one(
        {"id": service_id},
        {
            "$set": {
                "estado": "aprobado",
                "aprobado_por_id": current_user["id"],
                "aprobado_por_nombre": current_user["nombre_completo"],
                "fecha_aprobacion": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"modificaciones": modificacion.model_dump()}
        }
    )
    
    # Obtener servicio actualizado
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    if isinstance(updated_service.get('fecha_creacion'), str):
        updated_service['fecha_creacion'] = datetime.fromisoformat(updated_service['fecha_creacion'])
    if updated_service.get('fecha_aprobacion') and isinstance(updated_service['fecha_aprobacion'], str):
        updated_service['fecha_aprobacion'] = datetime.fromisoformat(updated_service['fecha_aprobacion'])
    
    for mod in updated_service.get('modificaciones', []):
        if isinstance(mod['timestamp'], str):
            mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
    
    return Servicio(**updated_service)

@router.put("/{service_id}/anular", response_model=Servicio)
async def anular_service(
    service_id: str,
    anular_data: ServicioAnular,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Anular un servicio (solo Supervisor y Admin)
    NO se elimina, se marca como anulado para auditoría
    """
    db = get_db()
    
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    if service["estado"] == "anulado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio ya está anulado"
        )
    
    # Registrar anulación
    modificacion = ModificacionServicio(
        tipo="anulacion",
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre_completo"],
        usuario_role=current_user["role"],
        detalles={
            "estado_anterior": service["estado"],
            "razon": anular_data.razon_anulacion
        }
    )
    
    await db.services.update_one(
        {"id": service_id},
        {
            "$set": {
                "estado": "anulado",
                "anulado_por_id": current_user["id"],
                "anulado_por_nombre": current_user["nombre_completo"],
                "fecha_anulado": datetime.now(timezone.utc).isoformat(),
                "razon_anulacion": anular_data.razon_anulacion
            },
            "$push": {"modificaciones": modificacion.model_dump()}
        }
    )
    
    # Obtener servicio actualizado
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    if isinstance(updated_service.get('fecha_creacion'), str):
        updated_service['fecha_creacion'] = datetime.fromisoformat(updated_service['fecha_creacion'])
    if updated_service.get('fecha_anulado') and isinstance(updated_service['fecha_anulado'], str):
        updated_service['fecha_anulado'] = datetime.fromisoformat(updated_service['fecha_anulado'])
    
    for mod in updated_service.get('modificaciones', []):
        if isinstance(mod['timestamp'], str):
            mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
    
    return Servicio(**updated_service)



@router.post("/{service_id}/agregar-item", response_model=Servicio)
async def agregar_item_servicio(
    service_id: str,
    item_data: AgregarItemServicio,
    current_user: dict = Depends(require_roles(["admin", "supervisor", "asesor"]))
):
    """
    Agregar un servicio adicional a una orden existente
    Registra en el historial quién y cuándo se agregó
    """
    db = get_db()
    
    # Verificar que la orden existe
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden de servicio no encontrada"
        )
    
    # Verificar que el tipo de servicio existe
    tipo_servicio = await db.service_types.find_one({"id": item_data.tipo_servicio_id, "activo": True})
    if not tipo_servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado o inactivo"
        )
    
    # Verificar permisos (similar a editar)
    if current_user["role"] == "asesor":
        if service["creado_por_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes agregar servicios a tus propias órdenes"
            )
        if service["estado"] != "pendiente_aprobacion":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes agregar servicios a órdenes pendientes de aprobación"
            )
    
    # Crear nuevo item
    nuevo_item = ItemServicio(
        tipo_servicio_id=item_data.tipo_servicio_id,
        tipo_servicio_nombre=tipo_servicio["nombre"],
        observaciones=item_data.observaciones,
        agregado_por_id=current_user["id"],
        agregado_por_nombre=current_user["nombre_completo"]
    )
    
    # Registrar modificación
    modificacion = ModificacionServicio(
        tipo="agregar_item",
        usuario_id=current_user["id"],
        usuario_nombre=current_user["nombre_completo"],
        usuario_role=current_user["role"],
        detalles={
            "servicio_agregado": tipo_servicio["nombre"],
            "observaciones": item_data.observaciones
        }
    )
    
    # Actualizar en la base de datos
    nuevo_item_dict = nuevo_item.model_dump()
    nuevo_item_dict['agregado_en'] = nuevo_item_dict['agregado_en'].isoformat()
    
    modificacion_dict = modificacion.model_dump()
    modificacion_dict['timestamp'] = modificacion_dict['timestamp'].isoformat()
    
    await db.services.update_one(
        {"id": service_id},
        {
            "$push": {
                "items_servicio": nuevo_item_dict,
                "modificaciones": modificacion_dict
            }
        }
    )
    
    # Obtener servicio actualizado
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    # Convertir timestamps
    if isinstance(updated_service.get('fecha_creacion'), str):
        updated_service['fecha_creacion'] = datetime.fromisoformat(updated_service['fecha_creacion'])
    if updated_service.get('fecha_agendada') and isinstance(updated_service['fecha_agendada'], str):
        updated_service['fecha_agendada'] = datetime.fromisoformat(updated_service['fecha_agendada'])
    if updated_service.get('fecha_aprobacion') and isinstance(updated_service['fecha_aprobacion'], str):
        updated_service['fecha_aprobacion'] = datetime.fromisoformat(updated_service['fecha_aprobacion'])
    
    for mod in updated_service.get('modificaciones', []):
        if isinstance(mod['timestamp'], str):
            mod['timestamp'] = datetime.fromisoformat(mod['timestamp'])
    
    for item in updated_service.get('items_servicio', []):
        if isinstance(item['agregado_en'], str):
            item['agregado_en'] = datetime.fromisoformat(item['agregado_en'])
    
    return Servicio(**updated_service)

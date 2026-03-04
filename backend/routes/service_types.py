from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import os
from datetime import datetime, timezone

from models.service_type import ServiceType, ServiceTypeCreate, ServiceTypeUpdate
from middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/service-types", tags=["Tipos de Servicios"])

# Función helper para obtener la base de datos
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.post("", response_model=ServiceType, status_code=status.HTTP_201_CREATED)
async def create_service_type(
    service_type_data: ServiceTypeCreate,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Crear un nuevo tipo de servicio (solo Admin y Supervisor)
    """
    db = get_db()
    
    # Verificar si ya existe uno con el mismo nombre
    existing = await db.service_types.find_one({"nombre": service_type_data.nombre})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un tipo de servicio con ese nombre"
        )
    
    # Crear tipo de servicio
    service_type_dict = service_type_data.model_dump()
    service_type_obj = ServiceType(
        **service_type_dict,
        creado_por_id=current_user["id"],
        creado_por_nombre=current_user["nombre_completo"]
    )
    
    # Convertir a dict y serializar
    doc = service_type_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    doc['fecha_actualizacion'] = doc['fecha_actualizacion'].isoformat()
    
    # Insertar en la base de datos
    await db.service_types.insert_one(doc)
    
    return service_type_obj

@router.get("", response_model=List[ServiceType])
async def get_service_types(
    activo: bool = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener todos los tipos de servicios
    """
    db = get_db()
    
    filter_query = {}
    if activo is not None:
        filter_query["activo"] = activo
    
    service_types = await db.service_types.find(filter_query, {"_id": 0}).sort("nombre", 1).to_list(1000)
    
    # Convertir timestamps
    for st in service_types:
        if isinstance(st.get('fecha_creacion'), str):
            st['fecha_creacion'] = datetime.fromisoformat(st['fecha_creacion'])
        if isinstance(st.get('fecha_actualizacion'), str):
            st['fecha_actualizacion'] = datetime.fromisoformat(st['fecha_actualizacion'])
    
    return service_types

@router.get("/{service_type_id}", response_model=ServiceType)
async def get_service_type(
    service_type_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener un tipo de servicio específico
    """
    db = get_db()
    
    service_type = await db.service_types.find_one({"id": service_type_id}, {"_id": 0})
    if not service_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado"
        )
    
    # Convertir timestamps
    if isinstance(service_type.get('fecha_creacion'), str):
        service_type['fecha_creacion'] = datetime.fromisoformat(service_type['fecha_creacion'])
    if isinstance(service_type.get('fecha_actualizacion'), str):
        service_type['fecha_actualizacion'] = datetime.fromisoformat(service_type['fecha_actualizacion'])
    
    return ServiceType(**service_type)

@router.put("/{service_type_id}", response_model=ServiceType)
async def update_service_type(
    service_type_id: str,
    service_type_data: ServiceTypeUpdate,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Actualizar un tipo de servicio (solo Admin y Supervisor)
    """
    db = get_db()
    
    # Verificar que existe
    existing = await db.service_types.find_one({"id": service_type_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado"
        )
    
    # Preparar datos de actualización
    update_data = service_type_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    # Si se cambia el nombre, verificar que no exista otro con ese nombre
    if "nombre" in update_data:
        existing_name = await db.service_types.find_one({
            "nombre": update_data["nombre"],
            "id": {"$ne": service_type_id}
        })
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un tipo de servicio con ese nombre"
            )
    
    update_data['fecha_actualizacion'] = datetime.now(timezone.utc).isoformat()
    
    # Actualizar
    await db.service_types.update_one(
        {"id": service_type_id},
        {"$set": update_data}
    )
    
    # Obtener actualizado
    updated = await db.service_types.find_one({"id": service_type_id}, {"_id": 0})
    
    # Convertir timestamps
    if isinstance(updated.get('fecha_creacion'), str):
        updated['fecha_creacion'] = datetime.fromisoformat(updated['fecha_creacion'])
    if isinstance(updated.get('fecha_actualizacion'), str):
        updated['fecha_actualizacion'] = datetime.fromisoformat(updated['fecha_actualizacion'])
    
    return ServiceType(**updated)

@router.delete("/{service_type_id}")
async def delete_service_type(
    service_type_id: str,
    current_user: dict = Depends(require_roles(["admin"]))
):
    """
    Eliminar un tipo de servicio (solo Admin)
    Solo si no tiene servicios asociados
    """
    db = get_db()
    
    # Verificar que no tenga servicios asociados
    services_count = await db.services.count_documents({"tipo_servicio_id": service_type_id})
    if services_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar. Hay {services_count} servicios asociados a este tipo."
        )
    
    result = await db.service_types.delete_one({"id": service_type_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado"
        )
    
    return {"message": "Tipo de servicio eliminado exitosamente"}

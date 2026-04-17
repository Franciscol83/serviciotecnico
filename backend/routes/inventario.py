from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4

from models.inventario import Material, MaterialCreate, MaterialUpdate, AjusteStock
from middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/inventario", tags=["inventario"])

# Helper para obtener la base de datos
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]


@router.get("", response_model=List[Material])
async def get_materiales(
    tipo: Optional[str] = Query(None, pattern="^(consumible|herramienta)$"),
    categoria: Optional[str] = None,
    stock_bajo: Optional[bool] = None,
    activo: Optional[bool] = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Listar materiales del inventario
    - Todos los usuarios autenticados pueden ver
    - Filtros: tipo, categoría, stock bajo
    """
    db = get_db()
    
    # Construir filtros
    filtros = {}
    if tipo:
        filtros["tipo"] = tipo
    if categoria:
        filtros["categoria"] = categoria
    if activo is not None:
        filtros["activo"] = activo
    
    # Obtener materiales
    materiales = await db.inventario.find(filtros, {"_id": 0}).to_list(1000)
    
    # Filtrar por stock bajo si se solicita
    if stock_bajo:
        materiales = [m for m in materiales if m.get("cantidad_stock", 0) <= m.get("stock_minimo", 0)]
    
    return materiales


@router.post("", response_model=Material, dependencies=[Depends(require_roles(["admin", "supervisor"]))])
async def create_material(
    material: MaterialCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear nuevo material en inventario
    Solo Admin y Supervisor
    """
    db = get_db()
    
    # Verificar si el código SKU ya existe
    if material.codigo_sku:
        existing = await db.inventario.find_one(
            {"codigo_sku": material.codigo_sku, "activo": True},
            {"_id": 0}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un material con el código SKU: {material.codigo_sku}"
            )
    
    # Determinar estado inicial según stock
    estado_inicial = "disponible"
    if material.cantidad_stock == 0:
        estado_inicial = "agotado"
    elif material.cantidad_stock <= material.stock_minimo:
        estado_inicial = "disponible"  # Pero con alerta
    
    # Crear material
    material_data = material.dict()
    material_data.update({
        "id": str(uuid4()),
        "estado": estado_inicial,
        "creado_por": current_user["nombre_completo"],
        "fecha_creacion": datetime.now(timezone.utc).isoformat(),
        "fecha_actualizacion": None,
        "activo": True
    })
    
    await db.inventario.insert_one(material_data)
    
    # Registrar en historial de movimientos
    await db.inventario_movimientos.insert_one({
        "id": str(uuid4()),
        "material_id": material_data["id"],
        "tipo_movimiento": "creacion",
        "cantidad_anterior": 0,
        "cantidad_nueva": material.cantidad_stock,
        "motivo": "Creación inicial del material",
        "realizado_por": current_user["nombre_completo"],
        "fecha": datetime.now(timezone.utc).isoformat()
    })
    
    return material_data


@router.get("/{material_id}", response_model=Material)
async def get_material(
    material_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener un material específico por ID"""
    db = get_db()
    
    material = await db.inventario.find_one({"id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )
    
    return material


@router.put("/{material_id}", response_model=Material, dependencies=[Depends(require_roles(["admin", "supervisor"]))])
async def update_material(
    material_id: str,
    material_data: MaterialUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar material
    Solo Admin y Supervisor
    """
    db = get_db()
    
    # Verificar que el material existe
    existing_material = await db.inventario.find_one({"id": material_id}, {"_id": 0})
    if not existing_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )
    
    # Si se está actualizando el código SKU, verificar que no exista
    if material_data.codigo_sku and material_data.codigo_sku != existing_material.get("codigo_sku"):
        duplicate = await db.inventario.find_one(
            {"codigo_sku": material_data.codigo_sku, "id": {"$ne": material_id}, "activo": True},
            {"_id": 0}
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un material con el código SKU: {material_data.codigo_sku}"
            )
    
    # Preparar datos de actualización
    update_data = {k: v for k, v in material_data.dict(exclude_unset=True).items() if v is not None}
    
    if update_data:
        update_data["fecha_actualizacion"] = datetime.now(timezone.utc).isoformat()
        
        # Si se actualiza el stock, actualizar el estado
        if "cantidad_stock" in update_data:
            stock_nuevo = update_data["cantidad_stock"]
            stock_minimo = existing_material.get("stock_minimo", 0)
            
            if stock_nuevo == 0:
                update_data["estado"] = "agotado"
            elif stock_nuevo <= stock_minimo:
                update_data["estado"] = "disponible"  # Disponible pero con alerta
            else:
                update_data["estado"] = "disponible"
            
            # Registrar movimiento de stock
            await db.inventario_movimientos.insert_one({
                "id": str(uuid4()),
                "material_id": material_id,
                "tipo_movimiento": "actualizacion",
                "cantidad_anterior": existing_material.get("cantidad_stock", 0),
                "cantidad_nueva": stock_nuevo,
                "motivo": "Actualización manual",
                "realizado_por": current_user["nombre_completo"],
                "fecha": datetime.now(timezone.utc).isoformat()
            })
        
        await db.inventario.update_one(
            {"id": material_id},
            {"$set": update_data}
        )
    
    # Obtener y retornar material actualizado
    updated_material = await db.inventario.find_one({"id": material_id}, {"_id": 0})
    return updated_material


@router.delete("/{material_id}", dependencies=[Depends(require_roles(["admin"]))])
async def delete_material(
    material_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Desactivar material (soft delete)
    Solo Admin
    """
    db = get_db()
    
    result = await db.inventario.update_one(
        {"id": material_id},
        {"$set": {
            "activo": False,
            "fecha_actualizacion": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )
    
    return {"message": "Material desactivado exitosamente"}


@router.post("/{material_id}/ajustar-stock", dependencies=[Depends(require_roles(["admin", "supervisor"]))])
async def ajustar_stock(
    material_id: str,
    cantidad: float = Query(..., description="Cantidad a agregar (positivo) o quitar (negativo)"),
    motivo: str = Query(..., min_length=3),
    current_user: dict = Depends(get_current_user)
):
    """
    Ajustar stock de un material
    - Cantidad positiva: entrada de stock
    - Cantidad negativa: salida de stock
    """
    db = get_db()
    
    # Obtener material actual
    material = await db.inventario.find_one({"id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material no encontrado"
        )
    
    stock_actual = material.get("cantidad_stock", 0)
    stock_nuevo = stock_actual + cantidad
    
    if stock_nuevo < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Stock actual: {stock_actual}, intentando quitar: {abs(cantidad)}"
        )
    
    # Determinar nuevo estado
    stock_minimo = material.get("stock_minimo", 0)
    if stock_nuevo == 0:
        estado_nuevo = "agotado"
    elif stock_nuevo <= stock_minimo:
        estado_nuevo = "disponible"  # Con alerta
    else:
        estado_nuevo = "disponible"
    
    # Actualizar stock
    await db.inventario.update_one(
        {"id": material_id},
        {"$set": {
            "cantidad_stock": stock_nuevo,
            "estado": estado_nuevo,
            "fecha_actualizacion": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Registrar movimiento
    tipo_movimiento = "entrada" if cantidad > 0 else "salida"
    await db.inventario_movimientos.insert_one({
        "id": str(uuid4()),
        "material_id": material_id,
        "tipo_movimiento": tipo_movimiento,
        "cantidad_anterior": stock_actual,
        "cantidad_nueva": stock_nuevo,
        "cantidad_ajuste": cantidad,
        "motivo": motivo,
        "realizado_por": current_user["nombre_completo"],
        "fecha": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Stock ajustado exitosamente",
        "stock_anterior": stock_actual,
        "stock_nuevo": stock_nuevo,
        "diferencia": cantidad
    }


@router.get("/{material_id}/movimientos")
async def get_historial_movimientos(
    material_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener historial de movimientos de un material"""
    db = get_db()
    
    movimientos = await db.inventario_movimientos.find(
        {"material_id": material_id},
        {"_id": 0}
    ).sort("fecha", -1).to_list(100)
    
    return movimientos


@router.get("/alertas/stock-bajo")
async def get_alertas_stock_bajo(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener materiales con stock bajo o agotado
    Útil para dashboard de alertas
    """
    db = get_db()
    
    # Materiales con stock <= stock_minimo
    materiales = await db.inventario.find(
        {"activo": True},
        {"_id": 0}
    ).to_list(1000)
    
    alertas = []
    for material in materiales:
        stock = material.get("cantidad_stock", 0)
        stock_min = material.get("stock_minimo", 0)
        
        if stock == 0:
            alertas.append({
                **material,
                "nivel_alerta": "critico",
                "mensaje": "Material agotado"
            })
        elif stock <= stock_min:
            alertas.append({
                **material,
                "nivel_alerta": "advertencia",
                "mensaje": f"Stock bajo: {stock} {material.get('unidad', 'unidades')} (mínimo: {stock_min})"
            })
    
    return {
        "total_alertas": len(alertas),
        "criticos": len([a for a in alertas if a["nivel_alerta"] == "critico"]),
        "advertencias": len([a for a in alertas if a["nivel_alerta"] == "advertencia"]),
        "alertas": alertas
    }

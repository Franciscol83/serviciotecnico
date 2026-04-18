"""
Rutas para integración con WorldOffice
Endpoints para consultar datos contables y clientes
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import os
from middleware.auth import get_current_user, require_roles
from utils.worldoffice_service import get_worldoffice_service

router = APIRouter(prefix="/worldoffice", tags=["WorldOffice"])


@router.get("/test")
async def test_worldoffice_connection(
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Probar conexión con WorldOffice
    Solo accesible para Admin y Supervisor
    """
    service = get_worldoffice_service()
    result = service.test_connection()
    
    if not result["success"]:
        raise HTTPException(
            status_code=503,
            detail=result.get("message", "Error conectando con WorldOffice")
        )
    
    return result


@router.get("/clientes")
async def get_clientes_worldoffice(
    search: Optional[str] = Query(None, description="Buscar por nombre, NIT o código"),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener clientes desde WorldOffice
    """
    service = get_worldoffice_service()
    
    try:
        clientes = service.get_clientes(search=search, limit=limit)
        return {
            "total": len(clientes),
            "clientes": clientes
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo clientes: {str(e)}"
        )


@router.get("/clientes/{nit}")
async def get_cliente_by_nit(
    nit: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Buscar cliente por NIT en WorldOffice
    """
    service = get_worldoffice_service()
    
    try:
        cliente = service.get_cliente_by_nit(nit)
        
        if not cliente:
            raise HTTPException(
                status_code=404,
                detail=f"Cliente con NIT {nit} no encontrado en WorldOffice"
            )
        
        return cliente
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error buscando cliente: {str(e)}"
        )


@router.get("/productos")
async def get_productos_worldoffice(
    search: Optional[str] = Query(None, description="Buscar por nombre o código"),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener productos/servicios desde WorldOffice
    """
    service = get_worldoffice_service()
    
    try:
        productos = service.get_productos(search=search, limit=limit)
        return {
            "total": len(productos),
            "productos": productos
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo productos: {str(e)}"
        )


@router.get("/inventario/{codigo}")
async def get_inventario_item(
    codigo: str,
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Obtener información de inventario de un producto
    """
    service = get_worldoffice_service()
    
    try:
        item = service.get_inventario_item(codigo)
        
        if not item:
            raise HTTPException(
                status_code=404,
                detail=f"Producto con código {codigo} no encontrado"
            )
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo inventario: {str(e)}"
        )


@router.get("/facturas/pendientes")
async def get_facturas_pendientes(
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Obtener facturas pendientes de pago desde WorldOffice
    """
    service = get_worldoffice_service()
    
    try:
        facturas = service.get_facturas_pendientes()
        
        # Calcular totales
        total_pendiente = sum(f.get("saldo", 0) for f in facturas)
        
        return {
            "total_facturas": len(facturas),
            "total_pendiente": total_pendiente,
            "facturas": facturas
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo facturas: {str(e)}"
        )


@router.post("/sync/manual")
async def trigger_manual_sync(
    current_user: dict = Depends(require_roles(["admin"]))
):
    """
    Ejecutar sincronización manual (solo Admin)
    Útil para sincronizar fuera del horario programado
    """
    import subprocess
    
    try:
        # Ejecutar script de sincronización en background
        result = subprocess.Popen(
            ['/app/backend/scripts/run_sync.sh'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        return {
            "message": "Sincronización iniciada en segundo plano",
            "pid": result.pid,
            "info": "Revisa /app/logs/sync_worldoffice.log para ver el progreso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error iniciando sincronización: {str(e)}"
        )


@router.get("/sync/logs")
async def get_sync_logs(
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["admin", "supervisor"]))
):
    """
    Obtener logs de sincronizaciones recientes
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    try:
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        logs = await db.logs_sincronizacion.find(
            {},
            {"_id": 0}
        ).sort("fecha", -1).limit(limit).to_list(limit)
        
        client.close()
        
        return {
            "total": len(logs),
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo logs: {str(e)}"
        )

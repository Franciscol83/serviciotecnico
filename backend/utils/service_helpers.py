"""
Utilidades helper para servicios
Extrae lógica compleja de routes/services.py
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone


def build_service_filters(
    estado: Optional[str] = None,
    tecnico_id: Optional[str] = None,
    tipo_servicio_id: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None
) -> Dict[str, Any]:
    """
    Construye el diccionario de filtros para consultas de MongoDB
    Reduce complejidad de get_services()
    """
    filtros = {}
    
    if estado:
        filtros["estado"] = estado
    
    if tecnico_id:
        filtros["tecnico_asignado_id"] = tecnico_id
    
    if tipo_servicio_id:
        filtros["tipo_servicio_id"] = tipo_servicio_id
    
    # Filtro de rango de fechas
    if fecha_desde or fecha_hasta:
        filtros["fecha_creacion"] = {}
        if fecha_desde:
            filtros["fecha_creacion"]["$gte"] = fecha_desde
        if fecha_hasta:
            filtros["fecha_creacion"]["$lte"] = fecha_hasta
    
    return filtros


def validate_service_data(service_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Valida los datos de un servicio antes de crear/actualizar
    Retorna (es_valido, mensaje_error)
    """
    # Validar cliente
    if not service_data.get("cliente"):
        return False, "Datos del cliente son requeridos"
    
    cliente = service_data["cliente"]
    if not cliente.get("nombre"):
        return False, "Nombre del cliente es requerido"
    
    # Validar tipo de servicio
    if not service_data.get("tipo_servicio_id"):
        return False, "Tipo de servicio es requerido"
    
    # Validar ubicación
    ubicacion = service_data.get("ubicacion_servicio")
    if ubicacion and ubicacion not in ["en_local", "por_fuera"]:
        return False, "Ubicación debe ser 'en_local' o 'por_fuera'"
    
    # Si es "en_local", validar campos de facturación
    if ubicacion == "en_local":
        if not cliente.get("tipo_documento"):
            return False, "Tipo de documento requerido para servicios en local"
        if not cliente.get("numero_documento"):
            return False, "Número de documento requerido para servicios en local"
        if not cliente.get("medio_pago"):
            return False, "Medio de pago requerido para servicios en local"
    
    return True, None


def generate_case_number(year: int, sequence: int) -> str:
    """
    Genera número de caso en formato TN-YYYY-XXXXX
    """
    return f"TN-{year}-{sequence:05d}"


async def get_next_sequence_number(db, year: int) -> int:
    """
    Obtiene el siguiente número de secuencia para el año actual
    """
    # Buscar el último servicio del año
    ultimo_servicio = await db.services.find_one(
        {"numero_caso": {"$regex": f"^TN-{year}-"}},
        sort=[("numero_caso", -1)]
    )
    
    if ultimo_servicio:
        # Extraer número de secuencia del último caso
        ultimo_numero = ultimo_servicio["numero_caso"].split("-")[-1]
        return int(ultimo_numero) + 1
    
    return 1  # Primera orden del año


def prepare_service_response(service: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepara un servicio para respuesta, agregando campos calculados
    """
    # Calcular total de items
    items_count = 1  # Servicio principal
    if service.get("items_adicionales"):
        items_count += len(service["items_adicionales"])
    
    service["total_items"] = items_count
    
    # Agregar flag de puede_editar según estado
    service["puede_editar"] = service.get("estado") in ["pendiente_aprobacion", "aprobado"]
    
    # Agregar flag de requiere_aprobacion
    service["requiere_aprobacion"] = service.get("estado") == "pendiente_aprobacion"
    
    return service


def calculate_service_stats(services: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula estadísticas agregadas de una lista de servicios
    """
    total = len(services)
    
    por_estado = {}
    por_tecnico = {}
    
    for servicio in services:
        # Contar por estado
        estado = servicio.get("estado", "desconocido")
        por_estado[estado] = por_estado.get(estado, 0) + 1
        
        # Contar por técnico
        tecnico = servicio.get("tecnico_asignado_nombre", "Sin asignar")
        por_tecnico[tecnico] = por_tecnico.get(tecnico, 0) + 1
    
    return {
        "total": total,
        "por_estado": por_estado,
        "por_tecnico": por_tecnico
    }


def create_modification_record(
    tipo: str,
    usuario_nombre: str,
    detalles: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Crea un registro de modificación para el historial
    """
    return {
        "tipo": tipo,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "usuario_nombre": usuario_nombre,
        "detalles": detalles or {}
    }


async def verify_service_type_exists(db, tipo_servicio_id: str) -> Dict[str, Any]:
    """
    Verifica que un tipo de servicio existe y está activo
    Retorna el tipo de servicio o lanza HTTPException
    """
    from fastapi import HTTPException, status
    
    tipo_servicio = await db.service_types.find_one({"id": tipo_servicio_id, "activo": True})
    if not tipo_servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de servicio no encontrado o inactivo"
        )
    return tipo_servicio


async def verify_technician_exists(db, tecnico_id: str) -> Dict[str, Any]:
    """
    Verifica que un técnico existe
    Retorna el técnico o lanza HTTPException
    """
    from fastapi import HTTPException, status
    
    tecnico = await db.users.find_one({"id": tecnico_id, "role": "tecnico"})
    if not tecnico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Técnico no encontrado"
        )
    return tecnico


def determine_initial_status(user_role: str) -> str:
    """
    Determina el estado inicial del servicio según el rol del usuario
    """
    return "aprobado" if user_role in ["admin", "supervisor"] else "pendiente_aprobacion"

"""
Utilidades helper para reportes y estadísticas
Extrae lógica compleja de routes/reportes.py
"""
from typing import Dict, List, Any
from datetime import datetime, timedelta
import calendar


def calculate_services_by_state(services: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calcula servicios agrupados por estado"""
    result = {}
    for s in services:
        estado = s.get("estado", "desconocido")
        result[estado] = result.get(estado, 0) + 1
    return result


def calculate_services_by_technician(services: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calcula servicios agrupados por técnico"""
    result = {}
    for s in services:
        tecnico = s.get("tecnico_asignado_nombre", "Sin asignar")
        result[tecnico] = result.get(tecnico, 0) + 1
    return result


def calculate_services_by_type(services: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calcula servicios agrupados por tipo"""
    result = {}
    for s in services:
        tipo = s.get("tipo_servicio_nombre", "Desconocido")
        result[tipo] = result.get(tipo, 0) + 1
    return result


def calculate_services_by_location(services: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calcula servicios por ubicación"""
    result = {"en_local": 0, "por_fuera": 0}
    for s in services:
        ubicacion = s.get("ubicacion_servicio", "por_fuera")
        result[ubicacion] += 1
    return result


def calculate_materials_consumed(reportes: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calcula materiales más consumidos
    Retorna top 10
    """
    materiales = {}
    for r in reportes:
        for mat in r.get("materiales_consumidos", []):
            nombre = mat.get("nombre", "Desconocido")
            cantidad = mat.get("cantidad", 0)
            if nombre in materiales:
                materiales[nombre] += cantidad
            else:
                materiales[nombre] = cantidad
    
    # Ordenar y retornar top 10
    sorted_materials = dict(
        sorted(materiales.items(), key=lambda x: x[1], reverse=True)[:10]
    )
    return sorted_materials


def calculate_average_time(reportes: List[Dict[str, Any]]) -> float:
    """Calcula tiempo promedio dedicado por servicio"""
    tiempos = [
        r.get("tiempo_dedicado_horas", 0) 
        for r in reportes 
        if r.get("tiempo_dedicado_horas")
    ]
    
    if not tiempos:
        return 0.0
    
    return sum(tiempos) / len(tiempos)


def calculate_technician_performance(
    services: List[Dict[str, Any]],
    tecnicos: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calcula tasa de cumplimiento por técnico
    """
    performance = []
    
    for tecnico in tecnicos:
        tecnico_id = tecnico["id"]
        tecnico_nombre = tecnico["nombre_completo"]
        
        # Servicios asignados
        servicios_asignados = [
            s for s in services 
            if s.get("tecnico_asignado_id") == tecnico_id
        ]
        total_asignados = len(servicios_asignados)
        
        # Servicios completados
        completados = len([
            s for s in servicios_asignados 
            if s.get("estado") == "completado"
        ])
        
        # Tasa de cumplimiento
        tasa = (completados / total_asignados * 100) if total_asignados > 0 else 0
        
        performance.append({
            "tecnico": tecnico_nombre,
            "tecnico_id": tecnico_id,
            "total_asignados": total_asignados,
            "completados": completados,
            "tasa_cumplimiento": round(tasa, 2)
        })
    
    return performance


def calculate_services_by_month(services: List[Dict[str, Any]], months: int = 6) -> List[Dict[str, Any]]:
    """
    Calcula servicios por mes (últimos N meses)
    """
    result = []
    hoy = datetime.now()
    
    for i in range(months):
        mes_fecha = hoy - timedelta(days=30 * i)
        mes_nombre = calendar.month_name[mes_fecha.month]
        year_month = mes_fecha.strftime("%Y-%m")
        
        # Contar servicios del mes
        count = len([
            s for s in services 
            if isinstance(s.get("fecha_creacion"), str) and 
            year_month in s["fecha_creacion"]
        ])
        
        result.append({
            "mes": mes_nombre,
            "year": mes_fecha.year,
            "cantidad": count
        })
    
    result.reverse()  # Ordenar cronológicamente
    return result


def build_statistics_summary(
    services: List[Dict[str, Any]],
    reportes: List[Dict[str, Any]],
    tecnicos: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Construye el objeto completo de estadísticas
    Reduce complejidad de get_estadisticas()
    """
    return {
        "resumen": {
            "total_servicios": len(services),
            "total_reportes": len(reportes),
            "total_tecnicos": len(tecnicos),
            "tiempo_promedio_horas": round(calculate_average_time(reportes), 2)
        },
        "servicios_por_estado": calculate_services_by_state(services),
        "servicios_por_tecnico": calculate_services_by_technician(services),
        "servicios_por_tipo": calculate_services_by_type(services),
        "servicios_por_ubicacion": calculate_services_by_location(services),
        "materiales_mas_consumidos": calculate_materials_consumed(reportes),
        "cumplimiento_tecnicos": calculate_technician_performance(services, tecnicos),
        "servicios_por_mes": calculate_services_by_month(services, months=6)
    }

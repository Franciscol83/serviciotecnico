from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class MaterialConsumido(BaseModel):
    """Material usado en el servicio"""
    nombre: str
    cantidad: float
    unidad: str  # unidades, metros, litros, etc.
    observaciones: Optional[str] = None

class FotoTrabajo(BaseModel):
    """Foto del trabajo realizado"""
    url: str  # Base64 o URL
    descripcion: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReporteBase(BaseModel):
    """Base model para reporte técnico"""
    servicio_id: str
    observaciones_tecnico: str = ""
    tiempo_dedicado_horas: Optional[float] = None
    materiales_consumidos: List[MaterialConsumido] = []
    fotos: List[FotoTrabajo] = []
    problemas_encontrados: Optional[str] = None
    trabajo_realizado: str = ""
    recomendaciones: Optional[str] = None

class ReporteCreate(ReporteBase):
    """Model para crear reporte"""
    pass

class Reporte(ReporteBase):
    """Model completo de reporte"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Técnico que crea el reporte
    tecnico_id: str
    tecnico_nombre: str = ""
    
    # Firma digital del cliente
    firma_cliente_base64: Optional[str] = None
    cliente_firma_nombre: Optional[str] = None  # Nombre de quien firma
    
    # Fechas
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_completado: Optional[datetime] = None
    
    # Estado
    completado: bool = False

class ReporteUpdate(BaseModel):
    """Model para actualizar reporte"""
    observaciones_tecnico: Optional[str] = None
    tiempo_dedicado_horas: Optional[float] = None
    materiales_consumidos: Optional[List[MaterialConsumido]] = None
    fotos: Optional[List[FotoTrabajo]] = None
    problemas_encontrados: Optional[str] = None
    trabajo_realizado: Optional[str] = None
    recomendaciones: Optional[str] = None
    firma_cliente_base64: Optional[str] = None
    cliente_firma_nombre: Optional[str] = None
    completado: Optional[bool] = None

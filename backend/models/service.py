from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime, timezone
import uuid

# Estados de servicio
EstadoServicio = Literal["pendiente_aprobacion", "aprobado", "en_proceso", "completado", "cancelado", "anulado"]

# Prefijos de factura
PrefijoFactura = Literal["MLP", "FE"]

# Ubicación del servicio
UbicacionServicio = Literal["en_local", "por_fuera"]

class ClienteInfo(BaseModel):
    """Información del cliente"""
    nombre: str
    telefono: str
    email: EmailStr
    direccion: str

class ItemServicio(BaseModel):
    """Item individual de servicio dentro de una orden"""
    tipo_servicio_id: str
    tipo_servicio_nombre: str
    observaciones: str = ""
    agregado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    agregado_por_id: Optional[str] = None
    agregado_por_nombre: Optional[str] = None

class ModificacionServicio(BaseModel):
    """Registro de modificación en el servicio"""
    tipo: Literal["creacion", "aprobacion", "cambio_estado", "reasignacion", "anulacion", "modificacion", "agregar_item"]
    usuario_id: str
    usuario_nombre: str
    usuario_role: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    detalles: dict = {}

class ServicioBase(BaseModel):
    """Base model para servicio"""
    cliente: ClienteInfo
    tipo_servicio_id: str  # ID del tipo de servicio del catálogo
    observaciones: str = ""  # Detalles específicos del caso
    ubicacion_servicio: UbicacionServicio = "por_fuera"
    fecha_agendada: Optional[datetime] = None

class ServicioCreate(ServicioBase):
    """Model para crear servicio"""
    tecnico_asignado_id: str
    items_adicionales: List[dict] = []  # Para crear múltiples servicios en una orden

class ServicioUpdate(BaseModel):
    """Model para actualizar servicio"""
    cliente: Optional[ClienteInfo] = None
    tipo_servicio_id: Optional[str] = None
    observaciones: Optional[str] = None
    tecnico_asignado_id: Optional[str] = None
    fecha_agendada: Optional[datetime] = None
    estado: Optional[EstadoServicio] = None
    numero_factura: Optional[str] = None
    prefijo_factura: Optional[PrefijoFactura] = None

class ServicioAnular(BaseModel):
    """Model para anular servicio"""
    razon_anulacion: str

class AgregarItemServicio(BaseModel):
    """Model para agregar items adicionales a una orden existente"""
    tipo_servicio_id: str
    observaciones: str = ""

class Servicio(ServicioBase):
    """Model completo de servicio"""
    model_config = ConfigDict(extra="ignore")
    
    # Identificación
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    caso_numero: str  # TN-2025-00001
    caso_uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Agrupación de servicios en una orden
    orden_principal_id: Optional[str] = None  # Si es None, este ES la orden principal
    items_servicio: List[ItemServicio] = []  # Servicios adicionales en esta orden
    
    # Tipo de servicio (del catálogo) - primer servicio de la orden
    tipo_servicio_nombre: str = ""  # Cached para performance
    
    # Estado
    estado: EstadoServicio = "pendiente_aprobacion"
    
    # Técnico asignado
    tecnico_asignado_id: str
    tecnico_asignado_nombre: str = ""
    tecnico_asignado_original: Optional[str] = None  # Para histórico
    
    # Facturación (se completa después)
    numero_factura: Optional[str] = None
    prefijo_factura: Optional[PrefijoFactura] = None
    
    # Fechas
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_agendada: Optional[datetime] = None
    fecha_completado: Optional[datetime] = None
    fecha_anulado: Optional[datetime] = None
    
    # Auditoría - Creación
    creado_por_id: str
    creado_por_nombre: str
    creado_por_role: str
    
    # Auditoría - Aprobación
    aprobado_por_id: Optional[str] = None
    aprobado_por_nombre: Optional[str] = None
    fecha_aprobacion: Optional[datetime] = None
    
    # Auditoría - Anulación
    anulado_por_id: Optional[str] = None
    anulado_por_nombre: Optional[str] = None
    razon_anulacion: Optional[str] = None
    
    # Histórico de modificaciones
    modificaciones: List[ModificacionServicio] = []

class ServicioStats(BaseModel):
    """Estadísticas de servicios"""
    total: int
    pendiente_aprobacion: int
    aprobado: int
    en_proceso: int
    completado: int
    cancelado: int
    anulado: int

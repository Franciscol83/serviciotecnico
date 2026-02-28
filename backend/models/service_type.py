from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class ServiceTypeBase(BaseModel):
    """Base model para tipo de servicio"""
    nombre: str
    descripcion: str
    activo: bool = True

class ServiceTypeCreate(ServiceTypeBase):
    """Model para crear tipo de servicio"""
    pass

class ServiceTypeUpdate(BaseModel):
    """Model para actualizar tipo de servicio"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class ServiceType(ServiceTypeBase):
    """Model completo de tipo de servicio"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creado_por_id: str
    creado_por_nombre: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_actualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

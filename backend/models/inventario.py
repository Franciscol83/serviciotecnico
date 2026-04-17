from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Material(BaseModel):
    """Modelo para material/herramienta en inventario"""
    id: str
    nombre: str
    descripcion: Optional[str] = None
    tipo: str  # "consumible" o "herramienta"
    categoria: Optional[str] = None  # "cables", "componentes", "herramientas", etc.
    
    # Stock
    cantidad_stock: float
    unidad: str  # "unidades", "metros", "kilogramos", etc.
    stock_minimo: float = 0
    
    # Precios y proveedor
    precio_unitario: Optional[float] = None
    proveedor: Optional[str] = None
    codigo_sku: Optional[str] = None
    
    # Integración con web
    url_producto_web: Optional[str] = None
    imagen_url: Optional[str] = None
    especificaciones_tecnicas: Optional[dict] = None
    
    # Estado
    estado: str = "disponible"  # "disponible", "agotado", "asignado"
    ubicacion_bodega: Optional[str] = None
    
    # Metadata
    activo: bool = True
    creado_por: str
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None


class MaterialCreate(BaseModel):
    """Datos para crear un material"""
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = None
    tipo: str = Field(..., pattern="^(consumible|herramienta)$")
    categoria: Optional[str] = None
    
    cantidad_stock: float = Field(..., ge=0)
    unidad: str
    stock_minimo: float = Field(default=0, ge=0)
    
    precio_unitario: Optional[float] = Field(None, ge=0)
    proveedor: Optional[str] = None
    codigo_sku: Optional[str] = None
    
    url_producto_web: Optional[str] = None
    imagen_url: Optional[str] = None
    especificaciones_tecnicas: Optional[dict] = None
    
    ubicacion_bodega: Optional[str] = None


class MaterialUpdate(BaseModel):
    """Datos para actualizar un material"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    descripcion: Optional[str] = None
    tipo: Optional[str] = Field(None, pattern="^(consumible|herramienta)$")
    categoria: Optional[str] = None
    
    cantidad_stock: Optional[float] = Field(None, ge=0)
    unidad: Optional[str] = None
    stock_minimo: Optional[float] = Field(None, ge=0)
    
    precio_unitario: Optional[float] = Field(None, ge=0)
    proveedor: Optional[str] = None
    codigo_sku: Optional[str] = None
    
    url_producto_web: Optional[str] = None
    imagen_url: Optional[str] = None
    especificaciones_tecnicas: Optional[dict] = None
    
    estado: Optional[str] = None
    ubicacion_bodega: Optional[str] = None
    activo: Optional[bool] = None


class AjusteStock(BaseModel):
    """Modelo para ajuste de stock"""
    material_id: str
    cantidad: float
    tipo_ajuste: str  # "entrada", "salida", "ajuste"
    motivo: str
    realizado_por: str
    fecha: datetime

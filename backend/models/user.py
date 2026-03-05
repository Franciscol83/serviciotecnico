from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime, timezone
import uuid

# Roles disponibles
UserRole = Literal["admin", "supervisor", "asesor", "tecnico"]

class UserProfile(BaseModel):
    """Perfil adicional del usuario"""
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    documento_identidad: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    foto_url: Optional[str] = None
    codigo_worldoffice: Optional[str] = None  # Código único en WorldOffice

class UserBase(BaseModel):
    """Base model para usuario"""
    email: EmailStr
    nombre_completo: str
    role: UserRole  # Rol principal para compatibilidad
    roles: List[UserRole] = []  # Múltiples roles
    activo: bool = True

class UserCreate(UserBase):
    """Model para crear usuario"""
    password: str
    profile: Optional[UserProfile] = None

class UserUpdate(BaseModel):
    """Model para actualizar usuario"""
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    role: Optional[UserRole] = None  # Rol principal
    roles: Optional[List[UserRole]] = None  # Múltiples roles
    activo: Optional[bool] = None
    profile: Optional[UserProfile] = None

class UserChangePassword(BaseModel):
    """Model para cambiar contraseña"""
    password_actual: str
    password_nueva: str

class User(UserBase):
    """Model completo de usuario (sin password)"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile: Optional[UserProfile] = None
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_actualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    """Model de usuario en base de datos (con password hash)"""
    password_hash: str

class UserLogin(BaseModel):
    """Model para login"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Model para token de autenticación"""
    access_token: str
    token_type: str = "bearer"
    user: User

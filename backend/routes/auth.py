from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
import os
from datetime import datetime

from models.user import UserLogin, UserCreate, Token, User, UserInDB
from utils.password import hash_password, verify_password
from utils.jwt_handler import create_access_token
from middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Función helper para obtener la base de datos
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    """
    Registrar un nuevo usuario (solo Admin puede crear usuarios)
    """
    db = get_db()
    
    # Solo admin puede crear usuarios
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear usuarios"
        )
    
    # Verificar si el email ya existe
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear usuario
    user_dict = user_data.model_dump(exclude={'password'})
    user_obj = UserInDB(**user_dict, password_hash=hash_password(user_data.password))
    
    # Convertir a dict y serializar datetime
    doc = user_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    doc['fecha_actualizacion'] = doc['fecha_actualizacion'].isoformat()
    
    # Insertar en la base de datos
    await db.users.insert_one(doc)
    
    # Retornar usuario sin password
    return User(**user_dict, id=user_obj.id, fecha_creacion=user_obj.fecha_creacion, fecha_actualizacion=user_obj.fecha_actualizacion)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, response: Response):
    """
    Iniciar sesión y obtener token JWT
    El token se envía en una cookie httpOnly para mayor seguridad
    """
    db = get_db()
    
    # Buscar usuario por email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar contraseña
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar si el usuario está activo
    if not user.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador."
        )
    
    # Crear token JWT
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"], "role": user["role"]})
    
    # Setear cookie httpOnly (SEGURIDAD: protege contra XSS)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # No accesible desde JavaScript
        secure=True,  # Solo HTTPS
        samesite="lax",  # Protección CSRF
        max_age=86400  # 24 horas
    )
    
    # Convertir timestamps a datetime
    if isinstance(user.get('fecha_creacion'), str):
        user['fecha_creacion'] = datetime.fromisoformat(user['fecha_creacion'])
    if isinstance(user.get('fecha_actualizacion'), str):
        user['fecha_actualizacion'] = datetime.fromisoformat(user['fecha_actualizacion'])
    
    # Retornar usuario (el token está en la cookie)
    user_data = {k: v for k, v in user.items() if k not in ['_id', 'password_hash']}
    
    return Token(
        access_token=access_token,  # Enviado también en response por compatibilidad transitoria
        user=User(**user_data)
    )

@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Obtener información del usuario actual
    """
    return User(**current_user)

@router.post("/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """
    Cerrar sesión eliminando la cookie httpOnly
    """
    response.delete_cookie(key="access_token")
    return {"message": "Sesión cerrada exitosamente"}

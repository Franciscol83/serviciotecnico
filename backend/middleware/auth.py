from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

from utils.jwt_handler import verify_token

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncIOMotorDatabase = None):
    """
    Obtener el usuario actual desde el token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Obtener usuario de la base de datos
    from motor.motor_asyncio import AsyncIOMotorClient
    if db is None:
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if user is None:
        raise credentials_exception
    
    # Convertir timestamps ISO a datetime si es necesario
    if isinstance(user.get('fecha_creacion'), str):
        from datetime import datetime
        user['fecha_creacion'] = datetime.fromisoformat(user['fecha_creacion'])
    if isinstance(user.get('fecha_actualizacion'), str):
        from datetime import datetime
        user['fecha_actualizacion'] = datetime.fromisoformat(user['fecha_actualizacion'])
    
    return user

def require_roles(allowed_roles: List[str]):
    """
    Decorator para requerir roles específicos
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permisos suficientes. Roles requeridos: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

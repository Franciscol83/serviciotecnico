from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
import os
from datetime import datetime, timezone

from models.user import User, UserCreate, UserUpdate, UserChangePassword, UserInDB
from utils.password import hash_password, verify_password
from middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["Usuarios"])

# Función helper para obtener la base de datos
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

@router.get("", response_model=List[User])
async def get_users(current_user: dict = Depends(require_roles(["admin", "supervisor"]))):
    """
    Obtener todos los usuarios (Admin y Supervisor)
    """
    db = get_db()
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Convertir timestamps
    for user in users:
        if isinstance(user.get('fecha_creacion'), str):
            user['fecha_creacion'] = datetime.fromisoformat(user['fecha_creacion'])
        if isinstance(user.get('fecha_actualizacion'), str):
            user['fecha_actualizacion'] = datetime.fromisoformat(user['fecha_actualizacion'])
    
    return users

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: dict = Depends(require_roles(["admin", "supervisor"]))):
    """
    Obtener un usuario específico por ID
    """
    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Convertir timestamps
    if isinstance(user.get('fecha_creacion'), str):
        user['fecha_creacion'] = datetime.fromisoformat(user['fecha_creacion'])
    if isinstance(user.get('fecha_actualizacion'), str):
        user['fecha_actualizacion'] = datetime.fromisoformat(user['fecha_actualizacion'])
    
    return User(**user)

@router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(require_roles(["admin", "supervisor"]))):
    """
    Actualizar un usuario (Admin y Supervisor)
    Solo Admin puede cambiar roles y desactivar usuarios
    """
    db = get_db()
    # Verificar si el usuario existe
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Solo admin puede cambiar role y activo
    if current_user["role"] != "admin":
        if user_data.role is not None or user_data.activo is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores pueden cambiar roles o desactivar usuarios"
            )
    
    # Preparar datos de actualización
    update_data = user_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    update_data['fecha_actualizacion'] = datetime.now(timezone.utc).isoformat()
    
    # Actualizar usuario
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    # Obtener usuario actualizado
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    # Convertir timestamps
    if isinstance(updated_user.get('fecha_creacion'), str):
        updated_user['fecha_creacion'] = datetime.fromisoformat(updated_user['fecha_creacion'])
    if isinstance(updated_user.get('fecha_actualizacion'), str):
        updated_user['fecha_actualizacion'] = datetime.fromisoformat(updated_user['fecha_actualizacion'])
    
    return User(**updated_user)

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_roles(["admin"]))):
    """
    Eliminar un usuario (solo Admin)
    """
    db = get_db()
    # No permitir que el admin se elimine a sí mismo
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"message": "Usuario eliminado exitosamente"}

@router.put("/{user_id}/change-password")
async def change_password(user_id: str, password_data: UserChangePassword, current_user: dict = Depends(get_current_user)):
    """
    Cambiar contraseña de un usuario
    Los usuarios solo pueden cambiar su propia contraseña
    """
    db = get_db()
    # Solo el mismo usuario puede cambiar su contraseña
    if user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes cambiar tu propia contraseña"
        )
    
    # Obtener usuario con password_hash
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar contraseña actual
    if not verify_password(password_data.password_actual, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    new_password_hash = hash_password(password_data.password_nueva)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password_hash": new_password_hash,
            "fecha_actualizacion": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Contraseña actualizada exitosamente"}

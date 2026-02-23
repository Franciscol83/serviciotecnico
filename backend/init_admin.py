"""
Script para crear el primer usuario administrador
Ejecutar: python init_admin.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

from models.user import UserInDB, UserProfile
from utils.password import hash_password

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    # Conectar a MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Verificar si ya existe un admin
    existing_admin = await db.users.find_one({"email": "admin@tecnonacho.com"})
    if existing_admin:
        print("❌ Ya existe un usuario administrador con email admin@tecnonacho.com")
        return
    
    # Crear usuario admin
    admin = UserInDB(
        email="admin@tecnonacho.com",
        nombre_completo="Administrador",
        role="admin",
        activo=True,
        password_hash=hash_password("admin123"),
        profile=UserProfile()
    )
    
    # Convertir a dict y serializar
    doc = admin.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    doc['fecha_actualizacion'] = doc['fecha_actualizacion'].isoformat()
    
    # Insertar en la base de datos
    await db.users.insert_one(doc)
    
    print("✅ Usuario administrador creado exitosamente!")
    print("📧 Email: admin@tecnonacho.com")
    print("🔑 Contraseña: admin123")
    print("⚠️  IMPORTANTE: Cambia la contraseña después del primer login")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())

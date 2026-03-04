"""
Script para crear tipos de servicios por defecto
Ejecutar: python init_service_types.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_default_service_types():
    # Conectar a MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Obtener admin user
    admin = await db.users.find_one({"email": "admin@tecnonacho.com"})
    if not admin:
        print("❌ No se encontró el usuario administrador")
        return
    
    # Tipos de servicios por defecto
    default_types = [
        {
            "nombre": "Instalación de Cámaras",
            "descripcion": "Instalación completa de sistema de cámaras de seguridad (CCTV)",
        },
        {
            "nombre": "Instalación de Control de Acceso",
            "descripcion": "Instalación de sistemas de control de acceso (cerraduras, lectores, software)",
        },
        {
            "nombre": "Instalación de Sistema de Sonido",
            "descripcion": "Instalación de equipos de audio y sonido profesional",
        },
        {
            "nombre": "Configuración de PC",
            "descripcion": "Configuración, instalación de software y mantenimiento de computadoras",
        },
        {
            "nombre": "Visita Técnica",
            "descripcion": "Revisión técnica y diagnóstico de sistemas",
        },
        {
            "nombre": "Mantenimiento Preventivo",
            "descripcion": "Mantenimiento preventivo programado de equipos",
        },
        {
            "nombre": "Reparación de Equipos",
            "descripcion": "Reparación correctiva de equipos electrónicos",
        },
        {
            "nombre": "Instalación de Redes",
            "descripcion": "Instalación y configuración de redes de datos",
        },
    ]
    
    created_count = 0
    
    for type_data in default_types:
        # Verificar si ya existe
        existing = await db.service_types.find_one({"nombre": type_data["nombre"]})
        if existing:
            print(f"⏭️  '{type_data['nombre']}' ya existe, saltando...")
            continue
        
        # Crear tipo de servicio
        service_type = {
            "id": str(uuid.uuid4()),
            "nombre": type_data["nombre"],
            "descripcion": type_data["descripcion"],
            "activo": True,
            "creado_por_id": admin["id"],
            "creado_por_nombre": admin["nombre_completo"],
            "fecha_creacion": datetime.now(timezone.utc).isoformat(),
            "fecha_actualizacion": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.service_types.insert_one(service_type)
        print(f"✅ Creado: {type_data['nombre']}")
        created_count += 1
    
    client.close()
    
    print(f"\n🎉 Proceso completado!")
    print(f"📊 Tipos de servicios creados: {created_count}")
    print(f"📊 Total de tipos en el sistema: {len(default_types)}")

if __name__ == "__main__":
    asyncio.run(create_default_service_types())

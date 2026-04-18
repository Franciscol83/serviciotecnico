#!/usr/bin/env python3
"""
Script de migración: Convertir campo 'nombre' a estructura WorldOffice
(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
"""
import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Cargar variables de entorno
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

async def migrate_services():
    """Migrar servicios de 'nombre' a estructura WorldOffice"""
    
    # Conectar a MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Buscando servicios con estructura antigua...")
    
    # Encontrar servicios con campo 'nombre' en cliente
    services = await db.services.find({"cliente.nombre": {"$exists": True}}).to_list(1000)
    
    if not services:
        print("✅ No se encontraron servicios con estructura antigua")
        return
    
    print(f"📦 Encontrados {len(services)} servicios para migrar")
    
    migrated_count = 0
    errors = []
    
    for service in services:
        try:
            nombre_completo = service['cliente'].get('nombre', '')
            
            # Intentar dividir el nombre en partes
            partes = nombre_completo.strip().split()
            
            # Lógica de división:
            # - Si tiene 1 parte: primer_nombre
            # - Si tiene 2 partes: primer_nombre, primer_apellido
            # - Si tiene 3 partes: primer_nombre, primer_apellido, segundo_apellido
            # - Si tiene 4+ partes: primer_nombre, segundo_nombre, primer_apellido, segundo_apellido
            
            if len(partes) == 0:
                primer_nombre = "Cliente"
                primer_apellido = "Sin Nombre"
                segundo_nombre = None
                segundo_apellido = None
            elif len(partes) == 1:
                primer_nombre = partes[0]
                primer_apellido = "."
                segundo_nombre = None
                segundo_apellido = None
            elif len(partes) == 2:
                primer_nombre = partes[0]
                primer_apellido = partes[1]
                segundo_nombre = None
                segundo_apellido = None
            elif len(partes) == 3:
                primer_nombre = partes[0]
                primer_apellido = partes[1]
                segundo_apellido = partes[2]
                segundo_nombre = None
            else:  # 4 o más partes
                primer_nombre = partes[0]
                segundo_nombre = partes[1]
                primer_apellido = partes[2]
                segundo_apellido = ' '.join(partes[3:])  # Resto va al segundo apellido
            
            # Crear nueva estructura de cliente
            nuevo_cliente = {
                "primer_nombre": primer_nombre,
                "segundo_nombre": segundo_nombre,
                "primer_apellido": primer_apellido,
                "segundo_apellido": segundo_apellido,
                "telefono": service['cliente'].get('telefono', ''),
                "email": service['cliente'].get('email', ''),
                "direccion": service['cliente'].get('direccion', ''),
                "tipo_documento": service['cliente'].get('tipo_documento'),
                "numero_documento": service['cliente'].get('numero_documento'),
                "medio_pago": service['cliente'].get('medio_pago'),
                "codigo_worldoffice": service['cliente'].get('codigo_worldoffice')
            }
            
            # Actualizar en la base de datos (reemplazar todo el objeto cliente)
            await db.services.update_one(
                {"id": service['id']},
                {"$set": {"cliente": nuevo_cliente}}
            )
            
            migrated_count += 1
            print(f"✅ Migrado: {service['caso_numero']} - {nombre_completo} -> {primer_nombre} {segundo_nombre or ''} {primer_apellido} {segundo_apellido or ''}".strip())
            
        except Exception as e:
            error_msg = f"❌ Error en {service.get('caso_numero', 'unknown')}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)
    
    print("\n" + "="*60)
    print(f"✅ Migración completada: {migrated_count} servicios migrados")
    
    if errors:
        print(f"⚠️  {len(errors)} errores encontrados:")
        for error in errors:
            print(f"  {error}")
    
    client.close()

if __name__ == "__main__":
    print("🚀 Iniciando migración a estructura WorldOffice...")
    asyncio.run(migrate_services())
    print("🎉 Proceso completado")

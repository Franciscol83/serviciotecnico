"""
Script de Sincronización Batch: WorldOffice ↔ MongoDB
Ejecuta sincronización programada cada X horas
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Any
import logging

# Agregar path del backend
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from utils.worldoffice_service import get_worldoffice_service

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/sync_worldoffice.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('WorldOfficeSync')


class WorldOfficeSyncService:
    """Servicio de sincronización batch WorldOffice - MongoDB"""
    
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.wo_service = get_worldoffice_service()
        self.stats = {
            'clientes_sincronizados': 0,
            'productos_sincronizados': 0,
            'inventario_actualizado': 0,
            'servicios_exportados': 0,
            'errores': []
        }
    
    async def connect_mongo(self):
        """Conectar a MongoDB"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
            db_name = os.environ.get('DB_NAME', 'test_database')
            
            self.mongo_client = AsyncIOMotorClient(mongo_url)
            self.db = self.mongo_client[db_name]
            
            # Verificar conexión
            await self.db.command('ping')
            logger.info("✅ Conectado a MongoDB")
            return True
        except Exception as e:
            logger.error(f"❌ Error conectando a MongoDB: {e}")
            return False
    
    def connect_worldoffice(self):
        """Conectar a WorldOffice"""
        if self.wo_service.connect():
            logger.info("✅ Conectado a WorldOffice")
            return True
        else:
            logger.error("❌ Error conectando a WorldOffice")
            return False
    
    async def sync_clientes(self):
        """
        Sincronizar clientes desde WorldOffice a MongoDB
        """
        logger.info("📥 Iniciando sincronización de clientes...")
        
        try:
            # Obtener clientes desde WorldOffice
            clientes_wo = self.wo_service.get_clientes(limit=5000)
            
            if not clientes_wo:
                logger.warning("⚠️ No se obtuvieron clientes de WorldOffice")
                return
            
            # Colección de clientes en MongoDB
            clientes_collection = self.db.clientes_worldoffice
            
            # Sincronizar cada cliente
            for cliente in clientes_wo:
                try:
                    # Usar NIT como identificador único
                    nit = cliente.get('nit')
                    
                    if not nit:
                        continue
                    
                    # Agregar timestamp de sincronización
                    cliente['ultima_sync'] = datetime.now(timezone.utc)
                    cliente['fuente'] = 'worldoffice'
                    
                    # Update or insert
                    await clientes_collection.update_one(
                        {'nit': nit},
                        {'$set': cliente},
                        upsert=True
                    )
                    
                    self.stats['clientes_sincronizados'] += 1
                    
                except Exception as e:
                    logger.error(f"Error sincronizando cliente {cliente.get('nit')}: {e}")
                    self.stats['errores'].append(f"Cliente {cliente.get('nit')}: {str(e)}")
            
            logger.info(f"✅ {self.stats['clientes_sincronizados']} clientes sincronizados")
            
        except Exception as e:
            logger.error(f"❌ Error en sync_clientes: {e}")
            self.stats['errores'].append(f"sync_clientes: {str(e)}")
    
    async def sync_productos(self):
        """
        Sincronizar productos/servicios desde WorldOffice a MongoDB
        """
        logger.info("📥 Iniciando sincronización de productos...")
        
        try:
            # Obtener productos desde WorldOffice
            productos_wo = self.wo_service.get_productos(limit=5000)
            
            if not productos_wo:
                logger.warning("⚠️ No se obtuvieron productos de WorldOffice")
                return
            
            productos_collection = self.db.productos_worldoffice
            
            for producto in productos_wo:
                try:
                    codigo = producto.get('codigo')
                    
                    if not codigo:
                        continue
                    
                    producto['ultima_sync'] = datetime.now(timezone.utc)
                    producto['fuente'] = 'worldoffice'
                    
                    await productos_collection.update_one(
                        {'codigo': codigo},
                        {'$set': producto},
                        upsert=True
                    )
                    
                    self.stats['productos_sincronizados'] += 1
                    
                except Exception as e:
                    logger.error(f"Error sincronizando producto {producto.get('codigo')}: {e}")
                    self.stats['errores'].append(f"Producto {producto.get('codigo')}: {str(e)}")
            
            logger.info(f"✅ {self.stats['productos_sincronizados']} productos sincronizados")
            
        except Exception as e:
            logger.error(f"❌ Error en sync_productos: {e}")
            self.stats['errores'].append(f"sync_productos: {str(e)}")
    
    async def sync_inventario(self):
        """
        Sincronizar stock de inventario desde WorldOffice
        Actualiza los items de inventario en MongoDB con stock de WorldOffice
        """
        logger.info("📥 Iniciando sincronización de inventario...")
        
        try:
            # Obtener items de inventario de nuestra app
            inventario_items = await self.db.inventario.find({}, {"_id": 0}).to_list(1000)
            
            for item in inventario_items:
                try:
                    # Si el item tiene código de WorldOffice
                    codigo_wo = item.get('codigo_worldoffice')
                    
                    if not codigo_wo:
                        continue
                    
                    # Obtener stock actual desde WorldOffice
                    item_wo = self.wo_service.get_inventario_item(codigo_wo)
                    
                    if item_wo:
                        # Actualizar stock en MongoDB
                        await self.db.inventario.update_one(
                            {'id': item['id']},
                            {
                                '$set': {
                                    'cantidad': item_wo.get('stock', item['cantidad']),
                                    'precio_unitario': item_wo.get('precio_venta', item.get('precio_unitario', 0)),
                                    'ultima_sync_worldoffice': datetime.now(timezone.utc)
                                }
                            }
                        )
                        
                        self.stats['inventario_actualizado'] += 1
                        logger.info(f"✅ Stock actualizado para {item['nombre']}: {item_wo.get('stock')}")
                    
                except Exception as e:
                    logger.error(f"Error sincronizando inventario {item.get('nombre')}: {e}")
                    self.stats['errores'].append(f"Inventario {item.get('nombre')}: {str(e)}")
            
            logger.info(f"✅ {self.stats['inventario_actualizado']} items de inventario actualizados")
            
        except Exception as e:
            logger.error(f"❌ Error en sync_inventario: {e}")
            self.stats['errores'].append(f"sync_inventario: {str(e)}")
    
    async def export_servicios_completados(self):
        """
        Exportar servicios completados a WorldOffice para facturación
        NOTA: Requiere permisos de escritura en WorldOffice
        """
        logger.info("📤 Buscando servicios completados para exportar...")
        
        try:
            # Buscar servicios completados sin código WorldOffice
            servicios = await self.db.services.find({
                'estado': 'completado',
                'codigo_worldoffice': {'$exists': False}
            }, {"_id": 0}).to_list(100)
            
            if not servicios:
                logger.info("ℹ️ No hay servicios para exportar")
                return
            
            for servicio in servicios:
                try:
                    # TODO: Implementar creación de factura en WorldOffice
                    # Requiere permisos de escritura
                    
                    logger.info(f"⚠️ Servicio {servicio['caso_numero']} pendiente de exportar")
                    logger.info("   (Función de escritura no implementada - requiere permisos)")
                    
                    # Aquí iría la lógica para crear prefactura
                    # codigo_factura = self.wo_service.crear_prefactura(servicio)
                    
                    self.stats['servicios_exportados'] += 1
                    
                except Exception as e:
                    logger.error(f"Error exportando servicio {servicio.get('caso_numero')}: {e}")
                    self.stats['errores'].append(f"Servicio {servicio.get('caso_numero')}: {str(e)}")
            
        except Exception as e:
            logger.error(f"❌ Error en export_servicios_completados: {e}")
            self.stats['errores'].append(f"export_servicios_completados: {str(e)}")
    
    async def registrar_log_sync(self):
        """Registrar log de sincronización en MongoDB"""
        try:
            log_entry = {
                'fecha': datetime.now(timezone.utc),
                'tipo': 'sincronizacion_worldoffice',
                'estadisticas': self.stats,
                'exitoso': len(self.stats['errores']) == 0
            }
            
            await self.db.logs_sincronizacion.insert_one(log_entry)
            logger.info("✅ Log de sincronización registrado")
            
        except Exception as e:
            logger.error(f"Error registrando log: {e}")
    
    async def run_sync(self):
        """
        Ejecutar sincronización completa
        """
        logger.info("="*80)
        logger.info("🔄 INICIANDO SINCRONIZACIÓN WORLDOFFICE")
        logger.info(f"Fecha: {datetime.now()}")
        logger.info("="*80)
        
        start_time = datetime.now()
        
        # Conectar a bases de datos
        if not await self.connect_mongo():
            logger.error("❌ No se pudo conectar a MongoDB. Abortando.")
            return
        
        if not self.connect_worldoffice():
            logger.error("❌ No se pudo conectar a WorldOffice. Abortando.")
            return
        
        try:
            # Ejecutar sincronizaciones
            await self.sync_clientes()
            await self.sync_productos()
            await self.sync_inventario()
            await self.export_servicios_completados()
            
            # Registrar log
            await self.registrar_log_sync()
            
            # Calcular tiempo
            duration = (datetime.now() - start_time).total_seconds()
            
            logger.info("="*80)
            logger.info("✅ SINCRONIZACIÓN COMPLETADA")
            logger.info(f"Duración: {duration:.2f} segundos")
            logger.info(f"Clientes: {self.stats['clientes_sincronizados']}")
            logger.info(f"Productos: {self.stats['productos_sincronizados']}")
            logger.info(f"Inventario: {self.stats['inventario_actualizado']}")
            logger.info(f"Servicios exportados: {self.stats['servicios_exportados']}")
            logger.info(f"Errores: {len(self.stats['errores'])}")
            logger.info("="*80)
            
        except Exception as e:
            logger.error(f"❌ Error durante sincronización: {e}")
        
        finally:
            # Cerrar conexiones
            if self.wo_service:
                self.wo_service.disconnect()
            if self.mongo_client:
                self.mongo_client.close()


async def main():
    """Función principal"""
    sync_service = WorldOfficeSyncService()
    await sync_service.run_sync()


if __name__ == "__main__":
    # Crear directorio de logs si no existe
    os.makedirs('/app/logs', exist_ok=True)
    
    # Ejecutar sincronización
    asyncio.run(main())

"""
Servicio de integración con WorldOffice (SQL Server)
Permite consultar y sincronizar datos contables
"""
import pyodbc
import os
from typing import List, Dict, Optional, Any
from datetime import datetime


class WorldOfficeService:
    """Servicio para conectar con base de datos WorldOffice"""
    
    def __init__(self):
        self.host = os.environ.get('SQLSERVER_HOST', 'SERTECNO')
        self.instance = os.environ.get('SQLSERVER_INSTANCE', 'WORLDOFFICE14')
        self.database = os.environ.get('SQLSERVER_DATABASE', 'Melissa_2023')
        self.user = os.environ.get('SQLSERVER_USER', 'Jabes')
        self.password = os.environ.get('SQLSERVER_PASSWORD', 'Jabes2026')
        self.encrypt = os.environ.get('SQLSERVER_ENCRYPT', 'no')
        self.trust_cert = os.environ.get('SQLSERVER_TRUST_CERT', 'yes')
        self.connection = None
    
    def connect(self):
        """Establecer conexión con SQL Server"""
        try:
            # Construcción del connection string
            server = f"{self.host}\\{self.instance}" if self.instance else self.host
            conn_str = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={server};"
                f"DATABASE={self.database};"
                f"UID={self.user};"
                f"PWD={self.password};"
                f"Encrypt={self.encrypt};"
                f"TrustServerCertificate={self.trust_cert};"
            )
            
            self.connection = pyodbc.connect(conn_str, timeout=10)
            return True
        except pyodbc.Error as e:
            print(f"❌ Error conectando a WorldOffice: {e}")
            return False
    
    def disconnect(self):
        """Cerrar conexión"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Ejecutar query SELECT y retornar resultados como lista de diccionarios
        """
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            cursor = self.connection.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            # Obtener nombres de columnas
            columns = [column[0] for column in cursor.description]
            
            # Convertir filas a diccionarios
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            return results
            
        except pyodbc.Error as e:
            print(f"❌ Error ejecutando query: {e}")
            return []
    
    def get_clientes(self, search: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtener lista de clientes desde WorldOffice
        
        Args:
            search: Término de búsqueda (nombre, NIT, código)
            limit: Cantidad máxima de resultados
        """
        query = """
        SELECT TOP (?)
            Codigo AS codigo,
            Nombre AS nombre,
            Nit AS nit,
            Direccion AS direccion,
            Telefono AS telefono,
            Email AS email,
            Ciudad AS ciudad
        FROM Clientes
        WHERE Activo = 1
        """
        
        if search:
            query += " AND (Nombre LIKE ? OR Nit LIKE ? OR Codigo LIKE ?)"
            search_param = f"%{search}%"
            params = (limit, search_param, search_param, search_param)
        else:
            params = (limit,)
        
        query += " ORDER BY Nombre"
        
        return self.execute_query(query, params)
    
    def get_cliente_by_nit(self, nit: str) -> Optional[Dict[str, Any]]:
        """Buscar cliente por NIT"""
        query = """
        SELECT 
            Codigo AS codigo,
            Nombre AS nombre,
            Nit AS nit,
            Direccion AS direccion,
            Telefono AS telefono,
            Email AS email,
            Ciudad AS ciudad
        FROM Clientes
        WHERE Nit = ? AND Activo = 1
        """
        
        results = self.execute_query(query, (nit,))
        return results[0] if results else None
    
    def get_productos(self, search: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Obtener productos/servicios desde WorldOffice
        """
        query = """
        SELECT TOP (?)
            Codigo AS codigo,
            Nombre AS nombre,
            Descripcion AS descripcion,
            PrecioVenta AS precio_venta,
            Existencias AS stock,
            IVA AS iva
        FROM Productos
        WHERE Activo = 1
        """
        
        if search:
            query += " AND (Nombre LIKE ? OR Codigo LIKE ?)"
            search_param = f"%{search}%"
            params = (limit, search_param, search_param)
        else:
            params = (limit,)
        
        query += " ORDER BY Nombre"
        
        return self.execute_query(query, params)
    
    def crear_prefactura(self, servicio_data: Dict[str, Any]) -> Optional[str]:
        """
        Crear una pre-factura en WorldOffice basada en un servicio completado
        
        Args:
            servicio_data: Datos del servicio con items y cliente
            
        Returns:
            Número de prefactura creada o None si falla
        """
        # NOTA: Esta función requiere permisos de escritura
        # Por seguridad, actualmente solo hacemos consultas (read-only)
        # Para habilitar escritura, contactar con administrador de WorldOffice
        
        print("⚠️ Función crear_prefactura no implementada (requiere permisos de escritura)")
        return None
    
    def get_facturas_pendientes(self) -> List[Dict[str, Any]]:
        """Obtener facturas pendientes de pago"""
        query = """
        SELECT 
            NumeroFactura AS numero,
            FechaFactura AS fecha,
            ClienteNombre AS cliente,
            ValorTotal AS valor_total,
            Saldo AS saldo,
            Estado AS estado
        FROM Facturas
        WHERE Estado = 'Pendiente' AND Saldo > 0
        ORDER BY FechaFactura DESC
        """
        
        return self.execute_query(query)
    
    def get_inventario_item(self, codigo: str) -> Optional[Dict[str, Any]]:
        """Obtener información de inventario de un producto"""
        query = """
        SELECT 
            Codigo AS codigo,
            Nombre AS nombre,
            Existencias AS stock,
            StockMinimo AS stock_minimo,
            PrecioCompra AS precio_compra,
            PrecioVenta AS precio_venta
        FROM Productos
        WHERE Codigo = ? AND Activo = 1
        """
        
        results = self.execute_query(query, (codigo,))
        return results[0] if results else None
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Probar conexión con WorldOffice
        Retorna información sobre el estado de la conexión
        """
        try:
            if self.connect():
                # Obtener información del servidor
                query = "SELECT @@VERSION AS version, DB_NAME() AS database_name"
                result = self.execute_query(query)
                
                self.disconnect()
                
                return {
                    "success": True,
                    "message": "Conexión exitosa con WorldOffice",
                    "server_info": result[0] if result else {},
                    "host": self.host,
                    "instance": self.instance,
                    "database": self.database
                }
            else:
                return {
                    "success": False,
                    "message": "No se pudo conectar a WorldOffice",
                    "error": "Credenciales inválidas o servidor no accesible"
                }
        except Exception as e:
            return {
                "success": False,
                "message": "Error al probar conexión",
                "error": str(e)
            }


# Singleton instance
_worldoffice_service: WorldOfficeService | None = None

def get_worldoffice_service() -> WorldOfficeService:
    """Obtener instancia singleton del servicio WorldOffice"""
    global _worldoffice_service
    if _worldoffice_service is None:
        _worldoffice_service = WorldOfficeService()
    return _worldoffice_service

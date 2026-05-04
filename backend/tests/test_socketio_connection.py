"""
Test de conexión Socket.IO
"""
import asyncio
import socketio

async def test_socketio_connection():
    """Probar conexión a Socket.IO"""
    
    # Cliente Socket.IO
    sio = socketio.AsyncClient()
    
    connected = False
    authenticated = False
    
    @sio.event
    async def connect():
        nonlocal connected
        connected = True
        print("✅ Conectado a Socket.IO")
        
        # Autenticar
        await sio.emit('authenticate', {'usuario_id': 'test-user-123'})
    
    @sio.event
    async def authenticated(data):
        nonlocal authenticated
        authenticated = True
        print(f"✅ Autenticado: {data}")
    
    @sio.event
    async def disconnect():
        print("❌ Desconectado de Socket.IO")
    
    @sio.event
    async def connect_error(data):
        print(f"❌ Error de conexión: {data}")
    
    try:
        print("🔌 Intentando conectar a Socket.IO en localhost:8001...")
        await sio.connect('http://localhost:8001', transports=['websocket', 'polling'])
        
        # Esperar autenticación
        await asyncio.sleep(2)
        
        if connected and authenticated:
            print("✅ Socket.IO funcionando correctamente!")
            print("✅ Mensajería en tiempo real lista!")
        else:
            print(f"⚠️ Estado: Conectado={connected}, Autenticado={authenticated}")
        
        await sio.disconnect()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return connected and authenticated

if __name__ == '__main__':
    result = asyncio.run(test_socketio_connection())
    exit(0 if result else 1)

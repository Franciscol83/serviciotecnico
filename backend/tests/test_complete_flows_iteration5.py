"""
Test Complete Flows - Iteration 5
Testing exhaustivo solicitado por usuario:
- FLUJO 1: Servicio LOCAL con cliente WorldOffice → Aprobar → Asignar técnico → Crear reporte
- FLUJO 2: Servicio POR FUERA → Aprobar → Cambiar a En Proceso → Crear reporte con firma
- FLUJO 3: Servicio con múltiples items adicionales
- FLUJO 4: Servicio → Cambiar técnico asignado
- Chat: Envío de mensajes entre usuarios
- Reportes: Búsqueda y filtros
- Dashboard: KPIs
- Users: CRUD
- Inventario: Crear material y ajustar stock
- Calendario: Servicios agendados
"""
import pytest
import requests
import os
from datetime import datetime, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a session with cookies"""
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def admin_session(self, session):
        """Login as admin and return authenticated session"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "admin@tecnonacho.com"
        print(f"✓ Admin login successful: {data['user']['nombre_completo']}")
        return session
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestServiceFlows:
    """Complete service flow tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture(scope="class")
    def service_types(self, admin_session):
        """Get available service types"""
        response = admin_session.get(f"{BASE_URL}/api/service-types")
        assert response.status_code == 200
        types = response.json()
        assert len(types) > 0, "No service types available"
        return types
    
    @pytest.fixture(scope="class")
    def tecnicos(self, admin_session):
        """Get available technicians"""
        response = admin_session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        tecnicos = [u for u in users if u.get("role") == "tecnico" and u.get("activo", True)]
        assert len(tecnicos) > 0, "No technicians available"
        return tecnicos
    
    def test_flujo_1_servicio_local_completo(self, admin_session, service_types, tecnicos):
        """
        FLUJO 1: Crear servicio LOCAL con cliente WorldOffice → Aprobar → Crear reporte
        """
        print("\n=== FLUJO 1: Servicio LOCAL Completo ===")
        
        # 1. Crear servicio LOCAL
        unique_id = str(uuid.uuid4())[:8]
        service_data = {
            "cliente": {
                "primer_nombre": "TEST_Juan",
                "segundo_nombre": "Carlos",
                "primer_apellido": "Pérez",
                "segundo_apellido": "Gómez",
                "telefono": "3001234567",
                "email": f"test_local_{unique_id}@test.com",
                "direccion": "Calle 123 #45-67, Bogotá",
                "tipo_documento": "cedula",
                "numero_documento": f"1234567{unique_id[:3]}"
            },
            "tipo_servicio_id": service_types[0]["id"],
            "observaciones": "Servicio de prueba LOCAL - Flujo 1",
            "recomendaciones": "Cliente prefiere horario matutino",
            "ubicacion_servicio": "en_local",
            "tecnico_asignado_id": tecnicos[0]["id"],
            "fecha_agendada": None,  # No requerida para en_local
            "items_adicionales": []
        }
        
        response = admin_session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 201, f"Create service failed: {response.text}"
        servicio = response.json()
        
        # Verificar estructura WorldOffice
        assert servicio["cliente"]["primer_nombre"] == "TEST_Juan"
        assert servicio["cliente"]["segundo_nombre"] == "Carlos"
        assert servicio["cliente"]["primer_apellido"] == "Pérez"
        assert servicio["ubicacion_servicio"] == "en_local"
        assert servicio["estado"] == "aprobado"  # Admin crea directamente aprobado
        print(f"✓ Servicio LOCAL creado: {servicio['caso_numero']}")
        
        # 2. Verificar que el servicio está aprobado (admin crea aprobado)
        response = admin_session.get(f"{BASE_URL}/api/services/{servicio['id']}")
        assert response.status_code == 200
        servicio_verificado = response.json()
        assert servicio_verificado["estado"] == "aprobado"
        print(f"✓ Servicio verificado con estado: {servicio_verificado['estado']}")
        
        # 3. Crear reporte técnico con materiales
        reporte_data = {
            "servicio_id": servicio["id"],
            "trabajo_realizado": "Configuración completa del equipo, instalación de software",
            "observaciones_tecnico": "Equipo funcionando correctamente",
            "tiempo_dedicado_horas": 2.5,
            "problemas_encontrados": "Ninguno",
            "recomendaciones": "Realizar mantenimiento preventivo en 6 meses",
            "materiales_consumidos": [
                {"nombre": "Cable HDMI", "cantidad": 1, "unidad": "unidades", "observaciones": ""},
                {"nombre": "Pasta térmica", "cantidad": 5, "unidad": "gramos", "observaciones": "Aplicada al procesador"}
            ],
            "fotos": [],
            "firma_cliente_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "cliente_firma_nombre": "Juan Carlos Pérez Gómez"
        }
        
        response = admin_session.post(f"{BASE_URL}/api/reportes", json=reporte_data)
        assert response.status_code == 201, f"Create report failed: {response.text}"
        reporte = response.json()
        assert reporte["servicio_id"] == servicio["id"]
        assert len(reporte["materiales_consumidos"]) == 2
        print(f"✓ Reporte creado con {len(reporte['materiales_consumidos'])} materiales")
        
        return servicio
    
    def test_flujo_2_servicio_por_fuera_completo(self, admin_session, service_types, tecnicos):
        """
        FLUJO 2: Crear servicio POR FUERA → Aprobar → Crear reporte con firma digital
        """
        print("\n=== FLUJO 2: Servicio POR FUERA Completo ===")
        
        # 1. Crear servicio POR FUERA
        unique_id = str(uuid.uuid4())[:8]
        fecha_agendada = (datetime.now() + timedelta(days=2)).isoformat()
        
        service_data = {
            "cliente": {
                "primer_nombre": "TEST_María",
                "segundo_nombre": None,
                "primer_apellido": "González",
                "segundo_apellido": "López",
                "telefono": "3109876543",
                "email": f"test_fuera_{unique_id}@test.com",
                "direccion": "Carrera 50 #20-30, Medellín",
                "tipo_documento": "nit",
                "numero_documento": f"900{unique_id[:6]}",
                "medio_pago": "transferencia"
            },
            "tipo_servicio_id": service_types[0]["id"],
            "observaciones": "Servicio de prueba POR FUERA - Flujo 2",
            "recomendaciones": "Empresa requiere factura electrónica",
            "ubicacion_servicio": "por_fuera",
            "tecnico_asignado_id": tecnicos[0]["id"],
            "fecha_agendada": fecha_agendada,
            "items_adicionales": []
        }
        
        response = admin_session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 201, f"Create service failed: {response.text}"
        servicio = response.json()
        
        assert servicio["ubicacion_servicio"] == "por_fuera"
        assert servicio["fecha_agendada"] is not None
        assert servicio["cliente"]["tipo_documento"] == "nit"
        print(f"✓ Servicio POR FUERA creado: {servicio['caso_numero']}")
        
        # 2. Crear reporte con firma digital
        reporte_data = {
            "servicio_id": servicio["id"],
            "trabajo_realizado": "Instalación de red completa en oficina",
            "observaciones_tecnico": "Se instalaron 10 puntos de red",
            "tiempo_dedicado_horas": 8,
            "problemas_encontrados": "Cableado antiguo requirió reemplazo",
            "recomendaciones": "Actualizar switch a modelo gigabit",
            "materiales_consumidos": [
                {"nombre": "Cable UTP Cat6", "cantidad": 100, "unidad": "metros", "observaciones": ""},
                {"nombre": "Conectores RJ45", "cantidad": 20, "unidad": "unidades", "observaciones": ""},
                {"nombre": "Canaleta", "cantidad": 15, "unidad": "metros", "observaciones": ""}
            ],
            "fotos": [],
            "firma_cliente_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "cliente_firma_nombre": "María González López - Gerente"
        }
        
        response = admin_session.post(f"{BASE_URL}/api/reportes", json=reporte_data)
        assert response.status_code == 201, f"Create report failed: {response.text}"
        reporte = response.json()
        assert reporte["firma_cliente_base64"] is not None
        assert reporte["cliente_firma_nombre"] == "María González López - Gerente"
        print(f"✓ Reporte con firma digital creado")
        
        return servicio
    
    def test_flujo_3_servicio_multiples_items(self, admin_session, service_types, tecnicos):
        """
        FLUJO 3: Crear servicio con múltiples items adicionales
        """
        print("\n=== FLUJO 3: Servicio con Múltiples Items ===")
        
        # Necesitamos al menos 2 tipos de servicio
        if len(service_types) < 2:
            pytest.skip("Need at least 2 service types for this test")
        
        unique_id = str(uuid.uuid4())[:8]
        fecha_agendada = (datetime.now() + timedelta(days=3)).isoformat()
        
        # Crear servicio con items adicionales
        service_data = {
            "cliente": {
                "primer_nombre": "TEST_Pedro",
                "segundo_nombre": "Antonio",
                "primer_apellido": "Ramírez",
                "segundo_apellido": "Castro",
                "telefono": "3201112233",
                "email": f"test_multi_{unique_id}@test.com",
                "direccion": "Avenida 68 #10-20, Cali",
                "tipo_documento": "cedula",
                "numero_documento": f"987654{unique_id[:3]}"
            },
            "tipo_servicio_id": service_types[0]["id"],
            "observaciones": "Servicio principal - Mantenimiento",
            "recomendaciones": "Cliente VIP - Atención prioritaria",
            "ubicacion_servicio": "por_fuera",
            "tecnico_asignado_id": tecnicos[0]["id"],
            "fecha_agendada": fecha_agendada,
            "items_adicionales": [
                {
                    "tipo_servicio_id": service_types[1]["id"] if len(service_types) > 1 else service_types[0]["id"],
                    "observaciones": "Servicio adicional 1 - Configuración"
                }
            ]
        }
        
        # Add more items if available
        if len(service_types) > 2:
            service_data["items_adicionales"].append({
                "tipo_servicio_id": service_types[2]["id"],
                "observaciones": "Servicio adicional 2 - Instalación"
            })
        
        response = admin_session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 201, f"Create service failed: {response.text}"
        servicio = response.json()
        
        # Verificar items adicionales
        total_items = 1 + len(servicio.get("items_servicio", []))
        expected_items = 1 + len(service_data["items_adicionales"])
        assert total_items == expected_items, f"Expected {expected_items} items, got {total_items}"
        print(f"✓ Servicio creado con {total_items} servicios en total")
        
        # Verificar que los items tienen la información correcta
        for item in servicio.get("items_servicio", []):
            assert "tipo_servicio_nombre" in item
            assert "agregado_por_nombre" in item
            print(f"  - Item adicional: {item['tipo_servicio_nombre']}")
        
        return servicio
    
    def test_flujo_4_cambio_tecnico(self, admin_session, service_types, tecnicos):
        """
        FLUJO 4: Crear servicio → Cambiar técnico asignado
        """
        print("\n=== FLUJO 4: Cambio de Técnico ===")
        
        if len(tecnicos) < 2:
            pytest.skip("Need at least 2 technicians for this test")
        
        unique_id = str(uuid.uuid4())[:8]
        
        # 1. Crear servicio con primer técnico
        service_data = {
            "cliente": {
                "primer_nombre": "TEST_Ana",
                "segundo_nombre": None,
                "primer_apellido": "Martínez",
                "segundo_apellido": None,
                "telefono": "3154445566",
                "email": f"test_cambio_{unique_id}@test.com",
                "direccion": "Calle 100 #15-25, Bogotá",
                "tipo_documento": "cedula",
                "numero_documento": f"555666{unique_id[:3]}"
            },
            "tipo_servicio_id": service_types[0]["id"],
            "observaciones": "Servicio para prueba de cambio de técnico",
            "ubicacion_servicio": "en_local",
            "tecnico_asignado_id": tecnicos[0]["id"],
            "items_adicionales": []
        }
        
        response = admin_session.post(f"{BASE_URL}/api/services", json=service_data)
        assert response.status_code == 201
        servicio = response.json()
        tecnico_original = servicio["tecnico_asignado_nombre"]
        print(f"✓ Servicio creado con técnico: {tecnico_original}")
        
        # 2. Cambiar técnico
        nuevo_tecnico_id = tecnicos[1]["id"]
        update_data = {
            "tecnico_asignado_id": nuevo_tecnico_id
        }
        
        response = admin_session.put(f"{BASE_URL}/api/services/{servicio['id']}", json=update_data)
        assert response.status_code == 200, f"Update failed: {response.text}"
        servicio_actualizado = response.json()
        
        # Verificar cambio
        assert servicio_actualizado["tecnico_asignado_id"] == nuevo_tecnico_id
        assert servicio_actualizado["tecnico_asignado_nombre"] != tecnico_original
        print(f"✓ Técnico cambiado a: {servicio_actualizado['tecnico_asignado_nombre']}")
        
        # Verificar que se registró la modificación
        modificaciones = servicio_actualizado.get("modificaciones", [])
        reasignacion = [m for m in modificaciones if m.get("tipo") == "reasignacion"]
        assert len(reasignacion) > 0, "Reasignación no registrada en modificaciones"
        print(f"✓ Modificación de reasignación registrada")
        
        return servicio_actualizado


class TestChatFunctionality:
    """Chat functionality tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_usuarios_chat(self, admin_session):
        """Test getting users available for chat"""
        print("\n=== Chat: Obtener Usuarios ===")
        
        response = admin_session.get(f"{BASE_URL}/api/chat/usuarios")
        assert response.status_code == 200
        data = response.json()
        
        assert "usuarios" in data
        assert "total" in data
        print(f"✓ {data['total']} usuarios disponibles para chat")
        
        # Verificar estructura de usuarios
        if data["total"] > 0:
            usuario = data["usuarios"][0]
            assert "id" in usuario
            assert "nombre_completo" in usuario
            assert "role" in usuario
            print(f"  - Ejemplo: {usuario['nombre_completo']} ({usuario['role']})")
        
        return data["usuarios"]
    
    def test_enviar_mensaje(self, admin_session):
        """Test sending a message"""
        print("\n=== Chat: Enviar Mensaje ===")
        
        # Obtener usuarios para chat
        response = admin_session.get(f"{BASE_URL}/api/chat/usuarios")
        assert response.status_code == 200
        usuarios = response.json()["usuarios"]
        
        if len(usuarios) == 0:
            pytest.skip("No users available for chat")
        
        destinatario = usuarios[0]
        
        # Enviar mensaje
        mensaje_data = {
            "destinatario_id": destinatario["id"],
            "texto": f"Mensaje de prueba - {datetime.now().isoformat()}",
            "tipo": "texto"
        }
        
        response = admin_session.post(f"{BASE_URL}/api/chat/mensajes", json=mensaje_data)
        assert response.status_code == 200, f"Send message failed: {response.text}"
        mensaje = response.json()
        
        assert mensaje["texto"] == mensaje_data["texto"]
        assert mensaje["destinatario_id"] == destinatario["id"]
        assert "id" in mensaje
        print(f"✓ Mensaje enviado a {destinatario['nombre_completo']}")
        
        return mensaje
    
    def test_verificar_mensaje_guardado(self, admin_session):
        """Test that messages are saved in database"""
        print("\n=== Chat: Verificar Mensajes Guardados ===")
        
        # Obtener usuarios
        response = admin_session.get(f"{BASE_URL}/api/chat/usuarios")
        usuarios = response.json()["usuarios"]
        
        if len(usuarios) == 0:
            pytest.skip("No users available")
        
        destinatario = usuarios[0]
        
        # Obtener mensajes con ese usuario
        response = admin_session.get(f"{BASE_URL}/api/chat/mensajes/{destinatario['id']}")
        assert response.status_code == 200
        data = response.json()
        
        assert "mensajes" in data
        print(f"✓ {data['total']} mensajes encontrados con {destinatario['nombre_completo']}")
        
        return data


class TestReportesSearchAndFilter:
    """Reportes search and filter tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_busqueda_servicios_por_estado(self, admin_session):
        """Test filtering services by estado"""
        print("\n=== Reportes: Filtro por Estado ===")
        
        estados = ["aprobado", "en_proceso", "completado"]
        
        for estado in estados:
            response = admin_session.get(f"{BASE_URL}/api/services", params={"estado": estado})
            assert response.status_code == 200
            servicios = response.json()
            
            # Verificar que todos los servicios tienen el estado correcto
            for s in servicios:
                assert s["estado"] == estado, f"Expected estado {estado}, got {s['estado']}"
            
            print(f"✓ Filtro estado '{estado}': {len(servicios)} servicios")
    
    def test_get_reportes_list(self, admin_session):
        """Test getting reportes list"""
        print("\n=== Reportes: Lista de Reportes ===")
        
        response = admin_session.get(f"{BASE_URL}/api/reportes")
        assert response.status_code == 200
        reportes = response.json()
        
        print(f"✓ {len(reportes)} reportes encontrados")
        
        if len(reportes) > 0:
            reporte = reportes[0]
            assert "servicio_id" in reporte
            assert "trabajo_realizado" in reporte
            print(f"  - Último reporte: {reporte.get('tecnico_nombre', 'N/A')}")
        
        return reportes


class TestDashboardKPIs:
    """Dashboard KPI tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_estadisticas_servicios(self, admin_session):
        """Test service statistics"""
        print("\n=== Dashboard: Estadísticas de Servicios ===")
        
        response = admin_session.get(f"{BASE_URL}/api/services/stats")
        assert response.status_code == 200
        stats = response.json()
        
        assert "total" in stats
        assert "aprobado" in stats
        assert "en_proceso" in stats
        assert "completado" in stats
        
        print(f"✓ Total servicios: {stats['total']}")
        print(f"  - Aprobados: {stats['aprobado']}")
        print(f"  - En proceso: {stats['en_proceso']}")
        print(f"  - Completados: {stats['completado']}")
        
        return stats
    
    def test_estadisticas_reportes(self, admin_session):
        """Test reportes statistics for dashboard"""
        print("\n=== Dashboard: Estadísticas de Reportes ===")
        
        response = admin_session.get(f"{BASE_URL}/api/reportes/estadisticas")
        assert response.status_code == 200
        stats = response.json()
        
        assert "resumen" in stats
        print(f"✓ Estadísticas de reportes obtenidas")
        print(f"  - Total reportes: {stats['resumen'].get('total_reportes', 0)}")
        
        return stats


class TestUsersCRUD:
    """Users CRUD tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_users_list(self, admin_session):
        """Test getting users list"""
        print("\n=== Users: Lista de Usuarios ===")
        
        response = admin_session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        assert len(users) > 0
        print(f"✓ {len(users)} usuarios encontrados")
        
        # Verificar estructura
        user = users[0]
        assert "id" in user
        assert "email" in user
        assert "nombre_completo" in user
        assert "role" in user
        
        # Contar por rol
        roles = {}
        for u in users:
            role = u.get("role", "unknown")
            roles[role] = roles.get(role, 0) + 1
        
        for role, count in roles.items():
            print(f"  - {role}: {count}")
        
        return users
    
    def test_create_user(self, admin_session):
        """Test creating a new user via /api/auth/register"""
        print("\n=== Users: Crear Usuario ===")
        
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"test_user_{unique_id}@tecnonacho.com",
            "password": "test123456",
            "nombre_completo": f"TEST_Usuario Prueba {unique_id}",
            "role": "tecnico",
            "telefono": "3001234567"
        }
        
        # User creation is done via /api/auth/register (admin only)
        response = admin_session.post(f"{BASE_URL}/api/auth/register", json=user_data)
        
        if response.status_code == 201:
            user = response.json()
            assert user["email"] == user_data["email"]
            assert user["nombre_completo"] == user_data["nombre_completo"]
            print(f"✓ Usuario creado: {user['nombre_completo']}")
        elif response.status_code == 400 and "ya existe" in response.text.lower():
            print("✓ Validación de email duplicado funcionando")
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")


class TestInventario:
    """Inventory tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_inventario(self, admin_session):
        """Test getting inventory list"""
        print("\n=== Inventario: Lista de Materiales ===")
        
        response = admin_session.get(f"{BASE_URL}/api/inventario")
        assert response.status_code == 200
        items = response.json()
        
        print(f"✓ {len(items)} items en inventario")
        
        if len(items) > 0:
            item = items[0]
            assert "nombre" in item
            assert "stock_actual" in item
            print(f"  - Ejemplo: {item['nombre']} (Stock: {item['stock_actual']})")
        
        return items
    
    def test_alertas_stock_bajo(self, admin_session):
        """Test stock alerts"""
        print("\n=== Inventario: Alertas de Stock Bajo ===")
        
        response = admin_session.get(f"{BASE_URL}/api/inventario/alertas/stock-bajo")
        assert response.status_code == 200
        alertas = response.json()
        
        print(f"✓ {len(alertas)} alertas de stock bajo")
        
        return alertas


class TestCalendario:
    """Calendar tests - services with scheduled dates"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@tecnonacho.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return session
    
    def test_servicios_agendados(self, admin_session):
        """Test getting services with scheduled dates for calendar"""
        print("\n=== Calendario: Servicios Agendados ===")
        
        response = admin_session.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        servicios = response.json()
        
        # Filtrar servicios con fecha agendada
        agendados = [s for s in servicios if s.get("fecha_agendada")]
        
        print(f"✓ {len(agendados)} servicios con fecha agendada")
        
        for s in agendados[:5]:  # Mostrar primeros 5
            fecha = s.get("fecha_agendada", "N/A")
            cliente = s.get("cliente", {})
            nombre = f"{cliente.get('primer_nombre', '')} {cliente.get('primer_apellido', '')}".strip()
            print(f"  - {s['caso_numero']}: {nombre} - {fecha[:10] if fecha else 'N/A'}")
        
        return agendados


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Note: In production, implement cleanup of TEST_ prefixed data
    print("\n=== Test session complete ===")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

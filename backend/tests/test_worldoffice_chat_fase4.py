"""
Test Suite for WorldOffice Structure, Chat API, and Hook Dependencies Fixes
Tests for iteration 4 - Tecno Nacho SAS

Features tested:
1. WorldOffice structure: Services with primer_nombre, segundo_nombre, primer_apellido, segundo_apellido
2. Chat API: GET /api/chat/usuarios, GET /api/chat/conversaciones
3. Dashboard KPI statistics
4. Users list loading
5. Services list with WorldOffice structure
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a session with cookies"""
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        """Authenticate and return session with cookies"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_health_check(self, session):
        """Test API health endpoint"""
        response = session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_login_success(self, session):
        """Test login with valid credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Login successful for {ADMIN_EMAIL}")


class TestChatAPI:
    """Chat API endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_chat_usuarios(self, auth_session):
        """Test GET /api/chat/usuarios returns list of users"""
        response = auth_session.get(f"{BASE_URL}/api/chat/usuarios")
        assert response.status_code == 200, f"Failed to get chat users: {response.text}"
        
        data = response.json()
        assert "usuarios" in data, "Response should contain 'usuarios' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["usuarios"], list), "usuarios should be a list"
        
        # Verify user structure if there are users
        if len(data["usuarios"]) > 0:
            user = data["usuarios"][0]
            assert "id" in user, "User should have 'id'"
            assert "nombre_completo" in user, "User should have 'nombre_completo'"
            assert "email" in user, "User should have 'email'"
            assert "role" in user, "User should have 'role'"
        
        print(f"✓ Chat usuarios endpoint returned {data['total']} users")
    
    def test_get_chat_conversaciones(self, auth_session):
        """Test GET /api/chat/conversaciones returns conversations"""
        response = auth_session.get(f"{BASE_URL}/api/chat/conversaciones")
        assert response.status_code == 200, f"Failed to get conversations: {response.text}"
        
        data = response.json()
        assert "conversaciones" in data, "Response should contain 'conversaciones' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["conversaciones"], list), "conversaciones should be a list"
        
        print(f"✓ Chat conversaciones endpoint returned {data['total']} conversations")


class TestUsersAPI:
    """Users API tests - verifying hook dependencies fix"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_users_list(self, auth_session):
        """Test GET /api/users returns list without errors"""
        response = auth_session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of users"
        
        # Verify user structure
        if len(data) > 0:
            user = data[0]
            assert "id" in user, "User should have 'id'"
            assert "nombre_completo" in user, "User should have 'nombre_completo'"
            assert "email" in user, "User should have 'email'"
            assert "role" in user, "User should have 'role'"
            assert "activo" in user, "User should have 'activo'"
        
        print(f"✓ Users list endpoint returned {len(data)} users")


class TestDashboardKPI:
    """Dashboard KPI statistics tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_reportes_estadisticas(self, auth_session):
        """Test GET /api/reportes/estadisticas returns KPI data"""
        response = auth_session.get(f"{BASE_URL}/api/reportes/estadisticas")
        assert response.status_code == 200, f"Failed to get estadisticas: {response.text}"
        
        data = response.json()
        # Verify KPI structure - data has 'resumen' with 'total_reportes'
        assert "resumen" in data, "Should have resumen key"
        assert "total_reportes" in data["resumen"], "resumen should have total_reportes"
        assert "servicios_por_estado" in data, "Should have servicios_por_estado"
        
        print(f"✓ Dashboard KPI estadisticas: {data['resumen']['total_reportes']} reportes, {data['resumen']['total_servicios']} servicios")
    
    def test_get_services_stats(self, auth_session):
        """Test GET /api/services/stats returns service statistics"""
        response = auth_session.get(f"{BASE_URL}/api/services/stats")
        assert response.status_code == 200, f"Failed to get service stats: {response.text}"
        
        data = response.json()
        assert "total" in data, "Should have total count"
        assert "pendiente_aprobacion" in data, "Should have pendiente_aprobacion count"
        assert "aprobado" in data, "Should have aprobado count"
        assert "en_proceso" in data, "Should have en_proceso count"
        assert "completado" in data, "Should have completado count"
        
        print(f"✓ Services stats: total={data['total']}, aprobado={data['aprobado']}, en_proceso={data['en_proceso']}")


class TestWorldOfficeStructure:
    """WorldOffice structure tests - Services with separated name fields"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    @pytest.fixture(scope="class")
    def service_types(self, auth_session):
        """Get available service types"""
        response = auth_session.get(f"{BASE_URL}/api/service-types?activo=true")
        assert response.status_code == 200
        return response.json()
    
    @pytest.fixture(scope="class")
    def tecnicos(self, auth_session):
        """Get available technicians"""
        response = auth_session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        return [u for u in users if u.get("role") == "tecnico" and u.get("activo")]
    
    def test_get_services_with_worldoffice_structure(self, auth_session):
        """Test GET /api/services returns services with WorldOffice name structure"""
        response = auth_session.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check if there are services with new structure
        services_with_new_structure = 0
        services_with_old_structure = 0
        
        for service in data:
            if "cliente" in service:
                cliente = service["cliente"]
                if "primer_nombre" in cliente and "primer_apellido" in cliente:
                    services_with_new_structure += 1
                    # Verify structure
                    assert "primer_nombre" in cliente, "Should have primer_nombre"
                    assert "primer_apellido" in cliente, "Should have primer_apellido"
                elif "nombre" in cliente:
                    services_with_old_structure += 1
        
        print(f"✓ Services: {services_with_new_structure} with WorldOffice structure, {services_with_old_structure} with old structure")
        
        # If there are services with new structure, verify one in detail
        if services_with_new_structure > 0:
            for service in data:
                if "cliente" in service and "primer_nombre" in service["cliente"]:
                    cliente = service["cliente"]
                    assert cliente["primer_nombre"], "primer_nombre should not be empty"
                    assert cliente["primer_apellido"], "primer_apellido should not be empty"
                    print(f"✓ Sample service: {service['caso_numero']} - Cliente: {cliente['primer_nombre']} {cliente.get('segundo_nombre', '')} {cliente['primer_apellido']} {cliente.get('segundo_apellido', '')}")
                    break
    
    def test_create_service_with_worldoffice_structure(self, auth_session, service_types, tecnicos):
        """Test creating a service with WorldOffice name structure"""
        if not service_types or not tecnicos:
            pytest.skip("No service types or technicians available")
        
        service_type = service_types[0]
        tecnico = tecnicos[0]
        
        # Create service with WorldOffice structure
        future_date = (datetime.now() + timedelta(days=1)).isoformat()
        
        payload = {
            "cliente": {
                "primer_nombre": "TEST_Carlos",
                "segundo_nombre": "Alberto",
                "primer_apellido": "Rodríguez",
                "segundo_apellido": "Gómez",
                "telefono": "3101234567",
                "email": "test_carlos.rodriguez@example.com",
                "direccion": "Calle 100 #15-20, Bogotá",
                "tipo_documento": "cedula",
                "numero_documento": "1234567890"
            },
            "tipo_servicio_id": service_type["id"],
            "observaciones": "Test WorldOffice structure",
            "ubicacion_servicio": "por_fuera",
            "tecnico_asignado_id": tecnico["id"],
            "fecha_agendada": future_date,
            "items_adicionales": []
        }
        
        response = auth_session.post(f"{BASE_URL}/api/services", json=payload)
        assert response.status_code == 201, f"Failed to create service: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have 'id'"
        assert "caso_numero" in data, "Response should have 'caso_numero'"
        assert data["cliente"]["primer_nombre"] == "TEST_Carlos"
        assert data["cliente"]["segundo_nombre"] == "Alberto"
        assert data["cliente"]["primer_apellido"] == "Rodríguez"
        assert data["cliente"]["segundo_apellido"] == "Gómez"
        
        print(f"✓ Created service {data['caso_numero']} with WorldOffice structure")
        
        # Verify by fetching the service
        service_id = data["id"]
        get_response = auth_session.get(f"{BASE_URL}/api/services/{service_id}")
        assert get_response.status_code == 200
        
        fetched = get_response.json()
        assert fetched["cliente"]["primer_nombre"] == "TEST_Carlos"
        print(f"✓ Verified service {data['caso_numero']} persisted correctly")
        
        return data


class TestReportesFilter:
    """Reportes filter and search tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_reportes_list(self, auth_session):
        """Test GET /api/reportes returns list"""
        response = auth_session.get(f"{BASE_URL}/api/reportes")
        assert response.status_code == 200, f"Failed to get reportes: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Reportes list endpoint returned {len(data)} reportes")
    
    def test_get_services_for_reportes(self, auth_session):
        """Test GET /api/services returns services that can be used for reportes"""
        response = auth_session.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        
        data = response.json()
        
        # Filter services that are aprobado or en_proceso (available for reportes)
        available_for_reportes = [s for s in data if s.get("estado") in ["aprobado", "en_proceso"]]
        
        print(f"✓ Services available for reportes: {len(available_for_reportes)} of {len(data)} total")


class TestServiceTypes:
    """Service types tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_service_types(self, auth_session):
        """Test GET /api/service-types returns list"""
        response = auth_session.get(f"{BASE_URL}/api/service-types")
        assert response.status_code == 200, f"Failed to get service types: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            st = data[0]
            assert "id" in st, "Service type should have 'id'"
            assert "nombre" in st, "Service type should have 'nombre'"
        
        print(f"✓ Service types endpoint returned {len(data)} types")


class TestInventario:
    """Inventario tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Authenticate and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_inventario(self, auth_session):
        """Test GET /api/inventario returns list"""
        response = auth_session.get(f"{BASE_URL}/api/inventario")
        assert response.status_code == 200, f"Failed to get inventario: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Inventario endpoint returned {len(data)} items")
    
    def test_get_inventario_alertas(self, auth_session):
        """Test GET /api/inventario/alertas/stock-bajo returns alerts"""
        response = auth_session.get(f"{BASE_URL}/api/inventario/alertas/stock-bajo")
        assert response.status_code == 200, f"Failed to get stock alerts: {response.text}"
        
        data = response.json()
        # Response is an object with alertas list
        assert "alertas" in data, "Response should have 'alertas' key"
        assert "total_alertas" in data, "Response should have 'total_alertas' key"
        assert isinstance(data["alertas"], list), "alertas should be a list"
        
        print(f"✓ Inventario alertas endpoint returned {data['total_alertas']} alerts")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    
    # Cleanup after tests
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code == 200:
        # Get all services and delete TEST_ ones
        services_response = session.get(f"{BASE_URL}/api/services")
        if services_response.status_code == 200:
            services = services_response.json()
            for service in services:
                if service.get("cliente", {}).get("primer_nombre", "").startswith("TEST_"):
                    # Anular instead of delete for audit trail
                    session.put(
                        f"{BASE_URL}/api/services/{service['id']}/anular",
                        json={"razon_anulacion": "Test cleanup"}
                    )
        print("✓ Test data cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

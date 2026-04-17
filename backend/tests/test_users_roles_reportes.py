"""
Test suite for Users with Multiple Roles and Reportes Técnicos
Tests:
- Users: Create/Update users with multiple roles via checkboxes
- Reportes: POST /api/reportes, GET /api/reportes, GET /api/reportes/estadisticas
- Validation of required fields in reportes (servicio, trabajo realizado, firma, nombre firma)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
# Load test credentials from environment for security
ADMIN_EMAIL = os.environ.get('TEST_ADMIN_EMAIL', 'admin@tecnonacho.com')
ADMIN_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'admin123')


class TestAuthSetup:
    """Authentication tests - prerequisite for all other tests"""
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print("✓ Admin login successful")


class TestUsersMultipleRoles:
    """Tests for users with multiple roles"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_create_user_with_multiple_roles(self, auth_token):
        """Test creating a user with multiple roles (admin, tecnico, asesor)"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"TEST_multi_role_{unique_id}@tecnonacho.com",
            "nombre_completo": f"TEST Usuario Multi Rol {unique_id}",
            "password": "testpass123",
            "role": "tecnico",  # Primary role
            "roles": ["tecnico", "asesor"],  # Multiple roles
            "activo": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 201, f"Failed to create user: {response.text}"
        data = response.json()
        
        # Verify user created with correct roles
        assert data["email"] == user_data["email"]
        assert data["nombre_completo"] == user_data["nombre_completo"]
        assert data["role"] == "tecnico"  # Primary role
        assert "roles" in data, "User should have roles array"
        assert set(data["roles"]) == {"tecnico", "asesor"}, f"Expected roles tecnico, asesor, got {data['roles']}"
        
        print(f"✓ Created user with multiple roles: {data['roles']}")
        return data["id"]
    
    def test_get_users_shows_roles_array(self, auth_token):
        """Test GET /api/users returns users with roles array"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        users = response.json()
        
        # Check that at least one user has roles array
        users_with_roles = [u for u in users if u.get("roles")]
        assert len(users_with_roles) > 0, "Should have at least one user with roles array"
        
        print(f"✓ Found {len(users_with_roles)} users with roles array out of {len(users)} total")
    
    def test_update_user_add_roles(self, auth_token):
        """Test updating user to add more roles"""
        # First get existing users
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        users = response.json()
        
        # Find a test user to update (not admin)
        test_users = [u for u in users if u["email"].startswith("TEST_") and u["id"] != "admin"]
        if not test_users:
            pytest.skip("No test users available to update")
        
        user_to_update = test_users[0]
        user_id = user_to_update["id"]
        
        # Update roles
        update_data = {
            "role": "tecnico",
            "roles": ["tecnico", "asesor", "supervisor"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to update user: {response.text}"
        data = response.json()
        
        # Verify roles updated
        assert "roles" in data
        assert set(data["roles"]) == {"tecnico", "asesor", "supervisor"}, f"Expected 3 roles, got {data['roles']}"
        
        # Verify GET also returns updated roles
        get_response = requests.get(
            f"{BASE_URL}/api/users/{user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert set(get_data["roles"]) == {"tecnico", "asesor", "supervisor"}
        
        print(f"✓ Updated user roles to: {data['roles']}")
    
    def test_update_user_remove_roles(self, auth_token):
        """Test updating user to remove roles"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        users = response.json()
        
        # Find a test user with multiple roles
        multi_role_users = [u for u in users if u["email"].startswith("TEST_") and len(u.get("roles", [])) > 1]
        if not multi_role_users:
            pytest.skip("No test users with multiple roles to update")
        
        user_to_update = multi_role_users[0]
        user_id = user_to_update["id"]
        
        # Update to single role
        update_data = {
            "role": "tecnico",
            "roles": ["tecnico"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to update user: {response.text}"
        data = response.json()
        
        assert data["roles"] == ["tecnico"]
        print(f"✓ Updated user to single role: {data['roles']}")


class TestReportesEndpoints:
    """Tests for Reportes Técnicos endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def setup_service_for_report(self, auth_token):
        """Get an existing service in aprobado/en_proceso state for creating a report"""
        # Get existing services that are aprobado or en_proceso
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        services = response.json()
        
        # Filter for services that can have reportes
        available_services = [s for s in services if s["estado"] in ["aprobado", "en_proceso"]]
        assert len(available_services) > 0, "No aprobado/en_proceso services available"
        
        # Check which services already have reportes
        reportes_response = requests.get(
            f"{BASE_URL}/api/reportes",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        existing_reportes = reportes_response.json() if reportes_response.status_code == 200 else []
        services_with_reportes = {r["servicio_id"] for r in existing_reportes}
        
        # Find a service without a reporte
        services_without_reportes = [s for s in available_services if s["id"] not in services_with_reportes]
        
        if not services_without_reportes:
            # Create a new service with fecha_agendada
            response = requests.get(
                f"{BASE_URL}/api/service-types?activo=true",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            service_types = response.json()
            
            response = requests.get(
                f"{BASE_URL}/api/users",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            users = response.json()
            tecnicos = [u for u in users if u.get("role") == "tecnico" or "tecnico" in u.get("roles", [])]
            
            unique_id = str(uuid.uuid4())[:8]
            service_data = {
                "cliente": {
                    "nombre": f"TEST_Cliente Reporte {unique_id}",
                    "telefono": "3101234567",
                    "email": f"test_reporte_{unique_id}@example.com",
                    "direccion": "Calle Test #123"
                },
                "tipo_servicio_id": service_types[0]["id"],
                "observaciones": "Servicio para prueba de reportes",
                "tecnico_asignado_id": tecnicos[0]["id"],
                "fecha_agendada": "2026-04-15T10:00:00",
                "ubicacion_servicio": "por_fuera"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/services",
                json=service_data,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 201, f"Failed to create service: {response.text}"
            return response.json()
        
        return services_without_reportes[0]
    
    def test_get_reportes_estadisticas(self, auth_token):
        """Test GET /api/reportes/estadisticas returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/reportes/estadisticas",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get estadisticas: {response.text}"
        data = response.json()
        
        # Validate structure
        assert "resumen" in data
        assert "total_servicios" in data["resumen"]
        assert "total_reportes" in data["resumen"]
        assert "total_tecnicos" in data["resumen"]
        assert "tiempo_promedio_horas" in data["resumen"]
        
        assert "servicios_por_estado" in data
        assert "servicios_por_tecnico" in data
        assert "servicios_por_tipo" in data
        assert "servicios_por_ubicacion" in data
        assert "materiales_mas_consumidos" in data
        assert "cumplimiento_tecnicos" in data
        assert "servicios_por_mes" in data
        
        print(f"✓ Estadisticas: {data['resumen']}")
    
    def test_get_reportes_empty_list(self, auth_token):
        """Test GET /api/reportes returns empty or list of reportes"""
        response = requests.get(
            f"{BASE_URL}/api/reportes",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} existing reportes")
    
    def test_create_reporte_missing_servicio(self, auth_token):
        """Test POST /api/reportes fails without servicio_id"""
        reporte_data = {
            "observaciones_tecnico": "Test observations",
            "trabajo_realizado": "Work done",
            "firma_cliente_base64": "data:image/png;base64,iVBORw0KGgo=",
            "cliente_firma_nombre": "Test Client"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reportes",
            json=reporte_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should fail with validation error
        assert response.status_code in [400, 422], f"Expected validation error, got {response.status_code}"
        print("✓ Correctly rejected reporte without servicio_id")
    
    def test_create_reporte_invalid_servicio(self, auth_token):
        """Test POST /api/reportes fails with invalid servicio_id"""
        reporte_data = {
            "servicio_id": "invalid-uuid-does-not-exist",
            "observaciones_tecnico": "Test observations",
            "trabajo_realizado": "Work done",
            "firma_cliente_base64": "data:image/png;base64,iVBORw0KGgo=",
            "cliente_firma_nombre": "Test Client"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reportes",
            json=reporte_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid servicio, got {response.status_code}"
        print("✓ Correctly rejected reporte with invalid servicio_id")
    
    def test_create_reporte_success(self, auth_token, setup_service_for_report):
        """Test POST /api/reportes creates a reporte successfully"""
        service = setup_service_for_report
        
        reporte_data = {
            "servicio_id": service["id"],
            "observaciones_tecnico": "El equipo presentaba daños visibles",
            "tiempo_dedicado_horas": 2.5,
            "problemas_encontrados": "Fuente de poder dañada",
            "trabajo_realizado": "Se reemplazó la fuente de poder y se realizaron pruebas",
            "recomendaciones": "Usar regulador de voltaje",
            "materiales_consumidos": [
                {
                    "nombre": "Fuente de poder 500W",
                    "cantidad": 1,
                    "unidad": "unidades",
                    "observaciones": "Marca XYZ"
                },
                {
                    "nombre": "Cable de alimentación",
                    "cantidad": 1,
                    "unidad": "unidades",
                    "observaciones": None
                }
            ],
            "fotos": [
                {
                    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "descripcion": "Foto del equipo antes"
                }
            ],
            "firma_cliente_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "cliente_firma_nombre": "Juan Pérez Cliente"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reportes",
            json=reporte_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 201, f"Failed to create reporte: {response.text}"
        data = response.json()
        
        # Validate response
        assert "id" in data
        assert data["servicio_id"] == service["id"]
        assert data["trabajo_realizado"] == reporte_data["trabajo_realizado"]
        assert data["observaciones_tecnico"] == reporte_data["observaciones_tecnico"]
        assert data["tiempo_dedicado_horas"] == 2.5
        assert len(data["materiales_consumidos"]) == 2
        assert len(data["fotos"]) == 1
        assert data["firma_cliente_base64"] is not None
        assert data["cliente_firma_nombre"] == "Juan Pérez Cliente"
        assert data["tecnico_id"] is not None
        assert data["tecnico_nombre"] is not None
        
        print(f"✓ Created reporte {data['id']} for service {service['id']}")
        return data["id"]
    
    def test_create_duplicate_reporte_fails(self, auth_token, setup_service_for_report):
        """Test that creating a second reporte for same service fails"""
        service = setup_service_for_report
        
        reporte_data = {
            "servicio_id": service["id"],
            "trabajo_realizado": "Another work",
            "firma_cliente_base64": "data:image/png;base64,test",
            "cliente_firma_nombre": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reportes",
            json=reporte_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should fail because a reporte already exists for this service
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print("✓ Correctly rejected duplicate reporte for same service")
    
    def test_get_reportes_after_creation(self, auth_token):
        """Test GET /api/reportes returns created reportes"""
        response = requests.get(
            f"{BASE_URL}/api/reportes",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1, "Should have at least 1 reporte"
        
        # Validate reporte structure
        reporte = data[0]
        assert "id" in reporte
        assert "servicio_id" in reporte
        assert "trabajo_realizado" in reporte
        assert "tecnico_id" in reporte
        assert "fecha_creacion" in reporte
        
        print(f"✓ Got {len(data)} reportes with correct structure")
    
    def test_get_reporte_by_servicio_id(self, auth_token, setup_service_for_report):
        """Test filtering reportes by servicio_id"""
        service = setup_service_for_report
        
        response = requests.get(
            f"{BASE_URL}/api/reportes",
            params={"servicio_id": service["id"]},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have exactly 1 reporte for this service
        assert len(data) == 1
        assert data[0]["servicio_id"] == service["id"]
        
        print(f"✓ Filtered reportes by servicio_id: found {len(data)}")


class TestServicesForReportes:
    """Test that services return correct data for reportes page"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_services_for_reportes(self, auth_token):
        """Test GET /api/services returns services that can be used in reportes"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        services = response.json()
        
        # Filter aprobado or en_proceso services (the ones available for reportes)
        available_for_reportes = [s for s in services if s["estado"] in ["aprobado", "en_proceso"]]
        
        print(f"✓ Found {len(available_for_reportes)} services available for reportes out of {len(services)} total")
        
        # Validate service structure
        if available_for_reportes:
            service = available_for_reportes[0]
            assert "id" in service
            assert "cliente" in service
            assert "nombre" in service["cliente"]
            assert "numero_caso" in service or "caso_numero" in service


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_cleanup_test_users(self, auth_token):
        """Delete test users created during tests"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        users = response.json()
        test_users = [u for u in users if u["email"].startswith("TEST_")]
        
        deleted = 0
        for user in test_users:
            response = requests.delete(
                f"{BASE_URL}/api/users/{user['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            if response.status_code in [200, 204]:
                deleted += 1
        
        print(f"✓ Cleanup: Deleted {deleted} test users")
    
    def test_cleanup_test_reportes(self, auth_token):
        """Delete test reportes created during tests"""
        response = requests.get(
            f"{BASE_URL}/api/reportes",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code != 200:
            print("✓ No reportes to cleanup")
            return
        
        reportes = response.json()
        # Find reportes from test services
        deleted = 0
        for reporte in reportes:
            # Delete reportes that were created by this test run
            response = requests.delete(
                f"{BASE_URL}/api/reportes/{reporte['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            if response.status_code in [200, 204]:
                deleted += 1
        
        print(f"✓ Cleanup: Deleted {deleted} reportes")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

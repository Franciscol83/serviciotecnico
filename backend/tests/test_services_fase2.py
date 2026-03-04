"""
Test suite for FASE 2 - Gestión de Servicios
Tests for services CRUD operations using service catalog
- POST /api/services (create service with tipo_servicio_id from catalog)
- GET /api/services (list services)
- PUT /api/services/{id}/aprobar (approve service)
- PUT /api/services/{id}/anular (cancel service)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"


class TestServiceTypesCatalog:
    """Tests for service types catalog - prerequisite for services"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_get_service_types(self, auth_token):
        """Test GET /api/service-types returns catalog items"""
        response = requests.get(
            f"{BASE_URL}/api/service-types",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have 9 service types in the catalog
        assert len(data) >= 9, f"Expected at least 9 service types, got {len(data)}"
        
        # Validate structure of service types
        for service_type in data:
            assert "id" in service_type
            assert "nombre" in service_type
            assert "descripcion" in service_type
            assert "activo" in service_type
        
        print(f"✓ Found {len(data)} service types in catalog")
    
    def test_get_active_service_types(self, auth_token):
        """Test filtering active service types"""
        response = requests.get(
            f"{BASE_URL}/api/service-types",
            params={"activo": True},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned items should be active
        for service_type in data:
            assert service_type["activo"] == True
        
        print(f"✓ Found {len(data)} active service types")


class TestServicesCreation:
    """Tests for creating services using the catalog"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def service_type_id(self, auth_token):
        """Get a valid service type ID from catalog"""
        response = requests.get(
            f"{BASE_URL}/api/service-types",
            params={"activo": True},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "No service types available"
        return data[0]["id"]
    
    @pytest.fixture(scope="class")
    def tecnico_id(self, auth_token):
        """Get a valid tecnico user ID"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        users = response.json()
        tecnicos = [u for u in users if u["role"] == "tecnico" and u.get("activo", True)]
        assert len(tecnicos) > 0, "No active technicians available"
        return tecnicos[0]["id"]
    
    def test_create_service_with_catalog_type(self, auth_token, service_type_id, tecnico_id):
        """Test POST /api/services creates service using catalog type"""
        payload = {
            "cliente": {
                "nombre": "TEST_Cliente Prueba Fase2",
                "telefono": "3109876543",
                "email": "test_fase2@example.com",
                "direccion": "Carrera 50 #20-30, Medellín"
            },
            "tipo_servicio_id": service_type_id,
            "observaciones": "Prueba de creación de servicio desde pytest",
            "tecnico_asignado_id": tecnico_id,
            "fecha_agendada": "2025-04-15T10:00:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/services",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 201, f"Failed to create service: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert "caso_numero" in data
        assert data["caso_numero"].startswith("TN-202"), f"Invalid case number format: {data['caso_numero']}"
        assert "tipo_servicio_id" in data
        assert data["tipo_servicio_id"] == service_type_id
        assert "tipo_servicio_nombre" in data
        assert data["tipo_servicio_nombre"] != ""
        assert data["cliente"]["nombre"] == "TEST_Cliente Prueba Fase2"
        assert data["cliente"]["email"] == "test_fase2@example.com"
        assert data["cliente"]["telefono"] == "3109876543"
        assert data["cliente"]["direccion"] == "Carrera 50 #20-30, Medellín"
        
        # Admin/Supervisor creates with aprobado status
        assert data["estado"] == "aprobado"
        
        print(f"✓ Created service {data['caso_numero']} with type: {data['tipo_servicio_nombre']}")
        
        # Store for cleanup
        return data["id"]
    
    def test_create_multiple_services_for_same_client(self, auth_token, service_type_id, tecnico_id):
        """Test creating multiple services for the same client with unique case numbers"""
        client_data = {
            "nombre": "TEST_Maria López Multiple",
            "telefono": "3201234567",
            "email": "test_maria.multiple@example.com",
            "direccion": "Avenida 68 #10-50, Bogotá"
        }
        
        created_services = []
        case_numbers = set()
        
        # Create 2 services for the same client
        for i in range(2):
            # Get different service types
            response = requests.get(
                f"{BASE_URL}/api/service-types",
                params={"activo": True},
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            service_types = response.json()
            current_type = service_types[i % len(service_types)]
            
            payload = {
                "cliente": client_data,
                "tipo_servicio_id": current_type["id"],
                "observaciones": f"Servicio número {i+1} para María",
                "tecnico_asignado_id": tecnico_id
            }
            
            response = requests.post(
                f"{BASE_URL}/api/services",
                json=payload,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            created_services.append(data)
            case_numbers.add(data["caso_numero"])
        
        # Verify all case numbers are unique
        assert len(case_numbers) == 2, "Case numbers should be unique for each service"
        
        print(f"✓ Created {len(created_services)} services with unique case numbers: {case_numbers}")
    
    def test_create_service_invalid_tipo_servicio(self, auth_token, tecnico_id):
        """Test that creating service with invalid tipo_servicio_id fails"""
        payload = {
            "cliente": {
                "nombre": "TEST_Invalid Type",
                "telefono": "3001111111",
                "email": "test_invalid@example.com",
                "direccion": "Test Address"
            },
            "tipo_servicio_id": "invalid-uuid-does-not-exist",
            "observaciones": "Should fail",
            "tecnico_asignado_id": tecnico_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/services",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [404, 400, 422], f"Expected error for invalid type, got {response.status_code}"
        print(f"✓ Correctly rejected invalid tipo_servicio_id with status {response.status_code}")


class TestServicesListing:
    """Tests for listing services with filters"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_all_services(self, auth_token):
        """Test GET /api/services returns list of services"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Validate structure of each service
        for service in data:
            assert "id" in service
            assert "caso_numero" in service
            assert "cliente" in service
            assert "nombre" in service["cliente"]
            assert "email" in service["cliente"]
            assert "telefono" in service["cliente"]
            assert "direccion" in service["cliente"]
            assert "tipo_servicio_id" in service
            assert "tipo_servicio_nombre" in service
            assert "estado" in service
            assert "tecnico_asignado_id" in service
            assert "tecnico_asignado_nombre" in service
            assert "fecha_creacion" in service
        
        print(f"✓ Retrieved {len(data)} services with complete data")
    
    def test_filter_services_by_estado(self, auth_token):
        """Test filtering services by estado"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            params={"estado": "aprobado"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned services should have the filtered estado
        for service in data:
            assert service["estado"] == "aprobado"
        
        print(f"✓ Filtered {len(data)} services with estado=aprobado")
    
    def test_verify_existing_services_for_juan_perez(self, auth_token):
        """Verify Juan Pérez already has 2 services as per context"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Filter services for Juan Pérez
        juan_services = [s for s in data if s["cliente"]["nombre"] == "Juan Pérez"]
        
        assert len(juan_services) >= 2, f"Expected at least 2 services for Juan Pérez, found {len(juan_services)}"
        
        # Verify unique case numbers
        case_numbers = [s["caso_numero"] for s in juan_services]
        assert len(case_numbers) == len(set(case_numbers)), "Case numbers should be unique"
        
        print(f"✓ Juan Pérez has {len(juan_services)} services: {case_numbers}")


class TestServicesApprovalAndCancellation:
    """Tests for service approval and cancellation"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def setup_data(self, auth_token):
        """Get service type and tecnico IDs for test"""
        # Get service type
        response = requests.get(
            f"{BASE_URL}/api/service-types",
            params={"activo": True},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        service_types = response.json()
        service_type_id = service_types[0]["id"]
        
        # Get tecnico
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        users = response.json()
        tecnico = [u for u in users if u["role"] == "tecnico"][0]
        
        return {"service_type_id": service_type_id, "tecnico_id": tecnico["id"]}
    
    def test_aprobar_service_already_approved(self, auth_token):
        """Test that approving an already approved service fails gracefully"""
        # Get an existing approved service
        response = requests.get(
            f"{BASE_URL}/api/services",
            params={"estado": "aprobado"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No approved services available for test")
        
        service_id = data[0]["id"]
        
        # Try to approve again
        response = requests.put(
            f"{BASE_URL}/api/services/{service_id}/aprobar",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should fail because it's already approved
        assert response.status_code == 400, f"Expected 400 for already approved, got {response.status_code}"
        print(f"✓ Correctly rejected re-approval with status {response.status_code}")
    
    def test_anular_service(self, auth_token, setup_data):
        """Test PUT /api/services/{id}/anular cancels a service"""
        # First create a service to anular
        payload = {
            "cliente": {
                "nombre": "TEST_Cliente Para Anular",
                "telefono": "3009999999",
                "email": "test_anular@example.com",
                "direccion": "Dirección de prueba para anulación"
            },
            "tipo_servicio_id": setup_data["service_type_id"],
            "observaciones": "Este servicio será anulado",
            "tecnico_asignado_id": setup_data["tecnico_id"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/services",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 201
        service_id = response.json()["id"]
        caso_numero = response.json()["caso_numero"]
        
        # Now anular the service
        anular_payload = {"razon_anulacion": "Prueba de anulación desde pytest"}
        response = requests.put(
            f"{BASE_URL}/api/services/{service_id}/anular",
            json=anular_payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to anular: {response.text}"
        data = response.json()
        
        # Verify anulación
        assert data["estado"] == "anulado"
        assert data["anulado_por_id"] is not None
        assert data["anulado_por_nombre"] is not None
        assert data["razon_anulacion"] == "Prueba de anulación desde pytest"
        
        print(f"✓ Successfully anulado service {caso_numero}")
    
    def test_anular_already_anulado_fails(self, auth_token):
        """Test that anulando an already anulado service fails"""
        # Get an anulado service
        response = requests.get(
            f"{BASE_URL}/api/services",
            params={"estado": "anulado"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No anulado services available for test")
        
        service_id = data[0]["id"]
        
        # Try to anular again
        response = requests.put(
            f"{BASE_URL}/api/services/{service_id}/anular",
            json={"razon_anulacion": "Segunda anulación"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for already anulado, got {response.status_code}"
        print(f"✓ Correctly rejected re-anulación with status {response.status_code}")


class TestServiceStats:
    """Tests for service statistics"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_service_stats(self, auth_token):
        """Test GET /api/services/stats returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/services/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "total" in data
        assert "pendiente_aprobacion" in data
        assert "aprobado" in data
        assert "en_proceso" in data
        assert "completado" in data
        assert "cancelado" in data
        assert "anulado" in data
        
        # Total should be sum of all states
        calculated_total = (
            data["pendiente_aprobacion"] + 
            data["aprobado"] + 
            data["en_proceso"] + 
            data["completado"] + 
            data["cancelado"] + 
            data["anulado"]
        )
        assert data["total"] == calculated_total, f"Total mismatch: {data['total']} != {calculated_total}"
        
        print(f"✓ Service stats: {data}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_cleanup_test_services(self, auth_token):
        """Mark test services as anulado (no deletion, as per requirements)"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        data = response.json()
        test_services = [s for s in data if s["cliente"]["nombre"].startswith("TEST_")]
        
        anulados = 0
        for service in test_services:
            if service["estado"] != "anulado":
                response = requests.put(
                    f"{BASE_URL}/api/services/{service['id']}/anular",
                    json={"razon_anulacion": "Cleanup - Test data"},
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                if response.status_code == 200:
                    anulados += 1
        
        print(f"✓ Cleanup: Anulado {anulados} test services (services are not deleted per requirements)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

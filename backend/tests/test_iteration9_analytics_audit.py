"""
Iteration 9 tests:
- Analytics dashboard endpoint (/api/analytics/dashboard)
- Audit logs generated for service_type CRUD
- MongoDB indexes (verified via server logs in iteration_9 report)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soporte-hispano.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# ---------------- Analytics endpoint ----------------
class TestAnalyticsDashboard:
    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert r.status_code in (401, 403)

    def test_admin_can_access_default(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/analytics/dashboard")
        assert r.status_code == 200
        data = r.json()
        # Structure
        assert data["rango_dias"] == 30
        for key in ["desde", "hasta", "resumen", "ordenes_por_dia",
                    "ordenes_por_estado", "top_tecnicos",
                    "actividad_por_hora", "ordenes_por_tipo"]:
            assert key in data, f"Missing key: {key}"
        # Resumen
        for k in ["total_servicios", "total_reportes",
                  "total_materiales", "materiales_stock_bajo"]:
            assert k in data["resumen"]
            assert isinstance(data["resumen"][k], int)
        # actividad_por_hora must have 24 buckets
        assert len(data["actividad_por_hora"]) == 24
        horas = [h["hora"] for h in data["actividad_por_hora"]]
        assert horas == list(range(24))
        for h in data["actividad_por_hora"]:
            assert "count" in h and isinstance(h["count"], int)

    def test_supports_dias_7_30_90(self, admin_session):
        for d in (7, 30, 90):
            r = admin_session.get(f"{BASE_URL}/api/analytics/dashboard",
                                   params={"dias": d})
            assert r.status_code == 200
            assert r.json()["rango_dias"] == d

    def test_validates_dias_range(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/analytics/dashboard",
                              params={"dias": 0})
        assert r.status_code == 422
        r = admin_session.get(f"{BASE_URL}/api/analytics/dashboard",
                              params={"dias": 400})
        assert r.status_code == 422

    def test_top_tecnicos_structure(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/analytics/dashboard",
                              params={"dias": 90})
        assert r.status_code == 200
        for t in r.json()["top_tecnicos"]:
            assert "tecnico_id" in t
            assert "tecnico_nombre" in t
            assert "reportes" in t
            assert "horas" in t


# ---------------- Service type audit logs ----------------
class TestServiceTypeAudit:
    def test_create_update_delete_generate_audit_logs(self, admin_session):
        # Create
        payload = {"nombre": "TEST_AUDIT_TIPO_9", "descripcion": "Para auditoría"}
        r = admin_session.post(f"{BASE_URL}/api/service-types", json=payload)
        assert r.status_code == 201, r.text
        st_id = r.json()["id"]

        # Update
        r2 = admin_session.put(f"{BASE_URL}/api/service-types/{st_id}",
                               json={"descripcion": "Actualizada"})
        assert r2.status_code == 200, r2.text

        # Delete
        r3 = admin_session.delete(f"{BASE_URL}/api/service-types/{st_id}")
        assert r3.status_code == 200, r3.text

        # Verify audit logs exist
        r4 = admin_session.get(f"{BASE_URL}/api/audit-logs",
                               params={"entidad": "service_type", "page_size": 50})
        assert r4.status_code == 200
        logs = r4.json()["logs"]
        acciones = [l["accion"] for l in logs]
        # Most recent first - find the 3 actions we triggered for our id
        st_logs = [l for l in logs if l.get("entidad_id") == st_id]
        st_acciones = {l["accion"] for l in st_logs}
        assert "crear_tipo_servicio" in st_acciones, f"missing crear; got {acciones[:10]}"
        assert "actualizar_tipo_servicio" in st_acciones, f"missing actualizar"
        assert "eliminar_tipo_servicio" in st_acciones, f"missing eliminar"

        # Verify entidad and details on crear
        crear = next(l for l in st_logs if l["accion"] == "crear_tipo_servicio")
        assert crear["entidad"] == "service_type"
        assert crear["detalles"].get("nombre") == "TEST_AUDIT_TIPO_9"

        # Verify update details have cambios list
        upd = next(l for l in st_logs if l["accion"] == "actualizar_tipo_servicio")
        assert "cambios" in upd["detalles"]
        assert isinstance(upd["detalles"]["cambios"], list)


# ---------------- Audit logs date filters ----------------
class TestAuditLogsDateFilters:
    def test_desde_hasta_filters_accepted(self, admin_session):
        r = admin_session.get(
            f"{BASE_URL}/api/audit-logs",
            params={"desde": "2020-01-01T00:00:00",
                    "hasta": "2030-12-31T23:59:59", "page_size": 5})
        assert r.status_code == 200
        data = r.json()
        assert "logs" in data
        assert "total" in data

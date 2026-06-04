"""
Tests for Audit Logs + extended Push notifications (iteration 7).

Validates:
  - Push extension: services & reportes endpoints still respond 2xx
    after internal push notification calls (no delivery expected
    because there are no real subscriptions, but flow must not break).
  - Audit Logs endpoints under /api/audit-logs/*
  - Audit logs are auto-generated for critical actions (login,
    login_failed, logout, crear/aprobar/anular/agregar-item-servicio,
    crear_reporte).
  - Only admin / supervisor can access audit-logs endpoints.

Auth via httpOnly cookie (access_token).
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"


# ---------------- Helpers / Fixtures ----------------
def _login(session, email, password):
    return session.post(
        f"{API}/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} - {r.text}"
    yield s
    try:
        s.post(f"{API}/auth/logout", timeout=10)
    except Exception:
        pass


@pytest.fixture(scope="module")
def tipo_servicio_id(admin_session):
    """Return some existing service type id, or create one."""
    r = admin_session.get(f"{API}/service-types", timeout=15)
    if r.status_code == 200 and isinstance(r.json(), list) and r.json():
        return r.json()[0]["id"]
    # Try to create
    payload = {
        "nombre": f"TEST_TIPO_{uuid.uuid4().hex[:6]}",
        "descripcion": "Tipo creado para tests de audit logs",
        "precio_base": 100000,
    }
    r = admin_session.post(f"{API}/service-types", json=payload, timeout=15)
    if r.status_code in (200, 201):
        return r.json()["id"]
    pytest.skip(f"No service type available and could not create one: {r.status_code} {r.text}")


@pytest.fixture(scope="module")
def tecnico_user(admin_session):
    """Return a technician user dict from /api/users; skip if none."""
    r = admin_session.get(f"{API}/users", timeout=15)
    assert r.status_code == 200, f"GET /users failed: {r.text}"
    users = r.json()
    tecnicos = [u for u in users if u.get("role") == "tecnico"]
    if not tecnicos:
        # Fallback: any non-admin user
        candidates = [u for u in users if u.get("role") != "admin"]
        if candidates:
            return candidates[0]
        # Final fallback: admin (still valid id for assignment)
        admins = [u for u in users if u.get("role") == "admin"]
        return admins[0]
    return tecnicos[0]


def _build_cliente():
    suffix = uuid.uuid4().hex[:6]
    return {
        "primer_nombre": "TestN",
        "primer_apellido": "TestAp",
        "telefono": "3001234567",
        "email": f"test_{suffix}@tecnonacho.com",
        "direccion": "Cra 1 # 2-3",
        "tipo_documento": "cedula",
        "numero_documento": f"100{suffix}",
        "medio_pago": "efectivo",
    }


# ---------------- 1) Push extension: services + reportes endpoints work ----------------
class TestPushExtensionFlows:
    """All endpoints that internally send push must still respond OK."""

    @pytest.fixture(scope="class")
    def created_service(self, admin_session, tipo_servicio_id, tecnico_user):
        payload = {
            "cliente": _build_cliente(),
            "tipo_servicio_id": tipo_servicio_id,
            "observaciones": "TEST_iter7 push",
            "ubicacion_servicio": "en_local",
            "tecnico_asignado_id": tecnico_user["id"],
            "items_adicionales": [],
        }
        r = admin_session.post(f"{API}/services", json=payload, timeout=20)
        assert r.status_code == 201, f"create_service failed: {r.status_code} - {r.text}"
        data = r.json()
        assert "id" in data and "caso_numero" in data
        return data

    def test_create_service_returns_201_and_does_not_break_on_push(self, created_service):
        assert created_service["id"]
        assert created_service["caso_numero"]

    def test_aprobar_service_returns_200(self, admin_session, created_service):
        # If created by admin/supervisor, may already be "aprobado". The endpoint
        # should still succeed (or 400 if already aprobado). We accept 200
        # primarily; 400 is also acceptable as it means push did not break it.
        r = admin_session.put(f"{API}/services/{created_service['id']}/aprobar", timeout=15)
        assert r.status_code in (200, 400), f"aprobar got {r.status_code}: {r.text}"

    def test_agregar_item_returns_200(self, admin_session, created_service, tipo_servicio_id):
        payload = {"tipo_servicio_id": tipo_servicio_id, "observaciones": "TEST_iter7 item"}
        r = admin_session.post(
            f"{API}/services/{created_service['id']}/agregar-item",
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200, f"agregar-item got {r.status_code}: {r.text}"
        data = r.json()
        assert isinstance(data.get("items_adicionales", []), list)

    def test_create_reporte_returns_201(self, admin_session, created_service):
        payload = {
            "servicio_id": created_service["id"],
            "observaciones_tecnico": "TEST_iter7 reporte obs",
            "tiempo_dedicado_horas": 1.5,
            "materiales_consumidos": [
                {"nombre": "Cable", "cantidad": 2, "unidad": "metros"}
            ],
            "fotos": [],
            "trabajo_realizado": "Trabajo de prueba audit logs",
        }
        r = admin_session.post(f"{API}/reportes", json=payload, timeout=20)
        assert r.status_code == 201, f"create_reporte got {r.status_code}: {r.text}"
        rid = r.json().get("id")
        assert rid

    def test_anular_service_returns_200(self, admin_session, created_service):
        # Anular at the end so further interactions aren't blocked
        payload = {"razon_anulacion": "TEST_iter7 anulacion automatica"}
        r = admin_session.put(
            f"{API}/services/{created_service['id']}/anular",
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200, f"anular got {r.status_code}: {r.text}"
        assert r.json().get("estado") == "anulado"


# ---------------- 2) Audit logs endpoints ----------------
class TestAuditLogsEndpoints:
    def test_list_audit_logs_unfiltered(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("logs", "total", "page", "page_size", "total_pages"):
            assert k in data, f"missing key {k}"
        assert isinstance(data["logs"], list)
        assert isinstance(data["total"], int)
        assert data["page"] == 1

    def test_filter_by_accion_login_success(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs", params={"accion": "login_success"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # Should have at least one (we logged in)
        assert data["total"] >= 1
        for log in data["logs"]:
            assert log["accion"] == "login_success"
            assert log["entidad"] == "auth"

    def test_filter_by_entidad_service(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs", params={"entidad": "service"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for log in data["logs"]:
            assert log["entidad"] == "service"

    def test_pagination_page2(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs", params={"page": 2, "page_size": 10}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["page"] == 2
        assert data["page_size"] == 10
        assert len(data["logs"]) <= 10

    def test_stats_endpoint(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "por_accion" in data and isinstance(data["por_accion"], list)
        assert "por_entidad" in data and isinstance(data["por_entidad"], list)
        if data["por_accion"]:
            sample = data["por_accion"][0]
            assert "accion" in sample and "count" in sample
        if data["por_entidad"]:
            sample = data["por_entidad"][0]
            assert "entidad" in sample and "count" in sample

    def test_unauthenticated_blocked(self):
        r = requests.get(f"{API}/audit-logs", timeout=15)
        assert r.status_code in (401, 403), f"unexpected {r.status_code}: {r.text}"


# ---------------- 3) Audit logs are auto-generated for critical actions ----------------
class TestAuditLogsAutoGenerated:
    def test_login_success_logged(self, admin_session):
        # Trigger a fresh login and check log appears
        s = requests.Session()
        r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
        assert r.status_code == 200
        time.sleep(0.5)  # let log persist
        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "login_success", "page_size": 5},
            timeout=15,
        )
        assert r.status_code == 200
        logs = r.json()["logs"]
        assert any(l["accion"] == "login_success" and l["usuario_role"] == "admin" for l in logs)
        # Validate required fields on at least one log
        sample = logs[0]
        for field in ("usuario_id", "usuario_nombre", "usuario_role", "accion", "entidad", "success", "timestamp"):
            assert field in sample, f"missing field {field}"
        assert sample["success"] is True

    def test_login_failed_logged(self, admin_session):
        s = requests.Session()
        r = _login(s, ADMIN_EMAIL, "WRONG_PASSWORD_XYZ")
        assert r.status_code in (401, 400), f"unexpected {r.status_code}"
        time.sleep(0.5)
        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "login_failed", "page_size": 5},
            timeout=15,
        )
        assert r.status_code == 200
        logs = r.json()["logs"]
        assert len(logs) >= 1, "No login_failed log generated"
        found = False
        for l in logs:
            det = l.get("detalles") or {}
            if det.get("razon") == "password_incorrecta":
                found = True
                break
        assert found, f"login_failed log missing detalles.razon='password_incorrecta'. Logs: {logs}"

    def test_logout_logged(self):
        s = requests.Session()
        r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
        assert r.status_code == 200
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200
        time.sleep(0.5)
        # Use a separate admin session to check
        s2 = requests.Session()
        _login(s2, ADMIN_EMAIL, ADMIN_PASSWORD)
        r = s2.get(f"{API}/audit-logs", params={"accion": "logout", "page_size": 5}, timeout=15)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_crear_servicio_logged(self, admin_session, tipo_servicio_id, tecnico_user):
        payload = {
            "cliente": _build_cliente(),
            "tipo_servicio_id": tipo_servicio_id,
            "observaciones": "TEST_iter7 audit",
            "ubicacion_servicio": "en_local",
            "tecnico_asignado_id": tecnico_user["id"],
            "items_adicionales": [],
        }
        r = admin_session.post(f"{API}/services", json=payload, timeout=20)
        assert r.status_code == 201, r.text
        servicio = r.json()
        time.sleep(0.5)
        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "crear_servicio", "page_size": 10},
            timeout=15,
        )
        assert r.status_code == 200
        logs = r.json()["logs"]
        # Find log for our entity
        match = [l for l in logs if l.get("entidad_id") == servicio["id"]]
        assert match, f"No crear_servicio log for {servicio['id']}"
        log = match[0]
        assert log["entidad"] == "service"
        assert "caso_numero" in (log.get("detalles") or {}), f"detalles missing caso_numero: {log}"

        # Aprobar + log (might already be aprobado)
        r = admin_session.put(f"{API}/services/{servicio['id']}/aprobar", timeout=15)
        if r.status_code == 200:
            time.sleep(0.5)
            r = admin_session.get(
                f"{API}/audit-logs",
                params={"accion": "aprobar_servicio", "page_size": 10},
                timeout=15,
            )
            assert r.status_code == 200
            assert any(l.get("entidad_id") == servicio["id"] for l in r.json()["logs"])

        # Agregar item + log
        r = admin_session.post(
            f"{API}/services/{servicio['id']}/agregar-item",
            json={"tipo_servicio_id": tipo_servicio_id, "observaciones": "TEST item audit"},
            timeout=15,
        )
        assert r.status_code == 200
        time.sleep(0.5)
        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "agregar_item_servicio", "page_size": 10},
            timeout=15,
        )
        assert r.status_code == 200
        assert any(l.get("entidad_id") == servicio["id"] for l in r.json()["logs"])

        # Anular + log
        r = admin_session.put(
            f"{API}/services/{servicio['id']}/anular",
            json={"razon_anulacion": "TEST audit anulacion"},
            timeout=15,
        )
        assert r.status_code == 200
        time.sleep(0.5)
        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "anular_servicio", "page_size": 10},
            timeout=15,
        )
        assert r.status_code == 200
        anular_logs = [l for l in r.json()["logs"] if l.get("entidad_id") == servicio["id"]]
        assert anular_logs, "No anular_servicio log"
        det = anular_logs[0].get("detalles") or {}
        assert "razon" in det or "razon_anulacion" in det, f"anular log missing razon: {anular_logs[0]}"

    def test_crear_reporte_logged(self, admin_session, tipo_servicio_id, tecnico_user):
        # Create a fresh service
        payload = {
            "cliente": _build_cliente(),
            "tipo_servicio_id": tipo_servicio_id,
            "observaciones": "TEST_iter7 reporte audit",
            "ubicacion_servicio": "en_local",
            "tecnico_asignado_id": tecnico_user["id"],
            "items_adicionales": [],
        }
        r = admin_session.post(f"{API}/services", json=payload, timeout=20)
        assert r.status_code == 201
        servicio_id = r.json()["id"]

        rep_payload = {
            "servicio_id": servicio_id,
            "observaciones_tecnico": "TEST_iter7 reporte",
            "tiempo_dedicado_horas": 2.0,
            "materiales_consumidos": [
                {"nombre": "Tornillo", "cantidad": 5, "unidad": "unidades"},
                {"nombre": "Cable", "cantidad": 3, "unidad": "metros"},
            ],
            "fotos": [],
            "trabajo_realizado": "Audit log test",
        }
        r = admin_session.post(f"{API}/reportes", json=rep_payload, timeout=20)
        assert r.status_code == 201
        reporte = r.json()
        time.sleep(0.5)

        r = admin_session.get(
            f"{API}/audit-logs",
            params={"accion": "crear_reporte", "page_size": 10},
            timeout=15,
        )
        assert r.status_code == 200
        logs = r.json()["logs"]
        match = [l for l in logs if l.get("entidad_id") == reporte["id"]]
        assert match, f"No crear_reporte log for {reporte['id']}"
        det = match[0].get("detalles") or {}
        assert "materiales_count" in det, f"missing materiales_count: {det}"
        assert "fotos_count" in det, f"missing fotos_count: {det}"
        assert det["materiales_count"] == 2
        assert det["fotos_count"] == 0

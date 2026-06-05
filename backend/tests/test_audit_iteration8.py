"""
Iteration 8 - Audit logs (usuarios + inventario) + CSV export
Tests:
1. log_action triggered on user create / update / delete / change-password
2. log_action triggered on inventario create / update / delete / ajustar-stock
3. GET /audit-logs/export CSV format + filters + RBAC
"""
import os
import io
import csv
import uuid
import time
import pytest
import requests
from datetime import datetime

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    s.admin_id = me.json()["id"]
    return s


def _suffix():
    return uuid.uuid4().hex[:8]


def _find_latest_audit_log(session, accion, entidad=None, entidad_id=None, max_attempts=4):
    """Polls /audit-logs to find most recent log matching filters."""
    for _ in range(max_attempts):
        params = {"accion": accion, "page": 1, "page_size": 50}
        if entidad:
            params["entidad"] = entidad
        r = session.get(f"{API}/audit-logs", params=params)
        if r.status_code == 200:
            logs = r.json().get("logs", [])
            if entidad_id:
                logs = [l for l in logs if l.get("entidad_id") == entidad_id]
            if logs:
                return logs[0]
        time.sleep(0.5)
    return None


# ======================================================================
# 1) AUDIT LOGS - USUARIOS
# ======================================================================
class TestAuditUsuarios:
    def test_register_creates_audit_log(self, admin_session):
        email = f"TEST_audit_{_suffix()}@tecnonacho.com"
        payload = {
            "email": email,
            "password": "tempPass123!",
            "nombre_completo": "TEST Audit User",
            "role": "tecnico",
        }
        r = admin_session.post(f"{API}/auth/register", json=payload)
        assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
        created = r.json()
        user_id = created.get("id") or created.get("user", {}).get("id")
        assert user_id

        log = _find_latest_audit_log(admin_session, "crear_usuario", entidad="user", entidad_id=user_id)
        assert log is not None, "No audit log 'crear_usuario' found"
        det = log.get("detalles") or {}
        assert det.get("email") == email
        assert det.get("nombre_completo") == "TEST Audit User"
        assert det.get("role") == "tecnico"

        # save for downstream tests
        admin_session._created_user_id = user_id
        admin_session._created_user_email = email

    def test_update_user_creates_audit_log(self, admin_session):
        user_id = getattr(admin_session, "_created_user_id", None)
        assert user_id, "previous create test must run first"
        r = admin_session.put(
            f"{API}/users/{user_id}",
            json={"nombre_completo": "TEST Audit User Updated", "activo": True},
        )
        assert r.status_code == 200, f"update failed: {r.status_code} {r.text}"

        log = _find_latest_audit_log(admin_session, "actualizar_usuario", entidad="user", entidad_id=user_id)
        assert log is not None
        det = log.get("detalles") or {}
        assert "cambios" in det and isinstance(det["cambios"], list)
        assert "nombre_completo" in det["cambios"]
        assert det.get("activo") is True
        assert "email" in det

    def test_change_password_audit_log_excludes_password(self, admin_session):
        # admin changes its own password (allowed) then changes back
        new_pw = "admin123New!"
        r = admin_session.put(
            f"{API}/users/{admin_session.admin_id}/change-password",
            json={"password_actual": ADMIN_PASSWORD, "password_nueva": new_pw},
        )
        assert r.status_code == 200, f"change-password failed: {r.text}"

        log = _find_latest_audit_log(
            admin_session, "cambio_password", entidad="user", entidad_id=admin_session.admin_id
        )
        assert log is not None
        det = log.get("detalles") or {}
        # password MUST NOT appear in details
        serial = str(det).lower()
        assert "password" not in serial or "password_nueva" not in serial
        assert new_pw.lower() not in serial
        assert ADMIN_PASSWORD.lower() not in serial

        # revert password
        r2 = admin_session.put(
            f"{API}/users/{admin_session.admin_id}/change-password",
            json={"password_actual": new_pw, "password_nueva": ADMIN_PASSWORD},
        )
        assert r2.status_code == 200

    def test_delete_user_creates_audit_log(self, admin_session):
        user_id = getattr(admin_session, "_created_user_id", None)
        assert user_id
        r = admin_session.delete(f"{API}/users/{user_id}")
        assert r.status_code == 200, f"delete failed: {r.text}"

        log = _find_latest_audit_log(admin_session, "eliminar_usuario", entidad="user", entidad_id=user_id)
        assert log is not None

    def test_admin_cannot_delete_self(self, admin_session):
        r = admin_session.delete(f"{API}/users/{admin_session.admin_id}")
        assert r.status_code == 400


# ======================================================================
# 2) AUDIT LOGS - INVENTARIO
# ======================================================================
class TestAuditInventario:
    def test_create_material_audit_log(self, admin_session):
        sku = f"TEST-{_suffix()}"
        payload = {
            "nombre": f"TEST Material {_suffix()}",
            "tipo": "consumible",
            "categoria": "test",
            "unidad": "unidad",
            "cantidad_stock": 10,
            "stock_minimo": 2,
            "codigo_sku": sku,
        }
        r = admin_session.post(f"{API}/inventario", json=payload)
        assert r.status_code in (200, 201), f"create material failed: {r.status_code} {r.text}"
        mat = r.json()
        mid = mat["id"]

        log = _find_latest_audit_log(admin_session, "crear_material", entidad="inventario", entidad_id=mid)
        assert log is not None
        det = log.get("detalles") or {}
        assert det.get("nombre") == payload["nombre"]
        assert det.get("tipo") == "consumible"
        assert det.get("stock_inicial") == 10
        assert det.get("sku") == sku

        admin_session._mat_id = mid
        admin_session._mat_nombre = payload["nombre"]

    def test_update_material_audit_log(self, admin_session):
        mid = getattr(admin_session, "_mat_id", None)
        assert mid
        r = admin_session.put(f"{API}/inventario/{mid}", json={"stock_minimo": 5})
        assert r.status_code == 200, r.text

        log = _find_latest_audit_log(admin_session, "actualizar_material", entidad="inventario", entidad_id=mid)
        assert log is not None
        det = log.get("detalles") or {}
        assert "cambios" in det and "stock_minimo" in det["cambios"]
        assert det.get("nombre") == admin_session._mat_nombre

    def test_ajustar_stock_audit_log(self, admin_session):
        mid = getattr(admin_session, "_mat_id", None)
        assert mid
        # add stock
        r = admin_session.post(
            f"{API}/inventario/{mid}/ajustar-stock",
            params={"cantidad": 5, "motivo": "TEST entrada"},
        )
        assert r.status_code == 200, r.text

        log = _find_latest_audit_log(admin_session, "ajustar_stock", entidad="inventario", entidad_id=mid)
        assert log is not None
        det = log.get("detalles") or {}
        assert det.get("tipo_movimiento") == "entrada"
        assert det.get("stock_anterior") == 10
        assert det.get("stock_nuevo") == 15
        assert det.get("ajuste") == 5
        assert det.get("motivo") == "TEST entrada"
        assert det.get("nombre") == admin_session._mat_nombre

    def test_delete_material_audit_log(self, admin_session):
        mid = getattr(admin_session, "_mat_id", None)
        assert mid
        r = admin_session.delete(f"{API}/inventario/{mid}")
        assert r.status_code == 200, r.text

        log = _find_latest_audit_log(admin_session, "eliminar_material", entidad="inventario", entidad_id=mid)
        assert log is not None


# ======================================================================
# 3) EXPORT CSV
# ======================================================================
class TestAuditExportCSV:
    def test_export_csv_unfiltered(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs/export")
        assert r.status_code == 200, f"export failed: {r.status_code} {r.text[:200]}"
        ct = r.headers.get("content-type", "")
        assert "text/csv" in ct
        assert "charset=utf-8" in ct
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd
        assert "audit_logs_" in cd
        assert cd.endswith('.csv"') or cd.endswith(".csv")

        body = r.content
        # BOM UTF-8
        assert body[:3] == b"\xef\xbb\xbf", f"missing BOM, got: {body[:6]!r}"

        # Parse CSV
        text = body[3:].decode("utf-8")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        assert len(rows) >= 1
        header = rows[0]
        expected_header = [
            "ID", "Fecha", "Usuario", "Rol", "Acción", "Entidad", "Entidad ID",
            "Estado", "IP", "User Agent", "Detalles", "Error",
        ]
        assert header == expected_header, f"header mismatch: {header}"

    def test_export_csv_filter_by_accion(self, admin_session):
        # Trigger something to ensure at least one login_success log exists
        r = admin_session.get(f"{API}/audit-logs/export", params={"accion": "login_success"})
        assert r.status_code == 200
        text = r.content[3:].decode("utf-8")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        # column index for "Acción" = 4
        if len(rows) > 1:
            for row in rows[1:]:
                assert row[4] == "login_success", f"unexpected accion in filter result: {row[4]}"

    def test_export_csv_filter_by_entidad(self, admin_session):
        r = admin_session.get(f"{API}/audit-logs/export", params={"entidad": "user"})
        assert r.status_code == 200
        text = r.content[3:].decode("utf-8")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if len(rows) > 1:
            for row in rows[1:]:
                assert row[5] == "user", f"unexpected entidad in filter result: {row[5]}"

    def test_export_csv_contains_new_actions(self, admin_session):
        """Verify new actions like crear_material, ajustar_stock appear in CSV"""
        r = admin_session.get(f"{API}/audit-logs/export")
        assert r.status_code == 200
        text = r.content[3:].decode("utf-8")
        # the previous test class created+deleted material so these should be present
        assert "crear_material" in text or "ajustar_stock" in text or "crear_usuario" in text, \
            "Expected at least one new action (crear_material/ajustar_stock/crear_usuario) in CSV"

    def test_export_csv_requires_auth(self):
        r = requests.get(f"{API}/audit-logs/export")
        # unauthenticated should be 401 or 403
        assert r.status_code in (401, 403), f"unexpected status for unauth: {r.status_code}"

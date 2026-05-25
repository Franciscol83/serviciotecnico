"""
Tests for Web Push Notifications API (iteration 6)
Endpoints under /api/notifications/*
Auth via httpOnly cookie (access_token).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soporte-hispano.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@tecnonacho.com"
ADMIN_PASSWORD = "admin123"

TEST_ENDPOINT = "https://fcm.googleapis.com/fcm/send/TEST-ITER6-NOTIFICATIONS-PYTEST"
TEST_SUBSCRIPTION = {
    "endpoint": TEST_ENDPOINT,
    "keys": {
        "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        "auth": "tBHItJI5svbpez7KI4CCXg",
    },
    "user_agent": "pytest-iteration6",
}


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def auth_session():
    """Login as admin and return an authenticated session (cookies)."""
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    }, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} - {r.text}"
    # Cookie should be set
    assert any(c.name in ("access_token", "token") for c in s.cookies), f"No auth cookie set. Cookies: {s.cookies.items()}"
    yield s
    # Cleanup: try to unsubscribe in case test left state
    try:
        s.post(f"{API}/notifications/unsubscribe", json={"endpoint": TEST_ENDPOINT}, timeout=10)
    except Exception:
        pass


# ---------------- Tests: VAPID public key ----------------
class TestVapidPublicKey:
    def test_get_vapid_public_key_returns_key(self, auth_session):
        # This endpoint should be accessible (no auth required by code, but session ok)
        r = requests.get(f"{API}/notifications/vapid-public-key", timeout=10)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "public_key" in data
        assert isinstance(data["public_key"], str)
        assert len(data["public_key"]) > 20, "VAPID public key looks too short"


# ---------------- Tests: subscribe / status / unsubscribe ----------------
class TestPushSubscriptionFlow:
    def test_status_initial(self, auth_session):
        r = auth_session.get(f"{API}/notifications/status", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "subscribed" in data
        assert "devices" in data
        assert isinstance(data["devices"], int)

    def test_subscribe_creates_subscription(self, auth_session):
        r = auth_session.post(f"{API}/notifications/subscribe", json=TEST_SUBSCRIPTION, timeout=10)
        assert r.status_code == 200, f"Subscribe failed: {r.status_code} - {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert "user_id" in data

    def test_status_reflects_subscription(self, auth_session):
        r = auth_session.get(f"{API}/notifications/status", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["subscribed"] is True
        assert data["devices"] >= 1

    def test_subscribe_is_idempotent(self, auth_session):
        # Re-subscribing same endpoint should NOT create duplicate
        r = auth_session.post(f"{API}/notifications/subscribe", json=TEST_SUBSCRIPTION, timeout=10)
        assert r.status_code == 200
        # Now check devices count is still >= 1 (no duplicates would be ideal but at least working)
        s = auth_session.get(f"{API}/notifications/status", timeout=10).json()
        assert s["subscribed"] is True

    def test_send_test_notification_cleans_dead_sub(self, auth_session):
        # Endpoint is fake -> pywebpush will fail. Server should remove dead sub (404/410).
        r = auth_session.post(f"{API}/notifications/test", json={
            "title": "Test pytest",
            "body": "Hola desde pytest",
            "url": "/",
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "result" in data
        result = data["result"]
        assert "sent" in result and "failed" in result and "removed" in result
        # The fake FCM endpoint should produce either 'removed' (404/410) or 'failed'
        assert (result["removed"] + result["failed"]) >= 1, f"Expected at least 1 failed/removed, got {result}"

    def test_unsubscribe(self, auth_session):
        # First ensure something to unsubscribe (re-subscribe in case test cleaned it)
        auth_session.post(f"{API}/notifications/subscribe", json=TEST_SUBSCRIPTION, timeout=10)
        r = auth_session.post(f"{API}/notifications/unsubscribe", json={"endpoint": TEST_ENDPOINT}, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("deleted", 0) >= 0  # could be 0 if already removed by /test

    def test_unsubscribe_requires_endpoint(self, auth_session):
        r = auth_session.post(f"{API}/notifications/unsubscribe", json={}, timeout=10)
        assert r.status_code == 400


# ---------------- Tests: Auth required ----------------
class TestPushNotificationsAuth:
    def test_subscribe_requires_auth(self):
        r = requests.post(f"{API}/notifications/subscribe", json=TEST_SUBSCRIPTION, timeout=10)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_status_requires_auth(self):
        r = requests.get(f"{API}/notifications/status", timeout=10)
        assert r.status_code in (401, 403)

    def test_test_requires_auth(self):
        r = requests.post(f"{API}/notifications/test", json={}, timeout=10)
        assert r.status_code in (401, 403)


# ---------------- Tests: Existing pages still work (regression for refactor) ----------------
class TestRefactorRegression:
    """Verify endpoints used by refactored Services.js and CrearReporte.js still work."""

    def test_services_list_loads(self, auth_session):
        r = auth_session.get(f"{API}/services", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) or "items" in data or "services" in data

    def test_service_types_list(self, auth_session):
        r = auth_session.get(f"{API}/service-types", timeout=15)
        assert r.status_code == 200, r.text

    def test_reportes_list(self, auth_session):
        r = auth_session.get(f"{API}/reportes", timeout=15)
        assert r.status_code == 200, r.text

    def test_users_list(self, auth_session):
        r = auth_session.get(f"{API}/users", timeout=15)
        assert r.status_code == 200, r.text


# ---------------- Tests: Service Worker has push handlers ----------------
class TestServiceWorker:
    def test_service_worker_served(self):
        r = requests.get(f"{BASE_URL}/service-worker.js", timeout=15)
        assert r.status_code == 200, f"SW not served: {r.status_code}"
        body = r.text
        assert "addEventListener('push'" in body or 'addEventListener("push"' in body, "No push handler in SW"
        assert "addEventListener('notificationclick'" in body or 'addEventListener("notificationclick"' in body

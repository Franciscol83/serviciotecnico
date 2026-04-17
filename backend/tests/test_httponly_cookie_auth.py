"""
Test suite for httpOnly Cookie Authentication Migration
Tests:
- Login sets httpOnly cookie correctly
- Protected endpoints accept cookie authentication
- Logout clears the cookie
- Middleware accepts both cookie and header (transition mode)
- Protected endpoints reject requests without valid auth
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = 'admin@tecnonacho.com'
ADMIN_PASSWORD = 'admin123'


class TestLoginCookieAuth:
    """Test login endpoint sets httpOnly cookie"""
    
    def test_login_sets_cookie(self):
        """Test that login response includes Set-Cookie header with httpOnly"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check that cookie was set
        cookies = session.cookies.get_dict()
        assert "access_token" in cookies, "access_token cookie not set"
        
        # Verify response body still contains token (for backward compatibility)
        data = response.json()
        assert "access_token" in data, "access_token not in response body"
        assert "user" in data, "user not in response body"
        
        print("✓ Login sets httpOnly cookie correctly")
    
    def test_login_cookie_attributes(self):
        """Test cookie has correct security attributes"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200
        
        # Check Set-Cookie header
        set_cookie = response.headers.get('Set-Cookie', '')
        
        # Verify httpOnly flag
        assert 'HttpOnly' in set_cookie or 'httponly' in set_cookie.lower(), \
            f"Cookie should be HttpOnly. Got: {set_cookie}"
        
        # Verify Secure flag
        assert 'Secure' in set_cookie or 'secure' in set_cookie.lower(), \
            f"Cookie should be Secure. Got: {set_cookie}"
        
        # Verify SameSite
        assert 'SameSite' in set_cookie or 'samesite' in set_cookie.lower(), \
            f"Cookie should have SameSite. Got: {set_cookie}"
        
        print("✓ Cookie has correct security attributes (HttpOnly, Secure, SameSite)")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpass"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials return 401")


class TestProtectedEndpointsWithCookie:
    """Test protected endpoints accept cookie authentication"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create session with valid cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_services_endpoint_with_cookie(self, authenticated_session):
        """Test /api/services accessible with cookie"""
        response = authenticated_session.get(f"{BASE_URL}/api/services")
        
        assert response.status_code == 200, f"Services failed: {response.text}"
        assert isinstance(response.json(), list)
        print("✓ /api/services accessible with cookie auth")
    
    def test_users_endpoint_with_cookie(self, authenticated_session):
        """Test /api/users accessible with cookie"""
        response = authenticated_session.get(f"{BASE_URL}/api/users")
        
        assert response.status_code == 200, f"Users failed: {response.text}"
        assert isinstance(response.json(), list)
        print("✓ /api/users accessible with cookie auth")
    
    def test_reportes_endpoint_with_cookie(self, authenticated_session):
        """Test /api/reportes accessible with cookie"""
        response = authenticated_session.get(f"{BASE_URL}/api/reportes")
        
        assert response.status_code == 200, f"Reportes failed: {response.text}"
        assert isinstance(response.json(), list)
        print("✓ /api/reportes accessible with cookie auth")
    
    def test_reportes_estadisticas_with_cookie(self, authenticated_session):
        """Test /api/reportes/estadisticas accessible with cookie"""
        response = authenticated_session.get(f"{BASE_URL}/api/reportes/estadisticas")
        
        assert response.status_code == 200, f"Estadisticas failed: {response.text}"
        data = response.json()
        assert "resumen" in data
        assert "servicios_por_estado" in data
        print("✓ /api/reportes/estadisticas accessible with cookie auth")
    
    def test_auth_me_with_cookie(self, authenticated_session):
        """Test /api/auth/me returns current user with cookie"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print("✓ /api/auth/me returns current user with cookie auth")


class TestLogoutClearsCookie:
    """Test logout endpoint clears the cookie"""
    
    def test_logout_clears_cookie(self):
        """Test that logout clears the access_token cookie"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        assert "access_token" in session.cookies.get_dict()
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        
        # Verify cookie is cleared (either removed or expired)
        # After logout, trying to access protected endpoint should fail
        protected_response = session.get(f"{BASE_URL}/api/services")
        assert protected_response.status_code == 401, \
            f"Expected 401 after logout, got {protected_response.status_code}"
        
        print("✓ Logout clears cookie and protected endpoints return 401")


class TestMiddlewareTransitionMode:
    """Test middleware accepts both cookie and header (transition mode)"""
    
    def test_header_auth_still_works(self):
        """Test Authorization header still works (backward compatibility)"""
        # Get token via login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Use token in header (old method)
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Header auth failed: {response.text}"
        print("✓ Authorization header still works (transition mode)")
    
    def test_cookie_takes_priority(self):
        """Test that cookie auth is used when both cookie and header present"""
        session = requests.Session()
        
        # Login to get cookie
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        
        # Make request with both cookie (from session) and invalid header
        response = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        # Should succeed because cookie is valid (cookie takes priority)
        assert response.status_code == 200, \
            f"Cookie should take priority over header. Got: {response.status_code}"
        print("✓ Cookie authentication takes priority over header")


class TestProtectedEndpointsWithoutAuth:
    """Test protected endpoints reject unauthenticated requests"""
    
    def test_services_without_auth(self):
        """Test /api/services returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/services returns 401 without auth")
    
    def test_users_without_auth(self):
        """Test /api/users returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/users returns 401 without auth")
    
    def test_reportes_without_auth(self):
        """Test /api/reportes returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/reportes")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/reportes returns 401 without auth")
    
    def test_auth_me_without_auth(self):
        """Test /api/auth/me returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/auth/me returns 401 without auth")


class TestHealthEndpoint:
    """Test health endpoint is accessible without auth"""
    
    def test_health_no_auth_required(self):
        """Test /api/health is accessible without authentication"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        print("✓ /api/health accessible without auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

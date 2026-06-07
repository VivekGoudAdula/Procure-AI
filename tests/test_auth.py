import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from datetime import timedelta
import jwt

from main import app, get_current_user, create_access_token, JWT_SECRET_KEY, JWT_ALGORITHM
from conftest import mock_users_list

client = TestClient(app)

def test_signup_success():
    """
    Verifies that a user can sign up successfully.
    """
    payload = {
        "email": "newuser@example.com",
        "password": "securepassword123"
    }
    response = client.post("/api/signup", json=payload)
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"
    assert any(u["email"] == "newuser@example.com" for u in mock_users_list)

def test_signup_duplicate_email():
    """
    Verifies that signing up with a duplicate email returns HTTP 400.
    """
    # Register first user
    payload1 = {
        "email": "duplicate@example.com",
        "password": "password1"
    }
    response1 = client.post("/api/signup", json=payload1)
    assert response1.status_code == 200

    # Attempt to register with same email
    payload2 = {
        "email": "duplicate@example.com",
        "password": "password2"
    }
    response2 = client.post("/api/signup", json=payload2)
    assert response2.status_code == 400
    assert "User already exists" in response2.json()["detail"]

def test_login_success():
    """
    Verifies that login is successful with valid credentials and returns a JWT.
    """
    # Sign up user first
    payload = {
        "email": "loginuser@example.com",
        "password": "correct_password"
    }
    client.post("/api/signup", json=payload)

    # Login
    login_payload = {
        "email": "loginuser@example.com",
        "password": "correct_password"
    }
    response = client.post("/api/login", json=login_payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == "loginuser@example.com"

def test_login_invalid_password():
    """
    Verifies that login fails with an invalid password and returns HTTP 401.
    """
    # Sign up user first
    payload = {
        "email": "loginuser2@example.com",
        "password": "correct_password"
    }
    client.post("/api/signup", json=payload)

    # Login with wrong password
    login_payload = {
        "email": "loginuser2@example.com",
        "password": "wrong_password"
    }
    response = client.post("/api/login", json=login_payload)
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

def test_expired_jwt():
    """
    Verifies that get_current_user raises HTTP 401 when the JWT token has expired.
    """
    # Generate expired access token using a negative expires_delta
    token = create_access_token(data={"sub": "expired@example.com"}, expires_delta=timedelta(seconds=-10))
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials)
    
    assert exc_info.value.status_code == 401
    assert "Token has expired" in exc_info.value.detail

def test_invalid_jwt():
    """
    Verifies that get_current_user raises HTTP 401 when the JWT token is malformed or invalid.
    """
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="completely_invalid_token_xyz")
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials)
        
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail

def test_protected_endpoint_without_jwt():
    """
    Verifies that calling a protected endpoint without a JWT returns HTTP 403 or 401.
    """
    old_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
    
    try:
        response = client.get("/api/suppliers")
        assert response.status_code in [401, 403]
    finally:
        if old_override:
            app.dependency_overrides[get_current_user] = old_override

def test_protected_endpoint_with_invalid_jwt():
    """
    Verifies that calling a protected endpoint with an invalid JWT returns HTTP 401.
    """
    old_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
        
    try:
        response = client.get("/api/suppliers", headers={"Authorization": "Bearer invalid_token_xyz"})
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]
    finally:
        if old_override:
            app.dependency_overrides[get_current_user] = old_override


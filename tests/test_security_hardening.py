import os
import pytest
from fastapi.testclient import TestClient
from main import app, get_current_user, create_access_token, load_db
import bcrypt
import io

client = TestClient(app)

def test_password_hashing_and_verification():
    """
    Verifies that:
    1. /api/signup hashes passwords using bcrypt before saving.
    2. /api/login verifies password using bcrypt and returns JWT.
    """
    email = "security_test@example.com"
    password = "SuperSecurePassword123!"
    
    # 1. Signup
    signup_payload = {"email": email, "password": password}
    signup_response = client.post("/api/signup", json=signup_payload)
    assert signup_response.status_code == 200
    assert signup_response.json()["message"] == "User registered successfully"
    
    # Verify password is encrypted in database
    db = load_db()
    user_in_db = next((u for u in db["users"] if u["email"] == email), None)
    assert user_in_db is not None
    assert user_in_db["password"] != password
    assert user_in_db["password"].startswith("$2b$") or user_in_db["password"].startswith("$2a$")
    
    # Verify bcrypt can verify it
    assert bcrypt.checkpw(password.encode("utf-8"), user_in_db["password"].encode("utf-8"))
    
    # 2. Login
    login_payload = {"email": email, "password": password}
    login_response = client.post("/api/login", json=login_payload)
    assert login_response.status_code == 200
    
    data = login_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == email

def test_jwt_validation_and_route_protection():
    """
    Verifies that:
    1. Protected routes require authorization (return 403 when Authorization header is missing).
    2. Invalid tokens return 401.
    3. Valid tokens grant access (return 200).
    """
    # Remove the global dependency override to test actual JWT verification logic
    old_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
        
    try:
        # 1. Missing Authorization header -> 401 Unauthorized or 403 Forbidden
        response = client.get("/api/suppliers")
        assert response.status_code in [401, 403]
        
        # 2. Invalid Token -> 401 Unauthorized
        response = client.get("/api/suppliers", headers={"Authorization": "Bearer invalid_token_here"})
        assert response.status_code == 401
        
        # 3. Valid Token -> 200 OK
        token = create_access_token(data={"sub": "security_test@example.com"})
        response = client.get("/api/suppliers", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
    finally:
        # Restore the global override for other tests
        if old_override:
            app.dependency_overrides[get_current_user] = old_override

def test_file_upload_validation():
    """
    Verifies that /api/submit-delivery-proof:
    1. Accepts valid MIME types (image/png, image/jpeg, application/pdf).
    2. Rejects invalid MIME types.
    """
    # Create or update a mock escrow record in DB
    from db import escrows_collection
    escrow_id = "test_escrow_jwt_security_file_upload"
    escrows_collection.delete_many({"transaction_id": escrow_id})
    escrows_collection.replace_one(
        {"transaction_id": escrow_id},
        {
            "transaction_id": escrow_id,
            "app_id": escrow_id,
            "escrow_status": "funded",
            "delivery_proof": None,
            "verified": False
        },
        upsert=True
    )
    
    try:
        # 1. Test valid PNG upload
        png_data = io.BytesIO(b"dummy png content")
        response = client.post(
            "/api/submit-delivery-proof",
            data={
                "escrow_id": escrow_id,
                "proof_type": "invoice_file",
                "value": ""
            },
            files={
                "file": ("invoice.png", png_data, "image/png")
            }
        )
        assert response.status_code == 200
        assert response.json()["escrow_status"] == "proof_submitted"
        
        # 2. Test valid PDF upload
        pdf_data = io.BytesIO(b"dummy pdf content")
        response = client.post(
            "/api/submit-delivery-proof",
            data={
                "escrow_id": escrow_id,
                "proof_type": "invoice_file",
                "value": ""
            },
            files={
                "file": ("invoice.pdf", pdf_data, "application/pdf")
            }
        )
        assert response.status_code == 200
        
        # 3. Test invalid MIME type (text/plain)
        txt_data = io.BytesIO(b"dummy text content")
        response = client.post(
            "/api/submit-delivery-proof",
            data={
                "escrow_id": escrow_id,
                "proof_type": "invoice_file",
                "value": ""
            },
            files={
                "file": ("invoice.txt", txt_data, "text/plain")
            }
        )
        assert response.status_code == 400
        assert "Only PNG, JPEG, and PDF file types are allowed" in response.json()["detail"]
    finally:
        # Clean up mock escrow
        escrows_collection.delete_many({"transaction_id": escrow_id})

def test_env_variables_not_exposed():
    """
    Verifies that system environment variables containing secrets are not exposed in any public metadata endpoints.
    """
    endpoints = ["/health", "/api/x402/status"]
    secrets = ["GROQ_API_KEY", "JWT_SECRET_KEY", "SMTP_PASSWORD"]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        if response.status_code == 200:
            content = response.text
            for secret in secrets:
                secret_val = os.getenv(secret)
                if secret_val and len(secret_val) > 4:
                    assert secret_val not in content

def test_secret_values_not_returned():
    """
    Verifies that password hashes and database internal fields are not exposed in responses.
    """
    # 1. Sign up user
    payload = {"email": "secrets_test@example.com", "password": "SuperSecretPassword!"}
    client.post("/api/signup", json=payload)
    
    # Login and check response
    response = client.post("/api/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "password" not in data
    assert "_id" not in data
    
    # Get suppliers list (needs current user mock)
    response_suppliers = client.get("/api/suppliers")
    assert response_suppliers.status_code == 200
    suppliers = response_suppliers.json()
    for s in suppliers:
        assert "password" not in s
        assert "_id" not in s
        assert "private_key" not in s

def test_cors_headers():
    """
    Verifies that appropriate CORS headers are present on API responses.
    """
    response = client.options(
        "/api/suppliers",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    
    # Check that x402 headers are exposed in standard responses
    response_get = client.get("/api/suppliers", headers={"Origin": "http://localhost:3000"})
    assert "access-control-expose-headers" in response_get.headers
    expose = response_get.headers["access-control-expose-headers"]
    assert "PAYMENT-REQUIRED" in expose
    assert "PAYMENT-RESPONSE" in expose

def test_password_hashing():
    """
    Verifies that password hashing is correctly performed using bcrypt.
    """
    db = load_db()
    for user in db.get("users", []):
        pw_hash = user.get("password", "")
        assert pw_hash.startswith("$2b$") or pw_hash.startswith("$2a$")

def test_jwt_signature_validation():
    """
    Verifies that tampering with a JWT token signature results in a 401.
    """
    token = create_access_token(data={"sub": "security_test@example.com"})
    # Tamper with the signature part of the token (third segment)
    parts = token.split(".")
    if len(parts) == 3:
        tampered_token = f"{parts[0]}.{parts[1]}.tamperedsignaturehere"
        
        old_override = app.dependency_overrides.get(get_current_user)
        if get_current_user in app.dependency_overrides:
            del app.dependency_overrides[get_current_user]
            
        try:
            response = client.get("/api/suppliers", headers={"Authorization": f"Bearer {tampered_token}"})
            assert response.status_code == 401
            assert "Could not validate credentials" in response.json()["detail"]
        finally:
            if old_override:
                app.dependency_overrides[get_current_user] = old_override


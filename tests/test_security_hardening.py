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

import pytest
from fastapi.testclient import TestClient
from main import app, get_current_user
from conftest import mock_users_list, mock_escrows_list, mock_suppliers_list

client = TestClient(app)

def test_complete_end_to_end_procurement_flow():
    """
    Simulates the entire end-to-end procurement workflow:
    Buyer Login ➔ Procurement Search ➔ Supplier Discovery ➔ Supplier Selection ➔ Inquiry Generation ➔ Escrow Creation ➔ Verification ➔ Settlement Release
    """
    
    # 1. Buyer Sign up & Login
    signup_payload = {
        "email": "e2e_buyer@example.com",
        "password": "securepassword123"
    }
    signup_response = client.post("/api/signup", json=signup_payload)
    assert signup_response.status_code == 200
    
    login_response = client.post("/api/login", json=signup_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    jwt_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {jwt_token}"}
    
    # Temporarily set dependency override to return this specific e2e user
    old_override = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = lambda: "e2e_buyer@example.com"
    
    try:
        # 2. Procurement Search (Intelligence Engine)
        search_payload = {
            "product_name": "Industrial Steel Rods",
            "quantity": 100,
            "budget": 50000.0,
            "shipping_region": "Global"
        }
        search_response = client.post("/api/procurement/intelligence", json=search_payload, headers=headers)
        assert search_response.status_code == 200
        search_data = search_response.json()
        assert "suppliers" in search_data or "status" in search_data

        
        # 3. Supplier Discovery
        discovery_response = client.get("/api/suppliers", headers=headers)
        assert discovery_response.status_code == 200
        suppliers_list = discovery_response.json()
        assert len(suppliers_list) > 0
        supplier_id = suppliers_list[0]["id"]
        
        # 4. Supplier Selection (Agent Arena / Policy filtering)
        selection_payload = {
            "productName": "Industrial Steel Rods",
            "quantity": 100,
            "budget": 50000.0,
            "policy": {
                "max_budget": 60000.0,
                "min_reliability": 80,
                "max_delivery_days": 15,
                "min_success_rate": 85,
                "require_on_chain_verified": False
            }
        }
        selection_response = client.post("/api/select-supplier", json=selection_payload, headers=headers)
        assert selection_response.status_code == 200
        selection_data = selection_response.json()
        assert selection_data.get("status") != "no_supplier_found"
        assert "selectedSupplier" in selection_data
        selected_supplier = selection_data["selectedSupplier"]
        assert selected_supplier["id"] is not None
        
        # 5. Inquiry Generation
        inquiry_payload = {
            "product": "Industrial Steel Rods",
            "quantity": 100,
            "budget": 50000.0,
            "lead_time": "10 days",
            "requirements": "Standard ASTM specifications"
        }
        inquiry_response = client.post("/api/procurement/generate-inquiry", json=inquiry_payload, headers=headers)
        assert inquiry_response.status_code == 200
        inquiry_data = inquiry_response.json()
        assert "message" in inquiry_data
        assert "metadata" in inquiry_data
        
        # 6. Escrow Creation
        escrow_payload = {
            "sender": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
            "receiver": selected_supplier["wallet_address"],
            "amount": 0.5,
            "supplier_id": selected_supplier["id"],
            "promised_delivery_days": 10
        }
        escrow_response = client.post("/api/procurement/initiate-commitment", json=escrow_payload, headers=headers)
        assert escrow_response.status_code == 200
        escrow_data = escrow_response.json()
        assert escrow_data["escrow_status"] == "funded"
        tx_id = escrow_data["transaction_id"]
        
        # 7. Verification (Proof Submission + Verification)
        proof_payload = {
            "escrow_id": tx_id,
            "proof_type": "timestamp",
            "value": "2026-06-04T15:00:00Z"
        }
        proof_response = client.post("/api/submit-delivery-proof", data=proof_payload, headers=headers)
        assert proof_response.status_code == 200
        proof_data = proof_response.json()
        assert proof_data["escrow_status"] == "proof_submitted"
        
        verify_payload = {
            "escrow_id": tx_id
        }
        verify_response = client.post("/api/procurement/verify-delivery", json=verify_payload, headers=headers)
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["escrow_status"] == "verified"
        assert verify_data["verified"] is True
        
        # 8. Settlement Release
        release_payload = {
            "transaction_id": tx_id
        }
        release_response = client.post("/api/procurement/release-settlement", json=release_payload, headers=headers)
        assert release_response.status_code == 200
        release_data = release_response.json()
        assert release_data["escrow_status"] == "released"
        
    finally:
        # Clean up database lists and restore override
        mock_users_list.clear()
        mock_escrows_list.clear()
        if old_override:
            app.dependency_overrides[get_current_user] = old_override

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_escrow_lifecycle():
    """
    Tests the complete escrow flow:
    1. Escrow Creation (/api/procurement/initiate-commitment)
    2. Submit Delivery Proof (/api/submit-delivery-proof)
    3. Verify Delivery (/api/procurement/verify-delivery)
    4. Confirm Delivery / Release Settlement (/api/procurement/release-settlement)
    """
    
    # --- 1. ESCROW CREATION ---
    initiate_payload = {
        "sender": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "amount": 0.1,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 5
    }
    
    create_response = client.post("/api/procurement/initiate-commitment", json=initiate_payload)
    assert create_response.status_code == 200
    
    escrow_data = create_response.json()
    assert "transaction_id" in escrow_data
    assert "app_id" in escrow_data
    assert "app_address" in escrow_data
    assert escrow_data["escrow_status"] == "funded"
    assert escrow_data["verified"] is False
    
    tx_id = escrow_data["transaction_id"]
    app_id = escrow_data["app_id"]
    
    # --- 2. SUBMIT DELIVERY PROOF ---
    # Submit a timestamp-based delivery proof
    proof_payload = {
        "escrow_id": tx_id,
        "proof_type": "timestamp",
        "value": "2026-06-03T20:30:00Z"
    }
    
    proof_response = client.post("/api/submit-delivery-proof", data=proof_payload)
    assert proof_response.status_code == 200
    
    proof_data = proof_response.json()
    assert proof_data["escrow_status"] == "proof_submitted"
    assert "delivery_proof" in proof_data
    assert proof_data["delivery_proof"]["type"] == "timestamp"
    
    # --- 3. VERIFY DELIVERY ---
    verify_payload = {
        "escrow_id": tx_id
    }
    
    verify_response = client.post("/api/procurement/verify-delivery", json=verify_payload)
    assert verify_response.status_code == 200
    
    verify_data = verify_response.json()
    assert verify_data["escrow_status"] == "verified"
    assert verify_data["verified"] is True
    
    # --- 4. RELEASE SETTLEMENT ---
    release_payload = {
        "transaction_id": tx_id
    }
    
    release_response = client.post("/api/procurement/release-settlement", json=release_payload)
    assert release_response.status_code == 200
    
    release_data = release_response.json()
    assert release_data["escrow_status"] == "released"
    assert release_data["verified"] is True

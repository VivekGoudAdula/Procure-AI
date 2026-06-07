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

def test_create_escrow():
    """
    Verifies that initiating a procurement commitment creates an escrow successfully.
    """
    payload = {
        "sender": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "amount": 0.1,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 5
    }
    response = client.post("/api/procurement/initiate-commitment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "app_id" in data
    assert data["escrow_status"] == "funded"

def test_submit_proof():
    """
    Verifies that submitting a delivery proof updates the escrow status.
    """
    from conftest import mock_escrows_list
    tx_id = "test_tx_submit_proof"
    mock_escrows_list.append({
        "transaction_id": tx_id,
        "app_id": 12345,
        "escrow_status": "funded",
        "verified": False,
        "delivery_proof": None
    })
    
    payload = {
        "escrow_id": tx_id,
        "proof_type": "timestamp",
        "value": "2026-06-04T12:00:00Z"
    }
    response = client.post("/api/submit-delivery-proof", data=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escrow_status"] == "proof_submitted"
    assert data["delivery_proof"]["value"] == "2026-06-04T12:00:00Z"

def test_verify_escrow():
    """
    Verifies that verifying a delivery sets the verified status to True.
    """
    from conftest import mock_escrows_list
    tx_id = "test_tx_verify_escrow"
    mock_escrows_list.append({
        "transaction_id": tx_id,
        "app_id": 12345,
        "escrow_status": "proof_submitted",
        "verified": False,
        "delivery_proof": {"type": "timestamp", "value": "2026-06-04T12:00:00Z"}
    })
    
    payload = {
        "escrow_id": tx_id
    }
    response = client.post("/api/procurement/verify-delivery", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escrow_status"] == "verified"
    assert data["verified"] is True

def test_release_settlement():
    """
    Verifies that releasing settlement updates the escrow status to released.
    """
    from conftest import mock_escrows_list
    tx_id = "test_tx_release"
    mock_escrows_list.append({
        "transaction_id": tx_id,
        "app_id": 12345,
        "sender_address": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver_address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "escrow_status": "verified",
        "verified": True,
        "delivery_proof": {"type": "timestamp", "value": "2026-06-04T12:00:00Z"}
    })
    
    payload = {
        "transaction_id": tx_id
    }
    response = client.post("/api/procurement/release-settlement", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escrow_status"] == "released"


import pytest
from fastapi.testclient import TestClient
from main import app
from conftest import mock_escrows_list

client = TestClient(app)

def test_double_release_prevention():
    """
    Verifies that trying to release a settlement for an escrow that is already
    released returns HTTP 400 Bad Request.
    """
    tx_id = "test_tx_double_release"
    # Pre-populate an already-released escrow in the mocked database
    escrow_record = {
        "transaction_id": tx_id,
        "app_id": 12345,
        "app_address": "MOCK_ADDRESS",
        "sender_address": "SENDER_ADDR",
        "receiver_address": "RECEIVER_ADDR",
        "amount": 0.1,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 5,
        "escrow_status": "released",
        "verified": True,
        "delivery_proof": {"type": "timestamp", "value": "2026-06-04"}
    }
    mock_escrows_list.append(escrow_record)

    payload = {"transaction_id": tx_id}
    response = client.post("/api/procurement/release-settlement", json=payload)
    assert response.status_code == 400
    assert "Escrow already released" in response.json()["detail"]

def test_invalid_escrow_id():
    """
    Verifies that calling verify-delivery, release-settlement, or submit-delivery-proof
    with an invalid or non-existent escrow/transaction ID returns HTTP 404.
    """
    invalid_id = "non_existent_escrow_id_123"

    # Test release-settlement
    payload_release = {"transaction_id": invalid_id}
    response_release = client.post("/api/procurement/release-settlement", json=payload_release)
    assert response_release.status_code == 404
    assert "Escrow not found" in response_release.json()["detail"]

    # Test verify-delivery
    payload_verify = {"escrow_id": invalid_id}
    response_verify = client.post("/api/procurement/verify-delivery", json=payload_verify)
    assert response_verify.status_code == 404
    assert "Escrow not found" in response_verify.json()["detail"]

    # Test submit-delivery-proof
    response_proof = client.post(
        "/api/submit-delivery-proof",
        data={
            "escrow_id": invalid_id,
            "proof_type": "timestamp",
            "value": "2026-06-04"
        }
    )
    assert response_proof.status_code == 404
    assert "Escrow not found" in response_proof.json()["detail"]

def test_release_without_verification():
    """
    Verifies that trying to release an escrow settlement that has not been
    verified returns HTTP 400 Bad Request.
    """
    tx_id = "test_tx_no_verification"
    # Pre-populate a funded but unverified escrow in the mocked database
    escrow_record = {
        "transaction_id": tx_id,
        "app_id": 54321,
        "app_address": "MOCK_ADDRESS",
        "sender_address": "SENDER_ADDR",
        "receiver_address": "RECEIVER_ADDR",
        "amount": 0.1,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 5,
        "escrow_status": "funded",
        "verified": False,
        "delivery_proof": None
    }
    mock_escrows_list.append(escrow_record)

    payload = {"transaction_id": tx_id}
    response = client.post("/api/procurement/release-settlement", json=payload)
    assert response.status_code == 400
    assert "Cannot release escrow without verification" in response.json()["detail"]

def test_unknown_transaction():
    """
    Verifies that querying or updating an unknown transaction ID returns HTTP 404.
    """
    # 1. Querying non-existent transaction
    response_get = client.get("/api/get-transaction/non_existent_tx_999")
    assert response_get.status_code == 404
    
    # 2. Updating status of non-existent transaction
    payload = {"transaction_id": "non_existent_tx_999", "status": "released"}
    response_post = client.post("/api/update-escrow-status", json=payload)
    assert response_post.status_code == 404

def test_duplicate_verification():
    """
    Verifies that calling verify-delivery on an already verified escrow succeeds and remains verified.
    """
    tx_id = "test_tx_duplicate_verify"
    escrow_record = {
        "transaction_id": tx_id,
        "app_id": 99999,
        "app_address": "MOCK_ADDRESS",
        "sender_address": "SENDER_ADDR",
        "receiver_address": "RECEIVER_ADDR",
        "amount": 0.1,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 5,
        "escrow_status": "verified",
        "verified": True,
        "delivery_proof": {"type": "timestamp", "value": "2026-06-04"}
    }
    mock_escrows_list.append(escrow_record)
    
    payload = {"escrow_id": tx_id}
    response = client.post("/api/procurement/verify-delivery", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escrow_status"] == "verified"
    assert data["verified"] is True


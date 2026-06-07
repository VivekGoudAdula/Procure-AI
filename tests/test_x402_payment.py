import base64
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from x402.config import X402_AVM_ADDRESS, X402_ASSET, X402_PRICE

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_used_tx_ids():
    from x402.resource_server import USED_TX_IDS
    USED_TX_IDS.clear()


@patch("x402.payment_routes.get_suggested_params")
def test_x402_payment_required_challenge(mock_get_params):
    """
    Checks that querying the premium report without payment proof
    returns HTTP 402, sets the PAYMENT-REQUIRED header, and returns the accepts list
    along with suggestedParams.
    """
    mock_get_params.return_value = {
        "fee": 1000,
        "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
        "genesisId": "testnet-v1.0",
        "firstValid": 0,
        "lastValid": 1000,
        "minFee": 1000,
    }
    response = client.get("/api/x402/premium-supplier-report?supplier_id=ALB-1001")
    assert response.status_code == 402
    assert "PAYMENT-REQUIRED" in response.headers
    
    body = response.json()
    assert body["x402Version"] == 2
    assert "accepts" in body
    assert "suggestedParams" in body
    assert body["suggestedParams"] == mock_get_params.return_value


def test_x402_status_endpoint():
    """
    Verifies that the debug status endpoint returns correct x402 configuration.
    """
    response = client.get("/api/x402/status")
    assert response.status_code == 200
    body = response.json()
    assert body["x402Version"] == 2
    assert body["scheme"] == "exact"
    assert body["network"] == "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI="
    assert body["treasuryAddress"] == X402_AVM_ADDRESS
    assert body["asset"] == X402_ASSET
    assert body["amount"] == X402_PRICE


@pytest.mark.anyio
@patch("x402.payment_routes.verify_payment_proof", new_callable=AsyncMock)
def test_x402_payment_verification_success(mock_verify):
    """
    Checks that providing a valid payment signature header (base64 JSON containing ATG)
    unlocks the report, returns HTTP 200, and returns the premium report contents along with
    the PAYMENT-RESPONSE success header.
    """
    mock_verify.return_value = (True, "MOCK_TX_ID_AVM_998877")
    
    proof_payload = {
        "x402Version": 2,
        "paymentPayload": {
            "paymentGroup": ["MOCK_SIGNED_TX0_B64", "MOCK_UNSIGNED_TX1_B64"],
            "paymentIndex": 0
        },
        "paymentRequirements": {
            "x402Version": 2,
            "scheme": "exact",
            "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
            "amount": X402_PRICE,
            "maxAmountRequired": X402_PRICE,
            "payTo": X402_AVM_ADDRESS,
            "asset": X402_ASSET,
            "resource": "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
            "extra": {
                "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
                "decimals": 6
            }
        }
    }
    proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
    
    response = client.get(
        "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
        headers={"PAYMENT-SIGNATURE": proof_b64}
    )
    
    assert response.status_code == 200
    assert "PAYMENT-RESPONSE" in response.headers
    assert "PAYMENT-RESPONSE" in response.headers.get("Access-Control-Expose-Headers", "")
    
    # Verify PAYMENT-RESPONSE header contents
    resp_b64 = response.headers["PAYMENT-RESPONSE"]
    resp_json = json.loads(base64.b64decode(resp_b64).decode("utf-8"))
    assert resp_json["txId"] == "MOCK_TX_ID_AVM_998877"
    assert resp_json["status"] == "success"
    
    # Verify report body structure
    report = response.json()
    assert report["supplier_id"] == "ALB-1001"
    assert "supplier_name" in report
    assert "trust_score" in report
    assert "risk_level" in report
    assert "delivery_confidence" in report


@pytest.mark.anyio
@patch("x402.payment_routes.verify_payment_proof", new_callable=AsyncMock)
def test_x402_payment_verification_invalid(mock_verify):
    """
    Checks that providing an invalid payment signature returns HTTP 402.
    """
    mock_verify.return_value = (False, None)
    
    invalid_proof_b64 = base64.b64encode(b"invalid-payload").decode("utf-8")
    
    response = client.get(
        "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
        headers={"PAYMENT-SIGNATURE": invalid_proof_b64}
    )
    
    assert response.status_code == 402
    assert "PAYMENT-REQUIRED" in response.headers
    
    body = response.json()
    assert "error" in body
    assert "Payment proof invalid or unverifiable" in body["error"]


@pytest.mark.anyio
@patch("x402.resource_server.get_algod_client")
async def test_verify_payment_proof_timeout_fallback(mock_get_algod):
    """
    Verifies that when the GoPlausible facilitator call fails/times out, the system falls back
    to the direct on-chain verification, correctly parsing the ATG paymentGroup and validation parameters.
    """
    from algosdk import encoding
    from x402.resource_server import verify_payment_proof
    
    expected_tx_id = "JSPT6XCZIDC3QHFK5O5WKXYNMCOZLSIDQ76DNWWJPY6GJURZN7OQ"
    
    # Mock encoding.msgpack_decode to return an object with get_txid method
    mock_txn = MagicMock()
    mock_txn.get_txid.return_value = expected_tx_id
    mock_txn.transaction.get_txid.return_value = expected_tx_id
    
    # Patch msgpack decode
    with patch("algosdk.encoding.msgpack_decode", return_value=mock_txn):
        # Mock algod client methods
        mock_algod = MagicMock()
        # Mock raw transaction send raising timeout
        mock_algod.send_raw_transaction.side_effect = Exception("The read operation timed out")
        
        # Mock pending transaction info return for confirm_txn_details
        # arcv is returned as string matching X402_AVM_ADDRESS directly to bypass encoding mock mismatch.
        mock_algod.pending_transaction_info.return_value = {
            "txn": {
                "txn": {
                    "type": "axfer",
                    "xaid": int(X402_ASSET),
                    "arcv": X402_AVM_ADDRESS,
                    "aamt": int(X402_PRICE)
                }
            }
        }
        mock_get_algod.return_value = mock_algod
        
        # Create valid v2 proof payload format
        proof_payload = {
            "x402Version": 2,
            "paymentPayload": {
                "paymentGroup": ["MOCK_SIGNED_TX0_B64", "MOCK_UNSIGNED_TX1_B64"],
                "paymentIndex": 0
            },
            "paymentRequirements": {
                "x402Version": 2,
                "scheme": "exact",
                "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                "amount": X402_PRICE,
                "maxAmountRequired": X402_PRICE,
                "payTo": X402_AVM_ADDRESS,
                "asset": X402_ASSET,
                "resource": "/api/test",
                "extra": {
                    "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
                    "decimals": 6
                }
            }
        }
        proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
        
        # Call verify_payment_proof. GoPlausible facilitator call will also be mocked to fail.
        with patch("httpx.AsyncClient.post", side_effect=Exception("Facilitator connection failed")):
            success, tx_id = await verify_payment_proof(proof_b64, "/api/test")
            
    assert success is True
    assert tx_id == expected_tx_id


@pytest.mark.anyio
@patch("x402.resource_server.get_algod_client")
async def test_verify_payment_proof_demo_fallback_success(mock_get_algod):
    """
    Checks that when the facilitator and on-chain pending checks fail,
    if X402_DEMO_FALLBACK is enabled, the payment proof is accepted anyway.
    """
    from x402.resource_server import verify_payment_proof
    
    expected_tx_id = "JSPT6XCZIDC3QHFK5O5WKXYNMCOZLSIDQ76DNWWJPY6GJURZN7OQ"
    
    mock_txn = MagicMock()
    mock_txn.get_txid.return_value = expected_tx_id
    mock_txn.transaction.get_txid.return_value = expected_tx_id
    
    with patch("algosdk.encoding.msgpack_decode", return_value=mock_txn):
        mock_algod = MagicMock()
        mock_algod.send_raw_transaction.side_effect = Exception("Node offline")
        mock_algod.pending_transaction_info.side_effect = Exception("Not found")
        mock_get_algod.return_value = mock_algod
        
        proof_payload = {
            "x402Version": 2,
            "paymentPayload": {
                "paymentGroup": ["MOCK_SIGNED_TX0_B64", "MOCK_UNSIGNED_TX1_B64"],
                "paymentIndex": 0
            },
            "paymentRequirements": {
                "x402Version": 2,
                "scheme": "exact",
                "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                "amount": X402_PRICE,
                "maxAmountRequired": X402_PRICE,
                "payTo": X402_AVM_ADDRESS,
                "asset": X402_ASSET,
                "resource": "/api/test",
                "extra": {
                    "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
                    "decimals": 6
                }
            }
        }
        proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
        
        with patch("x402.resource_server.X402_DEMO_FALLBACK", True):
            with patch("httpx.AsyncClient.post", side_effect=Exception("Facilitator connection failed")):
                success, tx_id = await verify_payment_proof(proof_b64, "/api/test")
                
    assert success is True
    assert tx_id == expected_tx_id


@pytest.mark.anyio
@patch("x402.resource_server.get_algod_client")
async def test_replay_attack_protection(mock_get_algod):
    """
    Verifies that calling verify_payment_proof twice with the same transaction
    fails on the second attempt due to replay attack protection.
    """
    from x402.resource_server import verify_payment_proof, USED_TX_IDS
    
    # Clear used transactions before testing
    USED_TX_IDS.clear()
    
    expected_tx_id = "JSPT6XCZIDC3QHFK5O5WKXYNMCOZLSIDQ76DNWWJPY6GJURZN7OQ"
    
    mock_txn = MagicMock()
    mock_txn.get_txid.return_value = expected_tx_id
    mock_txn.transaction.get_txid.return_value = expected_tx_id
    
    with patch("algosdk.encoding.msgpack_decode", return_value=mock_txn):
        mock_algod = MagicMock()
        mock_algod.send_raw_transaction.side_effect = Exception("Node offline")
        mock_algod.pending_transaction_info.side_effect = Exception("Not found")
        mock_get_algod.return_value = mock_algod
        
        proof_payload = {
            "x402Version": 2,
            "paymentPayload": {
                "paymentGroup": ["MOCK_SIGNED_TX0_B64", "MOCK_UNSIGNED_TX1_B64"],
                "paymentIndex": 0
            },
            "paymentRequirements": {
                "x402Version": 2,
                "scheme": "exact",
                "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                "amount": X402_PRICE,
                "maxAmountRequired": X402_PRICE,
                "payTo": X402_AVM_ADDRESS,
                "asset": X402_ASSET,
                "resource": "/api/test",
                "extra": {
                    "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
                    "decimals": 6
                }
            }
        }
        proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
        
        with patch("x402.resource_server.X402_DEMO_FALLBACK", True):
            with patch("httpx.AsyncClient.post", side_effect=Exception("Facilitator connection failed")):
                # First attempt - should succeed
                success1, tx_id1 = await verify_payment_proof(proof_b64, "/api/test")
                assert success1 is True
                assert tx_id1 == expected_tx_id
                
                # Second attempt with same proof - should fail (replay detected)
                success2, tx_id2 = await verify_payment_proof(proof_b64, "/api/test")
                assert success2 is False
                assert tx_id2 is None

@patch("x402.payment_routes.get_suggested_params")
def test_402_challenge_generation(mock_get_params):
    """
    Checks challenge generation on accessing the premium report without payment proof.
    """
    mock_get_params.return_value = {
        "fee": 1000,
        "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
        "genesisId": "testnet-v1.0",
        "firstValid": 0,
        "lastValid": 1000,
        "minFee": 1000,
    }
    response = client.get("/api/x402/premium-supplier-report?supplier_id=ALB-1001")
    assert response.status_code == 402
    assert "PAYMENT-REQUIRED" in response.headers

def test_missing_payment_header():
    """
    Verifies that calling without the PAYMENT-SIGNATURE or X-PAYMENT headers triggers a 402.
    """
    response = client.get("/api/x402/premium-supplier-report?supplier_id=ALB-1001")
    assert response.status_code == 402
    assert "PAYMENT-REQUIRED" in response.headers

@pytest.mark.anyio
@patch("x402.payment_routes.verify_payment_proof", new_callable=AsyncMock)
def test_invalid_payment_signature(mock_verify):
    """
    Verifies that an invalid signature triggers a 402.
    """
    mock_verify.return_value = (False, None)
    invalid_proof_b64 = base64.b64encode(b"invalid-signature").decode("utf-8")
    response = client.get(
        "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
        headers={"PAYMENT-SIGNATURE": invalid_proof_b64}
    )
    assert response.status_code == 402

@pytest.mark.anyio
@patch("x402.payment_routes.verify_payment_proof", new_callable=AsyncMock)
def test_valid_payment(mock_verify):
    """
    Verifies that a valid payment returns 200 and the premium report.
    """
    mock_verify.return_value = (True, "MOCK_TX_ID_12345")
    proof_payload = {
        "x402Version": 2,
        "paymentPayload": {
            "paymentGroup": ["MOCK_SIGNED_TX0_B64"],
            "paymentIndex": 0
        },
        "paymentRequirements": {
            "x402Version": 2,
            "scheme": "exact",
            "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
            "amount": X402_PRICE,
            "maxAmountRequired": X402_PRICE,
            "payTo": X402_AVM_ADDRESS,
            "asset": X402_ASSET,
            "resource": "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
            "extra": {
                "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
                "decimals": 6
            }
        }
    }
    proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
    response = client.get(
        "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
        headers={"PAYMENT-SIGNATURE": proof_b64}
    )
    assert response.status_code == 200
    assert "PAYMENT-RESPONSE" in response.headers

@pytest.mark.anyio
@patch("x402.resource_server.get_algod_client")
async def test_facilitator_fallback_verification(mock_get_algod):
    """
    Verifies that when GoPlausible facilitator call fails/times out, direct on-chain verification fallback succeeds.
    """
    expected_tx_id = "JSPT6XCZIDC3QHFK5O5WKXYNMCOZLSIDQ76DNWWJPY6GJURZN7OQ"
    mock_txn = MagicMock()
    mock_txn.get_txid.return_value = expected_tx_id
    mock_txn.transaction.get_txid.return_value = expected_tx_id
    
    with patch("algosdk.encoding.msgpack_decode", return_value=mock_txn):
        mock_algod = MagicMock()
        mock_algod.send_raw_transaction.side_effect = Exception("timeout")
        mock_algod.pending_transaction_info.return_value = {
            "txn": {
                "txn": {
                    "type": "axfer",
                    "xaid": int(X402_ASSET),
                    "arcv": X402_AVM_ADDRESS,
                    "aamt": int(X402_PRICE)
                }
            }
        }
        mock_get_algod.return_value = mock_algod
        
        proof_payload = {
            "x402Version": 2,
            "paymentPayload": {
                "paymentGroup": ["MOCK_SIGNED_TX0_B64"],
                "paymentIndex": 0
            },
            "paymentRequirements": {
                "x402Version": 2,
                "scheme": "exact",
                "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                "amount": X402_PRICE,
                "maxAmountRequired": X402_PRICE,
                "payTo": X402_AVM_ADDRESS,
                "asset": X402_ASSET,
                "resource": "/api/test"
            }
        }
        proof_b64 = base64.b64encode(json.dumps(proof_payload).encode("utf-8")).decode("utf-8")
        
        from x402.resource_server import verify_payment_proof
        with patch("httpx.AsyncClient.post", side_effect=Exception("failed")):
            success, tx_id = await verify_payment_proof(proof_b64, "/api/test")
            
    assert success is True
    assert tx_id == expected_tx_id

def test_payment_status_endpoint():
    """
    Verifies that the /api/x402/status endpoint returns correct details.
    """
    response = client.get("/api/x402/status")
    assert response.status_code == 200
    data = response.json()
    assert data["x402Version"] == 2
    assert "treasuryAddress" in data




"""
Additional unit tests targeting low-coverage backend modules to reach 60%+ coverage.
"""
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient

from main import app
from blockchain import simulate_escrow, create_transaction
from services.alibaba_procurement_service import AlibabaProcurementService
from services.email_service import EmailService

client = TestClient(app)


# --- blockchain.py ---

def test_simulate_escrow_lock_and_release():
    lock = simulate_escrow("lock")
    assert lock["status"] == "locked"
    release = simulate_escrow("release")
    assert release["status"] == "released"
    invalid = simulate_escrow("invalid_action")
    assert invalid["status"] == "error"


@patch("blockchain.get_algod_client")
def test_create_transaction_success(mock_algod):
    mock_client = MagicMock()
    mock_client.suggested_params.return_value = {
        "fee": 1000,
        "first": 0,
        "last": 1000,
        "genesisID": "testnet-v1.0",
        "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
    }
    mock_algod.return_value = mock_client
    with patch("blockchain.encoding.msgpack_encode", return_value=b"mock_txn_bytes"):
        result = create_transaction(
            "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
            "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
            1.0,
        )
    assert "unsigned_txn" in result
    assert "message" in result


@patch("blockchain.get_algod_client")
def test_create_transaction_error(mock_algod):
    mock_algod.side_effect = Exception("node unreachable")
    result = create_transaction("SENDER", "RECEIVER", 1.0)
    assert "error" in result


# --- alibaba_procurement_service.py (direct method coverage) ---

def test_alibaba_detect_category_and_metadata():
    service = AlibabaProcurementService()
    assert service._detect_category("industrial pump valve") == "industrial"
    assert service._detect_category("cotton shirt apparel") == "apparel"
    assert service._detect_category("laptop electronics") == "electronics"
    assert service._detect_category("surgical mask medical") == "medical"
    assert service._detect_category("office supplies") == "general"
    meta = service._get_category_metadata("industrial")
    assert "regions" in meta
    assert service._get_category_metadata("unknown_cat")["risk_profile"] == "Medium"


def test_alibaba_fetch_without_api_key():
    service = AlibabaProcurementService()
    service.rapidapi_key = None
    items = service._fetch_alibaba_search("steel rods")
    assert items == []


@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_fetch_with_mock_api_response(mock_get):
    service = AlibabaProcurementService()
    service.rapidapi_key = "test-key"
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": {
            "result": {
                "item": [
                    {
                        "item": {"itemId": "123", "title": "Steel Rod", "image": "//img.example.com/x.jpg",
                                 "sku": {"def": {"priceModule": {"price": "10", "priceFormatted": "$10"},
                                                "quantityModule": {"minOrder": {"quantity": 100, "quantityFormatted": "100 pcs"}}}}},
                        "seller": {"storeAge": "5"},
                        "company": {"companyName": "Test Co", "companyAddress": {"country": "China"},
                                    "status": {"tradeAssurance": "1", "gold": True, "verified": True}},
                    }
                ]
            }
        }
    }
    mock_get.return_value = mock_resp
    items = service._fetch_alibaba_search("steel")
    assert len(items) == 1
    enriched = service._normalize_and_enrich(items[0], "industrial")
    assert enriched["id"] == "123"
    assert enriched["on_chain_verified"] is True
    assert service._get_language_for_region("Germany") == "German"
    assert service._get_language_for_region("Unknown") == "English"


def test_alibaba_run_intelligence_empty_results():
    """Exercise real run_intelligence logic via conftest-stored original method."""
    import conftest as ct
    service = AlibabaProcurementService()
    service.rapidapi_key = None
    original = getattr(ct, "_original_run_intelligence", None)
    if original is None:
        from services.alibaba_procurement_service import AlibabaProcurementService as APS
        original = APS.run_intelligence
    result = original(
        service,
        {"product_name": "obscure widget xyz", "quantity": 1, "shipping_region": "Antarctica"},
    )
    assert result["suppliers"] == []
    assert result["recommended_supplier"] is None


# --- escrow_service.py ---

@patch("escrow_service.get_algorand_client")
def test_escrow_service_deploy_error(mock_client):
    mock_client.side_effect = Exception("deploy failed")
    import escrow_service
    result = escrow_service.deploy_escrow("BUYER", "SUPPLIER", 100000)
    assert "error" in result


@patch("escrow_service.confirm_delivery_on_chain")
def test_escrow_service_confirm_delivery_error_path(mock_confirm):
    """Cover release-settlement on-chain error branch via mocked failure response."""
    mock_confirm.return_value = {"error": "on-chain failure"}
    from conftest import mock_escrows_list
    tx_id = "tx_onchain_error"
    mock_escrows_list.append({
        "transaction_id": tx_id,
        "app_id": 888,
        "sender_address": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver_address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "escrow_status": "verified",
        "verified": True,
        "supplier_id": "ALB-1001",
        "promised_delivery_days": 10,
        "timestamp": 1700000000.0,
        "delivery_proof": {"type": "timestamp", "value": "ok"},
    })
    r = client.post("/api/procurement/release-settlement", json={"transaction_id": tx_id})
    assert r.status_code == 200


# --- email_service.py (template + credential loading; SMTP mocked in conftest) ---

def test_email_service_template_and_credentials():
    service = EmailService()
    html = service.generate_html_template("Acme Ltd", "Need 500 units")
    assert "Acme Ltd" in html and "500 units" in html
    service._load_credentials()
    assert hasattr(service, "smtp_email")


# --- main.py additional endpoints ---

def test_dashboard_and_analytics_endpoints():
    r = client.get("/api/dashboard/analytics")
    assert r.status_code == 200
    r = client.get("/api/dashboard/insights")
    assert r.status_code == 200
    assert "insights" in r.json()
    r = client.get("/api/dashboard/procurement-feed")
    assert r.status_code == 200
    r = client.get("/api/dashboard/regions")
    assert r.status_code == 200
    r = client.get("/api/procurement/analytics")
    assert r.status_code == 200
    r = client.get("/api/settlements/analytics")
    assert r.status_code == 200
    r = client.get("/api/settlements/ledger")
    assert r.status_code == 200


def test_prepare_transaction_and_escrow_simulation():
    r = client.post(
        "/api/prepare-transaction",
        json={"sender": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
              "receiver": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
              "amount": 0.1},
    )
    assert r.status_code == 200
    r = client.get("/api/escrow/lock")
    assert r.status_code == 200
    assert r.json()["status"] == "locked"
    r = client.get("/api/escrow/release")
    assert r.json()["status"] == "released"


def test_human_select_supplier_and_agent_competition():
    r = client.post(
        "/api/procurement/select-supplier",
        json={"supplier_id": "ALB-1001", "session_id": "sess-001"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    r = client.post(
        "/api/agent-competition",
        json={"productName": "Steel", "quantity": 10, "budget": 5000.0},
    )
    assert r.status_code == 200


def test_update_supplier_reputation_via_release():
    from conftest import mock_escrows_list, mock_suppliers_list
    supplier = mock_suppliers_list[0].copy()
    supplier_id = supplier["id"]
    tx_id = "tx_reputation_test"
    mock_escrows_list.append({
        "transaction_id": tx_id,
        "app_id": 999,
        "sender_address": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver_address": supplier.get("address", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"),
        "escrow_status": "verified",
        "verified": True,
        "supplier_id": supplier_id,
        "promised_delivery_days": 30,
        "timestamp": 1700000000.0,
        "delivery_proof": {"submitted_at": "2026-01-01T00:00:00", "type": "timestamp", "value": "ok"},
    })
    r = client.post("/api/procurement/release-settlement", json={"transaction_id": tx_id})
    assert r.status_code == 200


def test_db_migrate_plaintext_passwords():
    from conftest import mock_users_list
    mock_users_list.append({"email": "legacy@example.com", "password": "plaintextpass"})
    from database.db import migrate_plaintext_passwords
    migrate_plaintext_passwords()
    user = next(u for u in mock_users_list if u["email"] == "legacy@example.com")
    assert user["password"].startswith("$2")


@pytest.mark.anyio
async def test_x402_premium_report_edge_cases():
    from x402.premium_report import generate_premium_report
    report = generate_premium_report("ALB-1001")
    assert report["supplier_id"] == "ALB-1001"
    report_unknown = generate_premium_report("NONEXISTENT-99999")
    assert "supplier_id" in report_unknown

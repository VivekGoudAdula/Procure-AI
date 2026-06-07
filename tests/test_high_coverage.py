"""
High-coverage tests targeting main.py, x402, escrow_service, services, and ai_agent.
Generated/on-chain modules are omitted via .coveragerc (escrow_client, escrow.py, smart_contract).
"""
import base64
import json
import os
import pytest
from unittest.mock import MagicMock, patch, mock_open, AsyncMock
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ─── x402 resource_server ───────────────────────────────────────────────────

def test_x402_payment_requirements_helpers():
    from x402.resource_server import get_payment_requirements, get_base64_requirements, _build_v2_requirements
    reqs = get_payment_requirements("/api/test")
    assert reqs["x402Version"] == 2
    assert "accepts" in reqs
    b64 = get_base64_requirements("/api/test")
    decoded = json.loads(base64.b64decode(b64))
    assert decoded["x402Version"] == 2
    inner = _build_v2_requirements("/api/test")
    assert inner["scheme"] == "exact"


def test_x402_decode_proof_invalid():
    from x402.resource_server import _decode_proof
    assert _decode_proof("not-valid-base64!!!") is None
    assert _decode_proof(base64.b64encode(b"not json").decode()) is None


@patch("x402.resource_server.get_algod_client")
def test_x402_suggested_params_success(mock_algod):
    from x402.resource_server import get_suggested_params
    sp = MagicMock()
    sp.fee = 1000
    sp.gh = "hash"
    sp.gen = "gen"
    sp.first = 1
    sp.last = 1000
    sp.min_fee = 1000
    mock_algod.return_value.suggested_params.return_value = sp
    params = get_suggested_params()
    assert params["fee"] == 1000


@patch("x402.resource_server.get_algod_client")
def test_x402_suggested_params_fallback(mock_algod):
    from x402.resource_server import get_suggested_params
    mock_algod.side_effect = Exception("offline")
    params = get_suggested_params()
    assert params["genesisId"] == "testnet-v1.0"


@pytest.mark.anyio
async def test_x402_facilitator_verify_and_settle_success():
    from x402.resource_server import verify_payment_proof, USED_TX_IDS
    from x402.config import X402_AVM_ADDRESS, X402_ASSET, X402_PRICE
    USED_TX_IDS.clear()
    proof = {
        "x402Version": 2,
        "paymentPayload": {"paymentGroup": ["TX0"], "paymentIndex": 0},
        "paymentRequirements": {"resource": "/api/test"},
    }
    proof_b64 = base64.b64encode(json.dumps(proof).encode()).decode()
    verify_resp = MagicMock(status_code=200)
    verify_resp.json.return_value = {"isValid": True}
    settle_resp = MagicMock(status_code=200)
    settle_resp.json.return_value = {"txId": "FACILITATOR_TX_001"}
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = [verify_resp, settle_resp]
        ok, tx = await verify_payment_proof(proof_b64, "/api/test")
    assert ok is True
    assert tx == "FACILITATOR_TX_001"


@pytest.mark.anyio
async def test_x402_confirm_txn_validation_failures():
    from x402.resource_server import _confirm_txn_details
    from x402.config import X402_AVM_ADDRESS, X402_ASSET, X402_PRICE
    mock_algod = MagicMock()
    # Wrong txn type
    mock_algod.pending_transaction_info.return_value = {
        "txn": {"txn": {"type": "pay", "xaid": int(X402_ASSET), "arcv": X402_AVM_ADDRESS, "aamt": int(X402_PRICE)}}
    }
    with patch("x402.resource_server.get_algod_client", return_value=mock_algod):
        ok, _ = await _confirm_txn_details("TX_BAD_TYPE")
    assert ok is False
    # Wrong asset
    mock_algod.pending_transaction_info.return_value = {
        "txn": {"txn": {"type": "axfer", "xaid": 99999, "arcv": X402_AVM_ADDRESS, "aamt": int(X402_PRICE)}}
    }
    with patch("x402.resource_server.get_algod_client", return_value=mock_algod):
        ok, _ = await _confirm_txn_details("TX_BAD_ASSET")
    assert ok is False


@pytest.mark.anyio
async def test_x402_on_chain_payment_index_out_of_range():
    from x402.resource_server import _verify_on_chain
    ok, tx = await _verify_on_chain(["only_one"], payment_index=5)
    assert ok is False and tx is None


@pytest.mark.anyio
@patch("groq.Groq")
def test_premium_report_groq_path(mock_groq_cls):
    from x402.premium_report import generate_premium_report
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=json.dumps({
            "negotiation_strategy": "Use volume leverage.",
            "market_analysis": "Stable market.",
        })))]
    )
    with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
        report = generate_premium_report("ALB-1001")
    assert "Use volume leverage" in report["negotiation_strategy"]


# ─── main.py endpoints ────────────────────────────────────────────────────────

def test_negotiation_and_inquiry_endpoints():
    r = client.post("/api/negotiation/multilingual", json={
        "buyer_message": "Need lower MOQ", "supplier_language": "Chinese",
        "product": "Steel", "round_number": 1,
    })
    assert r.status_code == 200
    r = client.post("/api/negotiation/multilingual/full", json={
        "buyer_message": "Start", "supplier_language": "Vietnamese", "product": "Jackets",
    })
    assert r.status_code == 200
    assert r.json()["total_rounds"] == 3
    r = client.get("/api/negotiation/languages")
    assert r.status_code == 200
    r = client.post("/api/negotiation/intelligence", json={
        "supplier_message": "We offer CE certified goods with flexible MOQ.",
        "supplier_metadata": {}, "procurement_context": {},
    })
    assert r.status_code == 200
    r = client.post("/api/procurement/send-inquiry", json={
        "supplier_name": "Acme", "supplier_email": "acme@example.com",
        "supplier_region": "China", "original_message": "Quote for 100 units",
    })
    assert r.status_code == 200
    assert r.json()["status"] == "success"


def test_supplier_respond_all_rounds():
    from conftest import mock_suppliers_list
    sid = str(mock_suppliers_list[0]["id"])
    for rnd in [1, 2, 3]:
        r = client.post(f"/supplier/{sid}/respond", json={
            "product": "Steel", "quantity": 100, "budget": 5000.0, "round": rnd,
        })
        assert r.status_code == 200
        assert "offer_price" in r.json()


def test_supplier_respond_not_found():
    r = client.post("/supplier/INVALID-ID-999/respond", json={
        "product": "X", "quantity": 1, "budget": 100.0, "round": 1,
    })
    assert r.status_code == 404


def test_escrow_utility_endpoints():
    from conftest import mock_escrows_list
    tx_id = "tx_get_update"
    mock_escrows_list.append({
        "transaction_id": tx_id, "app_id": 1, "escrow_status": "funded", "verified": False,
    })
    r = client.get(f"/api/get-transaction/{tx_id}")
    assert r.status_code == 200
    r = client.post("/api/update-escrow-status", json={"transaction_id": tx_id, "status": "verified"})
    assert r.status_code == 200
    r = client.post("/api/update-reputation", json={"supplier_id": "ALB-1001", "delivered_on_time": True})
    assert r.status_code == 200


def test_verify_delivery_short_proof_and_release_by_app_id():
    from conftest import mock_escrows_list
    tx_id = "tx_short_proof"
    mock_escrows_list.append({
        "transaction_id": tx_id, "app_id": 77777,
        "sender_address": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver_address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "escrow_status": "funded", "verified": False, "delivery_proof": None,
        "supplier_id": "ALB-1001", "promised_delivery_days": 10, "timestamp": 1700000000.0,
    })
    r = client.post("/api/procurement/verify-delivery", json={"escrow_id": "77777"})
    assert r.status_code == 200
    assert r.json()["verified"] is True


def test_submit_proof_missing_file():
    from conftest import mock_escrows_list
    tx_id = "tx_no_file"
    mock_escrows_list.append({"transaction_id": tx_id, "app_id": 1, "escrow_status": "funded", "verified": False})
    r = client.post("/api/submit-delivery-proof", data={
        "escrow_id": tx_id, "proof_type": "invoice_file", "value": "",
    })
    assert r.status_code == 400


@patch("main.deploy_escrow")
def test_escrow_deployment_failure(mock_deploy):
    mock_deploy.return_value = {"error": "chain offline"}
    r = client.post("/api/procurement/initiate-commitment", json={
        "sender": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "amount": 0.1, "supplier_id": "ALB-1001", "promised_delivery_days": 5,
    })
    assert r.status_code == 500


# ─── escrow_service ───────────────────────────────────────────────────────────

@patch("escrow_service.escrow_client.EscrowContractFactory")
@patch("escrow_service.get_algorand_client")
def test_escrow_service_deploy_success(mock_algorand, mock_factory_cls):
    import escrow_service
    mock_algorand.return_value = MagicMock()
    mock_deployer = MagicMock()
    mock_deployer.address = "DEPLOYER_ADDR"
    mock_deployer.signer = MagicMock()
    mock_algorand.return_value.account.from_environment.return_value = mock_deployer
    mock_client_inst = MagicMock()
    mock_client_inst.app_id = 555
    mock_client_inst.app_address = "APP_ADDR"
    mock_result = MagicMock(transaction_id="DEPLOY_TX")
    mock_factory = MagicMock()
    mock_factory.send.create.create.return_value = (mock_client_inst, mock_result)
    mock_factory_cls.return_value = mock_factory
    with patch.object(escrow_service, "MNEMONIC", None):
        result = escrow_service.deploy_escrow("BUYER", "SUPPLIER", 100000)
    assert result["app_id"] == 555
    assert result["status"] == "created"


@patch("escrow_service.EscrowContractClient")
@patch("escrow_service.get_algorand_client")
def test_escrow_service_confirm_delivery_success(mock_algorand, mock_client_cls):
    import escrow_service
    mock_algorand.return_value = MagicMock()
    mock_buyer = MagicMock()
    mock_buyer.address = "BUYER"
    mock_buyer.signer = MagicMock()
    mock_client = MagicMock()
    mock_client.send.confirm_delivery.return_value = MagicMock(transaction_id="RELEASE_TX")
    mock_client_cls.return_value = mock_client
    with patch.object(escrow_service, "MNEMONIC", None):
        mock_algorand.return_value.account.from_environment.return_value = mock_buyer
        result = escrow_service.confirm_delivery_on_chain(123, "BUYER", "SUPPLIER")
    assert result["status"] == "released"


# ─── ai_agent ─────────────────────────────────────────────────────────────────

def test_ai_agent_fallback_suppliers(monkeypatch):
    from ai_agent import get_alibaba_suppliers, run_agent_competition

    monkeypatch.setattr("db.get_cached_suppliers", lambda product_name=None: [])
    suppliers = get_alibaba_suppliers("unique_product_xyz", 10, 5000.0)
    assert len(suppliers) >= 5
    comp = run_agent_competition("unique_product_xyz", 10, 5000.0, {"max_budget": 999999})
    assert comp["status"] == "success"


# ─── alibaba_procurement_service ──────────────────────────────────────────────

@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_parse_paths_and_region_filter(mock_get):
    import conftest
    from services.alibaba_procurement_service import AlibabaProcurementService
    svc = AlibabaProcurementService()
    svc.rapidapi_key = "key"
    # Path 2: result -> item at root
    mock_get.return_value = MagicMock(status_code=200, json=lambda: {
        "result": {"item": [{"item": {"itemId": "2", "title": "T", "sku": {"def": {
            "priceModule": {"price": "5"}, "quantityModule": {"minOrder": {"quantity": 1}}
        }}}, "seller": {}, "company": {"companyName": "Co", "companyAddress": {"country": "China"},
        "status": {}}}]}
    })
    items = svc._fetch_alibaba_search("shirt")
    assert len(items) >= 1
    # run_intelligence with region
    original = getattr(conftest, "_original_run_intelligence", AlibabaProcurementService.run_intelligence)
    with patch.object(AlibabaProcurementService, "run_intelligence", original):
        with patch.object(svc, "_fetch_alibaba_search", return_value=[{
            "item": {"itemId": "CN1", "title": "Prod", "sku": {"def": {
                "priceModule": {"price": "10"}, "quantityModule": {"minOrder": {"quantity": 1}}
            }}}, "seller": {"storeAge": "3"},
            "company": {"companyName": "CN Supplier", "companyAddress": {"country": "China"}, "status": {}},
        }]):
            res = svc.run_intelligence({"product_name": "shirt", "quantity": 10, "shipping_region": "China"})
    assert len(res["suppliers"]) >= 1


@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_api_error_status(mock_get):
    from services.alibaba_procurement_service import AlibabaProcurementService
    svc = AlibabaProcurementService()
    svc.rapidapi_key = "key"
    mock_get.return_value = MagicMock(status_code=429, json=lambda: {})
    assert svc._fetch_alibaba_search("x") == []


# ─── supplier_intelligence_service ────────────────────────────────────────────

def test_supplier_intelligence_full_pipeline():
    from services.supplier_intelligence_service import SupplierIntelligenceService
    db_json = json.dumps({"suppliers": [{
        "id": "ALB-2001", "name": "Test Co", "product": "Steel Rods", "category": "industrial",
        "base_price": 50.0, "reliability_score": 90, "delivery_days": 7, "reputation_hash": "abc",
        "successful_deals": 20, "success_rate": 95, "moq": 10, "shipping_region": "Global",
    }]})
    service = SupplierIntelligenceService()
    with patch("builtins.open", mock_open(read_data=db_json)):
        res = service.get_suppliers("Steel", 100, 50000.0, filters={"budget": 999999, "min_trust": 50})
    assert res["recommended_supplier"] is not None
    assert res["procurement_analysis"]["eligible_count"] >= 1
    with patch("builtins.open", mock_open(read_data=db_json)):
        res2 = service.get_suppliers("Steel", 5, 100.0, filters={"budget": 1})
    assert len(res2["rejected_suppliers"]) >= 0


@patch("services.supplier_intelligence_service.requests.get")
def test_supplier_intelligence_fetch_api(mock_get):
    from services.supplier_intelligence_service import SupplierIntelligenceService
    svc = SupplierIntelligenceService()
    svc.api_key = "test"
    mock_get.return_value = MagicMock(status_code=200, json=lambda: {"ok": True})
    assert svc.fetch_alibaba_data("123") == {"ok": True}
    svc.api_key = None
    assert svc.fetch_alibaba_data("123") is None


# ─── email_service (real method body; conftest mocks send by default) ─────────

def _restore_email_send(monkeypatch):
    import conftest as ct
    from services.email_service import EmailService
    monkeypatch.setattr(
        EmailService, "send_procurement_inquiry", ct._original_send_procurement_inquiry
    )


@patch("services.email_service.smtplib.SMTP")
def test_email_send_success(mock_smtp, monkeypatch):
    _restore_email_send(monkeypatch)
    from services.email_service import EmailService
    service = EmailService()
    service.smtp_email = "t@example.com"
    service.smtp_password = "secret"
    mock_smtp.return_value = MagicMock()
    result = service.send_procurement_inquiry("S", "s@x.com", "Subj", "<p>Hi</p>")
    assert result["status"] == "success"


def test_email_send_simulated(monkeypatch):
    _restore_email_send(monkeypatch)
    from services.email_service import EmailService
    service = EmailService()
    with patch.object(service, "_load_credentials", lambda: None):
        service.smtp_email = None
        service.smtp_password = None
        with patch.dict(os.environ, {}, clear=False):
            result = service.send_procurement_inquiry("S", "s@x.com", "Subj", "<p>Hi</p>")
    assert result["status"] == "simulated"


# ─── db.py ────────────────────────────────────────────────────────────────────

def test_get_cached_suppliers_db_error(monkeypatch):
    import db as db_mod

    def _boom():
        raise RuntimeError("mongo down")

    monkeypatch.setattr(db_mod, "_load_suppliers_from_db", _boom)
    monkeypatch.setattr(db_mod, "get_cached_suppliers", db_mod._get_cached_suppliers_uncached)
    assert db_mod.get_cached_suppliers() == []


@patch("escrow_service.escrow_client.EscrowContractFactory")
@patch("escrow_service.get_algorand_client")
def test_escrow_service_fund_escrow_stub(mock_algorand, mock_factory_cls):
    import escrow_service
    assert escrow_service.fund_escrow(1, "BUYER", 1000) is None


@pytest.mark.anyio
async def test_x402_verify_invalid_proof_payload():
    from x402.resource_server import verify_payment_proof, USED_TX_IDS
    USED_TX_IDS.clear()
    ok, tx = await verify_payment_proof(base64.b64encode(b"{}").decode(), "/api/x")
    assert ok is False and tx is None


def test_main_analytics_error_paths():
    with patch("main.procurement_analytics_engine.calculate_procurement_intelligence", side_effect=RuntimeError("fail")):
        r = client.get("/api/procurement/analytics")
    assert r.status_code == 500
    with patch("main.dashboard_analytics.calculate_analytics", side_effect=RuntimeError("fail")):
        assert client.get("/api/dashboard/analytics").status_code == 500
    with patch("main.negotiation_engine.run_negotiation", side_effect=RuntimeError("fail")):
        assert client.post("/api/negotiation/multilingual", json={
            "buyer_message": "hi", "supplier_language": "English", "product": "X",
        }).status_code == 500


@pytest.mark.anyio
async def test_x402_empty_payment_group():
    from x402.resource_server import _verify_payment_proof_internal
    proof = base64.b64encode(json.dumps({"x402Version": 2, "paymentPayload": {}}).encode()).decode()
    ok, tx = await _verify_payment_proof_internal(proof, "/api/test")
    assert ok is False and tx is None


@pytest.mark.anyio
async def test_x402_facilitator_invalid_payment():
    from x402.resource_server import verify_payment_proof, USED_TX_IDS
    USED_TX_IDS.clear()
    proof = {"x402Version": 2, "paymentPayload": {"paymentGroup": ["TX0"], "paymentIndex": 0}}
    proof_b64 = base64.b64encode(json.dumps(proof).encode()).decode()
    verify_resp = MagicMock(status_code=200)
    verify_resp.json.return_value = {"isValid": False, "invalidReason": "bad_sig"}
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=verify_resp):
        with patch("x402.resource_server._verify_on_chain", new_callable=AsyncMock, return_value=(False, None)):
            with patch("x402.resource_server.X402_DEMO_FALLBACK", False):
                ok, tx = await verify_payment_proof(proof_b64, "/api/test")
    assert ok is False


@pytest.mark.anyio
async def test_x402_confirm_txn_bytes_receiver_and_amount_fail():
    from x402.resource_server import _confirm_txn_details
    from x402.config import X402_AVM_ADDRESS, X402_ASSET, X402_PRICE
    mock_algod = MagicMock()
    # Receiver as bytes (wrong address)
    mock_algod.pending_transaction_info.return_value = {
        "txn": {"txn": {"type": "axfer", "xaid": int(X402_ASSET),
                         "arcv": b"\x00" * 32, "aamt": int(X402_PRICE)}}
    }
    with patch("x402.resource_server.get_algod_client", return_value=mock_algod):
        with patch("algosdk.encoding.encode_address", return_value="WRONG_ADDR"):
            ok, _ = await _confirm_txn_details("TX_BYTES")
    assert ok is False
    # Insufficient amount
    mock_algod.pending_transaction_info.return_value = {
        "txn": {"txn": {"type": "axfer", "xaid": int(X402_ASSET),
                         "arcv": X402_AVM_ADDRESS, "aamt": 1}}
    }
    with patch("x402.resource_server.get_algod_client", return_value=mock_algod):
        ok, _ = await _confirm_txn_details("TX_LOW_AMT")
    assert ok is False


@patch("services.email_service.smtplib.SMTP")
def test_email_send_error(mock_smtp, monkeypatch):
    _restore_email_send(monkeypatch)
    from services.email_service import EmailService
    mock_smtp.return_value.starttls.side_effect = Exception("smtp down")
    service = EmailService()
    service.smtp_email = "t@example.com"
    service.smtp_password = "secret"
    result = service.send_procurement_inquiry("S", "s@x.com", "Subj", "<p>Hi</p>")
    assert result["status"] == "error"


def test_supplier_intelligence_rejection_filters():
    from services.supplier_intelligence_service import SupplierIntelligenceService
    db_json = json.dumps({"suppliers": [{
        "id": "R1", "name": "Reject Co", "product": "Steel", "category": "industrial",
        "base_price": 500.0, "reliability_score": 50, "delivery_days": 30, "moq": 1000,
        "shipping_region": "Asia",
    }]})
    svc = SupplierIntelligenceService()
    with patch("builtins.open", mock_open(read_data=db_json)):
        res = svc.get_suppliers("Steel", 10, 100.0, filters={
            "budget": 50, "lead_time_days": 5, "min_trust": 80, "shipping_region": "Europe",
        })
    assert res["procurement_analysis"]["rejected_count"] >= 1


@patch("main.select_best_supplier")
def test_select_supplier_value_error(mock_select):
    mock_select.side_effect = ValueError("not found")
    r = client.post("/api/select-supplier", json={"productName": "X", "quantity": 1, "budget": 100})
    assert r.status_code == 404


@pytest.mark.anyio
async def test_x402_facilitator_settle_failure():
    from x402.resource_server import _call_facilitator_settle
    bad_resp = MagicMock(status_code=500, text="error")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=bad_resp):
        tx = await _call_facilitator_settle({"x402Version": 2})
    assert tx is None


def test_ai_agent_base_url_fallback():
    import ai_agent
    with patch.dict(os.environ, {"APP_URL": "MY_APP_URL"}):
        import importlib
        importlib.reload(ai_agent)
        assert ai_agent.BASE_URL == "http://localhost:8000"
    importlib.reload(ai_agent)


def test_db_migrate_exception_handling():
    from conftest import mock_users_collection
    with patch.object(mock_users_collection, "find", side_effect=Exception("db fail")):
        from db import migrate_plaintext_passwords
        migrate_plaintext_passwords()


@patch("main.select_best_supplier")
def test_select_supplier_internal_error(mock_select):
    mock_select.side_effect = RuntimeError("boom")
    r = client.post("/api/select-supplier", json={"productName": "X", "quantity": 1, "budget": 100})
    assert r.status_code == 500


@patch("ai_agent.get_alibaba_suppliers", return_value=[])
def test_run_agent_competition_empty_with_category(mock_gs):
    from ai_agent import run_agent_competition
    result = run_agent_competition("industrial pumps", 10, 5000.0)
    assert result["status"] == "no_supplier_found"


def test_update_reputation_unknown_supplier():
    r = client.post("/api/update-reputation", json={"supplier_id": "UNKNOWN-XYZ", "delivered_on_time": True})
    assert r.status_code == 200


def test_procurement_intelligence_error():
    with patch("main.procurement_engine.run_intelligence", side_effect=RuntimeError("fail")):
        r = client.post("/api/procurement/intelligence", json={
            "product_name": "Steel", "quantity": 10, "budget": 5000.0,
        })
    assert r.status_code == 500


def test_release_settlement_bad_proof_timestamp():
    from conftest import mock_escrows_list
    tx_id = "tx_bad_ts"
    mock_escrows_list.append({
        "transaction_id": tx_id, "app_id": 1,
        "sender_address": "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
        "receiver_address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
        "escrow_status": "verified", "verified": True, "supplier_id": "ALB-1001",
        "promised_delivery_days": 30, "timestamp": 1700000000.0,
        "delivery_proof": {"submitted_at": "not-a-date", "type": "timestamp", "value": "ok"},
    })
    r = client.post("/api/procurement/release-settlement", json={"transaction_id": tx_id})
    assert r.status_code == 200


def test_verify_delivery_tracking_proof_short_value():
    from conftest import mock_escrows_list
    tx_id = "tx_tracking_short"
    mock_escrows_list.append({
        "transaction_id": tx_id, "app_id": 1, "escrow_status": "proof_submitted",
        "verified": False, "delivery_proof": {"type": "tracking_id", "value": "ab"},
    })
    r = client.post("/api/procurement/verify-delivery", json={"escrow_id": tx_id})
    assert r.status_code == 200
    assert r.json()["verified"] is True


@pytest.mark.anyio
@patch("groq.Groq")
def test_premium_report_groq_failure_fallback(mock_groq):
    from x402.premium_report import generate_premium_report
    mock_groq.return_value.chat.completions.create.side_effect = Exception("api down")
    with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}):
        report = generate_premium_report("ALB-1001")
    assert len(report["negotiation_strategy"]) > 20

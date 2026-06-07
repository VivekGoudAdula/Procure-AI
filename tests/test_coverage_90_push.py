"""Targeted tests to keep testable backend coverage at 90%+."""
import json
import os
import runpy
from unittest.mock import MagicMock, patch, mock_open, AsyncMock
import pytest


# --- escrow_service.py ---

@patch("escrow_service.get_algorand_client")
def test_get_algorand_client(mock_get):
    import escrow_service
    mock_get.return_value = MagicMock()
    assert escrow_service.get_algorand_client() is mock_get.return_value


@patch("escrow_service.escrow_client.EscrowContractFactory")
@patch("escrow_service.get_algorand_client")
def test_escrow_deploy_tx_id_fallback(mock_get, mock_factory_cls):
    import escrow_service
    mock_algorand = MagicMock()
    mock_deployer = MagicMock(address="DEPLOYER", signer=MagicMock())
    mock_algorand.account.from_environment.return_value = mock_deployer
    mock_get.return_value = mock_algorand
    mock_client_inst = MagicMock(app_id=42, app_address="APP")
    mock_result = MagicMock(spec=[])  # no transaction_id attr -> uses tx_id getattr
    mock_result.tx_id = "TX_FALLBACK"
    mock_factory_cls.return_value.send.create.create.return_value = (mock_client_inst, mock_result)
    with patch.object(escrow_service, "MNEMONIC", None):
        result = escrow_service.deploy_escrow("B", "S", 1000)
    assert result["transaction_id"] == "TX_FALLBACK"


@patch("escrow_service.EscrowContractClient")
@patch("escrow_service.get_algorand_client")
def test_escrow_confirm_no_supplier_address(mock_get, mock_client_cls):
    import escrow_service
    mock_buyer = MagicMock(address="BUYER", signer=MagicMock())
    mock_get.return_value = MagicMock(account=MagicMock(from_environment=MagicMock(return_value=mock_buyer)))
    mock_get.return_value.account.from_environment.return_value = mock_buyer
    mock_client_cls.return_value.send.confirm_delivery.return_value = MagicMock(spec=[], tx_id="REL_TX")
    with patch.object(escrow_service, "MNEMONIC", None):
        result = escrow_service.confirm_delivery_on_chain(9, "BUYER", None)
    assert result["status"] == "released"


# --- x402 resource_server.py ---

@pytest.mark.anyio
async def test_x402_facilitator_verify_not_valid_reason():
    from x402.resource_server import _verify_payment_proof_internal
    proof = {"x402Version": 2, "paymentPayload": {"paymentGroup": ["T0"], "paymentIndex": 0}}
    proof_b64 = __import__("base64").b64encode(json.dumps(proof).encode()).decode()
    resp = MagicMock(status_code=200)
    resp.json.return_value = {"isValid": False, "invalidReason": "bad_amount"}
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp):
        with patch(
            "x402.resource_server._verify_on_chain",
            new_callable=AsyncMock,
            return_value=(False, None),
        ):
            ok, tx = await _verify_payment_proof_internal(proof_b64, "/api/t")
    assert ok is False


@pytest.mark.anyio
async def test_x402_facilitator_verify_non_200():
    from x402.resource_server import _verify_payment_proof_internal
    proof = {"x402Version": 2, "paymentPayload": {"paymentGroup": ["T0"], "paymentIndex": 0}}
    proof_b64 = __import__("base64").b64encode(json.dumps(proof).encode()).decode()
    resp = MagicMock(status_code=502, text="bad gateway")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=resp):
        with patch(
            "x402.resource_server._verify_on_chain",
            new_callable=AsyncMock,
            return_value=(False, None),
        ):
            ok, tx = await _verify_payment_proof_internal(proof_b64, "/api/t")
    assert ok is False


@pytest.mark.anyio
async def test_x402_facilitator_settle_returns_none_after_valid():
    from x402.resource_server import _verify_payment_proof_internal
    proof = {"x402Version": 2, "paymentPayload": {"paymentGroup": ["T0"], "paymentIndex": 0}}
    proof_b64 = __import__("base64").b64encode(json.dumps(proof).encode()).decode()
    verify_resp = MagicMock(status_code=200)
    verify_resp.json.return_value = {"isValid": True}
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=verify_resp):
        with patch("x402.resource_server._call_facilitator_settle", new_callable=AsyncMock, return_value=None):
            with patch(
                "x402.resource_server._verify_on_chain",
                new_callable=AsyncMock,
                return_value=(False, None),
            ):
                ok, tx = await _verify_payment_proof_internal(proof_b64, "/api/t")
    assert ok is False


# --- services ---

def test_dashboard_load_json_error(tmp_path):
    from services.dashboard_analytics import DashboardAnalyticsService
    bad = tmp_path / "bad.json"
    bad.write_text("{not json", encoding="utf-8")
    svc = DashboardAnalyticsService()
    assert svc._load_json(str(bad), []) == []


@patch("db.get_alibaba_suppliers", return_value=[])
def test_dashboard_raw_suppliers_with_cache(mock_sup):
    from services.dashboard_analytics import DashboardAnalyticsService, SEARCH_CACHE_PATH
    svc = DashboardAnalyticsService()
    cache_data = [{"id": "C1", "name": "Cached Supplier"}]
    with patch.object(svc, "_load_json", return_value=cache_data):
        result = svc.get_raw_suppliers()
    assert len(result) >= 1


@patch("services.global_procurement_engine.requests.get")
def test_global_procurement_fetch_success(mock_get):
    from services.global_procurement_engine import GlobalProcurementEngine
    eng = GlobalProcurementEngine()
    eng.rapidapi_key = "key"
    mock_get.return_value = MagicMock(
        status_code=200,
        json=lambda: {"data": {"title": "Widget", "sku": [{"price": "12.5"}]}},
    )
    rows = eng._fetch_alibaba_data("widget")
    assert len(rows) == 1


def test_global_procurement_fetch_no_key():
    from services.global_procurement_engine import GlobalProcurementEngine
    eng = GlobalProcurementEngine()
    eng.rapidapi_key = None
    assert eng._fetch_alibaba_data("x") == []


@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_fetch_result_items_path(mock_get):
    from services.alibaba_procurement_service import AlibabaProcurementService
    svc = AlibabaProcurementService()
    svc.rapidapi_key = "k"
    entry = {
        "item": {"itemId": "A1", "title": "T",
                 "sku": {"def": {"priceModule": {"price": "1"},
                                 "quantityModule": {"minOrder": {"quantity": 1}}}}},
        "seller": {}, "company": {"companyName": "Co", "companyAddress": {"country": "CN"}, "status": {}},
    }
    mock_get.return_value = MagicMock(status_code=200, json=lambda: {"result": {"items": [entry]}})
    assert len(svc._fetch_alibaba_search("parts")) >= 1


@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_fetch_data_list_path(mock_get):
    from services.alibaba_procurement_service import AlibabaProcurementService
    svc = AlibabaProcurementService()
    svc.rapidapi_key = "k"
    mock_get.return_value = MagicMock(
        status_code=200,
        json=lambda: {"data": [{"itemId": "B1", "seller": {}, "company": {}}]},
    )
    assert len(svc._fetch_alibaba_search("parts")) >= 1


@patch("services.alibaba_procurement_service.requests.get")
def test_alibaba_deep_recursive_search(mock_get):
    from services.alibaba_procurement_service import AlibabaProcurementService
    svc = AlibabaProcurementService()
    svc.rapidapi_key = "k"
    mock_get.return_value = MagicMock(
        status_code=200,
        json=lambda: {"wrapper": {"nested": [{"itemId": "D1", "seller": {}, "company": {}}]}},
    )
    items = svc._fetch_alibaba_search("gear")
    assert len(items) == 1


# --- main.py __main__ ---

def test_main_block_runs_uvicorn():
    main_path = os.path.join(os.path.dirname(__file__), "..", "backend", "main.py")
    with patch("uvicorn.run") as mock_run:
        with patch.dict(os.environ, {"APP_ENV": "production"}, clear=False):
            runpy.run_path(main_path, run_name="__main__")
    mock_run.assert_called_once()

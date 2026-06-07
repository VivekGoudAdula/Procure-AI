import pytest
import os
from unittest.mock import MagicMock, patch

from services.translation_service import TranslationService
from services.dashboard_analytics import DashboardAnalyticsService
from services.settlement_analytics import SettlementAnalyticsService
from services.procurement_analytics_engine import ProcurementAnalyticsEngine
from services.procurement_insights import ProcurementInsightsService
from services.negotiation_intelligence import NegotiationIntelligenceEngine
from services.multilingual_negotiation_service import MultilingualNegotiationService
from services.global_procurement_engine import GlobalProcurementEngine
from services.email_service import EmailService
from services.supplier_intelligence_service import SupplierIntelligenceService

def test_translation_service():
    service = TranslationService()
    
    # Test translate_message
    res1 = service.translate_message("Hello", "Chinese")
    assert "[TRANSLATED]: Hello" in res1
    
    res_fallback = service.translate_message("Hello", "UnknownLanguage")
    assert res_fallback == "Hello"
    
    # Test detect_language
    assert service.detect_language("China") == "Chinese"
    assert service.detect_language("Germany") == "German"
    assert service.detect_language("Unknown") == "English"
    
    # Test simulate_supplier_reply
    reply = service.simulate_supplier_reply("Chinese")
    assert "native_reply" in reply
    assert "translated_reply" in reply
    assert "analysis" in reply

def test_dashboard_analytics_service():
    service = DashboardAnalyticsService()
    # Populate mock escrows to test math calculations
    from conftest import mock_escrows_list
    mock_escrows_list.append({
        "transaction_id": "tx_dash_1",
        "amount": 100.0,
        "escrow_status": "released",
        "verified": True,
        "promised_delivery_days": 10,
        "timestamp": 1700000000
    })
    
    res = service.calculate_analytics()
    assert "avg_delivery_time" in res
    assert "avg_pricing" in res

def test_settlement_analytics_service():
    service = SettlementAnalyticsService()
    # Populate mock escrows
    from conftest import mock_escrows_list
    mock_escrows_list.append({
        "transaction_id": "tx_settle_1",
        "amount": 250.0,
        "escrow_status": "released",
        "verified": True,
        "timestamp": 1700000000,
        "supplier_id": "ALB-1001"
    })
    
    telemetry = service.calculate_settlements_telemetry()
    assert "active_escrow_count" in telemetry
    assert "avg_negotiation_savings" in telemetry
    
    ledger = service.compile_settlement_ledger()
    assert len(ledger) > 0

def test_procurement_analytics_engine():
    engine = ProcurementAnalyticsEngine()
    from conftest import mock_suppliers_list
    mock_suppliers_list.append({
        "id": "ALB-1001",
        "name": "Test Supplier",
        "category": "industrial",
        "reliability": 0.9,
        "base_price": 100.0
    })
    
    res = engine.calculate_procurement_intelligence()
    assert "ai_procurement_insights" in res

def test_procurement_insights_service():
    service = ProcurementInsightsService()
    res = service.generate_insights()
    assert "insights" in res
    assert "signals" in res
    assert "procurement_feed" in res

def test_negotiation_intelligence_engine():
    engine = NegotiationIntelligenceEngine()
    
    # Test message with flexible MOQ
    msg_flexible = "We are willing to reduce MOQ by 20% for your initial trial batch."
    intel = engine.extract_negotiation_intelligence(msg_flexible)
    assert intel["moq_flexibility"]["status"] == "HIGH"
    
    # Test message with rigid MOQ and delivery warning
    msg_rigid = "Our minimum is fixed. We might have some backlog and delay issues next month."
    intel2 = engine.extract_negotiation_intelligence(msg_rigid)
    assert intel2["moq_flexibility"]["status"] == "LOW"
    assert intel2["delivery_confidence"]["status"] == "WEAK"
    
    # Test message with high trust certs (using 2 different factors: CE mark and real-time tracking)
    msg_trust = "We support real-time tracking of shipment and have CE mark audit license."
    intel3 = engine.extract_negotiation_intelligence(msg_trust)
    assert intel3["trust_signals"]["status"] == "VERIFIED"

def test_multilingual_negotiation_service():
    service = MultilingualNegotiationService()
    
    # Test run_negotiation
    res = service.run_negotiation("We request lower MOQ.", "Chinese", "Steel Rods", round_number=1)
    assert res["target_language"] == "Chinese"
    assert res["negotiation_round"] == 1
    
    # Test run_full_negotiation
    res_full = service.run_full_negotiation("Start talks", "Vietnamese", "Jackets")
    assert res_full["target_language"] == "Vietnamese"
    assert res_full["total_rounds"] == 3
    
    # Test get_supported_languages
    langs = service.get_supported_languages()
    assert len(langs) > 0

def test_global_procurement_engine():
    engine = GlobalProcurementEngine()
    req = {
        "product_name": "Steel Rods",
        "quantity": 10,
        "budget": 5000.0,
        "shipping_region": "China"
    }
    res = engine.run_procurement_intelligence(req)
    assert "suppliers" in res
    assert "recommended_suppliers" in res

def test_email_service():
    service = EmailService()
    # Test template generator
    html = service.generate_html_template("Supplier A", "Hello body")
    assert "Supplier A" in html
    assert "Hello body" in html

def test_supplier_intelligence_service():
    service = SupplierIntelligenceService()
    mock_json = '{"suppliers": [{"id": "ALB-1001", "name": "Supplier A", "reliability": 0.85, "base_price": 10.0, "success_rate": 90, "delivery_days": 5, "rating": 4.5, "country": "China"}]}'
    from unittest.mock import mock_open
    with patch("builtins.open", mock_open(read_data=mock_json)):
        res = service.get_suppliers("Steel Rods", 10, 5000.0)
    assert "suppliers" in res
    assert "procurement_analysis" in res


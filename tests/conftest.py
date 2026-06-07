import sys
import os

# Set testing mode before importing backend components to disable slowapi rate limits
os.environ["TESTING"] = "True"
os.environ.setdefault("JWT_SECRET_KEY", "test_jwt_secret_key_1234567890")

import copy
from unittest.mock import MagicMock
import pytest

# Add backend directory to sys.path to enable imports of main and services
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# main import moved to the bottom of the file to allow mock registrations first

# In-memory storage for collections
mock_users_list = []
mock_escrows_list = []
mock_suppliers_list = []

class MockCollection:
    def __init__(self, data_list):
        self.data_list = data_list

    def find(self, query=None, projection=None):
        return [copy.deepcopy(x) for x in self.data_list]

    def delete_many(self, query):
        self.data_list.clear()
        return MagicMock()

    def insert_many(self, documents):
        for doc in documents:
            self.data_list.append(copy.deepcopy(doc))
        return MagicMock()

    def replace_one(self, filter_query, replacement, upsert=False):
        tx_id = filter_query.get("transaction_id")
        for i, item in enumerate(self.data_list):
            if item.get("transaction_id") == tx_id:
                self.data_list[i] = copy.deepcopy(replacement)
                return MagicMock()
        if upsert:
            self.data_list.append(copy.deepcopy(replacement))
        return MagicMock()

    def update_one(self, filter_query, update, upsert=False):
        email = filter_query.get("email")
        for i, item in enumerate(self.data_list):
            if item.get("email") == email:
                if "$set" in update:
                    self.data_list[i].update(copy.deepcopy(update["$set"]))
                return MagicMock(modified_count=1)
        if upsert and "$set" in update:
            new_doc = copy.deepcopy(filter_query)
            new_doc.update(update["$set"])
            self.data_list.append(new_doc)
        return MagicMock(modified_count=0)

    def create_index(self, *args, **kwargs):
        pass

# Instantiate mock collections
mock_users_collection = MockCollection(mock_users_list)
mock_escrows_collection = MockCollection(mock_escrows_list)
mock_suppliers_collection = MockCollection(mock_suppliers_list)

# Mock pymongo before importing main
mock_pymongo = MagicMock()
mock_client = MagicMock()
mock_db = MagicMock()

mock_pymongo.MongoClient.return_value = mock_client
mock_client.__getitem__.return_value = mock_db

def get_collection_mock(name):
    if name == "users":
        return mock_users_collection
    elif name == "escrows":
        return mock_escrows_collection
    elif name == "suppliers":
        return mock_suppliers_collection
    return MagicMock()

mock_db.__getitem__.side_effect = get_collection_mock

# Inject the mocked pymongo module into sys.modules
sys.modules['pymongo'] = mock_pymongo

# Mock Algorand SDK modules to avoid actual network/client instantiation errors
sys.modules['algosdk'] = MagicMock()
sys.modules['algosdk.v2client'] = MagicMock()
sys.modules['algokit_utils'] = MagicMock()
sys.modules['escrow_client'] = MagicMock()

@pytest.fixture(autouse=True)
def mock_external_dependencies(monkeypatch):
    """
    Autouse fixture to mock external service calls (like blockchain deployment and email sending)
    to keep unit tests isolated, fast, and stable.
    """
    # Mock deploy_escrow in main and escrow_service modules
    def mock_deploy(buyer_address, supplier_address, amount_microalgos):
        return {
            "app_id": 12345,
            "app_address": "MOCK_APP_ADDRESS_54321",
            "transaction_id": "MOCK_TX_ID_98765",
            "status": "created"
        }
    
    monkeypatch.setattr("main.deploy_escrow", mock_deploy)

    # Mock confirm_delivery_on_chain
    def mock_confirm_delivery(app_id, buyer_address, supplier_address=None):
        return {
            "status": "released",
            "transaction_id": "MOCK_RELEASE_TX_ID_112233",
            "message": "On-chain settlement released successfully"
        }
    monkeypatch.setattr("escrow_service.confirm_delivery_on_chain", mock_confirm_delivery)
    
    import conftest as _ct
    # Mock SMTP email sending to avoid hanging or authenticating during tests
    from services.email_service import EmailService as _EmailService
    if not hasattr(_ct, "_original_send_procurement_inquiry"):
        _ct._original_send_procurement_inquiry = _EmailService.send_procurement_inquiry
    monkeypatch.setattr(
        "services.email_service.EmailService.send_procurement_inquiry",
        lambda self, name, email, subject, body: {"status": "sent", "provider": "smtp_mock"},
    )

    # Mock AlibabaProcurementService run_intelligence to prevent 429 rate limit errors in unit tests
    from services.alibaba_procurement_service import AlibabaProcurementService
    _original_run_intelligence = AlibabaProcurementService.run_intelligence
    _ct._original_run_intelligence = _original_run_intelligence
    def mock_run_intelligence(self, request):
        return {
            "suppliers": generate_conftest_suppliers()[:10],
            "recommended_supplier": generate_conftest_suppliers()[0],
            "rejected_suppliers": [],
            "procurement_analysis": {"total_scanned": 10, "eligible_count": 10},
            "logs": []
        }
    monkeypatch.setattr(AlibabaProcurementService, "run_intelligence", mock_run_intelligence)

    # Reset in-memory database lists between tests
    mock_users_list.clear()
    mock_escrows_list.clear()
    mock_suppliers_list.clear()
    
    # Mock main's reference to database loading suppliers
    monkeypatch.setattr("db.get_cached_suppliers", lambda product_name=None: mock_suppliers_list)
    monkeypatch.setattr("db.get_alibaba_suppliers", lambda product_name=None: mock_suppliers_list)
    
    # Pre-populate mock suppliers to ensure we have a realistic list for test runs
    mock_suppliers_list.extend(generate_conftest_suppliers())


def generate_conftest_suppliers():
    import random
    import hashlib
    regions = ["China", "Vietnam", "India", "Turkey", "Bangladesh"]
    categories = ["apparel", "electronics", "industrial", "medical", "general"]
    products = {
        "industrial": ["Industrial Components", "Steel Rods", "Cement", "Plywood", "Valves", "Ball Bearings"],
        "apparel": ["Cotton Shirts", "Polyester Jackets", "T-Shirts Bulk", "Knitted Fabrics", "Premium Hides"],
        "electronics": ["Laptop", "Smartphones", "TV", "Server Rack", "Solid State Drive"],
        "medical": ["Surgical Masks", "Gloves", "Medical Gowns"],
        "general": ["Office Chairs", "Cardboard Packaging", "Plastic Shells"]
    }
    
    suppliers = []
    rng = random.Random(42)
    for i in range(1, 135):
        cat = rng.choice(categories)
        prod = rng.choice(products[cat])
        region = rng.choice(regions)
        rel = rng.uniform(0.7, 0.99)
        base_price = round(rng.uniform(5.0, 1500.0), 2)
        s_id = f"ALB-{1000 + i}"
        suppliers.append({
            "id": s_id,
            "name": f"Alibaba Global {prod} Partner {i}",
            "category": cat,
            "product": prod,
            "reliability": rel,
            "address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
            "endpoint": f"/supplier/{s_id}/respond",
            "base_price": base_price,
            "reliability_score": int(rel * 100),
            "rating": round(rel * 5, 1),
            "delivery_days": rng.randint(2, 15),
            "success_rate": max(0, min(100, int(rel * 100) + rng.randint(-3, 1))),
            "total_deals": 10 + i % 5,
            "successful_deals": 9 + i % 5,
            "failed_deals": 1,
            "on_time_deliveries": 8 + i % 5,
            "late_deliveries": 2,
            "reputation_hash": hashlib.sha256(f"{s_id}-{base_price}".encode()).hexdigest(),
            "country": region,
            "region": region,
            "moq": rng.choice([100, 250, 500, 1000]),
            "lead_time_days": rng.randint(5, 20),
            "negotiated_price": round(base_price * 0.85, 2)
        })
    return suppliers

# Global FastAPI dependency overrides for standard test isolation
# This is placed at the end to ensure all mock modules (pymongo, algosdk) are registered in sys.modules first.
from main import app, get_current_user
app.dependency_overrides[get_current_user] = lambda: "test@example.com"


def pytest_sessionfinish(session, exitstatus):
    """Embed full test inventory into htmlcov/ after coverage HTML is generated."""
    if exitstatus != 0:
        return
    htmlcov = os.path.join(os.path.dirname(__file__), "..", "htmlcov")
    if not os.path.isdir(htmlcov):
        return
    try:
        import subprocess
        script = os.path.join(os.path.dirname(__file__), "..", "scripts", "enhance_coverage_html.py")
        if os.path.isfile(script):
            subprocess.run([sys.executable, script], cwd=os.path.join(os.path.dirname(__file__), ".."), check=False)
    except Exception:
        pass


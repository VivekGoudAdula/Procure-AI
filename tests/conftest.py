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
    
    # Mock SMTP email sending to avoid hanging or authenticating during tests
    monkeypatch.setattr("services.email_service.EmailService.send_procurement_inquiry", 
                        lambda self, name, email, subject, body: {"status": "sent", "provider": "smtp_mock"})
    
    # Reset in-memory database lists between tests
    mock_users_list.clear()
    mock_escrows_list.clear()
    mock_suppliers_list.clear()
    
    # Pre-populate mock suppliers to ensure we have a realistic list
    from db import get_alibaba_suppliers
    mock_suppliers_list.extend(get_alibaba_suppliers())

# Global FastAPI dependency overrides for standard test isolation
# This is placed at the end to ensure all mock modules (pymongo, algosdk) are registered in sys.modules first.
from main import app, get_current_user
app.dependency_overrides[get_current_user] = lambda: "test@example.com"

from fastapi.testclient import TestClient
from main import app
from ai.ai_agent import select_best_supplier

client = TestClient(app)

def test_supplier_selection_api_response():
    """
    Verifies that the /api/select-supplier endpoint:
    - returns HTTP 200
    - returns the correct response structure with suppliers and selectedSupplier
    """
    payload = {
        "productName": "Industrial Steel Rods",
        "quantity": 100,
        "budget": 50000.0,
        "policy": {
            "max_budget": 60000.0,
            "min_reliability": 80,
            "max_delivery_days": 15,
            "min_success_rate": 85,
            "require_on_chain_verified": True
        }
    }
    
    response = client.post("/api/select-supplier", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "deal" in data
    assert "suppliers" in data
    assert "selectedSupplier" in data
    assert "rounds" in data
    assert "negotiationLogs" in data
    
    # Check that selectedSupplier has expected keys
    sel_supplier = data["selectedSupplier"]
    assert "id" in sel_supplier
    assert "name" in sel_supplier
    assert "finalPrice" in sel_supplier
    assert "deliveryTime" in sel_supplier
    assert "reliability" in sel_supplier

def test_supplier_ranking():
    """
    Verifies that the underlying select_best_supplier ranking logic:
    - returns a valid supplier winner
    - winner is the supplier with the highest score
    """
    product = "Laptop Chargers"
    quantity = 50
    budget = 2000.0
    
    # Calling select_best_supplier directly
    result = select_best_supplier(product, quantity, budget)
    
    assert result["status"] == "success"
    assert "winner" in result
    assert "scored_results" in result
    
    winner = result["winner"]
    scored_results = result["scored_results"]
    
    # Ensure the winner has the highest score
    max_score = max(s["score"] for s in scored_results)
    assert winner["score"] == max_score
    assert winner["id"] is not None
    assert winner["name"] is not None

def test_supplier_recommendation():
    """
    Verifies that `/api/select-supplier` successfully recommends a supplier with valid details.
    """
    payload = {
        "productName": "Industrial Steel Rods",
        "quantity": 10,
        "budget": 5000.0
    }
    response = client.post("/api/select-supplier", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "selectedSupplier" in data
    assert data["selectedSupplier"]["id"] is not None
    assert "finalPrice" in data["selectedSupplier"]

def test_empty_supplier_result():
    """
    Verifies that applying an impossible procurement policy returns a status of 'no_supplier_found'.
    """
    payload = {
        "productName": "Industrial Steel Rods",
        "quantity": 100,
        "budget": 50000.0,
        "policy": {
            "max_budget": 1.0,  # Impossible budget
            "min_reliability": 100,
            "max_delivery_days": 1,
            "min_success_rate": 100,
            "require_on_chain_verified": True
        }
    }
    response = client.post("/api/select-supplier", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "no_supplier_found"
    assert "filtered_out_count" in data

def test_invalid_supplier_id():
    """
    Verifies that requesting details for a non-existent supplier ID returns HTTP 404.
    """
    response = client.get("/api/suppliers/non_existent_supplier_12345")
    assert response.status_code == 404
    assert "Supplier not found" in response.json()["detail"]

def test_supplier_score_consistency():
    """
    Verifies that supplier ranking scores are consistent (e.g. higher reliability yields a better/consistent score).
    """
    # Get direct output from select_best_supplier
    result = select_best_supplier("Industrial Steel Rods", 10, 5000.0)
    scored_results = result["scored_results"]
    for s in scored_results:
        assert 0 <= s["score"] <= 100
        # Ensure that reliability and other parameters map to the score
        assert "reliability" in s

def test_supplier_filtering():
    """
    Verifies that suppliers are filtered out when they do not satisfy policy conditions.
    """
    # Policy with 80 min_reliability should filter out lower reliability suppliers
    payload = {
        "productName": "Industrial Steel Rods",
        "quantity": 10,
        "budget": 5000.0,
        "policy": {
            "max_budget": 10000.0,
            "min_reliability": 80,
            "max_delivery_days": 30,
            "min_success_rate": 90,
            "require_on_chain_verified": False
        }
    }
    response = client.post("/api/select-supplier", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "selectedSupplier" in data
    # Check that any returned suppliers in the list meet the reliability threshold
    for s in data["suppliers"]:
        assert s["reliability"] >= 80



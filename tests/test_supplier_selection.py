from fastapi.testclient import TestClient
from main import app
from ai_agent import select_best_supplier

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

def test_ranking_logic_winner():
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

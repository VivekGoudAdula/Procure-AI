from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """
    Verifies that the /health endpoint:
    - returns HTTP 200
    - returns status: healthy
    - returns correct service name
    """
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ProcureAI"
    assert "timestamp" in data

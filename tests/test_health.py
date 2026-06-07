from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """
    Verifies that the /health endpoint returns HTTP 200 and status healthy.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_service_name():
    """
    Verifies that the /health endpoint returns the correct service name 'ProcureAI'.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "ProcureAI"

def test_health_response_schema():
    """
    Verifies that the /health endpoint response schema contains status, service, and timestamp.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "timestamp" in data


"""API endpoint tests."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client."""
    from src.main import app

    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert data["service"] == "mana-llm"


def test_metrics_endpoint(client):
    """Test metrics endpoint."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "mana_llm" in response.text


def test_list_models_endpoint(client):
    """Test list models endpoint."""
    response = client.get("/v1/models")
    # May fail if Ollama is not running, but should return valid response structure
    if response.status_code == 200:
        data = response.json()
        assert "data" in data
        assert "object" in data
        assert data["object"] == "list"

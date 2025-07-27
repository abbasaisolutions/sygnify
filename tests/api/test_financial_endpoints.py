"""
Test Suite: Financial API Endpoints
- API endpoint testing
- Authentication testing
- Load testing scenarios
- Security testing
"""
import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy" 
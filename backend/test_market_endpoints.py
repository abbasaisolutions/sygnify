#!/usr/bin/env python3
"""
Test script to verify market data endpoints
"""
import asyncio
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

async def test_market_endpoints():
    """Test market data endpoints"""
    print("Testing market data endpoints...")
    
    try:
        from api.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test health endpoint
        print("Testing /market/health...")
        response = client.get("/market/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test comprehensive endpoint
        print("\nTesting /market/comprehensive...")
        response = client.get("/market/comprehensive")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
        else:
            print(f"Error: {response.text}")
            
        # Test indices endpoint
        print("\nTesting /market/indices...")
        response = client.get("/market/indices")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_market_endpoints()) 
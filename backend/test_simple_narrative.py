#!/usr/bin/env python3
"""
Simple test for narrative functionality
"""
import requests
import json

def test_simple_narrative():
    """Test narrative endpoint with simple data"""
    base_url = "http://localhost:8000"
    
    # Simple test data
    test_data = {
        "analysis": "Financial data shows positive trends",
        "confidence_score": 0.85
    }
    
    try:
        print("Testing narrative endpoint with simple data...")
        response = requests.post(
            f"{base_url}/financial/narrative",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_narrative() 
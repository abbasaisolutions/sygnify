#!/usr/bin/env python3
"""
Test narrative endpoint functionality
"""
import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime

def test_narrative_endpoint():
    """Test the narrative endpoint"""
    base_url = "http://localhost:8000"
    
    # Test data for narrative generation
    narrative_data = {
        "analysis": "The financial data shows strong revenue growth of 15% year-over-year with healthy profit margins.",
        "key_insights": [
            "Revenue increased by 15% compared to last year",
            "Profit margins remained stable at 12%",
            "Cash flow improved significantly in Q4"
        ],
        "recommendations": [
            "Continue focusing on revenue growth initiatives",
            "Monitor expense trends closely",
            "Maintain current profit margin levels"
        ],
        "risk_assessment": {
            "risk_level": "low",
            "key_risks": ["Market volatility", "Economic uncertainty"],
            "risk_score": 0.25
        },
        "confidence_score": 0.85
    }
    
    try:
        # Test narrative generation
        print("Testing narrative generation endpoint...")
        response = requests.post(
            f"{base_url}/financial/narrative",
            json=narrative_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            if 'narrative' in data:
                narrative = data['narrative']
                print(f"Narrative type: {narrative.get('narrative_type', 'N/A')}")
                print(f"Narrative: {narrative.get('narrative', 'N/A')[:200]}...")
                print(f"Readability score: {narrative.get('readability_score', 'N/A')}")
                print(f"Sentiment score: {narrative.get('sentiment_score', 'N/A')}")
        elif response.status_code == 500:
            error_data = response.json()
            if "LLM service not available" in error_data.get("detail", ""):
                print("⚠️  LLM service not available (Ollama may not be running)")
                print("This is expected if Ollama is not installed or not running")
            else:
                print(f"Error: {error_data.get('detail', 'Unknown error')}")
        else:
            print(f"Error: {response.text}")
            
        # Test narrative types endpoint
        print("\nTesting narrative types endpoint...")
        response = requests.get(f"{base_url}/financial/narrative-types")
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Available narrative types: {data['narrative_types']}")
            print(f"Descriptions: {data['descriptions']}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_narrative_endpoint() 
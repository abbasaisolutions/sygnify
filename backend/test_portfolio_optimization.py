#!/usr/bin/env python3
"""
Test portfolio optimization
"""
import requests
import json

def test_portfolio_optimization():
    """Test portfolio optimization endpoint"""
    base_url = "http://localhost:8000"
    
    # Sample portfolio data
    portfolio_data = {
        "assets_data": {
            "AAPL": {
                "close": [100, 101, 102, 103, 104, 105, 106, 107, 108, 109]
            },
            "GOOGL": {
                "close": [200, 201, 202, 203, 204, 205, 206, 207, 208, 209]
            },
            "MSFT": {
                "close": [300, 301, 302, 303, 304, 305, 306, 307, 308, 309]
            }
        },
        "target_return": 0.1,
        "risk_free_rate": 0.02
    }
    
    try:
        response = requests.post(
            f"{base_url}/ml/portfolio/optimize",
            json=portfolio_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Expected return: {data['expected_return']:.4f}")
            print(f"Expected volatility: {data['expected_volatility']:.4f}")
            print(f"Sharpe ratio: {data['sharpe_ratio']:.4f}")
            print(f"Optimal allocation: {data['optimal_allocation']}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_portfolio_optimization() 
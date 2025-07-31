#!/usr/bin/env python3
"""
Test script for ML endpoints
"""
import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def test_ml_endpoints():
    """Test ML endpoints"""
    base_url = "http://localhost:8000"
    
    print("Testing ML endpoints...")
    
    # Test 1: Health check
    print("\n1. Testing ML health check...")
    try:
        response = requests.get(f"{base_url}/ml/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Risk metrics
    print("\n2. Testing risk metrics...")
    try:
        response = requests.get(f"{base_url}/ml/risk/metrics")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Available metrics: {data['available_metrics']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Trading indicators
    print("\n3. Testing trading indicators...")
    try:
        response = requests.get(f"{base_url}/ml/signals/indicators")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Technical indicators: {data['technical_indicators']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Portfolio strategies
    print("\n4. Testing portfolio strategies...")
    try:
        response = requests.get(f"{base_url}/ml/portfolio/strategies")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Strategies: {data['strategies']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 5: Feature engineering
    print("\n5. Testing feature engineering...")
    try:
        # Create sample financial data
        dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
        close_prices = (np.random.randn(len(dates)).cumsum() + 100).tolist()
        high_prices = (np.random.randn(len(dates)).cumsum() + 105).tolist()
        low_prices = (np.random.randn(len(dates)).cumsum() + 95).tolist()
        open_prices = (np.random.randn(len(dates)).cumsum() + 100).tolist()
        
        sample_data = {
            'date': dates.strftime('%Y-%m-%d').tolist(),
            'close': close_prices,
            'volume': np.random.randint(1000, 10000, len(dates)).tolist(),
            'high': high_prices,
            'low': low_prices,
            'open': open_prices
        }
        
        request_data = {
            "data": sample_data,
            "target_column": "close"
        }
        
        response = requests.post(f"{base_url}/ml/features/engineer", json=request_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Original features: {data['original_features']}")
            print(f"Engineered features: {len(data['engineered_features'])}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 6: Risk assessment
    print("\n6. Testing risk assessment...")
    try:
        request_data = {
            "data": sample_data
        }
        
        response = requests.post(f"{base_url}/ml/risk/assess", json=request_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Risk level: {data['risk_level']}")
            print(f"Risk metrics: {list(data['risk_metrics'].keys())}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 7: Trading signals
    print("\n7. Testing trading signals...")
    try:
        request_data = {
            "data": sample_data
        }
        
        response = requests.post(f"{base_url}/ml/signals/generate", json=request_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Overall signal: {data['overall_signal']}")
            print(f"Number of signals: {len(data['signals'])}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 8: Sentiment analysis
    print("\n8. Testing sentiment analysis...")
    try:
        request_data = {
            "text_data": [
                "The market is showing strong bullish momentum with positive growth indicators.",
                "Investors are concerned about the bearish trend and potential losses.",
                "The stock price remains stable with neutral market sentiment."
            ]
        }
        
        response = requests.post(f"{base_url}/ml/sentiment/analyze", json=request_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Overall sentiment: {data['overall_sentiment']}")
            print(f"Average sentiment: {data['average_sentiment']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 9: Model training
    print("\n9. Testing model training...")
    try:
        request_data = {
            "data": sample_data,
            "target_column": "close",
            "test_size": 0.2
        }
        
        response = requests.post(f"{base_url}/ml/train/price-prediction", json=request_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Model ID: {data['model_id']}")
            print(f"R² Score: {data['metrics']['r2']:.4f}")
            print(f"MAE: {data['metrics']['mae']:.4f}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 10: List models
    print("\n10. Testing model listing...")
    try:
        response = requests.get(f"{base_url}/ml/models")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total models: {data['total_models']}")
            if data['models']:
                print(f"Available models: {[m['model_id'] for m in data['models']]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ml_endpoints() 
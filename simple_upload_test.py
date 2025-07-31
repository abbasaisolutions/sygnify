#!/usr/bin/env python3
"""
Simple upload test to debug the 400 error
"""
import requests
import os

def test_simple_upload():
    """Test simple file upload"""
    print("🧪 Testing simple file upload...")
    
    # Create a simple CSV file
    csv_content = """Date,Open,High,Low,Close,Volume,Returns
2024-01-01,100.00,102.50,99.80,101.20,1500000,0.0120
2024-01-02,101.20,103.80,100.90,103.45,1800000,0.0222"""
    
    # Test the upload endpoint
    try:
        files = {
            'file': ('test.csv', csv_content, 'text/csv')
        }
        data = {
            'domain': 'financial'
        }
        
        response = requests.post(
            'http://127.0.0.1:8000/financial/upload',
            files=files,
            data=data
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Upload successful!")
            return True
        else:
            print("❌ Upload failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_simple_upload() 
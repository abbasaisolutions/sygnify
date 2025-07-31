#!/usr/bin/env python3
"""
Debug CSV parsing issue
"""
import pandas as pd
from io import StringIO

def test_csv_parsing():
    """Test CSV parsing directly"""
    print("🧪 Testing CSV parsing...")
    
    # Test CSV content
    csv_content = """Date,Open,High,Low,Close,Volume,Returns
2024-01-01,100.00,102.50,99.80,101.20,1500000,0.0120
2024-01-02,101.20,103.80,100.90,103.45,1800000,0.0222"""
    
    print(f"CSV Content:\n{csv_content}")
    print(f"Content length: {len(csv_content)}")
    
    try:
        # Try pandas parsing
        data = pd.read_csv(StringIO(csv_content))
        print(f"✅ Pandas parsing successful!")
        print(f"Shape: {data.shape}")
        print(f"Columns: {list(data.columns)}")
        print(f"Data:\n{data.head()}")
        return True
        
    except Exception as e:
        print(f"❌ Pandas parsing failed: {e}")
        return False

if __name__ == "__main__":
    test_csv_parsing() 
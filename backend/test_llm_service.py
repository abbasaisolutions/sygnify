#!/usr/bin/env python3
"""
Test LLM service functionality
"""
import asyncio
import pandas as pd
from services.llm_service import llm_service

async def test_llm_service():
    """Test LLM service functionality"""
    print("Testing LLM service...")
    
    # Create sample data
    data = pd.DataFrame({
        'revenue': [1000, 1100, 1200, 1150, 1300],
        'expenses': [800, 850, 900, 875, 950],
        'profit': [200, 250, 300, 275, 350]
    })
    
    try:
        # Test analyze_financial_data
        print("Testing analyze_financial_data...")
        result = await llm_service.analyze_financial_data(data, "financial")
        
        if "error" in result:
            print(f"❌ LLM service error: {result['error']}")
        else:
            print("✅ LLM service working correctly")
            print(f"   Analysis type: {result.get('analysis_type', 'N/A')}")
            print(f"   Confidence score: {result.get('confidence_score', 'N/A')}")
            print(f"   Key insights count: {len(result.get('key_insights', []))}")
            
    except Exception as e:
        print(f"❌ LLM service test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm_service()) 
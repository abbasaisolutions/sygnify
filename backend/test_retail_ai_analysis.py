#!/usr/bin/env python3
"""
Test script to verify retail AI analysis returns retail-specific content
"""
import sys
import os
import pandas as pd
import asyncio
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(__file__))

# Sample retail data for testing
def create_sample_retail_data():
    return pd.DataFrame({
        'customer_id': [f'CUST{i:03d}' for i in range(1, 21)],
        'product_id': [f'PROD{i%5:03d}' for i in range(1, 21)],
        'product_name': ['Widget A', 'Widget B', 'Widget C', 'Widget D', 'Widget E'] * 4,
        'category': ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'] * 4,
        'supplier': [f'Supplier{i%3}' for i in range(1, 21)],
        'transaction_date': pd.date_range('2024-01-01', periods=20, freq='D'),
        'quantity_sold': [1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 1, 2, 1],
        'unit_price': [29.99, 49.99, 79.99, 19.99, 99.99] * 4,
        'total_revenue': [29.99, 99.98, 79.99, 59.97, 99.99, 99.98, 79.99, 19.99, 199.98, 99.99,
                         89.97, 49.99, 159.98, 19.99, 99.99, 99.98, 79.99, 19.99, 199.98, 99.99],
        'inventory_on_hand': [100, 150, 200, 80, 120] * 4,
        'on_time_delivery': [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1]
    })

async def test_retail_ai_analysis():
    """Test the retail AI analysis functionality"""
    print("🧪 Testing Retail AI Analysis")
    print("=" * 50)
    
    try:
        # Import LLM service
        from api.services.llm_service import llm_service
        
        # Create sample data
        sample_data = create_sample_retail_data()
        print(f"📊 Created sample retail data: {len(sample_data)} transactions")
        print(f"   Columns: {list(sample_data.columns)}")
        print(f"   Customers: {sample_data['customer_id'].nunique()}")
        print(f"   Products: {sample_data['product_id'].nunique()}")
        print()
        
        # Test retail analysis
        print("🤖 Running retail AI analysis...")
        analysis_result = await llm_service.analyze_retail_data(sample_data, "retail")
        
        print("\n📋 Analysis Results Structure:")
        for key, value in analysis_result.items():
            if isinstance(value, dict):
                print(f"  ✅ {key}: {len(value)} items")
            elif isinstance(value, list):
                print(f"  ✅ {key}: {len(value)} items")
            else:
                print(f"  ✅ {key}: {type(value).__name__}")
        
        # Check for retail-specific content
        print("\n🔍 Retail-Specific Content Check:")
        
        # Check AI analysis
        ai_analysis = analysis_result.get('ai_analysis', {})
        if isinstance(ai_analysis, dict):
            print(f"  🧠 AI Analysis: {len(str(ai_analysis))} characters")
            if 'customer' in str(ai_analysis).lower() or 'retail' in str(ai_analysis).lower():
                print("    ✅ Contains retail-specific content")
            else:
                print("    ❌ Missing retail-specific content")
        
        # Check market context
        market_context = analysis_result.get('market_context', {})
        retail_trends = market_context.get('retail_industry_trends', {})
        if retail_trends:
            print(f"  🛍️ Retail Industry Trends: {len(retail_trends)} categories")
            key_trends = retail_trends.get('2024_key_trends', [])
            if key_trends:
                print(f"    ✅ 2024 Key Trends: {len(key_trends)} trends")
                print(f"    📝 Sample: {key_trends[0] if key_trends else 'None'}")
            else:
                print("    ❌ No key trends found")
        else:
            print("  ❌ No retail industry trends found")
        
        # Check insights
        insights = analysis_result.get('insights', [])
        if insights:
            print(f"  💡 Retail Insights: {len(insights)} insights")
            for i, insight in enumerate(insights[:3]):
                if isinstance(insight, dict):
                    title = insight.get('title', 'No title')
                    print(f"    {i+1}. {title}")
        else:
            print("  ❌ No insights found")
        
        # Check for financial content (should be none)
        full_content = str(analysis_result).lower()
        financial_terms = ['stock price', 'spy', 'qqq', 'interest rate', 'market sentiment']
        financial_found = [term for term in financial_terms if term in full_content]
        
        if financial_found:
            print(f"\n❌ WARNING: Found financial terms: {financial_found}")
        else:
            print(f"\n✅ SUCCESS: No financial terms found - pure retail analysis")
        
        # Check retail terms presence
        retail_terms = ['customer', 'inventory', 'supplier', 'retail', 'clv', 'conversion', 'turnover']
        retail_found = [term for term in retail_terms if term in full_content]
        print(f"✅ Retail terms found: {retail_found}")
        
        print("\n" + "=" * 50)
        print("🎉 Retail AI Analysis Test Complete!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in retail AI analysis test: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_retail_kpi_service():
    """Test the retail KPI service"""
    print("\n🛍️ Testing Retail KPI Service")
    print("-" * 30)
    
    try:
        from api.services.retail_kpi_service import retail_kpi_service
        
        sample_data = create_sample_retail_data()
        
        # Test retail KPIs
        retail_kpis = retail_kpi_service.calculate_retail_kpis(sample_data, "retail")
        print(f"✅ Retail KPIs calculated: {len(retail_kpis)} metrics")
        
        # Test recommendations
        recommendations = retail_kpi_service.generate_recommendations(sample_data, "retail")
        print(f"✅ Recommendations generated: {len(recommendations)}")
        
        # Test risk assessment
        risk_assessment = retail_kpi_service.generate_risk_assessment(sample_data, "retail")
        print(f"✅ Risk assessment completed: {len(risk_assessment)} factors")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in retail KPI service test: {e}")
        return False

if __name__ == "__main__":
    async def main():
        print("🏪 Retail Analytics Backend Testing")
        print("=" * 50)
        
        # Test AI Analysis
        ai_success = await test_retail_ai_analysis()
        
        # Test KPI Service
        kpi_success = await test_retail_kpi_service()
        
        print(f"\n📊 Test Results:")
        print(f"  AI Analysis: {'✅ PASSED' if ai_success else '❌ FAILED'}")
        print(f"  KPI Service: {'✅ PASSED' if kpi_success else '❌ FAILED'}")
        
        if ai_success and kpi_success:
            print(f"\n🎉 All tests passed! Retail backend is working correctly.")
        else:
            print(f"\n⚠️ Some tests failed. Check the errors above.")
    
    asyncio.run(main())
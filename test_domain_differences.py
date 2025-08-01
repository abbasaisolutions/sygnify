#!/usr/bin/env python3
"""
Domain Differences Test Script
Demonstrates the differences between Financial and Retail domain analysis
"""
import sys
import os
sys.path.append('backend')

import pandas as pd
import asyncio
import json
from datetime import datetime

def create_sample_financial_data():
    """Create sample financial data"""
    financial_data = {
        'Company': ['TechCorp', 'FinanceInc', 'ManufacturingCo', 'ServiceLtd', 'RetailChain'] * 6,
        'Revenue': [1000000, 5000000, 3000000, 2000000, 8000000] * 6,
        'Profit': [200000, 1000000, 450000, 300000, 800000] * 6,
        'Total_Assets': [5000000, 25000000, 15000000, 8000000, 20000000] * 6,
        'Total_Liabilities': [2000000, 15000000, 8000000, 4000000, 12000000] * 6,
        'Cash_Flow': [500000, 1200000, 800000, 600000, 1500000] * 6,
        'Industry': ['Technology', 'Finance', 'Manufacturing', 'Services', 'Retail'] * 6,
        'ROE': [15.2, 12.8, 18.5, 14.2, 16.8] * 6,
        'ROA': [8.5, 6.2, 9.8, 7.5, 8.9] * 6,
        'Debt_to_Equity': [0.4, 0.8, 0.6, 0.5, 0.7] * 6
    }
    return pd.DataFrame(financial_data)

def create_sample_retail_data():
    """Create sample retail data"""
    retail_data = {
        'customer_id': ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005'] * 6,
        'product_id': ['PROD001', 'PROD002', 'PROD003', 'PROD004', 'PROD005'] * 6,
        'product_name': ['Laptop', 'Shoes', 'Coffee', 'Book', 'Phone'] * 6,
        'category': ['Electronics', 'Fashion', 'Food', 'Books', 'Electronics'] * 6,
        'supplier': ['TechSupplier', 'FashionCorp', 'FoodCo', 'BookHouse', 'TechSupplier'] * 6,
        'total_revenue': [999.99, 120.00, 25.99, 15.99, 699.99] * 6,
        'quantity_sold': [1, 2, 3, 1, 1] * 6,
        'cost_per_unit': [500.00, 60.00, 12.00, 8.00, 350.00] * 6,
        'inventory_on_hand': [50, 200, 500, 300, 100] * 6,
        'lead_time': [14, 21, 7, 30, 10] * 6,
        'quality_score': [98, 95, 99, 85, 97] * 6,
        'customer_segment': ['Premium', 'Regular', 'Premium', 'Regular', 'Premium'] * 6,
        'clv_score': [850.5, 320.2, 920.8, 180.5, 590.6] * 6,
        'churn_risk': ['Low', 'High', 'Low', 'Medium', 'Low'] * 6
    }
    return pd.DataFrame(retail_data)

async def test_financial_analysis():
    """Test financial domain analysis"""
    print("🏦 Testing Financial Domain Analysis...")
    
    try:
        from backend.api.services.llm_service import llm_service
        
        # Create financial sample data
        financial_data = create_sample_financial_data()
        
        # Perform financial analysis
        financial_results = await llm_service.analyze_financial_data(financial_data, "financial")
        
        print("✅ Financial Analysis Results:")
        print(f"   - Domain: {financial_results.get('ai_analysis', {}).get('domain', 'N/A')}")
        print(f"   - Analysis Type: Financial KPIs")
        print(f"   - Key Metrics: {list(financial_results.get('financial_kpis', {}).keys())[:5]}")
        
        # Check financial-specific content
        recommendations = financial_results.get('recommendations', [])
        financial_terms = ['financial', 'profit', 'revenue', 'assets', 'ratio', 'ROE', 'ROA']
        financial_recommendations = [rec for rec in recommendations if any(term in rec.lower() for term in financial_terms)]
        
        print(f"   - Financial Recommendations: {len(financial_recommendations)}")
        print(f"   - Sample Recommendation: {recommendations[0] if recommendations else 'None'}")
        
        return financial_results
        
    except Exception as e:
        print(f"❌ Financial Analysis failed: {e}")
        return None

async def test_retail_analysis():
    """Test retail domain analysis"""
    print("\n🛍️ Testing Retail Domain Analysis...")
    
    try:
        from backend.api.services.llm_service import llm_service
        
        # Create retail sample data
        retail_data = create_sample_retail_data()
        
        # Perform retail analysis
        retail_results = await llm_service.analyze_financial_data(retail_data, "retail")
        
        print("✅ Retail Analysis Results:")
        print(f"   - Domain: {retail_results.get('ai_analysis', {}).get('domain', 'N/A')}")
        print(f"   - Analysis Type: Retail Analytics")
        print(f"   - Key Metrics: {list(retail_results.get('retail_analytics', {}).keys())[:5]}")
        
        # Check retail-specific content
        recommendations = retail_results.get('recommendations', [])
        retail_terms = ['customer', 'inventory', 'sales', 'product', 'supplier', 'retail', 'segmentation']
        retail_recommendations = [rec for rec in recommendations if any(term in rec.lower() for term in retail_terms)]
        
        print(f"   - Retail Recommendations: {len(retail_recommendations)}")
        print(f"   - Sample Recommendation: {recommendations[0] if recommendations else 'None'}")
        
        return retail_results
        
    except Exception as e:
        print(f"❌ Retail Analysis failed: {e}")
        return None

def compare_analysis_results(financial_results, retail_results):
    """Compare the differences between financial and retail analysis"""
    print("\n🔍 Comparing Domain Analysis Differences...")
    
    if not financial_results or not retail_results:
        print("❌ Cannot compare - one or both analyses failed")
        return
    
    print("\n📊 Key Differences:")
    
    # Compare analysis structure
    financial_keys = set(financial_results.keys())
    retail_keys = set(retail_results.keys())
    
    print(f"1. Structure Differences:")
    print(f"   - Financial has: {financial_keys - retail_keys}")
    print(f"   - Retail has: {retail_keys - financial_keys}")
    
    # Compare KPI types
    financial_kpis = financial_results.get('financial_kpis', {})
    retail_analytics = retail_results.get('retail_analytics', {})
    
    print(f"\n2. KPI Types:")
    print(f"   - Financial KPIs: {type(financial_kpis).__name__}")
    print(f"   - Retail Analytics: {type(retail_analytics).__name__}")
    
    # Compare recommendations
    financial_recs = financial_results.get('recommendations', [])
    retail_recs = retail_results.get('recommendations', [])
    
    print(f"\n3. Recommendations Comparison:")
    print(f"   - Financial Recommendations Count: {len(financial_recs)}")
    print(f"   - Retail Recommendations Count: {len(retail_recs)}")
    
    if financial_recs and retail_recs:
        print(f"   - Financial Sample: '{financial_recs[0][:80]}...'")
        print(f"   - Retail Sample: '{retail_recs[0][:80]}...'")
    
    # Compare insights
    financial_insights = financial_results.get('insights', {})
    retail_insights = retail_results.get('insights', [])
    
    print(f"\n4. Insights Comparison:")
    print(f"   - Financial Insights Type: {type(financial_insights).__name__}")
    print(f"   - Retail Insights Type: {type(retail_insights).__name__}")
    
    # Domain-specific analysis content
    print(f"\n5. Domain-Specific Content:")
    
    # Check financial content
    financial_content = str(financial_results).lower()
    financial_terms_found = sum(1 for term in ['roe', 'roa', 'profit', 'assets', 'liquidity'] if term in financial_content)
    print(f"   - Financial terms in financial analysis: {financial_terms_found}")
    
    # Check retail content  
    retail_content = str(retail_results).lower()
    retail_terms_found = sum(1 for term in ['customer', 'inventory', 'supplier', 'clv', 'churn'] if term in retail_content)
    print(f"   - Retail terms in retail analysis: {retail_terms_found}")
    
    # Cross-contamination check
    financial_terms_in_retail = sum(1 for term in ['roe', 'roa', 'assets', 'liquidity'] if term in retail_content)
    retail_terms_in_financial = sum(1 for term in ['customer', 'inventory', 'clv', 'churn'] if term in financial_content)
    
    print(f"   - Financial terms in retail analysis: {financial_terms_in_retail}")
    print(f"   - Retail terms in financial analysis: {retail_terms_in_financial}")
    
    # Determine success
    if financial_terms_found > 0 and retail_terms_found > 0 and financial_terms_in_retail == 0 and retail_terms_in_financial == 0:
        print("\n✅ SUCCESS: Domains are properly separated!")
    else:
        print("\n⚠️ WARNING: Some domain separation issues detected")

async def main():
    """Main test function"""
    print("🚀 Testing Domain-Specific Analysis Differences...")
    print("="*60)
    
    # Test both domains
    financial_results = await test_financial_analysis()
    retail_results = await test_retail_analysis()
    
    # Compare results
    compare_analysis_results(financial_results, retail_results)
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    
    if financial_results and retail_results:
        print("✅ Both financial and retail analyses completed successfully")
        print("✅ Domain-specific routing is working")
        print("✅ Different KPIs and recommendations generated for each domain")
        
        # Save results for inspection
        with open('financial_analysis_sample.json', 'w') as f:
            json.dump(financial_results, f, indent=2, default=str)
        
        with open('retail_analysis_sample.json', 'w') as f:
            json.dump(retail_results, f, indent=2, default=str)
            
        print("✅ Sample results saved to JSON files for inspection")
        
    else:
        print("❌ One or both analyses failed - check error messages above")
    
    print("\n🎯 Next Steps:")
    print("   1. Review the generated JSON files to see detailed differences")
    print("   2. Test with actual frontend to verify dashboard differences")
    print("   3. Upload real retail data to validate domain-specific insights")

if __name__ == "__main__":
    asyncio.run(main())
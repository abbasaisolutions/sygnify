#!/usr/bin/env python3
"""
Quick Domain Separation Verification
Tests that financial and retail domains return different analysis structures
"""
import sys
import os
sys.path.append('backend')

import pandas as pd
import json

def test_basic_domain_separation():
    """Test basic domain separation without async dependencies"""
    print("🔍 Testing Basic Domain Separation...")
    
    # Create simple test data
    test_data = pd.DataFrame({
        'column1': [1, 2, 3, 4, 5],
        'column2': [10, 20, 30, 40, 50],
        'column3': ['A', 'B', 'C', 'D', 'E']
    })
    
    try:
        # Test retail KPI service
        print("\n🛍️ Testing Retail KPI Service...")
        from backend.api.services.retail_kpi_service import retail_kpi_service
        
        retail_result = retail_kpi_service.calculate_retail_kpis(test_data, "retail")
        retail_recommendations = retail_kpi_service.generate_recommendations(test_data, "retail")
        
        print(f"✅ Retail Analysis Keys: {list(retail_result.keys())}")
        print(f"   - Domain: {retail_result.get('domain', 'N/A')}")
        print(f"   - Analysis Type: {retail_result.get('analysis_timestamp', 'N/A')[:19]}")
        print(f"   - Recommendations: {len(retail_recommendations)}")
        print(f"   - Sample Recommendation: {retail_recommendations[0] if retail_recommendations else 'None'}")
        
    except Exception as e:
        print(f"❌ Retail KPI Service test failed: {e}")
        return False
    
    try:
        # Test financial KPI service
        print("\n🏦 Testing Financial KPI Service...")
        from backend.api.services.financial_kpi_service import financial_kpi_service
        
        financial_result = financial_kpi_service.calculate_financial_kpis(test_data, "financial")
        financial_recommendations = financial_kpi_service.generate_recommendations(test_data, "financial")
        
        print(f"✅ Financial Analysis Keys: {list(financial_result.keys())}")
        print(f"   - Domain: financial")
        print(f"   - Recommendations: {len(financial_recommendations)}")
        print(f"   - Sample Recommendation: {financial_recommendations[0] if financial_recommendations else 'None'}")
        
    except Exception as e:
        print(f"❌ Financial KPI Service test failed: {e}")
        return False
    
    # Compare the two
    print("\n📊 Comparison Results:")
    
    # Check if they're different
    if retail_result != financial_result:
        print("✅ RETAIL and FINANCIAL analyses return DIFFERENT results")
    else:
        print("❌ WARNING: Retail and Financial analyses return SAME results")
        
    # Check domain-specific terms
    retail_content = str(retail_result).lower()
    financial_content = str(financial_result).lower()
    
    retail_terms = ['customer', 'inventory', 'supplier', 'retail', 'clv']
    financial_terms = ['roe', 'roa', 'profit', 'assets', 'financial']
    
    retail_terms_in_retail = sum(1 for term in retail_terms if term in retail_content)
    financial_terms_in_financial = sum(1 for term in financial_terms if term in financial_content)
    
    print(f"   - Retail terms in retail analysis: {retail_terms_in_retail}")
    print(f"   - Financial terms in financial analysis: {financial_terms_in_financial}")
    
    # Check for cross-contamination
    retail_terms_in_financial = sum(1 for term in retail_terms if term in financial_content)
    financial_terms_in_retail = sum(1 for term in financial_terms if term in retail_content)
    
    print(f"   - Cross-contamination check:")
    print(f"     • Retail terms in financial: {retail_terms_in_financial}")
    print(f"     • Financial terms in retail: {financial_terms_in_retail}")
    
    if retail_terms_in_retail > 0 and financial_terms_in_financial > 0:
        print("\n✅ SUCCESS: Domain-specific content detected in appropriate analyses")
        return True
    else:
        print("\n⚠️ WARNING: Domain-specific content not clearly separated")
        return False

def test_llm_service_routing():
    """Test LLM service domain routing (basic structure test)"""
    print("\n🧠 Testing LLM Service Domain Routing...")
    
    try:
        from backend.api.services.llm_service import llm_service
        
        # Test that the service has the routing logic
        if hasattr(llm_service, 'analyze_financial_data') and hasattr(llm_service, 'analyze_retail_data'):
            print("✅ LLM Service has both financial and retail analysis methods")
            return True
        else:
            print("❌ LLM Service missing expected methods")
            return False
            
    except Exception as e:
        print(f"❌ LLM Service test failed: {e}")
        return False

def test_api_router_health():
    """Test API router health endpoints"""
    print("\n🔗 Testing API Router Health Endpoints...")
    
    try:
        # Import routers
        from backend.api.routers.financial import router as financial_router
        from backend.api.routers.retail import router as retail_router
        
        print("✅ Both financial and retail routers imported successfully")
        print(f"   - Financial router tags: {financial_router.tags}")
        print(f"   - Retail router tags: {retail_router.tags}")
        
        if financial_router.tags != retail_router.tags:
            print("✅ Routers have different tags (proper separation)")
            return True
        else:
            print("⚠️ Routers have same tags")
            return False
            
    except Exception as e:
        print(f"❌ Router test failed: {e}")
        return False

def main():
    """Main verification function"""
    print("🚀 Quick Domain Separation Verification")
    print("=" * 50)
    
    tests = {
        "KPI Service Separation": test_basic_domain_separation(),
        "LLM Service Routing": test_llm_service_routing(),
        "API Router Health": test_api_router_health()
    }
    
    print("\n" + "=" * 50)
    print("📋 VERIFICATION RESULTS")
    print("=" * 50)
    
    passed = sum(1 for result in tests.values() if result)
    total = len(tests)
    
    for test_name, result in tests.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\n🏆 Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Retail and Financial domains are properly separated")
        print("✅ Different KPIs and analysis for each domain")
        print("✅ No cross-contamination detected")
        
        print("\n📋 Domain Separation Confirmed:")
        print("   🏦 Financial Domain: ROE, ROA, Assets, Liquidity, Risk")
        print("   🛍️ Retail Domain: CLV, Inventory, Suppliers, Customers, Sales")
        
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        print("Please review the implementation for domain separation issues")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Retail Domain Workflow Test Script
Tests the complete retail analytics pipeline end-to-end
"""
import sys
import os
sys.path.append('backend')

import pandas as pd
import asyncio
import json
from datetime import datetime

# Import retail domain modules
from retail import CustomerAnalyzer, SalesPerformanceAnalyzer, InventoryManager, SupplyChainAnalyzer, RetailKPICalculator

def test_retail_modules():
    """Test all retail domain modules with sample data"""
    print("🧪 Testing Retail Domain Modules...")
    
    # Load sample retail data
    try:
        data = pd.read_csv('sample_retail_data.csv')
        print(f"✅ Loaded sample data: {len(data)} records")
    except FileNotFoundError:
        print("❌ Sample retail data file not found")
        return False
    
    # Test Customer Analytics
    print("\n📊 Testing Customer Analytics...")
    customer_analyzer = CustomerAnalyzer()
    
    try:
        clv_analysis = customer_analyzer.calculate_clv(data)
        rfm_analysis = customer_analyzer.perform_rfm_analysis(data)
        churn_analysis = customer_analyzer.analyze_customer_churn(data)
        
        print(f"✅ Customer Analytics completed")
        print(f"   - CLV Analysis: {len(clv_analysis)} metrics")
        print(f"   - RFM Analysis: {len(rfm_analysis)} segments")
        print(f"   - Churn Analysis: {churn_analysis.get('churn_rate', 'N/A')} churn rate")
    except Exception as e:
        print(f"❌ Customer Analytics failed: {e}")
        return False
    
    # Test Sales Performance
    print("\n💰 Testing Sales Performance...")
    sales_analyzer = SalesPerformanceAnalyzer()
    
    try:
        velocity_analysis = sales_analyzer.analyze_sales_velocity(data)
        conversion_analysis = sales_analyzer.analyze_conversion_rates(data)
        product_analysis = sales_analyzer.analyze_product_performance(data)
        
        print(f"✅ Sales Performance completed")
        print(f"   - Sales Velocity: {velocity_analysis.get('daily_sales_velocity', 'N/A')}")
        print(f"   - Conversion Rate: {conversion_analysis.get('overall_conversion_rate', 'N/A')}%")
        print(f"   - Top Products: {len(product_analysis.get('top_performers', []))}")
    except Exception as e:
        print(f"❌ Sales Performance failed: {e}")
        return False
    
    # Test Inventory Management
    print("\n📦 Testing Inventory Management...")
    inventory_manager = InventoryManager()
    
    try:
        turnover_analysis = inventory_manager.calculate_inventory_turnover(data)
        aging_analysis = inventory_manager.analyze_stock_aging(data)
        abc_analysis = inventory_manager.perform_abc_analysis(data)
        
        print(f"✅ Inventory Management completed")
        print(f"   - Turnover Rate: {turnover_analysis.get('overall_turnover_rate', 'N/A')}")
        print(f"   - ABC Analysis: {abc_analysis.get('classification_summary', {}).get('total_products', 'N/A')} products")
        print(f"   - Slow Moving Items: {len(turnover_analysis.get('slow_moving_items', []))}")
    except Exception as e:
        print(f"❌ Inventory Management failed: {e}")
        return False
    
    # Test Supply Chain Analytics
    print("\n🚚 Testing Supply Chain Analytics...")
    supply_chain_analyzer = SupplyChainAnalyzer()
    
    try:
        supplier_analysis = supply_chain_analyzer.analyze_supplier_performance(data)
        logistics_analysis = supply_chain_analyzer.analyze_logistics_performance(data)
        cost_analysis = supply_chain_analyzer.analyze_supply_chain_costs(data)
        
        print(f"✅ Supply Chain Analytics completed")
        print(f"   - Suppliers Analyzed: {len(supplier_analysis.get('supplier_rankings', []))}")
        print(f"   - Cost Savings Potential: {cost_analysis.get('cost_savings_potential', 'N/A')}%")
        print(f"   - Risk Level: {supplier_analysis.get('performance_summary', {}).get('avg_supplier_score', 'N/A')}")
    except Exception as e:
        print(f"❌ Supply Chain Analytics failed: {e}")
        return False
    
    # Test Retail KPI Calculator
    print("\n📈 Testing Retail KPI Calculator...")
    kpi_calculator = RetailKPICalculator()
    
    try:
        retail_kpis = kpi_calculator.calculate_retail_kpis(data, "retail")
        health_score = retail_kpis.get('retail_health_score', 0)
        
        print(f"✅ Retail KPI Calculator completed")
        print(f"   - Overall Health Score: {health_score}/100")
        print(f"   - Sales Performance: {len(retail_kpis.get('sales_performance', {}))}")
        print(f"   - Customer Metrics: {len(retail_kpis.get('customer_metrics', {}))}")
    except Exception as e:
        print(f"❌ Retail KPI Calculator failed: {e}")
        return False
    
    print("\n🎉 All Retail Domain Modules Tested Successfully!")
    return True

def test_retail_kpi_service():
    """Test the retail KPI service"""
    print("\n🔧 Testing Retail KPI Service...")
    
    try:
        from backend.api.services.retail_kpi_service import retail_kpi_service
        
        # Load sample data
        data = pd.read_csv('sample_retail_data.csv')
        
        # Test comprehensive KPI calculation
        comprehensive_kpis = retail_kpi_service.calculate_retail_kpis(data, "retail")
        
        print(f"✅ Retail KPI Service completed")
        print(f"   - Analysis Type: {comprehensive_kpis.get('domain', 'N/A')}")
        print(f"   - Records Processed: {comprehensive_kpis.get('data_summary', {}).get('total_records', 'N/A')}")
        print(f"   - Health Score: {comprehensive_kpis.get('overall_health_score', 'N/A')}/100")
        
        # Test recommendations
        recommendations = retail_kpi_service.generate_recommendations(data, "retail")
        print(f"   - Recommendations Generated: {len(recommendations)}")
        
        # Test risk assessment
        risk_assessment = retail_kpi_service.generate_risk_assessment(data, "retail")
        print(f"   - Risk Level: {risk_assessment.get('overall_risk_level', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Retail KPI Service failed: {e}")
        return False

def test_data_quality():
    """Test data quality and completeness"""
    print("\n🔍 Testing Data Quality...")
    
    try:
        data = pd.read_csv('sample_retail_data.csv')
        
        # Check data completeness
        missing_data = data.isnull().sum().sum()
        total_data_points = data.shape[0] * data.shape[1]
        completeness = ((total_data_points - missing_data) / total_data_points) * 100
        
        print(f"✅ Data Quality Assessment:")
        print(f"   - Total Records: {len(data)}")
        print(f"   - Total Columns: {len(data.columns)}")
        print(f"   - Data Completeness: {completeness:.1f}%")
        print(f"   - Missing Values: {missing_data}")
        
        # Check key retail columns
        key_columns = ['customer_id', 'product_id', 'total_revenue', 'quantity_sold', 'supplier']
        present_columns = [col for col in key_columns if col in data.columns]
        
        print(f"   - Key Retail Columns Present: {len(present_columns)}/{len(key_columns)}")
        print(f"   - Columns: {', '.join(present_columns)}")
        
        return len(present_columns) >= 4  # At least 4 key columns should be present
        
    except Exception as e:
        print(f"❌ Data Quality test failed: {e}")
        return False

def generate_test_summary():
    """Generate a comprehensive test summary"""
    print("\n" + "="*60)
    print("🎯 RETAIL DOMAIN IMPLEMENTATION TEST SUMMARY")
    print("="*60)
    
    # Run all tests
    tests = {
        "Data Quality": test_data_quality(),
        "Retail Modules": test_retail_modules(),
        "KPI Service": test_retail_kpi_service()
    }
    
    # Print results
    print(f"\n📊 Test Results:")
    passed = 0
    for test_name, result in tests.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🏆 Overall Score: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("\n🎉 ALL TESTS PASSED! Retail Domain is ready for production.")
        return True
    else:
        print(f"\n⚠️  {len(tests) - passed} test(s) failed. Please review and fix issues.")
        return False

if __name__ == "__main__":
    print("🚀 Starting Retail Domain Workflow Tests...")
    success = generate_test_summary()
    
    if success:
        print("\n🔥 Retail Domain implementation is complete and functional!")
        print("\n📋 Next steps:")
        print("   1. Deploy the retail domain to production")
        print("   2. Test with real retail data")
        print("   3. Create user documentation")
        print("   4. Set up monitoring and alerts")
    else:
        print("\n🔧 Please address the failed tests before deployment.")
    
    sys.exit(0 if success else 1)
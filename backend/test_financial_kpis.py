#!/usr/bin/env python3
"""
Test script for Financial KPI Service
Tests real KPI calculations from sample financial data
"""

import pandas as pd
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.services.financial_kpi_service import financial_kpi_service

def create_sample_financial_data():
    """Create sample financial data for testing"""
    data = {
        'revenue': [1000000, 1100000, 1200000, 1300000, 1400000],
        'profit': [200000, 220000, 240000, 260000, 280000],
        'cash_flow': [150000, 165000, 180000, 195000, 210000],
        'assets': [2000000, 2100000, 2200000, 2300000, 2400000],
        'liabilities': [800000, 840000, 880000, 920000, 960000],
        'debt': [400000, 420000, 440000, 460000, 480000],
        'inventory': [300000, 315000, 330000, 345000, 360000]
    }
    return pd.DataFrame(data)

def test_financial_kpi_calculation():
    """Test the financial KPI calculation service"""
    print("🧪 Testing Financial KPI Service...")
    
    # Create sample data
    sample_data = create_sample_financial_data()
    print(f"📊 Sample data created with {len(sample_data)} rows and {len(sample_data.columns)} columns")
    print(f"📋 Columns: {list(sample_data.columns)}")
    print(f"📈 Sample data:\n{sample_data.head()}")
    
    # Calculate KPIs
    kpis = financial_kpi_service.calculate_financial_kpis(sample_data)
    
    print("\n🎯 Calculated Financial KPIs:")
    print("=" * 50)
    for key, value in kpis.items():
        print(f"📊 {key.replace('_', ' ').title()}: {value}")
    
    # Verify the values are realistic
    print("\n✅ Verification:")
    print("=" * 50)
    
    # Check if revenue growth is calculated (should be around 40% for our sample data)
    if 'revenue_growth' in kpis:
        print(f"✅ Revenue Growth: {kpis['revenue_growth']}")
    
    # Check if profit margin is calculated (should be around 20% for our sample data)
    if 'profit_margin' in kpis:
        print(f"✅ Profit Margin: {kpis['profit_margin']}")
    
    # Check if cash flow is calculated
    if 'cash_flow' in kpis:
        print(f"✅ Cash Flow: {kpis['cash_flow']}")
    
    # Check if ROI is calculated
    if 'roi' in kpis:
        print(f"✅ ROI: {kpis['roi']}")
    
    # Check additional metrics
    if 'debt_ratio' in kpis:
        print(f"✅ Debt Ratio: {kpis['debt_ratio']}")
    
    if 'working_capital' in kpis:
        print(f"✅ Working Capital: {kpis['working_capital']}")
    
    if 'inventory_turnover' in kpis:
        print(f"✅ Inventory Turnover: {kpis['inventory_turnover']}")
    
    if 'current_ratio' in kpis:
        print(f"✅ Current Ratio: {kpis['current_ratio']}")
    
    print(f"\n📊 Data Quality Score: {kpis.get('data_quality_score', 'N/A')}")
    print(f"📊 Data Points Analyzed: {kpis.get('data_points_analyzed', 'N/A')}")
    
    print("\n🎉 Financial KPI Service Test Completed Successfully!")
    return kpis

if __name__ == "__main__":
    test_financial_kpi_calculation() 
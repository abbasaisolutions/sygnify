#!/usr/bin/env python3
"""
Test script to simulate realistic CSV data with numeric column names
and test the enhanced SmartLabeler and NarrativeGenerator.
"""

import asyncio
import json
from analyze import run_financial_analysis

async def test_realistic_financial_data():
    """Test with realistic financial data structure."""
    
    # Simulate CSV with numeric column names (like financial_transactions_data.csv)
    columns = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]
    
    # Sample data that might represent financial transactions
    sample_rows = [
        {
            "0": 1000.50,    # Transaction amount
            "1": "2024-01-01", # Date
            "2": "Revenue",   # Category
            "3": "USD",       # Currency
            "4": 15000.00,    # Account balance
            "5": 0.15,        # Interest rate
            "6": "Active",    # Status
            "7": 100,         # Quantity
            "8": 10.50,       # Unit price
            "9": 0.05,        # Tax rate
            "10": "Online",   # Channel
            "11": "Premium",  # Tier
            "12": 500.25,     # Net amount
            "13": 50.00,      # Fee
            "14": "Monthly",  # Frequency
            "15": 1           # Transaction ID
        },
        {
            "0": 2500.75,
            "1": "2024-01-02",
            "2": "Expense",
            "3": "USD",
            "4": 12500.00,
            "5": 0.12,
            "6": "Pending",
            "7": 25,
            "8": 100.03,
            "9": 0.08,
            "10": "In-store",
            "11": "Standard",
            "12": 2300.69,
            "13": 200.06,
            "14": "One-time",
            "15": 2
        },
        {
            "0": 500.00,
            "1": "2024-01-03",
            "2": "Investment",
            "3": "USD",
            "4": 12000.00,
            "5": 0.18,
            "6": "Completed",
            "7": 1,
            "8": 500.00,
            "9": 0.00,
            "10": "Mobile",
            "11": "Premium",
            "12": 500.00,
            "13": 0.00,
            "14": "Weekly",
            "15": 3
        }
    ]
    
    print("🧪 Testing Enhanced Financial Analysis with Realistic Data")
    print("=" * 60)
    print(f"📊 Columns: {columns}")
    print(f"📈 Records: {len(sample_rows)}")
    print(f"🔍 Sample data structure: {list(sample_rows[0].keys())}")
    print()
    
    # Test with different roles
    roles = ["executive", "analyst", "manager"]
    
    for role in roles:
        print(f"\n👤 Testing {role.upper()} Role")
        print("-" * 40)
        
        result = await run_financial_analysis(
            columns=columns,
            sample_rows=sample_rows,
            user_id=123,
            user_role=role
        )
        
        if result["success"]:
            print(f"✅ Analysis completed successfully!")
            
            # Display smart labels
            print(f"\n🏷️  Smart Labels Generated:")
            for col, label in result["smart_labels"].items():
                print(f"   Column {col}: {label}")
            
            # Display enhanced label details
            print(f"\n📋 Enhanced Label Details:")
            for col, details in result["enhanced_labels"].items():
                print(f"   Column {col}:")
                print(f"     - Semantic: {details['semantic']}")
                print(f"     - Category: {details['category']}")
                print(f"     - Type: {details['type']}")
                print(f"     - Importance: {details['importance']:.2f}")
                print(f"     - Description: {details['description']}")
            
            # Display narrative
            print(f"\n📝 Generated Narrative:")
            print(f"   Headline: {result['narrative']['headline']}")
            print(f"   Paragraphs: {len(result['narrative']['paragraphs'])}")
            for i, para in enumerate(result['narrative']['paragraphs'][:2]):  # Show first 2 paragraphs
                print(f"   {i+1}. {para[:100]}...")
            
            # Display facts
            print(f"\n🔍 Extracted Facts:")
            for i, fact in enumerate(result['facts']['facts']):
                print(f"   {i+1}. {fact}")
            
            # Display recommendations
            print(f"\n📈 SMART Recommendations:")
            for i, rec in enumerate(result['recommendations']):
                print(f"   {i+1}. {rec['recommendation']}")
            
            # Display data quality insights
            print(f"\n🔬 Data Quality Insights:")
            if result['data_quality']['outliers']:
                for col, outlier_info in result['data_quality']['outliers'].items():
                    print(f"   - {outlier_info['semantic_label']}: {outlier_info['count']} outliers")
            else:
                print("   - No significant outliers detected")
            
        else:
            print(f"❌ Analysis failed: {result['error']}")
    
    print("\n" + "=" * 60)
    print("🎉 Realistic Data Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_realistic_financial_data()) 
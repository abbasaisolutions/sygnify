#!/usr/bin/env python3
"""
Simple script to generate test data for Sygnify Financial module
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from test_data_generator import FinancialDataGenerator

def generate_quick_test_data():
    """Generate a quick test dataset for immediate testing"""
    print("🚀 Generating quick test dataset for Sygnify Financial module...")
    
    # Initialize generator
    generator = FinancialDataGenerator(seed=42)
    
    # Generate a medium-sized dataset for quick testing
    print("\n📊 Generating medium test dataset (10,000 rows)...")
    df = generator.generate_comprehensive_financial_dataset(rows=10000)
    
    # Save the dataset
    filepath = generator.save_dataset(df, "sygnify_quick_test_data")
    
    print(f"\n✅ Quick test dataset ready!")
    print(f"📁 File: {filepath}")
    print(f"📊 Upload this file to test your Sygnify Financial module!")
    
    return filepath

def generate_full_test_suite():
    """Generate a complete test suite with multiple dataset sizes"""
    print("🚀 Generating complete test suite for Sygnify Financial module...")
    
    # Initialize generator
    generator = FinancialDataGenerator(seed=42)
    
    # Generate different sized datasets
    test_sizes = [
        (1000, "small"),
        (10000, "medium"), 
        (50000, "large"),
        (100000, "comprehensive")
    ]
    
    generated_files = []
    
    for rows, size_name in test_sizes:
        print(f"\n📊 Generating {size_name} dataset ({rows:,} rows)...")
        df = generator.generate_comprehensive_financial_dataset(rows=rows)
        filepath = generator.save_dataset(df, f"sygnify_{size_name}_test_data")
        generated_files.append(filepath)
        
        # Generate summary for the dataset
        summary = generator.generate_dataset_summary(df)
        print(f"✅ {size_name} dataset complete: {summary}")
    
    print(f"\n🎉 Complete test suite generated!")
    print(f"📁 Generated files:")
    for filepath in generated_files:
        print(f"  - {filepath}")
    
    return generated_files

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate test data for Sygnify Financial module')
    parser.add_argument('--quick', action='store_true', help='Generate quick test dataset (10k rows)')
    parser.add_argument('--full', action='store_true', help='Generate full test suite (multiple sizes)')
    
    args = parser.parse_args()
    
    if args.quick:
        generate_quick_test_data()
    elif args.full:
        generate_full_test_suite()
    else:
        # Default: generate quick test
        print("🔧 No arguments provided. Generating quick test dataset...")
        generate_quick_test_data() 
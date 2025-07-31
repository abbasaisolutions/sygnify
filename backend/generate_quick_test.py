#!/usr/bin/env python3
"""
Quick test data generator for Sygnify Financial module
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_quick_test_data():
    """Generate a quick test dataset for immediate testing"""
    print("🚀 Generating quick test dataset for Sygnify Financial module...")
    
    # Generate 1000 rows of realistic financial data
    rows = 1000
    dates = [datetime.now() - timedelta(days=i) for i in range(rows)]
    
    # Create realistic financial data
    np.random.seed(42)
    
    df = pd.DataFrame({
        'Date': dates,
        'Company_ID': [f"COMP_{i:04d}" for i in range(1, rows + 1)],
        'Region': np.random.choice(['North America', 'Europe', 'Asia Pacific'], rows),
        'Industry': np.random.choice(['Technology', 'Finance', 'Healthcare'], rows),
        'Revenue': np.random.normal(50000, 15000, rows),
        'Expenses': np.random.normal(35000, 10000, rows),
        'Profit': np.random.normal(15000, 5000, rows),
        'Cash_Flow': np.random.normal(12000, 3000, rows),
        'Profit_Margin': np.random.normal(30, 5, rows),
        'EBITDA': np.random.normal(8000, 2000, rows),
        'Working_Capital': np.random.normal(15000, 3000, rows),
        'Debt_to_Equity': np.random.beta(2, 5, rows) * 2,
        'Current_Ratio': np.random.normal(1.5, 0.3, rows),
        'ROE': np.random.normal(12, 4, rows),
        'ROA': np.random.normal(8, 3, rows),
        'Market_Index': np.random.normal(125, 15, rows),
        'Interest_Rate': np.random.normal(3, 0.6, rows),
        'Inflation_Rate': np.random.normal(2.5, 0.5, rows),
        'Employee_Count': np.random.normal(500, 22, rows).astype(int),
        'Customer_Count': np.random.normal(10000, 100, rows).astype(int),
        'Customer_Satisfaction': np.random.normal(4.2, 0.3, rows),
        'Credit_Score': np.random.normal(700, 50, rows),
        'Revenue_Forecast': np.random.normal(1, 0.05, rows),
        'Expense_Forecast': np.random.normal(1, 0.03, rows)
    })
    
    # Add some missing values for data quality testing
    missing_columns = ['Customer_Satisfaction', 'Credit_Score']
    for col in missing_columns:
        missing_mask = np.random.random(rows) < 0.02  # 2% missing
        df.loc[missing_mask, col] = np.nan
    
    # Add some outliers
    outlier_columns = ['Revenue', 'Expenses', 'Profit']
    for col in outlier_columns:
        outlier_mask = np.random.random(rows) < 0.01  # 1% outliers
        outlier_count = sum(outlier_mask)
        if outlier_count > 0:
            multiplier = np.random.uniform(2, 5, outlier_count)
            df.loc[outlier_mask, col] = df.loc[outlier_mask, col] * multiplier
    
    # Save the dataset
    filename = "sygnify_quick_test_data.csv"
    df.to_csv(filename, index=False)
    
    print(f"✅ Quick test dataset ready!")
    print(f"📁 File: {filename}")
    print(f"📊 Rows: {len(df):,}")
    print(f"📊 Columns: {len(df.columns)}")
    print(f"📊 File size: {df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB")
    print(f"📊 Upload this file to test your enhanced Sygnify Financial module!")
    
    return filename

if __name__ == "__main__":
    generate_quick_test_data() 
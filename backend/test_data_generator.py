#!/usr/bin/env python3
"""
Sygnify Financial Data Generator
Generates comprehensive financial datasets to test all module capabilities
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json
import os

class FinancialDataGenerator:
    def __init__(self, seed=42):
        """Initialize the data generator with a seed for reproducibility"""
        np.random.seed(seed)
        random.seed(seed)
        self.seed = seed
        
    def generate_comprehensive_financial_dataset(self, rows=100000, start_date='2020-01-01'):
        """
        Generate a comprehensive financial dataset with multiple scenarios
        """
        print(f"🎯 Generating comprehensive financial dataset with {rows:,} rows...")
        
        # Generate date range
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        dates = [start_dt + timedelta(days=i) for i in range(rows)]
        
        # Initialize DataFrame
        df = pd.DataFrame({
            'Date': dates,
            'Company_ID': [f"COMP_{i:06d}" for i in range(1, rows + 1)],
            'Region': np.random.choice(['North America', 'Europe', 'Asia Pacific', 'Latin America'], rows),
            'Industry': np.random.choice(['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'], rows)
        })
        
        print("💰 Generating core financial metrics...")
        # Core financial metrics with realistic correlations
        base_revenue = np.random.normal(50000, 15000, rows)
        revenue_trend = np.linspace(0, 0.2, rows)  # 20% growth over time
        df['Revenue'] = base_revenue * (1 + revenue_trend + np.random.normal(0, 0.05, rows))
        
        # Expenses correlated with revenue
        expense_ratio = np.random.normal(0.65, 0.1, rows)
        df['Expenses'] = df['Revenue'] * expense_ratio
        
        # Profit calculation
        df['Profit'] = df['Revenue'] - df['Expenses']
        df['Profit_Margin'] = (df['Profit'] / df['Revenue']) * 100
        
        # Cash flow with some lag
        df['Cash_Flow'] = df['Profit'] * np.random.normal(0.8, 0.2, rows)
        
        print("📈 Generating advanced financial metrics...")
        # Advanced financial metrics
        df['EBITDA'] = df['Profit'] + np.random.normal(5000, 2000, rows)
        df['Working_Capital'] = np.random.normal(15000, 3000, rows)
        df['Debt_to_Equity'] = np.random.beta(2, 5, rows) * 2  # 0-2 range
        df['Current_Ratio'] = np.random.normal(1.5, 0.3, rows)
        df['ROE'] = np.random.normal(12, 4, rows)
        df['ROA'] = np.random.normal(8, 3, rows)
        
        print("🌍 Generating market factors...")
        # Market and economic factors
        df['Market_Index'] = np.random.normal(125, 15, rows)
        df['Interest_Rate'] = np.random.normal(3, 0.6, rows)
        df['Inflation_Rate'] = np.random.normal(2.5, 0.5, rows)
        df['Exchange_Rate'] = np.random.normal(1, 0.05, rows)
        df['Market_Volatility'] = np.random.exponential(1, rows)
        
        print("⚙️ Generating operational metrics...")
        # Operational metrics
        df['Employee_Count'] = np.random.normal(500, 22, rows).astype(int)
        df['Employee_Turnover_Rate'] = np.random.exponential(4, rows)
        df['Customer_Count'] = np.random.normal(10000, 100, rows).astype(int)
        df['Customer_Satisfaction'] = np.random.normal(4.2, 0.3, rows)
        df['Operational_Efficiency'] = np.random.normal(0.85, 0.05, rows)
        df['Inventory_Turnover'] = np.random.normal(8, 2, rows)
        
        print("⚠️ Generating risk metrics...")
        # Risk and compliance metrics
        df['Credit_Score'] = np.random.normal(700, 50, rows)
        df['Default_Probability'] = np.random.beta(1, 100, rows)
        df['VaR_95'] = np.random.beta(1, 50, rows)
        df['Operational_Risk_Score'] = np.random.normal(0.05, 0.02, rows)
        df['Compliance_Score'] = np.random.normal(0.95, 0.03, rows)
        
        print("🔮 Generating forecasting metrics...")
        # Forecasting and prediction metrics
        df['Revenue_Forecast'] = df['Revenue'] * np.random.normal(1, 0.05, rows)
        df['Expense_Forecast'] = df['Expenses'] * np.random.normal(1, 0.03, rows)
        df['Forecast_Confidence'] = np.random.normal(0.85, 0.1, rows)
        df['Prediction_Accuracy'] = np.random.normal(0.88, 0.05, rows)
        
        print("🔍 Adding data quality test scenarios...")
        # Add some missing values for data quality testing
        missing_columns = ['Customer_Satisfaction', 'Compliance_Score', 'Prediction_Accuracy']
        for col in missing_columns:
            missing_mask = np.random.random(rows) < 0.02  # 2% missing
            df.loc[missing_mask, col] = np.nan
        
        # Add some outliers for anomaly detection testing
        outlier_columns = ['Revenue', 'Expenses', 'Profit']
        for col in outlier_columns:
            outlier_mask = np.random.random(rows) < 0.01  # 1% outliers
            outlier_count = sum(outlier_mask)
            if outlier_count > 0:
                multiplier = np.random.uniform(2, 5, outlier_count)
                df.loc[outlier_mask, col] = df.loc[outlier_mask, col] * multiplier
        
        # Ensure Company_ID is string type
        string_mask = df['Company_ID'].str.contains(r'^\d+$', na=False)
        if string_mask.any():
            df.loc[string_mask, 'Company_ID'] = df.loc[string_mask, 'Company_ID'].astype(str)
        
        print(f"✅ Generated dataset with {len(df):,} rows and {len(df.columns)} columns")
        return df
    
    def save_dataset(self, df, filename_prefix):
        """Save dataset to CSV file"""
        filename = f"{filename_prefix}.csv"
        df.to_csv(filename, index=False)
        
        # Get file size
        file_size = os.path.getsize(filename) / (1024 * 1024)  # MB
        
        print(f"💾 Dataset saved to: {filename}")
        print(f"📏 File size: {file_size:.2f} MB")
        
        return filename
    
    def generate_dataset_summary(self, df):
        """Generate comprehensive dataset summary"""
        print("📊 DATASET SUMMARY")
        print("=" * 50)
        print(f"Rows: {len(df):,}")
        print(f"Columns: {len(df.columns)}")
        print(f"Memory usage: {df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB")
        
        print("\n📈 NUMERIC COLUMNS SUMMARY:")
        numeric_cols = df.select_dtypes(include=['number']).columns
        
        for col in numeric_cols:
            if col in df.columns:
                stats = df[col].describe()
                missing = df[col].isnull().sum()
                print(f"  {col}:")
                print(f"    Mean: {stats['mean']:.2f}")
                print(f"    Std: {stats['std']:.2f}")
                print(f"    Min: {stats['min']:.2f}")
                print(f"    Max: {stats['max']:.2f}")
                print(f"    Missing: {missing}")
        
        # Correlation analysis
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            high_correlations = []
            
            for i in range(len(numeric_cols)):
                for j in range(i+1, len(numeric_cols)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.7:
                        high_correlations.append({
                            'col1': numeric_cols[i],
                            'col2': numeric_cols[j],
                            'correlation': corr_val
                        })
            
            if high_correlations:
                print(f"\n🔗 CORRELATION ANALYSIS:")
                print(f"  Found {len(high_correlations)} high correlations (>0.7):")
                for corr in high_correlations:
                    print(f"    {corr['col1']} ↔ {corr['col2']}: {corr['correlation']:.3f}")
        
        # Return summary dict
        summary = {
            'rows': len(df),
            'columns': len(df.columns),
            'numeric_columns': len(numeric_cols),
            'missing_values': df.isnull().sum().sum(),
            'high_correlations': len(high_correlations) if 'high_correlations' in locals() else 0
        }
        
        print(f"✅ dataset complete: {summary}")
        return summary

def main():
    """Main function to generate test datasets"""
    generator = FinancialDataGenerator(seed=42)
    
    # Generate different sized datasets
    test_sizes = [
        (1000, "small"),
        (10000, "medium"), 
        (50000, "large"),
        (100000, "comprehensive")
    ]
    
    for rows, size_name in test_sizes:
        print(f"\n📊 Generating {size_name} dataset ({rows:,} rows)...")
        df = generator.generate_comprehensive_financial_dataset(rows=rows)
        filepath = generator.save_dataset(df, f"sygnify_{size_name}_test_data")
        
        # Generate summary for the dataset
        summary = generator.generate_dataset_summary(df)
        print(f"✅ {size_name} dataset complete: {summary}")
    
    print(f"\n🎉 Complete test suite generated!")
    print(f"📁 Generated files:")
    for rows, size_name in test_sizes:
        print(f"  - sygnify_{size_name}_test_data.csv")

if __name__ == "__main__":
    main() 
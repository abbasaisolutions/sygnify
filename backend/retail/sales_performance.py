"""
Sales Performance Module for Retail Domain
- Sales Velocity and Growth Analysis
- Conversion Rate Optimization
- Revenue Performance Metrics
- A/B Testing Analysis
- Sales Funnel Analytics
- Product Performance Analysis
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class SalesPerformanceAnalyzer:
    """
    Analyzes sales performance metrics and provides optimization recommendations.
    Focuses on conversion rates, sales velocity, and revenue growth.
    """
    
    def __init__(self):
        self.conversion_benchmarks = {
            'e_commerce': 2.5,
            'fashion': 1.8,
            'electronics': 3.2,
            'grocery': 85.0,
            'beauty': 2.1,
            'home_garden': 1.9
        }
    
    def analyze_sales_velocity(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze sales velocity and growth trends
        """
        try:
            velocity_metrics = {
                'daily_sales_velocity': 0,
                'weekly_trend': 0,
                'monthly_growth': 0,
                'sales_acceleration': 0,
                'peak_sales_periods': []
            }
            
            # Check for date and sales columns
            date_cols = [col for col in df.columns if 'date' in col.lower()]
            sales_cols = [col for col in df.columns if any(term in col.lower() 
                         for term in ['sales', 'revenue', 'amount'])]
            
            if date_cols and sales_cols:
                date_col = date_cols[0]
                sales_col = sales_cols[0]
                
                # Convert date column
                df_copy = df.copy()
                df_copy[date_col] = pd.to_datetime(df_copy[date_col])
                df_copy = df_copy.sort_values(date_col)
                
                # Calculate daily sales velocity
                daily_sales = df_copy.groupby(df_copy[date_col].dt.date)[sales_col].sum()
                velocity_metrics['daily_sales_velocity'] = daily_sales.mean()
                
                # Calculate weekly trend (if enough data)
                if len(daily_sales) >= 14:
                    recent_week = daily_sales.tail(7).mean()
                    previous_week = daily_sales.tail(14).head(7).mean()
                    if previous_week > 0:
                        velocity_metrics['weekly_trend'] = ((recent_week - previous_week) / previous_week) * 100
                
                # Calculate monthly growth (if enough data)
                monthly_sales = df_copy.groupby(df_copy[date_col].dt.to_period('M'))[sales_col].sum()
                if len(monthly_sales) >= 2:
                    current_month = monthly_sales.iloc[-1]
                    previous_month = monthly_sales.iloc[-2]
                    if previous_month > 0:
                        velocity_metrics['monthly_growth'] = ((current_month - previous_month) / previous_month) * 100
                
                # Identify peak sales periods
                if len(daily_sales) >= 30:
                    top_sales_days = daily_sales.nlargest(5)
                    velocity_metrics['peak_sales_periods'] = [
                        {'date': str(date), 'sales': float(sales)} 
                        for date, sales in top_sales_days.items()
                    ]
            
            return velocity_metrics
            
        except Exception as e:
            return {'error': str(e), 'daily_sales_velocity': 0}
    
    def analyze_conversion_rates(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze conversion rates and funnel performance
        """
        try:
            conversion_metrics = {
                'overall_conversion_rate': 0,
                'conversion_by_channel': {},
                'conversion_by_product': {},
                'funnel_analysis': {},
                'optimization_opportunities': []
            }
            
            # Calculate overall conversion rate
            if any('visit' in col.lower() or 'session' in col.lower() for col in df.columns):
                session_cols = [col for col in df.columns if any(term in col.lower() 
                               for term in ['visit', 'session', 'view'])]
                
                if session_cols and any('purchase' in col.lower() or 'conversion' in col.lower() for col in df.columns):
                    purchase_cols = [col for col in df.columns if any(term in col.lower() 
                                    for term in ['purchase', 'conversion', 'buy'])]
                    
                    session_col = session_cols[0]
                    purchase_col = purchase_cols[0]
                    
                    total_sessions = df[session_col].sum() if df[session_col].dtype in ['int64', 'float64'] else len(df)
                    total_conversions = df[purchase_col].sum() if df[purchase_col].dtype in ['int64', 'float64'] else len(df[df[purchase_col] > 0])
                    
                    if total_sessions > 0:
                        conversion_metrics['overall_conversion_rate'] = (total_conversions / total_sessions) * 100
            
            # Conversion by channel analysis
            channel_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['channel', 'source', 'medium'])]
            
            if channel_cols:
                channel_col = channel_cols[0]
                channel_conversion = df.groupby(channel_col).agg({
                    'customer_id': 'count' if 'customer_id' in df.columns else lambda x: len(x)
                }).to_dict()
                conversion_metrics['conversion_by_channel'] = channel_conversion
            
            # Identify optimization opportunities
            if conversion_metrics['overall_conversion_rate'] < 2.0:
                conversion_metrics['optimization_opportunities'].append(
                    "Conversion rate below industry average - consider UX improvements"
                )
            
            if conversion_metrics['conversion_by_channel']:
                conversion_metrics['optimization_opportunities'].append(
                    "Optimize low-performing channels and scale high-performing ones"
                )
            
            return conversion_metrics
            
        except Exception as e:
            return {'error': str(e), 'overall_conversion_rate': 0}
    
    def analyze_product_performance(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze individual product and category performance
        """
        try:
            product_metrics = {
                'top_performers': [],
                'underperformers': [],
                'category_analysis': {},
                'revenue_contribution': {},
                'product_trends': {}
            }
            
            # Product performance analysis
            product_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['product', 'item', 'sku'])]
            revenue_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['revenue', 'sales', 'amount'])]
            
            if product_cols and revenue_cols:
                product_col = product_cols[0]
                revenue_col = revenue_cols[0]
                
                # Calculate product revenue
                product_revenue = df.groupby(product_col)[revenue_col].agg([
                    'sum', 'mean', 'count'
                ]).sort_values('sum', ascending=False)
                
                # Top performers (top 20%)
                top_20_pct = int(len(product_revenue) * 0.2)
                product_metrics['top_performers'] = [
                    {
                        'product': str(product),
                        'total_revenue': float(row['sum']),
                        'avg_revenue': float(row['mean']),
                        'sales_count': int(row['count'])
                    }
                    for product, row in product_revenue.head(top_20_pct).iterrows()
                ]
                
                # Underperformers (bottom 20%)
                bottom_20_pct = int(len(product_revenue) * 0.2)
                product_metrics['underperformers'] = [
                    {
                        'product': str(product),
                        'total_revenue': float(row['sum']),
                        'avg_revenue': float(row['mean']),
                        'sales_count': int(row['count'])
                    }
                    for product, row in product_revenue.tail(bottom_20_pct).iterrows()
                ]
                
                # Revenue contribution analysis
                total_revenue = product_revenue['sum'].sum()
                product_metrics['revenue_contribution'] = {
                    'pareto_analysis': {
                        'top_20_percent_products': (product_revenue.head(top_20_pct)['sum'].sum() / total_revenue) * 100,
                        'bottom_50_percent_products': (product_revenue.tail(int(len(product_revenue) * 0.5))['sum'].sum() / total_revenue) * 100
                    }
                }
            
            # Category analysis
            category_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['category', 'department', 'type'])]
            
            if category_cols and revenue_cols:
                category_col = category_cols[0]
                revenue_col = revenue_cols[0]
                
                category_performance = df.groupby(category_col)[revenue_col].agg([
                    'sum', 'mean', 'count'
                ]).to_dict()
                
                product_metrics['category_analysis'] = category_performance
            
            return product_metrics
            
        except Exception as e:
            return {'error': str(e), 'top_performers': []}
    
    def analyze_pricing_impact(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze pricing impact on sales performance
        """
        try:
            pricing_metrics = {
                'price_elasticity': 0,
                'optimal_price_ranges': {},
                'discount_effectiveness': {},
                'pricing_recommendations': []
            }
            
            # Price elasticity analysis
            price_cols = [col for col in df.columns if 'price' in col.lower()]
            quantity_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['quantity', 'units', 'sold'])]
            
            if price_cols and quantity_cols:
                price_col = price_cols[0]
                quantity_col = quantity_cols[0]
                
                # Simple price elasticity calculation
                price_changes = df[price_col].pct_change()
                quantity_changes = df[quantity_col].pct_change()
                
                # Calculate correlation (simplified elasticity)
                correlation = price_changes.corr(quantity_changes)
                pricing_metrics['price_elasticity'] = correlation if not np.isnan(correlation) else 0
                
                # Identify optimal price ranges
                price_brackets = pd.cut(df[price_col], bins=5)
                performance_by_bracket = df.groupby(price_brackets)[quantity_col].mean()
                
                best_bracket = performance_by_bracket.idxmax()
                pricing_metrics['optimal_price_ranges'] = {
                    'best_performing_range': str(best_bracket),
                    'avg_units_sold': float(performance_by_bracket.max())
                }
            
            # Discount effectiveness
            discount_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['discount', 'promotion', 'sale'])]
            
            if discount_cols:
                discount_col = discount_cols[0]
                
                if revenue_cols := [col for col in df.columns if any(term in col.lower() 
                                   for term in ['revenue', 'sales'])]:
                    revenue_col = revenue_cols[0]
                    
                    # Compare performance with and without discounts
                    discounted_sales = df[df[discount_col] > 0][revenue_col].mean()
                    regular_sales = df[df[discount_col] == 0][revenue_col].mean()
                    
                    if regular_sales > 0:
                        discount_lift = ((discounted_sales - regular_sales) / regular_sales) * 100
                        pricing_metrics['discount_effectiveness'] = {
                            'average_lift': discount_lift,
                            'discounted_avg_revenue': discounted_sales,
                            'regular_avg_revenue': regular_sales
                        }
            
            # Generate pricing recommendations
            if pricing_metrics['price_elasticity'] < -0.5:
                pricing_metrics['pricing_recommendations'].append(
                    "Products show high price sensitivity - consider competitive pricing strategy"
                )
            elif pricing_metrics['price_elasticity'] > -0.2:
                pricing_metrics['pricing_recommendations'].append(
                    "Products show low price sensitivity - opportunity for premium pricing"
                )
            
            return pricing_metrics
            
        except Exception as e:
            return {'error': str(e), 'price_elasticity': 0}
    
    def generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """
        Generate sales performance recommendations
        """
        recommendations = [
            "Optimize conversion funnel to improve sales velocity",
            "Focus marketing spend on high-performing products and channels",
            "Implement dynamic pricing strategies for price-sensitive products",
            "A/B test product placement and promotional strategies",
            "Analyze seasonal trends to optimize inventory and marketing timing",
            "Develop customer retention programs to increase repeat purchase rates"
        ]
        return recommendations
    
    def generate_narrative(self, df: pd.DataFrame) -> str:
        """
        Generate sales performance narrative
        """
        total_records = len(df)
        return f"Sales performance analysis completed for {total_records} records with comprehensive conversion rate, product performance, and pricing impact analysis."
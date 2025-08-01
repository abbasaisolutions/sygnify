"""
Inventory Management Module for Retail Domain
- Inventory Turnover Analysis
- Stock Aging and Obsolescence Management
- ABC Analysis and Classification
- Demand Forecasting
- Safety Stock Optimization
- Reorder Point Calculation
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class InventoryManager:
    """
    Manages inventory analysis, optimization, and forecasting.
    Focuses on turnover rates, stock aging, and demand patterns.
    """
    
    def __init__(self):
        self.turnover_benchmarks = {
            'fashion': 4.0,
            'electronics': 8.0,
            'grocery': 12.0,
            'furniture': 2.5,
            'beauty': 6.0,
            'automotive': 3.0
        }
    
    def calculate_inventory_turnover(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate inventory turnover metrics and efficiency indicators
        """
        try:
            turnover_metrics = {
                'overall_turnover_rate': 0,
                'turnover_by_category': {},
                'turnover_by_product': {},
                'inventory_efficiency_score': 0,
                'slow_moving_items': []
            }
            
            # Check for required columns
            inventory_cols = [col for col in df.columns if any(term in col.lower() 
                             for term in ['inventory', 'stock', 'quantity_on_hand'])]
            sold_cols = [col for col in df.columns if any(term in col.lower() 
                        for term in ['sold', 'units_sold', 'quantity_sold'])]
            cost_cols = [col for col in df.columns if any(term in col.lower() 
                        for term in ['cost', 'cogs', 'cost_of_goods'])]
            
            if inventory_cols and sold_cols:
                inventory_col = inventory_cols[0]
                sold_col = sold_cols[0]
                
                # Calculate overall turnover rate
                total_sold = df[sold_col].sum()
                avg_inventory = df[inventory_col].mean()
                
                if avg_inventory > 0:
                    turnover_metrics['overall_turnover_rate'] = total_sold / avg_inventory
                
                # Turnover by category
                category_cols = [col for col in df.columns if any(term in col.lower() 
                                for term in ['category', 'department', 'type'])]
                
                if category_cols:
                    category_col = category_cols[0]
                    category_turnover = df.groupby(category_col).apply(
                        lambda group: group[sold_col].sum() / group[inventory_col].mean() 
                        if group[inventory_col].mean() > 0 else 0
                    ).to_dict()
                    turnover_metrics['turnover_by_category'] = category_turnover
                
                # Identify slow-moving items
                product_cols = [col for col in df.columns if any(term in col.lower() 
                               for term in ['product', 'item', 'sku'])]
                
                if product_cols:
                    product_col = product_cols[0]
                    product_turnover = df.groupby(product_col).apply(
                        lambda group: group[sold_col].sum() / group[inventory_col].mean() 
                        if group[inventory_col].mean() > 0 else 0
                    ).sort_values()
                    
                    # Bottom 20% are slow-moving
                    slow_moving_threshold = product_turnover.quantile(0.2)
                    slow_moving = product_turnover[product_turnover <= slow_moving_threshold]
                    
                    turnover_metrics['slow_moving_items'] = [
                        {'product': str(product), 'turnover_rate': float(rate)}
                        for product, rate in slow_moving.head(10).items()
                    ]
                
                # Calculate efficiency score (0-100)
                benchmark_turnover = 6.0  # Average benchmark
                efficiency_ratio = turnover_metrics['overall_turnover_rate'] / benchmark_turnover
                turnover_metrics['inventory_efficiency_score'] = min(100, efficiency_ratio * 100)
            
            return turnover_metrics
            
        except Exception as e:
            return {'error': str(e), 'overall_turnover_rate': 0}
    
    def analyze_stock_aging(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze stock aging and identify obsolete inventory
        """
        try:
            aging_metrics = {
                'aging_categories': {},
                'obsolete_inventory': [],
                'fast_moving_items': [],
                'aging_value': 0,
                'recommendations': []
            }
            
            # Check for date-related columns
            date_cols = [col for col in df.columns if any(term in col.lower() 
                        for term in ['date', 'received', 'last_movement'])]
            
            if date_cols:
                date_col = date_cols[0]
                df_copy = df.copy()
                df_copy[date_col] = pd.to_datetime(df_copy[date_col])
                current_date = datetime.now()
                
                # Calculate days since last movement
                df_copy['days_in_inventory'] = (current_date - df_copy[date_col]).dt.days
                
                # Categorize by aging
                aging_categories = {
                    '0-30 days': len(df_copy[df_copy['days_in_inventory'] <= 30]),
                    '31-60 days': len(df_copy[(df_copy['days_in_inventory'] > 30) & 
                                             (df_copy['days_in_inventory'] <= 60)]),
                    '61-90 days': len(df_copy[(df_copy['days_in_inventory'] > 60) & 
                                             (df_copy['days_in_inventory'] <= 90)]),
                    '91-180 days': len(df_copy[(df_copy['days_in_inventory'] > 90) & 
                                              (df_copy['days_in_inventory'] <= 180)]),
                    '180+ days': len(df_copy[df_copy['days_in_inventory'] > 180])
                }
                
                aging_metrics['aging_categories'] = aging_categories
                
                # Identify obsolete inventory (180+ days)
                obsolete_items = df_copy[df_copy['days_in_inventory'] > 180]
                if len(obsolete_items) > 0:
                    product_cols = [col for col in df_copy.columns if any(term in col.lower() 
                                   for term in ['product', 'item', 'sku'])]
                    value_cols = [col for col in df_copy.columns if any(term in col.lower() 
                                 for term in ['value', 'cost', 'amount'])]
                    
                    if product_cols:
                        product_col = product_cols[0]
                        aging_metrics['obsolete_inventory'] = [
                            {
                                'product': str(row[product_col]),
                                'days_in_inventory': int(row['days_in_inventory']),
                                'value': float(row[value_cols[0]]) if value_cols else 0
                            }
                            for _, row in obsolete_items.head(10).iterrows()
                        ]
                
                # Identify fast-moving items (0-30 days)
                fast_moving = df_copy[df_copy['days_in_inventory'] <= 30]
                if len(fast_moving) > 0 and product_cols:
                    product_col = product_cols[0]
                    aging_metrics['fast_moving_items'] = list(
                        fast_moving[product_col].value_counts().head(10).index
                    )
                
                # Calculate total aging value
                if value_cols and len(obsolete_items) > 0:
                    value_col = value_cols[0]
                    aging_metrics['aging_value'] = float(obsolete_items[value_col].sum())
                
                # Generate recommendations
                obsolete_percentage = (len(obsolete_items) / len(df_copy)) * 100
                if obsolete_percentage > 10:
                    aging_metrics['recommendations'].append(
                        "High percentage of obsolete inventory - implement clearance strategies"
                    )
                
                if aging_categories['180+ days'] > aging_categories['0-30 days']:
                    aging_metrics['recommendations'].append(
                        "Inventory aging pattern suggests demand forecasting improvements needed"
                    )
            
            return aging_metrics
            
        except Exception as e:
            return {'error': str(e), 'aging_categories': {}}
    
    def perform_abc_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform ABC analysis for inventory classification
        """
        try:
            abc_analysis = {
                'a_items': {'count': 0, 'revenue_percentage': 0, 'items': []},
                'b_items': {'count': 0, 'revenue_percentage': 0, 'items': []},
                'c_items': {'count': 0, 'revenue_percentage': 0, 'items': []},
                'classification_summary': {}
            }
            
            # Check for required columns
            product_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['product', 'item', 'sku'])]
            revenue_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['revenue', 'sales', 'amount'])]
            
            if product_cols and revenue_cols:
                product_col = product_cols[0]
                revenue_col = revenue_cols[0]
                
                # Calculate revenue per product
                product_revenue = df.groupby(product_col)[revenue_col].sum().sort_values(ascending=False)
                total_revenue = product_revenue.sum()
                
                # Calculate cumulative percentages
                cumulative_percentage = (product_revenue.cumsum() / total_revenue) * 100
                
                # Classify items
                a_items = product_revenue[cumulative_percentage <= 80].index
                b_items = product_revenue[(cumulative_percentage > 80) & (cumulative_percentage <= 95)].index
                c_items = product_revenue[cumulative_percentage > 95].index
                
                # Calculate metrics for each category
                a_revenue = product_revenue[a_items].sum()
                b_revenue = product_revenue[b_items].sum()
                c_revenue = product_revenue[c_items].sum()
                
                abc_analysis['a_items'] = {
                    'count': len(a_items),
                    'revenue_percentage': (a_revenue / total_revenue) * 100,
                    'items': list(a_items[:10])  # Top 10 A items
                }
                
                abc_analysis['b_items'] = {
                    'count': len(b_items),
                    'revenue_percentage': (b_revenue / total_revenue) * 100,
                    'items': list(b_items[:10])  # Top 10 B items
                }
                
                abc_analysis['c_items'] = {
                    'count': len(c_items),
                    'revenue_percentage': (c_revenue / total_revenue) * 100,
                    'items': list(c_items[:10])  # Top 10 C items
                }
                
                abc_analysis['classification_summary'] = {
                    'total_products': len(product_revenue),
                    'a_item_percentage': (len(a_items) / len(product_revenue)) * 100,
                    'b_item_percentage': (len(b_items) / len(product_revenue)) * 100,
                    'c_item_percentage': (len(c_items) / len(product_revenue)) * 100
                }
            
            return abc_analysis
            
        except Exception as e:
            return {'error': str(e), 'a_items': {'count': 0}}
    
    def forecast_demand(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform basic demand forecasting analysis
        """
        try:
            demand_forecast = {
                'seasonal_patterns': {},
                'trend_analysis': {},
                'demand_volatility': {},
                'forecasting_accuracy': 0,
                'reorder_recommendations': []
            }
            
            # Check for date and sales columns
            date_cols = [col for col in df.columns if 'date' in col.lower()]
            sales_cols = [col for col in df.columns if any(term in col.lower() 
                         for term in ['sold', 'sales', 'quantity', 'demand'])]
            
            if date_cols and sales_cols:
                date_col = date_cols[0]
                sales_col = sales_cols[0]
                
                df_copy = df.copy()
                df_copy[date_col] = pd.to_datetime(df_copy[date_col])
                
                # Seasonal analysis
                df_copy['month'] = df_copy[date_col].dt.month
                monthly_demand = df_copy.groupby('month')[sales_col].mean()
                
                demand_forecast['seasonal_patterns'] = {
                    'high_demand_months': list(monthly_demand.nlargest(3).index),
                    'low_demand_months': list(monthly_demand.nsmallest(3).index),
                    'seasonal_variation': float(monthly_demand.std() / monthly_demand.mean()) if monthly_demand.mean() > 0 else 0
                }
                
                # Trend analysis
                if len(df_copy) >= 30:  # Need sufficient data for trend
                    daily_demand = df_copy.groupby(df_copy[date_col].dt.date)[sales_col].sum()
                    
                    # Simple linear trend
                    x = np.arange(len(daily_demand))
                    y = daily_demand.values
                    
                    if len(x) > 1:
                        slope = np.polyfit(x, y, 1)[0]
                        demand_forecast['trend_analysis'] = {
                            'trend_direction': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable',
                            'trend_strength': abs(slope),
                            'daily_change': slope
                        }
                
                # Demand volatility
                daily_demand = df_copy.groupby(df_copy[date_col].dt.date)[sales_col].sum()
                if len(daily_demand) > 1:
                    volatility = daily_demand.std() / daily_demand.mean() if daily_demand.mean() > 0 else 0
                    demand_forecast['demand_volatility'] = {
                        'coefficient_of_variation': volatility,
                        'volatility_level': 'high' if volatility > 0.5 else 'medium' if volatility > 0.2 else 'low'
                    }
                
                # Generate reorder recommendations
                avg_daily_demand = daily_demand.mean() if len(daily_demand) > 0 else 0
                lead_time = 7  # Assume 7-day lead time
                
                demand_forecast['reorder_recommendations'] = [
                    f"Maintain safety stock for {lead_time * 1.5} days of average demand",
                    f"Reorder when inventory drops below {avg_daily_demand * lead_time * 1.2:.0f} units",
                    "Monitor seasonal patterns for demand planning",
                    "Implement automated reorder points for high-velocity items"
                ]
            
            return demand_forecast
            
        except Exception as e:
            return {'error': str(e), 'seasonal_patterns': {}}
    
    def optimize_safety_stock(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate optimal safety stock levels
        """
        try:
            safety_stock = {
                'recommended_levels': {},
                'service_level_analysis': {},
                'optimization_opportunities': [],
                'cost_impact': {}
            }
            
            # Basic safety stock calculation using demand variability
            sales_cols = [col for col in df.columns if any(term in col.lower() 
                         for term in ['sold', 'sales', 'quantity'])]
            
            if sales_cols:
                sales_col = sales_cols[0]
                
                # Calculate demand statistics
                avg_demand = df[sales_col].mean()
                std_demand = df[sales_col].std()
                
                # Safety stock for different service levels
                service_levels = {
                    '90%': 1.28 * std_demand,
                    '95%': 1.65 * std_demand,
                    '99%': 2.33 * std_demand
                }
                
                safety_stock['recommended_levels'] = {
                    level: float(stock) for level, stock in service_levels.items()
                }
                
                # Service level analysis
                current_stock = df.get('inventory', df.get('stock', pd.Series([0]))).mean()
                
                safety_stock['service_level_analysis'] = {
                    'current_stock_level': float(current_stock),
                    'recommended_95_percent': float(avg_demand + service_levels['95%']),
                    'improvement_needed': float(max(0, (avg_demand + service_levels['95%']) - current_stock))
                }
                
                # Optimization opportunities
                if std_demand / avg_demand > 0.3:  # High variability
                    safety_stock['optimization_opportunities'].append(
                        "High demand variability suggests need for dynamic safety stock levels"
                    )
                
                if current_stock > avg_demand + service_levels['99%']:
                    safety_stock['optimization_opportunities'].append(
                        "Current stock levels appear excessive - opportunity to reduce carrying costs"
                    )
                elif current_stock < avg_demand + service_levels['90%']:
                    safety_stock['optimization_opportunities'].append(
                        "Current stock levels may be insufficient - risk of stockouts"
                    )
            
            return safety_stock
            
        except Exception as e:
            return {'error': str(e), 'recommended_levels': {}}
    
    def generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """
        Generate inventory management recommendations
        """
        recommendations = [
            "Implement ABC analysis for prioritized inventory management",
            "Establish automated reorder points based on demand patterns",
            "Optimize safety stock levels to balance service and costs",
            "Address slow-moving and obsolete inventory through promotions",
            "Improve demand forecasting accuracy with historical data analysis",
            "Monitor inventory turnover rates by category for optimization opportunities"
        ]
        return recommendations
    
    def generate_narrative(self, df: pd.DataFrame) -> str:
        """
        Generate inventory management narrative
        """
        total_items = len(df)
        return f"Inventory management analysis completed for {total_items} items with comprehensive turnover, aging, ABC classification, and demand forecasting insights."
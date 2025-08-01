"""
Retail KPI Service for Sygnify Analytics Platform
Comprehensive retail analytics with domain-specific intelligence
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

# Import retail domain modules
from retail import CustomerAnalyzer, SalesPerformanceAnalyzer, InventoryManager, SupplyChainAnalyzer, RetailKPICalculator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RetailKPIService:
    """
    Comprehensive retail KPI service providing domain-specific analytics
    """
    
    def __init__(self):
        self.customer_analyzer = CustomerAnalyzer()
        self.sales_analyzer = SalesPerformanceAnalyzer()
        self.inventory_manager = InventoryManager()
        self.supply_chain_analyzer = SupplyChainAnalyzer()
        self.kpi_calculator = RetailKPICalculator()
    
    def calculate_retail_kpis(self, data: pd.DataFrame, domain: str = "retail") -> Dict[str, Any]:
        """
        Calculate comprehensive retail KPIs
        """
        try:
            logger.info(f"Starting retail KPI calculation for {len(data)} records")
            
            # Core retail KPIs
            retail_kpis = self.kpi_calculator.calculate_retail_kpis(data, domain)
            
            # Customer analytics
            customer_metrics = {
                'clv_analysis': self.customer_analyzer.calculate_clv(data),
                'rfm_analysis': self.customer_analyzer.perform_rfm_analysis(data),
                'churn_analysis': self.customer_analyzer.analyze_customer_churn(data)
            }
            
            # Sales performance
            sales_metrics = {
                'sales_velocity': self.sales_analyzer.analyze_sales_velocity(data),
                'conversion_rates': self.sales_analyzer.analyze_conversion_rates(data),
                'product_performance': self.sales_analyzer.analyze_product_performance(data),
                'pricing_impact': self.sales_analyzer.analyze_pricing_impact(data)
            }
            
            # Inventory management
            inventory_metrics = {
                'turnover_analysis': self.inventory_manager.calculate_inventory_turnover(data),
                'stock_aging': self.inventory_manager.analyze_stock_aging(data),
                'abc_analysis': self.inventory_manager.perform_abc_analysis(data),
                'demand_forecast': self.inventory_manager.forecast_demand(data),
                'safety_stock': self.inventory_manager.optimize_safety_stock(data)
            }
            
            # Supply chain analytics
            supply_chain_metrics = {
                'supplier_performance': self.supply_chain_analyzer.analyze_supplier_performance(data),
                'logistics_performance': self.supply_chain_analyzer.analyze_logistics_performance(data),
                'cost_analysis': self.supply_chain_analyzer.analyze_supply_chain_costs(data),
                'risk_assessment': self.supply_chain_analyzer.assess_supply_chain_risks(data)
            }
            
            # Combine all metrics
            comprehensive_kpis = {
                'domain': domain,
                'analysis_timestamp': datetime.now().isoformat(),
                'data_summary': {
                    'total_records': len(data),
                    'date_range': self._get_date_range(data),
                    'categories': self._get_categories(data),
                    'suppliers': self._get_suppliers(data)
                },
                'retail_kpis': retail_kpis,
                'customer_analytics': customer_metrics,
                'sales_performance': sales_metrics,
                'inventory_management': inventory_metrics,
                'supply_chain': supply_chain_metrics,
                'overall_health_score': self._calculate_overall_health_score(retail_kpis, customer_metrics, sales_metrics)
            }
            
            logger.info("Retail KPI calculation completed successfully")
            return comprehensive_kpis
            
        except Exception as e:
            logger.error(f"Error calculating retail KPIs: {e}")
            return {'error': str(e), 'domain': domain}
    
    def generate_ml_prompts(self, data: pd.DataFrame, domain: str = "retail") -> List[str]:
        """
        Generate retail-specific ML analysis prompts
        """
        prompts = []
        
        # Basic data insights
        prompts.append(f"Analyze retail performance data for {len(data)} transactions")
        
        # Customer insights
        if 'customer_id' in data.columns:
            unique_customers = data['customer_id'].nunique()
            prompts.append(f"Perform customer segmentation analysis for {unique_customers} unique customers")
        
        # Sales analysis
        if any(col in data.columns for col in ['total_revenue', 'quantity_sold']):
            prompts.append("Analyze sales trends and identify top-performing products")
        
        # Inventory insights
        if 'inventory_on_hand' in data.columns:
            prompts.append("Evaluate inventory turnover and identify slow-moving items")
        
        # Supplier analysis
        if 'supplier' in data.columns:
            supplier_count = data['supplier'].nunique()
            prompts.append(f"Assess supplier performance across {supplier_count} vendors")
        
        # Profitability analysis
        if all(col in data.columns for col in ['total_revenue', 'cost_per_unit']):
            prompts.append("Calculate profitability metrics and identify high-margin opportunities")
        
        return prompts
    
    def generate_risk_assessment(self, data: pd.DataFrame, domain: str = "retail") -> Dict[str, Any]:
        """
        Generate retail-specific risk assessment
        """
        risks = {
            'inventory_risks': [],
            'customer_risks': [],
            'supplier_risks': [],
            'operational_risks': [],
            'overall_risk_level': 'Medium'
        }
        
        try:
            # Inventory risks
            if 'inventory_on_hand' in data.columns and 'quantity_sold' in data.columns:
                avg_inventory = data['inventory_on_hand'].mean()
                avg_sold = data['quantity_sold'].mean()
                
                if avg_inventory > avg_sold * 90:  # 90 days of inventory
                    risks['inventory_risks'].append("High inventory levels - risk of obsolescence")
                
                if avg_inventory < avg_sold * 7:  # Less than 7 days
                    risks['inventory_risks'].append("Low inventory levels - stockout risk")
            
            # Customer concentration risk
            if 'customer_id' in data.columns and 'total_revenue' in data.columns:
                customer_revenue = data.groupby('customer_id')['total_revenue'].sum()
                top_customer_share = customer_revenue.max() / customer_revenue.sum()
                
                if top_customer_share > 0.2:
                    risks['customer_risks'].append("High customer concentration - dependency risk")
            
            # Supplier concentration risk
            if 'supplier' in data.columns:
                supplier_counts = data['supplier'].value_counts(normalize=True)
                if supplier_counts.iloc[0] > 0.5:
                    risks['supplier_risks'].append("High supplier concentration - supply chain risk")
            
            # Quality risks
            if 'quality_score' in data.columns:
                avg_quality = data['quality_score'].mean()
                if avg_quality < 95:
                    risks['operational_risks'].append("Quality issues detected - customer satisfaction risk")
            
            # Calculate overall risk level
            total_risks = sum(len(risk_list) for risk_list in risks.values() if isinstance(risk_list, list))
            if total_risks >= 4:
                risks['overall_risk_level'] = 'High'
            elif total_risks >= 2:
                risks['overall_risk_level'] = 'Medium'
            else:
                risks['overall_risk_level'] = 'Low'
                
        except Exception as e:
            logger.error(f"Error in risk assessment: {e}")
            risks['error'] = str(e)
        
        return risks
    
    def generate_recommendations(self, data: pd.DataFrame, domain: str = "retail") -> List[str]:
        """
        Generate retail-specific recommendations
        """
        recommendations = []
        
        try:
            # Customer recommendations
            if 'customer_id' in data.columns:
                repeat_customers = data['customer_id'].value_counts()
                repeat_rate = len(repeat_customers[repeat_customers > 1]) / len(repeat_customers)
                
                if repeat_rate < 0.3:
                    recommendations.append("Implement customer retention programs to increase repeat purchases")
            
            # Inventory recommendations
            if 'inventory_on_hand' in data.columns and 'quantity_sold' in data.columns:
                inventory_turnover = data['quantity_sold'].sum() / data['inventory_on_hand'].mean()
                
                if inventory_turnover < 4:
                    recommendations.append("Optimize inventory levels to improve turnover ratio")
                elif inventory_turnover > 12:
                    recommendations.append("Consider increasing safety stock to prevent stockouts")
            
            # Sales recommendations
            if 'channel' in data.columns and 'total_revenue' in data.columns:
                channel_performance = data.groupby('channel')['total_revenue'].mean()
                best_channel = channel_performance.idxmax()
                recommendations.append(f"Focus marketing efforts on {best_channel} channel for higher revenue")
            
            # Supplier recommendations
            if 'supplier' in data.columns and 'quality_score' in data.columns:
                supplier_quality = data.groupby('supplier')['quality_score'].mean()
                poor_suppliers = supplier_quality[supplier_quality < 95]
                
                if len(poor_suppliers) > 0:
                    recommendations.append("Review and improve relationships with underperforming suppliers")
            
            # Profitability recommendations
            if all(col in data.columns for col in ['total_revenue', 'cost_per_unit', 'quantity_sold']):
                data_copy = data.copy()
                data_copy['profit'] = data_copy['total_revenue'] - (data_copy['cost_per_unit'] * data_copy['quantity_sold'])
                data_copy['margin'] = data_copy['profit'] / data_copy['total_revenue']
                
                if data_copy['margin'].mean() < 0.3:
                    recommendations.append("Review pricing strategy to improve profit margins")
            
            # Add general retail recommendations
            recommendations.extend([
                "Implement data-driven demand forecasting for better inventory planning",
                "Develop customer segmentation strategies for targeted marketing",
                "Monitor seasonal trends for optimized product placement",
                "Establish KPI dashboards for real-time performance tracking"
            ])
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            recommendations.append("Review data quality and completeness for better insights")
        
        return recommendations[:10]  # Limit to top 10 recommendations
    
    def _get_date_range(self, data: pd.DataFrame) -> Dict[str, str]:
        """Get date range from data"""
        date_cols = [col for col in data.columns if 'date' in col.lower()]
        
        if date_cols:
            date_col = date_cols[0]
            try:
                dates = pd.to_datetime(data[date_col])
                return {
                    'start_date': dates.min().strftime('%Y-%m-%d'),
                    'end_date': dates.max().strftime('%Y-%m-%d'),
                    'days_span': (dates.max() - dates.min()).days
                }
            except:
                pass
        
        return {'start_date': 'N/A', 'end_date': 'N/A', 'days_span': 0}
    
    def _get_categories(self, data: pd.DataFrame) -> List[str]:
        """Get product categories from data"""
        if 'category' in data.columns:
            return data['category'].unique().tolist()[:10]  # Top 10 categories
        return []
    
    def _get_suppliers(self, data: pd.DataFrame) -> List[str]:
        """Get suppliers from data"""
        if 'supplier' in data.columns:
            return data['supplier'].unique().tolist()[:10]  # Top 10 suppliers
        return []
    
    def _calculate_overall_health_score(self, retail_kpis: Dict, customer_metrics: Dict, sales_metrics: Dict) -> int:
        """Calculate overall retail health score"""
        try:
            score = 70  # Base score
            
            # Retail health score from KPI calculator
            if 'retail_health_score' in retail_kpis:
                score = retail_kpis['retail_health_score']
            
            # Adjust based on customer metrics
            if 'churn_analysis' in customer_metrics:
                churn_rate = customer_metrics['churn_analysis'].get('churn_rate', 0.15)
                if churn_rate < 0.10:
                    score += 5
                elif churn_rate > 0.25:
                    score -= 10
            
            # Adjust based on sales performance
            if 'conversion_rates' in sales_metrics:
                conversion_rate = sales_metrics['conversion_rates'].get('overall_conversion_rate', 0)
                if conversion_rate > 3.0:
                    score += 5
                elif conversion_rate < 1.0:
                    score -= 5
            
            return max(0, min(100, int(score)))
            
        except Exception as e:
            logger.error(f"Error calculating health score: {e}")
            return 70

# Create global instance
retail_kpi_service = RetailKPIService()
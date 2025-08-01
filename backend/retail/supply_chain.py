"""
Supply Chain Analytics Module for Retail Domain
- Supplier Performance Analysis
- Lead Time Optimization
- Cost Analysis and Management
- Logistics Performance Metrics
- Supply Chain Risk Assessment
- Vendor Relationship Management
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class SupplyChainAnalyzer:
    """
    Analyzes supply chain performance, supplier metrics, and logistics efficiency.
    Focuses on cost optimization, delivery performance, and risk management.
    """
    
    def __init__(self):
        self.performance_benchmarks = {
            'on_time_delivery': 95.0,  # Target percentage
            'lead_time_variability': 0.2,  # Target coefficient of variation
            'supplier_quality': 98.0,  # Target quality percentage
            'cost_variance': 0.05  # Target cost variance
        }
    
    def analyze_supplier_performance(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze supplier performance metrics and relationships
        """
        try:
            supplier_metrics = {
                'supplier_rankings': [],
                'performance_summary': {},
                'quality_analysis': {},
                'delivery_performance': {},
                'cost_analysis': {}
            }
            
            # Check for supplier-related columns
            supplier_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['supplier', 'vendor', 'provider'])]
            
            if supplier_cols:
                supplier_col = supplier_cols[0]
                
                # Delivery performance analysis
                delivery_cols = [col for col in df.columns if any(term in col.lower() 
                               for term in ['delivery', 'shipped', 'received'])]
                
                if delivery_cols:
                    # On-time delivery rate by supplier
                    if any('on_time' in col.lower() for col in df.columns):
                        on_time_col = [col for col in df.columns if 'on_time' in col.lower()][0]
                        on_time_by_supplier = df.groupby(supplier_col)[on_time_col].mean() * 100
                        supplier_metrics['delivery_performance'] = on_time_by_supplier.to_dict()
                    
                    # Lead time analysis
                    if any('lead_time' in col.lower() for col in df.columns):
                        lead_time_col = [col for col in df.columns if 'lead_time' in col.lower()][0]
                        lead_time_stats = df.groupby(supplier_col)[lead_time_col].agg([
                            'mean', 'std', 'min', 'max'
                        ])
                        
                        supplier_metrics['delivery_performance']['lead_time_analysis'] = {
                            supplier: {
                                'avg_lead_time': float(stats['mean']),
                                'lead_time_variance': float(stats['std']),
                                'min_lead_time': float(stats['min']),
                                'max_lead_time': float(stats['max'])
                            }
                            for supplier, stats in lead_time_stats.iterrows()
                        }
                
                # Quality analysis
                quality_cols = [col for col in df.columns if any(term in col.lower() 
                               for term in ['quality', 'defect', 'return'])]
                
                if quality_cols:
                    quality_col = quality_cols[0]
                    
                    if 'defect' in quality_col.lower() or 'return' in quality_col.lower():
                        # Lower is better for defects/returns
                        quality_by_supplier = (1 - df.groupby(supplier_col)[quality_col].mean()) * 100
                    else:
                        # Higher is better for quality scores
                        quality_by_supplier = df.groupby(supplier_col)[quality_col].mean()
                    
                    supplier_metrics['quality_analysis'] = quality_by_supplier.to_dict()
                
                # Cost analysis
                cost_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['cost', 'price', 'amount'])]
                
                if cost_cols:
                    cost_col = cost_cols[0]
                    cost_by_supplier = df.groupby(supplier_col)[cost_col].agg([
                        'mean', 'std', 'min', 'max'
                    ])
                    
                    supplier_metrics['cost_analysis'] = {
                        supplier: {
                            'avg_cost': float(stats['mean']),
                            'cost_variance': float(stats['std'] / stats['mean']) if stats['mean'] > 0 else 0,
                            'min_cost': float(stats['min']),
                            'max_cost': float(stats['max'])
                        }
                        for supplier, stats in cost_by_supplier.iterrows()
                    }
                
                # Create supplier rankings
                supplier_scores = {}
                unique_suppliers = df[supplier_col].unique()
                
                for supplier in unique_suppliers:
                    score = 100  # Base score
                    
                    # Delivery performance (30% weight)
                    if supplier in supplier_metrics.get('delivery_performance', {}):
                        delivery_score = supplier_metrics['delivery_performance'][supplier]
                        score += (delivery_score - 90) * 0.3  # Benchmark: 90%
                    
                    # Quality performance (40% weight)
                    if supplier in supplier_metrics.get('quality_analysis', {}):
                        quality_score = supplier_metrics['quality_analysis'][supplier]
                        score += (quality_score - 95) * 0.4  # Benchmark: 95%
                    
                    # Cost performance (30% weight) - lower cost variance is better
                    if supplier in supplier_metrics.get('cost_analysis', {}):
                        cost_variance = supplier_metrics['cost_analysis'][supplier]['cost_variance']
                        score -= cost_variance * 30  # Penalty for high variance
                    
                    supplier_scores[supplier] = max(0, min(100, score))
                
                # Sort suppliers by score
                sorted_suppliers = sorted(supplier_scores.items(), key=lambda x: x[1], reverse=True)
                supplier_metrics['supplier_rankings'] = [
                    {'supplier': supplier, 'score': score}
                    for supplier, score in sorted_suppliers[:10]
                ]
                
                # Performance summary
                supplier_metrics['performance_summary'] = {
                    'total_suppliers': len(unique_suppliers),
                    'top_performers': len([s for s in supplier_scores.values() if s >= 90]),
                    'underperformers': len([s for s in supplier_scores.values() if s < 70]),
                    'avg_supplier_score': float(np.mean(list(supplier_scores.values())))
                }
            
            return supplier_metrics
            
        except Exception as e:
            return {'error': str(e), 'supplier_rankings': []}
    
    def analyze_logistics_performance(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze logistics and transportation performance
        """
        try:
            logistics_metrics = {
                'delivery_performance': {},
                'transportation_costs': {},
                'route_efficiency': {},
                'warehouse_performance': {},
                'optimization_opportunities': []
            }
            
            # Delivery performance analysis
            delivery_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['delivery', 'shipping', 'transport'])]
            
            if delivery_cols:
                # Delivery time analysis
                if any('delivery_time' in col.lower() for col in df.columns):
                    delivery_time_col = [col for col in df.columns if 'delivery_time' in col.lower()][0]
                    
                    logistics_metrics['delivery_performance'] = {
                        'avg_delivery_time': float(df[delivery_time_col].mean()),
                        'delivery_time_std': float(df[delivery_time_col].std()),
                        'fastest_delivery': float(df[delivery_time_col].min()),
                        'slowest_delivery': float(df[delivery_time_col].max())
                    }
                    
                    # Identify optimization opportunities
                    if df[delivery_time_col].std() / df[delivery_time_col].mean() > 0.3:
                        logistics_metrics['optimization_opportunities'].append(
                            "High delivery time variability - optimize routing and scheduling"
                        )
                
                # Transportation cost analysis
                cost_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['shipping_cost', 'transport_cost', 'delivery_cost'])]
                
                if cost_cols:
                    cost_col = cost_cols[0]
                    
                    logistics_metrics['transportation_costs'] = {
                        'avg_shipping_cost': float(df[cost_col].mean()),
                        'total_shipping_cost': float(df[cost_col].sum()),
                        'cost_per_unit': float(df[cost_col].mean()),
                        'cost_variance': float(df[cost_col].std() / df[cost_col].mean()) if df[cost_col].mean() > 0 else 0
                    }
                    
                    # Cost optimization opportunities
                    if logistics_metrics['transportation_costs']['cost_variance'] > 0.2:
                        logistics_metrics['optimization_opportunities'].append(
                            "High shipping cost variance - negotiate better rates or optimize carriers"
                        )
            
            # Route efficiency analysis
            distance_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['distance', 'miles', 'km'])]
            
            if distance_cols and delivery_cols:
                distance_col = distance_cols[0]
                
                # Calculate efficiency metrics
                if cost_cols:
                    cost_col = cost_cols[0]
                    df_copy = df.copy()
                    df_copy['cost_per_mile'] = df_copy[cost_col] / df_copy[distance_col]
                    
                    logistics_metrics['route_efficiency'] = {
                        'avg_cost_per_mile': float(df_copy['cost_per_mile'].mean()),
                        'most_efficient_routes': df_copy.nsmallest(5, 'cost_per_mile')['cost_per_mile'].tolist(),
                        'least_efficient_routes': df_copy.nlargest(5, 'cost_per_mile')['cost_per_mile'].tolist()
                    }
            
            # Warehouse performance analysis
            warehouse_cols = [col for col in df.columns if any(term in col.lower() 
                             for term in ['warehouse', 'fulfillment', 'processing_time'])]
            
            if warehouse_cols:
                warehouse_col = warehouse_cols[0]
                
                if 'processing_time' in warehouse_col.lower():
                    logistics_metrics['warehouse_performance'] = {
                        'avg_processing_time': float(df[warehouse_col].mean()),
                        'processing_efficiency': 100 - (df[warehouse_col].std() / df[warehouse_col].mean() * 100) if df[warehouse_col].mean() > 0 else 0
                    }
                elif 'warehouse' in warehouse_col.lower():
                    # Warehouse performance by location
                    warehouse_performance = df.groupby(warehouse_col).agg({
                        'delivery_time': 'mean' if 'delivery_time' in df.columns else lambda x: 0,
                        cost_cols[0]: 'mean' if cost_cols else lambda x: 0
                    }).to_dict() if any(col in df.columns for col in ['delivery_time'] + cost_cols) else {}
                    
                    logistics_metrics['warehouse_performance'] = warehouse_performance
            
            return logistics_metrics
            
        except Exception as e:
            return {'error': str(e), 'delivery_performance': {}}
    
    def analyze_supply_chain_costs(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze supply chain cost structure and optimization opportunities
        """
        try:
            cost_analysis = {
                'cost_breakdown': {},
                'cost_trends': {},
                'optimization_opportunities': [],
                'cost_savings_potential': 0,
                'vendor_cost_comparison': {}
            }
            
            # Cost breakdown analysis
            cost_categories = {
                'procurement': ['procurement', 'purchase', 'material'],
                'transportation': ['shipping', 'transport', 'delivery', 'freight'],
                'warehousing': ['warehouse', 'storage', 'handling'],
                'overhead': ['overhead', 'admin', 'management']
            }
            
            total_costs = 0
            category_costs = {}
            
            for category, keywords in cost_categories.items():
                category_cost_cols = [col for col in df.columns 
                                     if any(keyword in col.lower() for keyword in keywords)]
                
                if category_cost_cols:
                    category_total = sum(df[col].sum() for col in category_cost_cols)
                    category_costs[category] = float(category_total)
                    total_costs += category_total
            
            if total_costs > 0:
                cost_analysis['cost_breakdown'] = {
                    category: {
                        'amount': cost,
                        'percentage': (cost / total_costs) * 100
                    }
                    for category, cost in category_costs.items()
                }
            
            # Cost trends analysis
            date_cols = [col for col in df.columns if 'date' in col.lower()]
            cost_cols = [col for col in df.columns if any(term in col.lower() 
                        for term in ['cost', 'price', 'amount'])]
            
            if date_cols and cost_cols:
                date_col = date_cols[0]
                cost_col = cost_cols[0]
                
                df_copy = df.copy()
                df_copy[date_col] = pd.to_datetime(df_copy[date_col])
                
                # Monthly cost trends
                monthly_costs = df_copy.groupby(df_copy[date_col].dt.to_period('M'))[cost_col].sum()
                
                if len(monthly_costs) >= 2:
                    recent_cost = monthly_costs.iloc[-1]
                    previous_cost = monthly_costs.iloc[-2]
                    cost_trend = ((recent_cost - previous_cost) / previous_cost) * 100 if previous_cost > 0 else 0
                    
                    cost_analysis['cost_trends'] = {
                        'monthly_trend': float(cost_trend),
                        'trend_direction': 'increasing' if cost_trend > 0 else 'decreasing' if cost_trend < 0 else 'stable',
                        'recent_month_cost': float(recent_cost),
                        'previous_month_cost': float(previous_cost)
                    }
            
            # Vendor cost comparison
            supplier_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['supplier', 'vendor'])]
            
            if supplier_cols and cost_cols:
                supplier_col = supplier_cols[0]
                cost_col = cost_cols[0]
                
                vendor_costs = df.groupby(supplier_col)[cost_col].agg(['mean', 'sum', 'count'])
                sorted_vendors = vendor_costs.sort_values('mean')
                
                cost_analysis['vendor_cost_comparison'] = {
                    'lowest_cost_vendors': [
                        {
                            'vendor': str(vendor),
                            'avg_cost': float(stats['mean']),
                            'total_orders': int(stats['count'])
                        }
                        for vendor, stats in sorted_vendors.head(5).iterrows()
                    ],
                    'highest_cost_vendors': [
                        {
                            'vendor': str(vendor),
                            'avg_cost': float(stats['mean']),
                            'total_orders': int(stats['count'])
                        }
                        for vendor, stats in sorted_vendors.tail(5).iterrows()
                    ]
                }
                
                # Calculate potential savings
                avg_cost = vendor_costs['mean'].mean()
                min_cost = vendor_costs['mean'].min()
                if avg_cost > 0:
                    savings_potential = ((avg_cost - min_cost) / avg_cost) * 100
                    cost_analysis['cost_savings_potential'] = float(savings_potential)
            
            # Generate optimization opportunities
            if cost_analysis.get('cost_savings_potential', 0) > 10:
                cost_analysis['optimization_opportunities'].append(
                    f"Potential {cost_analysis['cost_savings_potential']:.1f}% cost savings through vendor optimization"
                )
            
            if 'cost_trends' in cost_analysis and cost_analysis['cost_trends']['monthly_trend'] > 5:
                cost_analysis['optimization_opportunities'].append(
                    "Rising cost trends detected - review supplier contracts and pricing"
                )
            
            cost_analysis['optimization_opportunities'].extend([
                "Consolidate orders with preferred vendors for volume discounts",
                "Implement cost tracking and monitoring systems",
                "Negotiate long-term contracts with top-performing suppliers",
                "Review and optimize transportation routes and methods"
            ])
            
            return cost_analysis
            
        except Exception as e:
            return {'error': str(e), 'cost_breakdown': {}}
    
    def assess_supply_chain_risks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Assess supply chain risks and vulnerabilities
        """
        try:
            risk_assessment = {
                'supplier_concentration_risk': {},
                'geographic_risk': {},
                'lead_time_risk': {},
                'quality_risk': {},
                'overall_risk_score': 0,
                'mitigation_strategies': []
            }
            
            # Supplier concentration risk
            supplier_cols = [col for col in df.columns if any(term in col.lower() 
                            for term in ['supplier', 'vendor'])]
            
            if supplier_cols:
                supplier_col = supplier_cols[0]
                supplier_distribution = df[supplier_col].value_counts(normalize=True)
                
                # Check concentration
                top_supplier_share = supplier_distribution.iloc[0] if len(supplier_distribution) > 0 else 0
                top_3_suppliers_share = supplier_distribution.head(3).sum() if len(supplier_distribution) >= 3 else supplier_distribution.sum()
                
                risk_assessment['supplier_concentration_risk'] = {
                    'top_supplier_percentage': float(top_supplier_share * 100),
                    'top_3_suppliers_percentage': float(top_3_suppliers_share * 100),
                    'risk_level': 'high' if top_supplier_share > 0.5 else 'medium' if top_supplier_share > 0.3 else 'low'
                }
                
                if top_supplier_share > 0.4:
                    risk_assessment['mitigation_strategies'].append(
                        "High supplier concentration - diversify supplier base to reduce dependency"
                    )
            
            # Lead time risk
            lead_time_cols = [col for col in df.columns if 'lead_time' in col.lower()]
            
            if lead_time_cols:
                lead_time_col = lead_time_cols[0]
                lead_time_cv = df[lead_time_col].std() / df[lead_time_col].mean() if df[lead_time_col].mean() > 0 else 0
                
                risk_assessment['lead_time_risk'] = {
                    'coefficient_of_variation': float(lead_time_cv),
                    'risk_level': 'high' if lead_time_cv > 0.3 else 'medium' if lead_time_cv > 0.15 else 'low',
                    'avg_lead_time': float(df[lead_time_col].mean()),
                    'max_lead_time': float(df[lead_time_col].max())
                }
                
                if lead_time_cv > 0.25:
                    risk_assessment['mitigation_strategies'].append(
                        "High lead time variability - implement buffer stock and alternative suppliers"
                    )
            
            # Quality risk
            quality_cols = [col for col in df.columns if any(term in col.lower() 
                           for term in ['defect', 'return', 'quality'])]
            
            if quality_cols:
                quality_col = quality_cols[0]
                
                if 'defect' in quality_col.lower() or 'return' in quality_col.lower():
                    quality_issue_rate = df[quality_col].mean()
                    risk_level = 'high' if quality_issue_rate > 0.05 else 'medium' if quality_issue_rate > 0.02 else 'low'
                else:
                    quality_score = df[quality_col].mean()
                    quality_issue_rate = 1 - (quality_score / 100) if quality_score <= 100 else 0
                    risk_level = 'high' if quality_score < 90 else 'medium' if quality_score < 95 else 'low'
                
                risk_assessment['quality_risk'] = {
                    'quality_issue_rate': float(quality_issue_rate),
                    'risk_level': risk_level
                }
                
                if risk_level == 'high':
                    risk_assessment['mitigation_strategies'].append(
                        "Quality issues detected - implement stricter quality control and supplier audits"
                    )
            
            # Calculate overall risk score (0-100, higher is riskier)
            risk_factors = []
            
            if 'supplier_concentration_risk' in risk_assessment:
                concentration_risk = risk_assessment['supplier_concentration_risk']['top_supplier_percentage']
                risk_factors.append(min(concentration_risk, 50))  # Cap at 50 points
            
            if 'lead_time_risk' in risk_assessment:
                lead_time_risk = risk_assessment['lead_time_risk']['coefficient_of_variation'] * 100
                risk_factors.append(min(lead_time_risk, 30))  # Cap at 30 points
            
            if 'quality_risk' in risk_assessment:
                quality_risk = risk_assessment['quality_risk']['quality_issue_rate'] * 100
                risk_factors.append(min(quality_risk * 5, 20))  # Cap at 20 points
            
            risk_assessment['overall_risk_score'] = float(sum(risk_factors))
            
            # Add general mitigation strategies
            risk_assessment['mitigation_strategies'].extend([
                "Develop contingency plans for critical suppliers",
                "Regular supplier performance reviews and audits",
                "Maintain strategic inventory buffers for critical items",
                "Implement supply chain visibility and monitoring tools"
            ])
            
            return risk_assessment
            
        except Exception as e:
            return {'error': str(e), 'overall_risk_score': 50}
    
    def generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """
        Generate supply chain optimization recommendations
        """
        recommendations = [
            "Diversify supplier base to reduce concentration risk",
            "Implement supplier scorecards for performance tracking",
            "Optimize transportation routes and consolidate shipments",
            "Negotiate volume discounts with preferred suppliers",
            "Establish strategic partnerships with key suppliers",
            "Implement supply chain visibility and tracking systems",
            "Develop contingency plans for supply disruptions",
            "Regular review and optimization of supplier contracts"
        ]
        return recommendations
    
    def generate_narrative(self, df: pd.DataFrame) -> str:
        """
        Generate supply chain analytics narrative
        """
        total_records = len(df)
        return f"Supply chain analysis completed for {total_records} records with comprehensive supplier performance, logistics optimization, cost analysis, and risk assessment insights."
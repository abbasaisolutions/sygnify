#!/usr/bin/env python3
"""
Domain-Specific Instructions for Financial Analysis
Provides contextual guidance to ML models for better financial insights
"""

from typing import Dict, List, Any, Optional
import pandas as pd

class DomainInstructions:
    def __init__(self):
        """Initialize domain-specific instructions for financial analysis"""
        self.financial_context = {
            'profitability_metrics': {
                'description': 'Key indicators of business profitability and efficiency',
                'metrics': ['Revenue', 'Profit', 'Profit_Margin', 'EBITDA', 'ROE', 'ROA'],
                'benchmarks': {
                    'Technology': {'profit_margin': 15.0, 'roe': 18.0},
                    'Finance': {'profit_margin': 25.0, 'roe': 12.0},
                    'Healthcare': {'profit_margin': 8.0, 'roe': 10.0},
                    'Manufacturing': {'profit_margin': 12.0, 'roe': 14.0},
                    'Retail': {'profit_margin': 5.0, 'roe': 8.0}
                },
                'analysis_focus': [
                    'Compare against industry benchmarks',
                    'Identify profitability trends',
                    'Assess efficiency improvements',
                    'Evaluate cost structure optimization'
                ]
            },
            'liquidity_metrics': {
                'description': 'Measures of short-term financial health and cash management',
                'metrics': ['Cash_Flow', 'Working_Capital', 'Current_Ratio'],
                'risk_thresholds': {
                    'current_ratio': {'low': 1.0, 'medium': 1.5, 'high': 2.0},
                    'cash_flow_volatility': {'low': 0.2, 'medium': 0.4, 'high': 0.6}
                },
                'analysis_focus': [
                    'Assess short-term solvency',
                    'Evaluate cash flow stability',
                    'Identify liquidity risks',
                    'Recommend working capital improvements'
                ]
            },
            'risk_metrics': {
                'description': 'Comprehensive risk assessment and management indicators',
                'metrics': ['Debt_to_Equity', 'Credit_Score', 'Default_Probability', 'VaR_95'],
                'risk_levels': {
                    'debt_equity': {'low': 0.3, 'medium': 0.7, 'high': 1.0},
                    'credit_score': {'low': 600, 'medium': 700, 'high': 800}
                },
                'analysis_focus': [
                    'Evaluate leverage risk',
                    'Assess credit quality',
                    'Identify operational risks',
                    'Recommend risk mitigation strategies'
                ]
            },
            'market_metrics': {
                'description': 'External market factors and economic indicators',
                'metrics': ['Market_Index', 'Interest_Rate', 'Inflation_Rate', 'Exchange_Rate'],
                'analysis_focus': [
                    'Assess market environment impact',
                    'Evaluate economic sensitivity',
                    'Identify external risk factors',
                    'Recommend market adaptation strategies'
                ]
            }
        }
        
        # Retail domain context
        self.retail_context = {
            'customer_metrics': {
                'description': 'Customer behavior, segmentation, and lifetime value indicators',
                'metrics': ['CLV', 'CAC', 'Churn_Rate', 'RFM_Score', 'Retention_Rate', 'AOV'],
                'benchmarks': {
                    'E-commerce': {'clv_cac_ratio': 3.0, 'churn_rate': 0.15, 'aov': 85.0},
                    'Fashion': {'clv_cac_ratio': 2.5, 'churn_rate': 0.25, 'aov': 120.0},
                    'Electronics': {'clv_cac_ratio': 4.0, 'churn_rate': 0.10, 'aov': 350.0},
                    'Grocery': {'clv_cac_ratio': 2.0, 'churn_rate': 0.05, 'aov': 45.0}
                },
                'analysis_focus': [
                    'Assess customer lifetime value and acquisition costs',
                    'Evaluate customer segmentation effectiveness',
                    'Identify churn risks and retention opportunities',
                    'Optimize customer journey and experience'
                ]
            },
            'sales_metrics': {
                'description': 'Sales performance and conversion indicators',
                'metrics': ['Conversion_Rate', 'Sales_Velocity', 'Revenue_Growth', 'Basket_Size'],
                'benchmarks': {
                    'E-commerce': {'conversion_rate': 2.5, 'sales_velocity': 1000.0},
                    'Fashion': {'conversion_rate': 1.8, 'sales_velocity': 800.0},
                    'Electronics': {'conversion_rate': 3.2, 'sales_velocity': 1500.0},
                    'Grocery': {'conversion_rate': 85.0, 'sales_velocity': 500.0}
                },
                'analysis_focus': [
                    'Assess sales conversion efficiency',
                    'Evaluate pricing strategies and elasticity',
                    'Identify growth opportunities and bottlenecks',
                    'Optimize sales funnel and customer journey'
                ]
            },
            'inventory_metrics': {
                'description': 'Inventory management and optimization indicators',
                'metrics': ['Inventory_Turnover', 'Stock_Aging', 'Out_of_Stock_Rate', 'ABC_Classification'],
                'risk_thresholds': {
                    'inventory_turnover': {'low': 4.0, 'medium': 8.0, 'high': 12.0},
                    'out_of_stock_rate': {'low': 0.02, 'medium': 0.05, 'high': 0.10}
                },
                'analysis_focus': [
                    'Assess inventory efficiency and turnover',
                    'Evaluate stock aging and obsolescence risks',
                    'Identify optimal stock levels and reorder points',
                    'Recommend inventory optimization strategies'
                ]
            },
            'profitability_metrics': {
                'description': 'Profitability and margin analysis indicators',
                'metrics': ['Gross_Margin', 'Category_Performance', 'Markup_Percentage', 'Profit_per_SKU'],
                'benchmarks': {
                    'E-commerce': {'gross_margin': 45.0, 'markup': 80.0},
                    'Fashion': {'gross_margin': 55.0, 'markup': 120.0},
                    'Electronics': {'gross_margin': 25.0, 'markup': 35.0},
                    'Grocery': {'gross_margin': 22.0, 'markup': 28.0}
                },
                'analysis_focus': [
                    'Assess category and product profitability',
                    'Evaluate pricing strategies and margins',
                    'Identify high-performing product categories',
                    'Recommend profit optimization strategies'
                ]
            }
        }
        
        self.analysis_instructions = {
            'comprehensive_assessment': {
                'objective': 'Provide comprehensive financial health assessment with actionable insights',
                'focus_areas': [
                    'Profitability performance vs industry benchmarks',
                    'Liquidity and cash flow analysis',
                    'Risk assessment and mitigation',
                    'Growth trajectory and sustainability',
                    'Strategic recommendations for improvement'
                ],
                'output_format': {
                    'key_insights': 'Domain-specific financial insights with benchmarks',
                    'risk_assessment': 'Comprehensive risk evaluation with mitigation strategies',
                    'strategic_recommendations': 'Actionable recommendations with expected impact',
                    'performance_metrics': 'Detailed performance analysis with industry comparison'
                }
            },
            'executive_summary': {
                'objective': 'Provide high-level financial health overview for executive decision-making',
                'focus_areas': [
                    'Overall financial performance score',
                    'Key risk factors and opportunities',
                    'Critical strategic recommendations',
                    'Performance vs industry peers'
                ]
            },
            'operational_analysis': {
                'objective': 'Focus on operational efficiency and performance optimization',
                'focus_areas': [
                    'Operational efficiency metrics',
                    'Cost structure analysis',
                    'Process optimization opportunities',
                    'Resource allocation recommendations'
                ]
            },
            'retail_comprehensive_assessment': {
                'objective': 'Provide comprehensive retail performance assessment with actionable insights',
                'focus_areas': [
                    'Customer analytics and segmentation performance',
                    'Sales conversion and revenue optimization',
                    'Inventory management and turnover efficiency',
                    'Profitability analysis by category and product',
                    'Operational efficiency and customer satisfaction',
                    'Strategic recommendations for retail growth'
                ],
                'output_format': {
                    'key_insights': 'Retail-specific insights with industry benchmarks',
                    'customer_analysis': 'Customer segmentation, CLV, and churn analysis',
                    'sales_performance': 'Conversion rates, sales velocity, and growth trends',
                    'inventory_optimization': 'Turnover analysis and stock optimization recommendations',
                    'profitability_assessment': 'Category performance and margin analysis'
                }
            },
            'retail_customer_focus': {
                'objective': 'Deep-dive customer analytics for retail optimization',
                'focus_areas': [
                    'Customer lifetime value and acquisition cost analysis',
                    'RFM segmentation and behavioral patterns',
                    'Churn prediction and retention strategies',
                    'Purchase journey optimization',
                    'Customer satisfaction and loyalty metrics'
                ]
            },
            'retail_operational_analysis': {
                'objective': 'Focus on operational efficiency and inventory optimization',
                'focus_areas': [
                    'Inventory turnover and stock aging analysis',
                    'Supply chain efficiency metrics',
                    'Order fulfillment and delivery performance',
                    'Category and product performance analysis',
                    'Seasonal trend analysis and demand forecasting'
                ]
            }
        }
    
    def get_financial_context(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate financial context based on available data"""
        context = {
            'available_metrics': {},
            'industry_context': {},
            'analysis_priorities': [],
            'benchmark_comparisons': {}
        }
        
        # Identify available metrics by category
        for category, info in self.financial_context.items():
            available_metrics = [metric for metric in info['metrics'] if metric in df.columns]
            if available_metrics:
                context['available_metrics'][category] = available_metrics
                context['analysis_priorities'].extend(info['analysis_focus'])
        
        # Determine industry context
        if 'Industry' in df.columns:
            primary_industry = df['Industry'].mode().iloc[0]
            context['industry_context'] = {
                'primary_industry': primary_industry,
                'benchmarks': self.financial_context['profitability_metrics']['benchmarks'].get(primary_industry, {}),
                'analysis_focus': self._get_industry_specific_focus(primary_industry)
            }
        
        return context
    
    def _get_industry_specific_focus(self, industry: str) -> List[str]:
        """Get industry-specific analysis focus areas"""
        industry_focus = {
            'Technology': [
                'R&D investment efficiency',
                'Revenue growth sustainability',
                'Market expansion opportunities',
                'Intellectual property valuation'
            ],
            'Finance': [
                'Regulatory compliance risk',
                'Interest rate sensitivity',
                'Credit portfolio quality',
                'Capital adequacy assessment'
            ],
            'Healthcare': [
                'Regulatory compliance',
                'Patient care efficiency',
                'Insurance reimbursement optimization',
                'Medical technology investment'
            ],
            'Manufacturing': [
                'Supply chain efficiency',
                'Production cost optimization',
                'Inventory management',
                'Quality control metrics'
            ],
            'Retail': [
                'Inventory turnover optimization',
                'Customer satisfaction metrics',
                'Store performance analysis',
                'E-commerce integration'
            ]
        }
        
        return industry_focus.get(industry, ['General financial performance analysis'])
    
    def generate_analysis_instructions(self, df: pd.DataFrame, user_role: str = 'executive') -> Dict[str, Any]:
        """Generate specific analysis instructions for the ML model"""
        context = self.get_financial_context(df)
        
        instructions = {
            'analysis_objective': self.analysis_instructions['comprehensive_assessment']['objective'],
            'focus_areas': context['analysis_priorities'],
            'industry_context': context['industry_context'],
            'available_metrics': context['available_metrics'],
            'user_role': user_role,
            'output_requirements': {
                'insight_depth': 'domain_expert' if user_role == 'analyst' else 'executive_summary',
                'benchmark_comparison': True,
                'risk_assessment': True,
                'strategic_recommendations': True,
                'actionable_insights': True
            }
        }
        
        # Add role-specific instructions
        if user_role == 'executive':
            instructions['focus_areas'].extend([
                'High-level performance summary',
                'Critical risk factors',
                'Strategic opportunities',
                'Board-level recommendations'
            ])
        elif user_role == 'analyst':
            instructions['focus_areas'].extend([
                'Detailed statistical analysis',
                'Trend identification',
                'Correlation analysis',
                'Predictive modeling insights'
            ])
        
        return instructions
    
    def enhance_ml_understanding(self, df: pd.DataFrame, analysis_type: str = 'comprehensive') -> Dict[str, Any]:
        """Provide enhanced context for ML model understanding"""
        
        # Data quality assessment
        data_quality = {
            'completeness': (df.notna().sum().sum() / (df.shape[0] * df.shape[1])) * 100,
            'numeric_columns': len(df.select_dtypes(include=['number']).columns),
            'categorical_columns': len(df.select_dtypes(include=['object']).columns),
            'time_series': 'Date' in df.columns,
            'financial_metrics': len([col for col in df.columns if any(metric in col for metric in ['Revenue', 'Profit', 'Cash', 'Debt', 'ROE', 'ROA'])])
        }
        
        # Financial context identification
        financial_context = self.get_financial_context(df)
        
        # Analysis instructions
        analysis_instructions = self.generate_analysis_instructions(df)
        
        enhanced_context = {
            'data_quality': data_quality,
            'financial_context': financial_context,
            'analysis_instructions': analysis_instructions,
            'domain_knowledge': {
                'financial_ratios': self._identify_financial_ratios(df),
                'risk_indicators': self._identify_risk_indicators(df),
                'performance_metrics': self._identify_performance_metrics(df),
                'benchmark_opportunities': self._identify_benchmark_opportunities(df)
            }
        }
        
        return enhanced_context
    
    def _identify_financial_ratios(self, df: pd.DataFrame) -> List[str]:
        """Identify available financial ratios for analysis"""
        ratios = []
        
        if 'Revenue' in df.columns and 'Profit' in df.columns:
            ratios.append('Profit_Margin')
        
        if 'Revenue' in df.columns and 'Expenses' in df.columns:
            ratios.append('Expense_Ratio')
        
        if 'Current_Ratio' in df.columns:
            ratios.append('Liquidity_Ratio')
        
        if 'Debt_to_Equity' in df.columns:
            ratios.append('Leverage_Ratio')
        
        return ratios
    
    def _identify_risk_indicators(self, df: pd.DataFrame) -> List[str]:
        """Identify risk indicators in the data"""
        risk_indicators = []
        
        risk_metrics = ['Credit_Score', 'Default_Probability', 'VaR_95', 'Operational_Risk_Score']
        for metric in risk_metrics:
            if metric in df.columns:
                risk_indicators.append(metric)
        
        return risk_indicators
    
    def _identify_performance_metrics(self, df: pd.DataFrame) -> List[str]:
        """Identify performance metrics in the data"""
        performance_metrics = []
        
        perf_metrics = ['ROE', 'ROA', 'Profit_Margin', 'EBITDA']
        for metric in perf_metrics:
            if metric in df.columns:
                performance_metrics.append(metric)
        
        return performance_metrics
    
    def _identify_benchmark_opportunities(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Identify opportunities for benchmark comparisons"""
        benchmarks = {}
        
        if 'Industry' in df.columns:
            industry = df['Industry'].mode().iloc[0]
            industry_benchmarks = self.financial_context['profitability_metrics']['benchmarks'].get(industry, {})
            
            for metric, benchmark_value in industry_benchmarks.items():
                if metric in df.columns:
                    benchmarks[metric] = {
                        'industry': industry,
                        'benchmark_value': benchmark_value,
                        'current_value': df[metric].mean(),
                        'comparison': 'above' if df[metric].mean() > benchmark_value else 'below'
                    }
        
        return benchmarks

def get_domain_instructions(df: pd.DataFrame, user_role: str = 'executive') -> Dict[str, Any]:
    """Main function to get domain-specific instructions for ML analysis"""
    instructions = DomainInstructions()
    return instructions.enhance_ml_understanding(df, 'comprehensive') 
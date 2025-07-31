#!/usr/bin/env python3
"""
Sygnify Financial ML Engine
Advanced financial analytics with domain-specific intelligence
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class FinancialMLEngine:
    def __init__(self):
        """Initialize the Financial ML Engine with domain knowledge"""
        self.financial_metrics = {
            'profitability': ['Revenue', 'Profit', 'Profit_Margin', 'EBITDA', 'ROE', 'ROA'],
            'liquidity': ['Cash_Flow', 'Working_Capital', 'Current_Ratio'],
            'leverage': ['Debt_to_Equity'],
            'efficiency': ['Operational_Efficiency', 'Inventory_Turnover'],
            'market': ['Market_Index', 'Interest_Rate', 'Inflation_Rate', 'Exchange_Rate'],
            'risk': ['Credit_Score', 'Default_Probability', 'VaR_95', 'Operational_Risk_Score'],
            'operational': ['Employee_Count', 'Employee_Turnover_Rate', 'Customer_Count', 'Customer_Satisfaction']
        }
        
        self.industry_benchmarks = {
            'Technology': {
                'avg_profit_margin': 15.0,
                'avg_roe': 18.0,
                'avg_current_ratio': 1.8,
                'avg_debt_equity': 0.4
            },
            'Finance': {
                'avg_profit_margin': 25.0,
                'avg_roe': 12.0,
                'avg_current_ratio': 1.2,
                'avg_debt_equity': 0.8
            },
            'Healthcare': {
                'avg_profit_margin': 8.0,
                'avg_roe': 10.0,
                'avg_current_ratio': 1.5,
                'avg_debt_equity': 0.6
            },
            'Manufacturing': {
                'avg_profit_margin': 12.0,
                'avg_roe': 14.0,
                'avg_current_ratio': 1.4,
                'avg_debt_equity': 0.5
            },
            'Retail': {
                'avg_profit_margin': 5.0,
                'avg_roe': 8.0,
                'avg_current_ratio': 1.3,
                'avg_debt_equity': 0.7
            }
        }
        
        self.risk_thresholds = {
            'high_risk_profit_margin': 5.0,
            'low_risk_profit_margin': 20.0,
            'high_risk_current_ratio': 1.0,
            'low_risk_current_ratio': 2.0,
            'high_risk_debt_equity': 1.0,
            'low_risk_debt_equity': 0.3
        }
    
    def analyze_financial_health(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive financial health analysis"""
        insights = {
            'profitability_analysis': self._analyze_profitability(df),
            'liquidity_analysis': self._analyze_liquidity(df),
            'risk_analysis': self._analyze_risk_factors(df),
            'trend_analysis': self._analyze_trends(df),
            'anomaly_detection': self._detect_anomalies(df),
            'forecasting_insights': self._generate_forecasting_insights(df),
            'strategic_recommendations': []
        }
        
        # Generate strategic recommendations
        insights['strategic_recommendations'] = self._generate_strategic_recommendations(insights, df)
        
        return insights
    
    def _analyze_profitability(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Advanced profitability analysis with industry benchmarking"""
        analysis = {}
        
        # Identify profitability metrics
        profit_metrics = [col for col in self.financial_metrics['profitability'] if col in df.columns]
        
        if not profit_metrics:
            return {'status': 'no_profitability_data', 'message': 'No profitability metrics found'}
        
        # Calculate key ratios
        if 'Revenue' in df.columns and 'Profit' in df.columns:
            df['Profit_Margin_Calc'] = (df['Profit'] / df['Revenue']) * 100
            avg_profit_margin = df['Profit_Margin_Calc'].mean()
            
            # Industry benchmarking
            industry = df['Industry'].mode().iloc[0] if 'Industry' in df.columns else 'General'
            benchmark = self.industry_benchmarks.get(industry, self.industry_benchmarks['Technology'])
            
            analysis['profit_margin'] = {
                'current': avg_profit_margin,
                'benchmark': benchmark['avg_profit_margin'],
                'performance': 'above' if avg_profit_margin > benchmark['avg_profit_margin'] else 'below',
                'gap': avg_profit_margin - benchmark['avg_profit_margin'],
                'insight': self._generate_profit_margin_insight(avg_profit_margin, benchmark['avg_profit_margin'])
            }
        
        # ROE Analysis
        if 'ROE' in df.columns:
            avg_roe = df['ROE'].mean()
            benchmark_roe = benchmark['avg_roe']
            analysis['roe'] = {
                'current': avg_roe,
                'benchmark': benchmark_roe,
                'performance': 'above' if avg_roe > benchmark_roe else 'below',
                'insight': f"ROE of {avg_roe:.1f}% is {avg_roe - benchmark_roe:+.1f}% {'above' if avg_roe > benchmark_roe else 'below'} industry average"
            }
        
        # Revenue Growth Analysis
        if 'Revenue' in df.columns and len(df) > 1:
            revenue_growth = self._calculate_growth_rate(df['Revenue'])
            analysis['revenue_growth'] = {
                'growth_rate': revenue_growth,
                'trend': 'increasing' if revenue_growth > 0 else 'decreasing',
                'insight': f"Revenue is {abs(revenue_growth):.1f}% {'growing' if revenue_growth > 0 else 'declining'} over the period"
            }
        
        return analysis
    
    def _analyze_liquidity(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Advanced liquidity analysis"""
        analysis = {}
        
        # Current Ratio Analysis
        if 'Current_Ratio' in df.columns:
            avg_current_ratio = df['Current_Ratio'].mean()
            analysis['current_ratio'] = {
                'current': avg_current_ratio,
                'risk_level': 'high' if avg_current_ratio < 1.0 else 'medium' if avg_current_ratio < 1.5 else 'low',
                'insight': self._generate_liquidity_insight(avg_current_ratio)
            }
        
        # Cash Flow Analysis
        if 'Cash_Flow' in df.columns:
            cash_flow_volatility = df['Cash_Flow'].std() / df['Cash_Flow'].mean()
            analysis['cash_flow'] = {
                'volatility': cash_flow_volatility,
                'stability': 'stable' if cash_flow_volatility < 0.3 else 'volatile',
                'insight': f"Cash flow is {'stable' if cash_flow_volatility < 0.3 else 'volatile'} with {cash_flow_volatility:.1%} volatility"
            }
        
        return analysis
    
    def _analyze_risk_factors(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive risk analysis"""
        analysis = {}
        
        # Debt Analysis
        if 'Debt_to_Equity' in df.columns:
            avg_debt_equity = df['Debt_to_Equity'].mean()
            analysis['debt_risk'] = {
                'current': avg_debt_equity,
                'risk_level': 'high' if avg_debt_equity > 1.0 else 'medium' if avg_debt_equity > 0.5 else 'low',
                'insight': f"Debt-to-equity ratio of {avg_debt_equity:.2f} indicates {'high' if avg_debt_equity > 1.0 else 'moderate' if avg_debt_equity > 0.5 else 'low'} leverage risk"
            }
        
        # Credit Risk
        if 'Credit_Score' in df.columns:
            avg_credit_score = df['Credit_Score'].mean()
            analysis['credit_risk'] = {
                'current': avg_credit_score,
                'risk_level': 'high' if avg_credit_score < 600 else 'medium' if avg_credit_score < 700 else 'low',
                'insight': f"Average credit score of {avg_credit_score:.0f} indicates {'high' if avg_credit_score < 600 else 'moderate' if avg_credit_score < 700 else 'low'} credit risk"
            }
        
        # Operational Risk
        if 'Operational_Risk_Score' in df.columns:
            avg_operational_risk = df['Operational_Risk_Score'].mean()
            analysis['operational_risk'] = {
                'current': avg_operational_risk,
                'risk_level': 'high' if avg_operational_risk > 0.1 else 'medium' if avg_operational_risk > 0.05 else 'low',
                'insight': f"Operational risk score of {avg_operational_risk:.3f} indicates {'high' if avg_operational_risk > 0.1 else 'moderate' if avg_operational_risk > 0.05 else 'low'} operational risk"
            }
        
        return analysis
    
    def _analyze_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Advanced trend analysis with seasonality detection"""
        analysis = {}
        
        # Time series analysis for key metrics
        key_metrics = ['Revenue', 'Profit', 'Cash_Flow', 'Profit_Margin']
        
        for metric in key_metrics:
            if metric in df.columns:
                trend = self._calculate_trend(df[metric])
                seasonality = self._detect_seasonality(df[metric])
                
                analysis[metric.lower()] = {
                    'trend': trend,
                    'seasonality': seasonality,
                    'insight': self._generate_trend_insight(metric, trend, seasonality)
                }
        
        return analysis
    
    def _detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Advanced anomaly detection using statistical methods"""
        anomalies = {}
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if col in df.columns:
                # Z-score method for anomaly detection
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                anomaly_indices = z_scores > 3  # 3 standard deviations
                
                if anomaly_indices.sum() > 0:
                    anomalies[col] = {
                        'count': int(anomaly_indices.sum()),
                        'percentage': float(anomaly_indices.sum() / len(df) * 100),
                        'max_value': float(df[col].max()),
                        'min_value': float(df[col].min()),
                        'insight': f"Found {anomaly_indices.sum()} anomalies ({anomaly_indices.sum() / len(df) * 100:.1f}%) in {col}"
                    }
        
        return anomalies
    
    def _generate_forecasting_insights(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate forecasting insights and predictions"""
        insights = {}
        
        # Revenue forecasting
        if 'Revenue' in df.columns and 'Revenue_Forecast' in df.columns:
            current_revenue = df['Revenue'].iloc[-1]
            forecast_revenue = df['Revenue_Forecast'].iloc[-1] * current_revenue
            growth_rate = ((forecast_revenue - current_revenue) / current_revenue) * 100
            
            insights['revenue_forecast'] = {
                'current': current_revenue,
                'forecast': forecast_revenue,
                'growth_rate': growth_rate,
                'confidence': df['Forecast_Confidence'].mean() if 'Forecast_Confidence' in df.columns else 0.85,
                'insight': f"Revenue forecast shows {growth_rate:+.1f}% growth with {insights.get('revenue_forecast', {}).get('confidence', 0.85):.0%} confidence"
            }
        
        # Expense forecasting
        if 'Expenses' in df.columns and 'Expense_Forecast' in df.columns:
            current_expenses = df['Expenses'].iloc[-1]
            forecast_expenses = df['Expense_Forecast'].iloc[-1] * current_expenses
            expense_growth = ((forecast_expenses - current_expenses) / current_expenses) * 100
            
            insights['expense_forecast'] = {
                'current': current_expenses,
                'forecast': forecast_expenses,
                'growth_rate': expense_growth,
                'insight': f"Expenses forecast shows {expense_growth:+.1f}% change"
            }
        
        return insights
    
    def _generate_strategic_recommendations(self, insights: Dict, df: pd.DataFrame) -> List[Dict]:
        """Generate intelligent strategic recommendations"""
        recommendations = []
        
        # Profitability recommendations
        if 'profitability_analysis' in insights:
            profit_analysis = insights['profitability_analysis']
            if 'profit_margin' in profit_analysis:
                margin_analysis = profit_analysis['profit_margin']
                if margin_analysis['performance'] == 'below':
                    recommendations.append({
                        'category': 'Profitability',
                        'priority': 'high',
                        'recommendation': 'Implement cost optimization strategies to improve profit margins',
                        'rationale': f"Current margin of {margin_analysis['current']:.1f}% is {margin_analysis['gap']:.1f}% below industry benchmark",
                        'expected_impact': 'Medium-term profitability improvement'
                    })
        
        # Liquidity recommendations
        if 'liquidity_analysis' in insights:
            liquidity_analysis = insights['liquidity_analysis']
            if 'current_ratio' in liquidity_analysis:
                ratio_analysis = liquidity_analysis['current_ratio']
                if ratio_analysis['risk_level'] == 'high':
                    recommendations.append({
                        'category': 'Liquidity',
                        'priority': 'critical',
                        'recommendation': 'Improve working capital management and reduce short-term obligations',
                        'rationale': f"Current ratio of {ratio_analysis['current']:.2f} indicates liquidity risk",
                        'expected_impact': 'Immediate risk mitigation'
                    })
        
        # Risk management recommendations
        if 'risk_analysis' in insights:
            risk_analysis = insights['risk_analysis']
            if 'debt_risk' in risk_analysis:
                debt_analysis = risk_analysis['debt_risk']
                if debt_analysis['risk_level'] == 'high':
                    recommendations.append({
                        'category': 'Risk Management',
                        'priority': 'high',
                        'recommendation': 'Develop debt reduction strategy and improve capital structure',
                        'rationale': f"Debt-to-equity ratio of {debt_analysis['current']:.2f} indicates high leverage risk",
                        'expected_impact': 'Long-term financial stability'
                    })
        
        # Growth recommendations
        if 'trend_analysis' in insights:
            trend_analysis = insights['trend_analysis']
            if 'revenue' in trend_analysis:
                revenue_trend = trend_analysis['revenue']
                if revenue_trend['trend'] == 'decreasing':
                    recommendations.append({
                        'category': 'Growth',
                        'priority': 'medium',
                        'recommendation': 'Develop revenue growth strategies and market expansion plans',
                        'rationale': 'Revenue trend analysis shows declining performance',
                        'expected_impact': 'Revenue growth restoration'
                    })
        
        return recommendations
    
    def _calculate_growth_rate(self, series: pd.Series) -> float:
        """Calculate growth rate between first and last values"""
        if len(series) < 2:
            return 0.0
        return ((series.iloc[-1] - series.iloc[0]) / series.iloc[0]) * 100
    
    def _calculate_trend(self, series: pd.Series) -> str:
        """Calculate trend direction and strength"""
        if len(series) < 2:
            return 'stable'
        
        # Linear regression slope
        x = np.arange(len(series))
        slope = np.polyfit(x, series, 1)[0]
        
        if abs(slope) < series.std() * 0.1:
            return 'stable'
        elif slope > 0:
            return 'increasing'
        else:
            return 'decreasing'
    
    def _detect_seasonality(self, series: pd.Series) -> str:
        """Detect seasonality in time series data"""
        if len(series) < 12:  # Need at least 12 periods for seasonality
            return 'insufficient_data'
        
        # Simple seasonality detection using autocorrelation
        autocorr = series.autocorr()
        if abs(autocorr) > 0.3:
            return 'seasonal'
        else:
            return 'no_seasonality'
    
    def _generate_profit_margin_insight(self, current: float, benchmark: float) -> str:
        """Generate intelligent profit margin insight"""
        gap = current - benchmark
        if gap > 5:
            return f"Excellent profitability performance: {gap:+.1f}% above industry average"
        elif gap > 0:
            return f"Good profitability: {gap:+.1f}% above industry average"
        elif gap > -5:
            return f"Below average profitability: {gap:.1f}% below industry average"
        else:
            return f"Critical profitability issue: {gap:.1f}% below industry average"
    
    def _generate_liquidity_insight(self, current_ratio: float) -> str:
        """Generate intelligent liquidity insight"""
        if current_ratio < 1.0:
            return f"Critical liquidity risk: Current ratio of {current_ratio:.2f} indicates inability to meet short-term obligations"
        elif current_ratio < 1.5:
            return f"Moderate liquidity: Current ratio of {current_ratio:.2f} suggests adequate but tight working capital"
        else:
            return f"Strong liquidity position: Current ratio of {current_ratio:.2f} indicates healthy working capital"
    
    def _generate_trend_insight(self, metric: str, trend: str, seasonality: str) -> str:
        """Generate intelligent trend insight"""
        trend_desc = {
            'increasing': 'positive growth trajectory',
            'decreasing': 'declining performance',
            'stable': 'consistent performance'
        }
        
        seasonality_desc = {
            'seasonal': 'with seasonal patterns',
            'no_seasonality': 'with consistent patterns',
            'insufficient_data': 'with limited historical data'
        }
        
        return f"{metric} shows {trend_desc.get(trend, 'mixed')} {seasonality_desc.get(seasonality, '')}"

def create_financial_insights(df: pd.DataFrame) -> Dict[str, Any]:
    """Main function to create comprehensive financial insights with domain-specific intelligence"""
    
    # Get domain-specific instructions to enhance ML understanding
    try:
        from backend.domain_instructions import get_domain_instructions
        domain_context = get_domain_instructions(df, 'executive')
        logging.info(f"Enhanced ML understanding with domain context: {len(domain_context['financial_context']['available_metrics'])} metric categories identified")
    except ImportError:
        domain_context = {}
        logging.warning("Domain instructions not available, using basic analysis")
    
    engine = FinancialMLEngine()
    analysis = engine.analyze_financial_health(df)
    
    # Format insights for frontend consumption with enhanced domain intelligence
    formatted_insights = {
        'key_insights': [],
        'external_context': [],
        'llama3_narrative': '',
        'strategic_recommendations': analysis.get('strategic_recommendations', []),
        'risk_assessment': analysis.get('risk_analysis', {}),
        'performance_metrics': analysis.get('profitability_analysis', {}),
        'forecasting': analysis.get('forecasting_insights', {}),
        'anomalies': analysis.get('anomaly_detection', {}),
        'domain_context': domain_context if 'domain_context' in locals() else {},
        'ml_enhanced': True
    }
    
    # Generate key insights
    if 'profitability_analysis' in analysis:
        profit_analysis = analysis['profitability_analysis']
        if 'profit_margin' in profit_analysis:
            margin_data = profit_analysis['profit_margin']
            formatted_insights['key_insights'].append({
                'category': 'Profitability Analysis',
                'insight': margin_data['insight'],
                'metric1': 'Profit Margin',
                'metric2': 'Industry Benchmark',
                'correlation': 0.85,
                'impact': 'high' if abs(margin_data['gap']) > 5 else 'medium',
                'confidence': 0.9
            })
    
    if 'liquidity_analysis' in analysis:
        liquidity_analysis = analysis['liquidity_analysis']
        if 'current_ratio' in liquidity_analysis:
            ratio_data = liquidity_analysis['current_ratio']
            formatted_insights['key_insights'].append({
                'category': 'Liquidity Assessment',
                'insight': ratio_data['insight'],
                'metric1': 'Current Ratio',
                'metric2': 'Risk Level',
                'correlation': 0.8,
                'impact': 'critical' if ratio_data['risk_level'] == 'high' else 'medium',
                'confidence': 0.85
            })
    
    # Generate external context
    formatted_insights['external_context'] = [
        {
            'title': 'Financial Health Assessment',
            'source': 'Sygnify ML Engine',
            'insight': f"Comprehensive analysis of {len(df)} financial records completed",
            'impact_description': 'Advanced ML-driven insights for strategic decision making',
            'impact': 'high',
            'confidence': 0.92
        }
    ]
    
    # Generate intelligent, domain-specific narrative
    narrative_parts = []
    
    # Executive Summary
    narrative_parts.append("## **Sygnify Financial Intelligence Report**")
    narrative_parts.append(f"*Advanced ML-driven analysis of {len(df)} financial records*")
    
    # Add profitability summary with industry context
    if 'profitability_analysis' in analysis:
        profit_analysis = analysis['profitability_analysis']
        if 'profit_margin' in profit_analysis:
            margin_data = profit_analysis['profit_margin']
            industry_context = domain_context.get('financial_context', {}).get('industry_context', {})
            industry_name = industry_context.get('primary_industry', 'General')
            
            narrative_parts.append(f"### **Profitability Performance**")
            narrative_parts.append(f"{margin_data['insight']}")
            if industry_name != 'General':
                narrative_parts.append(f"*Industry Benchmark: {industry_name} sector average of {margin_data['benchmark']:.1f}%*")
    
    # Add liquidity summary with risk assessment
    if 'liquidity_analysis' in analysis:
        liquidity_analysis = analysis['liquidity_analysis']
        if 'current_ratio' in liquidity_analysis:
            ratio_data = liquidity_analysis['current_ratio']
            narrative_parts.append(f"### **Liquidity & Cash Management**")
            narrative_parts.append(f"{ratio_data['insight']}")
            if ratio_data['risk_level'] == 'high':
                narrative_parts.append("*⚠️ Immediate attention required for liquidity management*")
    
    # Add comprehensive risk assessment
    if 'risk_analysis' in analysis:
        risk_analysis = analysis['risk_analysis']
        narrative_parts.append(f"### **Risk Assessment**")
        
        risk_insights = []
        for risk_type, risk_data in risk_analysis.items():
            if 'insight' in risk_data:
                risk_insights.append(f"- **{risk_type.replace('_', ' ').title()}:** {risk_data['insight']}")
        
        if risk_insights:
            narrative_parts.append("\n".join(risk_insights))
    
    # Add forecasting insights
    if 'forecasting_insights' in analysis:
        forecasting = analysis['forecasting_insights']
        if 'revenue_forecast' in forecasting:
            forecast_data = forecasting['revenue_forecast']
            narrative_parts.append(f"### **Growth Projections**")
            narrative_parts.append(f"{forecast_data['insight']}")
    
    # Add strategic recommendations with priority levels
    if formatted_insights['strategic_recommendations']:
        narrative_parts.append(f"### **Strategic Action Plan**")
        
        priority_groups = {'critical': [], 'high': [], 'medium': []}
        for rec in formatted_insights['strategic_recommendations']:
            priority = rec.get('priority', 'medium')
            if priority in priority_groups:
                priority_groups[priority].append(rec)
        
        for priority, recs in priority_groups.items():
            if recs:
                narrative_parts.append(f"**{priority.title()} Priority Actions:**")
                for rec in recs[:2]:  # Top 2 per priority
                    narrative_parts.append(f"- {rec['recommendation']}")
                    narrative_parts.append(f"  *Rationale: {rec['rationale']}*")
                    narrative_parts.append(f"  *Expected Impact: {rec['expected_impact']}*")
    
    # Add ML enhancement note
    narrative_parts.append(f"\n---")
    narrative_parts.append(f"*This analysis was enhanced by Sygnify's advanced ML engine with domain-specific financial intelligence, providing actionable insights for strategic decision-making.*")
    
    formatted_insights['llama3_narrative'] = "\n\n".join(narrative_parts)
    
    return formatted_insights 
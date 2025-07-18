import pandas as pd
import numpy as np
import json
from typing import Dict, List, Any, Tuple
import logging
from datetime import datetime, timedelta
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartNarrativeGenerator:
    def __init__(self):
        self.domain_templates = {
            'advertising': {
                'performance_insights': [
                    "Campaign {campaign} shows {performance_level} performance with {metric_value} {metric_name}.",
                    "The {top_performer} campaign outperforms others by {improvement_percentage}% in {metric_name}.",
                    "Audience segment {segment} demonstrates {behavior_pattern} with {metric_value} {metric_name}."
                ],
                'trend_insights': [
                    "{metric_name} has been {trend_direction} by {trend_percentage}% over the last {time_period}.",
                    "Seasonal patterns show {seasonal_behavior} in {metric_name} during {season_period}.",
                    "The {metric_name} trend indicates {trend_interpretation} for future campaigns."
                ],
                'recommendations': [
                    "Optimize {campaign} by {optimization_action} to improve {target_metric}.",
                    "Consider {recommended_action} for {audience_segment} to enhance {expected_outcome}.",
                    "Allocate budget towards {high_performing_campaign} to maximize {roi_metric}."
                ]
            },
            'finance': {
                'performance_insights': [
                    "Revenue growth shows {growth_pattern} with {revenue_value} in {time_period}.",
                    "Profit margins are {margin_status} at {margin_percentage}%, {margin_interpretation}.",
                    "Cash flow demonstrates {cash_flow_pattern} with {cash_flow_value} available."
                ],
                'trend_insights': [
                    "Financial performance has been {trend_direction} by {trend_percentage}% over {time_period}.",
                    "Seasonal revenue patterns indicate {seasonal_behavior} during {season_period}.",
                    "The {metric_name} trend suggests {trend_interpretation} for financial planning."
                ],
                'recommendations': [
                    "Implement {cost_control_measure} to improve {target_metric} by {expected_improvement}%.",
                    "Consider {investment_strategy} to optimize {roi_metric} and {risk_mitigation}.",
                    "Focus on {revenue_optimization} to achieve {target_outcome} within {timeframe}."
                ]
            },
            'supply_chain': {
                'performance_insights': [
                    "Supplier {supplier_name} shows {performance_level} with {lead_time} days lead time.",
                    "Inventory levels are {inventory_status} at {inventory_value} units, {inventory_interpretation}.",
                    "Demand forecasting accuracy is {accuracy_level} with {forecast_error}% variance."
                ],
                'trend_insights': [
                    "Supply chain efficiency has {trend_direction} by {trend_percentage}% over {time_period}.",
                    "Seasonal demand patterns show {seasonal_behavior} during {season_period}.",
                    "The {metric_name} trend indicates {trend_interpretation} for supply planning."
                ],
                'recommendations': [
                    "Optimize {supplier_name} relationship by {optimization_action} to reduce {target_metric}.",
                    "Implement {inventory_strategy} to maintain {optimal_levels} and {cost_reduction}.",
                    "Enhance {forecasting_method} to improve {accuracy_metric} by {expected_improvement}%."
                ]
            },
            'hr': {
                'performance_insights': [
                    "Employee satisfaction scores are {satisfaction_level} at {satisfaction_score} points.",
                    "Turnover rate is {turnover_status} at {turnover_percentage}%, {turnover_interpretation}.",
                    "Productivity metrics show {productivity_level} performance with {productivity_value}."
                ],
                'trend_insights': [
                    "Employee engagement has {trend_direction} by {trend_percentage}% over {time_period}.",
                    "Seasonal hiring patterns indicate {seasonal_behavior} during {season_period}.",
                    "The {metric_name} trend suggests {trend_interpretation} for HR planning."
                ],
                'recommendations': [
                    "Implement {retention_strategy} to reduce {turnover_metric} by {expected_reduction}%.",
                    "Enhance {training_program} to improve {productivity_metric} and {employee_satisfaction}.",
                    "Focus on {engagement_initiative} to boost {morale_metric} and {retention_outcome}."
                ]
            },
            'operations': {
                'performance_insights': [
                    "Production efficiency is {efficiency_level} at {efficiency_percentage}% capacity utilization.",
                    "Quality metrics show {quality_status} with {defect_rate}% defect rate.",
                    "Downtime has been {downtime_status} at {downtime_percentage}% of total operating time."
                ],
                'trend_insights': [
                    "Operational performance has {trend_direction} by {trend_percentage}% over {time_period}.",
                    "Seasonal production patterns show {seasonal_behavior} during {season_period}.",
                    "The {metric_name} trend indicates {trend_interpretation} for operational planning."
                ],
                'recommendations': [
                    "Optimize {production_process} to increase {efficiency_metric} by {expected_improvement}%.",
                    "Implement {quality_control} measures to reduce {defect_metric} and {cost_savings}.",
                    "Enhance {maintenance_schedule} to minimize {downtime_metric} and {productivity_gain}."
                ]
            }
        }
        
        self.insight_categories = {
            'anomaly': 'Anomaly Detection',
            'trend': 'Trend Analysis',
            'correlation': 'Correlation Analysis',
            'distribution': 'Distribution Analysis',
            'seasonality': 'Seasonal Patterns',
            'performance': 'Performance Metrics',
            'comparison': 'Comparative Analysis',
            'forecast': 'Forecasting'
        }
    
    def generate_comprehensive_narrative(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], 
                                       external_insights: List[Dict[str, Any]], domain: str) -> Dict[str, Any]:
        """Generate comprehensive narrative with multiple insight categories"""
        narrative = {
            'executive_summary': self._generate_executive_summary(data_profile, analysis_results, domain),
            'key_insights': self._generate_key_insights(data_profile, analysis_results, domain),
            'trend_analysis': self._generate_trend_analysis(data_profile, analysis_results, domain),
            'anomaly_insights': self._generate_anomaly_insights(data_profile, domain),
            'correlation_insights': self._generate_correlation_insights(data_profile, domain),
            'performance_benchmarks': self._generate_performance_benchmarks(data_profile, analysis_results, domain),
            'external_context': self._integrate_external_insights(external_insights, domain),
            'actionable_recommendations': self._generate_actionable_recommendations(data_profile, analysis_results, domain),
            'risk_assessment': self._generate_risk_assessment(data_profile, analysis_results, domain),
            'opportunity_identification': self._generate_opportunity_identification(data_profile, analysis_results, domain)
        }
        
        return narrative
    
    def _generate_executive_summary(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> str:
        """Generate high-level executive summary"""
        structure = data_profile['structure']
        summary_parts = []
        
        # Data overview
        summary_parts.append(f"This {domain.replace('_', ' ').title()} analysis covers {structure['shape'][0]:,} data points across {structure['shape'][1]} key metrics.")
        
        # Domain detection confidence
        if data_profile.get('confidence', 0) > 0.7:
            summary_parts.append(f"Domain detection confidence is {data_profile['confidence']:.1%}, indicating strong alignment with {domain} patterns.")
        
        # Key findings
        if analysis_results.get('analysis'):
            summary_parts.append(f"Primary analysis reveals {self._extract_key_finding(analysis_results['analysis'])}")
        
        # Data quality
        missing_count = sum(1 for v in structure['missing_values'].values() if v > 0)
        if missing_count == 0:
            summary_parts.append("Data quality is excellent with no missing values detected.")
        elif missing_count < 3:
            summary_parts.append(f"Data quality is good with minor missing values in {missing_count} columns.")
        else:
            summary_parts.append(f"Data quality requires attention with missing values in {missing_count} columns.")
        
        return " ".join(summary_parts)
    
    def _generate_key_insights(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate key insights with confidence scores"""
        insights = []
        structure = data_profile['structure']
        
        # Performance insights
        if domain in self.domain_templates:
            template = self.domain_templates[domain]
            
            # Extract metrics from analysis results
            if analysis_results.get('analysis'):
                metrics = self._extract_metrics_from_analysis(analysis_results['analysis'])
                
                for metric_name, metric_value in metrics.items():
                    if metric_name in structure['numerical_columns']:
                        performance_level = self._classify_performance_level(metric_value, structure, metric_name)
                        
                        insight_text = template['performance_insights'][0].format(
                            campaign="primary",
                            performance_level=performance_level,
                            metric_value=f"{metric_value:.2f}",
                            metric_name=metric_name.replace('_', ' ')
                        )
                        
                        insights.append({
                            'category': 'Performance',
                            'insight': insight_text,
                            'confidence': 0.85,
                            'impact': 'high',
                            'metric': metric_name,
                            'value': metric_value
                        })
        
        # Distribution insights
        if structure.get('patterns', {}).get('distributions'):
            for col, dist_info in structure['patterns']['distributions'].items():
                if dist_info['distribution_type'] != 'normal':
                    insight_text = f"{col.replace('_', ' ').title()} shows a {dist_info['distribution_type']} distribution, indicating {self._interpret_distribution(dist_info['distribution_type'])}."
                    
                    insights.append({
                        'category': 'Distribution',
                        'insight': insight_text,
                        'confidence': 0.90,
                        'impact': 'medium',
                        'metric': col,
                        'distribution_type': dist_info['distribution_type']
                    })
        
        return insights
    
    def _generate_trend_analysis(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate trend analysis insights"""
        trends = []
        structure = data_profile['structure']
        
        if structure.get('patterns', {}).get('trends'):
            for trend_key, trend_info in structure['patterns']['trends'].items():
                trend_direction = trend_info['direction']
                trend_strength = trend_info['strength']
                
                # Parse trend key to get columns
                if '_' in trend_key:
                    temp_col, num_col = trend_key.rsplit('_', 1)
                    
                    trend_text = f"{num_col.replace('_', ' ').title()} shows a {trend_direction} trend with {trend_strength:.2f} strength over time."
                    
                    trends.append({
                        'category': 'Trend',
                        'insight': trend_text,
                        'confidence': 0.80,
                        'impact': 'high',
                        'temporal_column': temp_col,
                        'metric': num_col,
                        'direction': trend_direction,
                        'strength': trend_strength
                    })
        
        return trends
    
    def _generate_anomaly_insights(self, data_profile: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate anomaly detection insights"""
        anomalies = []
        structure = data_profile['structure']
        
        if structure.get('anomalies'):
            for col, anomaly_data in structure['anomalies'].items():
                outlier_percentage = anomaly_data['outlier_percentage']
                
                if outlier_percentage > 5:
                    severity = 'high' if outlier_percentage > 15 else 'medium'
                    
                    anomaly_text = f"Anomalies detected in {col.replace('_', ' ').title()} with {outlier_percentage:.1f}% outliers, requiring investigation."
                    
                    anomalies.append({
                        'category': 'Anomaly',
                        'insight': anomaly_text,
                        'confidence': 0.95,
                        'impact': severity,
                        'metric': col,
                        'outlier_percentage': outlier_percentage,
                        'statistical_outliers': anomaly_data['statistical_outliers'],
                        'isolation_forest_outliers': anomaly_data['isolation_forest_outliers']
                    })
        
        return anomalies
    
    def _generate_correlation_insights(self, data_profile: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate correlation analysis insights"""
        correlations = []
        structure = data_profile['structure']
        
        if structure.get('correlations', {}).get('high_correlations'):
            for corr in structure['correlations']['high_correlations']:
                corr_value = corr['correlation']
                col1, col2 = corr['col1'], corr['col2']
                
                correlation_strength = 'strong' if abs(corr_value) > 0.8 else 'moderate'
                correlation_type = 'positive' if corr_value > 0 else 'negative'
                
                corr_text = f"{col1.replace('_', ' ').title()} and {col2.replace('_', ' ').title()} show a {correlation_strength} {correlation_type} correlation ({corr_value:.2f})."
                
                correlations.append({
                    'category': 'Correlation',
                    'insight': corr_text,
                    'confidence': 0.85,
                    'impact': 'medium',
                    'metric1': col1,
                    'metric2': col2,
                    'correlation': corr_value,
                    'strength': correlation_strength,
                    'type': correlation_type
                })
        
        return correlations
    
    def _generate_performance_benchmarks(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate performance benchmarking insights"""
        benchmarks = []
        structure = data_profile['structure']
        
        # Compare against domain-specific benchmarks
        if domain in self.domain_templates:
            domain_benchmarks = self._get_domain_benchmarks(domain)
            
            for col in structure['numerical_columns']:
                if col in domain_benchmarks:
                    current_value = structure['patterns']['distributions'][col]['mean']
                    benchmark_value = domain_benchmarks[col]
                    
                    performance_ratio = current_value / benchmark_value
                    
                    if performance_ratio > 1.2:
                        performance_status = 'exceeding'
                        benchmark_text = f"{col.replace('_', ' ').title()} performance exceeds industry benchmark by {(performance_ratio - 1) * 100:.1f}%."
                    elif performance_ratio < 0.8:
                        performance_status = 'below'
                        benchmark_text = f"{col.replace('_', ' ').title()} performance is {(1 - performance_ratio) * 100:.1f}% below industry benchmark."
                    else:
                        performance_status = 'meeting'
                        benchmark_text = f"{col.replace('_', ' ').title()} performance meets industry benchmark standards."
                    
                    benchmarks.append({
                        'category': 'Benchmark',
                        'insight': benchmark_text,
                        'confidence': 0.75,
                        'impact': 'high' if performance_status != 'meeting' else 'medium',
                        'metric': col,
                        'current_value': current_value,
                        'benchmark_value': benchmark_value,
                        'performance_ratio': performance_ratio,
                        'status': performance_status
                    })
        
        return benchmarks
    
    def _integrate_external_insights(self, external_insights: List[Dict[str, Any]], domain: str) -> List[Dict[str, Any]]:
        """Integrate external market insights"""
        integrated_insights = []
        
        for insight in external_insights:
            if insight.get('impact') and insight.get('summary'):
                integrated_insights.append({
                    'category': 'External Context',
                    'insight': f"Market context: {insight['summary']} This may impact {insight['impact']}.",
                    'confidence': 0.70,
                    'impact': 'medium',
                    'source': 'external',
                    'title': insight.get('title', 'Market Update'),
                    'impact_description': insight.get('impact', 'general operations')
                })
        
        return integrated_insights
    
    def _generate_actionable_recommendations(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate actionable recommendations with priority levels"""
        recommendations = []
        structure = data_profile['structure']
        
        # Data quality recommendations
        missing_cols = [k for k, v in structure['missing_values'].items() if v > 0]
        if missing_cols:
            recommendations.append({
                'category': 'Data Quality',
                'recommendation': f"Implement data imputation for {', '.join(missing_cols[:3])} to improve analysis accuracy.",
                'priority': 'high',
                'effort': 'medium',
                'expected_impact': 'high',
                'timeline': '1-2 weeks'
            })
        
        # Anomaly recommendations
        high_anomaly_cols = [k for k, v in structure['anomalies'].items() if v['outlier_percentage'] > 10]
        if high_anomaly_cols:
            recommendations.append({
                'category': 'Anomaly Management',
                'recommendation': f"Investigate root causes of anomalies in {', '.join(high_anomaly_cols[:2])}.",
                'priority': 'high',
                'effort': 'high',
                'expected_impact': 'high',
                'timeline': '2-4 weeks'
            })
        
        # Domain-specific recommendations
        if domain in self.domain_templates:
            template = self.domain_templates[domain]
            
            if domain == 'advertising':
                recommendations.append({
                    'category': 'Campaign Optimization',
                    'recommendation': "Implement A/B testing for underperforming campaigns to identify optimization opportunities.",
                    'priority': 'medium',
                    'effort': 'medium',
                    'expected_impact': 'high',
                    'timeline': '3-4 weeks'
                })
            elif domain == 'finance':
                recommendations.append({
                    'category': 'Financial Planning',
                    'recommendation': "Establish automated monitoring for cash flow patterns to enable proactive financial management.",
                    'priority': 'high',
                    'effort': 'medium',
                    'expected_impact': 'high',
                    'timeline': '2-3 weeks'
                })
            elif domain == 'supply_chain':
                recommendations.append({
                    'category': 'Supplier Management',
                    'recommendation': "Develop supplier performance scorecards to optimize procurement decisions.",
                    'priority': 'medium',
                    'effort': 'high',
                    'expected_impact': 'medium',
                    'timeline': '4-6 weeks'
                })
        
        return recommendations
    
    def _generate_risk_assessment(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate risk assessment insights"""
        risks = []
        structure = data_profile['structure']
        
        # Data quality risks
        missing_count = sum(1 for v in structure['missing_values'].values() if v > 0)
        if missing_count > 5:
            risks.append({
                'category': 'Data Quality Risk',
                'risk': f"High missing data rate ({missing_count} columns) may lead to biased analysis results.",
                'severity': 'high',
                'probability': 'medium',
                'mitigation': 'Implement data validation and cleaning procedures.'
            })
        
        # Anomaly risks
        high_anomaly_count = sum(1 for v in structure['anomalies'].values() if v['outlier_percentage'] > 15)
        if high_anomaly_count > 0:
            risks.append({
                'category': 'Operational Risk',
                'risk': f"High anomaly rates in {high_anomaly_count} metrics may indicate operational issues.",
                'severity': 'medium',
                'probability': 'high',
                'mitigation': 'Establish anomaly monitoring and alerting systems.'
            })
        
        # Domain-specific risks
        if domain == 'finance':
            risks.append({
                'category': 'Financial Risk',
                'risk': "Cash flow volatility may impact financial stability and planning.",
                'severity': 'high',
                'probability': 'medium',
                'mitigation': 'Implement cash flow forecasting and monitoring tools.'
            })
        elif domain == 'supply_chain':
            risks.append({
                'category': 'Supply Chain Risk',
                'risk': "Supplier performance variability may lead to supply disruptions.",
                'severity': 'high',
                'probability': 'medium',
                'mitigation': 'Develop supplier diversification and contingency plans.'
            })
        
        return risks
    
    def _generate_opportunity_identification(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate opportunity identification insights"""
        opportunities = []
        structure = data_profile['structure']
        
        # Performance improvement opportunities
        if structure.get('patterns', {}).get('distributions'):
            for col, dist_info in structure['patterns']['distributions'].items():
                if dist_info['skewness'] > 1:  # Right-skewed distribution
                    opportunities.append({
                        'category': 'Performance Optimization',
                        'opportunity': f"Optimize {col.replace('_', ' ').title()} processes to shift distribution towards higher values.",
                        'potential_impact': 'high',
                        'effort_required': 'medium',
                        'timeframe': '3-6 months'
                    })
        
        # Correlation opportunities
        if structure.get('correlations', {}).get('high_correlations'):
            for corr in structure['correlations']['high_correlations']:
                if corr['correlation'] > 0.8:  # Strong positive correlation
                    opportunities.append({
                        'category': 'Synergy Opportunity',
                        'opportunity': f"Leverage strong correlation between {corr['col1']} and {corr['col2']} for joint optimization.",
                        'potential_impact': 'medium',
                        'effort_required': 'low',
                        'timeframe': '1-2 months'
                    })
        
        return opportunities
    
    def _extract_key_finding(self, analysis_text: str) -> str:
        """Extract key finding from analysis text"""
        # Simple extraction - in practice, this would use NLP
        sentences = analysis_text.split('.')
        if sentences:
            return sentences[0] + '.'
        return "significant patterns and trends in the data."
    
    def _extract_metrics_from_analysis(self, analysis_text: str) -> Dict[str, float]:
        """Extract metrics from analysis results"""
        # This is a simplified version - in practice, would use more sophisticated parsing
        metrics = {}
        # Look for patterns like "metric: value" or "metric = value"
        patterns = [
            r'(\w+):\s*([\d.]+)',
            r'(\w+)\s*=\s*([\d.]+)',
            r'(\w+)\s+is\s+([\d.]+)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, analysis_text.lower())
            for metric, value in matches:
                try:
                    metrics[metric] = float(value)
                except ValueError:
                    continue
        
        return metrics
    
    def _classify_performance_level(self, value: float, structure: Dict[str, Any], metric: str) -> str:
        """Classify performance level based on value and context"""
        if metric in structure.get('patterns', {}).get('distributions', {}):
            dist_info = structure['patterns']['distributions'][metric]
            mean_val = dist_info['mean']
            
            if value > mean_val * 1.2:
                return 'excellent'
            elif value > mean_val * 1.1:
                return 'good'
            elif value > mean_val * 0.9:
                return 'average'
            else:
                return 'below average'
        
        return 'moderate'
    
    def _interpret_distribution(self, distribution_type: str) -> str:
        """Interpret distribution type for insights"""
        interpretations = {
            'right_skewed': 'asymmetric distribution with higher values being less frequent',
            'left_skewed': 'asymmetric distribution with lower values being less frequent',
            'heavy_tailed': 'presence of extreme values or outliers',
            'normal': 'typical bell-shaped distribution'
        }
        return interpretations.get(distribution_type, 'non-standard distribution pattern')
    
    def _get_domain_benchmarks(self, domain: str) -> Dict[str, float]:
        """Get industry benchmarks for domain metrics"""
        benchmarks = {
            'advertising': {
                'ctr': 2.0,
                'cpc': 1.50,
                'roas': 4.0,
                'conversion_rate': 2.5
            },
            'finance': {
                'revenue': 1000000,
                'profit_margin': 15.0,
                'roi': 12.0,
                'cash_flow': 100000
            },
            'supply_chain': {
                'lead_time': 14.0,
                'inventory_turnover': 8.0,
                'fill_rate': 95.0,
                'efficiency': 85.0
            },
            'hr': {
                'turnover_rate': 15.0,
                'satisfaction_score': 7.5,
                'productivity': 85.0,
                'attendance_rate': 95.0
            },
            'operations': {
                'production_efficiency': 85.0,
                'quality_score': 98.0,
                'downtime_percentage': 5.0,
                'capacity_utilization': 80.0
            }
        }
        return benchmarks.get(domain, {})

def generate_smart_narrative(data_path: str, domain: str = 'general', external_insights: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Main function to generate smart narrative"""
    try:
        # Import required modules
        from advancedDataComprehension import analyze_data_comprehension
        
        # Get data profile
        data_profile = analyze_data_comprehension(data_path)
        if 'error' in data_profile:
            return data_profile
        
        # Mock analysis results for demonstration
        analysis_results = {
            'analysis': 'Sample analysis results with key metrics and insights',
            'narrative': 'Generated narrative text'
        }
        
        # Generate comprehensive narrative
        generator = SmartNarrativeGenerator()
        narrative = generator.generate_comprehensive_narrative(
            data_profile, analysis_results, external_insights or [], domain
        )
        
        return narrative
        
    except Exception as e:
        logger.error(f"Narrative generation failed: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import sys
    data_path = sys.argv[1]
    domain = sys.argv[2] if len(sys.argv) > 2 else 'general'
    result = generate_smart_narrative(data_path, domain)
    print(json.dumps(result, indent=2)) 
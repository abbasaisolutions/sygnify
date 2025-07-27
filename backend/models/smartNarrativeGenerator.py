import json
from typing import Dict, List, Any
import logging
import re
import yaml

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
    
    def generate_comprehensive_narrative(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], external_insights: List[Dict[str, Any]], domain: str) -> Dict[str, Any]:
        narrative = {}
        structure = data_profile['structure']
        df = analysis_results.get('dataframe')
        # Smart fallback for small datasets
        if df is not None and len(df) < 1000:
            narrative['data_warning'] = "Data volume is limited. Statistical confidence may be lower, and anomaly detection might be less reliable."
        # Minimal health score if basic columns exist
        if df is not None:
            min_score, liquidity, profit_margin, volatility = self._compute_minimal_health_score(df)
            narrative['financial_health_score'] = {
                'score': min_score,
                'liquidity': liquidity,
                'profit_margin': profit_margin,
                'volatility': volatility
            }
        # LLaMA 3 narrative (required)
        metrics = {
            'score': narrative['financial_health_score']['score'] if 'financial_health_score' in narrative else None,
            'correlation': None,
            'volatility': narrative['financial_health_score'].get('volatility') if 'financial_health_score' in narrative else None,
            'record_count': len(df) if df is not None else None
        }
        # Find a moderate correlation for narrative
        narrative['key_insights'] = self._generate_key_insights(data_profile, analysis_results, domain)
        for insight in narrative['key_insights']:
            if insight.get('category') == 'Correlation' and abs(insight.get('correlation', 0)) > 0.3 and abs(insight.get('correlation', 0)) < 1.0:
                metrics['correlation'] = insight['correlation']
                break
        context = {'interest_rate': None}
        narrative['external_context'] = self._integrate_external_insights(external_insights, domain)
        for ext in narrative['external_context']:
            if 'interest rate' in ext.get('insight', '').lower():
                context['interest_rate'] = ext['insight']
                break
        findings = [i['insight'] for i in narrative['key_insights'][:3]]
        llama_narr = self._llama3_narrative(metrics, findings, context)
        if not llama_narr:
            raise RuntimeError('LLaMA 3 narrative generation failed: No output from LLaMA 3. Please check your LLaMA 3 service.')
        narrative['llama3_narrative'] = llama_narr
        # Remove all template-based or generic narrative logic
        return narrative
    
    def _compute_financial_health_score(self, df):
        # Example: Use ratios if available
        ratios = self._compute_financial_ratios(df)
        score = 0
        components = []
        if 'current_ratio' in ratios:
            if ratios['current_ratio'] >= 1.5:
                score += 1
                components.append('Good liquidity')
            else:
                components.append('Low liquidity')
        if 'net_margin' in ratios:
            if ratios['net_margin'] >= 0.15:
                score += 1
                components.append('Strong profitability')
            else:
                components.append('Low profitability')
        if 'debt_equity' in ratios:
            if ratios['debt_equity'] < 2:
                score += 1
                components.append('Healthy leverage')
            else:
                components.append('High leverage')
        if score == 3:
            return 'HIGH', components
        elif score == 2:
            return 'MEDIUM', components
        elif score == 1:
            return 'LOW', components
        else:
            return 'N/A', ['Insufficient data for health score']

    def _compute_minimal_health_score(self, df):
        try:
            liquidity = df['net_cash_flow'].mean() if 'net_cash_flow' in df else None
            profit_margin = (df['net_profit'] / df['revenue']).mean() if 'net_profit' in df and 'revenue' in df else None
            volatility = df['net_cash_flow'].std() if 'net_cash_flow' in df else None
            if liquidity is not None and profit_margin is not None and volatility is not None:
                score = (liquidity * 0.4 + profit_margin * 0.4 + (1 - volatility) * 0.2)
                return round(score * 100, 2), liquidity, profit_margin, volatility
            else:
                return 'Not Enough Data', liquidity, profit_margin, volatility
        except Exception:
            return 'Not Enough Data', None, None, None

    def _llama3_narrative(self, metrics: dict, findings: list, context: dict):
        try:
            from backend.api.services.llama3_service import query_llama3
            prompt = f"""
You are an AI Financial Analyst. Analyze the following data:
- Financial Health Score: {metrics.get('score')}
- Correlation: {metrics.get('correlation')}
- Volatility: {metrics.get('volatility')}
- Interest Rate: {context.get('interest_rate')}
- Record Count: {metrics.get('record_count')}
Key findings: {findings}
Generate a concise 2-paragraph narrative summary with risks, opportunities, and recommendations.
"""
            result = query_llama3(prompt)
            if result and not result.startswith("LLaMA 3 analysis failed") and not result.startswith("Analysis timed out"):
                return result
            else:
                # Fallback to template-based narrative
                return self._generate_fallback_narrative(metrics, findings, context)
        except Exception as e:
            print(f"LLaMA 3 narrative generation failed: {e}")
            return self._generate_fallback_narrative(metrics, findings, context)
    
    def _generate_fallback_narrative(self, metrics: dict, findings: list, context: dict):
        """Generate a fallback narrative when LLaMA3 is unavailable"""
        narrative_parts = []
        
        # First paragraph - Data overview
        if metrics.get('record_count'):
            narrative_parts.append(f"Analysis of {metrics.get('record_count')} financial records reveals key patterns and insights.")
        
        if metrics.get('correlation'):
            narrative_parts.append(f"Data correlation analysis shows {metrics.get('correlation'):.2f} correlation strength, indicating moderate relationships between key metrics.")
        
        if context.get('interest_rate'):
            narrative_parts.append(f"Current interest rate environment at {context.get('interest_rate')}% suggests careful consideration of borrowing costs and investment strategies.")
        
        # Second paragraph - Recommendations
        narrative_parts.append("Based on the analysis, key recommendations include monitoring data quality, implementing correlation-based insights, and adapting strategies to current market conditions.")
        
        if findings:
            narrative_parts.append(f"Specific findings indicate {len(findings)} areas requiring attention, with focus on data-driven decision making and risk management.")
        
        return " ".join(narrative_parts)

    def _generate_executive_summary(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> str:
        """Generate high-level executive summary with sweetviz profiling"""
        structure = data_profile['structure']
        summary_parts = []
        sweetviz_summary = data_profile.get('sweetviz_summary', {})
        # Data overview
        summary_parts.append(f"This {domain.replace('_', ' ').title()} analysis covers {structure['shape'][0]:,} data points across {structure['shape'][1]} key metrics.")
        # Financial Health Score
        df = analysis_results.get('dataframe')
        if df is not None:
            score, components = self._compute_financial_health_score(df)
            summary_parts.append(f"Financial Health Score: {score}. {'; '.join(components)}.")
        else:
            summary_parts.append("Financial Health Score: N/A. Data not sufficient for computation.")
        # Sweetviz: missing data
        if sweetviz_summary.get('missing', 0) > 0:
            top_missing = sweetviz_summary.get('top_missing_cols', {})
            missing_str = ', '.join([f"{col} ({cnt} missing)" for col, cnt in top_missing.items()])
            summary_parts.append(f"Columns with most missing data: {missing_str}.")
        # Sweetviz: top correlations
        if sweetviz_summary.get('top_corrs'):
            top_corrs = sweetviz_summary['top_corrs']
            corr_str = '; '.join([f"{k[0]} & {k[1]} ({v:.2f})" if isinstance(k, tuple) else f"{k} ({v:.2f})" for k, v in top_corrs.items()])
            summary_parts.append(f"Strongest correlations: {corr_str}.")
        # Data quality
        missing_count = sum(1 for v in structure['missing_values'].values() if v > 0)
        if missing_count == 0:
            summary_parts.append("Data quality is excellent with no missing values detected.")
        elif missing_count < 3:
            summary_parts.append(f"Data quality is good with minor missing values in {missing_count} columns.")
        else:
            summary_parts.append(f"Data quality requires attention with missing values in {missing_count} columns.")
        return " ".join(summary_parts)

    def _get_industry_benchmarks(self, sector: str) -> dict:
        import pandas as pd
        import os
        path = os.path.join(os.path.dirname(__file__), '../data/industry_benchmarks.csv')
        df = pd.read_csv(path)
        row = df[df['sector'].str.lower() == sector.lower()]
        if not row.empty:
            return row.iloc[0].to_dict()
        return {}

    def _compute_financial_ratios(self, df):
        ratios = {}
        # Example: Compute ratios if columns exist
        if 'CurrentAssets' in df and 'CurrentLiabilities' in df:
            ratios['current_ratio'] = df['CurrentAssets'].sum() / df['CurrentLiabilities'].sum()
        if 'QuickAssets' in df and 'CurrentLiabilities' in df:
            ratios['quick_ratio'] = df['QuickAssets'].sum() / df['CurrentLiabilities'].sum()
        if 'NetIncome' in df and 'Revenue' in df:
            ratios['net_margin'] = df['NetIncome'].sum() / df['Revenue'].sum()
        if 'NetIncome' in df and 'TotalAssets' in df:
            ratios['roa'] = df['NetIncome'].sum() / df['TotalAssets'].sum()
        if 'NetIncome' in df and 'TotalEquity' in df:
            ratios['roe'] = df['NetIncome'].sum() / df['TotalEquity'].sum()
        if 'NetIncome' in df and 'TotalInvestment' in df:
            ratios['roi'] = df['NetIncome'].sum() / df['TotalInvestment'].sum()
        return ratios

    def _analyze_financial_trends(self, df):
        import pandas as pd
        trends = []
        # Example: Monthly revenue trend
        if 'Date' in df and 'Revenue' in df:
            df['Date'] = pd.to_datetime(df['Date'])
            monthly = df.set_index('Date').resample('M')['Revenue'].sum()
            growth = (monthly.iloc[-1] - monthly.iloc[0]) / monthly.iloc[0] if len(monthly) > 1 else 0
            trends.append({
                'metric': 'Revenue',
                'trend': f"Revenue {'increased' if growth > 0 else 'decreased'} by {growth*100:.1f}% over the period.",
                'growth': growth
            })
        # Add similar for Expenses, Profit, Cash Flow
        return trends

    def _detect_financial_anomalies(self, df):
        anomalies = []
        # Example: Z-score for Revenue
        if 'Revenue' in df:
            rev = df['Revenue'].dropna()
            if len(rev) > 2:
                z = (rev - rev.mean()) / rev.std()
                outliers = rev[abs(z) > 3]
                for idx, val in outliers.items():
                    anomalies.append({
                        'metric': 'Revenue',
                        'value': val,
                        'index': idx,
                        'insight': f"Unusual revenue value detected: {val} (z-score > 3)"
                    })
        # Add similar for Expenses, Profit, Cash Flow
        return anomalies

    def _generate_key_insights(self, data_profile: Dict[str, Any], analysis_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate key insights with sweetviz profiling"""
        insights = []
        structure = data_profile['structure']
        sweetviz_summary = data_profile.get('sweetviz_summary', {})
        # Financial ratio and benchmark comparison
        df = analysis_results.get('dataframe')
        sector = 'Banking'  # For demo, could be detected or user-supplied
        if df is not None:
            ratios = self._compute_financial_ratios(df)
            benchmarks = self._get_industry_benchmarks(sector)
            for k, v in ratios.items():
                if k in benchmarks:
                    bench = float(benchmarks[k])
                    if v < bench:
                        insights.append({
                            'category': 'Benchmark',
                            'insight': f"{k.replace('_', ' ').title()} ({v:.2f}) is below industry average ({bench:.2f}).",
                            'confidence': 0.9,
                            'impact': 'medium'
                        })
                    else:
                        insights.append({
                            'category': 'Benchmark',
                            'insight': f"{k.replace('_', ' ').title()} ({v:.2f}) is above industry average ({bench:.2f}).",
                            'confidence': 0.9,
                            'impact': 'medium'
                        })
            # Add trend and anomaly insights
            trends = self._analyze_financial_trends(df)
            for t in trends:
                insights.append({
                    'category': 'Trend',
                    'insight': t['trend'],
                    'confidence': 0.85,
                    'impact': 'medium',
                    'metric': t['metric']
                })
            anomalies = self._detect_financial_anomalies(df)
            for a in anomalies:
                insights.append({
                    'category': 'Anomaly',
                    'insight': a['insight'],
                    'confidence': 0.95,
                    'impact': 'high',
                    'metric': a['metric'],
                    'value': a['value'],
                    'index': a['index']
                })
        # Sweetviz: highlight top missing columns
        if sweetviz_summary.get('top_missing_cols'):
            top_missing = sweetviz_summary['top_missing_cols']
            insights.append({
                'category': 'Data Quality',
                'insight': f"Columns with most missing data: {', '.join([f'{col} ({cnt})' for col, cnt in top_missing.items()])}.",
                'confidence': 0.95,
                'impact': 'high'
            })
        # Sweetviz: highlight top correlations (filter self-matches, explain relevance)
        if sweetviz_summary.get('top_corrs'):
            top_corrs = sweetviz_summary['top_corrs']
            for k, v in list(top_corrs.items()):
                if isinstance(k, tuple):
                    col1, col2 = k
                else:
                    col1, col2 = str(k), ''
                if col1 == col2:
                    continue  # skip self-match
                relevance = 'These variables move together, which may indicate a causal or operational link.' if abs(v) > 0.8 else 'Moderate association; further analysis recommended.'
                insights.append({
                    'category': 'Correlation',
                    'insight': f"Strong correlation between {col1} and {col2} ({v:.2f}). {relevance}",
                    'confidence': 0.9,
                    'impact': 'medium',
                    'metric1': col1,
                    'metric2': col2,
                    'correlation': v
                })
        
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
        # Load metrics from config
        try:
            with open('config/platform_config.yaml') as f:
                config = yaml.safe_load(f)
            metrics = config.get('insights', {}).get('metrics', ["revenue", "churn", "engagement"])
        except Exception:
            metrics = ["revenue", "churn", "engagement"]
        # Add detailed trend logic for each metric
        for metric in metrics:
            if metric in analysis_results:
                values = analysis_results[metric]
                if isinstance(values, list) and values:
                    trend = f"{metric.title()} trend: {sum(values)/len(values):.2f} (mean)"
                else:
                    trend = f"{metric.title()} trend: {values}"
                trends.append({"metric": metric, "trend": trend, "category": "Trend", "confidence": 0.9, "impact": "high"})
        # Retain existing trend logic
        if structure.get('patterns', {}).get('trends'):
            for trend_key, trend_info in structure['patterns']['trends'].items():
                trend_direction = trend_info['direction']
                trend_strength = trend_info['strength']
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
        """Integrate external market insights with actionable, finance-specific context"""
        integrated_insights = []
        for insight in external_insights:
            if insight.get('impact') and insight.get('summary'):
                # Add more actionable, finance-specific context
                if domain == 'finance':
                    if 'interest rate' in insight['summary'].lower():
                        if 'rising' in insight['summary']:
                            advice = "Rising interest rates may increase borrowing costs. Consider refinancing or locking in fixed rates."
                        else:
                            advice = "Falling interest rates may present opportunities for new financing or investment."
                        integrated_insights.append({
                            'category': 'Market Context',
                            'insight': f"{insight['summary']} {advice}",
                            'confidence': 0.85,
                            'impact': 'high',
                            'source': 'external',
                            'title': insight.get('title', 'Market Update'),
                            'impact_description': insight.get('impact', 'general operations')
                        })
                    elif 'volatility' in insight['summary'].lower():
                        advice = "High volatility may require portfolio hedging or risk management adjustments."
                        integrated_insights.append({
                            'category': 'Market Volatility',
                            'insight': f"{insight['summary']} {advice}",
                            'confidence': 0.8,
                            'impact': 'medium',
                            'source': 'external',
                            'title': insight.get('title', 'Market Update'),
                            'impact_description': insight.get('impact', 'general operations')
                        })
                    else:
                        integrated_insights.append({
                            'category': 'External Context',
                            'insight': f"Market context: {insight['summary']} This may impact {insight['impact']}.",
                            'confidence': 0.70,
                            'impact': 'medium',
                            'source': 'external',
                            'title': insight.get('title', 'Market Update'),
                            'impact_description': insight.get('impact', 'general operations')
                        })
                else:
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
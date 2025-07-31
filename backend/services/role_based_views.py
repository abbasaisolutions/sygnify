"""
Role-Based Views Service v1.1
- Executive dashboard (high-level KPIs and summaries)
- Analyst view (detailed analysis and trends)
- Data Scientist view (technical details and model performance)
- Customizable user preferences
- Role-based data filtering and presentation
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RoleBasedViewsService:
    def __init__(self):
        self.role_configs = {
            "executive": {
                "max_insights": 5,
                "technical_level": "high_level",
                "focus_areas": ["summary", "trends", "risks", "recommendations"],
                "chart_types": ["summary", "trend", "gauge"],
                "detail_level": "overview"
            },
            "analyst": {
                "max_insights": 15,
                "technical_level": "moderate",
                "focus_areas": ["trends", "correlations", "anomalies", "forecasts"],
                "chart_types": ["line", "bar", "scatter", "heatmap"],
                "detail_level": "detailed"
            },
            "data_scientist": {
                "max_insights": 50,
                "technical_level": "technical",
                "focus_areas": ["model_performance", "statistical_tests", "algorithms", "raw_data"],
                "chart_types": ["all"],
                "detail_level": "comprehensive"
            }
        }
        
    def generate_role_based_insights(self, insights: Dict[str, Any], role: str) -> Dict[str, Any]:
        """Generate role-specific insights from the full analysis"""
        try:
            config = self.role_configs.get(role, self.role_configs["executive"])
            
            role_insights = {
                "role": role,
                "config": config,
                "summary": self._generate_role_summary(insights, config),
                "key_metrics": self._extract_key_metrics(insights, config),
                "trends": self._extract_trends(insights, config),
                "risks": self._extract_risks(insights, config),
                "recommendations": self._extract_recommendations(insights, config),
                "technical_details": self._extract_technical_details(insights, config),
                "visualization_suggestions": self._suggest_visualizations(insights, config)
            }
            
            return role_insights
            
        except Exception as e:
            logger.error(f"Role-based insights generation failed: {str(e)}")
            return {"error": f"Role-based insights generation failed: {str(e)}"}
    
    def _generate_role_summary(self, insights: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate role-appropriate summary"""
        try:
            if config["technical_level"] == "high_level":
                # Executive summary
                return {
                    "title": "Executive Summary",
                    "content": self._create_executive_summary(insights),
                    "key_points": self._extract_executive_key_points(insights),
                    "business_impact": self._assess_business_impact(insights)
                }
            elif config["technical_level"] == "moderate":
                # Analyst summary
                return {
                    "title": "Analytical Summary",
                    "content": self._create_analyst_summary(insights),
                    "key_findings": self._extract_analyst_findings(insights),
                    "trend_analysis": self._analyze_trends_for_analyst(insights)
                }
            else:
                # Data scientist summary
                return {
                    "title": "Technical Summary",
                    "content": self._create_technical_summary(insights),
                    "methodology": self._extract_methodology(insights),
                    "model_performance": self._extract_model_performance(insights)
                }
                
        except Exception as e:
            logger.error(f"Role summary generation failed: {str(e)}")
            return {"error": str(e)}
    
    def _create_executive_summary(self, insights: Dict[str, Any]) -> str:
        """Create executive-level summary"""
        try:
            summary_parts = []
            
            # Overall assessment
            if "key_insights" in insights:
                total_insights = len(insights["key_insights"])
                summary_parts.append(f"Analysis identified {total_insights} key insights across your data.")
            
            # Risk assessment
            if "anomalies" in insights and "summary" in insights["anomalies"]:
                anomaly_summary = insights["anomalies"]["summary"]
                if "high_risk_columns" in anomaly_summary:
                    high_risk_count = len(anomaly_summary["high_risk_columns"])
                    if high_risk_count > 0:
                        summary_parts.append(f"⚠️ {high_risk_count} columns show elevated risk levels requiring attention.")
            
            # Predictive insights
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "trends" in pred_summary:
                    trend_count = len(pred_summary["trends"])
                    summary_parts.append(f"📈 {trend_count} key trends identified for strategic planning.")
            
            # Market context
            if "external_context" in insights:
                summary_parts.append("🌍 External market factors have been integrated into the analysis.")
            
            return " ".join(summary_parts) if summary_parts else "Comprehensive analysis completed successfully."
            
        except Exception as e:
            logger.error(f"Executive summary creation failed: {str(e)}")
            return "Analysis completed with comprehensive insights generated."
    
    def _create_analyst_summary(self, insights: Dict[str, Any]) -> str:
        """Create analyst-level summary"""
        try:
            summary_parts = []
            
            # Data quality assessment
            if "key_insights" in insights:
                data_quality_insights = [i for i in insights["key_insights"] if "Data Quality" in i.get("category", "")]
                if data_quality_insights:
                    summary_parts.append(f"Data quality analysis reveals {len(data_quality_insights)} key findings.")
            
            # Correlation analysis
            if "key_insights" in insights:
                correlation_insights = [i for i in insights["key_insights"] if "correlation" in i.get("insight", "").lower()]
                if correlation_insights:
                    summary_parts.append(f"Correlation analysis identified {len(correlation_insights)} significant relationships.")
            
            # Anomaly detection
            if "anomalies" in insights and "summary" in insights["anomalies"]:
                anomaly_summary = insights["anomalies"]["summary"]
                if "total_anomalies" in anomaly_summary:
                    total_anomalies = anomaly_summary["total_anomalies"]
                    summary_parts.append(f"Anomaly detection found {total_anomalies} data points requiring investigation.")
            
            # Forecasting results
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "successful_forecasts" in pred_summary:
                    successful = pred_summary["successful_forecasts"]
                    total = pred_summary.get("total_columns", 0)
                    summary_parts.append(f"Forecasting models successfully generated predictions for {successful}/{total} variables.")
            
            return " ".join(summary_parts) if summary_parts else "Detailed analysis completed with comprehensive insights."
            
        except Exception as e:
            logger.error(f"Analyst summary creation failed: {str(e)}")
            return "Detailed analysis completed with comprehensive insights."
    
    def _create_technical_summary(self, insights: Dict[str, Any]) -> str:
        """Create data scientist-level summary"""
        try:
            summary_parts = []
            
            # Model performance
            if "predictions" in insights and "model_performance" in insights["predictions"]:
                model_perf = insights["predictions"]["model_performance"]
                if isinstance(model_perf, dict):
                    summary_parts.append(f"Model performance analysis completed for {len(model_perf)} variables.")
            
            # Algorithm details
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "best_performing_models" in pred_summary:
                    best_models = pred_summary["best_performing_models"]
                    if best_models:
                        top_model = best_models[0]["model"]
                        avg_score = best_models[0]["average_quality_score"]
                        summary_parts.append(f"Top performing algorithm: {top_model} (avg quality score: {avg_score:.3f})")
            
            # Statistical analysis
            if "anomalies" in insights and "summary" in insights["anomalies"]:
                anomaly_summary = insights["anomalies"]["summary"]
                if "columns_with_anomalies" in anomaly_summary:
                    columns_with_anomalies = anomaly_summary["columns_with_anomalies"]
                    total_columns = anomaly_summary.get("total_columns", 0)
                    summary_parts.append(f"Anomaly detection algorithms analyzed {columns_with_anomalies}/{total_columns} columns.")
            
            # Data processing details
            if "key_insights" in insights:
                total_insights = len(insights["key_insights"])
                summary_parts.append(f"Generated {total_insights} technical insights using multiple ML algorithms.")
            
            return " ".join(summary_parts) if summary_parts else "Technical analysis completed with comprehensive model evaluation."
            
        except Exception as e:
            logger.error(f"Technical summary creation failed: {str(e)}")
            return "Technical analysis completed with comprehensive model evaluation."
    
    def _extract_key_metrics(self, insights: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract key metrics based on role"""
        try:
            metrics = []
            
            if config["technical_level"] == "high_level":
                # Executive metrics
                if "key_insights" in insights:
                    for insight in insights["key_insights"][:config["max_insights"]]:
                        metrics.append({
                            "name": insight.get("category", "Unknown"),
                            "value": insight.get("insight", "N/A"),
                            "impact": insight.get("impact", "medium"),
                            "confidence": insight.get("confidence", 0.8)
                        })
            
            elif config["technical_level"] == "moderate":
                # Analyst metrics
                if "key_insights" in insights:
                    for insight in insights["key_insights"][:config["max_insights"]]:
                        metrics.append({
                            "name": insight.get("category", "Unknown"),
                            "value": insight.get("insight", "N/A"),
                            "correlation": insight.get("correlation", "N/A"),
                            "impact": insight.get("impact", "medium"),
                            "confidence": insight.get("confidence", 0.8)
                        })
            
            else:
                # Data scientist metrics
                if "key_insights" in insights:
                    for insight in insights["key_insights"][:config["max_insights"]]:
                        metrics.append({
                            "name": insight.get("category", "Unknown"),
                            "value": insight.get("insight", "N/A"),
                            "correlation": insight.get("correlation", "N/A"),
                            "impact": insight.get("impact", "medium"),
                            "confidence": insight.get("confidence", 0.8),
                            "method": insight.get("method", "N/A")
                        })
            
            return metrics
            
        except Exception as e:
            logger.error(f"Key metrics extraction failed: {str(e)}")
            return []
    
    def _extract_trends(self, insights: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract trends based on role"""
        try:
            trends = []
            
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "trends" in pred_summary:
                    for column, trend in pred_summary["trends"].items():
                        if config["technical_level"] == "high_level":
                            trends.append({
                                "metric": column,
                                "direction": trend,
                                "business_impact": self._assess_trend_impact(trend)
                            })
                        else:
                            trends.append({
                                "metric": column,
                                "direction": trend,
                                "confidence": 0.85,  # Placeholder
                                "method": "forecasting"
                            })
            
            return trends[:config["max_insights"]]
            
        except Exception as e:
            logger.error(f"Trend extraction failed: {str(e)}")
            return []
    
    def _extract_risks(self, insights: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract risks based on role"""
        try:
            risks = []
            
            if "anomalies" in insights and "summary" in insights["anomalies"]:
                anomaly_summary = insights["anomalies"]["summary"]
                if "high_risk_columns" in anomaly_summary:
                    for risk_column in anomaly_summary["high_risk_columns"]:
                        if config["technical_level"] == "high_level":
                            risks.append({
                                "risk_type": "Data Anomaly",
                                "metric": risk_column["column"],
                                "severity": "High" if risk_column["anomaly_percentage"] > 15 else "Medium",
                                "description": f"{risk_column['anomaly_percentage']:.1f}% of data points are anomalous"
                            })
                        else:
                            risks.append({
                                "risk_type": "Data Anomaly",
                                "metric": risk_column["column"],
                                "anomaly_percentage": risk_column["anomaly_percentage"],
                                "anomaly_count": risk_column["anomaly_count"],
                                "detection_methods": ["isolation_forest", "statistical", "z_score"]
                            })
            
            return risks[:config["max_insights"]]
            
        except Exception as e:
            logger.error(f"Risk extraction failed: {str(e)}")
            return []
    
    def _extract_recommendations(self, insights: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract recommendations based on role"""
        try:
            recommendations = []
            
            # Generate role-specific recommendations
            if config["technical_level"] == "high_level":
                recommendations = self._generate_executive_recommendations(insights)
            elif config["technical_level"] == "moderate":
                recommendations = self._generate_analyst_recommendations(insights)
            else:
                recommendations = self._generate_technical_recommendations(insights)
            
            return recommendations[:config["max_insights"]]
            
        except Exception as e:
            logger.error(f"Recommendation extraction failed: {str(e)}")
            return []
    
    def _extract_technical_details(self, insights: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Extract technical details based on role"""
        try:
            if config["technical_level"] != "technical":
                return {"message": "Technical details not available for this role"}
            
            technical_details = {
                "model_performance": {},
                "algorithm_details": {},
                "statistical_tests": {},
                "data_quality_metrics": {}
            }
            
            # Model performance details
            if "predictions" in insights and "model_performance" in insights["predictions"]:
                technical_details["model_performance"] = insights["predictions"]["model_performance"]
            
            # Algorithm details
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "best_performing_models" in pred_summary:
                    technical_details["algorithm_details"] = pred_summary["best_performing_models"]
            
            # Anomaly detection details
            if "anomalies" in insights:
                technical_details["anomaly_detection"] = {
                    "methods_used": ["isolation_forest", "local_outlier_factor", "statistical", "z_score"],
                    "summary": insights["anomalies"].get("summary", {})
                }
            
            return technical_details
            
        except Exception as e:
            logger.error(f"Technical details extraction failed: {str(e)}")
            return {"error": str(e)}
    
    def _suggest_visualizations(self, insights: Dict[str, Any], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest visualizations based on role and data"""
        try:
            visualizations = []
            
            if config["technical_level"] == "high_level":
                # Executive visualizations
                visualizations.extend([
                    {"type": "summary_card", "title": "Key Metrics Overview", "priority": "high"},
                    {"type": "trend_chart", "title": "Business Trends", "priority": "high"},
                    {"type": "risk_gauge", "title": "Risk Assessment", "priority": "medium"},
                    {"type": "recommendation_list", "title": "Strategic Recommendations", "priority": "high"}
                ])
            
            elif config["technical_level"] == "moderate":
                # Analyst visualizations
                visualizations.extend([
                    {"type": "line_chart", "title": "Trend Analysis", "priority": "high"},
                    {"type": "correlation_heatmap", "title": "Correlation Matrix", "priority": "medium"},
                    {"type": "anomaly_scatter", "title": "Anomaly Detection", "priority": "medium"},
                    {"type": "forecast_chart", "title": "Predictions", "priority": "high"},
                    {"type": "bar_chart", "title": "Key Insights", "priority": "medium"}
                ])
            
            else:
                # Data scientist visualizations
                visualizations.extend([
                    {"type": "model_performance_chart", "title": "Model Performance", "priority": "high"},
                    {"type": "algorithm_comparison", "title": "Algorithm Comparison", "priority": "high"},
                    {"type": "statistical_tests", "title": "Statistical Analysis", "priority": "medium"},
                    {"type": "data_quality_dashboard", "title": "Data Quality Metrics", "priority": "medium"},
                    {"type": "anomaly_detection_details", "title": "Anomaly Detection Results", "priority": "medium"}
                ])
            
            return visualizations
            
        except Exception as e:
            logger.error(f"Visualization suggestions failed: {str(e)}")
            return []
    
    def _generate_executive_recommendations(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate executive-level recommendations"""
        recommendations = []
        
        # Risk-based recommendations
        if "anomalies" in insights and "summary" in insights["anomalies"]:
            anomaly_summary = insights["anomalies"]["summary"]
            if "high_risk_columns" in anomaly_summary and len(anomaly_summary["high_risk_columns"]) > 0:
                recommendations.append({
                    "category": "Risk Management",
                    "recommendation": "Investigate data quality issues in high-risk columns",
                    "priority": "high",
                    "impact": "Reduce operational risk"
                })
        
        # Trend-based recommendations
        if "predictions" in insights and "summary" in insights["predictions"]:
            pred_summary = insights["predictions"]["summary"]
            if "trends" in pred_summary:
                increasing_trends = [col for col, trend in pred_summary["trends"].items() if trend == "increasing"]
                if increasing_trends:
                    recommendations.append({
                        "category": "Strategic Planning",
                        "recommendation": f"Capitalize on positive trends in {', '.join(increasing_trends[:3])}",
                        "priority": "medium",
                        "impact": "Revenue growth opportunity"
                    })
        
        return recommendations
    
    def _generate_analyst_recommendations(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate analyst-level recommendations"""
        recommendations = []
        
        # Data quality recommendations
        if "key_insights" in insights:
            data_quality_insights = [i for i in insights["key_insights"] if "Data Quality" in i.get("category", "")]
            if data_quality_insights:
                recommendations.append({
                    "category": "Data Quality",
                    "recommendation": "Implement data validation procedures",
                    "priority": "high",
                    "impact": "Improve analysis accuracy"
                })
        
        # Correlation-based recommendations
        if "key_insights" in insights:
            correlation_insights = [i for i in insights["key_insights"] if "correlation" in i.get("insight", "").lower()]
            if correlation_insights:
                recommendations.append({
                    "category": "Analysis",
                    "recommendation": "Investigate significant correlations for business insights",
                    "priority": "medium",
                    "impact": "Discover hidden patterns"
                })
        
        return recommendations
    
    def _generate_technical_recommendations(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate technical-level recommendations"""
        recommendations = []
        
        # Model performance recommendations
        if "predictions" in insights and "summary" in insights["predictions"]:
            pred_summary = insights["predictions"]["summary"]
            if "best_performing_models" in pred_summary:
                recommendations.append({
                    "category": "Model Optimization",
                    "recommendation": "Use best performing algorithms for production deployment",
                    "priority": "high",
                    "impact": "Improve prediction accuracy"
                })
        
        # Algorithm recommendations
        if "predictions" in insights and "summary" in insights["predictions"]:
            pred_summary = insights["predictions"]["summary"]
            if "failed_forecasts" in pred_summary and pred_summary["failed_forecasts"] > 0:
                recommendations.append({
                    "category": "Model Development",
                    "recommendation": "Investigate failed forecasting models",
                    "priority": "medium",
                    "impact": "Improve model coverage"
                })
        
        return recommendations
    
    def _assess_business_impact(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """Assess business impact of insights"""
        try:
            impact_score = 0
            impact_factors = []
            
            # Risk impact
            if "anomalies" in insights and "summary" in insights["anomalies"]:
                anomaly_summary = insights["anomalies"]["summary"]
                if "high_risk_columns" in anomaly_summary:
                    risk_count = len(anomaly_summary["high_risk_columns"])
                    if risk_count > 0:
                        impact_score += risk_count * 10
                        impact_factors.append(f"High-risk data columns: {risk_count}")
            
            # Trend impact
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "trends" in pred_summary:
                    trend_count = len(pred_summary["trends"])
                    impact_score += trend_count * 5
                    impact_factors.append(f"Identified trends: {trend_count}")
            
            # Insight impact
            if "key_insights" in insights:
                insight_count = len(insights["key_insights"])
                impact_score += insight_count * 2
                impact_factors.append(f"Key insights: {insight_count}")
            
            return {
                "impact_score": impact_score,
                "impact_level": "high" if impact_score > 50 else "medium" if impact_score > 20 else "low",
                "impact_factors": impact_factors
            }
            
        except Exception as e:
            logger.error(f"Business impact assessment failed: {str(e)}")
            return {"impact_score": 0, "impact_level": "unknown", "impact_factors": []}
    
    def _assess_trend_impact(self, trend: str) -> str:
        """Assess business impact of a trend"""
        if trend == "increasing":
            return "Positive business opportunity"
        elif trend == "decreasing":
            return "Risk mitigation required"
        else:
            return "Stable performance"
    
    def _extract_executive_key_points(self, insights: Dict[str, Any]) -> List[str]:
        """Extract key points for executives"""
        try:
            key_points = []
            
            if "key_insights" in insights:
                for insight in insights["key_insights"][:3]:  # Top 3 insights
                    key_points.append(insight.get("insight", ""))
            
            return key_points
            
        except Exception as e:
            logger.error(f"Executive key points extraction failed: {str(e)}")
            return []
    
    def _extract_analyst_findings(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract findings for analysts"""
        try:
            findings = []
            
            if "key_insights" in insights:
                for insight in insights["key_insights"]:
                    findings.append({
                        "category": insight.get("category", ""),
                        "finding": insight.get("insight", ""),
                        "confidence": insight.get("confidence", 0.8),
                        "impact": insight.get("impact", "medium")
                    })
            
            return findings
            
        except Exception as e:
            logger.error(f"Analyst findings extraction failed: {str(e)}")
            return []
    
    def _analyze_trends_for_analyst(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze trends for analyst view"""
        try:
            trend_analysis = {
                "trend_count": 0,
                "increasing_trends": [],
                "decreasing_trends": [],
                "stable_trends": []
            }
            
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "trends" in pred_summary:
                    trend_analysis["trend_count"] = len(pred_summary["trends"])
                    
                    for column, trend in pred_summary["trends"].items():
                        if trend == "increasing":
                            trend_analysis["increasing_trends"].append(column)
                        elif trend == "decreasing":
                            trend_analysis["decreasing_trends"].append(column)
                        else:
                            trend_analysis["stable_trends"].append(column)
            
            return trend_analysis
            
        except Exception as e:
            logger.error(f"Trend analysis failed: {str(e)}")
            return {"trend_count": 0, "increasing_trends": [], "decreasing_trends": [], "stable_trends": []}
    
    def _extract_methodology(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """Extract methodology details for data scientists"""
        try:
            methodology = {
                "algorithms_used": [],
                "statistical_tests": [],
                "data_processing_steps": []
            }
            
            # Extract algorithms from predictions
            if "predictions" in insights and "summary" in insights["predictions"]:
                pred_summary = insights["predictions"]["summary"]
                if "best_performing_models" in pred_summary:
                    for model in pred_summary["best_performing_models"]:
                        methodology["algorithms_used"].append(model["model"])
            
            # Extract anomaly detection methods
            if "anomalies" in insights:
                methodology["algorithms_used"].extend(["isolation_forest", "local_outlier_factor", "statistical"])
            
            return methodology
            
        except Exception as e:
            logger.error(f"Methodology extraction failed: {str(e)}")
            return {"algorithms_used": [], "statistical_tests": [], "data_processing_steps": []}
    
    def _extract_model_performance(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """Extract model performance metrics for data scientists"""
        try:
            performance = {}
            
            if "predictions" in insights and "model_performance" in insights["predictions"]:
                performance = insights["predictions"]["model_performance"]
            
            return performance
            
        except Exception as e:
            logger.error(f"Model performance extraction failed: {str(e)}")
            return {} 
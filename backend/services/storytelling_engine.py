"""
Sygnify Financial Storytelling Engine
- Orchestrates all components to make data "speak" to users
- Combines financial analysis + market context + AI narratives
- Generates compelling, contextual financial stories
- Provides actionable insights with market intelligence
- Personalizes storytelling based on user role and preferences
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

# Import Sygnify services
from .enhanced_narrative_service import enhanced_narrative_service, NarrativeRequest, NarrativeType
from .market_data_service import market_data_service, get_market_context, get_financial_market_context
from ..financial_ml_engine import FinancialMLEngine
from ..financial.financial_ratios import FinancialRatioAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StoryType(str, Enum):
    EXECUTIVE_BRIEFING = "executive_briefing"
    PERFORMANCE_REVIEW = "performance_review"
    RISK_ASSESSMENT = "risk_assessment"
    MARKET_INTELLIGENCE = "market_intelligence"
    TREND_ANALYSIS = "trend_analysis"
    OPPORTUNITY_DISCOVERY = "opportunity_discovery"
    COMPLIANCE_REPORT = "compliance_report"

@dataclass
class StoryRequest:
    financial_data: List[Dict[str, Any]]
    story_type: StoryType
    user_role: str = "executive"
    tone: str = "professional"
    length: str = "comprehensive"
    include_market_context: bool = True
    include_recommendations: bool = True
    include_visualizations: bool = True
    personalization_level: str = "high"  # high, medium, low

@dataclass
class FinancialStory:
    headline: str
    executive_summary: str
    key_insights: List[Dict[str, Any]]
    market_context: Dict[str, Any]
    financial_analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]
    trend_analysis: Dict[str, Any]
    comparative_analysis: Dict[str, Any]
    actionable_items: List[Dict[str, Any]]
    story_narrative: str
    confidence_score: float
    data_quality: Dict[str, Any]
    generated_at: datetime
    sources: List[str]

class FinancialStorytellingEngine:
    """Master storytelling engine that makes financial data speak to users"""
    
    def __init__(self):
        self.financial_analyzer = FinancialRatioAnalyzer()
        self.ml_engine = FinancialMLEngine()
        
        # Story templates for different narrative styles
        self.story_templates = {
            StoryType.EXECUTIVE_BRIEFING: self._get_executive_briefing_template(),
            StoryType.PERFORMANCE_REVIEW: self._get_performance_review_template(),
            StoryType.RISK_ASSESSMENT: self._get_risk_assessment_template(),
            StoryType.MARKET_INTELLIGENCE: self._get_market_intelligence_template(),
            StoryType.TREND_ANALYSIS: self._get_trend_analysis_template()
        }
        
        # Performance tracking
        self.story_metrics = {
            "total_stories_generated": 0,
            "avg_generation_time": 0,
            "user_engagement_score": 0,
            "story_accuracy_score": 0
        }
    
    async def generate_financial_story(self, request: StoryRequest) -> FinancialStory:
        """Generate a comprehensive financial story that makes data speak to users"""
        
        start_time = datetime.utcnow()
        logger.info(f"Generating {request.story_type.value} story for {len(request.financial_data)} records")
        
        try:
            # Step 1: Analyze financial data
            financial_analysis = await self._analyze_financial_data(request.financial_data)
            
            # Step 2: Get market context
            market_context = {}
            if request.include_market_context:
                market_context = await self._get_market_intelligence(request.financial_data)
            
            # Step 3: Generate AI narrative
            ai_narrative = await self._generate_ai_narrative(
                request, financial_analysis, market_context
            )
            
            # Step 4: Create story structure
            story_structure = await self._build_story_structure(
                request, financial_analysis, market_context, ai_narrative
            )
            
            # Step 5: Generate compelling narrative
            story_narrative = await self._craft_story_narrative(
                request, story_structure, financial_analysis, market_context
            )
            
            # Step 6: Add actionable insights
            actionable_items = await self._generate_actionable_insights(
                financial_analysis, market_context, request.user_role
            )
            
            # Step 7: Calculate confidence and quality scores
            confidence_score = self._calculate_story_confidence(
                financial_analysis, market_context, ai_narrative
            )
            
            data_quality = self._assess_data_quality(request.financial_data, financial_analysis)
            
            # Create the final story
            story = FinancialStory(
                headline=story_structure["headline"],
                executive_summary=story_structure["executive_summary"],
                key_insights=story_structure["key_insights"],
                market_context=market_context,
                financial_analysis=financial_analysis,
                risk_assessment=story_structure["risk_assessment"],
                recommendations=story_structure["recommendations"],
                performance_metrics=story_structure["performance_metrics"],
                trend_analysis=story_structure["trend_analysis"],
                comparative_analysis=story_structure["comparative_analysis"],
                actionable_items=actionable_items,
                story_narrative=story_narrative,
                confidence_score=confidence_score,
                data_quality=data_quality,
                generated_at=start_time,
                sources=["Sygnify Analytics", "Market Data", "AI Analysis"]
            )
            
            # Update metrics
            generation_time = (datetime.utcnow() - start_time).total_seconds()
            self._update_story_metrics(generation_time, confidence_score)
            
            logger.info(f"Story generated successfully in {generation_time:.2f}s with confidence {confidence_score:.2f}")
            
            return story
            
        except Exception as e:
            logger.error(f"Story generation failed: {e}")
            return await self._generate_fallback_story(request, str(e))
    
    async def _analyze_financial_data(self, financial_data: List[Dict]) -> Dict[str, Any]:
        """Comprehensive financial data analysis"""
        
        logger.info("Performing comprehensive financial analysis...")
        
        # Convert to DataFrame for analysis
        import pandas as pd
        df = pd.DataFrame(financial_data)
        
        # Basic financial metrics
        basic_metrics = self._calculate_basic_metrics(df)
        
        # Financial ratios analysis
        ratios_analysis = self.financial_analyzer.calculate_ratios(financial_data)
        
        # ML-powered insights
        ml_insights = await self._get_ml_insights(df)
        
        # Trend analysis
        trend_analysis = self._analyze_trends(df)
        
        # Risk analysis
        risk_analysis = self._analyze_risks(df, ratios_analysis)
        
        # Performance analysis
        performance_analysis = self._analyze_performance(df, ratios_analysis)
        
        return {
            "basic_metrics": basic_metrics,
            "ratios_analysis": ratios_analysis,
            "ml_insights": ml_insights,
            "trend_analysis": trend_analysis,
            "risk_analysis": risk_analysis,
            "performance_analysis": performance_analysis,
            "data_summary": {
                "record_count": len(df),
                "date_range": self._get_date_range(df),
                "data_completeness": self._calculate_completeness(df),
                "key_fields": list(df.columns)
            }
        }
    
    def _calculate_basic_metrics(self, df: 'pd.DataFrame') -> Dict[str, Any]:
        """Calculate basic financial metrics from data"""
        
        metrics = {}
        
        # Revenue metrics
        if 'revenue' in df.columns:
            metrics['revenue'] = {
                'total': float(df['revenue'].sum()),
                'average': float(df['revenue'].mean()),
                'median': float(df['revenue'].median()),
                'growth_rate': self._calculate_growth_rate(df['revenue']),
                'volatility': float(df['revenue'].std()) if len(df) > 1 else 0
            }
        
        # Expense metrics
        expense_cols = [col for col in df.columns if 'expense' in col.lower() or 'cost' in col.lower()]
        if expense_cols:
            total_expenses = df[expense_cols].sum(axis=1)
            metrics['expenses'] = {
                'total': float(total_expenses.sum()),
                'average': float(total_expenses.mean()),
                'breakdown': {col: float(df[col].sum()) for col in expense_cols}
            }
        
        # Profit metrics
        if 'profit' in df.columns or ('revenue' in df.columns and expense_cols):
            if 'profit' in df.columns:
                profit = df['profit']
            else:
                profit = df['revenue'] - df[expense_cols].sum(axis=1)
            
            metrics['profitability'] = {
                'total_profit': float(profit.sum()),
                'profit_margin': float(profit.sum() / df['revenue'].sum() * 100) if 'revenue' in df.columns and df['revenue'].sum() > 0 else 0,
                'profitable_periods': int((profit > 0).sum()),
                'loss_periods': int((profit < 0).sum())
            }
        
        # Cash flow metrics
        if 'cash_flow' in df.columns:
            metrics['cash_flow'] = {
                'total': float(df['cash_flow'].sum()),
                'positive_periods': int((df['cash_flow'] > 0).sum()),
                'negative_periods': int((df['cash_flow'] < 0).sum()),
                'volatility': float(df['cash_flow'].std()) if len(df) > 1 else 0
            }
        
        return metrics
    
    def _calculate_growth_rate(self, series: 'pd.Series') -> float:
        """Calculate growth rate for a time series"""
        if len(series) < 2:
            return 0.0
        
        first_value = series.iloc[0]
        last_value = series.iloc[-1]
        
        if first_value == 0:
            return 0.0
        
        growth_rate = ((last_value - first_value) / first_value) * 100
        return float(growth_rate)
    
    async def _get_ml_insights(self, df: 'pd.DataFrame') -> Dict[str, Any]:
        """Get ML-powered insights from financial data"""
        
        try:
            # Anomaly detection
            anomalies = self.ml_engine.detect_anomalies(df.to_dict('records'))
            
            # Pattern recognition
            patterns = self.ml_engine.identify_patterns(df.to_dict('records'))
            
            # Predictive insights
            predictions = self.ml_engine.generate_predictions(df.to_dict('records'))
            
            return {
                "anomalies": anomalies,
                "patterns": patterns,
                "predictions": predictions,
                "ml_confidence": 0.85  # Mock confidence score
            }
            
        except Exception as e:
            logger.warning(f"ML insights generation failed: {e}")
            return {
                "anomalies": [],
                "patterns": [],
                "predictions": {},
                "ml_confidence": 0.0
            }
    
    def _analyze_trends(self, df: 'pd.DataFrame') -> Dict[str, Any]:
        """Analyze trends in financial data"""
        
        trends = {}
        
        numeric_columns = df.select_dtypes(include=['number']).columns
        
        for col in numeric_columns:
            if len(df[col].dropna()) >= 3:  # Need at least 3 points for trend
                values = df[col].dropna().values
                trend_direction = self._determine_trend_direction(values)
                trend_strength = self._calculate_trend_strength(values)
                
                trends[col] = {
                    "direction": trend_direction,
                    "strength": trend_strength,
                    "volatility": float(df[col].std()) if len(df) > 1 else 0,
                    "recent_change": float(values[-1] - values[-2]) if len(values) >= 2 else 0
                }
        
        return trends
    
    def _determine_trend_direction(self, values: List[float]) -> str:
        """Determine overall trend direction"""
        if len(values) < 2:
            return "stable"
        
        increases = 0
        decreases = 0
        
        for i in range(1, len(values)):
            if values[i] > values[i-1]:
                increases += 1
            elif values[i] < values[i-1]:
                decreases += 1
        
        if increases > decreases * 1.5:
            return "increasing"
        elif decreases > increases * 1.5:
            return "decreasing"
        else:
            return "stable"
    
    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate trend strength (0-1)"""
        if len(values) < 2:
            return 0.0
        
        # Simple approach: correlation with time
        import numpy as np
        x = np.arange(len(values))
        correlation = np.corrcoef(x, values)[0, 1]
        
        return abs(correlation) if not np.isnan(correlation) else 0.0
    
    def _analyze_risks(self, df: 'pd.DataFrame', ratios: Dict) -> Dict[str, Any]:
        """Analyze financial risks"""
        
        risk_factors = []
        risk_score = 0.0
        
        # Liquidity risk
        if 'current_ratio' in ratios:
            current_ratio = ratios['current_ratio']
            if current_ratio < 1.0:
                risk_factors.append({
                    "type": "Liquidity Risk",
                    "severity": "High",
                    "description": f"Current ratio of {current_ratio:.2f} indicates potential liquidity issues",
                    "impact": "May struggle to meet short-term obligations"
                })
                risk_score += 0.3
        
        # Profitability risk
        if 'profit' in df.columns:
            negative_periods = (df['profit'] < 0).sum()
            if negative_periods > len(df) * 0.3:  # More than 30% loss periods
                risk_factors.append({
                    "type": "Profitability Risk",
                    "severity": "Medium",
                    "description": f"{negative_periods} loss periods out of {len(df)} total periods",
                    "impact": "Persistent losses may threaten business viability"
                })
                risk_score += 0.2
        
        # Volatility risk
        if 'revenue' in df.columns and len(df) > 1:
            revenue_volatility = df['revenue'].std() / df['revenue'].mean() if df['revenue'].mean() > 0 else 0
            if revenue_volatility > 0.3:  # High volatility
                risk_factors.append({
                    "type": "Revenue Volatility",
                    "severity": "Medium",
                    "description": f"Revenue volatility of {revenue_volatility:.2f} indicates unpredictable income",
                    "impact": "Makes financial planning and forecasting difficult"
                })
                risk_score += 0.15
        
        # Overall risk assessment
        if risk_score > 0.5:
            risk_level = "High"
        elif risk_score > 0.25:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        return {
            "risk_factors": risk_factors,
            "risk_score": min(risk_score, 1.0),
            "risk_level": risk_level,
            "mitigation_strategies": self._generate_risk_mitigation_strategies(risk_factors)
        }
    
    def _generate_risk_mitigation_strategies(self, risk_factors: List[Dict]) -> List[str]:
        """Generate risk mitigation strategies"""
        
        strategies = []
        
        for risk in risk_factors:
            if risk["type"] == "Liquidity Risk":
                strategies.append("Improve working capital management and maintain adequate cash reserves")
            elif risk["type"] == "Profitability Risk":
                strategies.append("Review cost structure and identify opportunities for revenue enhancement")
            elif risk["type"] == "Revenue Volatility":
                strategies.append("Diversify revenue streams and improve demand forecasting")
        
        if not strategies:
            strategies.append("Continue monitoring financial performance and maintain strong controls")
        
        return strategies
    
    def _analyze_performance(self, df: 'pd.DataFrame', ratios: Dict) -> Dict[str, Any]:
        """Analyze financial performance"""
        
        performance_indicators = {}
        
        # Revenue performance
        if 'revenue' in df.columns:
            revenue_growth = self._calculate_growth_rate(df['revenue'])
            performance_indicators['revenue_growth'] = {
                "value": revenue_growth,
                "status": "Positive" if revenue_growth > 0 else "Negative",
                "benchmark": "Industry average: 5-15%"
            }
        
        # Profitability performance
        if 'profit' in df.columns and 'revenue' in df.columns:
            profit_margin = (df['profit'].sum() / df['revenue'].sum() * 100) if df['revenue'].sum() > 0 else 0
            performance_indicators['profit_margin'] = {
                "value": profit_margin,
                "status": "Strong" if profit_margin > 10 else "Weak" if profit_margin < 5 else "Moderate",
                "benchmark": "Target: 10%+"
            }
        
        # Efficiency metrics
        if 'debt_to_equity' in ratios:
            debt_ratio = ratios['debt_to_equity']
            performance_indicators['leverage'] = {
                "value": debt_ratio,
                "status": "Conservative" if debt_ratio < 0.5 else "Aggressive" if debt_ratio > 1.0 else "Moderate",
                "benchmark": "Optimal: 0.3-0.6"
            }
        
        return performance_indicators
    
    async def _get_market_intelligence(self, financial_data: List[Dict]) -> Dict[str, Any]:
        """Get market context and intelligence"""
        
        try:
            # Get general market overview
            market_overview = await get_market_context()
            
            # Get context specific to financial data
            financial_context = await get_financial_market_context({"data": financial_data})
            
            return {
                "market_overview": market_overview,
                "financial_context": financial_context,
                "integration_quality": "high"
            }
            
        except Exception as e:
            logger.warning(f"Market intelligence retrieval failed: {e}")
            return {
                "market_overview": {"error": "Market data unavailable"},
                "financial_context": {"error": "Context analysis failed"},
                "integration_quality": "low"
            }
    
    async def _generate_ai_narrative(self, request: StoryRequest, 
                                   financial_analysis: Dict, market_context: Dict) -> Dict[str, Any]:
        """Generate AI-powered narrative"""
        
        try:
            # Map story type to narrative type
            narrative_type_mapping = {
                StoryType.EXECUTIVE_BRIEFING: NarrativeType.EXECUTIVE_SUMMARY,
                StoryType.RISK_ASSESSMENT: NarrativeType.RISK_ASSESSMENT,
                StoryType.MARKET_INTELLIGENCE: NarrativeType.MARKET_ANALYSIS,
                StoryType.PERFORMANCE_REVIEW: NarrativeType.FINANCIAL_INSIGHTS
            }
            
            narrative_type = narrative_type_mapping.get(request.story_type, NarrativeType.EXECUTIVE_SUMMARY)
            
            # Create narrative request
            narrative_request = NarrativeRequest(
                data=request.financial_data,
                labels={"market_context": market_context},
                metrics=financial_analysis.get("basic_metrics", {}),
                narrative_type=narrative_type,
                user_role=request.user_role,
                tone=request.tone,
                length=request.length
            )
            
            # Generate narrative
            narrative_response = await enhanced_narrative_service.generate_narrative(narrative_request)
            
            return {
                "headline": narrative_response.headline,
                "executive_summary": narrative_response.executive_summary,
                "key_insights": narrative_response.key_insights,
                "recommendations": narrative_response.recommendations,
                "confidence_score": narrative_response.confidence_score,
                "model_used": narrative_response.model_used
            }
            
        except Exception as e:
            logger.warning(f"AI narrative generation failed: {e}")
            return {
                "headline": "Financial Analysis Summary",
                "executive_summary": "Analysis completed with standard methodologies.",
                "key_insights": ["Financial data processed successfully"],
                "recommendations": [{"title": "Continue monitoring performance", "priority": "medium"}],
                "confidence_score": 0.6,
                "model_used": "fallback"
            }
    
    async def _build_story_structure(self, request: StoryRequest, financial_analysis: Dict,
                                   market_context: Dict, ai_narrative: Dict) -> Dict[str, Any]:
        """Build the overall story structure"""
        
        # Get story template
        template = self.story_templates.get(request.story_type, self._get_default_template())
        
        # Build structured story components
        story_structure = {
            "headline": self._create_compelling_headline(request, financial_analysis, market_context, ai_narrative),
            "executive_summary": self._create_executive_summary(financial_analysis, market_context, ai_narrative),
            "key_insights": self._extract_key_insights(financial_analysis, market_context, ai_narrative),
            "risk_assessment": financial_analysis.get("risk_analysis", {}),
            "recommendations": self._prioritize_recommendations(ai_narrative.get("recommendations", [])),
            "performance_metrics": self._format_performance_metrics(financial_analysis),
            "trend_analysis": financial_analysis.get("trend_analysis", {}),
            "comparative_analysis": self._create_comparative_analysis(financial_analysis, market_context)
        }
        
        return story_structure
    
    def _create_compelling_headline(self, request: StoryRequest, financial_analysis: Dict,
                                  market_context: Dict, ai_narrative: Dict) -> str:
        """Create a compelling, contextual headline"""
        
        # Use AI narrative headline if available and good
        if ai_narrative.get("headline") and len(ai_narrative["headline"]) > 10:
            base_headline = ai_narrative["headline"]
        else:
            # Generate based on story type and key metrics
            base_headline = self._generate_default_headline(request.story_type, financial_analysis)
        
        # Add market context if relevant
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        if market_sentiment.get("sentiment_label") in ["Bullish", "Bearish"]:
            sentiment = market_sentiment["sentiment_label"]
            base_headline += f" Amid {sentiment} Market Conditions"
        
        return base_headline
    
    def _generate_default_headline(self, story_type: StoryType, financial_analysis: Dict) -> str:
        """Generate default headline based on story type and analysis"""
        
        basic_metrics = financial_analysis.get("basic_metrics", {})
        
        if story_type == StoryType.EXECUTIVE_BRIEFING:
            revenue_growth = basic_metrics.get("revenue", {}).get("growth_rate", 0)
            if revenue_growth > 10:
                return f"Strong Financial Performance Drives {revenue_growth:.1f}% Revenue Growth"
            elif revenue_growth < -5:
                return f"Financial Challenges Emerge with {abs(revenue_growth):.1f}% Revenue Decline"
            else:
                return "Financial Performance Shows Mixed Signals"
        
        elif story_type == StoryType.RISK_ASSESSMENT:
            risk_level = financial_analysis.get("risk_analysis", {}).get("risk_level", "Medium")
            return f"{risk_level} Risk Profile Identified Across Key Financial Metrics"
        
        elif story_type == StoryType.PERFORMANCE_REVIEW:
            return "Comprehensive Financial Performance Analysis Reveals Key Insights"
        
        else:
            return "Financial Analysis Summary and Strategic Insights"
    
    def _create_executive_summary(self, financial_analysis: Dict, market_context: Dict, ai_narrative: Dict) -> str:
        """Create executive summary combining all insights"""
        
        # Start with AI-generated summary if available
        ai_summary = ai_narrative.get("executive_summary", "")
        
        # Add key financial highlights
        basic_metrics = financial_analysis.get("basic_metrics", {})
        revenue_data = basic_metrics.get("revenue", {})
        
        financial_highlights = ""
        if revenue_data:
            growth = revenue_data.get("growth_rate", 0)
            total = revenue_data.get("total", 0)
            financial_highlights = f"Revenue performance shows {growth:+.1f}% growth with total revenue of ${total:,.0f}. "
        
        # Add market context
        market_summary = ""
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        if market_sentiment:
            sentiment_label = market_sentiment.get("sentiment_label", "Neutral")
            market_summary = f"Current {sentiment_label.lower()} market environment provides important context for these results. "
        
        # Combine all elements
        executive_summary = financial_highlights + ai_summary + " " + market_summary
        
        return executive_summary.strip()
    
    def _extract_key_insights(self, financial_analysis: Dict, market_context: Dict, ai_narrative: Dict) -> List[Dict[str, Any]]:
        """Extract and prioritize key insights"""
        
        insights = []
        
        # Add AI-generated insights
        ai_insights = ai_narrative.get("key_insights", [])
        for insight in ai_insights:
            insights.append({
                "type": "AI Analysis",
                "insight": insight,
                "priority": "high",
                "source": "AI Narrative Engine"
            })
        
        # Add financial analysis insights
        basic_metrics = financial_analysis.get("basic_metrics", {})
        
        # Revenue insights
        if "revenue" in basic_metrics:
            revenue = basic_metrics["revenue"]
            growth = revenue.get("growth_rate", 0)
            if abs(growth) > 5:  # Significant growth or decline
                insights.append({
                    "type": "Revenue Performance",
                    "insight": f"Revenue {'growth' if growth > 0 else 'decline'} of {abs(growth):.1f}% indicates {'strong' if growth > 0 else 'concerning'} business momentum",
                    "priority": "high" if abs(growth) > 15 else "medium",
                    "source": "Financial Analysis"
                })
        
        # Risk insights
        risk_analysis = financial_analysis.get("risk_analysis", {})
        if risk_analysis.get("risk_level") == "High":
            insights.append({
                "type": "Risk Alert",
                "insight": f"High risk profile identified with {len(risk_analysis.get('risk_factors', []))} key risk factors requiring attention",
                "priority": "high",
                "source": "Risk Analysis"
            })
        
        # Market insights
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        if market_sentiment.get("sentiment_label") in ["Bullish", "Bearish"]:
            sentiment = market_sentiment["sentiment_label"]
            insights.append({
                "type": "Market Context",
                "insight": f"{sentiment} market conditions {'support' if sentiment == 'Bullish' else 'challenge'} current financial performance",
                "priority": "medium",
                "source": "Market Intelligence"
            })
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        insights.sort(key=lambda x: priority_order.get(x["priority"], 2))
        
        return insights[:8]  # Return top 8 insights
    
    def _prioritize_recommendations(self, recommendations: List[Dict]) -> List[Dict[str, Any]]:
        """Prioritize and enhance recommendations"""
        
        enhanced_recommendations = []
        
        for i, rec in enumerate(recommendations):
            if isinstance(rec, dict):
                enhanced_rec = {
                    "title": rec.get("title", ""),
                    "description": rec.get("description", ""),
                    "priority": rec.get("priority", "medium"),
                    "impact": rec.get("impact", "medium"),
                    "timeline": rec.get("timeline", "1-3 months"),
                    "success_metrics": rec.get("success_metrics", []),
                    "implementation_complexity": self._assess_complexity(rec.get("title", "")),
                    "rank": i + 1
                }
                enhanced_recommendations.append(enhanced_rec)
        
        return enhanced_recommendations
    
    def _assess_complexity(self, recommendation: str) -> str:
        """Assess implementation complexity of recommendation"""
        
        high_complexity_keywords = ["system", "infrastructure", "automation", "integration"]
        medium_complexity_keywords = ["process", "training", "policy", "review"]
        
        rec_lower = recommendation.lower()
        
        if any(keyword in rec_lower for keyword in high_complexity_keywords):
            return "high"
        elif any(keyword in rec_lower for keyword in medium_complexity_keywords):
            return "medium"
        else:
            return "low"
    
    def _format_performance_metrics(self, financial_analysis: Dict) -> Dict[str, Any]:
        """Format performance metrics for story presentation"""
        
        basic_metrics = financial_analysis.get("basic_metrics", {})
        performance_analysis = financial_analysis.get("performance_analysis", {})
        
        formatted_metrics = {}
        
        # Revenue metrics
        if "revenue" in basic_metrics:
            revenue = basic_metrics["revenue"]
            formatted_metrics["revenue"] = {
                "total": f"${revenue.get('total', 0):,.0f}",
                "growth_rate": f"{revenue.get('growth_rate', 0):+.1f}%",
                "trend": "positive" if revenue.get('growth_rate', 0) > 0 else "negative",
                "volatility": f"{revenue.get('volatility', 0):.1f}"
            }
        
        # Profitability metrics
        if "profitability" in basic_metrics:
            profit = basic_metrics["profitability"]
            formatted_metrics["profitability"] = {
                "margin": f"{profit.get('profit_margin', 0):.1f}%",
                "total_profit": f"${profit.get('total_profit', 0):,.0f}",
                "profitable_periods": profit.get('profitable_periods', 0),
                "status": "strong" if profit.get('profit_margin', 0) > 10 else "weak"
            }
        
        # Performance indicators
        for key, indicator in performance_analysis.items():
            if isinstance(indicator, dict):
                formatted_metrics[key] = {
                    "value": indicator.get("value", "N/A"),
                    "status": indicator.get("status", "Unknown"),
                    "benchmark": indicator.get("benchmark", "")
                }
        
        return formatted_metrics
    
    def _create_comparative_analysis(self, financial_analysis: Dict, market_context: Dict) -> Dict[str, Any]:
        """Create comparative analysis with benchmarks"""
        
        comparative = {
            "industry_comparison": {},
            "market_benchmark": {},
            "historical_comparison": {},
            "peer_analysis": {}
        }
        
        # Market benchmark comparison
        benchmark_performance = market_context.get("financial_context", {}).get("benchmark_performance", {})
        basic_metrics = financial_analysis.get("basic_metrics", {})
        
        if "revenue" in basic_metrics and benchmark_performance:
            revenue_growth = basic_metrics["revenue"].get("growth_rate", 0)
            market_performance = benchmark_performance.get("S&P 500 ETF", 0)
            
            comparative["market_benchmark"] = {
                "company_performance": f"{revenue_growth:.1f}%",
                "market_performance": f"{market_performance:.1f}%",
                "relative_performance": "outperforming" if revenue_growth > market_performance else "underperforming",
                "spread": f"{revenue_growth - market_performance:+.1f}%"
            }
        
        # Industry comparison (mock data for now)
        comparative["industry_comparison"] = {
            "revenue_growth": {
                "company": basic_metrics.get("revenue", {}).get("growth_rate", 0),
                "industry_average": 8.5,
                "percentile": "75th" if basic_metrics.get("revenue", {}).get("growth_rate", 0) > 8.5 else "25th"
            },
            "profit_margin": {
                "company": basic_metrics.get("profitability", {}).get("profit_margin", 0),
                "industry_average": 12.3,
                "percentile": "60th"
            }
        }
        
        return comparative
    
    async def _craft_story_narrative(self, request: StoryRequest, story_structure: Dict,
                                   financial_analysis: Dict, market_context: Dict) -> str:
        """Craft the compelling story narrative that makes data speak"""
        
        template = self.story_templates.get(request.story_type, self._get_default_template())
        
        # Extract key story elements
        headline = story_structure["headline"]
        key_insights = story_structure["key_insights"]
        performance_metrics = story_structure["performance_metrics"]
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        
        # Build narrative sections
        opening = self._craft_opening_narrative(headline, financial_analysis, market_context)
        
        body = self._craft_body_narrative(key_insights, performance_metrics, financial_analysis)
        
        market_section = self._craft_market_narrative(market_context, financial_analysis)
        
        conclusion = self._craft_conclusion_narrative(story_structure["recommendations"], request.user_role)
        
        # Combine into full narrative
        full_narrative = f"{opening}\n\n{body}\n\n{market_section}\n\n{conclusion}"
        
        return full_narrative
    
    def _craft_opening_narrative(self, headline: str, financial_analysis: Dict, market_context: Dict) -> str:
        """Craft compelling opening narrative"""
        
        basic_metrics = financial_analysis.get("basic_metrics", {})
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        
        opening = f"**{headline}**\n\n"
        
        # Set the scene with market context
        if market_sentiment.get("sentiment_label"):
            sentiment = market_sentiment["sentiment_label"].lower()
            opening += f"In today's {sentiment} market environment, "
        else:
            opening += "In the current market landscape, "
        
        # Introduce the financial story
        if "revenue" in basic_metrics:
            revenue = basic_metrics["revenue"]
            total = revenue.get("total", 0)
            growth = revenue.get("growth_rate", 0)
            
            opening += f"our analysis reveals a compelling financial story. With total revenue of ${total:,.0f} "
            
            if growth > 5:
                opening += f"and impressive growth of {growth:.1f}%, the data speaks to a business gaining momentum."
            elif growth < -5:
                opening += f"but concerning decline of {abs(growth):.1f}%, the numbers tell a story of challenges ahead."
            else:
                opening += f"and modest {growth:+.1f}% change, the financial picture shows stability with room for improvement."
        else:
            opening += "the financial data reveals important insights about performance and future direction."
        
        return opening
    
    def _craft_body_narrative(self, key_insights: List[Dict], performance_metrics: Dict, financial_analysis: Dict) -> str:
        """Craft the main body narrative with key insights"""
        
        body = "**Key Financial Insights**\n\n"
        
        # Present top insights as story elements
        high_priority_insights = [insight for insight in key_insights if insight.get("priority") == "high"]
        
        for i, insight in enumerate(high_priority_insights[:3]):
            body += f"• **{insight['type']}**: {insight['insight']}\n"
        
        body += "\n**Performance Highlights**\n\n"
        
        # Tell the performance story
        if "revenue" in performance_metrics:
            revenue = performance_metrics["revenue"]
            body += f"Revenue performance shows {revenue['total']} with {revenue['growth_rate']} growth, "
            body += f"indicating {'strong momentum' if 'positive' in revenue.get('trend', '') else 'areas for improvement'}.\n"
        
        if "profitability" in performance_metrics:
            profit = performance_metrics["profitability"]
            body += f"Profitability metrics reveal {profit['margin']} margin with {profit['total_profit']} total profit, "
            body += f"demonstrating {profit.get('status', 'moderate')} financial health.\n"
        
        # Add risk narrative if significant
        risk_analysis = financial_analysis.get("risk_analysis", {})
        if risk_analysis.get("risk_level") in ["High", "Medium"]:
            risk_level = risk_analysis["risk_level"].lower()
            risk_count = len(risk_analysis.get("risk_factors", []))
            body += f"\nThe data also reveals {risk_level} risk levels with {risk_count} key factors requiring attention."
        
        return body
    
    def _craft_market_narrative(self, market_context: Dict, financial_analysis: Dict) -> str:
        """Craft market context narrative"""
        
        market_overview = market_context.get("market_overview", {})
        market_narrative = market_overview.get("market_narrative", {})
        
        if not market_narrative:
            return "**Market Context**\n\nMarket data is currently unavailable for contextual analysis."
        
        narrative = "**Market Intelligence**\n\n"
        
        # Market summary
        if market_narrative.get("market_summary"):
            narrative += f"{market_narrative['market_summary']}\n"
        
        # Economic context
        if market_narrative.get("economic_context"):
            narrative += f"{market_narrative['economic_context']}\n"
        
        # Sector highlights
        if market_narrative.get("sector_highlights"):
            narrative += f"{market_narrative['sector_highlights']}\n"
        
        # Investment implications
        implications = market_narrative.get("investment_implications", [])
        if implications:
            narrative += "\n**Strategic Implications**:\n"
            for implication in implications[:2]:  # Top 2 implications
                narrative += f"• {implication}\n"
        
        return narrative
    
    def _craft_conclusion_narrative(self, recommendations: List[Dict], user_role: str) -> str:
        """Craft conclusion with actionable recommendations"""
        
        conclusion = "**Strategic Recommendations**\n\n"
        
        if not recommendations:
            conclusion += "Continue monitoring financial performance and market conditions for emerging opportunities."
            return conclusion
        
        # Present top recommendations
        high_priority_recs = [rec for rec in recommendations if rec.get("priority") == "high"][:2]
        medium_priority_recs = [rec for rec in recommendations if rec.get("priority") == "medium"][:2]
        
        if high_priority_recs:
            conclusion += "**Immediate Actions Required**:\n"
            for rec in high_priority_recs:
                conclusion += f"• **{rec['title']}** - {rec.get('timeline', 'Immediate')}\n"
        
        if medium_priority_recs:
            conclusion += "\n**Strategic Initiatives**:\n"
            for rec in medium_priority_recs:
                conclusion += f"• **{rec['title']}** - {rec.get('timeline', '1-3 months')}\n"
        
        # Add role-specific call to action
        if user_role == "executive":
            conclusion += "\n*Executive leadership should prioritize these initiatives to drive sustainable growth and mitigate identified risks.*"
        elif user_role == "analyst":
            conclusion += "\n*Detailed analysis and monitoring of these metrics will support strategic decision-making.*"
        else:
            conclusion += "\n*Regular review and implementation of these recommendations will support continued financial health.*"
        
        return conclusion
    
    async def _generate_actionable_insights(self, financial_analysis: Dict, 
                                          market_context: Dict, user_role: str) -> List[Dict[str, Any]]:
        """Generate specific actionable insights"""
        
        actionable_items = []
        
        # Financial performance actions
        basic_metrics = financial_analysis.get("basic_metrics", {})
        
        if "revenue" in basic_metrics:
            revenue = basic_metrics["revenue"]
            growth = revenue.get("growth_rate", 0)
            
            if growth < 0:
                actionable_items.append({
                    "category": "Revenue Recovery",
                    "action": "Implement revenue enhancement strategy",
                    "priority": "high",
                    "timeline": "30 days",
                    "owner": "Sales Leadership",
                    "success_metric": "Return to positive growth",
                    "estimated_impact": "High"
                })
            elif growth > 20:
                actionable_items.append({
                    "category": "Growth Management",
                    "action": "Scale operations to support continued growth",
                    "priority": "high", 
                    "timeline": "60 days",
                    "owner": "Operations",
                    "success_metric": "Maintain growth rate",
                    "estimated_impact": "High"
                })
        
        # Risk mitigation actions
        risk_analysis = financial_analysis.get("risk_analysis", {})
        for risk_factor in risk_analysis.get("risk_factors", []):
            if risk_factor.get("severity") == "High":
                actionable_items.append({
                    "category": "Risk Mitigation",
                    "action": f"Address {risk_factor['type'].lower()}",
                    "priority": "high",
                    "timeline": "Immediate",
                    "owner": "Risk Management",
                    "success_metric": "Risk reduction",
                    "estimated_impact": "Medium"
                })
        
        # Market opportunity actions
        market_sentiment = market_context.get("market_overview", {}).get("market_sentiment", {})
        if market_sentiment.get("sentiment_label") == "Bullish":
            actionable_items.append({
                "category": "Market Opportunity",
                "action": "Capitalize on favorable market conditions",
                "priority": "medium",
                "timeline": "90 days",
                "owner": "Strategy Team",
                "success_metric": "Market share growth",
                "estimated_impact": "Medium"
            })
        
        return actionable_items[:5]  # Return top 5 actionable items
    
    def _calculate_story_confidence(self, financial_analysis: Dict, 
                                  market_context: Dict, ai_narrative: Dict) -> float:
        """Calculate overall confidence score for the story"""
        
        confidence_factors = []
        
        # Data quality factor
        data_summary = financial_analysis.get("data_summary", {})
        completeness = data_summary.get("data_completeness", 0.8)
        confidence_factors.append(completeness * 0.3)
        
        # AI narrative confidence
        ai_confidence = ai_narrative.get("confidence_score", 0.7)
        confidence_factors.append(ai_confidence * 0.3)
        
        # Market data quality
        market_quality = market_context.get("integration_quality", "medium")
        market_score = {"high": 1.0, "medium": 0.7, "low": 0.4}.get(market_quality, 0.6)
        confidence_factors.append(market_score * 0.2)
        
        # Analysis depth factor
        analysis_components = len([k for k in financial_analysis.keys() if financial_analysis[k]])
        depth_score = min(analysis_components / 6, 1.0)  # Normalize to 6 components
        confidence_factors.append(depth_score * 0.2)
        
        overall_confidence = sum(confidence_factors)
        return round(min(max(overall_confidence, 0.0), 1.0), 2)
    
    def _assess_data_quality(self, financial_data: List[Dict], financial_analysis: Dict) -> Dict[str, Any]:
        """Assess data quality for the story"""
        
        data_summary = financial_analysis.get("data_summary", {})
        
        return {
            "record_count": len(financial_data),
            "completeness_score": data_summary.get("data_completeness", 0.8),
            "date_range": data_summary.get("date_range", "Unknown"),
            "key_fields_present": len(data_summary.get("key_fields", [])),
            "quality_issues": [],
            "overall_grade": "A" if data_summary.get("data_completeness", 0.8) > 0.9 else "B"
        }
    
    def _get_date_range(self, df: 'pd.DataFrame') -> str:
        """Get date range from dataframe"""
        date_columns = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
        
        if date_columns:
            try:
                import pandas as pd
                date_col = date_columns[0]
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                min_date = df[date_col].min()
                max_date = df[date_col].max()
                return f"{min_date.strftime('%Y-%m-%d')} to {max_date.strftime('%Y-%m-%d')}"
            except:
                pass
        
        return "Date range not available"
    
    def _calculate_completeness(self, df: 'pd.DataFrame') -> float:
        """Calculate data completeness score"""
        if df.empty:
            return 0.0
        
        total_cells = df.size
        non_null_cells = df.count().sum()
        
        return non_null_cells / total_cells if total_cells > 0 else 0.0
    
    async def _generate_fallback_story(self, request: StoryRequest, error_message: str) -> FinancialStory:
        """Generate fallback story when primary generation fails"""
        
        return FinancialStory(
            headline="Financial Analysis Summary (Limited Data)",
            executive_summary=f"Analysis completed with limited functionality due to: {error_message}",
            key_insights=[
                {"type": "System Notice", "insight": "Full analysis temporarily unavailable", "priority": "low", "source": "System"}
            ],
            market_context={},
            financial_analysis={},
            risk_assessment={},
            recommendations=[
                {"title": "Retry analysis when system is restored", "priority": "medium", "timeline": "Next session"}
            ],
            performance_metrics={},
            trend_analysis={},
            comparative_analysis={},
            actionable_items=[],
            story_narrative="Analysis service is currently experiencing issues. Please try again later.",
            confidence_score=0.1,
            data_quality={"overall_grade": "Incomplete"},
            generated_at=datetime.utcnow(),
            sources=["Fallback System"]
        )
    
    def _update_story_metrics(self, generation_time: float, confidence_score: float):
        """Update storytelling engine metrics"""
        
        self.story_metrics["total_stories_generated"] += 1
        
        # Update average generation time
        current_avg = self.story_metrics["avg_generation_time"]
        total_stories = self.story_metrics["total_stories_generated"]
        new_avg = ((current_avg * (total_stories - 1)) + generation_time) / total_stories
        self.story_metrics["avg_generation_time"] = new_avg
        
        # Update accuracy score (based on confidence)
        current_accuracy = self.story_metrics["story_accuracy_score"]
        new_accuracy = ((current_accuracy * (total_stories - 1)) + confidence_score) / total_stories
        self.story_metrics["story_accuracy_score"] = new_accuracy
    
    # Story Templates
    def _get_executive_briefing_template(self) -> str:
        return "Executive briefing focusing on key performance indicators, strategic insights, and actionable recommendations."
    
    def _get_performance_review_template(self) -> str:
        return "Comprehensive performance review with detailed metrics, trend analysis, and benchmarking."
    
    def _get_risk_assessment_template(self) -> str:
        return "Risk-focused analysis identifying potential threats, vulnerabilities, and mitigation strategies."
    
    def _get_market_intelligence_template(self) -> str:
        return "Market-aware analysis incorporating external factors, competitive landscape, and economic context."
    
    def _get_trend_analysis_template(self) -> str:
        return "Trend-focused narrative highlighting patterns, momentum, and directional insights."
    
    def _get_default_template(self) -> str:
        return "Standard financial analysis with balanced coverage of performance, risks, and opportunities."

# Global storytelling engine instance
storytelling_engine = FinancialStorytellingEngine()

async def generate_financial_story(request: StoryRequest) -> FinancialStory:
    """Generate comprehensive financial story"""
    return await storytelling_engine.generate_financial_story(request)
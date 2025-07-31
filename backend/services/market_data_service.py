"""
Market Data Integration Service for Sygnify Financial Analytics
- Real-time market data feeds (S&P 500, sector performance, interest rates)
- Economic indicators and macroeconomic context
- Industry benchmarks and peer analysis
- Market sentiment analysis and trend detection
- Integration with financial narratives for contextual storytelling
"""

import asyncio
import aiohttp
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import pandas as pd
import numpy as np
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketDataProvider(str, Enum):
    ALPHA_VANTAGE = "alpha_vantage"
    YAHOO_FINANCE = "yahoo_finance"
    POLYGON = "polygon"
    MOCK = "mock"  # For development/demo

@dataclass
class MarketIndicator:
    symbol: str
    name: str
    current_value: float
    previous_value: float
    change_percent: float
    change_absolute: float
    last_updated: datetime
    trend: str  # "bullish", "bearish", "neutral"
    
@dataclass
class EconomicIndicator:
    indicator_name: str
    current_value: float
    previous_value: float
    unit: str
    frequency: str  # "daily", "weekly", "monthly", "quarterly"
    last_updated: datetime
    trend: str
    impact_level: str  # "high", "medium", "low"

@dataclass
class SectorPerformance:
    sector_name: str
    performance_1d: float
    performance_1w: float
    performance_1m: float
    performance_ytd: float
    market_cap: float
    top_performers: List[str]
    key_trends: List[str]

class MarketDataService:
    """Enterprise market data integration service"""
    
    def __init__(self, provider: MarketDataProvider = MarketDataProvider.MOCK):
        self.provider = provider
        self.api_keys = self._load_api_keys()
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        
        # Financial market symbols to track
        self.market_indices = [
            "SPY",    # S&P 500
            "QQQ",    # NASDAQ 100
            "DIA",    # Dow Jones
            "XLF",    # Financial Sector
            "VIX",    # Volatility Index
            "TLT",    # 20+ Year Treasury
            "GLD",    # Gold
            "DXY"     # US Dollar Index
        ]
        
        # Economic indicators to track
        self.economic_indicators = [
            "GDP_GROWTH_RATE",
            "UNEMPLOYMENT_RATE", 
            "INFLATION_RATE",
            "FEDERAL_FUNDS_RATE",
            "CONSUMER_CONFIDENCE",
            "INDUSTRIAL_PRODUCTION",
            "RETAIL_SALES"
        ]
        
        # Financial sectors for industry analysis
        self.financial_sectors = [
            "Technology", "Healthcare", "Financial Services", 
            "Consumer Discretionary", "Communication Services",
            "Industrials", "Consumer Staples", "Energy",
            "Utilities", "Real Estate", "Materials"
        ]
    
    def _load_api_keys(self) -> Dict[str, str]:
        """Load API keys from environment or config"""
        import os
        return {
            "alpha_vantage": os.getenv("ALPHA_VANTAGE_API_KEY", "demo"),
            "polygon": os.getenv("POLYGON_API_KEY", "demo"),
            "yahoo_finance": "free"  # Yahoo Finance is free
        }
    
    async def get_market_overview(self) -> Dict[str, Any]:
        """Get comprehensive market overview with trends and sentiment"""
        
        logger.info("Fetching market overview...")
        
        # Get market indices
        market_data = await self._fetch_market_indices()
        
        # Get economic indicators 
        economic_data = await self._fetch_economic_indicators()
        
        # Get sector performance
        sector_data = await self._fetch_sector_performance()
        
        # Calculate market sentiment
        market_sentiment = self._calculate_market_sentiment(market_data, economic_data)
        
        # Generate market narrative
        market_narrative = self._generate_market_narrative(
            market_data, economic_data, sector_data, market_sentiment
        )
        
        return {
            "market_indices": market_data,
            "economic_indicators": economic_data,
            "sector_performance": sector_data,
            "market_sentiment": market_sentiment,
            "market_narrative": market_narrative,
            "last_updated": datetime.utcnow().isoformat(),
            "data_quality": "high",
            "source": self.provider.value
        }
    
    async def _fetch_market_indices(self) -> List[MarketIndicator]:
        """Fetch current market index data"""
        
        if self.provider == MarketDataProvider.MOCK:
            return self._generate_mock_market_data()
        
        # Real API implementation would go here
        indices = []
        
        for symbol in self.market_indices:
            try:
                data = await self._fetch_symbol_data(symbol)
                if data:
                    indicator = MarketIndicator(
                        symbol=symbol,
                        name=self._get_symbol_name(symbol),
                        current_value=data.get("current_price", 0),
                        previous_value=data.get("previous_close", 0),
                        change_percent=data.get("change_percent", 0),
                        change_absolute=data.get("change_absolute", 0),
                        last_updated=datetime.utcnow(),
                        trend=self._determine_trend(data.get("change_percent", 0))
                    )
                    indices.append(indicator)
            except Exception as e:
                logger.error(f"Failed to fetch data for {symbol}: {e}")
        
        return indices
    
    def _generate_mock_market_data(self) -> List[MarketIndicator]:
        """Generate realistic mock market data for development"""
        
        import random
        
        mock_data = [
            {"symbol": "SPY", "name": "S&P 500 ETF", "base_price": 445.50},
            {"symbol": "QQQ", "name": "NASDAQ 100 ETF", "base_price": 385.20},
            {"symbol": "DIA", "name": "Dow Jones ETF", "base_price": 354.80},
            {"symbol": "XLF", "name": "Financial Sector ETF", "base_price": 35.75},
            {"symbol": "VIX", "name": "Volatility Index", "base_price": 18.45},
            {"symbol": "TLT", "name": "20+ Year Treasury ETF", "base_price": 95.30},
            {"symbol": "GLD", "name": "Gold ETF", "base_price": 185.60},
            {"symbol": "DXY", "name": "US Dollar Index", "base_price": 103.25}
        ]
        
        indicators = []
        for data in mock_data:
            # Generate realistic market movements
            change_percent = random.uniform(-2.5, 2.5)
            current_price = data["base_price"] * (1 + change_percent / 100)
            previous_price = data["base_price"]
            change_absolute = current_price - previous_price
            
            indicator = MarketIndicator(
                symbol=data["symbol"],
                name=data["name"],
                current_value=round(current_price, 2),
                previous_value=round(previous_price, 2),
                change_percent=round(change_percent, 2),
                change_absolute=round(change_absolute, 2),
                last_updated=datetime.utcnow(),
                trend=self._determine_trend(change_percent)
            )
            indicators.append(indicator)
        
        return indicators
    
    async def _fetch_economic_indicators(self) -> List[EconomicIndicator]:
        """Fetch economic indicators"""
        
        if self.provider == MarketDataProvider.MOCK:
            return self._generate_mock_economic_data()
        
        # Real implementation would fetch from FRED, BLS, etc.
        return []
    
    def _generate_mock_economic_data(self) -> List[EconomicIndicator]:
        """Generate mock economic indicators"""
        
        import random
        
        mock_indicators = [
            {"name": "GDP Growth Rate", "current": 2.4, "previous": 2.1, "unit": "%", "impact": "high"},
            {"name": "Unemployment Rate", "current": 3.7, "previous": 3.8, "unit": "%", "impact": "high"},
            {"name": "Inflation Rate (CPI)", "current": 3.2, "previous": 3.7, "unit": "%", "impact": "high"},
            {"name": "Federal Funds Rate", "current": 5.25, "previous": 5.00, "unit": "%", "impact": "high"},
            {"name": "Consumer Confidence", "current": 102.8, "previous": 99.5, "unit": "Index", "impact": "medium"},
            {"name": "Industrial Production", "current": 1.2, "previous": 0.8, "unit": "% MoM", "impact": "medium"},
            {"name": "Retail Sales", "current": 0.6, "previous": 1.1, "unit": "% MoM", "impact": "medium"}
        ]
        
        indicators = []
        for data in mock_indicators:
            # Add some realistic variation
            variation = random.uniform(-0.1, 0.1)
            current_value = data["current"] + variation
            change = current_value - data["previous"]
            
            indicator = EconomicIndicator(
                indicator_name=data["name"],
                current_value=round(current_value, 2),
                previous_value=data["previous"],
                unit=data["unit"],
                frequency="monthly",
                last_updated=datetime.utcnow(),
                trend=self._determine_trend(change),
                impact_level=data["impact"]
            )
            indicators.append(indicator)
        
        return indicators
    
    async def _fetch_sector_performance(self) -> List[SectorPerformance]:
        """Fetch sector performance data"""
        
        if self.provider == MarketDataProvider.MOCK:
            return self._generate_mock_sector_data()
        
        # Real implementation would fetch sector ETF data
        return []
    
    def _generate_mock_sector_data(self) -> List[SectorPerformance]:
        """Generate mock sector performance data"""
        
        import random
        
        sectors = []
        
        for sector in self.financial_sectors:
            # Generate realistic sector performance
            perf_1d = random.uniform(-2.0, 2.0)
            perf_1w = random.uniform(-5.0, 5.0)
            perf_1m = random.uniform(-8.0, 8.0)
            perf_ytd = random.uniform(-15.0, 25.0)
            
            # Generate top performers (mock companies)
            top_performers = [
                f"Company {chr(65 + i)}" for i in range(3)
            ]
            
            # Generate key trends
            key_trends = self._generate_sector_trends(sector, perf_1m)
            
            sector_perf = SectorPerformance(
                sector_name=sector,
                performance_1d=round(perf_1d, 2),
                performance_1w=round(perf_1w, 2),
                performance_1m=round(perf_1m, 2),
                performance_ytd=round(perf_ytd, 2),
                market_cap=random.uniform(500, 5000),  # Billions
                top_performers=top_performers,
                key_trends=key_trends
            )
            sectors.append(sector_perf)
        
        return sectors
    
    def _generate_sector_trends(self, sector: str, performance: float) -> List[str]:
        """Generate sector-specific trend insights"""
        
        trend_templates = {
            "Technology": [
                "AI and machine learning adoption accelerating",
                "Cloud infrastructure demand remains strong",
                "Semiconductor supply chain stabilizing"
            ],
            "Healthcare": [
                "Biotech M&A activity increasing",
                "Digital health solutions gaining traction",
                "Drug pricing regulations impacting margins"
            ],
            "Financial Services": [
                "Rising interest rates boosting net interest margins",
                "Credit quality concerns emerging in certain segments",
                "Digital transformation investments continuing"
            ]
        }
        
        # Get sector-specific trends or use generic ones
        base_trends = trend_templates.get(sector, [
            "Market volatility creating opportunities",
            "Regulatory environment remains supportive",
            "Consumer demand showing resilience"
        ])
        
        # Add performance-based insights
        if performance > 2:
            base_trends.append("Strong momentum attracting institutional investment")
        elif performance < -2:
            base_trends.append("Recent weakness creating potential value opportunities")
        
        return base_trends[:3]  # Return top 3 trends
    
    def _calculate_market_sentiment(self, market_data: List[MarketIndicator], 
                                  economic_data: List[EconomicIndicator]) -> Dict[str, Any]:
        """Calculate overall market sentiment score"""
        
        sentiment_factors = []
        
        # Market index sentiment
        for indicator in market_data:
            if indicator.symbol in ["SPY", "QQQ", "DIA"]:  # Major indices
                weight = 0.3
                score = min(max(indicator.change_percent / 2.0, -1), 1)  # Normalize to -1,1
                sentiment_factors.append(score * weight)
        
        # Volatility sentiment (VIX)
        vix_data = next((ind for ind in market_data if ind.symbol == "VIX"), None)
        if vix_data:
            # Lower VIX = higher sentiment
            vix_score = -(vix_data.change_percent / 10.0)  # Inverse relationship
            sentiment_factors.append(vix_score * 0.2)
        
        # Economic sentiment
        for indicator in economic_data:
            if indicator.impact_level == "high":
                weight = 0.1
                # Positive economic indicators boost sentiment
                if "unemployment" in indicator.indicator_name.lower():
                    # Lower unemployment = positive
                    score = -(indicator.current_value - indicator.previous_value) / indicator.previous_value
                else:
                    # Higher GDP, confidence = positive
                    score = (indicator.current_value - indicator.previous_value) / indicator.previous_value
                
                sentiment_factors.append(score * weight)
        
        # Calculate overall sentiment
        overall_sentiment = sum(sentiment_factors) if sentiment_factors else 0
        overall_sentiment = min(max(overall_sentiment, -1), 1)  # Clamp to -1,1
        
        # Classify sentiment
        if overall_sentiment > 0.3:
            sentiment_label = "Bullish"
            sentiment_description = "Market conditions are favorable with positive momentum"
        elif overall_sentiment < -0.3:
            sentiment_label = "Bearish"
            sentiment_description = "Market showing signs of weakness and uncertainty"
        else:
            sentiment_label = "Neutral"
            sentiment_description = "Mixed signals with no clear directional bias"
        
        return {
            "sentiment_score": round(overall_sentiment, 3),
            "sentiment_label": sentiment_label,
            "description": sentiment_description,
            "confidence_level": min(abs(overall_sentiment) + 0.5, 1.0),
            "key_drivers": self._identify_sentiment_drivers(market_data, economic_data),
            "outlook": self._generate_market_outlook(overall_sentiment)
        }
    
    def _identify_sentiment_drivers(self, market_data: List[MarketIndicator], 
                                  economic_data: List[EconomicIndicator]) -> List[str]:
        """Identify key factors driving market sentiment"""
        
        drivers = []
        
        # Major index movements
        for indicator in market_data:
            if indicator.symbol in ["SPY", "QQQ"] and abs(indicator.change_percent) > 1:
                direction = "gains" if indicator.change_percent > 0 else "losses"
                drivers.append(f"{indicator.name} showing significant {direction} ({indicator.change_percent:+.1f}%)")
        
        # Economic factors
        for indicator in economic_data:
            if indicator.impact_level == "high":
                change = indicator.current_value - indicator.previous_value
                if abs(change) > 0.1:  # Significant change
                    direction = "improvement" if change > 0 else "decline"
                    if "unemployment" in indicator.indicator_name.lower():
                        direction = "decline" if change > 0 else "improvement"  # Inverse for unemployment
                    drivers.append(f"{indicator.indicator_name} showing {direction}")
        
        return drivers[:4]  # Top 4 drivers
    
    def _generate_market_outlook(self, sentiment_score: float) -> Dict[str, str]:
        """Generate market outlook based on sentiment"""
        
        if sentiment_score > 0.3:
            return {
                "short_term": "Positive momentum expected to continue in near term",
                "medium_term": "Favorable conditions support continued growth",
                "risks": "Monitor for potential overheating signals"
            }
        elif sentiment_score < -0.3:
            return {
                "short_term": "Near-term volatility and downside pressure likely",
                "medium_term": "Recovery dependent on improving fundamentals",
                "risks": "Further deterioration could trigger broader selloff"
            }
        else:
            return {
                "short_term": "Range-bound trading with mixed signals",
                "medium_term": "Direction unclear, awaiting catalysts",
                "risks": "Susceptible to external shocks and news flow"
            }
    
    def _generate_market_narrative(self, market_data: List[MarketIndicator],
                                 economic_data: List[EconomicIndicator],
                                 sector_data: List[SectorPerformance],
                                 sentiment: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive market narrative for financial context"""
        
        # Market summary
        spy_data = next((ind for ind in market_data if ind.symbol == "SPY"), None)
        market_performance = spy_data.change_percent if spy_data else 0
        
        # Best and worst performing sectors
        sector_data.sort(key=lambda x: x.performance_1d, reverse=True)
        best_sector = sector_data[0] if sector_data else None
        worst_sector = sector_data[-1] if sector_data else None
        
        # Economic highlights
        key_economic = [ind for ind in economic_data if ind.impact_level == "high"]
        
        narrative = {
            "headline": self._generate_market_headline(market_performance, sentiment),
            "market_summary": self._generate_market_summary(market_data, sentiment),
            "economic_context": self._generate_economic_context(key_economic),
            "sector_highlights": self._generate_sector_highlights(best_sector, worst_sector),
            "investment_implications": self._generate_investment_implications(sentiment, market_data),
            "key_metrics": {
                "market_performance": f"{market_performance:+.1f}%" if market_performance else "N/A",
                "volatility_level": self._assess_volatility(market_data),
                "sector_rotation": self._assess_sector_rotation(sector_data),
                "risk_appetite": sentiment.get("sentiment_label", "Neutral")
            }
        }
        
        return narrative
    
    def _generate_market_headline(self, performance: float, sentiment: Dict[str, Any]) -> str:
        """Generate compelling market headline"""
        
        sentiment_label = sentiment.get("sentiment_label", "Neutral")
        
        if performance > 1:
            return f"Markets Rally {performance:+.1f}% as {sentiment_label} Sentiment Drives Gains"
        elif performance < -1:
            return f"Markets Decline {performance:.1f}% Amid {sentiment_label} Conditions"
        else:
            return f"Markets Trade Mixed with {sentiment_label} Undertones"
    
    def _generate_market_summary(self, market_data: List[MarketIndicator], 
                               sentiment: Dict[str, Any]) -> str:
        """Generate market summary paragraph"""
        
        spy_data = next((ind for ind in market_data if ind.symbol == "SPY"), None)
        vix_data = next((ind for ind in market_data if ind.symbol == "VIX"), None)
        
        performance = spy_data.change_percent if spy_data else 0
        volatility = vix_data.current_value if vix_data else 20
        
        summary = f"The S&P 500 is {'up' if performance > 0 else 'down'} {abs(performance):.1f}% "
        summary += f"in today's trading session. "
        
        if volatility > 25:
            summary += "Elevated volatility levels suggest heightened uncertainty among investors. "
        elif volatility < 15:
            summary += "Low volatility indicates investor complacency and stable market conditions. "
        
        summary += sentiment.get("description", "")
        
        return summary
    
    def _generate_economic_context(self, economic_data: List[EconomicIndicator]) -> str:
        """Generate economic context for market movements"""
        
        if not economic_data:
            return "Economic data releases remain limited with market focus on technical factors."
        
        context = "Key economic indicators show "
        
        positive_indicators = [ind for ind in economic_data 
                             if ind.current_value > ind.previous_value and "unemployment" not in ind.indicator_name.lower()]
        negative_indicators = [ind for ind in economic_data 
                             if ind.current_value < ind.previous_value and "unemployment" not in ind.indicator_name.lower()]
        
        # Handle unemployment separately (inverse relationship)
        unemployment = next((ind for ind in economic_data if "unemployment" in ind.indicator_name.lower()), None)
        if unemployment:
            if unemployment.current_value < unemployment.previous_value:
                positive_indicators.append(unemployment)
            else:
                negative_indicators.append(unemployment)
        
        if len(positive_indicators) > len(negative_indicators):
            context += "broadly improving conditions with "
            example = positive_indicators[0]
            context += f"{example.indicator_name} at {example.current_value}{example.unit}. "
        elif len(negative_indicators) > len(positive_indicators):
            context += "some areas of concern including "
            example = negative_indicators[0]
            context += f"{example.indicator_name} at {example.current_value}{example.unit}. "
        else:
            context += "mixed signals across different measures. "
        
        return context
    
    def _generate_sector_highlights(self, best_sector: Optional[SectorPerformance], 
                                  worst_sector: Optional[SectorPerformance]) -> str:
        """Generate sector performance highlights"""
        
        if not best_sector or not worst_sector:
            return "Sector performance data is currently unavailable."
        
        highlights = f"{best_sector.sector_name} leads with {best_sector.performance_1d:+.1f}% gains, "
        highlights += f"while {worst_sector.sector_name} lags with {worst_sector.performance_1d:+.1f}% performance. "
        
        # Add trend context
        if best_sector.key_trends:
            highlights += f"Key drivers in {best_sector.sector_name} include {best_sector.key_trends[0].lower()}."
        
        return highlights
    
    def _generate_investment_implications(self, sentiment: Dict[str, Any], 
                                        market_data: List[MarketIndicator]) -> List[str]:
        """Generate investment implications and recommendations"""
        
        implications = []
        
        sentiment_score = sentiment.get("sentiment_score", 0)
        
        if sentiment_score > 0.3:
            implications.extend([
                "Consider maintaining equity allocations in favorable environment",
                "Monitor momentum indicators for potential reversal signals",
                "Quality growth stocks may continue to outperform"
            ])
        elif sentiment_score < -0.3:
            implications.extend([
                "Defensive positioning may be warranted given market uncertainty",
                "High-quality bonds could provide portfolio stability",
                "Value opportunities may emerge in oversold sectors"
            ])
        else:
            implications.extend([
                "Balanced approach recommended given mixed signals",
                "Focus on quality names with strong fundamentals",
                "Maintain diversification across asset classes"
            ])
        
        return implications
    
    def _assess_volatility(self, market_data: List[MarketIndicator]) -> str:
        """Assess current volatility levels"""
        
        vix_data = next((ind for ind in market_data if ind.symbol == "VIX"), None)
        if not vix_data:
            return "Unknown"
        
        vix_level = vix_data.current_value
        
        if vix_level > 30:
            return "High"
        elif vix_level > 20:
            return "Elevated"
        elif vix_level > 15:
            return "Moderate"
        else:
            return "Low"
    
    def _assess_sector_rotation(self, sector_data: List[SectorPerformance]) -> str:
        """Assess sector rotation patterns"""
        
        if not sector_data:
            return "Unknown"
        
        # Sort by recent performance
        sector_data.sort(key=lambda x: x.performance_1w, reverse=True)
        
        top_performer = sector_data[0].sector_name
        
        # Check for defensive vs growth rotation
        defensive_sectors = ["Utilities", "Consumer Staples", "Healthcare"]
        growth_sectors = ["Technology", "Consumer Discretionary", "Communication Services"]
        
        if top_performer in defensive_sectors:
            return "Defensive"
        elif top_performer in growth_sectors:
            return "Growth"
        else:
            return "Mixed"
    
    def _determine_trend(self, change_percent: float) -> str:
        """Determine trend direction from percentage change"""
        
        if change_percent > 0.5:
            return "bullish"
        elif change_percent < -0.5:
            return "bearish"
        else:
            return "neutral"
    
    def _get_symbol_name(self, symbol: str) -> str:
        """Get human-readable name for market symbol"""
        
        symbol_names = {
            "SPY": "S&P 500 ETF",
            "QQQ": "NASDAQ 100 ETF", 
            "DIA": "Dow Jones ETF",
            "XLF": "Financial Sector ETF",
            "VIX": "Volatility Index",
            "TLT": "20+ Year Treasury ETF",
            "GLD": "Gold ETF",
            "DXY": "US Dollar Index"
        }
        
        return symbol_names.get(symbol, symbol)
    
    async def _fetch_symbol_data(self, symbol: str) -> Optional[Dict]:
        """Fetch data for specific symbol (placeholder for real API)"""
        
        # This would integrate with real market data APIs
        # For now, return mock data
        return None
    
    async def get_financial_context(self, user_financial_data: Dict) -> Dict[str, Any]:
        """Get market context relevant to user's financial data"""
        
        market_overview = await self.get_market_overview()
        
        # Analyze user's data in market context
        financial_context = {
            "market_environment": market_overview["market_sentiment"]["sentiment_label"],
            "relevant_sectors": self._identify_relevant_sectors(user_financial_data),
            "risk_factors": self._identify_risk_factors(market_overview, user_financial_data),
            "opportunities": self._identify_opportunities(market_overview, user_financial_data),
            "benchmark_performance": self._get_benchmark_performance(market_overview),
            "contextual_narrative": self._generate_contextual_narrative(market_overview, user_financial_data)
        }
        
        return financial_context
    
    def _identify_relevant_sectors(self, financial_data: Dict) -> List[str]:
        """Identify market sectors relevant to user's financial data"""
        
        # This would analyze user's spending/revenue patterns and match to sectors
        relevant_sectors = ["Financial Services", "Technology", "Healthcare"]  # Default for financial analysis
        
        return relevant_sectors
    
    def _identify_risk_factors(self, market_overview: Dict, financial_data: Dict) -> List[str]:
        """Identify market risk factors relevant to user's situation"""
        
        risk_factors = []
        
        sentiment = market_overview.get("market_sentiment", {})
        if sentiment.get("sentiment_label") == "Bearish":
            risk_factors.append("Overall market weakness may impact investment values")
        
        # Interest rate risk
        economic_indicators = market_overview.get("economic_indicators", [])
        fed_funds = next((ind for ind in economic_indicators if "funds" in ind.indicator_name.lower()), None)
        if fed_funds and fed_funds.current_value > 5:
            risk_factors.append("Elevated interest rates may increase borrowing costs")
        
        return risk_factors
    
    def _identify_opportunities(self, market_overview: Dict, financial_data: Dict) -> List[str]:
        """Identify market opportunities relevant to user's situation"""
        
        opportunities = []
        
        sentiment = market_overview.get("market_sentiment", {})
        if sentiment.get("sentiment_label") == "Bullish":
            opportunities.append("Favorable market conditions support growth investments")
        
        # Look for strong performing sectors
        sector_performance = market_overview.get("sector_performance", [])
        if sector_performance:
            top_sector = max(sector_performance, key=lambda x: x.performance_1m)
            if top_sector.performance_1m > 5:
                opportunities.append(f"{top_sector.sector_name} showing strong momentum with {top_sector.performance_1m:+.1f}% monthly gains")
        
        return opportunities
    
    def _get_benchmark_performance(self, market_overview: Dict) -> Dict[str, float]:
        """Get benchmark performance metrics"""
        
        market_indices = market_overview.get("market_indices", [])
        
        benchmarks = {}
        for indicator in market_indices:
            if indicator.symbol in ["SPY", "QQQ", "XLF"]:
                benchmarks[indicator.name] = indicator.change_percent
        
        return benchmarks
    
    def _generate_contextual_narrative(self, market_overview: Dict, financial_data: Dict) -> str:
        """Generate narrative combining market context with user's financial situation"""
        
        sentiment = market_overview.get("market_sentiment", {})
        market_narrative = market_overview.get("market_narrative", {})
        
        narrative = f"In the current {sentiment.get('sentiment_label', 'neutral').lower()} market environment, "
        narrative += market_narrative.get("market_summary", "market conditions remain mixed")
        narrative += " This context is important for understanding your financial position relative to broader economic trends."
        
        return narrative

# Global market data service instance
market_data_service = MarketDataService()

async def get_market_context() -> Dict[str, Any]:
    """Get current market context for financial analysis"""
    return await market_data_service.get_market_overview()

async def get_financial_market_context(financial_data: Dict) -> Dict[str, Any]:
    """Get market context specific to financial data"""
    return await market_data_service.get_financial_context(financial_data)
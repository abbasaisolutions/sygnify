import asyncio
import aiohttp
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
import json
import os
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class MarketDataType(Enum):
    STOCK_PRICE = "stock_price"
    INDEX_DATA = "index_data"
    INTEREST_RATE = "interest_rate"
    CURRENCY_RATE = "currency_rate"
    COMMODITY_PRICE = "commodity_price"
    ECONOMIC_INDICATOR = "economic_indicator"
    SENTIMENT_DATA = "sentiment_data"

@dataclass
class MarketDataPoint:
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

@dataclass
class EconomicIndicator:
    name: str
    value: float
    previous_value: float
    change: float
    date: datetime
    frequency: str  # monthly, quarterly, etc.

class MarketDataService:
    """
    Comprehensive market data service that integrates multiple financial APIs
    to provide real-time market data for financial analysis.
    """
    
    def __init__(self):
        self.api_keys = {
            'alpha_vantage': os.getenv('ALPHA_VANTAGE_API_KEY', 'demo'),
            'finnhub': os.getenv('FINNHUB_API_KEY', 'demo'),
            'polygon': os.getenv('POLYGON_API_KEY', 'demo'),
            'quandl': os.getenv('QUANDL_API_KEY', 'demo')
        }
        
        self.base_urls = {
            'alpha_vantage': 'https://www.alphavantage.co/query',
            'finnhub': 'https://finnhub.io/api/v1',
            'polygon': 'https://api.polygon.io/v2',
            'quandl': 'https://www.quandl.com/api/v3'
        }
        
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
        
    async def get_stock_price(self, symbol: str) -> Optional[MarketDataPoint]:
        """Get real-time stock price data"""
        try:
            # Try Alpha Vantage first
            url = f"{self.base_urls['alpha_vantage']}"
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.api_keys['alpha_vantage']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'Global Quote' in data and data['Global Quote']:
                            quote = data['Global Quote']
                            return MarketDataPoint(
                                symbol=symbol,
                                price=float(quote.get('05. price', 0)),
                                change=float(quote.get('09. change', 0)),
                                change_percent=float(quote.get('10. change percent', '0').replace('%', '')),
                                volume=int(quote.get('06. volume', 0)),
                                market_cap=float(quote.get('07. market cap', 0)) if quote.get('07. market cap') else None
                            )
            
            # Fallback to Finnhub
            return await self._get_stock_price_finnhub(symbol)
            
        except Exception as e:
            logger.error(f"Error fetching stock price for {symbol}: {e}")
            return None
    
    async def _get_stock_price_finnhub(self, symbol: str) -> Optional[MarketDataPoint]:
        """Fallback to Finnhub API"""
        try:
            url = f"{self.base_urls['finnhub']}/quote"
            params = {
                'symbol': symbol,
                'token': self.api_keys['finnhub']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return MarketDataPoint(
                            symbol=symbol,
                            price=data.get('c', 0),
                            change=data.get('d', 0),
                            change_percent=data.get('dp', 0),
                            volume=data.get('v', 0)
                        )
        except Exception as e:
            logger.error(f"Error fetching stock price from Finnhub for {symbol}: {e}")
            return None
    
    async def get_major_indices(self) -> Dict[str, MarketDataPoint]:
        """Get major market indices (S&P 500, NASDAQ, DOW)"""
        indices = {
            'SPY': 'S&P 500 ETF',
            'QQQ': 'NASDAQ-100 ETF', 
            'DIA': 'Dow Jones ETF',
            'IWM': 'Russell 2000 ETF',
            'XLF': 'Financial Sector ETF',
            'XLK': 'Technology Sector ETF'
        }
        
        results = {}
        tasks = []
        
        for symbol in indices.keys():
            tasks.append(self.get_stock_price(symbol))
        
        # Fetch all indices concurrently
        index_data = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, (symbol, name) in enumerate(indices.items()):
            if isinstance(index_data[i], MarketDataPoint):
                results[symbol] = index_data[i]
        
        return results
    
    async def get_interest_rates(self) -> Dict[str, float]:
        """Get current interest rates (Fed Funds, Treasury yields)"""
        try:
            # Use Quandl for Treasury yields
            url = f"{self.base_urls['quandl']}/datasets/USTREASURY/YIELD.json"
            params = {
                'api_key': self.api_keys['quandl'],
                'limit': 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'dataset' in data and 'data' in data['dataset']:
                            latest = data['dataset']['data'][0]
                            return {
                                '1_month': latest[1],
                                '3_month': latest[2], 
                                '6_month': latest[3],
                                '1_year': latest[4],
                                '2_year': latest[5],
                                '3_year': latest[6],
                                '5_year': latest[7],
                                '10_year': latest[8],
                                '30_year': latest[9]
                            }
        except Exception as e:
            logger.error(f"Error fetching interest rates: {e}")
        
        # Fallback to mock data
        return {
            '1_month': 5.25,
            '3_month': 5.30,
            '6_month': 5.35,
            '1_year': 5.40,
            '2_year': 5.45,
            '3_year': 5.50,
            '5_year': 5.55,
            '10_year': 5.60,
            '30_year': 5.65
        }
    
    async def get_currency_rates(self, base_currency: str = 'USD') -> Dict[str, float]:
        """Get currency exchange rates"""
        try:
            url = f"{self.base_urls['alpha_vantage']}"
            params = {
                'function': 'CURRENCY_EXCHANGE_RATE',
                'from_currency': base_currency,
                'to_currency': 'EUR',
                'apikey': self.api_keys['alpha_vantage']
            }
            
            rates = {}
            currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY']
            
            for currency in currencies:
                if currency != base_currency:
                    params['to_currency'] = currency
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, params=params) as response:
                            if response.status == 200:
                                data = await response.json()
                                if 'Realtime Currency Exchange Rate' in data:
                                    rate_data = data['Realtime Currency Exchange Rate']
                                    rates[currency] = float(rate_data.get('5. Exchange Rate', 1.0))
            
            return rates
            
        except Exception as e:
            logger.error(f"Error fetching currency rates: {e}")
            # Fallback to mock data
            return {
                'EUR': 0.85,
                'GBP': 0.75,
                'JPY': 110.0,
                'CAD': 1.25,
                'AUD': 1.35,
                'CHF': 0.90,
                'CNY': 6.45
            }
    
    async def get_commodity_prices(self) -> Dict[str, float]:
        """Get commodity prices (gold, oil, etc.)"""
        commodities = {
            'GC': 'Gold Futures',
            'CL': 'Crude Oil Futures',
            'SI': 'Silver Futures',
            'PL': 'Platinum Futures',
            'PA': 'Palladium Futures',
            'ZC': 'Corn Futures',
            'ZW': 'Wheat Futures'
        }
        
        results = {}
        tasks = []
        
        for symbol in commodities.keys():
            tasks.append(self.get_stock_price(symbol))
        
        commodity_data = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, (symbol, name) in enumerate(commodities.items()):
            if isinstance(commodity_data[i], MarketDataPoint):
                results[symbol] = commodity_data[i].price
        
        return results
    
    async def get_economic_indicators(self) -> Dict[str, EconomicIndicator]:
        """Get economic indicators (GDP, inflation, unemployment)"""
        try:
            # Use Quandl for economic data
            indicators = {
                'GDP': 'FRED/GDP',
                'INFLATION': 'FRED/CPIAUCSL',
                'UNEMPLOYMENT': 'FRED/UNRATE',
                'FED_FUNDS': 'FRED/FEDFUNDS'
            }
            
            results = {}
            
            for name, dataset in indicators.items():
                url = f"{self.base_urls['quandl']}/datasets/{dataset}.json"
                params = {
                    'api_key': self.api_keys['quandl'],
                    'limit': 2  # Get current and previous
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            if 'dataset' in data and 'data' in data['dataset']:
                                data_points = data['dataset']['data']
                                if len(data_points) >= 2:
                                    current = data_points[0]
                                    previous = data_points[1]
                                    
                                    results[name] = EconomicIndicator(
                                        name=name,
                                        value=current[1],
                                        previous_value=previous[1],
                                        change=current[1] - previous[1],
                                        date=datetime.strptime(current[0], '%Y-%m-%d'),
                                        frequency='monthly'
                                    )
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching economic indicators: {e}")
            # Return mock data
            return {
                'GDP': EconomicIndicator('GDP', 21.4, 21.2, 0.2, datetime.now(), 'quarterly'),
                'INFLATION': EconomicIndicator('INFLATION', 3.2, 3.1, 0.1, datetime.now(), 'monthly'),
                'UNEMPLOYMENT': EconomicIndicator('UNEMPLOYMENT', 3.8, 3.9, -0.1, datetime.now(), 'monthly'),
                'FED_FUNDS': EconomicIndicator('FED_FUNDS', 5.25, 5.25, 0.0, datetime.now(), 'monthly')
            }
    
    async def get_market_sentiment(self) -> Dict[str, float]:
        """Get market sentiment indicators"""
        try:
            # Use VIX (volatility index) as sentiment indicator
            vix_data = await self.get_stock_price('VIX')
            
            # Calculate sentiment based on VIX levels
            if vix_data:
                vix_level = vix_data.price
                if vix_level < 15:
                    sentiment = 'bullish'
                    sentiment_score = 0.8
                elif vix_level < 25:
                    sentiment = 'neutral'
                    sentiment_score = 0.5
                else:
                    sentiment = 'bearish'
                    sentiment_score = 0.2
                
                return {
                    'vix_level': vix_level,
                    'sentiment': sentiment,
                    'sentiment_score': sentiment_score,
                    'fear_greed_index': 1 - sentiment_score
                }
            
        except Exception as e:
            logger.error(f"Error fetching market sentiment: {e}")
        
        # Fallback to mock data
        return {
            'vix_level': 18.5,
            'sentiment': 'neutral',
            'sentiment_score': 0.5,
            'fear_greed_index': 0.5
        }
    
    async def get_comprehensive_market_data(self) -> Dict[str, Any]:
        """Get comprehensive market data for analysis"""
        try:
            # Fetch all market data concurrently
            tasks = [
                self.get_major_indices(),
                self.get_interest_rates(),
                self.get_currency_rates(),
                self.get_commodity_prices(),
                self.get_economic_indicators(),
                self.get_market_sentiment()
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            market_data = {
                'indices': results[0] if not isinstance(results[0], Exception) else {},
                'interest_rates': results[1] if not isinstance(results[1], Exception) else {},
                'currency_rates': results[2] if not isinstance(results[2], Exception) else {},
                'commodity_prices': results[3] if not isinstance(results[3], Exception) else {},
                'economic_indicators': results[4] if not isinstance(results[4], Exception) else {},
                'market_sentiment': results[5] if not isinstance(results[5], Exception) else {},
                'timestamp': datetime.now().isoformat(),
                'data_source': 'multiple_apis'
            }
            
            # Cache the results
            self.cache['comprehensive_market_data'] = {
                'data': market_data,
                'timestamp': datetime.now()
            }
            
            return market_data
            
        except Exception as e:
            logger.error(f"Error fetching comprehensive market data: {e}")
            return self._get_mock_market_data()
    
    def _get_mock_market_data(self) -> Dict[str, Any]:
        """Return mock market data for development/testing"""
        return {
            'indices': {
                'SPY': MarketDataPoint('SPY', 450.25, 2.15, 0.48, 85000000),
                'QQQ': MarketDataPoint('QQQ', 380.50, 1.75, 0.46, 65000000),
                'DIA': MarketDataPoint('DIA', 340.75, 1.25, 0.37, 45000000),
                'XLF': MarketDataPoint('XLF', 35.20, 0.30, 0.86, 25000000),
                'XLK': MarketDataPoint('XLK', 165.80, 1.20, 0.73, 35000000)
            },
            'interest_rates': {
                '1_month': 5.25,
                '3_month': 5.30,
                '6_month': 5.35,
                '1_year': 5.40,
                '2_year': 5.45,
                '3_year': 5.50,
                '5_year': 5.55,
                '10_year': 5.60,
                '30_year': 5.65
            },
            'currency_rates': {
                'EUR': 0.85,
                'GBP': 0.75,
                'JPY': 110.0,
                'CAD': 1.25,
                'AUD': 1.35,
                'CHF': 0.90,
                'CNY': 6.45
            },
            'commodity_prices': {
                'GC': 1950.50,  # Gold
                'CL': 75.25,     # Crude Oil
                'SI': 24.80,     # Silver
                'PL': 950.00,    # Platinum
                'PA': 1200.00    # Palladium
            },
            'economic_indicators': {
                'GDP': EconomicIndicator('GDP', 21.4, 21.2, 0.2, datetime.now(), 'quarterly'),
                'INFLATION': EconomicIndicator('INFLATION', 3.2, 3.1, 0.1, datetime.now(), 'monthly'),
                'UNEMPLOYMENT': EconomicIndicator('UNEMPLOYMENT', 3.8, 3.9, -0.1, datetime.now(), 'monthly'),
                'FED_FUNDS': EconomicIndicator('FED_FUNDS', 5.25, 5.25, 0.0, datetime.now(), 'monthly')
            },
            'market_sentiment': {
                'vix_level': 18.5,
                'sentiment': 'neutral',
                'sentiment_score': 0.5,
                'fear_greed_index': 0.5
            },
            'timestamp': datetime.now().isoformat(),
            'data_source': 'mock_data'
        }
    
    def analyze_market_context(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze market context for financial analysis"""
        try:
            analysis = {
                'market_overview': {},
                'risk_indicators': {},
                'opportunity_indicators': {},
                'economic_outlook': {},
                'recommendations': []
            }
            
            # Market overview
            indices = market_data.get('indices', {})
            if indices:
                sp500 = indices.get('SPY')
                nasdaq = indices.get('QQQ')
                
                if sp500 and nasdaq:
                    analysis['market_overview'] = {
                        'market_trend': 'bullish' if sp500.change_percent > 0 else 'bearish',
                        'tech_performance': nasdaq.change_percent,
                        'broad_market_performance': sp500.change_percent,
                        'market_volatility': market_data.get('market_sentiment', {}).get('vix_level', 0)
                    }
            
            # Risk indicators
            sentiment = market_data.get('market_sentiment', {})
            rates = market_data.get('interest_rates', {})
            
            analysis['risk_indicators'] = {
                'volatility_level': 'high' if sentiment.get('vix_level', 0) > 25 else 'normal',
                'interest_rate_environment': 'tightening' if rates.get('10_year', 0) > 5 else 'accommodative',
                'market_sentiment': sentiment.get('sentiment', 'neutral')
            }
            
            # Opportunity indicators
            commodities = market_data.get('commodity_prices', {})
            currencies = market_data.get('currency_rates', {})
            
            analysis['opportunity_indicators'] = {
                'gold_price_trend': 'bullish' if commodities.get('GC', 0) > 1900 else 'neutral',
                'dollar_strength': 'strong' if currencies.get('EUR', 1) < 0.9 else 'weak',
                'commodity_cycle': 'bullish' if commodities.get('CL', 0) > 70 else 'neutral'
            }
            
            # Economic outlook
            indicators = market_data.get('economic_indicators', {})
            analysis['economic_outlook'] = {
                'gdp_growth': 'positive' if indicators.get('GDP', EconomicIndicator('GDP', 0, 0, 0, datetime.now(), '')).change > 0 else 'negative',
                'inflation_trend': 'increasing' if indicators.get('INFLATION', EconomicIndicator('INFLATION', 0, 0, 0, datetime.now(), '')).change > 0 else 'stable',
                'employment_health': 'improving' if indicators.get('UNEMPLOYMENT', EconomicIndicator('UNEMPLOYMENT', 0, 0, 0, datetime.now(), '')).change < 0 else 'stable'
            }
            
            # Generate recommendations
            recommendations = []
            
            if analysis['market_overview'].get('market_trend') == 'bullish':
                recommendations.append("Consider increasing equity exposure in growth sectors")
            
            if analysis['risk_indicators'].get('volatility_level') == 'high':
                recommendations.append("Implement hedging strategies to manage volatility risk")
            
            if analysis['opportunity_indicators'].get('gold_price_trend') == 'bullish':
                recommendations.append("Consider adding precious metals to portfolio for diversification")
            
            if analysis['economic_outlook'].get('inflation_trend') == 'increasing':
                recommendations.append("Monitor inflation-hedging assets like TIPS and commodities")
            
            analysis['recommendations'] = recommendations
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing market context: {e}")
            return {
                'market_overview': {'market_trend': 'neutral'},
                'risk_indicators': {'volatility_level': 'normal'},
                'opportunity_indicators': {'gold_price_trend': 'neutral'},
                'economic_outlook': {'gdp_growth': 'stable'},
                'recommendations': ['Monitor market conditions closely']
            }

# Global instance
market_data_service = MarketDataService() 
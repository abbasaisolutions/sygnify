from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
import asyncio
import logging
from datetime import datetime

from ..services.market_data_service import market_data_service, MarketDataPoint, EconomicIndicator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market", tags=["Market Data"])

@router.get("/health")
async def market_data_health():
    """Health check for market data service"""
    return {
        "status": "healthy",
        "service": "market_data",
        "timestamp": datetime.now().isoformat(),
        "apis_configured": len([k for k, v in market_data_service.api_keys.items() if v != 'demo'])
    }

@router.get("/stock/{symbol}")
async def get_stock_price(symbol: str):
    """Get real-time stock price for a given symbol"""
    try:
        stock_data = await market_data_service.get_stock_price(symbol.upper())
        
        if stock_data:
            return {
                "symbol": stock_data.symbol,
                "price": stock_data.price,
                "change": stock_data.change,
                "change_percent": stock_data.change_percent,
                "volume": stock_data.volume,
                "market_cap": stock_data.market_cap,
                "timestamp": stock_data.timestamp.isoformat(),
                "status": "success"
            }
        else:
            raise HTTPException(status_code=404, detail=f"Stock data not found for {symbol}")
            
    except Exception as e:
        logger.error(f"Error fetching stock price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@router.get("/indices")
async def get_major_indices():
    """Get major market indices (S&P 500, NASDAQ, DOW, etc.)"""
    try:
        indices = await market_data_service.get_major_indices()
        
        # Convert MarketDataPoint objects to dictionaries
        indices_data = {}
        for symbol, data in indices.items():
            if isinstance(data, MarketDataPoint):
                indices_data[symbol] = {
                    "symbol": data.symbol,
                    "price": data.price,
                    "change": data.change,
                    "change_percent": data.change_percent,
                    "volume": data.volume,
                    "market_cap": data.market_cap,
                    "timestamp": data.timestamp.isoformat()
                }
        
        return {
            "indices": indices_data,
            "count": len(indices_data),
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching major indices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching indices: {str(e)}")

@router.get("/interest-rates")
async def get_interest_rates():
    """Get current interest rates (Treasury yields, Fed Funds)"""
    try:
        rates = await market_data_service.get_interest_rates()
        
        return {
            "interest_rates": rates,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching interest rates: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching interest rates: {str(e)}")

@router.get("/currencies")
async def get_currency_rates(base_currency: str = "USD"):
    """Get currency exchange rates"""
    try:
        rates = await market_data_service.get_currency_rates(base_currency)
        
        return {
            "base_currency": base_currency,
            "rates": rates,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching currency rates: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching currency rates: {str(e)}")

@router.get("/commodities")
async def get_commodity_prices():
    """Get commodity prices (gold, oil, etc.)"""
    try:
        commodities = await market_data_service.get_commodity_prices()
        
        return {
            "commodities": commodities,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching commodity prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching commodity prices: {str(e)}")

@router.get("/economic-indicators")
async def get_economic_indicators():
    """Get economic indicators (GDP, inflation, unemployment)"""
    try:
        indicators = await market_data_service.get_economic_indicators()
        
        # Convert EconomicIndicator objects to dictionaries
        indicators_data = {}
        for name, indicator in indicators.items():
            if isinstance(indicator, EconomicIndicator):
                indicators_data[name] = {
                    "name": indicator.name,
                    "value": indicator.value,
                    "previous_value": indicator.previous_value,
                    "change": indicator.change,
                    "date": indicator.date.isoformat(),
                    "frequency": indicator.frequency
                }
        
        return {
            "economic_indicators": indicators_data,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching economic indicators: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching economic indicators: {str(e)}")

@router.get("/sentiment")
async def get_market_sentiment():
    """Get market sentiment indicators"""
    try:
        sentiment = await market_data_service.get_market_sentiment()
        
        return {
            "sentiment": sentiment,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching market sentiment: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching market sentiment: {str(e)}")

@router.get("/comprehensive")
async def get_comprehensive_market_data():
    """Get comprehensive market data for analysis"""
    try:
        market_data = await market_data_service.get_comprehensive_market_data()
        
        # Convert MarketDataPoint and EconomicIndicator objects to dictionaries
        processed_data = {}
        
        # Process indices
        if 'indices' in market_data:
            indices_data = {}
            for symbol, data in market_data['indices'].items():
                if isinstance(data, MarketDataPoint):
                    indices_data[symbol] = {
                        "symbol": data.symbol,
                        "price": data.price,
                        "change": data.change,
                        "change_percent": data.change_percent,
                        "volume": data.volume,
                        "market_cap": data.market_cap,
                        "timestamp": data.timestamp.isoformat()
                    }
            processed_data['indices'] = indices_data
        
        # Process economic indicators
        if 'economic_indicators' in market_data:
            indicators_data = {}
            for name, indicator in market_data['economic_indicators'].items():
                if isinstance(indicator, EconomicIndicator):
                    indicators_data[name] = {
                        "name": indicator.name,
                        "value": indicator.value,
                        "previous_value": indicator.previous_value,
                        "change": indicator.change,
                        "date": indicator.date.isoformat(),
                        "frequency": indicator.frequency
                    }
            processed_data['economic_indicators'] = indicators_data
        
        # Add other data as-is
        for key, value in market_data.items():
            if key not in ['indices', 'economic_indicators']:
                processed_data[key] = value
        
        return {
            "market_data": processed_data,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching comprehensive market data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")

@router.get("/analysis")
async def get_market_analysis():
    """Get market analysis and context"""
    try:
        # Get comprehensive market data
        market_data = await market_data_service.get_comprehensive_market_data()
        
        # Analyze market context
        analysis = market_data_service.analyze_market_context(market_data)
        
        return {
            "analysis": analysis,
            "market_data": market_data,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error generating market analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating market analysis: {str(e)}")

@router.get("/watchlist")
async def get_watchlist_data(symbols: str):
    """Get data for a custom watchlist of symbols"""
    try:
        # Parse comma-separated symbols
        symbol_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]
        
        if not symbol_list:
            raise HTTPException(status_code=400, detail="No valid symbols provided")
        
        # Fetch data for all symbols concurrently
        tasks = [market_data_service.get_stock_price(symbol) for symbol in symbol_list]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        watchlist_data = []
        for i, result in enumerate(results):
            if isinstance(result, MarketDataPoint):
                watchlist_data.append({
                    "symbol": result.symbol,
                    "price": result.price,
                    "change": result.change,
                    "change_percent": result.change_percent,
                    "volume": result.volume,
                    "market_cap": result.market_cap,
                    "timestamp": result.timestamp.isoformat()
                })
            else:
                # Add error entry for failed symbols
                watchlist_data.append({
                    "symbol": symbol_list[i],
                    "error": str(result) if result else "Unknown error",
                    "timestamp": datetime.now().isoformat()
                })
        
        return {
            "watchlist": watchlist_data,
            "total_symbols": len(symbol_list),
            "successful_fetches": len([r for r in results if isinstance(r, MarketDataPoint)]),
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching watchlist data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching watchlist data: {str(e)}")

@router.get("/sectors")
async def get_sector_performance():
    """Get sector ETF performance for sector analysis"""
    try:
        sector_etfs = {
            'XLF': 'Financial',
            'XLK': 'Technology', 
            'XLE': 'Energy',
            'XLV': 'Healthcare',
            'XLI': 'Industrial',
            'XLP': 'Consumer Staples',
            'XLY': 'Consumer Discretionary',
            'XLU': 'Utilities',
            'XLB': 'Materials',
            'XLRE': 'Real Estate'
        }
        
        # Fetch sector ETF data
        tasks = [market_data_service.get_stock_price(symbol) for symbol in sector_etfs.keys()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        sector_data = {}
        for i, (symbol, sector_name) in enumerate(sector_etfs.items()):
            if isinstance(results[i], MarketDataPoint):
                sector_data[sector_name] = {
                    "symbol": results[i].symbol,
                    "price": results[i].price,
                    "change": results[i].change,
                    "change_percent": results[i].change_percent,
                    "volume": results[i].volume,
                    "timestamp": results[i].timestamp.isoformat()
                }
        
        return {
            "sectors": sector_data,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error fetching sector performance: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching sector performance: {str(e)}") 
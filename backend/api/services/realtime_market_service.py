import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

from .market_data_service import market_data_service, MarketDataPoint, EconomicIndicator

logger = logging.getLogger(__name__)

class StreamType(Enum):
    MARKET_OVERVIEW = "market_overview"
    STOCK_PRICE = "stock_price"
    INDICES = "indices"
    COMMODITIES = "commodities"
    CURRENCIES = "currencies"
    ECONOMIC_INDICATORS = "economic_indicators"
    SENTIMENT = "sentiment"
    ALERTS = "alerts"

@dataclass
class MarketAlert:
    type: str
    symbol: str
    message: str
    severity: str  # 'info', 'warning', 'critical'
    timestamp: datetime
    data: Dict[str, Any]

class RealtimeMarketService:
    """
    Real-time market data streaming service that provides live updates
    via WebSocket connections for market data, alerts, and analytics.
    """
    
    def __init__(self):
        self.active_connections: Dict[str, List] = {}
        self.subscriptions: Dict[str, Dict] = {}
        self.alert_thresholds = {
            'price_change': 5.0,  # 5% price change
            'volume_spike': 200.0,  # 200% volume increase
            'volatility': 2.0,  # 2% intraday volatility
        }
        self.last_prices = {}
        self.alert_history = []
        
    async def connect_client(self, client_id: str, websocket):
        """Connect a new client to the real-time service"""
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"Client {client_id} connected to real-time market service")
        
    def disconnect_client(self, client_id: str, websocket):
        """Disconnect a client from the real-time service"""
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected from real-time market service")
        
    async def subscribe_to_stream(self, client_id: str, stream_type: StreamType, symbols: List[str] = None):
        """Subscribe a client to a specific market data stream"""
        if client_id not in self.subscriptions:
            self.subscriptions[client_id] = {}
            
        self.subscriptions[client_id][stream_type.value] = {
            'symbols': symbols or [],
            'active': True,
            'subscribed_at': datetime.now()
        }
        logger.info(f"Client {client_id} subscribed to {stream_type.value}")
        
    async def unsubscribe_from_stream(self, client_id: str, stream_type: StreamType):
        """Unsubscribe a client from a specific market data stream"""
        if client_id in self.subscriptions and stream_type.value in self.subscriptions[client_id]:
            self.subscriptions[client_id][stream_type.value]['active'] = False
            logger.info(f"Client {client_id} unsubscribed from {stream_type.value}")
            
    async def broadcast_market_update(self, stream_type: StreamType, data: Dict[str, Any]):
        """Broadcast market data update to all subscribed clients"""
        message = {
            'type': 'market_update',
            'stream_type': stream_type.value,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        for client_id, connections in self.active_connections.items():
            if client_id in self.subscriptions:
                client_subs = self.subscriptions[client_id]
                if stream_type.value in client_subs and client_subs[stream_type.value]['active']:
                    for websocket in connections:
                        try:
                            await websocket.send_json(message)
                        except Exception as e:
                            logger.error(f"Error sending market update to {client_id}: {e}")
                            
    async def broadcast_alert(self, alert: MarketAlert):
        """Broadcast market alert to all connected clients"""
        message = {
            'type': 'market_alert',
            'alert': asdict(alert),
            'timestamp': datetime.now().isoformat()
        }
        
        for client_id, connections in self.active_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending alert to {client_id}: {e}")
                    
    async def start_market_data_stream(self):
        """Start the continuous market data streaming service"""
        logger.info("Starting real-time market data stream")
        
        while True:
            try:
                # Get comprehensive market data
                market_data = await market_data_service.get_comprehensive_market_data()
                
                # Broadcast market overview
                await self.broadcast_market_update(StreamType.MARKET_OVERVIEW, {
                    'indices': market_data.get('indices', {}),
                    'sentiment': market_data.get('sentiment', {}),
                    'summary': market_data.get('analysis', {}).get('overview', '')
                })
                
                # Check for price alerts
                await self._check_price_alerts(market_data.get('indices', {}))
                
                # Broadcast indices data
                await self.broadcast_market_update(StreamType.INDICES, {
                    'indices': market_data.get('indices', {})
                })
                
                # Broadcast commodities data
                await self.broadcast_market_update(StreamType.COMMODITIES, {
                    'commodities': market_data.get('commodities', {})
                })
                
                # Broadcast currencies data
                await self.broadcast_market_update(StreamType.CURRENCIES, {
                    'currencies': market_data.get('currencies', {})
                })
                
                # Broadcast economic indicators
                await self.broadcast_market_update(StreamType.ECONOMIC_INDICATORS, {
                    'indicators': market_data.get('economic_indicators', {})
                })
                
                # Broadcast sentiment data
                await self.broadcast_market_update(StreamType.SENTIMENT, {
                    'sentiment': market_data.get('sentiment', {})
                })
                
                # Wait before next update (30 seconds)
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in market data stream: {e}")
                await asyncio.sleep(60)  # Wait longer on error
                
    async def _check_price_alerts(self, indices_data: Dict[str, MarketDataPoint]):
        """Check for price alerts based on thresholds"""
        current_time = datetime.now()
        
        for symbol, data in indices_data.items():
            if not isinstance(data, MarketDataPoint):
                continue
                
            if symbol in self.last_prices:
                last_price = self.last_prices[symbol]
                price_change_pct = abs((data.price - last_price) / last_price * 100)
                
                # Check for significant price change
                if price_change_pct >= self.alert_thresholds['price_change']:
                    alert = MarketAlert(
                        type='price_change',
                        symbol=symbol,
                        message=f"{symbol} price changed by {price_change_pct:.2f}%",
                        severity='warning' if price_change_pct < 10 else 'critical',
                        timestamp=current_time,
                        data={
                            'current_price': data.price,
                            'previous_price': last_price,
                            'change_percent': price_change_pct
                        }
                    )
                    await self.broadcast_alert(alert)
                    self.alert_history.append(alert)
                    
            # Update last price
            self.last_prices[symbol] = data.price
            
    async def get_stream_status(self) -> Dict[str, Any]:
        """Get current streaming service status"""
        return {
            'active_connections': len(self.active_connections),
            'total_subscriptions': sum(len(subs) for subs in self.subscriptions.values()),
            'alert_count': len(self.alert_history),
            'last_alert': self.alert_history[-1].timestamp.isoformat() if self.alert_history else None,
            'stream_types': [stream.value for stream in StreamType],
            'timestamp': datetime.now().isoformat()
        }
        
    async def get_recent_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent market alerts"""
        recent_alerts = self.alert_history[-limit:] if self.alert_history else []
        return [asdict(alert) for alert in recent_alerts]

# Global instance
realtime_market_service = RealtimeMarketService() 
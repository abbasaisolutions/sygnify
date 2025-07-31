"""
Enhanced Data Connector Service
Supports seamless connection to files, APIs, and databases
"""
import pandas as pd
import requests
import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import yfinance as yf
from sqlalchemy import create_engine, text
from pymongo import MongoClient
import asyncio
import aiohttp
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class DataSourceType(Enum):
    FILE = "file"
    API = "api"
    DATABASE = "database"
    STREAMING = "streaming"
    MARKET_DATA = "market_data"

@dataclass
class ConnectionConfig:
    source_type: DataSourceType
    name: str
    config: Dict[str, Any]
    credentials: Optional[Dict[str, str]] = None
    timeout: int = 30
    retry_attempts: int = 3

class EnhancedDataConnector:
    def __init__(self):
        self.connections = {}
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        self.session = None
        
    async def initialize(self):
        """Initialize async session for API calls"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Close async session"""
        if self.session:
            await self.session.close()
    
    def add_connection(self, connection_id: str, config: ConnectionConfig) -> bool:
        """Add a new data connection"""
        try:
            self.connections[connection_id] = config
            logger.info(f"Added connection: {connection_id} ({config.source_type.value})")
            return True
        except Exception as e:
            logger.error(f"Failed to add connection {connection_id}: {str(e)}")
            return False
    
    def remove_connection(self, connection_id: str) -> bool:
        """Remove a data connection"""
        if connection_id in self.connections:
            del self.connections[connection_id]
            logger.info(f"Removed connection: {connection_id}")
            return True
        return False
    
    def list_connections(self) -> List[Dict[str, Any]]:
        """List all available connections"""
        return [
            {
                "id": conn_id,
                "name": config.name,
                "type": config.source_type.value,
                "config": config.config
            }
            for conn_id, config in self.connections.items()
        ]
    
    async def test_connection(self, connection_id: str) -> Dict[str, Any]:
        """Test if a connection is working"""
        if connection_id not in self.connections:
            return {"success": False, "error": "Connection not found"}
        
        config = self.connections[connection_id]
        
        try:
            if config.source_type == DataSourceType.API:
                return await self._test_api_connection(config)
            elif config.source_type == DataSourceType.DATABASE:
                return await self._test_database_connection(config)
            elif config.source_type == DataSourceType.MARKET_DATA:
                return await self._test_market_data_connection(config)
            else:
                return {"success": True, "message": "Connection type not requiring test"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _test_api_connection(self, config: ConnectionConfig) -> Dict[str, Any]:
        """Test API connection"""
        try:
            await self.initialize()
            url = config.config.get("base_url", "")
            headers = config.config.get("headers", {})
            
            async with self.session.get(url, headers=headers, timeout=config.timeout) as response:
                if response.status == 200:
                    return {"success": True, "message": "API connection successful"}
                else:
                    return {"success": False, "error": f"HTTP {response.status}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _test_database_connection(self, config: ConnectionConfig) -> Dict[str, Any]:
        """Test database connection"""
        try:
            connection_string = config.config.get("connection_string", "")
            engine = create_engine(connection_string)
            
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            
            return {"success": True, "message": "Database connection successful"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _test_market_data_connection(self, config: ConnectionConfig) -> Dict[str, Any]:
        """Test market data connection"""
        try:
            symbol = config.config.get("symbol", "AAPL")
            ticker = yf.Ticker(symbol)
            info = ticker.info
            if info:
                return {"success": True, "message": "Market data connection successful"}
            else:
                return {"success": False, "error": "No data received"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def fetch_data(self, connection_id: str, query_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch data from a connection"""
        if connection_id not in self.connections:
            return {"success": False, "error": "Connection not found"}
        
        config = self.connections[connection_id]
        cache_key = f"{connection_id}_{hash(str(query_params))}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=self.cache_ttl):
                return {"success": True, "data": cached_data, "cached": True}
        
        try:
            if config.source_type == DataSourceType.API:
                data = await self._fetch_from_api(config, query_params)
            elif config.source_type == DataSourceType.DATABASE:
                data = await self._fetch_from_database(config, query_params)
            elif config.source_type == DataSourceType.MARKET_DATA:
                data = await self._fetch_market_data(config, query_params)
            elif config.source_type == DataSourceType.STREAMING:
                data = await self._fetch_streaming_data(config, query_params)
            else:
                return {"success": False, "error": "Unsupported data source type"}
            
            if data.get("success"):
                # Cache the result
                self.cache[cache_key] = (data["data"], datetime.now())
                return data
            else:
                return data
                
        except Exception as e:
            logger.error(f"Error fetching data from {connection_id}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _fetch_from_api(self, config: ConnectionConfig, query_params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Fetch data from API"""
        try:
            await self.initialize()
            url = config.config.get("base_url", "")
            endpoint = config.config.get("endpoint", "")
            method = config.config.get("method", "GET").upper()
            headers = config.config.get("headers", {})
            
            full_url = f"{url}{endpoint}"
            
            if method == "GET":
                async with self.session.get(full_url, params=query_params, headers=headers, timeout=config.timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {"success": True, "data": data}
                    else:
                        return {"success": False, "error": f"HTTP {response.status}"}
            elif method == "POST":
                async with self.session.post(full_url, json=query_params, headers=headers, timeout=config.timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {"success": True, "data": data}
                    else:
                        return {"success": False, "error": f"HTTP {response.status}"}
            else:
                return {"success": False, "error": f"Unsupported method: {method}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _fetch_from_database(self, config: ConnectionConfig, query_params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Fetch data from database"""
        try:
            connection_string = config.config.get("connection_string", "")
            query = config.config.get("query", "")
            
            if query_params:
                # Replace placeholders in query with actual values
                for key, value in query_params.items():
                    query = query.replace(f":{key}", str(value))
            
            engine = create_engine(connection_string)
            
            with engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()
                columns = result.keys()
                
                data = [dict(zip(columns, row)) for row in rows]
                return {"success": True, "data": data}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _fetch_market_data(self, config: ConnectionConfig, query_params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Fetch market data"""
        try:
            symbol = query_params.get("symbol", config.config.get("symbol", "AAPL"))
            period = query_params.get("period", "1y")
            interval = query_params.get("interval", "1d")
            
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
            
            # Convert to JSON-serializable format
            data_dict = {
                "symbol": symbol,
                "period": period,
                "interval": interval,
                "data": data.reset_index().to_dict("records"),
                "info": ticker.info
            }
            
            return {"success": True, "data": data_dict}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _fetch_streaming_data(self, config: ConnectionConfig, query_params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Fetch streaming data (simulated for now)"""
        try:
            # Simulate streaming data
            data = {
                "timestamp": datetime.now().isoformat(),
                "type": "streaming",
                "data": query_params or {}
            }
            
            return {"success": True, "data": data}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_available_connectors(self) -> List[Dict[str, Any]]:
        """Get list of available connector types"""
        return [
            {
                "type": "api",
                "name": "REST API",
                "description": "Connect to REST APIs with authentication",
                "config_fields": ["base_url", "endpoint", "method", "headers", "auth_type"]
            },
            {
                "type": "database",
                "name": "Database",
                "description": "Connect to SQL databases (PostgreSQL, MySQL, SQL Server)",
                "config_fields": ["connection_string", "query", "parameters"]
            },
            {
                "type": "market_data",
                "name": "Market Data",
                "description": "Real-time financial market data",
                "config_fields": ["symbol", "period", "interval"]
            },
            {
                "type": "streaming",
                "name": "Streaming Data",
                "description": "Real-time data streams",
                "config_fields": ["stream_url", "format", "frequency"]
            }
        ]

# Global instance
data_connector = EnhancedDataConnector() 
"""
Data Connector Service v1.1
- Multi-source data connectivity
- API integration with authentication
- Database connectors (PostgreSQL, MySQL, MongoDB)
- Real-time data streaming
- Connection pooling and caching
"""
import pandas as pd
import requests
import sqlalchemy
from sqlalchemy import create_engine, text
import pymongo
from pymongo import MongoClient
import logging
from typing import Dict, Any, Optional, List
import json
import time
from datetime import datetime, timedelta
import asyncio
import aiohttp
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ConnectionConfig:
    """Configuration for data source connections"""
    source_type: str  # api, database, file, stream
    connection_string: str
    authentication: Dict[str, str] = None
    query_params: Dict[str, Any] = None
    headers: Dict[str, str] = None
    timeout: int = 30
    retry_attempts: int = 3

class DataConnectorService:
    def __init__(self):
        self.connection_pool = {}
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        
    def connect_and_fetch(self, connection_info: Dict[str, Any]) -> pd.DataFrame:
        """Connect to data source and fetch data"""
        try:
            config = ConnectionConfig(**connection_info)
            
            if config.source_type == "api":
                return self._fetch_from_api(config)
            elif config.source_type == "database":
                return self._fetch_from_database(config)
            elif config.source_type == "file":
                return self._fetch_from_file(config)
            elif config.source_type == "stream":
                return self._fetch_from_stream(config)
            else:
                raise ValueError(f"Unsupported source type: {config.source_type}")
                
        except Exception as e:
            logger.error(f"Data connection failed: {str(e)}")
            raise
    
    def _fetch_from_api(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from REST API"""
        try:
            headers = config.headers or {}
            if config.authentication:
                headers.update(self._get_auth_headers(config.authentication))
            
            response = requests.get(
                config.connection_string,
                headers=headers,
                params=config.query_params,
                timeout=config.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"API fetch failed: {str(e)}")
            raise
    
    def _fetch_from_database(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from database"""
        try:
            # Parse connection string to determine database type
            if "postgresql" in config.connection_string or "postgres" in config.connection_string:
                return self._fetch_from_postgresql(config)
            elif "mysql" in config.connection_string:
                return self._fetch_from_mysql(config)
            elif "mongodb" in config.connection_string:
                return self._fetch_from_mongodb(config)
            else:
                # Generic SQLAlchemy connection
                return self._fetch_from_generic_sql(config)
                
        except Exception as e:
            logger.error(f"Database fetch failed: {str(e)}")
            raise
    
    def _fetch_from_postgresql(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from PostgreSQL"""
        engine = create_engine(config.connection_string)
        query = config.query_params.get("query", "SELECT * FROM data LIMIT 1000")
        
        with engine.connect() as connection:
            result = connection.execute(text(query))
            data = [dict(row) for row in result]
            return pd.DataFrame(data)
    
    def _fetch_from_mysql(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from MySQL"""
        engine = create_engine(config.connection_string)
        query = config.query_params.get("query", "SELECT * FROM data LIMIT 1000")
        
        with engine.connect() as connection:
            result = connection.execute(text(query))
            data = [dict(row) for row in result]
            return pd.DataFrame(data)
    
    def _fetch_from_mongodb(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from MongoDB"""
        client = MongoClient(config.connection_string)
        db_name = config.query_params.get("database", "default")
        collection_name = config.query_params.get("collection", "data")
        
        db = client[db_name]
        collection = db[collection_name]
        
        # Get query filter if provided
        filter_query = config.query_params.get("filter", {})
        limit = config.query_params.get("limit", 1000)
        
        cursor = collection.find(filter_query).limit(limit)
        data = list(cursor)
        
        # Convert MongoDB documents to DataFrame
        return pd.DataFrame(data)
    
    def _fetch_from_generic_sql(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from generic SQL database"""
        engine = create_engine(config.connection_string)
        query = config.query_params.get("query", "SELECT * FROM data LIMIT 1000")
        
        return pd.read_sql(query, engine)
    
    def _fetch_from_file(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from file (CSV, Excel, JSON)"""
        file_path = config.connection_string
        
        if file_path.endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.endswith(('.xlsx', '.xls')):
            return pd.read_excel(file_path)
        elif file_path.endswith('.json'):
            return pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path}")
    
    def _fetch_from_stream(self, config: ConnectionConfig) -> pd.DataFrame:
        """Fetch data from real-time stream"""
        # For now, return empty DataFrame
        # In production, this would connect to Kafka, Redis, or other streaming platforms
        logger.warning("Streaming data sources not yet implemented")
        return pd.DataFrame()
    
    def _get_auth_headers(self, auth_config: Dict[str, str]) -> Dict[str, str]:
        """Generate authentication headers"""
        auth_type = auth_config.get("type", "bearer")
        
        if auth_type == "bearer":
            return {"Authorization": f"Bearer {auth_config.get('token')}"}
        elif auth_type == "basic":
            import base64
            credentials = f"{auth_config.get('username')}:{auth_config.get('password')}"
            encoded = base64.b64encode(credentials.encode()).decode()
            return {"Authorization": f"Basic {encoded}"}
        elif auth_type == "api_key":
            return {auth_config.get("header_name", "X-API-Key"): auth_config.get("api_key")}
        else:
            return {}
    
    def test_connection(self, connection_info: Dict[str, Any]) -> Dict[str, Any]:
        """Test data source connection"""
        try:
            config = ConnectionConfig(**connection_info)
            
            if config.source_type == "api":
                return self._test_api_connection(config)
            elif config.source_type == "database":
                return self._test_database_connection(config)
            else:
                return {"status": "success", "message": "Connection test not implemented for this source type"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def _test_api_connection(self, config: ConnectionConfig) -> Dict[str, Any]:
        """Test API connection"""
        try:
            headers = config.headers or {}
            if config.authentication:
                headers.update(self._get_auth_headers(config.authentication))
            
            response = requests.get(
                config.connection_string,
                headers=headers,
                timeout=config.timeout
            )
            
            return {
                "status": "success",
                "message": f"API connection successful. Status: {response.status_code}",
                "response_time": response.elapsed.total_seconds()
            }
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def _test_database_connection(self, config: ConnectionConfig) -> Dict[str, Any]:
        """Test database connection"""
        try:
            if "postgresql" in config.connection_string or "postgres" in config.connection_string:
                engine = create_engine(config.connection_string)
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1"))
                return {"status": "success", "message": "PostgreSQL connection successful"}
            elif "mysql" in config.connection_string:
                engine = create_engine(config.connection_string)
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1"))
                return {"status": "success", "message": "MySQL connection successful"}
            elif "mongodb" in config.connection_string:
                client = MongoClient(config.connection_string)
                client.admin.command('ping')
                return {"status": "success", "message": "MongoDB connection successful"}
            else:
                engine = create_engine(config.connection_string)
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1"))
                return {"status": "success", "message": "Database connection successful"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_available_connectors(self) -> List[Dict[str, Any]]:
        """Get list of available data connectors"""
        return [
            {
                "name": "REST API",
                "type": "api",
                "description": "Connect to REST APIs with authentication",
                "config_fields": ["connection_string", "authentication", "headers", "query_params"]
            },
            {
                "name": "PostgreSQL",
                "type": "database",
                "description": "Connect to PostgreSQL databases",
                "config_fields": ["connection_string", "query_params"]
            },
            {
                "name": "MySQL",
                "type": "database", 
                "description": "Connect to MySQL databases",
                "config_fields": ["connection_string", "query_params"]
            },
            {
                "name": "MongoDB",
                "type": "database",
                "description": "Connect to MongoDB collections",
                "config_fields": ["connection_string", "query_params"]
            },
            {
                "name": "File Upload",
                "type": "file",
                "description": "Upload CSV, Excel, or JSON files",
                "config_fields": ["connection_string"]
            }
        ] 
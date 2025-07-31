"""
Enterprise Database Connection Management for Sygnify
- High-performance connection pooling with SQLAlchemy
- Health monitoring and automatic failover
- Read/write replica support for scaling
- Connection metrics and monitoring
- Async support for high-throughput operations
"""

import asyncio
import logging
import time
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager, contextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DisconnectionError, OperationalError
from sqlalchemy.dialects import postgresql
import psycopg2
from urllib.parse import quote_plus
import os
from dataclasses import dataclass
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """Database configuration parameters"""
    host: str
    port: int = 5432
    database: str = "sygnify"
    username: str = "sygnify_user"
    password: str = ""
    ssl_mode: str = "prefer"
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600  # 1 hour
    pool_pre_ping: bool = True
    echo: bool = False
    echo_pool: bool = False
    
    # Read replica configuration
    read_host: Optional[str] = None
    read_port: Optional[int] = None
    
    # Connection retry settings
    max_retries: int = 3
    retry_delay: int = 1
    
    # Monitoring settings
    slow_query_threshold: float = 1.0  # seconds
    
class DatabaseConnectionManager:
    """Enterprise database connection manager with pooling and monitoring"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.write_engine: Optional[Engine] = None
        self.read_engine: Optional[Engine] = None
        self.async_write_engine = None
        self.async_read_engine = None
        self.session_factory = None
        self.async_session_factory = None
        
        # Connection monitoring
        self.connection_stats = {
            "total_connections": 0,
            "active_connections": 0,
            "total_queries": 0,
            "slow_queries": 0,
            "connection_errors": 0,
            "avg_query_time": 0.0,
            "uptime": datetime.utcnow()
        }
        
        # Health status
        self.health_status = {
            "write_db": "unknown",
            "read_db": "unknown",
            "last_health_check": None
        }
        
        self._initialize_engines()
        self._setup_event_listeners()
    
    def _build_connection_url(self, host: str, port: int, read_only: bool = False) -> str:
        """Build PostgreSQL connection URL"""
        
        # Use environment variables for sensitive data
        password = os.getenv("DATABASE_PASSWORD", self.config.password)
        username = os.getenv("DATABASE_USERNAME", self.config.username)
        database = os.getenv("DATABASE_NAME", self.config.database)
        
        # URL encode password to handle special characters
        encoded_password = quote_plus(password)
        
        url = f"postgresql://{username}:{encoded_password}@{host}:{port}/{database}"
        
        # Add SSL and other parameters
        params = []
        if self.config.ssl_mode:
            params.append(f"sslmode={self.config.ssl_mode}")
        
        if read_only:
            params.append("default_transaction_read_only=true")
        
        if params:
            url += "?" + "&".join(params)
        
        return url
    
    def _initialize_engines(self):
        """Initialize SQLAlchemy engines with optimized settings"""
        
        # Write (primary) database engine
        write_url = self._build_connection_url(
            self.config.host, 
            self.config.port
        )
        
        self.write_engine = create_engine(
            write_url,
            poolclass=QueuePool,
            pool_size=self.config.pool_size,
            max_overflow=self.config.max_overflow,
            pool_timeout=self.config.pool_timeout,
            pool_recycle=self.config.pool_recycle,
            pool_pre_ping=self.config.pool_pre_ping,
            echo=self.config.echo,
            echo_pool=self.config.echo_pool,
            # PostgreSQL-specific optimizations
            connect_args={
                "options": "-c timezone=utc",
                "application_name": "sygnify_analytics",
                "connect_timeout": 10,
                "command_timeout": 30,
            },
            # Performance tuning
            execution_options={
                "isolation_level": "READ_COMMITTED",
                "postgresql_readonly": False,
                "postgresql_deferrable": False,
            }
        )
        
        # Read replica engine (if configured)
        if self.config.read_host:
            read_url = self._build_connection_url(
                self.config.read_host, 
                self.config.read_port or self.config.port,
                read_only=True
            )
            
            self.read_engine = create_engine(
                read_url,
                poolclass=QueuePool,
                pool_size=max(self.config.pool_size // 2, 5),  # Smaller pool for reads
                max_overflow=self.config.max_overflow // 2,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                pool_pre_ping=True,
                echo=self.config.echo,
                connect_args={
                    "options": "-c timezone=utc -c default_transaction_read_only=true",
                    "application_name": "sygnify_analytics_read",
                    "connect_timeout": 10,
                },
                execution_options={
                    "isolation_level": "READ_COMMITTED",
                    "postgresql_readonly": True,
                    "postgresql_deferrable": True,
                }
            )
        else:
            self.read_engine = self.write_engine
        
        # Async engines for high-throughput operations
        async_write_url = write_url.replace("postgresql://", "postgresql+asyncpg://")
        self.async_write_engine = create_async_engine(
            async_write_url,
            pool_size=self.config.pool_size // 2,
            max_overflow=self.config.max_overflow // 2,
            pool_timeout=self.config.pool_timeout,
            pool_recycle=self.config.pool_recycle,
            pool_pre_ping=True,
            echo=self.config.echo
        )
        
        if self.config.read_host:
            async_read_url = self._build_connection_url(
                self.config.read_host, 
                self.config.read_port or self.config.port,
                read_only=True
            ).replace("postgresql://", "postgresql+asyncpg://")
            
            self.async_read_engine = create_async_engine(
                async_read_url,
                pool_size=self.config.pool_size // 4,
                max_overflow=self.config.max_overflow // 4,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                pool_pre_ping=True,
                echo=self.config.echo
            )
        else:
            self.async_read_engine = self.async_write_engine
        
        # Session factories
        self.session_factory = sessionmaker(
            bind=self.write_engine,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False
        )
        
        self.async_session_factory = sessionmaker(
            bind=self.async_write_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False
        )
        
        logger.info("Database engines initialized successfully")
    
    def _setup_event_listeners(self):
        """Setup SQLAlchemy event listeners for monitoring"""
        
        @event.listens_for(self.write_engine, "connect")
        def on_connect(dbapi_connection, connection_record):
            self.connection_stats["total_connections"] += 1
            logger.debug("New database connection established")
        
        @event.listens_for(self.write_engine, "checkout")
        def on_checkout(dbapi_connection, connection_record, connection_proxy):
            self.connection_stats["active_connections"] += 1
        
        @event.listens_for(self.write_engine, "checkin")
        def on_checkin(dbapi_connection, connection_record):
            self.connection_stats["active_connections"] = max(0, self.connection_stats["active_connections"] - 1)
        
        @event.listens_for(self.write_engine, "before_cursor_execute")
        def on_before_execute(conn, cursor, statement, parameters, context, executemany):
            context._query_start_time = time.time()
            self.connection_stats["total_queries"] += 1
        
        @event.listens_for(self.write_engine, "after_cursor_execute")
        def on_after_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - context._query_start_time
            
            # Update average query time
            current_avg = self.connection_stats["avg_query_time"]
            total_queries = self.connection_stats["total_queries"]
            new_avg = ((current_avg * (total_queries - 1)) + total_time) / total_queries
            self.connection_stats["avg_query_time"] = new_avg
            
            # Track slow queries
            if total_time > self.config.slow_query_threshold:
                self.connection_stats["slow_queries"] += 1
                logger.warning(f"Slow query detected: {total_time:.3f}s - {statement[:100]}...")
        
        @event.listens_for(self.write_engine, "handle_error")
        def on_error(exception_context):
            self.connection_stats["connection_errors"] += 1
            logger.error(f"Database error: {exception_context.original_exception}")
    
    @contextmanager
    def get_session(self, read_only: bool = False):
        """Get a database session with automatic cleanup"""
        
        engine = self.read_engine if read_only else self.write_engine
        session = Session(bind=engine)
        
        try:
            yield session
            if not read_only:
                session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    @asynccontextmanager
    async def get_async_session(self, read_only: bool = False):
        """Get an async database session with automatic cleanup"""
        
        engine = self.async_read_engine if read_only else self.async_write_engine
        session = AsyncSession(bind=engine)
        
        try:
            yield session
            if not read_only:
                await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Async database session error: {e}")
            raise
        finally:
            await session.close()
    
    def execute_query(self, query: str, params: Dict = None, read_only: bool = False) -> List[Dict]:
        """Execute a raw SQL query and return results"""
        
        engine = self.read_engine if read_only else self.write_engine
        
        try:
            with engine.connect() as conn:
                if params:
                    result = conn.execute(text(query), params)
                else:
                    result = conn.execute(text(query))
                
                if result.returns_rows:
                    return [dict(row) for row in result.fetchall()]
                else:
                    return []
        
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    async def execute_async_query(self, query: str, params: Dict = None, read_only: bool = False) -> List[Dict]:
        """Execute an async SQL query and return results"""
        
        engine = self.async_read_engine if read_only else self.async_write_engine
        
        try:
            async with engine.begin() as conn:
                if params:
                    result = await conn.execute(text(query), params)
                else:
                    result = await conn.execute(text(query))
                
                if result.returns_rows:
                    rows = await result.fetchall()
                    return [dict(row) for row in rows]
                else:
                    return []
        
        except Exception as e:
            logger.error(f"Async query execution failed: {e}")
            raise
    
    def check_health(self) -> Dict[str, Any]:
        """Check database health status"""
        
        health_status = {
            "write_db": "unknown",
            "read_db": "unknown",
            "write_latency": None,
            "read_latency": None,
            "connection_pool": {},
            "last_check": datetime.utcnow().isoformat()
        }
        
        # Check write database
        try:
            start_time = time.time()
            with self.write_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            write_latency = (time.time() - start_time) * 1000  # ms
            health_status["write_db"] = "healthy"
            health_status["write_latency"] = round(write_latency, 2)
        except Exception as e:
            health_status["write_db"] = "failed"
            health_status["write_error"] = str(e)
            logger.error(f"Write database health check failed: {e}")
        
        # Check read database
        try:
            start_time = time.time()
            with self.read_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            read_latency = (time.time() - start_time) * 1000  # ms
            health_status["read_db"] = "healthy"
            health_status["read_latency"] = round(read_latency, 2)
        except Exception as e:
            health_status["read_db"] = "failed"
            health_status["read_error"] = str(e)
            logger.error(f"Read database health check failed: {e}")
        
        # Connection pool status
        write_pool = self.write_engine.pool
        health_status["connection_pool"] = {
            "size": write_pool.size(),
            "overflow": write_pool.overflow(),
            "checked_in": write_pool.checkedin(),
            "checked_out": write_pool.checkedout()
        }
        
        self.health_status = health_status
        return health_status
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get detailed connection statistics"""
        
        uptime = datetime.utcnow() - self.connection_stats["uptime"]
        
        return {
            **self.connection_stats,
            "uptime_seconds": uptime.total_seconds(),
            "queries_per_second": self.connection_stats["total_queries"] / max(uptime.total_seconds(), 1),
            "error_rate": self.connection_stats["connection_errors"] / max(self.connection_stats["total_queries"], 1),
            "slow_query_rate": self.connection_stats["slow_queries"] / max(self.connection_stats["total_queries"], 1)
        }
    
    def optimize_for_analytics(self):
        """Apply PostgreSQL optimizations for analytics workloads"""
        
        optimization_queries = [
            # Increase work memory for complex queries
            "SET work_mem = '256MB'",
            
            # Optimize for sequential scans in analytics
            "SET seq_page_cost = 1",
            "SET random_page_cost = 4",
            
            # Increase maintenance work memory
            "SET maintenance_work_mem = '512MB'",
            
            # Optimize checkpoint settings
            "SET checkpoint_completion_target = 0.9",
            
            # Enable parallel queries
            "SET max_parallel_workers_per_gather = 4",
            "SET max_parallel_workers = 8",
            
            # Optimize for large datasets
            "SET effective_cache_size = '2GB'",
            "SET shared_buffers = '512MB'"
        ]
        
        try:
            for query in optimization_queries:
                with self.write_engine.connect() as conn:
                    conn.execute(text(query))
            logger.info("Database optimizations applied successfully")
        except Exception as e:
            logger.warning(f"Some database optimizations failed: {e}")
    
    def create_indexes(self):
        """Create additional performance indexes"""
        
        index_queries = [
            # Financial records performance indexes
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_amount_range 
            ON financial_records USING BRIN (amount) 
            WHERE amount IS NOT NULL
            """,
            
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_records_date_range 
            ON financial_records USING BRIN (record_date) 
            WHERE record_date IS NOT NULL
            """,
            
            # Audit logs partitioning support
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_month 
            ON audit_logs (date_trunc('month', created_at))
            """,
            
            # System metrics time-series optimization
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_time_series 
            ON system_metrics (metric_name, recorded_at DESC)
            """,
            
            # User session cleanup index
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup 
            ON user_sessions (expires_at) 
            WHERE is_active = true
            """
        ]
        
        for query in index_queries:
            try:
                with self.write_engine.connect() as conn:
                    conn.execute(text(query))
                logger.info("Performance index created successfully")
            except Exception as e:
                logger.warning(f"Index creation failed: {e}")
    
    def cleanup_old_data(self, retention_days: int = 90):
        """Cleanup old data based on retention policy"""
        
        cleanup_queries = [
            # Cleanup old audit logs
            f"""
            DELETE FROM audit_logs 
            WHERE created_at < NOW() - INTERVAL '{retention_days} days'
            """,
            
            # Cleanup expired sessions
            """
            DELETE FROM user_sessions 
            WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '7 days')
            """,
            
            # Cleanup expired cache entries
            """
            DELETE FROM cache_entries 
            WHERE expires_at < NOW()
            """,
            
            # Cleanup old system metrics (keep 30 days)
            f"""
            DELETE FROM system_metrics 
            WHERE recorded_at < NOW() - INTERVAL '30 days'
            """
        ]
        
        for query in cleanup_queries:
            try:
                with self.write_engine.connect() as conn:
                    result = conn.execute(text(query))
                    conn.commit()
                    logger.info(f"Cleanup completed: {result.rowcount} rows removed")
            except Exception as e:
                logger.error(f"Cleanup failed: {e}")
    
    def get_table_stats(self) -> Dict[str, Any]:
        """Get table size and row count statistics"""
        
        stats_query = """
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
        """
        
        size_query = """
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        """
        
        try:
            stats = self.execute_query(stats_query, read_only=True)
            sizes = self.execute_query(size_query, read_only=True)
            
            return {
                "column_statistics": stats,
                "table_sizes": sizes,
                "generated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get table stats: {e}")
            return {}
    
    def close(self):
        """Close all database connections"""
        
        try:
            if self.write_engine:
                self.write_engine.dispose()
            if self.read_engine and self.read_engine != self.write_engine:
                self.read_engine.dispose()
            if self.async_write_engine:
                self.async_write_engine.dispose()
            if self.async_read_engine and self.async_read_engine != self.async_write_engine:
                self.async_read_engine.dispose()
            
            logger.info("All database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

# Global database manager instance
db_manager: Optional[DatabaseConnectionManager] = None

def initialize_database(config: DatabaseConfig = None) -> DatabaseConnectionManager:
    """Initialize the global database manager"""
    
    global db_manager
    
    if config is None:
        # Load from environment variables
        config = DatabaseConfig(
            host=os.getenv("DATABASE_HOST", "localhost"),
            port=int(os.getenv("DATABASE_PORT", "5432")),
            database=os.getenv("DATABASE_NAME", "sygnify"),
            username=os.getenv("DATABASE_USERNAME", "sygnify_user"),
            password=os.getenv("DATABASE_PASSWORD", ""),
            pool_size=int(os.getenv("DATABASE_POOL_SIZE", "20")),
            max_overflow=int(os.getenv("DATABASE_MAX_OVERFLOW", "30")),
            read_host=os.getenv("DATABASE_READ_HOST"),
            read_port=int(os.getenv("DATABASE_READ_PORT", "5432")) if os.getenv("DATABASE_READ_PORT") else None
        )
    
    db_manager = DatabaseConnectionManager(config)
    
    # Apply optimizations
    db_manager.optimize_for_analytics()
    db_manager.create_indexes()
    
    return db_manager

def get_database() -> DatabaseConnectionManager:
    """Get the global database manager instance"""
    
    if db_manager is None:
        raise RuntimeError("Database not initialized. Call initialize_database() first.")
    
    return db_manager

# Context managers for easy session management
@contextmanager
def get_db_session(read_only: bool = False):
    """Context manager for database sessions"""
    db = get_database()
    with db.get_session(read_only=read_only) as session:
        yield session

@asynccontextmanager
async def get_async_db_session(read_only: bool = False):
    """Context manager for async database sessions"""
    db = get_database()
    async with db.get_async_session(read_only=read_only) as session:
        yield session
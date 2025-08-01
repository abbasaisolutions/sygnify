"""
Performance Optimization Module for Retail Domain
Provides caching, data preprocessing optimization, and performance monitoring
"""
import hashlib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
import logging
from functools import wraps
import time

logger = logging.getLogger(__name__)

class RetailCache:
    """
    Simple in-memory cache for retail calculations with TTL support
    """
    def __init__(self, default_ttl: int = 3600):
        self.cache = {}
        self.timestamps = {}
        self.default_ttl = default_ttl
        
    def _generate_key(self, data: pd.DataFrame, operation: str, params: Dict = None) -> str:
        """Generate a cache key based on data characteristics and operation"""
        params = params or {}
        
        # Create data fingerprint
        data_hash = hashlib.md5(
            f"{data.shape}{list(data.columns)}{data.dtypes.to_dict()}".encode()
        ).hexdigest()
        
        # Create params fingerprint
        params_hash = hashlib.md5(str(sorted(params.items())).encode()).hexdigest()
        
        return f"{operation}:{data_hash}:{params_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached result if valid"""
        if key not in self.cache:
            return None
            
        # Check TTL
        if key in self.timestamps:
            age = (datetime.now() - self.timestamps[key]).total_seconds()
            if age > self.default_ttl:
                self._invalidate(key)
                return None
                
        return self.cache.get(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set cached value with TTL"""
        self.cache[key] = value
        self.timestamps[key] = datetime.now()
        logger.debug(f"Cached result for key: {key[:50]}...")
    
    def _invalidate(self, key: str) -> None:
        """Remove cached item"""
        self.cache.pop(key, None)
        self.timestamps.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache"""
        self.cache.clear()
        self.timestamps.clear()
        logger.info("Cache cleared")

# Global cache instance
retail_cache = RetailCache()

def cached_operation(ttl: int = 3600, cache_key_params: list = None):
    """
    Decorator for caching retail operations
    
    Args:
        ttl: Time to live in seconds
        cache_key_params: List of parameter names to include in cache key
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract DataFrame and operation parameters
            df = None
            params = {}
            
            for arg in args:
                if isinstance(arg, pd.DataFrame):
                    df = arg
                    break
            
            if cache_key_params:
                params = {k: kwargs.get(k) for k in cache_key_params if k in kwargs}
            
            if df is not None:
                cache_key = retail_cache._generate_key(df, func.__name__, params)
                
                # Try to get from cache
                cached_result = retail_cache.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return cached_result
                
                # Execute function and cache result
                start_time = time.time()
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                retail_cache.set(cache_key, result, ttl)
                logger.debug(f"Cached {func.__name__} result (execution: {execution_time:.3f}s)")
                
                return result
            else:
                # No DataFrame found, execute without caching
                return func(*args, **kwargs)
        
        return wrapper
    return decorator

class DataFrameOptimizer:
    """
    Optimizes DataFrame operations for retail analytics
    """
    
    @staticmethod
    def optimize_dtypes(df: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize DataFrame data types for memory efficiency
        """
        df_optimized = df.copy()
        
        for col in df_optimized.columns:
            col_type = df_optimized[col].dtype
            
            # Optimize numeric columns
            if col_type in ['int64', 'float64']:
                if col_type == 'int64':
                    col_min = df_optimized[col].min()
                    col_max = df_optimized[col].max()
                    
                    if col_min >= 0 and col_max <= 255:
                        df_optimized[col] = df_optimized[col].astype('uint8')
                    elif col_min >= -128 and col_max <= 127:
                        df_optimized[col] = df_optimized[col].astype('int8')
                    elif col_min >= -32768 and col_max <= 32767:
                        df_optimized[col] = df_optimized[col].astype('int16')
                    elif col_min >= -2147483648 and col_max <= 2147483647:
                        df_optimized[col] = df_optimized[col].astype('int32')
                
                elif col_type == 'float64':
                    df_optimized[col] = pd.to_numeric(df_optimized[col], downcast='float')
            
            # Optimize string columns
            elif col_type == 'object':
                try:
                    # Try to convert to category if it has limited unique values
                    if df_optimized[col].nunique() / len(df_optimized) < 0.5:
                        df_optimized[col] = df_optimized[col].astype('category')
                except:
                    pass
        
        return df_optimized
    
    @staticmethod
    def create_column_mapping(df: pd.DataFrame) -> Dict[str, str]:
        """
        Create intelligent column mapping for retail data
        """
        mapping = {}
        df_columns_lower = [col.lower() for col in df.columns]
        
        # Standard retail column patterns
        patterns = {
            'customer_id': ['customer', 'cust', 'client'],
            'product_id': ['product', 'item', 'sku'],
            'transaction_date': ['date', 'time', 'trans'],
            'quantity': ['qty', 'quantity', 'units'],
            'price': ['price', 'cost', 'amount'],
            'revenue': ['revenue', 'sales', 'total'],
            'category': ['category', 'type', 'class'],
            'supplier': ['supplier', 'vendor', 'provider']
        }
        
        for standard_name, patterns_list in patterns.items():
            for col in df.columns:
                if any(pattern in col.lower() for pattern in patterns_list):
                    mapping[standard_name] = col
                    break
        
        return mapping

class PerformanceMonitor:
    """
    Monitor performance of retail operations
    """
    
    def __init__(self):
        self.metrics = {}
    
    def start_timer(self, operation: str) -> str:
        """Start timing an operation"""
        timer_id = f"{operation}_{int(time.time() * 1000)}"
        self.metrics[timer_id] = {'start': time.time(), 'operation': operation}
        return timer_id
    
    def end_timer(self, timer_id: str) -> float:
        """End timing and return duration"""
        if timer_id in self.metrics:
            duration = time.time() - self.metrics[timer_id]['start']
            self.metrics[timer_id]['duration'] = duration
            
            operation = self.metrics[timer_id]['operation']
            logger.info(f"Operation '{operation}' completed in {duration:.3f}s")
            
            return duration
        return 0.0
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        operations = {}
        
        for timer_id, data in self.metrics.items():
            if 'duration' in data:
                operation = data['operation']
                if operation not in operations:
                    operations[operation] = {'count': 0, 'total_time': 0, 'avg_time': 0}
                
                operations[operation]['count'] += 1
                operations[operation]['total_time'] += data['duration']
                operations[operation]['avg_time'] = operations[operation]['total_time'] / operations[operation]['count']
        
        return {
            'operations': operations,
            'cache_stats': {
                'cached_items': len(retail_cache.cache),
                'cache_size_mb': sum(len(str(v)) for v in retail_cache.cache.values()) / 1024 / 1024
            }
        }

# Global performance monitor
performance_monitor = PerformanceMonitor()

def monitor_performance(operation_name: str = None):
    """
    Decorator to monitor operation performance
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            op_name = operation_name or func.__name__
            timer_id = performance_monitor.start_timer(op_name)
            
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                performance_monitor.end_timer(timer_id)
        
        return wrapper
    return decorator

# Utility functions for optimization

def optimize_retail_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply all optimizations to a retail DataFrame
    """
    optimizer = DataFrameOptimizer()
    
    # Optimize data types
    df_optimized = optimizer.optimize_dtypes(df)
    
    # Create standardized column mapping
    column_mapping = optimizer.create_column_mapping(df_optimized)
    
    # Add metadata
    df_optimized.attrs['column_mapping'] = column_mapping
    df_optimized.attrs['optimization_timestamp'] = datetime.now().isoformat()
    
    logger.info(f"DataFrame optimized: {df.memory_usage(deep=True).sum()} -> {df_optimized.memory_usage(deep=True).sum()} bytes")
    
    return df_optimized

def clear_retail_cache():
    """Clear all retail caches"""
    retail_cache.clear()

def get_performance_report() -> Dict[str, Any]:
    """Get comprehensive performance report"""
    return performance_monitor.get_performance_summary()
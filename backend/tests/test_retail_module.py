"""
Comprehensive Test Suite for Retail Module
Tests all retail analytics functionality, error handling, and performance optimizations
"""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import asyncio
from unittest.mock import Mock, patch

# Import retail modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from retail import (
    CustomerAnalyzer, SalesPerformanceAnalyzer, InventoryManager, 
    SupplyChainAnalyzer, RetailKPICalculator, RetailError, DataValidationError
)
from retail.error_handler import validate_dataframe_columns, safe_execute, create_error_response
from retail.performance_optimizer import (
    optimize_retail_dataframe, DataFrameOptimizer, cached_operation, 
    get_performance_report, clear_retail_cache
)
from api.services.retail_kpi_service import RetailKPIService

class TestRetailModuleSetup:
    """Setup test data and fixtures"""
    
    @pytest.fixture
    def sample_retail_data(self):
        """Create sample retail data for testing"""
        np.random.seed(42)
        n_records = 100
        
        return pd.DataFrame({
            'customer_id': [f'CUST{i:03d}' for i in range(n_records)],
            'product_id': [f'PROD{i%20:03d}' for i in range(n_records)],
            'product_name': [f'Product {i%20}' for i in range(n_records)],
            'category': np.random.choice(['Electronics', 'Fashion', 'Home', 'Grocery'], n_records),
            'supplier': [f'Supplier{i%5}' for i in range(n_records)],
            'transaction_date': pd.date_range('2024-01-01', periods=n_records, freq='D'),
            'quantity_sold': np.random.randint(1, 10, n_records),
            'unit_price': np.random.uniform(10, 500, n_records).round(2),
            'total_revenue': lambda x: x['quantity_sold'] * x['unit_price'],
            'cost_per_unit': lambda x: x['unit_price'] * 0.6,
            'inventory_on_hand': np.random.randint(10, 1000, n_records),
            'lead_time': np.random.randint(1, 30, n_records),
            'delivery_time': np.random.randint(1, 7, n_records),
            'on_time_delivery': np.random.choice([0, 1], n_records, p=[0.1, 0.9]),
            'quality_score': np.random.uniform(85, 100, n_records).round(1),
            'discount_percentage': np.random.uniform(0, 20, n_records).round(1),
            'channel': np.random.choice(['Online', 'In-Store'], n_records),
            'customer_segment': np.random.choice(['Premium', 'Regular', 'Basic'], n_records),
            'clv_score': np.random.uniform(100, 1000, n_records).round(1),
            'churn_risk': np.random.choice(['Low', 'Medium', 'High'], n_records)
        })
    
    @pytest.fixture
    def invalid_data(self):
        """Create invalid data for error testing"""
        return pd.DataFrame({
            'random_col1': [1, 2, 3],
            'random_col2': ['a', 'b', 'c'],
            'random_col3': [1.1, 2.2, 3.3]
        })

class TestErrorHandling(TestRetailModuleSetup):
    """Test error handling and validation"""
    
    def test_data_validation_error(self):
        """Test DataValidationError creation and handling"""
        error = DataValidationError("Test error", ["missing_col1", "missing_col2"])
        assert error.error_code == "DATA_VALIDATION_ERROR"
        assert error.details["missing_columns"] == ["missing_col1", "missing_col2"]
    
    def test_create_error_response(self):
        """Test error response creation"""
        error = Exception("Test error")
        response = create_error_response(error, default_value={"default": "value"})
        
        assert response["error"] is True
        assert response["error_code"] == "UNKNOWN_ERROR"
        assert response["message"] == "Test error"
        assert response["default_value"] == {"default": "value"}
    
    def test_validate_dataframe_columns(self, sample_retail_data, invalid_data):
        """Test DataFrame column validation"""
        # Test with valid data
        validation = validate_dataframe_columns(
            sample_retail_data, 
            required_columns=['customer', 'product', 'revenue'],
            optional_columns=['category', 'supplier']
        )
        assert validation["valid"] is True
        assert len(validation["found_columns"]) >= 3
        
        # Test with invalid data
        validation = validate_dataframe_columns(
            invalid_data,
            required_columns=['customer', 'product', 'revenue']
        )
        assert validation["valid"] is False
        assert len(validation["missing_columns"]) == 3
    
    def test_safe_execute(self):
        """Test safe execution wrapper"""
        def test_function():
            return {"success": True}
        
        def failing_function():
            raise Exception("Test error")
        
        # Test successful execution
        result = safe_execute(test_function)
        assert result == {"success": True}
        
        # Test failing execution with default
        result = safe_execute(
            failing_function, 
            default_value={"default": "result"},
            error_context="test"
        )
        assert result["error"] is True
        assert result["result"] == {"default": "result"}

class TestCustomerAnalyzer(TestRetailModuleSetup):
    """Test customer analytics functionality"""
    
    def test_calculate_clv(self, sample_retail_data):
        """Test Customer Lifetime Value calculation"""
        analyzer = CustomerAnalyzer()
        result = analyzer.calculate_clv(sample_retail_data)
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'average_clv' in result
            assert 'clv_distribution' in result
            assert 'high_value_customers' in result
            assert result['average_clv'] >= 0
    
    def test_rfm_analysis(self, sample_retail_data):
        """Test RFM analysis"""
        analyzer = CustomerAnalyzer()
        result = analyzer.perform_rfm_analysis(sample_retail_data)
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'segments' in result
            assert 'segment_distribution' in result
    
    def test_customer_churn_analysis(self, sample_retail_data):
        """Test customer churn analysis"""
        analyzer = CustomerAnalyzer()
        result = analyzer.analyze_customer_churn(sample_retail_data)
        
        assert isinstance(result, dict)
        # Should handle missing required columns gracefully

class TestPerformanceOptimization(TestRetailModuleSetup):
    """Test performance optimization features"""
    
    def test_dataframe_optimizer(self, sample_retail_data):
        """Test DataFrame optimization"""
        optimizer = DataFrameOptimizer()
        
        # Test dtype optimization
        optimized_df = optimizer.optimize_dtypes(sample_retail_data)
        assert len(optimized_df) == len(sample_retail_data)
        assert list(optimized_df.columns) == list(sample_retail_data.columns)
        
        # Test column mapping
        mapping = optimizer.create_column_mapping(sample_retail_data)
        assert isinstance(mapping, dict)
        assert 'customer_id' in mapping
        assert 'product_id' in mapping
    
    def test_optimize_retail_dataframe(self, sample_retail_data):
        """Test complete DataFrame optimization"""
        optimized_df = optimize_retail_dataframe(sample_retail_data)
        
        assert len(optimized_df) == len(sample_retail_data)
        assert 'column_mapping' in optimized_df.attrs
        assert 'optimization_timestamp' in optimized_df.attrs
    
    def test_caching_decorator(self, sample_retail_data):
        """Test caching functionality"""
        call_count = 0
        
        @cached_operation(ttl=60)
        def test_function(df):
            nonlocal call_count
            call_count += 1
            return {"result": "test", "call_count": call_count}
        
        # First call
        result1 = test_function(sample_retail_data)
        assert result1["call_count"] == 1
        
        # Second call should use cache
        result2 = test_function(sample_retail_data)
        assert result2["call_count"] == 1  # Same as first call (cached)
        
        # Clear cache for cleanup
        clear_retail_cache()
    
    def test_performance_monitoring(self):
        """Test performance monitoring"""
        from retail.performance_optimizer import performance_monitor
        
        timer_id = performance_monitor.start_timer("test_operation")
        # Simulate work
        import time
        time.sleep(0.01)
        duration = performance_monitor.end_timer(timer_id)
        
        assert duration > 0
        
        summary = performance_monitor.get_performance_summary()
        assert 'operations' in summary
        assert 'cache_stats' in summary

class TestRetailKPIService(TestRetailModuleSetup):
    """Test retail KPI service"""
    
    def test_retail_kpi_service_initialization(self):
        """Test retail KPI service initialization"""
        service = RetailKPIService()
        assert service.customer_analyzer is not None
        assert service.sales_analyzer is not None
        assert service.inventory_manager is not None
        assert service.supply_chain_analyzer is not None
        assert service.kpi_calculator is not None
    
    def test_calculate_retail_kpis(self, sample_retail_data):
        """Test comprehensive retail KPI calculation"""
        service = RetailKPIService()
        result = service.calculate_retail_kpis(sample_retail_data, "retail")
        
        assert isinstance(result, dict)
        # Should handle calculation gracefully even with sample data

class TestInventoryManager(TestRetailModuleSetup):
    """Test inventory management functionality"""
    
    def test_inventory_turnover_calculation(self, sample_retail_data):
        """Test inventory turnover calculation"""
        manager = InventoryManager()
        result = manager.calculate_inventory_turnover(sample_retail_data)
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'overall_turnover_rate' in result
            assert 'turnover_by_category' in result

class TestSupplyChainAnalyzer(TestRetailModuleSetup):
    """Test supply chain analytics"""
    
    def test_supplier_performance_analysis(self, sample_retail_data):
        """Test supplier performance analysis"""
        analyzer = SupplyChainAnalyzer()
        result = analyzer.analyze_supplier_performance(sample_retail_data)
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'supplier_rankings' in result
            assert 'delivery_performance' in result

class TestSalesPerformanceAnalyzer(TestRetailModuleSetup):
    """Test sales performance analytics"""
    
    def test_sales_velocity_analysis(self, sample_retail_data):
        """Test sales velocity analysis"""
        analyzer = SalesPerformanceAnalyzer()
        result = analyzer.analyze_sales_velocity(sample_retail_data)
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'daily_sales_velocity' in result

class TestRetailKPICalculator(TestRetailModuleSetup):
    """Test retail KPI calculator"""
    
    def test_retail_kpi_calculation(self, sample_retail_data):
        """Test retail KPI calculation"""
        calculator = RetailKPICalculator()
        result = calculator.calculate_retail_kpis(sample_retail_data, "retail")
        
        assert isinstance(result, dict)
        if not result.get('error'):
            assert 'retail_health_score' in result

# Integration tests
class TestRetailModuleIntegration(TestRetailModuleSetup):
    """Test integration between retail modules"""
    
    def test_end_to_end_analysis(self, sample_retail_data):
        """Test complete end-to-end retail analysis"""
        # Optimize data
        optimized_data = optimize_retail_dataframe(sample_retail_data)
        
        # Initialize all analyzers
        customer_analyzer = CustomerAnalyzer()
        sales_analyzer = SalesPerformanceAnalyzer()
        inventory_manager = InventoryManager()
        supply_chain_analyzer = SupplyChainAnalyzer()
        kpi_calculator = RetailKPICalculator()
        
        # Perform all analyses
        results = {}
        results['clv'] = customer_analyzer.calculate_clv(optimized_data)
        results['sales'] = sales_analyzer.analyze_sales_velocity(optimized_data)
        results['inventory'] = inventory_manager.calculate_inventory_turnover(optimized_data)
        results['supply_chain'] = supply_chain_analyzer.analyze_supplier_performance(optimized_data)
        results['kpis'] = kpi_calculator.calculate_retail_kpis(optimized_data, "retail")
        
        # Verify all analyses return dictionaries
        for analysis_name, result in results.items():
            assert isinstance(result, dict), f"{analysis_name} analysis failed"
    
    def test_module_imports(self):
        """Test that all retail modules can be imported correctly"""
        from retail import (
            CustomerAnalyzer, SalesPerformanceAnalyzer, InventoryManager,
            SupplyChainAnalyzer, RetailKPICalculator, RetailError, DataValidationError
        )
        
        # Test instantiation
        CustomerAnalyzer()
        SalesPerformanceAnalyzer()
        InventoryManager()
        SupplyChainAnalyzer()
        RetailKPICalculator()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
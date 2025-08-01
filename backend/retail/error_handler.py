"""
Centralized Error Handling for Retail Domain
Provides consistent error responses and logging across all retail modules
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class RetailError(Exception):
    """Base exception for retail domain errors"""
    def __init__(self, message: str, error_code: str = "RETAIL_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.now().isoformat()
        super().__init__(self.message)

class DataValidationError(RetailError):
    """Raised when data validation fails"""
    def __init__(self, message: str, missing_columns: Optional[list] = None):
        super().__init__(message, "DATA_VALIDATION_ERROR", {"missing_columns": missing_columns or []})

class CalculationError(RetailError):
    """Raised when calculation fails"""
    def __init__(self, message: str, calculation_type: str = "unknown"):
        super().__init__(message, "CALCULATION_ERROR", {"calculation_type": calculation_type})

def create_error_response(error: Exception, default_value: Any = None) -> Dict[str, Any]:
    """
    Create a standardized error response
    
    Args:
        error: The exception that occurred
        default_value: Default value to return for the main result
        
    Returns:
        Standardized error response dictionary
    """
    if isinstance(error, RetailError):
        response = {
            "error": True,
            "error_code": error.error_code,
            "message": error.message,
            "details": error.details,
            "timestamp": error.timestamp
        }
    else:
        response = {
            "error": True,
            "error_code": "UNKNOWN_ERROR",
            "message": str(error),
            "details": {"type": type(error).__name__},
            "timestamp": datetime.now().isoformat()
        }
    
    # Add default value if provided
    if default_value is not None:
        response["default_value"] = default_value
    
    # Log the error
    logger.error(f"Retail module error: {response}")
    
    return response

def safe_execute(func, *args, default_value=None, error_context="operation", **kwargs):
    """
    Safely execute a function with standardized error handling
    
    Args:
        func: Function to execute
        *args: Function arguments
        default_value: Value to return on error
        error_context: Context description for logging
        **kwargs: Function keyword arguments
        
    Returns:
        Function result or standardized error response
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Error in {error_context}: {e}")
        if default_value is not None:
            error_response = create_error_response(e, default_value)
            error_response.update({"result": default_value})
            return error_response
        else:
            return create_error_response(e)

def validate_dataframe_columns(df, required_columns: list, optional_columns: list = None) -> Dict[str, Any]:
    """
    Validate DataFrame has required columns with flexible matching
    
    Args:
        df: DataFrame to validate
        required_columns: List of required column patterns
        optional_columns: List of optional column patterns
        
    Returns:
        Validation result with found columns and missing columns
    """
    optional_columns = optional_columns or []
    df_columns_lower = [col.lower() for col in df.columns]
    
    found_columns = {}
    missing_columns = []
    
    # Check required columns
    for req_col in required_columns:
        found = False
        for df_col in df.columns:
            if any(pattern.lower() in df_col.lower() for pattern in [req_col]):
                found_columns[req_col] = df_col
                found = True
                break
        
        if not found:
            missing_columns.append(req_col)
    
    # Check optional columns
    for opt_col in optional_columns:
        for df_col in df.columns:
            if any(pattern.lower() in df_col.lower() for pattern in [opt_col]):
                found_columns[opt_col] = df_col
                break
    
    return {
        "valid": len(missing_columns) == 0,
        "found_columns": found_columns,
        "missing_columns": missing_columns,
        "total_columns": len(df.columns),
        "matched_columns": len(found_columns)
    }
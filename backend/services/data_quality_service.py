"""
Data Quality Service for Sygnify Financial Analytics Platform
Handles CSV parsing, data validation, file hash caching, and smart column labeling
"""

import hashlib
import json
import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timedelta
import os
from pathlib import Path
import re
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataType(Enum):
    """Data type enumeration for column classification"""
    NUMERIC = "numeric"
    DATE = "date"
    TEXT = "text"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    BOOLEAN = "boolean"
    ID = "id"
    EMAIL = "email"
    PHONE = "phone"
    UNKNOWN = "unknown"

@dataclass
class ColumnInfo:
    """Column information and metadata"""
    name: str
    data_type: DataType
    sample_values: List[str]
    null_count: int
    unique_count: int
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    std_value: Optional[float] = None
    format_pattern: Optional[str] = None
    confidence_score: float = 0.0

@dataclass
class ValidationResult:
    """Data validation result"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    column_info: Dict[str, ColumnInfo]
    data_quality_score: float
    recommendations: List[str]

class DataQualityService:
    """
    Data Quality Service for financial data validation and processing
    """
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Financial column patterns
        self.financial_patterns = {
            "revenue": [
                r"revenue", r"sales", r"income", r"earnings", r"gross.*revenue",
                r"total.*revenue", r"net.*revenue", r"operating.*revenue"
            ],
            "expenses": [
                r"expense", r"cost", r"expenditure", r"outlay", r"spending",
                r"operating.*expense", r"cost.*of.*goods", r"cogs"
            ],
            "profit": [
                r"profit", r"margin", r"earnings", r"net.*income", r"operating.*income",
                r"gross.*profit", r"net.*profit", r"ebitda", r"ebit"
            ],
            "assets": [
                r"asset", r"inventory", r"cash", r"receivable", r"equipment",
                r"property", r"investment", r"current.*asset", r"fixed.*asset"
            ],
            "liabilities": [
                r"liability", r"debt", r"payable", r"loan", r"credit",
                r"current.*liability", r"long.*term.*debt", r"accounts.*payable"
            ],
            "equity": [
                r"equity", r"capital", r"shareholder", r"stock", r"retained.*earnings",
                r"common.*stock", r"preferred.*stock", r"paid.*in.*capital"
            ],
            "cash_flow": [
                r"cash.*flow", r"operating.*cash", r"investing.*cash", r"financing.*cash",
                r"net.*cash", r"cash.*from.*operations"
            ],
            "ratios": [
                r"ratio", r"return.*on.*equity", r"roe", r"return.*on.*assets", r"roa",
                r"debt.*to.*equity", r"current.*ratio", r"quick.*ratio"
            ]
        }
        
        # Data type detection patterns
        self.type_patterns = {
            DataType.DATE: [
                r"\d{4}-\d{2}-\d{2}", r"\d{2}/\d{2}/\d{4}", r"\d{2}-\d{2}-\d{4}",
                r"\d{4}/\d{2}/\d{2}", r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b"
            ],
            DataType.CURRENCY: [
                r"^\$[\d,]+\.?\d*$", r"^[\d,]+\.?\d*\s*\$", r"^\$[\d,]+\.?\d*\s*[A-Z]{3}$"
            ],
            DataType.PERCENTAGE: [
                r"^\d+\.?\d*%$", r"^\d+\.?\d*\s*percent$", r"^\d+\.?\d*\s*%$"
            ],
            DataType.EMAIL: [
                r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            ],
            DataType.PHONE: [
                r"^\+?[\d\s\-\(\)]+$", r"^\d{3}-\d{3}-\d{4}$", r"^\(\d{3}\)\s*\d{3}-\d{4}$"
            ],
            DataType.BOOLEAN: [
                r"^(true|false|yes|no|1|0|t|f|y|n)$"
            ]
        }

    def validate_csv_file(self, file_path: str, file_hash: str = None) -> ValidationResult:
        """
        Validate CSV file and return comprehensive validation result
        """
        try:
            # Check if we have cached validation result
            if file_hash and self._get_cached_validation(file_hash):
                return self._get_cached_validation(file_hash)
            
            # Read CSV file
            df = self._read_csv_safely(file_path)
            if df is None:
                return ValidationResult(
                    is_valid=False,
                    errors=["Failed to read CSV file"],
                    warnings=[],
                    column_info={},
                    data_quality_score=0.0,
                    recommendations=["Check file format and encoding"]
                )
            
            # Analyze columns
            column_info = self._analyze_columns(df)
            
            # Validate data quality
            errors, warnings = self._validate_data_quality(df, column_info)
            
            # Calculate quality score
            quality_score = self._calculate_quality_score(df, column_info, errors)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(df, column_info, errors, warnings)
            
            # Create validation result
            result = ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                column_info=column_info,
                data_quality_score=quality_score,
                recommendations=recommendations
            )
            
            # Cache result if file hash provided
            if file_hash:
                self._cache_validation_result(file_hash, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error validating CSV file: {e}")
            return ValidationResult(
                is_valid=False,
                errors=[f"Validation error: {str(e)}"],
                warnings=[],
                column_info={},
                data_quality_score=0.0,
                recommendations=["Check file format and try again"]
            )

    def _read_csv_safely(self, file_path: str) -> Optional[pd.DataFrame]:
        """
        Safely read CSV file with multiple encoding attempts
        """
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                logger.info(f"Successfully read CSV with {encoding} encoding")
                return df
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logger.warning(f"Error reading CSV with {encoding}: {e}")
                continue
        
        logger.error("Failed to read CSV with any encoding")
        return None

    def _analyze_columns(self, df: pd.DataFrame) -> Dict[str, ColumnInfo]:
        """
        Analyze columns and determine their types and characteristics
        """
        column_info = {}
        
        for column in df.columns:
            # Get sample values
            sample_values = df[column].dropna().head(10).astype(str).tolist()
            
            # Determine data type
            data_type = self._detect_data_type(df[column])
            
            # Calculate statistics
            null_count = df[column].isnull().sum()
            unique_count = df[column].nunique()
            
            # Numeric statistics
            min_value = max_value = mean_value = std_value = None
            if data_type in [DataType.NUMERIC, DataType.CURRENCY, DataType.PERCENTAGE]:
                numeric_series = pd.to_numeric(df[column], errors='coerce')
                if not numeric_series.isna().all():
                    min_value = float(numeric_series.min())
                    max_value = float(numeric_series.max())
                    mean_value = float(numeric_series.mean())
                    std_value = float(numeric_series.std())
            
            # Detect format pattern
            format_pattern = self._detect_format_pattern(df[column])
            
            # Calculate confidence score
            confidence_score = self._calculate_column_confidence(df[column], data_type)
            
            # Smart labeling for financial data
            smart_label = self._smart_label_column(column, sample_values)
            
            column_info[column] = ColumnInfo(
                name=column,
                data_type=data_type,
                sample_values=sample_values,
                null_count=null_count,
                unique_count=unique_count,
                min_value=min_value,
                max_value=max_value,
                mean_value=mean_value,
                std_value=std_value,
                format_pattern=format_pattern,
                confidence_score=confidence_score
            )
        
        return column_info

    def _detect_data_type(self, series: pd.Series) -> DataType:
        """
        Detect the data type of a column
        """
        # Convert to string for pattern matching
        str_series = series.astype(str)
        
        # Check for boolean
        if self._matches_patterns(str_series, self.type_patterns[DataType.BOOLEAN]):
            return DataType.BOOLEAN
        
        # Check for email
        if self._matches_patterns(str_series, self.type_patterns[DataType.EMAIL]):
            return DataType.EMAIL
        
        # Check for phone
        if self._matches_patterns(str_series, self.type_patterns[DataType.PHONE]):
            return DataType.PHONE
        
        # Check for date
        if self._matches_patterns(str_series, self.type_patterns[DataType.DATE]):
            return DataType.DATE
        
        # Check for currency
        if self._matches_patterns(str_series, self.type_patterns[DataType.CURRENCY]):
            return DataType.CURRENCY
        
        # Check for percentage
        if self._matches_patterns(str_series, self.type_patterns[DataType.PERCENTAGE]):
            return DataType.PERCENTAGE
        
        # Check for numeric
        try:
            pd.to_numeric(series, errors='raise')
            return DataType.NUMERIC
        except (ValueError, TypeError):
            pass
        
        # Check for ID (high unique ratio)
        if series.nunique() / len(series) > 0.9:
            return DataType.ID
        
        return DataType.TEXT

    def _matches_patterns(self, series: pd.Series, patterns: List[str]) -> bool:
        """
        Check if series matches any of the given patterns
        """
        sample_size = min(100, len(series))
        sample = series.sample(n=sample_size, random_state=42)
        
        for pattern in patterns:
            matches = sample.str.contains(pattern, case=False, regex=True)
            if matches.sum() / len(sample) > 0.5:  # More than 50% match
                return True
        
        return False

    def _detect_format_pattern(self, series: pd.Series) -> Optional[str]:
        """
        Detect format pattern for the column
        """
        sample = series.dropna().head(10).astype(str)
        
        if len(sample) == 0:
            return None
        
        # Check for consistent patterns
        patterns = []
        for value in sample:
            if pd.isna(value):
                continue
            
            # Replace digits with #, letters with A, special chars with *
            pattern = re.sub(r'\d', '#', value)
            pattern = re.sub(r'[a-zA-Z]', 'A', pattern)
            patterns.append(pattern)
        
        if len(set(patterns)) == 1:
            return patterns[0]
        
        return None

    def _calculate_column_confidence(self, series: pd.Series, data_type: DataType) -> float:
        """
        Calculate confidence score for column type detection
        """
        if len(series) == 0:
            return 0.0
        
        # Base confidence
        confidence = 0.5
        
        # Null ratio penalty
        null_ratio = series.isnull().sum() / len(series)
        confidence -= null_ratio * 0.3
        
        # Consistency bonus
        if data_type == DataType.NUMERIC:
            try:
                pd.to_numeric(series, errors='raise')
                confidence += 0.3
            except:
                confidence -= 0.2
        
        # Pattern consistency
        if self._detect_format_pattern(series):
            confidence += 0.2
        
        return max(0.0, min(1.0, confidence))

    def _smart_label_column(self, column_name: str, sample_values: List[str]) -> str:
        """
        Apply smart labeling to financial columns
        """
        column_lower = column_name.lower()
        
        # Check against financial patterns
        for category, patterns in self.financial_patterns.items():
            for pattern in patterns:
                if re.search(pattern, column_lower):
                    return category
        
        # Check sample values for patterns
        sample_text = ' '.join(sample_values).lower()
        for category, patterns in self.financial_patterns.items():
            for pattern in patterns:
                if re.search(pattern, sample_text):
                    return category
        
        return "unknown"

    def _validate_data_quality(self, df: pd.DataFrame, column_info: Dict[str, ColumnInfo]) -> Tuple[List[str], List[str]]:
        """
        Validate data quality and return errors and warnings
        """
        errors = []
        warnings = []
        
        # Check for empty dataframe
        if df.empty:
            errors.append("DataFrame is empty")
            return errors, warnings
        
        # Check for too many null values
        for column, info in column_info.items():
            null_ratio = info.null_count / len(df)
            if null_ratio > 0.5:
                errors.append(f"Column '{column}' has more than 50% null values")
            elif null_ratio > 0.2:
                warnings.append(f"Column '{column}' has more than 20% null values")
        
        # Check for duplicate rows
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            warnings.append(f"Found {duplicate_count} duplicate rows")
        
        # Check for data type consistency
        for column, info in column_info.items():
            if info.data_type == DataType.NUMERIC:
                # Check for non-numeric values in numeric columns
                non_numeric = pd.to_numeric(df[column], errors='coerce').isna().sum()
                if non_numeric > 0:
                    warnings.append(f"Column '{column}' contains {non_numeric} non-numeric values")
        
        # Check for outliers in numeric columns
        for column, info in column_info.items():
            if info.data_type in [DataType.NUMERIC, DataType.CURRENCY]:
                numeric_series = pd.to_numeric(df[column], errors='coerce')
                if not numeric_series.isna().all():
                    Q1 = numeric_series.quantile(0.25)
                    Q3 = numeric_series.quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = ((numeric_series < (Q1 - 1.5 * IQR)) | (numeric_series > (Q3 + 1.5 * IQR))).sum()
                    if outliers > 0:
                        warnings.append(f"Column '{column}' contains {outliers} potential outliers")
        
        return errors, warnings

    def _calculate_quality_score(self, df: pd.DataFrame, column_info: Dict[str, ColumnInfo], errors: List[str]) -> float:
        """
        Calculate overall data quality score
        """
        if df.empty:
            return 0.0
        
        # Base score
        score = 1.0
        
        # Penalty for errors
        score -= len(errors) * 0.1
        
        # Penalty for null values
        total_null_ratio = sum(info.null_count for info in column_info.values()) / (len(df) * len(column_info))
        score -= total_null_ratio * 0.3
        
        # Bonus for data type consistency
        consistent_types = sum(1 for info in column_info.values() if info.confidence_score > 0.8)
        score += (consistent_types / len(column_info)) * 0.2
        
        # Bonus for financial data detection
        financial_columns = sum(1 for info in column_info.values() if info.name in self.financial_patterns)
        if financial_columns > 0:
            score += 0.1
        
        return max(0.0, min(1.0, score))

    def _generate_recommendations(self, df: pd.DataFrame, column_info: Dict[str, ColumnInfo], errors: List[str], warnings: List[str]) -> List[str]:
        """
        Generate recommendations for data improvement
        """
        recommendations = []
        
        # Handle null values
        high_null_columns = [col for col, info in column_info.items() if info.null_count / len(df) > 0.2]
        if high_null_columns:
            recommendations.append(f"Consider imputing or removing columns with high null values: {', '.join(high_null_columns)}")
        
        # Handle data type issues
        low_confidence_columns = [col for col, info in column_info.items() if info.confidence_score < 0.5]
        if low_confidence_columns:
            recommendations.append(f"Review data types for columns: {', '.join(low_confidence_columns)}")
        
        # Handle outliers
        numeric_columns = [col for col, info in column_info.items() if info.data_type in [DataType.NUMERIC, DataType.CURRENCY]]
        if numeric_columns:
            recommendations.append("Consider outlier detection and treatment for numeric columns")
        
        # Handle duplicates
        if df.duplicated().sum() > 0:
            recommendations.append("Remove duplicate rows to improve data quality")
        
        # Financial data specific recommendations
        financial_columns = [col for col, info in column_info.items() if info.name in self.financial_patterns]
        if financial_columns:
            recommendations.append("Apply financial data validation rules")
            recommendations.append("Consider currency normalization for financial columns")
        
        return recommendations

    def _get_cached_validation(self, file_hash: str) -> Optional[ValidationResult]:
        """
        Get cached validation result
        """
        cache_file = self.cache_dir / f"{file_hash}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                    # Reconstruct ValidationResult from cached data
                    # This is a simplified version - in production you'd want proper serialization
                    return None  # For now, return None to force re-validation
            except Exception as e:
                logger.warning(f"Error reading cached validation: {e}")
        return None

    def _cache_validation_result(self, file_hash: str, result: ValidationResult):
        """
        Cache validation result
        """
        cache_file = self.cache_dir / f"{file_hash}.json"
        try:
            # Convert ValidationResult to serializable format
            cache_data = {
                "is_valid": result.is_valid,
                "errors": result.errors,
                "warnings": result.warnings,
                "data_quality_score": result.data_quality_score,
                "recommendations": result.recommendations,
                "timestamp": datetime.now().isoformat()
            }
            
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Error caching validation result: {e}")

    def calculate_file_hash(self, file_path: str) -> str:
        """
        Calculate SHA-256 hash of file
        """
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

# Create singleton instance
data_quality_service = DataQualityService() 
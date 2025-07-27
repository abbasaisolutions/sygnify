#!/usr/bin/env python3
"""
Parquet File Parser for Sygnify Analytics Hub
Supports reading and converting Parquet files to JSON format
"""

import sys
import json
import argparse
import pandas as pd
import pyarrow.parquet as pq
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParquetParser:
    """Parser for Parquet files with data validation and conversion"""
    
    def __init__(self):
        self.supported_types = ['int64', 'float64', 'string', 'bool', 'datetime64[ns]']
    
    def parse_parquet_file(self, file_path: str, options: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Parse a Parquet file and return data as list of dictionaries
        
        Args:
            file_path: Path to the Parquet file
            options: Additional parsing options
            
        Returns:
            List of dictionaries representing the data
        """
        try:
            logger.info(f"Parsing Parquet file: {file_path}")
            
            # Read Parquet file
            if options and options.get('use_pyarrow', False):
                # Use PyArrow for better performance
                table = pq.read_table(file_path)
                df = table.to_pandas()
            else:
                # Use pandas for compatibility
                df = pd.read_parquet(file_path)
            
            logger.info(f"Successfully read {len(df)} rows and {len(df.columns)} columns")
            
            # Validate data
            self._validate_dataframe(df)
            
            # Convert to list of dictionaries
            records = self._convert_to_records(df, options)
            
            # Apply any transformations
            if options and options.get('transform'):
                records = self._apply_transformations(records, options['transform'])
            
            logger.info(f"Successfully converted {len(records)} records")
            return records
            
        except Exception as e:
            logger.error(f"Error parsing Parquet file: {str(e)}")
            raise
    
    def _validate_dataframe(self, df: pd.DataFrame) -> None:
        """Validate the DataFrame structure and data types"""
        if df.empty:
            raise ValueError("Parquet file contains no data")
        
        # Check for required columns (financial data typically needs amount and date)
        required_columns = ['amount', 'transaction_date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            logger.warning(f"Missing recommended columns: {missing_columns}")
        
        # Check data types
        for column, dtype in df.dtypes.items():
            if str(dtype) not in self.supported_types:
                logger.warning(f"Column {column} has unsupported dtype: {dtype}")
    
    def _convert_to_records(self, df: pd.DataFrame, options: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Convert DataFrame to list of dictionaries with proper type conversion"""
        records = []
        
        for index, row in df.iterrows():
            record = {}
            
            for column, value in row.items():
                # Handle different data types
                if pd.isna(value):
                    record[column] = None
                elif pd.api.types.is_datetime64_any_dtype(df[column]):
                    # Convert datetime to ISO string
                    record[column] = value.isoformat() if hasattr(value, 'isoformat') else str(value)
                elif pd.api.types.is_numeric_dtype(df[column]):
                    # Convert numeric types
                    record[column] = float(value) if pd.api.types.is_float_dtype(df[column]) else int(value)
                elif pd.api.types.is_bool_dtype(df[column]):
                    # Convert boolean
                    record[column] = bool(value)
                else:
                    # Convert to string
                    record[column] = str(value)
            
            records.append(record)
        
        return records
    
    def _apply_transformations(self, records: List[Dict[str, Any]], transformations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply data transformations"""
        for transform in transformations:
            transform_type = transform.get('type')
            
            if transform_type == 'rename':
                # Rename columns
                from_col = transform.get('from')
                to_col = transform.get('to')
                if from_col and to_col:
                    for record in records:
                        if from_col in record:
                            record[to_col] = record.pop(from_col)
            
            elif transform_type == 'convert':
                # Convert data types
                field = transform.get('field')
                target_type = transform.get('target_type')
                if field and target_type:
                    for record in records:
                        if field in record and record[field] is not None:
                            record[field] = self._convert_value(record[field], target_type)
            
            elif transform_type == 'filter':
                # Filter records
                field = transform.get('field')
                operator = transform.get('operator')
                value = transform.get('value')
                if field and operator and value is not None:
                    records = self._filter_records(records, field, operator, value)
        
        return records
    
    def _convert_value(self, value: Any, target_type: str) -> Any:
        """Convert value to target type"""
        try:
            if target_type == 'string':
                return str(value)
            elif target_type == 'number':
                return float(value)
            elif target_type == 'integer':
                return int(value)
            elif target_type == 'boolean':
                return bool(value)
            elif target_type == 'date':
                if isinstance(value, str):
                    return value.split('T')[0]  # Extract date part
                return str(value)
            else:
                return value
        except (ValueError, TypeError):
            return value
    
    def _filter_records(self, records: List[Dict[str, Any]], field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        """Filter records based on conditions"""
        filtered_records = []
        
        for record in records:
            if field not in record:
                continue
            
            record_value = record[field]
            
            # Apply filter
            include = False
            if operator == 'equals':
                include = record_value == value
            elif operator == 'not_equals':
                include = record_value != value
            elif operator == 'greater_than':
                include = record_value > value
            elif operator == 'less_than':
                include = record_value < value
            elif operator == 'contains':
                include = str(value) in str(record_value)
            elif operator == 'is_null':
                include = record_value is None
            elif operator == 'is_not_null':
                include = record_value is not None
            
            if include:
                filtered_records.append(record)
        
        return filtered_records
    
    def get_schema_info(self, file_path: str) -> Dict[str, Any]:
        """Get schema information from Parquet file"""
        try:
            # Read schema without loading all data
            parquet_file = pq.ParquetFile(file_path)
            schema = parquet_file.schema
            
            schema_info = {
                'columns': [],
                'total_rows': parquet_file.metadata.num_rows,
                'file_size': parquet_file.metadata.serialized_size,
                'created_by': parquet_file.metadata.created_by
            }
            
            for field in schema:
                schema_info['columns'].append({
                    'name': field.name,
                    'type': str(field.type),
                    'nullable': field.nullable
                })
            
            return schema_info
            
        except Exception as e:
            logger.error(f"Error reading schema: {str(e)}")
            raise

def main():
    """Main function for command-line usage"""
    parser = argparse.ArgumentParser(description='Parse Parquet files for Sygnify Analytics Hub')
    parser.add_argument('file_path', help='Path to the Parquet file')
    parser.add_argument('--use-pyarrow', action='store_true', help='Use PyArrow for reading')
    parser.add_argument('--schema-only', action='store_true', help='Only return schema information')
    parser.add_argument('--transform', type=str, help='JSON string of transformations to apply')
    parser.add_argument('--output', type=str, help='Output file path (optional)')
    
    args = parser.parse_args()
    
    try:
        parquet_parser = ParquetParser()
        
        if args.schema_only:
            # Return schema information only
            schema_info = parquet_parser.get_schema_info(args.file_path)
            result = {
                'success': True,
                'schema': schema_info,
                'type': 'schema'
            }
        else:
            # Parse the file
            options = {
                'use_pyarrow': args.use_pyarrow
            }
            
            if args.transform:
                try:
                    options['transform'] = json.loads(args.transform)
                except json.JSONDecodeError:
                    logger.error("Invalid JSON in transform argument")
                    sys.exit(1)
            
            records = parquet_parser.parse_parquet_file(args.file_path, options)
            
            result = {
                'success': True,
                'data': records,
                'metadata': {
                    'record_count': len(records),
                    'columns': list(records[0].keys()) if records else [],
                    'file_path': args.file_path
                }
            }
        
        # Output result
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
        else:
            # Output to stdout for Node.js to capture
            print(json.dumps(result))
        
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'file_path': args.file_path
        }
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(error_result, f, indent=2)
        else:
            print(json.dumps(error_result))
        
        sys.exit(1)

if __name__ == '__main__':
    main() 
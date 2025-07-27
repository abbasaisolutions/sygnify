"""
Labeling Utility Module
- Smart column labeling
- Enhanced labels with confidence scores
"""
from typing import Dict, Any
import pandas as pd

class LabelingUtility:
    """
    Provides smart and enhanced labeling for DataFrame columns.
    """
    @staticmethod
    def generate_smart_labels(df: pd.DataFrame) -> Dict[str, str]:
        """
        Generate smart column labels based on content analysis.
        """
        labels = {}
        for col in df.columns:
            sample_values = df[col].dropna().head(10).astype(str)
            if any('amount' in col.lower() or 'price' in col.lower() or 'cost' in col.lower() for col in [col]):
                labels[col] = 'Financial Amount'
            elif any('date' in col.lower() or 'time' in col.lower() for col in [col]):
                labels[col] = 'Date/Time'
            elif df[col].dtype in ['int64', 'float64']:
                labels[col] = 'Numeric Metric'
            else:
                labels[col] = 'Categorical Data'
        return labels

    @staticmethod
    def generate_enhanced_labels(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate enhanced labels with confidence scores.
        """
        enhanced_labels = {}
        for col in df.columns:
            confidence = 0.8
            if df[col].dtype in ['int64', 'float64']:
                confidence += 0.1
            if df[col].notna().sum() / len(df) > 0.9:
                confidence += 0.1
            enhanced_labels[col] = {
                'label': LabelingUtility.generate_smart_labels(df).get(col, 'Unknown'),
                'confidence': min(confidence, 1.0),
                'data_type': str(df[col].dtype),
                'unique_values': df[col].nunique(),
                'missing_percentage': (df[col].isna().sum() / len(df)) * 100
            }
        return enhanced_labels 
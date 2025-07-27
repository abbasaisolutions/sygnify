"""
Recommendations Utility Module
- Generate actionable recommendations
- Prioritize recommendations
"""
from typing import List, Dict, Any
import pandas as pd

class RecommendationsUtility:
    """
    Provides recommendation generation and prioritization for financial analytics.
    """
    @staticmethod
    def generate_smart_recommendations(df: pd.DataFrame, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Generate SMART recommendations based on DataFrame and context.
        """
        recommendations = []
        missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        if missing_percentage > 10:
            recommendations.append({
                "recommendation": "Clean data",
                "specific": True,
                "measurable": True,
                "achievable": True,
                "relevant": True,
                "time_bound": True,
                "dependencies": [],
                "priority": 1
            })
        # Add more rules as needed
        return RecommendationsUtility.prioritize(recommendations)

    @staticmethod
    def prioritize(recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(recommendations, key=lambda x: x.get("priority", 100)) 
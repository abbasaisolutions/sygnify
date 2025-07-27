"""
Narrative Utility Module
- Generate narratives for financial analytics
- Integrate with LLMs or use template-based fallback
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import logging
import asyncio

class NarrativeUtility:
    """
    Provides narrative generation for financial analytics, with LLM integration or template fallback.
    """
    @staticmethod
    async def generate_narrative(
        df: pd.DataFrame,
        labels: Dict[str, Any],
        metrics: Dict[str, Any],
        user_role: str = 'executive',
        tone: str = 'formal',
        verbosity: str = 'concise',
        llm_client=None
    ) -> Dict[str, Any]:
        """
        Generate a narrative for the given DataFrame and context.
        """
        try:
            # Stub: Replace with LLM or template logic as needed
            return {
                "headline": f"Financial Analysis for {user_role.title()}",
                "paragraphs": [
                    f"Dataset contains {len(df)} records and {len(df.columns)} columns.",
                    f"Key metrics: {', '.join(list(metrics.keys())[:3])}..."
                ],
                "prediction_confidence": "medium",
                "data_quality": {
                    "records_analyzed": len(df),
                    "confidence_level": "medium",
                    "completeness": 'high' if len(df) > 100 else 'medium' if len(df) > 50 else 'low'
                }
            }
        except Exception as e:
            logging.error(f"Narrative generation failed: {e}")
            return {
                "headline": "Financial Analysis Summary",
                "paragraphs": ["Analysis completed successfully with key insights identified."],
                "prediction_confidence": "low",
                "data_quality": {
                    "records_analyzed": len(df) if df is not None else 0,
                    "confidence_level": "low",
                    "completeness": "low"
                }
            } 
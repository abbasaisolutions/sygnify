"""
LLM Service for Sygnify Financial Analytics Platform
Handles AI-powered analysis, narrative generation, and intelligent insights
"""

import asyncio
import json
import logging
import aiohttp
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    """
    LLM Service for AI-powered financial analysis and insights
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model_name = "llama3.2:3b-q4_0"
        self.session = None
        self.is_connected = False
        self.model_loaded = False
        self.max_retries = 3
        self.timeout = 30
        
        # Financial analysis prompts
        self.financial_prompts = {
            "revenue_analysis": """
            Analyze the following financial data and provide insights about revenue trends:
            
            Data: {data}
            
            Please provide:
            1. Revenue trend analysis
            2. Key growth drivers
            3. Risk factors
            4. Recommendations
            5. Future projections
            """,
            
            "expense_analysis": """
            Analyze the following expense data and provide cost optimization insights:
            
            Data: {data}
            
            Please provide:
            1. Expense trend analysis
            2. Cost drivers identification
            3. Optimization opportunities
            4. Budget recommendations
            5. Efficiency metrics
            """,
            
            "profitability_analysis": """
            Analyze the following profitability metrics and provide business insights:
            
            Data: {data}
            
            Please provide:
            1. Profitability trends
            2. Margin analysis
            3. Performance drivers
            4. Improvement opportunities
            5. Strategic recommendations
            """,
            
            "risk_assessment": """
            Analyze the following financial data for risk assessment:
            
            Data: {data}
            
            Please provide:
            1. Risk identification
            2. Risk severity levels
            3. Mitigation strategies
            4. Monitoring recommendations
            5. Compliance considerations
            """,
            
            "market_analysis": """
            Analyze the following market data and provide investment insights:
            
            Data: {data}
            
            Please provide:
            1. Market trends
            2. Investment opportunities
            3. Risk factors
            4. Portfolio recommendations
            5. Market outlook
            """
        }
        
        # Narrative generation templates
        self.narrative_templates = {
            "executive_summary": """
            Based on the financial analysis, here's the executive summary:
            
            Key Findings:
            - {key_findings}
            
            Financial Performance:
            - {performance_summary}
            
            Strategic Recommendations:
            - {recommendations}
            
            Risk Assessment:
            - {risk_summary}
            """,
            
            "quarterly_report": """
            Quarterly Financial Report
            
            Executive Summary:
            {executive_summary}
            
            Financial Highlights:
            {financial_highlights}
            
            Performance Analysis:
            {performance_analysis}
            
            Outlook:
            {outlook}
            """,
            
            "investment_memo": """
            Investment Analysis Memo
            
            Investment Thesis:
            {thesis}
            
            Financial Analysis:
            {financial_analysis}
            
            Risk Assessment:
            {risk_assessment}
            
            Recommendation:
            {recommendation}
            """
        }

    async def initialize(self) -> bool:
        """
        Initialize the LLM service and check Ollama connection
        """
        try:
            self.session = aiohttp.ClientSession()
            
            # Check if Ollama is running
            if await self._check_ollama_connection():
                logger.info("Ollama connection established")
                self.is_connected = True
                
                # Check if model is available
                if await self._check_model_availability():
                    logger.info(f"Model {self.model_name} is available")
                    self.model_loaded = True
                    return True
                else:
                    logger.warning(f"Model {self.model_name} not found, attempting to pull")
                    if await self._pull_model():
                        self.model_loaded = True
                        return True
                    else:
                        logger.error("Failed to load model")
                        return False
            else:
                logger.error("Failed to connect to Ollama")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing LLM service: {e}")
            return False

    async def _check_ollama_connection(self) -> bool:
        """
        Check if Ollama is running and accessible
        """
        try:
            async with self.session.get(f"{self.ollama_url}/api/tags") as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"Error checking Ollama connection: {e}")
            return False

    async def _check_model_availability(self) -> bool:
        """
        Check if the required model is available
        """
        try:
            async with self.session.get(f"{self.ollama_url}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    return self.model_name in models
                return False
        except Exception as e:
            logger.error(f"Error checking model availability: {e}")
            return False

    async def _pull_model(self) -> bool:
        """
        Pull the required model from Ollama
        """
        try:
            logger.info(f"Pulling model {self.model_name}...")
            async with self.session.post(
                f"{self.ollama_url}/api/pull",
                json={"name": self.model_name}
            ) as response:
                if response.status == 200:
                    logger.info(f"Model {self.model_name} pulled successfully")
                    return True
                else:
                    logger.error(f"Failed to pull model: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
            return False

    async def generate_financial_analysis(
        self, 
        data: Dict[str, Any], 
        analysis_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Generate AI-powered financial analysis
        """
        if not self.is_connected or not self.model_loaded:
            logger.error("LLM service not properly initialized")
            return {"error": "LLM service not available"}

        try:
            # Prepare the analysis prompt
            if analysis_type in self.financial_prompts:
                prompt = self.financial_prompts[analysis_type].format(data=json.dumps(data, indent=2))
            else:
                prompt = self.financial_prompts["revenue_analysis"].format(data=json.dumps(data, indent=2))

            # Generate analysis using Ollama
            analysis = await self._generate_response(prompt)
            
            return {
                "analysis_type": analysis_type,
                "timestamp": datetime.now().isoformat(),
                "data": data,
                "insights": analysis,
                "confidence_score": self._calculate_confidence_score(analysis),
                "key_metrics": self._extract_key_metrics(analysis),
                "recommendations": self._extract_recommendations(analysis)
            }

        except Exception as e:
            logger.error(f"Error generating financial analysis: {e}")
            return {"error": f"Analysis generation failed: {str(e)}"}

    async def generate_narrative(
        self, 
        analysis_data: Dict[str, Any], 
        narrative_type: str = "executive_summary"
    ) -> Dict[str, Any]:
        """
        Generate narrative insights from analysis data
        """
        if not self.is_connected or not self.model_loaded:
            return {"error": "LLM service not available"}

        try:
            # Prepare narrative prompt
            if narrative_type in self.narrative_templates:
                template = self.narrative_templates[narrative_type]
            else:
                template = self.narrative_templates["executive_summary"]

            # Extract key information from analysis
            key_findings = self._extract_key_findings(analysis_data)
            performance_summary = self._extract_performance_summary(analysis_data)
            recommendations = self._extract_recommendations(analysis_data)
            risk_summary = self._extract_risk_summary(analysis_data)

            # Generate narrative
            narrative_prompt = template.format(
                key_findings=key_findings,
                performance_summary=performance_summary,
                recommendations=recommendations,
                risk_summary=risk_summary,
                executive_summary=analysis_data.get("insights", ""),
                financial_highlights=analysis_data.get("key_metrics", ""),
                performance_analysis=analysis_data.get("insights", ""),
                outlook=analysis_data.get("recommendations", ""),
                thesis=analysis_data.get("insights", ""),
                financial_analysis=analysis_data.get("key_metrics", ""),
                risk_assessment=analysis_data.get("risk_summary", ""),
                recommendation=analysis_data.get("recommendations", "")
            )

            narrative = await self._generate_response(narrative_prompt)

            return {
                "narrative_type": narrative_type,
                "timestamp": datetime.now().isoformat(),
                "narrative": narrative,
                "analysis_data": analysis_data,
                "readability_score": self._calculate_readability_score(narrative),
                "sentiment_score": self._calculate_sentiment_score(narrative)
            }

        except Exception as e:
            logger.error(f"Error generating narrative: {e}")
            return {"error": f"Narrative generation failed: {str(e)}"}

    async def generate_predictions(
        self, 
        historical_data: Dict[str, Any], 
        prediction_horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Generate financial predictions using AI
        """
        if not self.is_connected or not self.model_loaded:
            return {"error": "LLM service not available"}

        try:
            prompt = f"""
            Based on the following historical financial data, generate predictions for the next {prediction_horizon} days:
            
            Historical Data: {json.dumps(historical_data, indent=2)}
            
            Please provide:
            1. Revenue predictions
            2. Expense forecasts
            3. Profit projections
            4. Risk factors
            5. Confidence intervals
            6. Key assumptions
            """

            predictions = await self._generate_response(prompt)

            return {
                "prediction_horizon": prediction_horizon,
                "timestamp": datetime.now().isoformat(),
                "historical_data": historical_data,
                "predictions": predictions,
                "confidence_intervals": self._extract_confidence_intervals(predictions),
                "key_assumptions": self._extract_assumptions(predictions)
            }

        except Exception as e:
            logger.error(f"Error generating predictions: {e}")
            return {"error": f"Prediction generation failed: {str(e)}"}

    async def _generate_response(self, prompt: str) -> str:
        """
        Generate response using Ollama API
        """
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2000
                }
            }

            async with self.session.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("response", "")
                else:
                    logger.error(f"Ollama API error: {response.status}")
                    return ""

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return ""

    def _calculate_confidence_score(self, analysis: str) -> float:
        """
        Calculate confidence score for analysis
        """
        try:
            # Simple heuristic based on analysis length and content
            words = len(analysis.split())
            has_numbers = any(char.isdigit() for char in analysis)
            has_percentages = "%" in analysis
            
            score = min(1.0, words / 100)  # Base score from length
            if has_numbers:
                score += 0.2
            if has_percentages:
                score += 0.1
                
            return round(score, 2)
        except:
            return 0.5

    def _extract_key_metrics(self, analysis: str) -> List[str]:
        """
        Extract key metrics from analysis
        """
        try:
            # Simple extraction of numbers and percentages
            import re
            metrics = re.findall(r'\d+\.?\d*%?', analysis)
            return metrics[:10]  # Return top 10 metrics
        except:
            return []

    def _extract_recommendations(self, analysis: str) -> List[str]:
        """
        Extract recommendations from analysis
        """
        try:
            # Simple extraction of recommendation-like sentences
            sentences = analysis.split('.')
            recommendations = []
            for sentence in sentences:
                if any(word in sentence.lower() for word in ['recommend', 'should', 'consider', 'improve', 'optimize']):
                    recommendations.append(sentence.strip())
            return recommendations[:5]  # Return top 5 recommendations
        except:
            return []

    def _extract_key_findings(self, analysis_data: Dict[str, Any]) -> str:
        """
        Extract key findings from analysis data
        """
        try:
            insights = analysis_data.get("insights", "")
            # Extract first few sentences as key findings
            sentences = insights.split('.')[:3]
            return '. '.join(sentences) + '.'
        except:
            return "Key findings extracted from analysis."

    def _extract_performance_summary(self, analysis_data: Dict[str, Any]) -> str:
        """
        Extract performance summary from analysis data
        """
        try:
            metrics = analysis_data.get("key_metrics", [])
            if metrics:
                return f"Key metrics: {', '.join(metrics[:5])}"
            return "Performance metrics analyzed."
        except:
            return "Performance summary available."

    def _extract_risk_summary(self, analysis_data: Dict[str, Any]) -> str:
        """
        Extract risk summary from analysis data
        """
        try:
            insights = analysis_data.get("insights", "")
            if "risk" in insights.lower():
                # Extract risk-related sentences
                sentences = insights.split('.')
                risk_sentences = [s for s in sentences if 'risk' in s.lower()]
                return '. '.join(risk_sentences[:2]) + '.'
            return "Risk assessment completed."
        except:
            return "Risk analysis performed."

    def _calculate_readability_score(self, text: str) -> float:
        """
        Calculate readability score for narrative
        """
        try:
            words = len(text.split())
            sentences = len(text.split('.'))
            if sentences > 0:
                avg_sentence_length = words / sentences
                # Simple Flesch Reading Ease approximation
                score = max(0, min(100, 100 - avg_sentence_length * 2))
                return round(score, 1)
            return 50.0
        except:
            return 50.0

    def _calculate_sentiment_score(self, text: str) -> float:
        """
        Calculate sentiment score for narrative
        """
        try:
            positive_words = ['positive', 'growth', 'increase', 'improve', 'success', 'profit', 'gain']
            negative_words = ['negative', 'decline', 'decrease', 'loss', 'risk', 'problem', 'issue']
            
            text_lower = text.lower()
            positive_count = sum(1 for word in positive_words if word in text_lower)
            negative_count = sum(1 for word in negative_words if word in text_lower)
            
            total = positive_count + negative_count
            if total > 0:
                score = (positive_count - negative_count) / total
                return round(score, 2)
            return 0.0
        except:
            return 0.0

    def _extract_confidence_intervals(self, predictions: str) -> Dict[str, Any]:
        """
        Extract confidence intervals from predictions
        """
        try:
            # Simple extraction of percentage ranges
            import re
            intervals = re.findall(r'\d+%?\s*-\s*\d+%?', predictions)
            return {"intervals": intervals}
        except:
            return {"intervals": []}

    def _extract_assumptions(self, predictions: str) -> List[str]:
        """
        Extract key assumptions from predictions
        """
        try:
            sentences = predictions.split('.')
            assumptions = []
            for sentence in sentences:
                if any(word in sentence.lower() for word in ['assume', 'assumption', 'if', 'when', 'given']):
                    assumptions.append(sentence.strip())
            return assumptions[:3]
        except:
            return []

    async def cleanup(self):
        """
        Cleanup resources
        """
        if self.session:
            await self.session.close()

# Create singleton instance
llm_service = LLMService() 
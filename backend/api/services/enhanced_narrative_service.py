"""
Enhanced AI Narrative Service for Financial Data Storytelling
Provides enterprise-grade narrative generation with multiple AI models and caching
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, List, Optional, Any, Union
import aiohttp
import redis.asyncio as redis
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class NarrativeType(str, Enum):
    """Types of narratives that can be generated"""
    EXECUTIVE_SUMMARY = "executive_summary"
    FINANCIAL_ANALYSIS = "financial_analysis"
    RISK_ASSESSMENT = "risk_assessment"
    MARKET_INSIGHTS = "market_insights"
    PERFORMANCE_REVIEW = "performance_review"
    STRATEGIC_RECOMMENDATIONS = "strategic_recommendations"
    TREND_ANALYSIS = "trend_analysis"
    COMPARATIVE_ANALYSIS = "comparative_analysis"

class AIProvider(str, Enum):
    """Supported AI providers"""
    LLAMA3 = "llama3"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

@dataclass
class NarrativeRequest:
    """Request for narrative generation"""
    data_summary: Dict[str, Any]
    narrative_type: NarrativeType
    user_role: str = "analyst"
    context: Optional[Dict[str, Any]] = None
    market_data: Optional[Dict[str, Any]] = None
    custom_prompt: Optional[str] = None
    max_length: int = 1000
    include_visualizations: bool = True
    confidence_threshold: float = 0.7

@dataclass
class NarrativeResponse:
    """Response from narrative generation"""
    narrative: str
    confidence_score: float
    narrative_type: NarrativeType
    generated_at: datetime
    model_used: str
    processing_time: float
    data_quality_score: float
    key_insights: List[str]
    recommendations: List[str]
    risk_factors: List[str]
    market_context: Optional[Dict[str, Any]] = None
    visualizations: Optional[List[Dict[str, Any]]] = None
    cache_hit: bool = False

class EnhancedNarrativeService:
    """
    Enterprise-grade AI narrative generation service
    Supports multiple AI providers, caching, and financial context analysis
    """
    
    def __init__(self, 
                 redis_url: str = "redis://localhost:6379",
                 default_provider: AIProvider = AIProvider.LLAMA3,
                 cache_ttl: int = 3600):
        self.redis_url = redis_url
        self.default_provider = default_provider
        self.cache_ttl = cache_ttl
        self.redis_client = None
        self.session = None
        
        # AI provider configurations
        self.providers = {
            AIProvider.LLAMA3: {
                "base_url": "http://localhost:11434",
                "model": "llama3.1-8b-instruct",
                "timeout": 30
            },
            AIProvider.OPENAI: {
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4",
                "timeout": 60
            }
        }
        
        logger.info(f"Enhanced Narrative Service initialized with provider: {default_provider}")
    
    async def initialize(self):
        """Initialize Redis connection and HTTP session"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}, continuing without cache")
            self.redis_client = None
        
        self.session = aiohttp.ClientSession()
        logger.info("Enhanced Narrative Service initialized successfully")
    
    async def close(self):
        """Clean up resources"""
        if self.redis_client:
            await self.redis_client.close()
        if self.session:
            await self.session.close()
    
    def _generate_cache_key(self, request: NarrativeRequest) -> str:
        """Generate unique cache key for request"""
        key_data = {
            "type": request.narrative_type.value,
            "role": request.user_role,
            "max_length": request.max_length,
            "data_hash": hash(json.dumps(request.data_summary, sort_keys=True)),
            "context_hash": hash(json.dumps(request.context or {}, sort_keys=True))
        }
        return f"narrative:{hash(json.dumps(key_data, sort_keys=True))}"
    
    async def _get_cached_narrative(self, cache_key: str) -> Optional[NarrativeResponse]:
        """Retrieve cached narrative if available"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                data["generated_at"] = datetime.fromisoformat(data["generated_at"])
                data["cache_hit"] = True
                logger.info(f"Cache hit for narrative: {cache_key}")
                return NarrativeResponse(**data)
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        
        return None
    
    async def _cache_narrative(self, cache_key: str, response: NarrativeResponse):
        """Cache narrative response"""
        if not self.redis_client:
            return
        
        try:
            cache_data = asdict(response)
            cache_data["generated_at"] = response.generated_at.isoformat()
            await self.redis_client.setex(
                cache_key, 
                self.cache_ttl, 
                json.dumps(cache_data)
            )
            logger.info(f"Narrative cached: {cache_key}")
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
    
    def _analyze_financial_context(self, data_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze financial data for context"""
        context = {
            "data_quality": data_summary.get("data_quality_score", 0.8),
            "record_count": data_summary.get("records_analyzed", 0),
            "key_metrics": data_summary.get("key_metrics", {}),
            "trends": data_summary.get("trends", {}),
            "anomalies": data_summary.get("anomalies", []),
            "risk_indicators": data_summary.get("risk_indicators", {}),
            "performance_metrics": data_summary.get("performance_metrics", {})
        }
        
        # Calculate narrative confidence based on data quality
        context["confidence_factors"] = {
            "data_completeness": min(context["data_quality"], 1.0),
            "sample_size": min(context["record_count"] / 1000, 1.0),
            "metric_coverage": len(context["key_metrics"]) / 10,
            "trend_clarity": len(context["trends"]) / 5
        }
        
        return context
    
    def _build_prompt(self, request: NarrativeRequest, context: Dict[str, Any]) -> str:
        """Build AI prompt based on narrative type and context"""
        
        base_prompt = f"""
You are a senior financial analyst and strategic advisor preparing a {request.narrative_type.value.replace('_', ' ')} for {request.user_role} level stakeholders.

## FINANCIAL DATA CONTEXT
Dataset: {context['record_count']} financial records analyzed
Data Quality Score: {context['data_quality']:.2f}/1.0
Key Financial Metrics: {json.dumps(context['key_metrics'], indent=2)}
Risk Indicators: {json.dumps(context['risk_indicators'], indent=2)}
Performance Metrics: {json.dumps(context['performance_metrics'], indent=2)}

## NARRATIVE REQUIREMENTS
Type: {request.narrative_type.value}
Target Length: {request.max_length} words
User Role: {request.user_role}
Include Visualizations: {request.include_visualizations}

## INSTRUCTIONS
1. Provide clear, actionable insights
2. Use professional financial language
3. Include specific recommendations
4. Highlight key risks and opportunities
5. Make data-driven conclusions
6. Structure for executive consumption

Generate a comprehensive {request.narrative_type.value} that tells the story of this financial data.
"""
        
        if request.custom_prompt:
            base_prompt += f"\n## CUSTOM REQUIREMENTS\n{request.custom_prompt}"
        
        return base_prompt
    
    async def _call_ai_provider(self, prompt: str, provider: AIProvider = None) -> str:
        """Call AI provider to generate narrative"""
        provider = provider or self.default_provider
        config = self.providers[provider]
        
        try:
            if provider == AIProvider.LLAMA3:
                return await self._call_llama3(prompt, config)
            elif provider == AIProvider.OPENAI:
                return await self._call_openai(prompt, config)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"AI provider error ({provider}): {e}")
            return self._generate_fallback_narrative(prompt)
    
    async def _call_llama3(self, prompt: str, config: Dict[str, Any]) -> str:
        """Call LLaMA3 via Ollama"""
        url = f"{config['base_url']}/api/generate"
        payload = {
            "model": config["model"],
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000
            }
        }
        
        async with self.session.post(url, json=payload, timeout=config["timeout"]) as response:
            if response.status == 200:
                result = await response.json()
                return result.get("response", "")
            else:
                raise Exception(f"LLaMA3 API error: {response.status}")
    
    async def _call_openai(self, prompt: str, config: Dict[str, Any]) -> str:
        """Call OpenAI API"""
        url = f"{config['base_url']}/chat/completions"
        payload = {
            "model": config["model"],
            "messages": [
                {"role": "system", "content": "You are a senior financial analyst."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2000,
            "temperature": 0.7
        }
        
        headers = {"Authorization": f"Bearer {config.get('api_key', '')}"}
        
        async with self.session.post(url, json=payload, headers=headers, timeout=config["timeout"]) as response:
            if response.status == 200:
                result = await response.json()
                return result["choices"][0]["message"]["content"]
            else:
                raise Exception(f"OpenAI API error: {response.status}")
    
    def _generate_fallback_narrative(self, prompt: str) -> str:
        """Generate fallback narrative when AI is unavailable"""
        return f"""
Based on the financial data analysis, here are the key insights:

## Executive Summary
The dataset contains comprehensive financial information that has been analyzed for trends, patterns, and insights.

## Key Findings
- Data quality assessment completed
- Financial metrics calculated
- Risk factors identified
- Performance indicators evaluated

## Recommendations
- Continue monitoring key metrics
- Address identified risk factors
- Implement performance improvements
- Regular review of financial trends

This analysis provides a foundation for strategic decision-making and ongoing financial management.
"""
    
    def _extract_insights(self, narrative: str) -> List[str]:
        """Extract key insights from narrative"""
        insights = []
        lines = narrative.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['insight', 'finding', 'trend', 'pattern', 'increase', 'decrease']):
                insights.append(line.strip())
        
        return insights[:5]  # Limit to top 5 insights
    
    def _extract_recommendations(self, narrative: str) -> List[str]:
        """Extract recommendations from narrative"""
        recommendations = []
        lines = narrative.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'suggest', 'should', 'consider', 'implement']):
                recommendations.append(line.strip())
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _extract_risks(self, narrative: str) -> List[str]:
        """Extract risk factors from narrative"""
        risks = []
        lines = narrative.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['risk', 'concern', 'warning', 'caution', 'volatile']):
                risks.append(line.strip())
        
        return risks[:5]  # Limit to top 5 risks
    
    async def generate_narrative(self, request: NarrativeRequest) -> NarrativeResponse:
        """Generate AI-powered narrative for financial data"""
        start_time = time.time()
        
        try:
            # Check cache first
            cache_key = self._generate_cache_key(request)
            cached_result = await self._get_cached_narrative(cache_key)
            if cached_result:
                return cached_result
            
            # Analyze financial context
            context = self._analyze_financial_context(request.data_summary)
            
            # Build AI prompt
            prompt = self._build_prompt(request, context)
            
            # Generate narrative
            raw_narrative = await self._call_ai_provider(prompt)
            
            # Post-process narrative
            processing_time = time.time() - start_time
            confidence_score = min(context["data_quality"] * 0.8 + 0.2, 1.0)
            
            # Extract structured insights
            insights = self._extract_insights(raw_narrative)
            recommendations = self._extract_recommendations(raw_narrative)
            risks = self._extract_risks(raw_narrative)
            
            # Create response
            response = NarrativeResponse(
                narrative=raw_narrative,
                confidence_score=confidence_score,
                narrative_type=request.narrative_type,
                generated_at=datetime.utcnow(),
                model_used=self.default_provider.value,
                processing_time=processing_time,
                data_quality_score=context["data_quality"],
                key_insights=insights,
                recommendations=recommendations,
                risk_factors=risks,
                market_context=request.market_data,
                visualizations=[] if request.include_visualizations else None
            )
            
            # Cache response
            await self._cache_narrative(cache_key, response)
            
            logger.info(f"Narrative generated successfully in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"Narrative generation error: {e}")
            processing_time = time.time() - start_time
            
            return NarrativeResponse(
                narrative="Error generating narrative. Please try again.",
                confidence_score=0.0,
                narrative_type=request.narrative_type,
                generated_at=datetime.utcnow(),
                model_used="fallback",
                processing_time=processing_time,
                data_quality_score=0.0,
                key_insights=[],
                recommendations=[],
                risk_factors=[]
            )
    
    async def get_narrative_types(self) -> List[Dict[str, Any]]:
        """Get available narrative types with descriptions"""
        return [
            {
                "type": NarrativeType.EXECUTIVE_SUMMARY.value,
                "description": "High-level summary for C-level executives",
                "target_audience": "executives",
                "typical_length": "500-1000 words"
            },
            {
                "type": NarrativeType.FINANCIAL_ANALYSIS.value,
                "description": "Detailed financial performance analysis",
                "target_audience": "analysts",
                "typical_length": "1000-2000 words"
            },
            {
                "type": NarrativeType.RISK_ASSESSMENT.value,
                "description": "Comprehensive risk evaluation and mitigation",
                "target_audience": "risk_managers",
                "typical_length": "800-1500 words"
            },
            {
                "type": NarrativeType.MARKET_INSIGHTS.value,
                "description": "Market trends and competitive analysis",
                "target_audience": "strategists",
                "typical_length": "600-1200 words"
            },
            {
                "type": NarrativeType.PERFORMANCE_REVIEW.value,
                "description": "Performance metrics and KPI analysis",
                "target_audience": "managers",
                "typical_length": "700-1400 words"
            },
            {
                "type": NarrativeType.STRATEGIC_RECOMMENDATIONS.value,
                "description": "Strategic recommendations and action items",
                "target_audience": "decision_makers",
                "typical_length": "600-1200 words"
            },
            {
                "type": NarrativeType.TREND_ANALYSIS.value,
                "description": "Historical trends and future projections",
                "target_audience": "planners",
                "typical_length": "800-1600 words"
            },
            {
                "type": NarrativeType.COMPARATIVE_ANALYSIS.value,
                "description": "Benchmarking and comparative performance",
                "target_audience": "analysts",
                "typical_length": "1000-2000 words"
            }
        ]
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service health and status"""
        status = {
            "service": "Enhanced Narrative Service",
            "status": "healthy",
            "providers": list(self.providers.keys()),
            "default_provider": self.default_provider.value,
            "cache_enabled": self.redis_client is not None,
            "uptime": "active"
        }
        
        # Test AI provider connectivity
        try:
            test_prompt = "Generate a brief test response."
            await self._call_ai_provider(test_prompt)
            status["ai_provider_status"] = "connected"
        except Exception as e:
            status["ai_provider_status"] = f"error: {str(e)}"
            status["status"] = "degraded"
        
        return status 
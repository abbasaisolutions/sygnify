"""
LLM Service for Sygnify Financial Analytics Platform
Real AI analysis with LLaMA3 and Ollama integration
"""
import asyncio
import json
import logging
import aiohttp
import pandas as pd
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np
from scipy import stats

# Import services
from .data_quality_service import data_quality_service
from .financial_kpi_service import financial_kpi_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    """
    Advanced LLM service with LLaMA3 integration and market data
    """
    
    def __init__(self):
        self.ollama_base_url = "http://localhost:11434"
        self.llama_model = "llama3.2:3b-q4_0"
        self.timeout = 15  # Reduced from 30 to 15 seconds
        self.market_data_cache = {}
        self.cache_ttl = 300  # 5 minutes cache
        
    async def analyze_financial_data(self, data: pd.DataFrame, domain: str = "financial") -> Dict:
        """
        Perform comprehensive AI analysis on financial data
        """
        try:
            # Generate analysis prompt
            prompt = self._generate_analysis_prompt(data, domain)
            
            # Get AI analysis
            ai_analysis = await self._get_llama_analysis(prompt)
            
            # Get market context
            market_context = await self._get_market_context()
            
            # Perform statistical analysis
            statistical_analysis = self._perform_statistical_analysis(data)
            
            # Calculate comprehensive financial KPIs
            financial_kpis = financial_kpi_service.calculate_financial_kpis(data, domain)
            
            # Generate ML prompts
            ml_prompts = financial_kpi_service.generate_ml_prompts(data, domain)
            
            # Generate risk assessment
            risk_assessment = financial_kpi_service.generate_risk_assessment(data, domain)
            
            # Generate recommendations
            recommendations = financial_kpi_service.generate_recommendations(data, domain)
            
            # Generate insights
            insights = self._generate_insights(data, ai_analysis, market_context, statistical_analysis)
            
            return {
                "ai_analysis": ai_analysis,
                "market_context": market_context,
                "statistical_analysis": statistical_analysis,
                "financial_kpis": financial_kpis,
                "ml_prompts": ml_prompts,
                "risk_assessment": risk_assessment,
                "recommendations": recommendations,
                "insights": insights,
                "confidence_score": self._calculate_confidence(data),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            return self._generate_fallback_analysis(data, domain)
    
    async def analyze_retail_data(self, data: pd.DataFrame, domain: str = "retail") -> Dict:
        """
        Perform comprehensive AI analysis on retail data with retail-specific context
        """
        try:
            # Generate retail-specific analysis prompt
            prompt = self._generate_retail_analysis_prompt(data, domain)
            
            # Get AI analysis
            ai_analysis = await self._get_llama_analysis(prompt)
            
            # Get market context
            market_context = await self._get_market_context()
            
            # Import retail KPI service for comprehensive metrics
            try:
                from api.services.retail_kpi_service import retail_kpi_service
                retail_kpis = retail_kpi_service.calculate_retail_kpis(data, domain)
                ml_prompts = retail_kpi_service.generate_ml_prompts(data, domain)
                risk_assessment = retail_kpi_service.generate_risk_assessment(data, domain)
                recommendations = retail_kpi_service.generate_recommendations(data, domain)
            except ImportError:
                # Fallback if retail service not available
                retail_kpis = {"error": "Retail KPI service not available"}
                ml_prompts = []
                risk_assessment = {"overall_risk_level": "Medium"}
                recommendations = ["Implement retail analytics for better insights"]
            
            # Perform statistical analysis
            statistical_analysis = self._perform_statistical_analysis(data)
            
            # Generate retail-specific insights
            insights = self._generate_retail_insights(data, ai_analysis, market_context, statistical_analysis)
            
            return {
                "ai_analysis": ai_analysis,
                "market_context": market_context,
                "statistical_analysis": statistical_analysis,
                "retail_kpis": retail_kpis,
                "ml_prompts": ml_prompts,
                "risk_assessment": risk_assessment,
                "recommendations": recommendations,
                "insights": insights,
                "confidence_score": self._calculate_confidence(data),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in retail AI analysis: {e}")
            return self._generate_fallback_analysis(data, domain)
    
    async def _get_llama_analysis(self, prompt: str) -> Dict:
        """
        Get real AI analysis from LLaMA3 via Ollama
        """
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.llama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 1000
                    }
                }
                
                async with session.post(
                    f"{self.ollama_base_url}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "analysis": result.get("response", ""),
                            "model": self.llama_model,
                            "tokens_used": result.get("eval_count", 0),
                            "success": True
                        }
                    else:
                        logger.warning(f"Ollama API error: {response.status}")
                        return self._generate_fallback_ai_analysis()
                        
        except asyncio.TimeoutError:
            logger.warning("LLaMA3 analysis timed out - using fallback")
            return self._generate_fallback_ai_analysis()
        except Exception as e:
            logger.error(f"Error calling LLaMA3: {e}")
            return self._generate_fallback_ai_analysis()
    
    async def _get_market_context(self) -> Dict:
        """
        Get live market data and macroeconomic indicators
        """
        try:
            # Check cache first
            cache_key = "market_data"
            if cache_key in self.market_data_cache:
                cached_data = self.market_data_cache[cache_key]
                if datetime.now() - cached_data["timestamp"] < timedelta(seconds=self.cache_ttl):
                    return cached_data["data"]
            
            # Fetch live market data
            market_data = await self._fetch_market_data()
            
            # Cache the result
            self.market_data_cache[cache_key] = {
                "data": market_data,
                "timestamp": datetime.now()
            }
            
            return market_data
            
        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return self._generate_fallback_market_data()
    
    async def _fetch_market_data(self) -> Dict:
        """
        Fetch live market data from external APIs
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Simulate fetching real market data
                # In production, this would call actual financial APIs
                market_data = {
                    "sp500": {
                        "value": 4850.25,
                        "change": 12.45,
                        "change_percent": 0.26,
                        "timestamp": datetime.now().isoformat()
                    },
                    "xlf": {
                        "value": 38.75,
                        "change": -0.15,
                        "change_percent": -0.39,
                        "timestamp": datetime.now().isoformat()
                    },
                    "interest_rates": {
                        "fed_funds_rate": 5.25,
                        "treasury_10y": 4.15,
                        "treasury_2y": 4.85,
                        "timestamp": datetime.now().isoformat()
                    },
                    "inflation": {
                        "cpi": 3.1,
                        "core_cpi": 3.9,
                        "pce": 2.6,
                        "timestamp": datetime.now().isoformat()
                    },
                    "volatility": {
                        "vix": 18.5,
                        "vix_change": -0.8,
                        "timestamp": datetime.now().isoformat()
                    },
                    "economic_indicators": {
                        "unemployment_rate": 3.7,
                        "gdp_growth": 2.1,
                        "consumer_confidence": 108.5,
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                return market_data
                
        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return self._generate_fallback_market_data()
    
    def _perform_statistical_analysis(self, data: pd.DataFrame) -> Dict:
        """
        Perform comprehensive statistical analysis
        """
        try:
            analysis = {
                "summary_stats": {},
                "correlations": {},
                "distributions": {},
                "outliers": {},
                "trends": {}
            }
            
            # Summary statistics
            for col in data.select_dtypes(include=[np.number]).columns:
                analysis["summary_stats"][col] = {
                    "mean": float(data[col].mean()),
                    "median": float(data[col].median()),
                    "std": float(data[col].std()),
                    "min": float(data[col].min()),
                    "max": float(data[col].max()),
                    "skewness": float(stats.skew(data[col].dropna())),
                    "kurtosis": float(stats.kurtosis(data[col].dropna()))
                }
            
            # Correlations
            numeric_data = data.select_dtypes(include=[np.number])
            if len(numeric_data.columns) > 1:
                corr_matrix = numeric_data.corr()
                analysis["correlations"] = {
                    "matrix": corr_matrix.to_dict(),
                    "strong_correlations": self._find_strong_correlations(corr_matrix)
                }
            
            # Outlier detection
            for col in numeric_data.columns:
                outliers = self._detect_outliers(data[col])
                if len(outliers) > 0:
                    analysis["outliers"][col] = {
                        "count": len(outliers),
                        "percentage": len(outliers) / len(data) * 100,
                        "indices": outliers.tolist()
                    }
            
            # Trend analysis
            for col in numeric_data.columns:
                if len(data) > 10:  # Need enough data for trend analysis
                    trend = self._analyze_trend(data[col])
                    analysis["trends"][col] = trend
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in statistical analysis: {e}")
            return {"error": str(e)}
    
    def _detect_outliers(self, series: pd.Series, threshold: float = 3.0) -> pd.Series:
        """
        Detect outliers using Z-score method
        """
        z_scores = np.abs(stats.zscore(series.dropna()))
        return series[z_scores > threshold]
    
    def _analyze_trend(self, series: pd.Series) -> Dict:
        """
        Analyze trend in time series data
        """
        try:
            # Simple linear regression
            x = np.arange(len(series))
            y = series.values
            
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            
            return {
                "slope": float(slope),
                "intercept": float(intercept),
                "r_squared": float(r_value ** 2),
                "p_value": float(p_value),
                "trend_direction": "increasing" if slope > 0 else "decreasing",
                "trend_strength": "strong" if abs(r_value) > 0.7 else "moderate" if abs(r_value) > 0.4 else "weak"
            }
        except Exception as e:
            return {"error": str(e)}
    
    def _find_strong_correlations(self, corr_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict]:
        """
        Find strong correlations in correlation matrix
        """
        strong_correlations = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) >= threshold:
                    strong_correlations.append({
                        "variable1": corr_matrix.columns[i],
                        "variable2": corr_matrix.columns[j],
                        "correlation": float(corr_value),
                        "strength": "strong" if abs(corr_value) > 0.8 else "moderate"
                    })
        
        return strong_correlations
    
    def _generate_analysis_prompt(self, data: pd.DataFrame, domain: str) -> str:
        """
        Generate analysis prompt for LLaMA3
        """
        prompt = f"""
        You are a financial analyst AI assistant. Analyze the following {domain} data and provide insights:

        Dataset Information:
        - Shape: {data.shape}
        - Columns: {list(data.columns)}
        - Data Types: {data.dtypes.to_dict()}
        - Missing Values: {data.isnull().sum().to_dict()}

        Summary Statistics:
        {data.describe().to_string()}

        Please provide:
        1. Key insights about the data quality and patterns
        2. Potential business implications
        3. Recommendations for further analysis
        4. Risk factors to consider
        5. Opportunities for optimization

        Focus on practical, actionable insights that would be valuable for business decision-making.
        """
        return prompt
    
    def _generate_retail_analysis_prompt(self, data: pd.DataFrame, domain: str) -> str:
        """Generate retail-specific analysis prompt"""
        # Basic data info
        rows, cols = data.shape
        
        # Identify retail-specific columns
        customer_cols = [col for col in data.columns if 'customer' in col.lower()]
        product_cols = [col for col in data.columns if any(term in col.lower() for term in ['product', 'item'])]
        sales_cols = [col for col in data.columns if any(term in col.lower() for term in ['sales', 'revenue', 'amount'])]
        inventory_cols = [col for col in data.columns if any(term in col.lower() for term in ['inventory', 'stock'])]
        supplier_cols = [col for col in data.columns if 'supplier' in col.lower()]
        
        prompt = f"""
You are a retail analytics AI assistant specializing in {domain} data analysis. 

Analyze the following retail dataset:
- Dataset size: {rows} transactions, {cols} attributes
- Customer data: {len(customer_cols)} customer-related fields
- Product data: {len(product_cols)} product-related fields  
- Sales data: {len(sales_cols)} sales/revenue fields
- Inventory data: {len(inventory_cols)} inventory fields
- Supplier data: {len(supplier_cols)} supplier fields

Key columns available: {', '.join(data.columns[:10])}...

Please provide a comprehensive retail analysis focusing on:

1. **Customer Analytics**:
   - Customer segmentation and lifetime value insights
   - Purchase behavior patterns and frequency analysis
   - Churn risk assessment and retention opportunities

2. **Sales Performance**:
   - Sales velocity and conversion rate analysis
   - Product performance and revenue drivers
   - Seasonal trends and growth opportunities

3. **Inventory Management**:
   - Inventory turnover and efficiency metrics
   - Stock aging and obsolescence risks
   - Demand forecasting and optimization recommendations

4. **Supply Chain Insights**:
   - Supplier performance and reliability
   - Cost optimization opportunities
   - Risk mitigation strategies

5. **Strategic Recommendations**:
   - Actionable insights for revenue growth
   - Operational efficiency improvements
   - Customer experience enhancements

Provide specific, data-driven insights with retail industry context and benchmarks.
"""
        return prompt
    
    def _generate_retail_insights(self, data: pd.DataFrame, ai_analysis: Dict, market_context: Dict, statistical_analysis: Dict) -> List[Dict]:
        """Generate retail-specific insights"""
        insights = []
        
        try:
            # Customer insights
            if 'customer_id' in data.columns:
                unique_customers = data['customer_id'].nunique()
                repeat_customers = len(data['customer_id'].value_counts()[data['customer_id'].value_counts() > 1])
                repeat_rate = (repeat_customers / unique_customers) * 100 if unique_customers > 0 else 0
                
                insights.append({
                    "type": "customer_analytics",
                    "title": "Customer Retention Analysis",
                    "insight": f"Customer repeat rate is {repeat_rate:.1f}% with {unique_customers} unique customers",
                    "recommendation": "Focus on customer retention programs" if repeat_rate < 30 else "Maintain customer loyalty initiatives",
                    "priority": "high" if repeat_rate < 20 else "medium"
                })
            
            # Sales insights
            if 'total_revenue' in data.columns:
                total_revenue = data['total_revenue'].sum()
                avg_order_value = data['total_revenue'].mean()
                
                insights.append({
                    "type": "sales_performance",
                    "title": "Revenue Analysis",
                    "insight": f"Total revenue: ${total_revenue:,.2f}, Average order value: ${avg_order_value:.2f}",
                    "recommendation": "Optimize pricing strategy" if avg_order_value < 50 else "Focus on volume growth",
                    "priority": "high"
                })
            
            # Inventory insights
            if 'inventory_on_hand' in data.columns and 'quantity_sold' in data.columns:
                avg_inventory = data['inventory_on_hand'].mean()
                total_sold = data['quantity_sold'].sum()
                turnover_rate = total_sold / avg_inventory if avg_inventory > 0 else 0
                
                insights.append({
                    "type": "inventory_management",
                    "title": "Inventory Efficiency",
                    "insight": f"Inventory turnover rate: {turnover_rate:.1f}x annually",
                    "recommendation": "Optimize inventory levels" if turnover_rate < 4 else "Maintain current inventory strategy",
                    "priority": "high" if turnover_rate < 2 else "medium"
                })
            
            # Supplier insights
            if 'supplier' in data.columns and 'quality_score' in data.columns:
                avg_quality = data['quality_score'].mean()
                supplier_count = data['supplier'].nunique()
                
                insights.append({
                    "type": "supply_chain",
                    "title": "Supplier Performance",
                    "insight": f"Average supplier quality: {avg_quality:.1f}% across {supplier_count} suppliers",
                    "recommendation": "Review supplier relationships" if avg_quality < 95 else "Maintain supplier partnerships",
                    "priority": "high" if avg_quality < 90 else "low"
                })
            
            # Category insights
            if 'category' in data.columns and 'total_revenue' in data.columns:
                category_revenue = data.groupby('category')['total_revenue'].sum().sort_values(ascending=False)
                top_category = category_revenue.index[0]
                category_share = (category_revenue.iloc[0] / category_revenue.sum()) * 100
                
                insights.append({
                    "type": "product_analysis",
                    "title": "Category Performance",
                    "insight": f"Top category '{top_category}' contributes {category_share:.1f}% of revenue",
                    "recommendation": f"Expand {top_category} product line" if category_share > 30 else "Diversify product mix",
                    "priority": "medium"
                })
            
        except Exception as e:
            logger.error(f"Error generating retail insights: {e}")
            insights.append({
                "type": "error",
                "title": "Analysis Error",
                "insight": "Unable to generate specific insights due to data processing error",
                "recommendation": "Review data quality and completeness",
                "priority": "high"
            })
        
        return insights
    
    def _generate_insights(self, data: pd.DataFrame, ai_analysis: Dict, market_context: Dict, statistical_analysis: Dict) -> Dict:
        """
        Generate comprehensive insights combining all analyses
        """
        insights = {
            "data_quality": {
                "total_records": len(data),
                "missing_values": data.isnull().sum().sum(),
                "duplicate_records": data.duplicated().sum(),
                "data_completeness": (len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns)) * 100
            },
            "key_findings": [],
            "recommendations": [],
            "risk_factors": [],
            "market_impact": {}
        }
        
        # Add AI insights
        if ai_analysis.get("success"):
            insights["ai_insights"] = ai_analysis.get("analysis", "")
        
        # Add statistical insights
        if "summary_stats" in statistical_analysis:
            insights["statistical_insights"] = statistical_analysis["summary_stats"]
        
        # Add market context insights
        if market_context:
            insights["market_context"] = market_context
        
        return insights
    
    def _calculate_confidence(self, data: pd.DataFrame) -> float:
        """
        Calculate confidence score based on data quality and analysis results
        """
        # Base confidence on data quality
        completeness = (len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns))
        uniqueness = 1 - (data.duplicated().sum() / len(data))
        
        # Calculate overall confidence
        confidence = (completeness * 0.6 + uniqueness * 0.4) * 100
        
        return min(max(confidence, 0), 100)
    
    def _generate_fallback_analysis(self, data: pd.DataFrame, domain: str) -> Dict:
        """
        Generate fallback analysis when AI services are unavailable
        """
        # Calculate financial KPIs even in fallback mode
        financial_kpis = financial_kpi_service.calculate_financial_kpis(data, domain)
        ml_prompts = financial_kpi_service.generate_ml_prompts(data, domain)
        risk_assessment = financial_kpi_service.generate_risk_assessment(data, domain)
        recommendations = financial_kpi_service.generate_recommendations(data, domain)
        
        return {
            "ai_analysis": {
                "analysis": f"Basic analysis for {domain} domain. AI services temporarily unavailable.",
                "model": "fallback",
                "success": False
            },
            "market_context": self._generate_fallback_market_data(),
            "statistical_analysis": self._perform_statistical_analysis(data),
            "financial_kpis": financial_kpis,
            "ml_prompts": ml_prompts,
            "risk_assessment": risk_assessment,
            "recommendations": recommendations,
            "insights": self._generate_basic_insights(data, domain),
            "confidence_score": 50.0,
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_fallback_ai_analysis(self) -> Dict:
        """
        Generate fallback AI analysis
        """
        return {
            "analysis": "AI analysis temporarily unavailable. Using statistical analysis only.",
            "model": "fallback",
            "success": False
        }
    
    def _generate_fallback_market_data(self) -> Dict:
        """
        Generate fallback market data
        """
        return {
            "sp500": {"value": 4800.0, "change": 0, "change_percent": 0},
            "xlf": {"value": 38.0, "change": 0, "change_percent": 0},
            "interest_rates": {"fed_funds_rate": 5.25, "treasury_10y": 4.15},
            "note": "Market data temporarily unavailable"
        }
    
    def _generate_basic_insights(self, data: pd.DataFrame, domain: str) -> Dict:
        """
        Generate basic insights without AI
        """
        return {
            "data_quality": {
                "total_records": len(data),
                "missing_values": data.isnull().sum().sum(),
                "data_completeness": (len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns)) * 100
            },
            "key_findings": [
                f"Dataset contains {len(data)} records",
                f"Data completeness: {((len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns)) * 100):.1f}%",
                f"Analysis domain: {domain}"
            ],
            "recommendations": [
                "Review data quality before analysis",
                "Consider data cleaning for missing values",
                "Validate assumptions with domain experts"
            ]
        }

# Global instance
llm_service = LLMService() 
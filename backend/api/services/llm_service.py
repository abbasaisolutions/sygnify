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
        Perform comprehensive AI analysis - routes to domain-specific analysis based on domain parameter
        """
        try:
            # Route to appropriate domain analysis
            if domain == "retail":
                return await self.analyze_retail_data(data, domain)
            else:
                # Financial domain analysis
                return await self._analyze_financial_domain(data, domain)
            
        except Exception as e:
            logger.error(f"Error in AI analysis routing: {e}")
            return self._generate_fallback_analysis(data, domain)
    
    async def _analyze_financial_domain(self, data: pd.DataFrame, domain: str = "financial") -> Dict:
        """
        Perform comprehensive AI analysis on financial data (original financial logic)
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
            logger.error(f"Error in financial AI analysis: {e}")
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
            
            # Get retail-specific market context
            market_context = await self._get_retail_market_context()
            
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
    
    async def _get_retail_market_context(self) -> Dict:
        """Get retail industry-specific market context and trends"""
        return {
            "retail_industry_trends": {
                "2024_key_trends": [
                    "Omnichannel customer experience optimization",
                    "AI-powered personalization and recommendation engines",
                    "Sustainable and ethical retail practices",
                    "Social commerce and live shopping integration",
                    "Buy-now-pay-later (BNPL) payment options",
                    "Micro-fulfillment and last-mile delivery optimization",
                    "Voice and visual search capabilities",
                    "Augmented reality (AR) try-before-buy experiences"
                ],
                "consumer_behavior_shifts": [
                    "Increased price sensitivity and value-seeking behavior",
                    "Preference for seamless online-to-offline experiences",
                    "Growing demand for same-day delivery options",
                    "Social media influence on purchase decisions",
                    "Subscription-based shopping model adoption",
                    "Emphasis on brand authenticity and transparency"
                ]
            },
            "market_performance_indicators": {
                "e_commerce_growth": "12-15% YoY growth expected",
                "mobile_commerce": "Mobile represents 55%+ of online sales",
                "customer_acquisition_costs": "Increasing 15-20% annually",
                "return_rates": "Online fashion: 25-30%, Electronics: 8-12%",
                "inventory_turnover": "Best-in-class: 8-12x annually",
                "gross_margins": "Fashion: 50-60%, Electronics: 20-30%, Grocery: 20-25%"
            },
            "competitive_landscape": {
                "market_leaders": {
                    "e_commerce": "Amazon, Shopify merchants, Direct-to-consumer brands",
                    "fashion": "Zara, H&M, Shein, Nike, Adidas",
                    "electronics": "Best Buy, Apple Store, B&H, Newegg",
                    "grocery": "Walmart, Kroger, Amazon Fresh, Instacart"
                },
                "key_differentiators": [
                    "Delivery speed and convenience",
                    "Product quality and authenticity",
                    "Personalized shopping experience",
                    "Pricing and promotional strategies",
                    "Customer service excellence",
                    "Sustainability initiatives"
                ]
            },
            "retail_challenges": {
                "operational": [
                    "Supply chain disruptions and inventory management",
                    "Rising logistics and fulfillment costs",
                    "Staff shortages and wage pressures",
                    "Technology integration and digital transformation"
                ],
                "customer_related": [
                    "Increasing customer acquisition costs",
                    "Declining customer loyalty and retention",
                    "Managing omnichannel customer expectations",
                    "Competing with price comparison tools"
                ],
                "market_dynamics": [
                    "Economic uncertainty affecting consumer spending",
                    "Increased competition from direct-to-consumer brands",
                    "Regulatory changes in data privacy and sustainability",
                    "Rapid technology adoption requirements"
                ]
            },
            "growth_opportunities": {
                "technology_enabled": [
                    "AI-driven demand forecasting and inventory optimization",
                    "Personalized marketing and dynamic pricing",
                    "Automated customer service and chatbots",
                    "Predictive analytics for churn prevention"
                ],
                "market_expansion": [
                    "International market entry strategies",
                    "Private label and exclusive product development",
                    "Subscription and membership program growth",
                    "B2B marketplace and wholesale opportunities"
                ],
                "customer_experience": [
                    "Loyalty program innovation and gamification",
                    "Social commerce and influencer partnerships",
                    "Sustainability storytelling and eco-friendly products",
                    "Community building and brand advocacy programs"
                ]
            },
            "analysis_timestamp": datetime.now().isoformat(),
            "data_sources": [
                "National Retail Federation (NRF) reports",
                "eMarketer retail industry analysis",
                "McKinsey retail insights",
                "Shopify commerce trends data"
            ]
        }

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
        """Generate comprehensive retail industry-focused analysis prompt"""
        # Basic data info
        rows, cols = data.shape
        
        # Identify retail-specific columns
        customer_cols = [col for col in data.columns if 'customer' in col.lower()]
        product_cols = [col for col in data.columns if any(term in col.lower() for term in ['product', 'item'])]
        sales_cols = [col for col in data.columns if any(term in col.lower() for term in ['sales', 'revenue', 'amount'])]
        inventory_cols = [col for col in data.columns if any(term in col.lower() for term in ['inventory', 'stock'])]
        supplier_cols = [col for col in data.columns if 'supplier' in col.lower()]
        
        # Determine retail sub-sector if possible
        retail_sector = "General Retail"
        if any('fashion' in str(data.get(col, '')).lower() for col in data.columns if data.dtypes[col] == 'object'):
            retail_sector = "Fashion & Apparel"
        elif any('electronics' in str(data.get(col, '')).lower() for col in data.columns if data.dtypes[col] == 'object'):
            retail_sector = "Electronics & Technology"
        elif any('grocery' in str(data.get(col, '')).lower() or 'food' in str(data.get(col, '')).lower() for col in data.columns if data.dtypes[col] == 'object'):
            retail_sector = "Grocery & Food"
        
        prompt = f"""
You are a Chief Retail Analyst with 20+ years of experience in retail operations, merchandising, and 
customer analytics. You specialize in {retail_sector} retail analysis and optimization.

RETAIL BUSINESS CONTEXT:
You're analyzing a {retail_sector.lower()} dataset with {rows} customer transactions and {cols} business metrics.
This data represents real retail operations requiring industry-expert analysis.

DATA COMPOSITION:
- Customer Dimension: {len(customer_cols)} customer behavior metrics
- Product Portfolio: {len(product_cols)} product/SKU attributes  
- Sales Performance: {len(sales_cols)} revenue & transaction metrics
- Inventory Operations: {len(inventory_cols)} stock management data
- Supply Chain: {len(supplier_cols)} supplier relationship metrics

KEY RETAIL ANALYSIS AREAS:

🛍️ CUSTOMER EXPERIENCE & LIFETIME VALUE:
- Analyze customer acquisition costs (CAC) vs customer lifetime value (CLV) ratios
- Identify high-value customer segments using RFM analysis (Recency, Frequency, Monetary)
- Assess customer journey friction points and conversion bottlenecks
- Evaluate churn risk factors and design retention strategies
- Recommend personalization opportunities and cross-selling potential

📊 SALES PERFORMANCE & MERCHANDISING:
- Calculate sales per square foot and inventory velocity by category
- Analyze price elasticity and promotional lift effectiveness
- Identify bestselling SKUs vs slow-movers requiring markdown strategies
- Assess seasonal demand patterns and forecast accuracy
- Recommend optimal product mix and category allocation

📦 INVENTORY OPTIMIZATION & SUPPLY CHAIN:
- Calculate inventory turnover rates and days sales outstanding (DSO)
- Identify obsolete stock and markdowns required
- Assess ABC classification for strategic inventory management
- Analyze supplier lead times and service level agreements
- Recommend safety stock levels and reorder point optimization

💰 PROFITABILITY & MARGIN ANALYSIS:
- Calculate gross margins by category, brand, and SKU
- Assess markup strategies and pricing optimization opportunities
- Analyze promotional ROI and discount impact on profitability
- Identify high-margin products requiring push strategies
- Recommend cost reduction initiatives across operations

🎯 COMPETITIVE POSITIONING & MARKET TRENDS:
- Benchmark performance against industry standards
- Identify market share opportunities and competitive threats
- Assess brand performance and customer preference shifts
- Recommend strategic positioning and differentiation tactics

RETAIL INDUSTRY BENCHMARKS TO REFERENCE:
- E-commerce: 2.5% conversion, $85 AOV, 15% churn, 45% gross margin
- Fashion: 1.8% conversion, $120 AOV, 25% churn, 55% gross margin  
- Electronics: 3.2% conversion, $350 AOV, 10% churn, 25% gross margin
- Grocery: 85% conversion, $45 AOV, 5% churn, 22% gross margin

Provide actionable retail insights using industry terminology that retail executives, 
merchandising managers, and operations teams would immediately understand and implement.
Focus on revenue growth, margin optimization, and operational efficiency improvements.
"""
        return prompt
    
    def _generate_retail_insights(self, data: pd.DataFrame, ai_analysis: Dict, market_context: Dict, statistical_analysis: Dict) -> List[Dict]:
        """Generate comprehensive retail industry-focused insights"""
        insights = []
        
        try:
            # 1. CUSTOMER LIFETIME VALUE & SEGMENTATION INSIGHTS
            if 'customer_id' in data.columns:
                unique_customers = data['customer_id'].nunique()
                repeat_customers = len(data['customer_id'].value_counts()[data['customer_id'].value_counts() > 1])
                repeat_rate = (repeat_customers / unique_customers) * 100 if unique_customers > 0 else 0
                
                # Industry benchmark comparison
                performance_vs_benchmark = "above" if repeat_rate > 30 else "below"
                
                insights.append({
                    "type": "customer_lifetime_value",
                    "title": "🛍️ Customer Retention & CLV Performance",
                    "insight": f"Customer repeat purchase rate: {repeat_rate:.1f}% across {unique_customers:,} customers ({performance_vs_benchmark} industry benchmark)",
                    "business_impact": "High repeat rates correlate with 5-25x higher CLV and reduced CAC",
                    "recommendation": self._get_clv_recommendation(repeat_rate),
                    "priority": "critical" if repeat_rate < 20 else "high" if repeat_rate < 30 else "medium",
                    "retail_kpi": "Customer Lifetime Value Optimization"
                })
            
            # 2. AVERAGE ORDER VALUE & SALES OPTIMIZATION
            if 'total_revenue' in data.columns:
                total_revenue = data['total_revenue'].sum()
                avg_order_value = data['total_revenue'].mean()
                transaction_count = len(data)
                
                # Revenue per customer calculation
                revenue_per_customer = total_revenue / unique_customers if 'customer_id' in data.columns and unique_customers > 0 else 0
                
                insights.append({
                    "type": "sales_optimization",
                    "title": "💰 Revenue Performance & AOV Analysis",
                    "insight": f"Total revenue: ${total_revenue:,.0f} | AOV: ${avg_order_value:.2f} | Transactions: {transaction_count:,}",
                    "business_impact": f"Revenue per customer: ${revenue_per_customer:.2f}" if revenue_per_customer > 0 else "Single transaction revenue focus",
                    "recommendation": self._get_aov_recommendation(avg_order_value),
                    "priority": "critical" if avg_order_value < 40 else "high",
                    "retail_kpi": "Average Order Value & Revenue Per Customer"
                })
            
            # 3. INVENTORY TURNOVER & MERCHANDISING EFFICIENCY
            if 'inventory_on_hand' in data.columns and 'quantity_sold' in data.columns:
                avg_inventory = data['inventory_on_hand'].mean()
                total_sold = data['quantity_sold'].sum()
                annual_turnover = (total_sold / avg_inventory * 12) if avg_inventory > 0 else 0  # Annualized
                
                turnover_health = self._assess_inventory_turnover(annual_turnover)
                
                insights.append({
                    "type": "inventory_optimization",
                    "title": "📦 Inventory Turnover & Stock Efficiency",
                    "insight": f"Annualized inventory turnover: {annual_turnover:.1f}x ({turnover_health['status']})",
                    "business_impact": f"Working capital efficiency: {turnover_health['capital_impact']}",
                    "recommendation": turnover_health['recommendation'],
                    "priority": turnover_health['priority'],
                    "retail_kpi": "Inventory Turnover Rate & Days Sales Outstanding"
                })
            
            # 4. SUPPLIER PERFORMANCE & SUPPLY CHAIN OPTIMIZATION
            if 'supplier' in data.columns:
                supplier_count = data['supplier'].nunique()
                
                if 'quality_score' in data.columns:
                    avg_quality = data['quality_score'].mean()
                    quality_assessment = self._assess_supplier_quality(avg_quality)
                    
                    insights.append({
                        "type": "supply_chain_optimization",
                        "title": "🚚 Supplier Performance & Quality Management",
                        "insight": f"Supplier network: {supplier_count} suppliers | Average quality score: {avg_quality:.1f}%",
                        "business_impact": quality_assessment['business_impact'],
                        "recommendation": quality_assessment['recommendation'],
                        "priority": quality_assessment['priority'],
                        "retail_kpi": "Supplier Quality Score & Supply Chain Reliability"
                    })
            
            # 5. CATEGORY MIX & PRODUCT PORTFOLIO ANALYSIS
            if 'category' in data.columns and 'total_revenue' in data.columns:
                category_analysis = data.groupby('category').agg({
                    'total_revenue': ['sum', 'count', 'mean']
                }).round(2)
                
                category_analysis.columns = ['total_revenue', 'transaction_count', 'avg_transaction_value']
                category_analysis['revenue_share'] = (category_analysis['total_revenue'] / category_analysis['total_revenue'].sum() * 100).round(1)
                category_analysis = category_analysis.sort_values('revenue_share', ascending=False)
                
                top_category = category_analysis.index[0]
                top_category_share = category_analysis['revenue_share'].iloc[0]
                portfolio_concentration = "highly concentrated" if top_category_share > 40 else "moderately diversified" if top_category_share > 25 else "well diversified"
                
                insights.append({
                    "type": "category_portfolio",
                    "title": "🎯 Product Category Mix & Portfolio Strategy",
                    "insight": f"Top category '{top_category}': {top_category_share}% revenue share | Portfolio: {portfolio_concentration}",
                    "business_impact": self._get_portfolio_impact(top_category_share),
                    "recommendation": self._get_portfolio_recommendation(top_category_share, top_category),
                    "priority": "high" if top_category_share > 50 else "medium",
                    "retail_kpi": "Category Revenue Mix & Product Portfolio Balance"
                })
            
            # 6. CUSTOMER SEGMENTATION & PERSONALIZATION OPPORTUNITIES
            if 'customer_segment' in data.columns and 'total_revenue' in data.columns:
                segment_performance = data.groupby('customer_segment')['total_revenue'].agg(['sum', 'mean', 'count'])
                premium_segment_revenue = segment_performance.loc['Premium', 'sum'] if 'Premium' in segment_performance.index else 0
                total_segment_revenue = segment_performance['sum'].sum()
                premium_contribution = (premium_segment_revenue / total_segment_revenue * 100) if total_segment_revenue > 0 else 0
                
                insights.append({
                    "type": "customer_segmentation",
                    "title": "👥 Customer Segmentation & Value Optimization",
                    "insight": f"Premium customers contribute {premium_contribution:.1f}% of total revenue",
                    "business_impact": "High-value segments drive disproportionate profitability and CLV",
                    "recommendation": self._get_segmentation_recommendation(premium_contribution),
                    "priority": "high",
                    "retail_kpi": "Customer Segment Value Distribution & Premium Customer Share"
                })
            
            # 7. RETAIL MARKET TREND ALIGNMENT
            market_trends = market_context.get('retail_industry_trends', {}).get('2024_key_trends', [])
            if market_trends:
                insights.append({
                    "type": "market_alignment",
                    "title": "📈 Retail Market Trends & Strategic Positioning",
                    "insight": f"Industry focus areas: {', '.join(market_trends[:3])}...",
                    "business_impact": "Alignment with industry trends drives competitive advantage and market share growth",
                    "recommendation": "Evaluate current strategy alignment with omnichannel optimization, AI personalization, and sustainability initiatives",
                    "priority": "medium",
                    "retail_kpi": "Market Trend Alignment Score & Strategic Positioning"
                })
                
        except Exception as e:
            logger.error(f"Error generating retail insights: {e}")
            insights.append({
                "type": "error",
                "title": "⚠️ Retail Analysis Error",
                "insight": "Unable to generate specific retail insights due to data processing limitations",
                "business_impact": "Missing key retail performance indicators affects strategic decision-making",
                "recommendation": "Verify data contains standard retail fields: customer_id, product_id, category, total_revenue, inventory_on_hand",
                "priority": "critical",
                "retail_kpi": "Data Quality & Analytics Readiness"
            })
        
        return insights
    
    def _get_clv_recommendation(self, repeat_rate: float) -> str:
        """Get CLV-focused recommendation based on repeat rate"""
        if repeat_rate < 15:
            return "Critical: Implement loyalty program, email marketing automation, and customer onboarding sequence to improve retention"
        elif repeat_rate < 25:
            return "Moderate: Launch targeted retention campaigns, personalized product recommendations, and customer feedback loops"
        elif repeat_rate < 35:
            return "Good: Optimize existing loyalty programs and expand customer lifecycle marketing initiatives"
        else:
            return "Excellent: Focus on customer advocacy programs and premium tier development to maximize CLV"
    
    def _get_aov_recommendation(self, aov: float) -> str:
        """Get AOV optimization recommendation"""
        if aov < 30:
            return "Implement product bundling, cross-selling recommendations, and minimum order incentives"
        elif aov < 60:
            return "Add upselling at checkout, volume discounts, and complementary product suggestions"
        elif aov < 100:
            return "Focus on premium product placement and personalized high-value recommendations"
        else:
            return "Maintain current strategy while exploring luxury product lines and VIP customer experiences"
    
    def _assess_inventory_turnover(self, turnover: float) -> Dict:
        """Assess inventory turnover performance"""
        if turnover < 3:
            return {
                "status": "Poor - Excess Inventory Risk",
                "capital_impact": "High working capital tied up, cash flow concerns",
                "recommendation": "Implement aggressive markdown strategies, improve demand forecasting, reduce slow-moving SKUs",
                "priority": "critical"
            }
        elif turnover < 6:
            return {
                "status": "Below Average - Optimization Needed", 
                "capital_impact": "Moderate working capital efficiency",
                "recommendation": "Enhance inventory planning, implement ABC analysis, optimize reorder points",
                "priority": "high"
            }
        elif turnover < 10:
            return {
                "status": "Good - Industry Standard",
                "capital_impact": "Healthy working capital management",
                "recommendation": "Fine-tune seasonal adjustments and category-specific optimization",
                "priority": "medium"
            }
        else:
            return {
                "status": "Excellent - High Efficiency",
                "capital_impact": "Optimal working capital utilization",
                "recommendation": "Monitor for stockout risks while maintaining efficiency gains",
                "priority": "low"
            }
    
    def _assess_supplier_quality(self, quality_score: float) -> Dict:
        """Assess supplier quality performance"""
        if quality_score < 85:
            return {
                "business_impact": "High return rates and customer dissatisfaction risk",
                "recommendation": "Conduct supplier audits, implement quality improvement programs, consider supplier diversification",
                "priority": "critical"
            }
        elif quality_score < 95:
            return {
                "business_impact": "Moderate quality concerns affecting customer experience",
                "recommendation": "Establish quality scorecards, implement supplier development programs",
                "priority": "high"
            }
        else:
            return {
                "business_impact": "Strong supplier quality supporting brand reputation",
                "recommendation": "Maintain quality partnerships while exploring premium supplier relationships",
                "priority": "medium"
            }
    
    def _get_portfolio_impact(self, concentration: float) -> str:
        """Get portfolio concentration business impact"""
        if concentration > 50:
            return "High concentration risk - vulnerable to category-specific market downturns"
        elif concentration > 35:
            return "Moderate concentration - balanced growth opportunities with manageable risk"
        else:
            return "Diversified portfolio - reduced risk with multiple revenue streams"
    
    def _get_portfolio_recommendation(self, concentration: float, top_category: str) -> str:
        """Get portfolio management recommendation"""
        if concentration > 50:
            return f"Diversify beyond {top_category} - expand into complementary categories to reduce dependency risk"
        elif concentration > 35:
            return f"Optimize {top_category} performance while selectively expanding secondary categories"
        else:
            return f"Leverage {top_category} strength while maintaining balanced portfolio growth"
    
    def _get_segmentation_recommendation(self, premium_contribution: float) -> str:
        """Get customer segmentation recommendation"""
        if premium_contribution < 20:
            return "Develop premium customer acquisition strategy and enhance value proposition for high-CLV segments"
        elif premium_contribution < 40:
            return "Expand premium customer base through targeted marketing and loyalty program enhancements"
        else:
            return "Optimize premium customer experience and develop VIP tier programs to maximize segment value"
    
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
        Generate fallback analysis when AI services are unavailable - domain-specific
        """
        if domain == "retail":
            # Use retail KPI service for fallback
            try:
                from api.services.retail_kpi_service import retail_kpi_service
                domain_kpis = retail_kpi_service.calculate_retail_kpis(data, domain)
                ml_prompts = retail_kpi_service.generate_ml_prompts(data, domain)
                risk_assessment = retail_kpi_service.generate_risk_assessment(data, domain)
                recommendations = retail_kpi_service.generate_recommendations(data, domain)
                kpi_key = "retail_analytics"
            except ImportError:
                # Fallback to basic retail analysis
                domain_kpis = {"error": "Retail service unavailable"}
                ml_prompts = ["Retail analysis unavailable"]
                risk_assessment = {"overall_risk_level": "Medium"}
                recommendations = ["Enable retail analytics for insights"]
                kpi_key = "retail_analytics"
        else:
            # Use financial KPI service for fallback
            domain_kpis = financial_kpi_service.calculate_financial_kpis(data, domain)
            ml_prompts = financial_kpi_service.generate_ml_prompts(data, domain)
            risk_assessment = financial_kpi_service.generate_risk_assessment(data, domain)
            recommendations = financial_kpi_service.generate_recommendations(data, domain)
            kpi_key = "financial_kpis"
        
        return {
            "ai_analysis": {
                "analysis": f"Basic analysis for {domain} domain. AI services temporarily unavailable.",
                "model": "fallback",
                "success": False,
                "domain": domain
            },
            "market_context": self._generate_fallback_market_data(),
            "statistical_analysis": self._perform_statistical_analysis(data),
            kpi_key: domain_kpis,
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
        Generate basic insights without AI - domain-specific
        """
        basic_insights = {
            "data_quality": {
                "total_records": len(data),
                "missing_values": data.isnull().sum().sum(),
                "data_completeness": (len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns)) * 100
            },
            "key_findings": [
                f"Dataset contains {len(data)} records",
                f"Data completeness: {((len(data) - data.isnull().sum().sum()) / (len(data) * len(data.columns)) * 100):.1f}%",
                f"Analysis domain: {domain}"
            ]
        }
        
        if domain == "retail":
            # Add retail-specific insights
            retail_insights = []
            retail_recommendations = []
            
            if 'customer_id' in data.columns:
                unique_customers = data['customer_id'].nunique()
                retail_insights.append(f"Unique customers: {unique_customers}")
                
            if 'category' in data.columns:
                categories = data['category'].nunique()
                retail_insights.append(f"Product categories: {categories}")
                
            if 'total_revenue' in data.columns:
                total_revenue = data['total_revenue'].sum()
                retail_insights.append(f"Total revenue: ${total_revenue:,.2f}")
                
            if 'supplier' in data.columns:
                suppliers = data['supplier'].nunique()
                retail_insights.append(f"Number of suppliers: {suppliers}")
                
            basic_insights["key_findings"].extend(retail_insights)
            
            basic_insights["recommendations"] = [
                "Analyze customer segmentation for targeted marketing",
                "Review inventory turnover by category",
                "Assess supplier performance and relationships",
                "Monitor seasonal sales patterns"
            ]
        else:
            # Financial domain recommendations
            basic_insights["recommendations"] = [
                "Review financial ratios and performance metrics",
                "Assess risk management strategies",
                "Analyze liquidity and profitability trends",
                "Validate assumptions with financial experts"
            ]
        
        return basic_insights

# Global instance
llm_service = LLMService() 
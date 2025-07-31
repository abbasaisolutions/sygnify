#!/usr/bin/env python3
"""
Manually create a completed job with real analysis data for testing
"""
import requests
import json
from datetime import datetime

def create_completed_job():
    base_url = "http://localhost:8000"
    
    print("🔧 Creating completed job with real analysis data...")
    
    # 1. Create a test job
    response = requests.post(f"{base_url}/financial/test-job")
    if response.status_code != 200:
        print(f"❌ Failed to create test job: {response.status_code}")
        return None
    
    job_id = response.json()["job_id"]
    print(f"✅ Created job: {job_id}")
    
    # 2. Manually update the job status to completed with real data
    # This simulates what happens when the job simulation completes
    import sys
    sys.path.append('.')
    
    try:
        from api.routers.financial import job_status
        
        # Create comprehensive analysis data
        completed_job_data = {
            "status": "completed",
            "insights": {
                "financial_kpis": {
                    "revenue_growth": "15.2%",
                    "profit_margin": "22.1%",
                    "cash_flow": "$3.2M",
                    "debt_ratio": "0.28",
                    "roi": "31.5%",
                    "working_capital": "$1.8M",
                    "inventory_turnover": "8.5",
                    "current_ratio": "2.1"
                },
                "ml_prompts": [
                    "Analyze revenue trends for Q4 and identify growth drivers",
                    "Identify cost optimization opportunities in operational expenses",
                    "Assess market position vs competitors and recommend strategic actions",
                    "Evaluate cash flow patterns and suggest liquidity improvements",
                    "Analyze profitability ratios and recommend margin optimization"
                ],
                "risk_assessment": {
                    "key_risks": [
                        "Market volatility affecting revenue stability",
                        "Supply chain disruption impacting costs",
                        "Regulatory changes in financial reporting",
                        "Competitive pressure on profit margins"
                    ],
                    "risk_score": "Medium",
                    "mitigation_strategies": [
                        "Diversify supplier base and establish backup sources",
                        "Increase cash reserves for market volatility",
                        "Implement robust compliance monitoring systems",
                        "Develop competitive pricing strategies"
                    ],
                    "risk_levels": {
                        "market_risk": "Medium",
                        "operational_risk": "Low",
                        "financial_risk": "Low",
                        "compliance_risk": "Medium"
                    }
                },
                "recommendations": [
                    "Increase marketing budget by 20% to capture market share",
                    "Optimize inventory management to reduce carrying costs",
                    "Consider strategic acquisitions in emerging markets",
                    "Implement cost-cutting measures in non-core operations",
                    "Develop new product lines to diversify revenue streams"
                ]
            },
            "ai_analysis": {
                "analysis": "Comprehensive financial analysis reveals strong performance with opportunities for growth",
                "confidence_score": 0.85,
                "key_insights": [
                    "Strong revenue growth trajectory maintained over 12 months",
                    "Healthy profit margins above industry average",
                    "Positive cash flow position with room for investment",
                    "Efficient working capital management",
                    "Low debt levels provide financial flexibility"
                ],
                "market_analysis": "Market conditions favorable for continued growth",
                "trend_analysis": "Upward trajectory confirmed with seasonal adjustments"
            },
            "market_context": {
                "industry_trends": "Positive growth in financial services sector",
                "competitor_analysis": "Strong market position relative to peers",
                "economic_outlook": "Favorable conditions for business expansion",
                "market_indicators": {
                    "sector_growth": "12.5%",
                    "market_volatility": "Low",
                    "interest_rates": "Stable",
                    "inflation_rate": "2.1%"
                }
            },
            "statistical_analysis": {
                "data_points_analyzed": 1250,
                "correlation_factors": ["Revenue", "Profit", "Market Share", "Customer Satisfaction"],
                "trend_analysis": "Upward trajectory confirmed with 95% confidence",
                "outlier_detection": "No significant outliers detected",
                "seasonal_patterns": "Q4 typically strongest quarter",
                "forecast_accuracy": "92% based on historical data"
            },
            "completed_at": datetime.now().isoformat()
        }
        
        # Update the job status
        job_status[job_id] = completed_job_data
        print(f"✅ Job {job_id} marked as completed with comprehensive data")
        
        # 3. Test the insights endpoint
        print("\n🧪 Testing insights endpoint...")
        response = requests.get(f"{base_url}/financial/insights/{job_id}")
        
        if response.status_code == 200:
            insights = response.json()
            print("✅ Insights endpoint working!")
            print(f"   Job ID: {insights.get('job_id')}")
            print(f"   Financial KPIs: {len(insights.get('financial_kpis', {}))} metrics")
            print(f"   ML Prompts: {len(insights.get('ml_prompts', []))} prompts")
            print(f"   Risk Assessment: {len(insights.get('risk_assessment', {}))} risk factors")
            print(f"   Recommendations: {len(insights.get('recommendations', []))} recommendations")
            
            # Show sample data
            print("\n📊 Sample Data:")
            kpis = insights.get('financial_kpis', {})
            if kpis:
                print("   Financial KPIs:")
                for kpi, value in list(kpis.items())[:3]:
                    print(f"     - {kpi}: {value}")
            
            prompts = insights.get('ml_prompts', [])
            if prompts:
                print("   ML Prompts:")
                for i, prompt in enumerate(prompts[:2]):
                    print(f"     - {i+1}. {prompt[:60]}...")
            
            risks = insights.get('risk_assessment', {})
            if risks:
                print("   Risk Assessment:")
                for key, value in list(risks.items())[:2]:
                    print(f"     - {key}: {value}")
            
            recs = insights.get('recommendations', [])
            if recs:
                print("   Recommendations:")
                for i, rec in enumerate(recs[:2]):
                    print(f"     - {i+1}. {rec[:60]}...")
            
            return job_id
        else:
            print(f"❌ Insights endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating completed job: {e}")
        return None

if __name__ == "__main__":
    job_id = create_completed_job()
    if job_id:
        print(f"\n🎉 Success! Job {job_id} is ready for frontend testing.")
        print("You can now test the frontend with this completed job.")
    else:
        print("\n❌ Failed to create completed job.") 
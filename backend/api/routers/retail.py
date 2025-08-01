"""
Retail Analytics Router for Sygnify Analytics Platform
Retail-specific data processing, KPI calculation, and AI analysis
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
import pandas as pd
import json
import logging
from typing import Dict, Optional, List
from datetime import datetime
import asyncio

# Import services
from api.services.llm_service import llm_service
from api.services.data_quality_service import data_quality_service
from api.services.job_simulation_service import job_simulator
from api.services.retail_kpi_service import retail_kpi_service

# Import retail domain modules
from retail import CustomerAnalyzer, RetailKPICalculator, RetailError, DataValidationError
from retail.performance_optimizer import (
    cached_operation, monitor_performance, optimize_retail_dataframe, 
    get_performance_report, DataFrameOptimizer
)
from retail.error_handler import safe_execute, create_error_response

# Import global job status manager
from ..job_status_manager import job_status_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["retail"])

# Initialize retail analyzers
customer_analyzer = CustomerAnalyzer()
retail_kpi_calculator = RetailKPICalculator()

@router.get("/health")
async def health_check():
    """Health check endpoint for retail domain"""
    return {
        "status": "healthy",
        "domain": "🛍️ RETAIL DOMAIN",
        "description": "Retail Analytics Platform - Customer, Sales, Inventory & Supply Chain",
        "timestamp": datetime.now().timestamp(),
        "key_features": [
            "Customer Lifetime Value (CLV) Analysis",
            "RFM Customer Segmentation", 
            "Sales Performance & Conversion Optimization",
            "Inventory Turnover & ABC Analysis",
            "Supply Chain & Supplier Performance",
            "Retail-Specific KPIs & Benchmarks"
        ],
        "endpoints": [
            "/upload",
            "/status/{job_id}",
            "/customer-analysis",
            "/sales-performance", 
            "/inventory-analysis",
            "/retail-insights"
        ]
    }

@router.post("/upload")
async def upload_retail_file(
    file: UploadFile = File(...),
    domain: str = "retail",
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process retail data file with retail-specific analysis
    """
    try:
        # Validate file
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read file content
        content = await file.read()
        
        # Validate file using data quality service
        validation = data_quality_service.validate_file(content, file.filename)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=f"File validation failed: {validation['errors']}")
        
        # Process file with data quality service for retail domain
        processing_result = await data_quality_service.process_file(content, file.filename, domain)
        
        if not processing_result["success"]:
            raise HTTPException(status_code=400, detail=f"File processing failed: {processing_result.get('error', 'Unknown error')}")
        
        # Generate job ID
        job_id = f"retail_job_{int(datetime.now().timestamp() * 1000)}"
        
        # Store job information
        job_status_manager.create_job(job_id, domain)
        job_status_manager.update_job(job_id, 
            filename=file.filename,
            domain=domain,
            file_info=processing_result["file_info"],
            quality_report=processing_result["quality_report"],
            timestamp=datetime.now().isoformat()
        )
        
        # Start background retail analysis if data is available
        if "data" in processing_result and processing_result["data"]:
            data_df = pd.DataFrame(processing_result["data"])
            
            # Start retail-specific AI analysis in background
            if background_tasks:
                background_tasks.add_task(
                    perform_retail_analysis,
                    job_id,
                    data_df,
                    domain
                )
        
        return JSONResponse(content={
            "job_id": job_id,
            "status": "processing",
            "domain": domain,
            "filename": file.filename,
            "rows": len(processing_result.get("data", [])),
            "columns": len(processing_result.get("data", [{}])[0].keys()) if processing_result.get("data") else 0,
            "quality_score": processing_result.get("quality_report", {}).get("overall_quality_score", 0),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in retail file upload: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/status/{job_id}")
async def get_retail_job_status(job_id: str):
    """Get status of retail analysis job"""
    try:
        job_info = job_status_manager.get_job(job_id)
        if not job_info:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return JSONResponse(content=job_info)
        
    except Exception as e:
        logger.error(f"Error getting retail job status: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/customer-analysis")
@monitor_performance("customer_analysis")
async def analyze_customers(
    data: Dict,
    background_tasks: BackgroundTasks = None
):
    """
    Perform customer analytics on retail data with performance optimization
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data.get("records", []))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided for analysis")
        
        # Optimize DataFrame for performance
        df_optimized = optimize_retail_dataframe(df)
        
        # Perform customer analysis with error handling
        def _analyze_customers():
            clv_analysis = customer_analyzer.calculate_clv(df_optimized)
            rfm_analysis = customer_analyzer.perform_rfm_analysis(df_optimized)
            churn_analysis = customer_analyzer.analyze_customer_churn(df_optimized)
            recommendations = customer_analyzer.generate_recommendations(df_optimized)
            
            return {
                "customer_lifetime_value": clv_analysis,
                "rfm_segmentation": rfm_analysis,
                "churn_analysis": churn_analysis,
                "recommendations": recommendations,
                "data_optimization": df_optimized.attrs.get('column_mapping', {}),
                "performance_metrics": {
                    "original_memory_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
                    "optimized_memory_mb": df_optimized.memory_usage(deep=True).sum() / 1024 / 1024
                },
                "timestamp": datetime.now().isoformat()
            }
        
        result = safe_execute(
            _analyze_customers,
            error_context="customer_analysis_endpoint"
        )
        
        # Handle error responses
        if isinstance(result, dict) and result.get('error'):
            raise HTTPException(
                status_code=422, 
                detail=f"Customer analysis failed: {result.get('message', 'Unknown error')}"
            )
        
        return JSONResponse(content=result)
        
    except RetailError as e:
        logger.error(f"Retail error in customer analysis: {e}")
        raise HTTPException(status_code=422, detail=f"Retail analysis error: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error in customer analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Customer analysis failed: {str(e)}")

@router.post("/retail-insights")
async def generate_retail_insights(
    data: Dict,
    domain: str = "retail"
):
    """
    Generate comprehensive retail insights using AI analysis
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(data.get("records", []))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided for analysis")
        
        # Calculate comprehensive retail KPIs
        retail_analytics = retail_kpi_service.calculate_retail_kpis(df, domain)
        
        # Perform AI analysis with retail context
        ai_analysis = await llm_service.analyze_retail_data(df, domain)  # Use retail-specific analysis
        
        # Generate recommendations and risk assessment
        recommendations = retail_kpi_service.generate_recommendations(df, domain)
        risk_assessment = retail_kpi_service.generate_risk_assessment(df, domain)
        
        # Combine results
        insights = {
            "retail_analytics": retail_analytics,
            "ai_analysis": ai_analysis,
            "recommendations": recommendations,
            "risk_assessment": risk_assessment,
            "domain": domain,
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(content=insights)
        
    except Exception as e:
        logger.error(f"Error generating retail insights: {e}")
        raise HTTPException(status_code=500, detail=f"Retail insights generation failed: {str(e)}")

@router.post("/sales-performance")
async def analyze_sales_performance(data: Dict):
    """Analyze sales performance metrics"""
    try:
        df = pd.DataFrame(data.get("records", []))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided for analysis")
        
        sales_kpis = retail_kpi_calculator.calculate_sales_kpis(df)
        
        return JSONResponse(content={
            "sales_performance": sales_kpis,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in sales performance analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Sales analysis failed: {str(e)}")

@router.post("/inventory-analysis")
async def analyze_inventory(data: Dict):
    """Analyze inventory management metrics"""
    try:
        df = pd.DataFrame(data.get("records", []))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided for analysis")
        
        inventory_kpis = retail_kpi_calculator.calculate_inventory_kpis(df)
        
        return JSONResponse(content={
            "inventory_analysis": inventory_kpis,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in inventory analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Inventory analysis failed: {str(e)}")

@router.get("/performance-report")
async def get_retail_performance_report():
    """
    Get comprehensive performance report for retail operations
    """
    try:
        performance_data = get_performance_report()
        return JSONResponse(content={
            "performance_report": performance_data,
            "timestamp": datetime.now().isoformat(),
            "system_status": "healthy"
        })
    except Exception as e:
        logger.error(f"Error generating performance report: {e}")
        raise HTTPException(status_code=500, detail=f"Performance report failed: {str(e)}")

async def perform_retail_analysis(job_id: str, data_df: pd.DataFrame, domain: str):
    """
    Background task to perform comprehensive retail analysis
    """
    try:
        logger.info(f"Starting retail analysis for job: {job_id}")
        
        # Update job status
        job_status_manager.update_job(job_id, status="analyzing", progress=10)
        
        # Calculate comprehensive retail KPIs using retail service
        retail_kpis = retail_kpi_service.calculate_retail_kpis(data_df, domain)
        job_status_manager.update_job(job_id, progress=60)
        
        # Perform AI analysis with retail context
        ai_analysis = await llm_service.analyze_retail_data(data_df, domain)  # Use retail-specific analysis
        job_status_manager.update_job(job_id, progress=80)
        
        # Generate retail-specific recommendations
        recommendations = retail_kpi_service.generate_recommendations(data_df, domain)
        risk_assessment = retail_kpi_service.generate_risk_assessment(data_df, domain)
        
        # Compile final results
        analysis_results = {
            "retail_analytics": retail_kpis,
            "ai_insights": ai_analysis,
            "recommendations": recommendations,
            "risk_assessment": risk_assessment,
            "domain": domain,
            "analysis_type": "comprehensive_retail_analysis"
        }
        
        # Update job with final results
        job_status_manager.update_job(
            job_id,
            status="completed",
            progress=100,
            analysis_results=analysis_results
        )
        
        logger.info(f"Retail analysis completed for job: {job_id}")
        
    except Exception as e:
        logger.error(f"Error in retail analysis for job {job_id}: {e}")
        job_status_manager.update_job(
            job_id,
            status="failed",
            error=str(e)
        )
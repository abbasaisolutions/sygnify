"""
Financial Analytics API Router
- Portfolio analytics endpoints
- Risk management endpoints
- Credit scoring endpoints
- Fraud detection endpoints
- Batch processing endpoints
- Real-time streaming endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, BackgroundTasks
import pandas as pd
import io
from starlette.responses import JSONResponse
from fastapi import status
from backend.models.smartNarrativeGenerator import SmartNarrativeGenerator
import logging
import sweetviz
import os
from fastapi.responses import FileResponse
from functools import lru_cache
import hashlib
import time
import uuid
import threading

# Store last insights in memory for /insights endpoint
last_insights = None

SWEETVIZ_REPORT_PATH = "sweetviz_report.html"

# Simple in-memory cache for processed results
processed_cache = {}
CACHE_TTL = 300  # 5 minutes
cache_timestamps = {}

# In-memory job state store
job_states = {}

STAGES = [
    ("uploading", 10, "Uploading or connecting to your data source..."),
    ("profiling", 40, "Profiling and validating your data..."),
    ("ai_analysis", 80, "Running advanced AI and ML analysis..."),
    ("insights_ready", 100, "Generating insights and dashboards...")
]

def process_job(job_id, file_content=None, connection_info=None):
    global last_insights
    try:
        # Stage 1: Uploading
        job_states[job_id] = {"stage": "uploading", "progress": 10, "message": "Uploading or connecting to your data source..."}
        time.sleep(1)
        
        # Stage 2: Profiling
        job_states[job_id] = {"stage": "profiling", "progress": 40, "message": "Profiling and validating your data..."}
        time.sleep(1)
        
        # Stage 3: AI Analysis
        job_states[job_id] = {"stage": "ai_analysis", "progress": 80, "message": "Running advanced AI and ML analysis..."}
        
        # Actually process the file if provided
        if file_content:
            try:
                file_hash = hashlib.md5(file_content).hexdigest()
                now = time.time()
                
                # Check cache and TTL
                if file_hash in processed_cache and (now - cache_timestamps[file_hash] < CACHE_TTL):
                    last_insights = processed_cache[file_hash]
                else:
                    # Process the file with real ML analysis
                    # Try different encodings to handle various file formats
                    encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
                    df = None
                    
                    for encoding in encodings_to_try:
                        try:
                            # Try with error handling for inconsistent column counts
                            df = pd.read_csv(
                                io.BytesIO(file_content), 
                                encoding=encoding,
                                on_bad_lines='skip'     # Skip bad lines in newer pandas
                            )
                            logging.info(f"Successfully read file with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                        except Exception as e:
                            logging.warning(f"Failed to read with {encoding}: {str(e)}")
                            continue
                    
                    if df is None:
                        raise Exception("Could not read file with any supported encoding")
                    
                    # Clean up the dataframe
                    if df.empty:
                        raise Exception("File appears to be empty after processing")
                    
                    # Remove any completely empty rows or columns
                    df = df.dropna(how='all').dropna(axis=1, how='all')
                    
                    if df.empty:
                        raise Exception("No valid data found in file after cleaning")
                    
                    # Sweetviz analysis (skip for large files)
                    if df.shape[0] > 10000:
                        summary = {
                            "n_rows": df.shape[0],
                            "n_cols": df.shape[1],
                            "missing": int(df.isnull().sum().sum()),
                            "note": "Sweetviz analysis skipped for large files"
                        }
                    else:
                        report = sweetviz.analyze(df)
                        report.show_html(filepath=SWEETVIZ_REPORT_PATH, open_browser=False)
                        summary = {
                            "n_rows": df.shape[0],
                            "n_cols": df.shape[1],
                            "missing": int(df.isnull().sum().sum()),
                            "top_missing_cols": df.isnull().sum().sort_values(ascending=False).head(3).to_dict(),
                            "top_corrs": df.corr(numeric_only=True).abs().unstack().sort_values(ascending=False).drop_duplicates().head(3).to_dict()
                        }
                    
                    # Prepare data_profile and analysis_results for SmartNarrativeGenerator
                    data_profile = {
                        "structure": {
                            "numerical_columns": list(df.select_dtypes(include='number').columns),
                            "shape": df.shape,
                            "missing_values": df.isnull().sum().to_dict(),
                            "patterns": {
                                "distributions": {},
                                "trends": {}
                            },
                            "anomalies": {},
                            "correlations": {"high_correlations": []}
                        },
                        "sweetviz_summary": summary
                    }
                    analysis_results = {col: df[col].dropna().tolist() for col in df.select_dtypes(include='number').columns}
                    
                    # Generate insights with real LLaMA3 (with timeout)
                    try:
                        gen = SmartNarrativeGenerator()
                        external_insights = get_cached_market_insights()
                        insights = gen.generate_comprehensive_narrative(data_profile, analysis_results, external_insights, "finance")
                        last_insights = insights
                        processed_cache[file_hash] = insights
                        cache_timestamps[file_hash] = now
                        logging.info(f"Job {job_id} processed successfully with real ML analysis")
                    except Exception as e:
                        logging.error(f"LLaMA3 processing failed in job {job_id}: {str(e)}")
                        # Create fallback insights
                        fallback_insights = {
                            "key_insights": [
                                {
                                    "category": "Data Quality",
                                    "insight": f"Processed {df.shape[0]} records with {df.shape[1]} columns",
                                    "confidence": 0.9,
                                    "impact": "high"
                                }
                            ],
                            "external_context": external_insights if 'external_insights' in locals() else [],
                            "llama3_narrative": f"Analysis completed with fallback processing. {str(e)}"
                        }
                        last_insights = fallback_insights
                        processed_cache[file_hash] = fallback_insights
                        cache_timestamps[file_hash] = now
                        logging.info(f"Job {job_id} completed with fallback analysis")
                
            except Exception as e:
                logging.error(f"File processing failed in job {job_id}: {str(e)}")
                job_states[job_id] = {"stage": "error", "progress": 0, "message": f"File processing failed: {str(e)}"}
                return
        
        # Stage 4: Insights Ready
        job_states[job_id] = {"stage": "insights_ready", "progress": 100, "message": "Generating insights and dashboards..."}
        time.sleep(1)
        
        # Complete
        job_states[job_id]["stage"] = "done"
        job_states[job_id]["progress"] = 100
        job_states[job_id]["message"] = "Analysis complete."
        
    except Exception as e:
        logging.error(f"Job {job_id} failed: {str(e)}")
        job_states[job_id] = {"stage": "error", "progress": 0, "message": str(e)}

router = APIRouter(prefix="/financial", tags=["Financial Analytics"])

@lru_cache(maxsize=1)
def get_cached_market_insights():
    import pandas as pd
    import yfinance as yf
    market_path = os.path.join(os.path.dirname(__file__), '../../data/market_trends.csv')
    market_df = pd.read_csv(market_path)
    latest = market_df.iloc[-1]
    prev = market_df.iloc[-2] if len(market_df) > 1 else latest
    trend = 'rising' if latest['interest_rate'] > prev['interest_rate'] else 'falling'
    # Live S&P 500 and sector ETF data
    sp500 = yf.Ticker("^GSPC").history(period="1mo")
    sp500_close = sp500['Close'].iloc[-1] if not sp500.empty else None
    sector_etf = yf.Ticker("XLF").history(period="1mo")  # Financial sector ETF
    sector_close = sector_etf['Close'].iloc[-1] if not sector_etf.empty else None
    live_market = []
    if sp500_close:
        live_market.append({
            'summary': f"S&P 500 latest close: {sp500_close:.2f}",
            'impact': "market sentiment, portfolio value",
            'title': "Live Market Update"
        })
    if sector_close:
        live_market.append({
            'summary': f"Financial Sector ETF (XLF) latest close: {sector_close:.2f}",
            'impact': "sector performance, financial stocks",
            'title': "Sector Performance"
        })
    macro = [
        {
            'summary': f"Interest rate is {latest['interest_rate']}% ({trend}), inflation is {latest['inflation']}%. Sector index: {latest['sector_index']}, volatility: {latest['market_volatility']}",
            'impact': "borrowing costs, purchasing power, market sentiment",
            'title': "Macroeconomic Update"
        },
        {
            'summary': f"Market volatility is {latest['market_volatility']*100:.1f}%. High volatility may indicate increased risk or opportunity.",
            'impact': "portfolio risk, hedging strategies",
            'title': "Market Volatility"
        }
    ]
    return live_market + macro

@router.get("/portfolio")
def get_portfolio_analytics():
    """Stub for portfolio analytics endpoint."""
    return {"message": "Portfolio analytics endpoint not yet implemented."}

@router.get("/risk")
def get_risk_management():
    """Stub for risk management endpoint."""
    return {"message": "Risk management endpoint not yet implemented."}

@router.get("/credit")
def get_credit_scoring():
    """Stub for credit scoring endpoint."""
    return {"message": "Credit scoring endpoint not yet implemented."}

@router.get("/fraud")
def get_fraud_detection():
    """Stub for fraud detection endpoint."""
    return {"message": "Fraud detection endpoint not yet implemented."}

@router.post("/upload")
def upload_and_analyze_file(file: UploadFile = File(...)):
    """
    Upload a CSV file and run enhanced financial analysis with sweetviz profiling.
    """
    global last_insights
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    try:
        contents = file.file.read()
        file_hash = hashlib.md5(contents).hexdigest()
        now = time.time()
        # Check cache and TTL
        if file_hash in processed_cache and (now - cache_timestamps[file_hash] < CACHE_TTL):
            return processed_cache[file_hash]
        
        # Try different encodings to handle various file formats
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        
        for encoding in encodings_to_try:
            try:
                # Try with error handling for inconsistent column counts
                df = pd.read_csv(
                    io.BytesIO(contents), 
                    encoding=encoding,
                    on_bad_lines='skip'     # Skip bad lines in newer pandas
                )
                logging.info(f"Successfully read file with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logging.warning(f"Failed to read with {encoding}: {str(e)}")
                continue
        
        if df is None:
            raise Exception("Could not read file with any supported encoding")
        
        # Clean up the dataframe
        if df.empty:
            raise Exception("File appears to be empty after processing")
        
        # Remove any completely empty rows or columns
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        if df.empty:
            raise Exception("No valid data found in file after cleaning")
        # Sweetviz analysis (skip for large files)
        if df.shape[0] > 10000:
            summary = {
                "n_rows": df.shape[0],
                "n_cols": df.shape[1],
                "missing": int(df.isnull().sum().sum()),
                "note": "Sweetviz analysis skipped for large files"
            }
        else:
            report = sweetviz.analyze(df)
            report.show_html(filepath=SWEETVIZ_REPORT_PATH, open_browser=False)
            summary = {
                "n_rows": df.shape[0],
                "n_cols": df.shape[1],
                "missing": int(df.isnull().sum().sum()),
                "top_missing_cols": df.isnull().sum().sort_values(ascending=False).head(3).to_dict(),
                "top_corrs": df.corr(numeric_only=True).abs().unstack().sort_values(ascending=False).drop_duplicates().head(3).to_dict()
            }
        # Prepare data_profile and analysis_results for SmartNarrativeGenerator
        data_profile = {
            "structure": {
                "numerical_columns": list(df.select_dtypes(include='number').columns),
                "shape": df.shape,
                "missing_values": df.isnull().sum().to_dict(),
                "patterns": {
                    "distributions": {},
                    "trends": {}
                },
                "anomalies": {},
                "correlations": {"high_correlations": []}
            },
            "sweetviz_summary": summary
        }
        analysis_results = {col: df[col].dropna().tolist() for col in df.select_dtypes(include='number').columns}
        gen = SmartNarrativeGenerator()
        external_insights = get_cached_market_insights()
        insights = gen.generate_comprehensive_narrative(data_profile, analysis_results, external_insights, "finance")
        last_insights = insights
        processed_cache[file_hash] = insights
        cache_timestamps[file_hash] = now
        logging.info(f"UPLOAD RESPONSE: {insights}")
        return insights
    except Exception as e:
        logging.error(f"Upload analysis failed: {str(e)}")
        return JSONResponse({
            "status": "error",
            "message": f"Failed to process file: {str(e)}"
        }, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get("/sweetviz-report")
def get_sweetviz_report():
    """
    Serve the latest Sweetviz HTML report.
    """
    if os.path.exists(SWEETVIZ_REPORT_PATH):
        return FileResponse(SWEETVIZ_REPORT_PATH, media_type="text/html")
    else:
        raise HTTPException(status_code=404, detail="Sweetviz report not found.")

@router.post("/subscription/create-checkout-session")
def create_checkout_session():
    """
    Create a mock subscription checkout session (stub implementation).
    """
    # TODO: Integrate with real payment/subscription service
    return {"id": "mock_session_id", "message": "Mock subscription created"}

@router.get("/subscription/status")
def get_subscription_status():
    """
    Get the current user's subscription status (stub implementation).
    """
    # TODO: Query user subscription status from database
    return {"status": "inactive"}

@router.get("/results")
def get_analysis_results():
    """
    Fetch recent analysis results (stub implementation).
    """
    # TODO: Query database for analysis results
    return {
        "results": [
            {"label": "Portfolio Analysis", "narrative": "No insights available", "insights": []}
        ]
    }

@router.get("/insights")
def get_analysis_insights():
    """
    Fetch recent analysis insights (returns last generated insights).
    """
    global last_insights
    if last_insights is not None:
        return last_insights
    return {"insights": []}

@router.post("/clear-cache")
def clear_cache(file_hash: str = Body(..., embed=True)):
    if file_hash in processed_cache:
        del processed_cache[file_hash]
        del cache_timestamps[file_hash]
        return {"status": "success", "message": "Cache cleared."}
    return {"status": "error", "message": "No cache found for this file hash."}

@router.post("/start-job")
def start_job(background_tasks: BackgroundTasks, file: UploadFile = File(None), connection_info: dict = None):
    job_id = str(uuid.uuid4())
    job_states[job_id] = {"stage": "pending", "progress": 0, "message": "Job created."}
    
    # Read file content before passing to background task
    file_content = None
    if file:
        file_content = file.file.read()
        file.file.seek(0)  # Reset file pointer for potential future reads
    
    background_tasks.add_task(process_job, job_id, file_content, connection_info)
    return {"job_id": job_id}

@router.get("/status/{job_id}")
def get_job_status(job_id: str):
    state = job_states.get(job_id)
    if not state:
        return {"stage": "not_found", "progress": 0, "message": "Job not found."}
    return state

# TODO: Add batch processing and real-time streaming endpoints 
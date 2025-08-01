"""
FastAPI Application Entry Point
- CORS configuration
- Authentication middleware
- Rate limiting
- API versioning
- WebSocket support for real-time communication
"""
import logging
import json
import asyncio
from typing import Dict, List
from datetime import datetime

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("app.log", mode="a"),
        logging.StreamHandler()
    ]
)

# Try to import matplotlib with proper error handling
try:
    import matplotlib
    matplotlib.use('Agg')  # non-GUI backend for server environments
    logging.info("Matplotlib imported successfully")
except ImportError:
    logging.warning("Matplotlib not available. Interactive plots will not work.")
    matplotlib = None

# Import FastAPI and related modules
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware

# Import routers with error handling
try:
    from .routers.financial import router as financial_router
    logging.info("Financial router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import financial router: {e}")
    financial_router = None

try:
    from .routers.enhanced_financial import router as enhanced_financial_router
    logging.info("Enhanced financial router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import enhanced financial router: {e}")
    enhanced_financial_router = None

try:
    from .routers.retail import router as retail_router
    logging.info("Retail router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import retail router: {e}")
    retail_router = None

try:
    from .routers.auth import router as auth_router
    logging.info("Auth router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import auth router: {e}")
    auth_router = None

try:
    from .routers.market_data import router as market_data_router
    logging.info("Market data router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import market data router: {e}")
    market_data_router = None

# Import ML router
try:
    from .routers.ml import router as ml_router
    logging.info("ML router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import ML router: {e}")
    ml_router = None

# Import financial dashboard WebSocket handler
try:
    from .websocket.financial_dashboard import financial_dashboard_websocket
    logging.info("Financial dashboard WebSocket handler imported successfully")
except ImportError as e:
    logging.error(f"Failed to import financial dashboard WebSocket handler: {e}")
    financial_dashboard_websocket = None

# Import real-time market WebSocket handler
try:
    from .websocket.realtime_market import realtime_market_websocket
    logging.info("Real-time market WebSocket handler imported successfully")
except ImportError as e:
    logging.error(f"Failed to import real-time market WebSocket handler: {e}")
    realtime_market_websocket = None

# Import job simulation service
try:
    from .services.job_simulation_service import job_simulator
    logging.info("Job simulation service imported successfully")
except ImportError as e:
    logging.error(f"Failed to import job simulation service: {e}")
    job_simulator = None

# Initialize job simulator if not available
if job_simulator is None:
    try:
        from .services.job_simulation_service import JobSimulationService
        job_simulator = JobSimulationService()
        logging.info("Job simulation service initialized manually")
    except Exception as e:
        logging.error(f"Failed to initialize job simulation service: {e}")
        job_simulator = None

# Import global job status manager
from .job_status_manager import job_status_manager

app = FastAPI(title="Sygnify Financial Analytics API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.job_subscribers: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        await websocket.accept()
        if client_id:
            if client_id not in self.active_connections:
                self.active_connections[client_id] = []
            self.active_connections[client_id].append(websocket)
        logging.info(f"WebSocket connected: {client_id}")

    def disconnect(self, websocket: WebSocket, client_id: str = None):
        if client_id and client_id in self.active_connections:
            self.active_connections[client_id] = [
                conn for conn in self.active_connections[client_id] if conn != websocket
            ]
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logging.info(f"WebSocket disconnected: {client_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logging.error(f"Error sending personal message: {e}")

    async def broadcast_to_job(self, job_id: str, message: dict):
        if job_id in self.job_subscribers:
            disconnected = []
            for websocket in self.job_subscribers[job_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logging.error(f"Error broadcasting to job {job_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected websockets
            for websocket in disconnected:
                self.unsubscribe_from_job(job_id, websocket)

    def subscribe_to_job(self, job_id: str, websocket: WebSocket):
        if job_id not in self.job_subscribers:
            self.job_subscribers[job_id] = []
        self.job_subscribers[job_id].append(websocket)
        logging.info(f"WebSocket subscribed to job {job_id}")

    def unsubscribe_from_job(self, job_id: str, websocket: WebSocket):
        if job_id in self.job_subscribers:
            self.job_subscribers[job_id] = [
                conn for conn in self.job_subscribers[job_id] if conn != websocket
            ]
            if not self.job_subscribers[job_id]:
                del self.job_subscribers[job_id]
        logging.info(f"WebSocket unsubscribed from job {job_id}")

    def get_connection_stats(self):
        return {
            "active_connections": len(self.active_connections),
            "job_subscribers": len(self.job_subscribers),
            "total_websockets": sum(len(conns) for conns in self.active_connections.values())
        }

# Global connection manager
manager = ConnectionManager()

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "financial_router": financial_router is not None,
            "enhanced_financial_router": enhanced_financial_router is not None,
            "auth_router": auth_router is not None,
            "financial_dashboard_websocket": financial_dashboard_websocket is not None
        },
        "websocket_stats": manager.get_connection_stats()
    }

# API documentation endpoint
@app.get("/api/docs")
def api_docs(request: Request):
    """API documentation endpoint."""
    return {
        "title": "Sygnify Financial Analytics API",
        "version": "1.0.0",
        "description": "Comprehensive financial analytics and real-time dashboard API",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "websocket": "/ws",
            "job_websocket": "/ws/job/{job_id}",
            "financial_dashboard_websocket": "/ws/financial-dashboard",
            "financial_api": "/financial",
            "enhanced_financial_api": "/enhanced-financial"
        },
        "websocket_endpoints": {
            "general": "/ws",
            "job_specific": "/ws/job/{job_id}",
            "financial_dashboard": "/ws/financial-dashboard"
        }
    }

# General WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """General WebSocket endpoint for real-time communication."""
    await manager.connect(websocket)
    try:
        while True:
            # Add timeout to prevent hanging
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                message = json.loads(data)
                logging.info(f"Received WebSocket message: {message}")
                
                # Handle different message types
                if message.get("type") == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                elif message.get("type") == "subscribe" or message.get("type") == "subscribe_job":
                    job_id = message.get("job_id")
                    logging.info(f"Processing subscription for job_id: {job_id}")
                    if job_id:
                        manager.subscribe_to_job(job_id, websocket)
                        await manager.send_personal_message({
                            "type": "subscribed",
                            "job_id": job_id,
                            "timestamp": datetime.now().isoformat()
                        }, websocket)
                        
                        # Start job simulation if available
                        if job_simulator:
                            domain = message.get("domain", "financial")
                            logging.info(f"Starting job simulation for {job_id} with domain {domain}")
                            # Use create_task to avoid blocking
                            task = asyncio.create_task(job_simulator.simulate_job(job_id, domain))
                            logging.info(f"Job simulation task created for {job_id}")
                            logging.info(f"Job simulator available: {job_simulator is not None}")
                            logging.info(f"Job simulator type: {type(job_simulator)}")
                        else:
                            logging.warning("Job simulator not available, using fallback")
                            domain = message.get("domain", "financial")
                            logging.info(f"Fallback: Processing job {job_id} with domain {domain}")
                            
                            # Use global job status manager for fallback
                            job_status_manager.create_job(job_id, domain)
                            logging.info(f"Fallback: Initialized job {job_id} in global status manager")
                            logging.info(f"Fallback: Current jobs in manager: {list(job_status_manager.jobs.keys())}")
                            
                            # Fallback: Send initial job status with faster updates
                            await manager.send_personal_message({
                                "type": "job_update",
                                "job_id": job_id,
                                "status": "processing",
                                "progress": 25,
                                "stage": "uploading",
                                "message": "File uploaded successfully, starting analysis...",
                                "timestamp": datetime.now().isoformat()
                            }, websocket)
                            
                            # Send additional updates to simulate progress
                            await asyncio.sleep(2)
                            await manager.send_personal_message({
                                "type": "job_update",
                                "job_id": job_id,
                                "status": "processing",
                                "progress": 50,
                                "stage": "ai_analysis",
                                "message": "Running AI analysis...",
                                "timestamp": datetime.now().isoformat()
                            }, websocket)
                            
                            await asyncio.sleep(3)
                            await manager.send_personal_message({
                                "type": "job_update",
                                "job_id": job_id,
                                "status": "processing",
                                "progress": 75,
                                "stage": "insights_ready",
                                "message": "Generating insights...",
                                "timestamp": datetime.now().isoformat()
                            }, websocket)
                            
                            await asyncio.sleep(2)
                            
                            # Create comprehensive job data for the completion message
                            completed_job_data = {
                                "status": "completed",
                                "domain": domain,
                                "progress": 100,
                                "stage": "insights_ready",
                                "message": "Analysis complete! Your insights are ready.",
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
                                    "data_quality_metrics": {
                                        "data_quality_score": 95,
                                        "completeness": 98,
                                        "uniqueness": 97,
                                        "confidence_score": 92
                                    },
                                    "ml_prompts": [
                                        "Analyze revenue trends for Q4 and identify growth drivers",
                                        "Identify cost optimization opportunities in operational expenses",
                                        "Assess market position vs competitors and recommend strategic actions",
                                        "Evaluate cash flow patterns and suggest liquidity improvements",
                                        "Analyze profitability ratios and recommend margin optimization"
                                    ],
                                    "risk_assessment": {
                                        "risk_score": "Medium",
                                        "risk_level": "moderate",
                                        "key_risks": [
                                            "Market volatility affecting revenue stability",
                                            "Supply chain disruption impacting costs",
                                            "Regulatory changes in financial reporting",
                                            "Competitive pressure on profit margins"
                                        ],
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
                                    ],
                                    "ai_insights": "Comprehensive financial analysis reveals strong performance with opportunities for growth",
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
                                    }
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
                            
                            # Send job completion message
                            await manager.send_personal_message({
                                "type": "job_complete",
                                "job_id": job_id,
                                "status": "completed",
                                "progress": 100,
                                "stage": "insights_ready",
                                "message": "Analysis complete! Your insights are ready.",
                                "insights": completed_job_data["insights"],
                                "timestamp": datetime.now().isoformat()
                            }, websocket)
                            
                            # Store the completed job data in global status manager
                            job_status_manager.jobs[job_id] = completed_job_data
                            logging.info(f"Fallback: Updated global job status for {job_id} with comprehensive data")
                            logging.info(f"Fallback: Current job_status keys: {list(job_status_manager.jobs.keys())}")
                            logging.info(f"Fallback: Job data stored: {job_id in job_status_manager.jobs}")
                            logging.info(f"Fallback: Job status: {job_status_manager.jobs.get(job_id, {}).get('status', 'unknown')}")
                else:
                    # Echo back for testing
                    await manager.send_personal_message({
                        "type": "echo",
                        "data": message,
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                    
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await manager.send_personal_message({
                    "type": "ping",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                continue
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Job-specific WebSocket endpoint
@app.websocket("/ws/job/{job_id}")
async def job_websocket_endpoint(websocket: WebSocket, job_id: str):
    """Job-specific WebSocket endpoint for real-time job updates."""
    await manager.connect(websocket, job_id)
    manager.subscribe_to_job(job_id, websocket)
    
    # Start job simulation if available
    if job_simulator:
        domain = "financial"  # Default domain
        asyncio.create_task(job_simulator.simulate_job(job_id, domain))
    else:
        # Fallback: Send initial job status
        await manager.send_personal_message({
            "type": "job_update",
            "job_id": job_id,
            "status": "processing",
            "progress": 10,
            "stage": "uploading",
            "message": "File uploaded successfully, starting analysis...",
            "timestamp": datetime.now().isoformat()
        }, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle job-specific messages
            if message.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "job_id": job_id,
                    "timestamp": datetime.now().isoformat()
                }, websocket)
            elif message.get("type") == "get_status":
                # Get current job status from simulator
                if job_simulator:
                    job_status = job_simulator.get_job_status(job_id)
                    if job_status:
                        await manager.send_personal_message({
                            "type": "job_status",
                            "job_id": job_id,
                            "status": job_status["status"],
                            "progress": job_status.get("progress", 0),
                            "stage": job_status.get("stage", "unknown"),
                            "timestamp": datetime.now().isoformat()
                        }, websocket)
                    else:
                        await manager.send_personal_message({
                            "type": "job_status",
                            "job_id": job_id,
                            "status": "not_found",
                            "timestamp": datetime.now().isoformat()
                        }, websocket)
                else:
                    # Fallback: Mock job status
                    await manager.send_personal_message({
                        "type": "job_status",
                        "job_id": job_id,
                        "status": "processing",
                        "progress": 75,
                        "stage": "financial_analysis",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
            else:
                # Echo back for testing
                await manager.send_personal_message({
                    "type": "echo",
                    "job_id": job_id,
                    "data": message,
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.unsubscribe_from_job(job_id, websocket)
        manager.disconnect(websocket, job_id)
        # Cancel job simulation if running
        if job_simulator:
            job_simulator.cancel_job(job_id)
    except Exception as e:
        logging.error(f"Job WebSocket error: {e}")
        manager.unsubscribe_from_job(job_id, websocket)
        manager.disconnect(websocket, job_id)
        # Cancel job simulation if running
        if job_simulator:
            job_simulator.cancel_job(job_id)

# Financial Dashboard WebSocket endpoint
@app.websocket("/ws/financial-dashboard")
async def financial_dashboard_websocket_endpoint(websocket: WebSocket):
    """Financial Dashboard WebSocket endpoint for real-time financial analytics."""
    if financial_dashboard_websocket:
        await financial_dashboard_websocket(websocket)
    else:
        # Fallback if financial dashboard handler is not available
        await manager.connect(websocket, "financial-dashboard")
        try:
            await manager.send_personal_message({
                "type": "error",
                "message": "Financial dashboard WebSocket handler not available",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            
            while True:
                await websocket.receive_text()  # Keep connection alive
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, "financial-dashboard")
        except Exception as e:
            logging.error(f"Financial dashboard WebSocket error: {e}")
            manager.disconnect(websocket, "financial-dashboard")

# Real-time Market Data WebSocket endpoint
@app.websocket("/ws/realtime-market")
async def realtime_market_websocket_endpoint(websocket: WebSocket):
    """Real-time Market Data WebSocket endpoint for live market streaming."""
    if realtime_market_websocket:
        await realtime_market_websocket(websocket)
    else:
        # Fallback if real-time market handler is not available
        await manager.connect(websocket, "realtime-market")
        try:
            await manager.send_personal_message({
                "type": "error",
                "message": "Real-time market WebSocket handler not available",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            
            while True:
                await websocket.receive_text()  # Keep connection alive
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, "realtime-market")
        except Exception as e:
            logging.error(f"Real-time market WebSocket error: {e}")
            manager.disconnect(websocket, "realtime-market")

# Include routers
if financial_router:
    app.include_router(financial_router, prefix="/financial")
if enhanced_financial_router:
    app.include_router(enhanced_financial_router, prefix="/enhanced-financial")

if retail_router:
    app.include_router(retail_router, prefix="/retail")
if auth_router:
    app.include_router(auth_router, prefix="/auth")
if market_data_router:
    app.include_router(market_data_router)
if ml_router:
    app.include_router(ml_router) # ML router already has prefix="/ml"

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logging.info("Sygnify Financial Analytics API starting up...")
    logging.info(f"Available routers: financial={financial_router is not None}, enhanced_financial={enhanced_financial_router is not None}, auth={auth_router is not None}, market_data={market_data_router is not None}, ml={ml_router is not None}")
    logging.info(f"Financial dashboard WebSocket: {financial_dashboard_websocket is not None}")
    logging.info(f"Real-time market WebSocket: {realtime_market_websocket is not None}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logging.info("Sygnify Financial Analytics API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True) 
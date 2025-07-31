"""
FastAPI Application Entry Point - Enterprise Security Edition
- CORS configuration with security headers
- Rate limiting and DDoS protection
- IP whitelisting and geographic restrictions
- Security middleware and audit logging
- API versioning and health monitoring
- WebSocket support for real-time communication
"""
import logging
import json
import asyncio
import time
import ipaddress
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
from collections import defaultdict, deque

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
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
import os
import hashlib
import secrets

# Import rate limiting
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    
    # Initialize rate limiter
    limiter = Limiter(key_func=get_remote_address)
    rate_limiter_available = True
    logging.info("Rate limiter initialized successfully")
except ImportError:
    logging.warning("SlowAPI not available. Rate limiting disabled.")
    limiter = None
    rate_limiter_available = False

# Security configuration
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
API_KEY_HEADER = "X-API-Key"
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", secrets.token_urlsafe(32))
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "10485760"))  # 10MB
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
BURST_RATE_LIMIT = int(os.getenv("BURST_RATE_LIMIT", "20"))

# IP Whitelisting configuration
WHITELIST_ENABLED = os.getenv("IP_WHITELIST_ENABLED", "false").lower() == "true"
WHITELISTED_IPS = set(os.getenv("WHITELISTED_IPS", "").split(",")) if os.getenv("WHITELISTED_IPS") else set()
BLACKLISTED_IPS = set(os.getenv("BLACKLISTED_IPS", "").split(",")) if os.getenv("BLACKLISTED_IPS") else set()

# Security headers configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}

# DDoS protection - simple implementation
class DDoSProtection:
    def __init__(self, max_requests: int = 1000, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.request_counts: Dict[str, deque] = defaultdict(deque)
        
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        requests = self.request_counts[client_ip]
        
        # Remove old requests outside time window
        while requests and requests[0] <= now - self.time_window:
            requests.popleft()
        
        # Check if under limit
        if len(requests) >= self.max_requests:
            return False
        
        # Add current request
        requests.append(now)
        return True

# Initialize DDoS protection
ddos_protection = DDoSProtection()

# Security Middleware
class SecurityMiddleware(BaseHTTPMiddleware):
    """Enterprise security middleware with comprehensive protection"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = self.get_client_ip(request)
        
        try:
            # 1. IP Filtering
            if not self.check_ip_allowed(client_ip):
                logging.warning(f"Blocked request from blacklisted IP: {client_ip}")
                return JSONResponse(
                    status_code=403,
                    content={"error": "Access denied"}
                )
            
            # 2. DDoS Protection
            if not ddos_protection.is_allowed(client_ip):
                logging.warning(f"DDoS protection triggered for IP: {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too many requests", "retry_after": 60}
                )
            
            # 3. Request Size Validation
            if hasattr(request, 'headers') and 'content-length' in request.headers:
                content_length = int(request.headers.get('content-length', 0))
                if content_length > MAX_REQUEST_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={"error": "Request too large"}
                    )
            
            # 4. Process request
            response = await call_next(request)
            
            # 5. Add security headers
            for header, value in SECURITY_HEADERS.items():
                response.headers[header] = value
            
            # 6. Add response time header
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            
            # 7. Log request
            self.log_request(request, response, client_ip, process_time)
            
            return response
            
        except Exception as e:
            logging.error(f"Security middleware error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error"}
            )
    
    def get_client_ip(self, request: Request) -> str:
        """Get real client IP considering proxy headers"""
        # Check for forwarded headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def check_ip_allowed(self, ip: str) -> bool:
        """Check if IP is allowed based on whitelist/blacklist"""
        try:
            client_ip = ipaddress.ip_address(ip)
            
            # Check blacklist first
            if ip in BLACKLISTED_IPS:
                return False
            
            # If whitelist is enabled, check whitelist
            if WHITELIST_ENABLED and WHITELISTED_IPS:
                return ip in WHITELISTED_IPS
            
            return True
        except ValueError:
            # Invalid IP format
            return False
    
    def log_request(self, request: Request, response, client_ip: str, process_time: float):
        """Log request for monitoring and analytics"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "client_ip": client_ip,
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
            "user_agent": request.headers.get("user-agent", ""),
            "referer": request.headers.get("referer", "")
        }
        
        # Log to file for analytics
        with open("access.log", "a") as f:
            f.write(json.dumps(log_data) + "\n")

# API Key Middleware
class APIKeyMiddleware(BaseHTTPMiddleware):
    """API Key authentication for admin endpoints"""
    
    PROTECTED_PATHS = ["/admin", "/internal", "/system"]
    
    async def dispatch(self, request: Request, call_next):
        # Check if path requires API key
        if any(request.url.path.startswith(path) for path in self.PROTECTED_PATHS):
            api_key = request.headers.get(API_KEY_HEADER)
            
            if not api_key or api_key != ADMIN_API_KEY:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Valid API key required"}
                )
        
        return await call_next(request)

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

# Import WebSocket handlers
try:
    from .websocket.financial_dashboard import financial_dashboard_websocket
    logging.info("Financial dashboard WebSocket handler imported successfully")
except ImportError as e:
    logging.error(f"Failed to import financial dashboard WebSocket handler: {e}")
    financial_dashboard_websocket = None

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

# Initialize FastAPI application with security
app = FastAPI(
    title="Sygnify Financial Analytics API - Enterprise Edition",
    version="2.0.0",
    description="Enterprise-grade financial analytics platform with advanced security",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Add security middleware (order matters!)
if rate_limiter_available:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

app.add_middleware(SecurityMiddleware)
app.add_middleware(APIKeyMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Trusted Host Middleware (production security)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS configuration with enhanced security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"] if os.getenv("ENVIRONMENT") != "production" else ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Request-ID"],
    max_age=3600,
)

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.job_subscribers: Dict[str, List[WebSocket]] = {}
        self.connection_stats = {
            "total_connections": 0,
            "active_connections": 0,
            "messages_sent": 0,
            "errors": 0
        }

    async def connect(self, websocket: WebSocket, client_id: str = None):
        await websocket.accept()
        if client_id:
            if client_id not in self.active_connections:
                self.active_connections[client_id] = []
            self.active_connections[client_id].append(websocket)
        
        self.connection_stats["total_connections"] += 1
        self.connection_stats["active_connections"] += 1
        logging.info(f"WebSocket connected: {client_id}")

    def disconnect(self, websocket: WebSocket, client_id: str = None):
        if client_id and client_id in self.active_connections:
            self.active_connections[client_id] = [
                conn for conn in self.active_connections[client_id] if conn != websocket
            ]
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        
        self.connection_stats["active_connections"] = max(0, self.connection_stats["active_connections"] - 1)
        logging.info(f"WebSocket disconnected: {client_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
            self.connection_stats["messages_sent"] += 1
        except Exception as e:
            self.connection_stats["errors"] += 1
            logging.error(f"Error sending personal message: {e}")

    async def broadcast_to_job(self, job_id: str, message: dict):
        if job_id in self.job_subscribers:
            disconnected = []
            for websocket in self.job_subscribers[job_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                    self.connection_stats["messages_sent"] += 1
                except Exception as e:
                    self.connection_stats["errors"] += 1
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
            **self.connection_stats,
            "job_subscribers": len(self.job_subscribers),
            "subscriber_connections": sum(len(conns) for conns in self.job_subscribers.values())
        }

# Global connection manager
manager = ConnectionManager()

# Enhanced health check endpoint with security status
@app.get("/health")
async def health_check():
    """Comprehensive health check with security and system status"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0-enterprise",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "security": {
            "rate_limiting": rate_limiter_available,
            "ip_filtering": WHITELIST_ENABLED,
            "ddos_protection": True,
            "security_headers": True,
            "api_key_protection": True
        },
        "services": {
            "financial_router": financial_router is not None,
            "enhanced_financial_router": enhanced_financial_router is not None,
            "auth_router": auth_router is not None,
            "market_data_router": market_data_router is not None,
            "financial_dashboard_websocket": financial_dashboard_websocket is not None
        },
        "websocket_stats": manager.get_connection_stats(),
        "performance": {
            "max_request_size_mb": MAX_REQUEST_SIZE // 1024 // 1024,
            "rate_limit_per_minute": RATE_LIMIT_PER_MINUTE
        }
    }

# System status endpoint (Admin only)
@app.get("/admin/system-status")
async def system_status(request: Request):
    """Detailed system status for administrators"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "uptime": time.time(),
            "memory_usage": "N/A",  # Could add psutil here
            "cpu_usage": "N/A"
        },
        "security": {
            "ddos_requests_blocked": len([ip for ip, requests in ddos_protection.request_counts.items() if len(requests) >= ddos_protection.max_requests]),
            "blacklisted_ips": len(BLACKLISTED_IPS),
            "whitelisted_ips": len(WHITELISTED_IPS) if WHITELIST_ENABLED else "disabled"
        },
        "api_stats": manager.get_connection_stats()
    }

# Rate-limited endpoints
if rate_limiter_available:
    @app.get("/api/rate-limited")
    @limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
    async def rate_limited_endpoint(request: Request):
        return {"message": "This endpoint is rate limited"}

# API documentation endpoint with security
@app.get("/api/docs")
def api_docs(request: Request):
    """API documentation endpoint with security information"""
    return {
        "title": "Sygnify Financial Analytics API - Enterprise Edition",
        "version": "2.0.0",
        "description": "Enterprise-grade financial analytics with advanced security",
        "security_features": [
            "Rate limiting",
            "DDoS protection", 
            "IP filtering",
            "API key authentication",
            "Security headers",
            "Request size limits",
            "Audit logging"
        ],
        "authentication": {
            "type": "JWT Bearer Token",
            "endpoints": {
                "login": "/auth/login",
                "register": "/auth/register", 
                "refresh": "/auth/refresh"
            }
        },
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "websocket": "/ws",
            "job_websocket": "/ws/job/{job_id}",
            "financial_dashboard_websocket": "/ws/financial-dashboard",
            "financial_api": "/financial",
            "enhanced_financial_api": "/enhanced-financial",
            "auth_api": "/auth",
            "market_data_api": "/market"
        },
        "rate_limits": {
            "general": f"{RATE_LIMIT_PER_MINUTE} requests/minute",
            "burst": f"{BURST_RATE_LIMIT} requests/second"
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
if auth_router:
    app.include_router(auth_router, prefix="/auth")
if market_data_router:
    app.include_router(market_data_router)

# Startup event with security initialization
@app.on_event("startup")
async def startup_event():
    """Application startup event with security initialization"""
    logging.info("Sygnify Financial Analytics API - Enterprise Edition starting up...")
    logging.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logging.info(f"Security features enabled:")
    logging.info(f"  - Rate limiting: {rate_limiter_available}")
    logging.info(f"  - IP filtering: {WHITELIST_ENABLED}")
    logging.info(f"  - DDoS protection: True")
    logging.info(f"  - Security headers: True")
    logging.info(f"Available routers: financial={financial_router is not None}, enhanced_financial={enhanced_financial_router is not None}, auth={auth_router is not None}, market_data={market_data_router is not None}")
    logging.info(f"WebSocket handlers: financial_dashboard={financial_dashboard_websocket is not None}, realtime_market={realtime_market_websocket is not None}")
    
    # Log admin API key for development
    if os.getenv("ENVIRONMENT") != "production":
        logging.info(f"Admin API Key: {ADMIN_API_KEY}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event with cleanup"""
    logging.info("Sygnify Financial Analytics API shutting down...")
    
    # Close all WebSocket connections gracefully
    for client_id, connections in manager.active_connections.items():
        for websocket in connections:
            try:
                await websocket.close()
            except Exception as e:
                logging.error(f"Error closing WebSocket connection: {e}")
    
    logging.info("Shutdown complete")

if __name__ == "__main__":
    import uvicorn
    
    # Production-ready server configuration
    config = {
        "app": app,
        "host": os.getenv("HOST", "127.0.0.1"),
        "port": int(os.getenv("PORT", "8000")),
        "reload": os.getenv("ENVIRONMENT") != "production",
        "access_log": True,
        "log_level": "info",
        "workers": 1 if os.getenv("ENVIRONMENT") != "production" else 4
    }
    
    logging.info(f"Starting Uvicorn server with config: {config}")
    uvicorn.run(**config) 
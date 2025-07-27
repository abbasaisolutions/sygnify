"""
FastAPI Application Entry Point
- CORS configuration
- Authentication middleware
- Rate limiting
- API versioning
"""
import matplotlib
matplotlib.use('Agg')  # non-GUI backend for server environments
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("app.log", mode="a"),
        logging.StreamHandler()
    ]
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from backend.api.routers.financial import router as financial_router
from backend.api.routers.auth import router as auth_router

app = FastAPI(title="Sygnify Financial Analytics API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for authentication middleware
# TODO: Implement JWT or OAuth2 authentication

# Placeholder for rate limiting
# TODO: Integrate rate limiting middleware

# Placeholder for API versioning
# TODO: Add versioned routers

app.include_router(financial_router)
app.include_router(auth_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": app.version}

@app.get("/api/docs")
def api_docs(request: Request):
    """
    Return available API endpoints and legacy info (stub implementation).
    """
    return {
        "version": app.version,
        "endpoints": {
            "POST /financial/upload": "Upload and analyze CSV file with comprehensive analysis",
            "GET /financial/results": "Get analysis results",
            "GET /financial/insights": "Get analysis insights",
            "POST /financial/subscription/create-checkout-session": "Create subscription checkout session",
            "GET /financial/subscription/status": "Get subscription status",
            "POST /auth/register": "Register a new user",
            "POST /auth/login": "Login and get JWT token"
        },
        "legacy": {
            "POST /api/v1/upload": "Legacy upload endpoint (maintained for backward compatibility)"
        }
    } 
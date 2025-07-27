"""
FastAPI Application Entry Point for Uvicorn
This file serves as the main entry point for the FastAPI application.
"""
from api.main import app

# Export the FastAPI app instance
__all__ = ["app"] 
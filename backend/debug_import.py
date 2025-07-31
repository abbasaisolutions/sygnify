#!/usr/bin/env python3
"""
Debug script to test the import process
"""
import logging
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO)

print("Testing import process...")

# Test the exact import that happens in main.py
try:
    from api.routers.financial import router as financial_router
    print("✅ Financial router imported successfully")
    print(f"Router: {financial_router}")
    print(f"Router routes: {[route.path for route in financial_router.routes]}")
except ImportError as e:
    print(f"❌ Failed to import financial router: {e}")
    financial_router = None

try:
    from api.routers.enhanced_financial import router as enhanced_financial_router
    print("✅ Enhanced financial router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import enhanced financial router: {e}")
    enhanced_financial_router = None

try:
    from api.routers.auth import router as auth_router
    print("✅ Auth router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import auth router: {e}")
    auth_router = None

print(f"\nRouter status:")
print(f"financial_router: {financial_router is not None}")
print(f"enhanced_financial_router: {enhanced_financial_router is not None}")
print(f"auth_router: {auth_router is not None}") 
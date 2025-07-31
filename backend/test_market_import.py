#!/usr/bin/env python3
"""
Test script to debug market data router import
"""
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

print("Testing market data router import...")

try:
    from api.routers.market_data import router
    print("✅ Market data router imported successfully")
except Exception as e:
    print(f"❌ Failed to import market data router: {e}")
    import traceback
    traceback.print_exc()

try:
    from api.services.market_data_service import market_data_service
    print("✅ Market data service imported successfully")
except Exception as e:
    print(f"❌ Failed to import market data service: {e}")
    import traceback
    traceback.print_exc()

print("Testing main app import...")
try:
    from api.main import app
    print("✅ Main app imported successfully")
    
    # Check if market_data_router is available
    from api.main import market_data_router
    if market_data_router:
        print("✅ Market data router is available in main app")
    else:
        print("❌ Market data router is None in main app")
        
except Exception as e:
    print(f"❌ Failed to import main app: {e}")
    import traceback
    traceback.print_exc() 
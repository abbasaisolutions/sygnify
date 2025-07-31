#!/usr/bin/env python3
"""
Test script to start server and check market data router
"""
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

print("Starting server test...")

try:
    from api.main import app, market_data_router
    print(f"Market data router: {market_data_router}")
    
    # Check all routes
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    
    print("Available routes:")
    for route in sorted(routes):
        print(f"  {route}")
        
    # Check specifically for market routes
    market_routes = [r for r in routes if '/market' in r]
    print(f"\nMarket routes found: {len(market_routes)}")
    for route in market_routes:
        print(f"  {route}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc() 
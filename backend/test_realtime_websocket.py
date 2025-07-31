#!/usr/bin/env python3
"""
Test script to verify real-time WebSocket functionality
"""
import asyncio
import websockets
import json
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.getcwd())

async def test_realtime_websocket():
    """Test real-time market WebSocket connection"""
    print("Testing real-time market WebSocket...")
    
    try:
        # Connect to WebSocket
        uri = "ws://localhost:8000/ws/realtime-market"
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to real-time market WebSocket")
            
            # Wait for connection message
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data['type']}")
            
            # Subscribe to market overview
            subscribe_msg = {
                "type": "subscribe",
                "stream_type": "market_overview"
            }
            await websocket.send(json.dumps(subscribe_msg))
            print("📊 Subscribed to market_overview stream")
            
            # Wait for subscription confirmation
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data['type']}")
            
            # Get stream status
            status_msg = {
                "type": "get_status"
            }
            await websocket.send(json.dumps(status_msg))
            print("📊 Requested stream status")
            
            # Wait for status response
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data['type']}")
            print(f"📊 Stream status: {data['status']}")
            
            # Wait for a few market updates
            print("⏳ Waiting for market updates...")
            for i in range(3):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(message)
                    print(f"📈 Market update {i+1}: {data['type']} - {data.get('stream_type', 'unknown')}")
                except asyncio.TimeoutError:
                    print(f"⏰ Timeout waiting for update {i+1}")
                    break
            
            # Unsubscribe
            unsubscribe_msg = {
                "type": "unsubscribe",
                "stream_type": "market_overview"
            }
            await websocket.send(json.dumps(unsubscribe_msg))
            print("📊 Unsubscribed from market_overview stream")
            
            # Wait for unsubscription confirmation
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data['type']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_realtime_websocket()) 
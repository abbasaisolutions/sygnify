import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

from ..services.realtime_market_service import realtime_market_service, StreamType

logger = logging.getLogger(__name__)

async def realtime_market_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data streaming.
    Handles client connections, subscriptions, and data broadcasting.
    """
    await websocket.accept()
    client_id = f"market_client_{datetime.now().timestamp()}"
    
    try:
        # Connect client to real-time service
        await realtime_market_service.connect_client(client_id, websocket)
        
        # Send welcome message
        await websocket.send_json({
            'type': 'connection_established',
            'client_id': client_id,
            'message': 'Connected to real-time market data stream',
            'timestamp': datetime.now().isoformat(),
            'available_streams': [stream.value for stream in StreamType]
        })
        
        # Start market data stream if not already running
        if not hasattr(realtime_market_service, '_stream_task') or realtime_market_service._stream_task.done():
            realtime_market_service._stream_task = asyncio.create_task(
                realtime_market_service.start_market_data_stream()
            )
        
        # Handle incoming messages
        while True:
            try:
                # Receive message with timeout
                data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
                
                message_type = data.get('type')
                
                if message_type == 'subscribe':
                    # Handle subscription request
                    stream_type = data.get('stream_type')
                    symbols = data.get('symbols', [])
                    
                    if stream_type and stream_type in [stream.value for stream in StreamType]:
                        await realtime_market_service.subscribe_to_stream(
                            client_id, 
                            StreamType(stream_type), 
                            symbols
                        )
                        
                        await websocket.send_json({
                            'type': 'subscription_confirmed',
                            'stream_type': stream_type,
                            'symbols': symbols,
                            'timestamp': datetime.now().isoformat()
                        })
                    else:
                        await websocket.send_json({
                            'type': 'error',
                            'message': f'Invalid stream type: {stream_type}',
                            'timestamp': datetime.now().isoformat()
                        })
                        
                elif message_type == 'unsubscribe':
                    # Handle unsubscription request
                    stream_type = data.get('stream_type')
                    
                    if stream_type and stream_type in [stream.value for stream in StreamType]:
                        await realtime_market_service.unsubscribe_from_stream(
                            client_id, 
                            StreamType(stream_type)
                        )
                        
                        await websocket.send_json({
                            'type': 'unsubscription_confirmed',
                            'stream_type': stream_type,
                            'timestamp': datetime.now().isoformat()
                        })
                    else:
                        await websocket.send_json({
                            'type': 'error',
                            'message': f'Invalid stream type: {stream_type}',
                            'timestamp': datetime.now().isoformat()
                        })
                        
                elif message_type == 'get_status':
                    # Return current stream status
                    status = await realtime_market_service.get_stream_status()
                    await websocket.send_json({
                        'type': 'stream_status',
                        'status': status,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                elif message_type == 'get_alerts':
                    # Return recent alerts
                    limit = data.get('limit', 10)
                    alerts = await realtime_market_service.get_recent_alerts(limit)
                    await websocket.send_json({
                        'type': 'recent_alerts',
                        'alerts': alerts,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                elif message_type == 'ping':
                    # Handle ping/pong for connection health
                    await websocket.send_json({
                        'type': 'pong',
                        'timestamp': datetime.now().isoformat()
                    })
                    
                else:
                    # Echo back for debugging
                    await websocket.send_json({
                        'type': 'echo',
                        'data': data,
                        'timestamp': datetime.now().isoformat()
                    })
                    
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                await websocket.send_json({
                    'type': 'heartbeat',
                    'timestamp': datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected from real-time market stream")
    except Exception as e:
        logger.error(f"Error in real-time market WebSocket for {client_id}: {e}")
        await websocket.send_json({
            'type': 'error',
            'message': f'WebSocket error: {str(e)}',
            'timestamp': datetime.now().isoformat()
        })
    finally:
        # Clean up client connection
        realtime_market_service.disconnect_client(client_id, websocket) 
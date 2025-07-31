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
    from backend.api.routers.financial import router as financial_router
    logging.info("Financial router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import financial router: {e}")
    financial_router = None

try:
    from backend.api.routers.auth import router as auth_router
    logging.info("Auth router imported successfully")
except ImportError as e:
    logging.error(f"Failed to import auth router: {e}")
    auth_router = None

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
        """Broadcast message to all subscribers of a specific job"""
        if job_id in self.job_subscribers:
            disconnected = []
            for websocket in self.job_subscribers[job_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logging.error(f"Error broadcasting to job {job_id}: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected websockets
            for websocket in disconnected:
                if websocket in self.job_subscribers[job_id]:
                    self.job_subscribers[job_id].remove(websocket)
            
            # Clean up empty job subscriptions
            if not self.job_subscribers[job_id]:
                del self.job_subscribers[job_id]
                logging.info(f"Removed empty job subscription for {job_id}")

    def subscribe_to_job(self, job_id: str, websocket: WebSocket):
        """Subscribe a websocket to job updates"""
        if job_id not in self.job_subscribers:
            self.job_subscribers[job_id] = []
        self.job_subscribers[job_id].append(websocket)
        logging.info(f"Subscribed to job {job_id}")

    def unsubscribe_from_job(self, job_id: str, websocket: WebSocket):
        """Unsubscribe a websocket from job updates"""
        if job_id in self.job_subscribers:
            self.job_subscribers[job_id] = [
                conn for conn in self.job_subscribers[job_id] if conn != websocket
            ]
            if not self.job_subscribers[job_id]:
                del self.job_subscribers[job_id]
        logging.info(f"Unsubscribed from job {job_id}")

    def get_connection_stats(self):
        """Get connection statistics for monitoring"""
        return {
            "active_connections": len(self.active_connections),
            "job_subscriptions": len(self.job_subscribers),
            "total_websockets": sum(len(conns) for conns in self.active_connections.values()),
            "total_job_subscribers": sum(len(conns) for conns in self.job_subscribers.values())
        }

manager = ConnectionManager()

# Placeholder for authentication middleware
# TODO: Implement JWT or OAuth2 authentication

# Placeholder for rate limiting
# TODO: Integrate rate limiting middleware

# Placeholder for API versioning
# TODO: Add versioned routers

if financial_router:
    app.include_router(financial_router)
if auth_router:
    app.include_router(auth_router)

@app.get("/health")
def health_check():
    """Health check endpoint with WebSocket statistics"""
    try:
        websocket_stats = manager.get_connection_stats()
        return {
            "status": "healthy", 
            "version": app.version,
            "websocket_stats": websocket_stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logging.error(f"Health check error: {e}")
        return {
            "status": "degraded", 
            "version": app.version,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

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
            "POST /auth/login": "Login and get JWT token",
            "WS /ws": "WebSocket connection for real-time updates",
            "WS /ws/job/{job_id}": "WebSocket connection for job-specific updates"
        },
        "legacy": {
            "POST /api/v1/upload": "Legacy upload endpoint (maintained for backward compatibility)"
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """General WebSocket endpoint for real-time updates"""
    client_id = f"client_{datetime.now().timestamp()}"
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError as e:
                logging.error(f"Invalid JSON received from {client_id}: {e}")
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                continue
            
            # Handle different message types
            if message.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
            elif message.get("type") == "subscribe_job":
                job_id = message.get("job_id")
                if job_id:
                    manager.subscribe_to_job(job_id, websocket)
                    await manager.send_personal_message({
                        "type": "subscribed",
                        "job_id": job_id,
                        "message": f"Subscribed to job {job_id}"
                    }, websocket)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Missing job_id for subscribe_job",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
            elif message.get("type") == "unsubscribe_job":
                job_id = message.get("job_id")
                if job_id:
                    manager.unsubscribe_from_job(job_id, websocket)
                    await manager.send_personal_message({
                        "type": "unsubscribed",
                        "job_id": job_id,
                        "message": f"Unsubscribed from job {job_id}"
                    }, websocket)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Missing job_id for unsubscribe_job",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
            else:
                # Unknown message type
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message.get('type')}",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
    except Exception as e:
        logging.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(websocket, client_id)

@app.websocket("/ws/job/{job_id}")
async def job_websocket_endpoint(websocket: WebSocket, job_id: str):
    """Job-specific WebSocket endpoint for real-time job updates"""
    client_id = f"job_{job_id}_{datetime.now().timestamp()}"
    await manager.connect(websocket, client_id)
    manager.subscribe_to_job(job_id, websocket)
    
    try:
        # Send initial job status
        try:
            from backend.api.routers.financial import job_states
            if job_id in job_states:
                await manager.send_personal_message({
                    "type": "job_status",
                    "job_id": job_id,
                    "data": job_states[job_id],
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        except ImportError:
            logging.warning(f"Could not import job_states for job {job_id}")
            # Send a default status message
            await manager.send_personal_message({
                "type": "job_status",
                "job_id": job_id,
                "data": {"stage": "unknown", "progress": 0, "message": "Job status unavailable"},
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError as e:
                logging.error(f"Invalid JSON received from job {job_id}: {e}")
                await manager.send_personal_message({
                    "type": "error",
                    "job_id": job_id,
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                continue
            
            # Handle job-specific messages
            if message.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "job_id": job_id,
                    "timestamp": datetime.now().isoformat()
                }, websocket)
            else:
                # Unknown message type
                await manager.send_personal_message({
                    "type": "error",
                    "job_id": job_id,
                    "message": f"Unknown message type: {message.get('type')}",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        manager.unsubscribe_from_job(job_id, websocket)
    except Exception as e:
        logging.error(f"Job WebSocket error: {e}")
        manager.disconnect(websocket, client_id)
        manager.unsubscribe_from_job(job_id, websocket)

# Export manager for use in other modules
app.state.websocket_manager = manager 
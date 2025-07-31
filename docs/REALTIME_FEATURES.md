# Sygnify Real-Time Analytics Features

## Overview

Sygnify Analytics now includes comprehensive real-time capabilities that enable live monitoring, interactive progress tracking, and instant updates between the frontend and backend. This document outlines the real-time features, WebSocket integration, and how to use them.

## 🚀 Real-Time Features

### 1. WebSocket Communication
- **Bidirectional Communication**: Real-time data exchange between frontend and backend
- **Automatic Reconnection**: Handles connection drops with intelligent retry logic
- **Heartbeat Monitoring**: Keeps connections alive with periodic ping/pong
- **Event-Driven Architecture**: Subscribe to specific events and job updates

### 2. Live Progress Tracking
- **Real-Time Job Status**: See processing progress as it happens
- **Stage-by-Stage Updates**: Track each processing stage with detailed messages
- **Interactive Progress Bars**: Animated progress indicators with live updates
- **Connection Status Indicators**: Visual feedback for WebSocket connection status

### 3. System Monitoring Dashboard
- **Live System Status**: Monitor backend, database, and ML services health
- **Performance Metrics**: Real-time CPU, memory, and request rate monitoring
- **Active Job Tracking**: See all currently running jobs and their status
- **Recent Activity Log**: Live feed of system events and job updates

### 4. Interactive User Experience
- **Instant Feedback**: No page refreshes needed for updates
- **Smooth Animations**: Framer Motion animations for all state changes
- **Visual Indicators**: Color-coded status indicators and progress bars
- **Responsive Design**: Works seamlessly across all device sizes

## 🔧 Technical Implementation

### Backend WebSocket Endpoints

#### General WebSocket (`/ws`)
```javascript
// Connect to general WebSocket
const ws = new WebSocket('ws://localhost:8000/ws');

// Subscribe to job updates
ws.send(JSON.stringify({
  type: 'subscribe_job',
  job_id: 'your-job-id'
}));

// Handle messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

#### Job-Specific WebSocket (`/ws/job/{job_id}`)
```javascript
// Connect directly to job-specific endpoint
const jobWs = new WebSocket('ws://localhost:8000/ws/job/your-job-id');

// Receive job updates automatically
jobWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Job update:', data);
};
```

### Frontend WebSocket Service

The frontend includes a comprehensive WebSocket service (`websocketService.js`) that handles:

```javascript
import websocketService from '../services/websocketService.js';

// Connect to WebSocket
await websocketService.connect();

// Subscribe to job updates
websocketService.subscribeToJob(jobId);

// Add event listeners
websocketService.addJobEventListener(jobId, 'update', (data) => {
  console.log('Job update:', data);
});

websocketService.addJobEventListener(jobId, 'complete', (data) => {
  console.log('Job completed:', data);
});

websocketService.addJobEventListener(jobId, 'error', (data) => {
  console.log('Job error:', data);
});
```

### Message Types

#### Job Update Messages
```json
{
  "type": "job_update",
  "job_id": "uuid-string",
  "stage": "profiling",
  "progress": 25,
  "message": "Analyzing data patterns...",
  "timestamp": 1640995200
}
```

#### Job Complete Messages
```json
{
  "type": "job_complete",
  "job_id": "uuid-string",
  "stage": "insights_ready",
  "progress": 100,
  "message": "Analysis complete.",
  "insights": { /* analysis results */ },
  "timestamp": 1640995200
}
```

#### Job Error Messages
```json
{
  "type": "job_error",
  "job_id": "uuid-string",
  "stage": "error",
  "progress": 0,
  "message": "Processing failed: Invalid data format",
  "timestamp": 1640995200
}
```

## 📊 Real-Time Dashboard Components

### 1. ProcessingPage Component
- **Real-Time Progress**: Live updates during file processing
- **Stage Visualization**: Visual representation of each processing stage
- **Connection Status**: WebSocket connection indicator
- **Error Handling**: Real-time error display and recovery

### 2. RealTimeDashboard Component
- **System Health**: Live monitoring of all system components
- **Performance Metrics**: Real-time CPU, memory, and network stats
- **Active Jobs**: List of currently running jobs with status
- **Activity Feed**: Live stream of system events

### 3. Dashboard Integration
- **Real-Time Monitor Tab**: New tab in main dashboard for live monitoring
- **Seamless Integration**: Works alongside existing analytics features
- **Responsive Design**: Adapts to different screen sizes

## 🚀 Getting Started

### Prerequisites
- Python 3.11+ with virtual environment
- Node.js 18+ with npm
- WebSocket support in browser

### Quick Start

#### Option 1: Using Startup Scripts

**Windows:**
```bash
scripts/start-realtime.bat
```

**Linux/Mac:**
```bash
./scripts/start-realtime.sh
```

#### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install websockets>=11.0.0
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend/client
npm install
npm install socket.io-client@^4.7.4
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **WebSocket Endpoint**: ws://localhost:8000/ws

## 🎯 Usage Examples

### 1. Upload and Monitor Processing
1. Navigate to the frontend
2. Upload a CSV file
3. Watch real-time progress in the ProcessingPage
4. See live updates in the Real-Time Monitor tab

### 2. Monitor System Health
1. Go to the Dashboard
2. Click on "Real-Time Monitor" tab
3. View live system metrics and active jobs
4. Monitor WebSocket connection status

### 3. Track Multiple Jobs
1. Start multiple file uploads
2. Each job gets a unique WebSocket connection
3. Monitor all jobs simultaneously
4. Receive real-time updates for each job

## 🔍 Troubleshooting

### WebSocket Connection Issues
- **Check Backend**: Ensure backend is running on port 8000
- **Check CORS**: Verify CORS settings allow WebSocket connections
- **Browser Support**: Ensure browser supports WebSockets
- **Firewall**: Check if firewall blocks WebSocket connections

### Performance Issues
- **Connection Limits**: Monitor number of active WebSocket connections
- **Memory Usage**: Check for memory leaks in long-running connections
- **Network Latency**: Consider WebSocket proxy for high-latency networks

### Common Error Messages
- `WebSocket connection failed`: Backend not running or port blocked
- `Max reconnection attempts reached`: Network issues or backend down
- `Job not found`: Job ID invalid or job completed

## 🔧 Configuration

### Backend Configuration
```python
# In backend/api/main.py
class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.job_subscribers = {}
        # Configure heartbeat interval
        self.heartbeat_interval = 30000  # 30 seconds
```

### Frontend Configuration
```javascript
// In frontend/client/src/services/websocketService.js
class WebSocketService {
    constructor() {
        this.heartbeatInterval = 30000; // 30 seconds
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }
}
```

## 📈 Performance Considerations

### Backend Optimization
- **Connection Pooling**: Efficiently manage multiple WebSocket connections
- **Message Batching**: Batch updates for high-frequency events
- **Memory Management**: Clean up disconnected connections
- **Error Handling**: Graceful handling of connection failures

### Frontend Optimization
- **Event Debouncing**: Prevent excessive re-renders
- **Connection Reuse**: Reuse WebSocket connections when possible
- **Memory Cleanup**: Remove event listeners on component unmount
- **Error Recovery**: Automatic reconnection with exponential backoff

## 🔮 Future Enhancements

### Planned Features
- **Real-Time Collaboration**: Multiple users monitoring same jobs
- **Push Notifications**: Browser notifications for job completion
- **Advanced Analytics**: Real-time ML model performance monitoring
- **Mobile Support**: Optimized real-time features for mobile devices

### Scalability Improvements
- **Redis Integration**: Distributed WebSocket management
- **Load Balancing**: Multiple backend instances
- **Message Queuing**: Reliable message delivery
- **Monitoring**: Advanced metrics and alerting

## 📚 Additional Resources

- [FastAPI WebSocket Documentation](https://fastapi.tiangolo.com/advanced/websockets/)
- [React WebSocket Best Practices](https://reactjs.org/docs/hooks-effect.html)
- [WebSocket Protocol Specification](https://tools.ietf.org/html/rfc6455)
- [Real-Time Web Applications](https://www.websocket.org/)

---

For technical support or feature requests, please refer to the main project documentation or create an issue in the project repository. 
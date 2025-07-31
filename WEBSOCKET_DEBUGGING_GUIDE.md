# WebSocket Debugging Guide

## Current Issue
The WebSocket service is experiencing JSON parsing errors:
```
Error parsing WebSocket message: SyntaxError: "[object Object]" is not valid JSON
```

## Debugging Tools Added

### 1. Enhanced Logging
- Added detailed logging to track message flow
- Added data type checking in `handleMessage`
- Added error context with stack traces

### 2. Debug Buttons in UI
- **Test WS**: Tests WebSocket connection and sends test message
- **Reload**: Force reloads the WebSocket service to clear cache issues

### 3. Service Information
- Added version tracking (`2.0.0`)
- Added service status methods
- Added connection health monitoring

## How to Debug

### Step 1: Check Console Logs
Look for these messages in the browser console:
```
🔧 WebSocketService initialized with version: 2.0.0
🔧 Testing WebSocket connection...
📨 Raw WebSocket message received: {"type":"job_update",...}
📨 Parsed WebSocket message: {type: "job_update", ...}
🔍 handleMessage called with data type: object
🔍 handleMessage data: {type: "job_update", ...}
```

### Step 2: Use Debug Buttons
1. Click "Test WS" button to test connection
2. Click "Reload" button to force reload the service
3. Check console for service info and connection status

### Step 3: Monitor Error Details
If errors persist, look for:
```
❌ Error handling WebSocket message: [error details]
❌ Error details: {
  error: error.message,
  stack: error.stack,
  dataType: typeof data,
  data: data
}
```

## Potential Causes

### 1. Browser Cache Issue
- Old version of JavaScript file cached
- Solution: Use "Reload" button or hard refresh (Ctrl+F5)

### 2. Message Format Issue
- Backend sending malformed JSON
- Solution: Check backend WebSocket implementation

### 3. WebSocket Library Issue
- Native WebSocket vs Socket.IO confusion
- Solution: Verify correct WebSocket implementation

### 4. Data Type Mismatch
- String vs Object handling
- Solution: Enhanced type checking in `handleMessage`

## Testing Steps

### 1. Basic Connection Test
```javascript
// In browser console
websocketService.testConnection();
websocketService.sendTestMessage();
```

### 2. Service Status Check
```javascript
// In browser console
console.log(websocketService.getServiceInfo());
```

### 3. Force Reload Test
```javascript
// In browser console
websocketService.forceReload();
```

## Expected Behavior

### Successful Connection
```
🔧 WebSocketService initialized with version: 2.0.0
🔧 Testing WebSocket connection...
🧪 Testing WebSocket connection...
🧪 Connection status: {isConnected: true, ...}
📨 Raw WebSocket message received: {"type":"job_update",...}
📨 Parsed WebSocket message: {type: "job_update", ...}
🔍 handleMessage called with data type: object
🔍 handleMessage data: {type: "job_update", ...}
🔍 Data is already an object, using as-is
🔍 Extracted message type: job_update job_id: job_xxx
📡 WebSocket: Received job_update for job_id: job_xxx
```

### Error Case
```
❌ Error handling WebSocket message: SyntaxError: "[object Object]" is not valid JSON
❌ Error details: {
  error: "SyntaxError: [object Object] is not valid JSON",
  stack: "...",
  dataType: "object",
  data: {type: "job_update", ...}
}
```

## Troubleshooting

### If Error Persists After Reload
1. Check browser cache (Ctrl+F5)
2. Check backend WebSocket implementation
3. Verify message format from backend
4. Check for multiple WebSocket connections

### If Connection Fails
1. Check backend server status
2. Verify WebSocket endpoint URL
3. Check network connectivity
4. Check browser console for CORS issues

### If Messages Not Received
1. Check WebSocket subscription
2. Verify job ID format
3. Check backend job status
4. Monitor connection health

## Next Steps

1. **Monitor Console**: Watch for the new debugging messages
2. **Test Buttons**: Use the debug buttons in the UI
3. **Check Backend**: Verify backend WebSocket implementation
4. **Clear Cache**: Use browser hard refresh if needed

## Contact Information

If issues persist after following this guide:
1. Check the console logs for specific error messages
2. Note the WebSocket service version and status
3. Document any error patterns or specific scenarios
4. Provide console output for further debugging 
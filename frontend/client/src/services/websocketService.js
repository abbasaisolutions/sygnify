/**
 * WebSocket Service for Real-time Communication
 * Handles WebSocket connections, job status updates, and real-time data streaming
 */

import { API_BASE_URL } from '../config/api.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.jobListeners = new Map();
    this.lastPingTime = Date.now();
    this.pingInterval = null;
    this.pingTimeout = null;
    this.lastJobCompleteTime = new Map(); // Track last completion time per job
    this.completionDebounceMs = 2000; // 2 second debounce for job completion
    this.heartbeatInterval = 30000; // 30 seconds between pings (increased from default)
    this.connectionStatus = 'disconnected';
    this.version = '2.0.0'; // Version for cache busting
    
    console.log('🔧 WebSocketService initialized with version:', this.version);
  }

  /**
   * Connect to the main WebSocket endpoint
   */
  connect() {
    return new Promise((resolve, reject) => {
      // Prevent multiple connections
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('🔧 WebSocket already connected, reusing existing connection');
        resolve();
        return;
      }
      
      // Clean up any existing connection
      if (this.ws) {
        console.log('🔧 Cleaning up existing WebSocket connection');
        this.ws.close();
        this.ws = null;
      }
      
      try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
        console.log('🔧 Connecting to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        this.connectionStatus = 'connecting';

        this.ws.onopen = () => {
          console.log('🔧 WebSocket connected successfully');
          this.isConnected = true;
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('📨 Raw WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            console.log('📨 Parsed WebSocket message:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔧 WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('🔧 WebSocket error:', error);
          this.connectionStatus = 'error';
          reject(error);
        };

      } catch (error) {
        console.error('🔧 Error creating WebSocket connection:', error);
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  /**
   * Connect to a job-specific WebSocket endpoint
   */
  connectToJob(jobId) {
    return new Promise((resolve, reject) => {
      // Prevent multiple job connections
      if (this.jobWs && this.jobWs.readyState === WebSocket.OPEN) {
        console.log('🔧 Job WebSocket already connected, reusing existing connection');
        resolve();
        return;
      }
      
      // Clean up any existing job connection
      if (this.jobWs) {
        console.log('🔧 Cleaning up existing job WebSocket connection');
        this.jobWs.close();
        this.jobWs = null;
      }
      
      try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/job/${jobId}`;
        console.log('🔧 Connecting to job WebSocket:', wsUrl);
        
        this.jobWs = new WebSocket(wsUrl);

        this.jobWs.onopen = () => {
          console.log('🔧 Job WebSocket connected successfully for job:', jobId);
          resolve();
        };

        this.jobWs.onmessage = (event) => {
          try {
            console.log('📨 Raw job WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            console.log('📨 Parsed job WebSocket message:', data);
            this.handleJobMessage(data);
          } catch (error) {
            console.error('❌ Error parsing job WebSocket message:', error, 'Raw job message:', event.data);
          }
        };

        this.jobWs.onclose = (event) => {
          console.log(`🔧 Job WebSocket disconnected for job ${jobId}:`, event.code, event.reason);
        };

        this.jobWs.onerror = (error) => {
          console.error(`🔧 Job WebSocket error for job ${jobId}:`, error);
          reject(error);
        };

      } catch (error) {
        console.error('🔧 Error creating job WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    console.log('🔧 Disconnecting WebSocket service...');
    
    this.stopHeartbeat();
    
    if (this.ws) {
      console.log('🔧 Closing main WebSocket connection');
      this.ws.close();
      this.ws = null;
    }
    
    if (this.jobWs) {
      console.log('🔧 Closing job WebSocket connection');
      this.jobWs.close();
      this.jobWs = null;
    }
    
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.listeners.clear();
    this.jobListeners.clear();
    this.lastJobCompleteTime.clear();
    
    console.log('🔧 WebSocket service disconnected');
  }

  /**
   * Subscribe to job updates
   */
  subscribeToJob(jobId) {
    if (this.isConnected) {
      this.sendMessage({
        type: 'subscribe',
        job_id: jobId
      });
    }
  }

  /**
   * Unsubscribe from job updates
   */
  unsubscribeFromJob(jobId) {
    if (this.isConnected) {
      this.sendMessage({
        type: 'unsubscribe',
        job_id: jobId
      });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Add job-specific event listener
   */
  addJobEventListener(jobId, event, callback) {
    const jobKey = `job_${jobId}_${event}`;
    
    // Check if this exact callback is already registered
    if (!this.jobListeners.has(jobKey)) {
      this.jobListeners.set(jobKey, []);
    }
    
    const listeners = this.jobListeners.get(jobKey);
    
    // Prevent duplicate callbacks
    if (!listeners.some(listener => listener === callback)) {
      listeners.push(callback);
      console.log(`📡 Added job event listener: ${jobKey} (total: ${listeners.length})`);
    } else {
      console.log(`⚠️ Job event listener already exists: ${jobKey}`);
    }
  }

  /**
   * Remove job-specific event listener
   */
  removeJobEventListener(jobId, event, callback) {
    const jobKey = `job_${jobId}_${event}`;
    const listeners = this.jobListeners.get(jobKey) || [];
    
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`🗑️ Removed job event listener: ${jobKey} (remaining: ${listeners.length})`);
      
      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.jobListeners.delete(jobKey);
      }
    }
  }

  /**
   * Add job update listener (with deduplication)
   */
  onJobUpdate(jobId, callback) {
    // Remove any existing listeners for this job and event
    this.removeJobEventListener(jobId, 'update', callback);
    this.addJobEventListener(jobId, 'update', callback);
  }

  /**
   * Add job complete listener (with deduplication)
   */
  onJobComplete(jobId, callback) {
    // Remove any existing listeners for this job and event
    this.removeJobEventListener(jobId, 'complete', callback);
    this.addJobEventListener(jobId, 'complete', callback);
  }

  /**
   * Add job error listener (with deduplication)
   */
  onJobError(jobId, callback) {
    // Remove any existing listeners for this job and event
    this.removeJobEventListener(jobId, 'error', callback);
    this.addJobEventListener(jobId, 'error', callback);
  }

  /**
   * Clean up all listeners for a specific job
   */
  cleanupJobListeners(jobId) {
    const keysToRemove = [];
    
    for (const [key, listeners] of this.jobListeners.entries()) {
      if (key.startsWith(`job_${jobId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.jobListeners.delete(key);
      console.log(`🧹 Cleaned up job listeners for: ${key}`);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    try {
      console.log('🔍 handleMessage called with data type:', typeof data);
      console.log('🔍 handleMessage data:', data);
      
      // Check if data is already an object or needs parsing
      let messageData = data;
      if (typeof data === 'string') {
        console.log('🔍 Data is string, parsing JSON...');
        messageData = JSON.parse(data);
      } else if (typeof data === 'object' && data !== null) {
        console.log('🔍 Data is already an object, using as-is');
        messageData = data;
      } else {
        console.warn('⚠️ Received invalid WebSocket message format:', data);
        return;
      }
      
      const { type, job_id, ...payload } = messageData;
      console.log('🔍 Extracted message type:', type, 'job_id:', job_id);

      switch (type) {
        case 'connected':
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.triggerEvent('connected', payload);
          this.startHeartbeat();
          break;
        case 'disconnected':
          this.isConnected = false;
          this.triggerEvent('disconnected', payload);
          this.stopHeartbeat();
          break;
        case 'echo':
          // Echo messages are for testing - just log them
          break;
        case 'subscribed':
          this.triggerEvent('subscribed', { job_id, ...payload });
          break;
        case 'unsubscribed':
          this.triggerEvent('unsubscribed', { job_id, ...payload });
          break;
        case 'job_update':
          console.log('📡 WebSocket: Received job_update for job_id:', job_id);
          this.triggerJobEvent(job_id, 'update', payload);
          break;
        case 'job_complete':
          // Debounce job completion messages
          const now = Date.now();
          const lastCompleteTime = this.lastJobCompleteTime.get(job_id) || 0;
          
          if (now - lastCompleteTime > this.completionDebounceMs) {
            console.log('🎉 WebSocket: Received job_complete for job_id:', job_id);
            this.lastJobCompleteTime.set(job_id, now);
            this.triggerJobEvent(job_id, 'complete', payload);
          } else {
            console.log('⏭️ Skipping duplicate job_complete for job_id:', job_id, '(debounced)');
          }
          break;
        case 'job_error':
          this.triggerJobEvent(job_id, 'error', payload);
          break;
        case 'pong':
          // Heartbeat response
          this.lastPingTime = Date.now();
          if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
          }
          break;
        default:
          console.log('📨 WebSocket: Received unknown message type:', type, payload);
          break;
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
      console.error('❌ Error details:', {
        error: error.message,
        stack: error.stack,
        dataType: typeof data,
        data: data
      });
    }
  }

  /**
   * Handle job-specific WebSocket messages
   */
  handleJobMessage(data) {
    const { type, job_id, ...payload } = data;

    switch (type) {
      case 'job_status':
        this.triggerJobEvent(job_id, 'status', payload);
        break;
      case 'job_update':
        this.triggerJobEvent(job_id, 'update', payload);
        break;
      case 'job_complete':
        this.triggerJobEvent(job_id, 'complete', payload);
        break;
      case 'job_error':
        this.triggerJobEvent(job_id, 'error', payload);
        break;
      case 'pong':
        // Heartbeat response
        this.lastPingTime = Date.now();
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
          this.pingTimeout = null;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Trigger event for all listeners
   */
  triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Trigger job-specific events
   */
  triggerJobEvent(jobId, event, data) {
    const jobKey = `job_${jobId}_${event}`;
    const listeners = this.jobListeners.get(jobKey) || [];
    
    console.log(`🎯 Triggering job event: ${jobKey} with ${listeners.length} listeners`);
    
    if (listeners.length === 0) {
      console.warn(`⚠️ No listeners found for job event: ${jobKey}`);
    }
    
    listeners.forEach((callback, index) => {
      try {
        console.log(`📞 Calling listener ${index + 1}/${listeners.length} for ${jobKey}`);
        callback(data);
      } catch (error) {
        console.error(`❌ Error in job event listener ${index + 1} for ${jobKey}:`, error);
      }
    });
  }

  /**
   * Get debug information about current listeners
   */
  getDebugInfo() {
    const info = {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      totalListeners: this.listeners.size,
      totalJobListeners: this.jobListeners.size,
      jobListeners: {}
    };
    
    for (const [key, listeners] of this.jobListeners.entries()) {
      info.jobListeners[key] = listeners.length;
    }
    
    return info;
  }

  /**
   * Log current state for debugging
   */
  logDebugInfo() {
    const info = this.getDebugInfo();
    console.log('🔍 WebSocket Debug Info:', info);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    console.log('💓 Starting WebSocket heartbeat with interval:', this.heartbeatInterval, 'ms');
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        console.log('💓 Sending ping to main WebSocket');
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.lastPingTime = Date.now();
        
        // Set timeout for pong response
        this.pingTimeout = setTimeout(() => {
          console.warn('⚠️ Ping timeout - connection may be stale');
          this.connectionStatus = 'stale';
        }, 10000); // 10 second timeout
      }
      
      // Only send ping to job WebSocket if it exists and is open
      if (this.jobWs && this.jobWs.readyState === WebSocket.OPEN) {
        console.log('💓 Sending ping to job WebSocket');
        this.jobWs.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    console.log('💓 Stopping WebSocket heartbeat');
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.triggerEvent('max_reconnect_attempts', {});
    }
  }

  /**
   * Send custom message
   */
  sendMessage(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Send job-specific message
   */
  sendJobMessage(message) {
    if (this.jobWs && this.jobWs.readyState === WebSocket.OPEN) {
      this.jobWs.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send job message: Job WebSocket not connected');
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastPingTime: this.lastPingTime
    };
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy() {
    if (!this.isConnected) return false;
    if (this.connectionStatus === 'stale') return false;
    if (this.lastPingTime && Date.now() - this.lastPingTime > 60000) return false;
    return true;
  }

  /**
   * Test WebSocket connection and message handling
   */
  testConnection() {
    console.log('🧪 Testing WebSocket connection...');
    console.log('🧪 Connection status:', this.getConnectionStatus());
    console.log('🧪 Is connected:', this.isConnected);
    console.log('🧪 WebSocket object:', this.ws);
    
    if (this.ws && this.isConnected) {
      console.log('🧪 WebSocket ready state:', this.ws.readyState);
      console.log('🧪 WebSocket URL:', this.ws.url);
    }
  }

  /**
   * Send a test message to verify connection
   */
  sendTestMessage() {
    if (this.ws && this.isConnected) {
      const testMessage = {
        type: 'echo',
        message: 'Test message from frontend',
        timestamp: Date.now()
      };
      console.log('🧪 Sending test message:', testMessage);
      this.sendMessage(testMessage);
    } else {
      console.warn('🧪 Cannot send test message - WebSocket not connected');
    }
  }

  /**
   * Force reload the WebSocket service (for debugging cache issues)
   */
  forceReload() {
    console.log('🔄 Force reloading WebSocket service...');
    this.disconnect();
    this.listeners.clear();
    this.jobListeners.clear();
    this.lastJobCompleteTime.clear();
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    console.log('🔄 WebSocket service reloaded');
  }

  /**
   * Get service version and status
   */
  getServiceInfo() {
    return {
      version: this.version,
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: this.listeners.size,
      jobListenersCount: this.jobListeners.size
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 
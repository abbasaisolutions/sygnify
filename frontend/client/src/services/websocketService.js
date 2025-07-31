/**
 * WebSocket Service for Real-time Communication
 * Handles WebSocket connections, job status updates, and real-time data streaming
 */

import { API_BASE_URL } from '../config/api.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.jobWs = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.jobListeners = new Map();
    this.isConnected = false;
    this.pingInterval = null;
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionStatus = 'disconnected';
    this.lastPingTime = null;
    this.pingTimeout = null;
  }

  /**
   * Connect to the main WebSocket endpoint
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
        console.log('Attempting to connect to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        this.connectionStatus = 'connecting';

        this.ws.onopen = () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Raw message:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus = 'error';
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
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
      try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/job/${jobId}`;
        console.log(`Attempting to connect to job WebSocket: ${wsUrl}`);
        
        this.jobWs = new WebSocket(wsUrl);

        this.jobWs.onopen = () => {
          console.log(`Job WebSocket connected for job ${jobId}`);
          resolve();
        };

        this.jobWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleJobMessage(data);
          } catch (error) {
            console.error('Error parsing job WebSocket message:', error);
            console.error('Raw job message:', event.data);
          }
        };

        this.jobWs.onclose = (event) => {
          console.log(`Job WebSocket disconnected for job ${jobId}:`, event.code, event.reason);
        };

        this.jobWs.onerror = (error) => {
          console.error(`Job WebSocket error for job ${jobId}:`, error);
          reject(error);
        };

      } catch (error) {
        console.error('Error creating job WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.jobWs) {
      this.jobWs.close();
      this.jobWs = null;
    }
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.listeners.clear();
    this.jobListeners.clear();
  }

  /**
   * Subscribe to job updates
   */
  subscribeToJob(jobId) {
    if (this.ws && this.isConnected) {
      const message = {
        type: 'subscribe_job',
        job_id: jobId
      };
      console.log('Subscribing to job:', jobId);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot subscribe to job: WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from job updates
   */
  unsubscribeFromJob(jobId) {
    if (this.ws && this.isConnected) {
      const message = {
        type: 'unsubscribe_job',
        job_id: jobId
      };
      console.log('Unsubscribing from job:', jobId);
      this.ws.send(JSON.stringify(message));
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
    const key = `${jobId}_${event}`;
    if (!this.jobListeners.has(key)) {
      this.jobListeners.set(key, []);
    }
    this.jobListeners.get(key).push(callback);
  }

  /**
   * Remove job-specific event listener
   */
  removeJobEventListener(jobId, event, callback) {
    const key = `${jobId}_${event}`;
    if (this.jobListeners.has(key)) {
      const callbacks = this.jobListeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    const { type, job_id, ...payload } = data;
    console.log('WebSocket message received:', type, job_id);

    switch (type) {
      case 'pong':
        // Heartbeat response
        this.lastPingTime = Date.now();
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
          this.pingTimeout = null;
        }
        break;
      case 'subscribed':
        console.log('Subscribed to job:', job_id);
        this.triggerEvent('subscribed', { job_id, ...payload });
        break;
      case 'unsubscribed':
        console.log('Unsubscribed from job:', job_id);
        this.triggerEvent('unsubscribed', { job_id, ...payload });
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
      default:
        console.log('Unknown WebSocket message type:', type, payload);
    }
  }

  /**
   * Handle job-specific WebSocket messages
   */
  handleJobMessage(data) {
    const { type, job_id, ...payload } = data;
    console.log('Job WebSocket message received:', type, job_id);

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
        console.log('Unknown job WebSocket message type:', type, payload);
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
   * Trigger job-specific event
   */
  triggerJobEvent(jobId, event, data) {
    const key = `${jobId}_${event}`;
    if (this.jobListeners.has(key)) {
      this.jobListeners.get(key).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in job event listener:', error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.lastPingTime = Date.now();
        
        // Set timeout for pong response
        this.pingTimeout = setTimeout(() => {
          console.warn('Ping timeout - connection may be stale');
          this.connectionStatus = 'stale';
        }, 10000); // 10 second timeout
      }
      if (this.jobWs && this.jobWs.readyState === WebSocket.OPEN) {
        this.jobWs.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
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
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 
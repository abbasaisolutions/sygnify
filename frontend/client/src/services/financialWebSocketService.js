/**
 * Financial WebSocket Service
 * Handles real-time financial data streaming, market updates, and KPI monitoring
 */

import { API_BASE_URL } from '../config/api.js';

class FinancialWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.pingInterval = null;
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionStatus = 'disconnected';
    this.lastPingTime = null;
    this.pingTimeout = null;
    this.marketDataCache = new Map();
    this.kpiCache = new Map();
  }

  /**
   * Connect to the financial dashboard WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws/financial-dashboard';
        console.log('Attempting to connect to Financial WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        this.connectionStatus = 'connecting';

        this.ws.onopen = () => {
          console.log('Financial WebSocket connected successfully');
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
            console.error('Error parsing Financial WebSocket message:', error);
            console.error('Raw message:', event.data);
          }
        };

        this.ws.onclose = (event) => {
          console.log('Financial WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Financial WebSocket error:', error);
          this.connectionStatus = 'error';
          reject(error);
        };

      } catch (error) {
        console.error('Error creating Financial WebSocket connection:', error);
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    console.log('Financial WebSocket message received:', data);

    switch (data.type) {
      case 'dashboard_update':
        this.handleDashboardUpdate(data);
        break;
      case 'market_data':
        this.handleMarketData(data);
        break;
      case 'kpi_update':
        this.handleKPIUpdate(data);
        break;
      case 'risk_alert':
        this.handleRiskAlert(data);
        break;
      case 'prediction_update':
        this.handlePredictionUpdate(data);
        break;
      case 'pong':
        this.handlePong(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }

    // Trigger event listeners
    this.triggerEvent(data.type, data);
  }

  /**
   * Handle dashboard updates
   */
  handleDashboardUpdate(data) {
    if (data.kpi) {
      this.kpiCache.set('current', data.kpi);
      console.log('KPI updated:', data.kpi);
    }
  }

  /**
   * Handle market data updates
   */
  handleMarketData(data) {
    if (data.market) {
      this.marketDataCache.set('current', data.market);
      console.log('Market data updated:', data.market);
    }
  }

  /**
   * Handle KPI updates
   */
  handleKPIUpdate(data) {
    if (data.kpi) {
      this.kpiCache.set(data.kpi.id, data.kpi);
      console.log('KPI update:', data.kpi);
    }
  }

  /**
   * Handle risk alerts
   */
  handleRiskAlert(data) {
    console.log('Risk alert received:', data);
    // Trigger risk alert event
    this.triggerEvent('risk_alert', data);
  }

  /**
   * Handle prediction updates
   */
  handlePredictionUpdate(data) {
    console.log('Prediction update received:', data);
    // Trigger prediction update event
    this.triggerEvent('prediction_update', data);
  }

  /**
   * Handle pong response
   */
  handlePong(data) {
    this.lastPingTime = Date.now();
    console.log('Pong received');
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'ping' });
        this.lastPingTime = Date.now();
        
        // Set timeout for pong response
        this.pingTimeout = setTimeout(() => {
          console.warn('No pong received, connection may be stale');
        }, 5000);
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
      this.connectionStatus = 'failed';
    }
  }

  /**
   * Send message to WebSocket
   */
  sendMessage(message) {
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Subscribe to specific data types
   */
  subscribe(dataType) {
    this.sendMessage({
      type: 'subscribe',
      dataType: dataType
    });
  }

  /**
   * Unsubscribe from specific data types
   */
  unsubscribe(dataType) {
    this.sendMessage({
      type: 'unsubscribe',
      dataType: dataType
    });
  }

  /**
   * Request specific market data
   */
  requestMarketData(symbols = []) {
    this.sendMessage({
      type: 'request_market_data',
      symbols: symbols
    });
  }

  /**
   * Request KPI updates
   */
  requestKPIUpdates(kpiIds = []) {
    this.sendMessage({
      type: 'request_kpi_updates',
      kpiIds: kpiIds
    });
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
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastPingTime: this.lastPingTime
    };
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy() {
    return this.isConnected && 
           this.connectionStatus === 'connected' && 
           this.lastPingTime && 
           (Date.now() - this.lastPingTime) < 60000; // 1 minute
  }

  /**
   * Get cached market data
   */
  getCachedMarketData() {
    return this.marketDataCache.get('current') || null;
  }

  /**
   * Get cached KPI data
   */
  getCachedKPIData() {
    return this.kpiCache.get('current') || null;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.marketDataCache.clear();
    this.kpiCache.clear();
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connectionStatus: this.connectionStatus,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      marketDataCacheSize: this.marketDataCache.size,
      kpiCacheSize: this.kpiCache.size,
      listenersCount: Array.from(this.listeners.values()).reduce((sum, callbacks) => sum + callbacks.length, 0)
    };
  }
}

// Create singleton instance
const financialWebSocketService = new FinancialWebSocketService();

export default financialWebSocketService; 
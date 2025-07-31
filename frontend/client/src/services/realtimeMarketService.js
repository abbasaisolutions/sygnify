class RealtimeMarketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.subscriptions = new Set();
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.baseURL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    }

    /**
     * Connect to real-time market data WebSocket
     */
    connect() {
        if (this.isConnected) {
            console.log('Already connected to real-time market service');
            return;
        }

        try {
            this.ws = new WebSocket(`${this.baseURL}/ws/realtime-market`);
            
            this.ws.onopen = () => {
                console.log('✅ Connected to real-time market data stream');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.notifyListeners('connection', { connected: true });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ Disconnected from real-time market data stream');
                this.isConnected = false;
                this.stopHeartbeat();
                this.notifyListeners('connection', { connected: false });
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyListeners('error', { error: error.message });
            };

        } catch (error) {
            console.error('Error connecting to real-time market service:', error);
            this.notifyListeners('error', { error: error.message });
        }
    }

    /**
     * Disconnect from real-time market data WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.stopHeartbeat();
        this.subscriptions.clear();
    }

    /**
     * Subscribe to a market data stream
     */
    subscribe(streamType, symbols = []) {
        if (!this.isConnected) {
            console.warn('Not connected to real-time market service');
            return;
        }

        const message = {
            type: 'subscribe',
            stream_type: streamType,
            symbols: symbols
        };

        this.ws.send(JSON.stringify(message));
        this.subscriptions.add(streamType);
        console.log(`📊 Subscribed to ${streamType} stream`);
    }

    /**
     * Unsubscribe from a market data stream
     */
    unsubscribe(streamType) {
        if (!this.isConnected) {
            return;
        }

        const message = {
            type: 'unsubscribe',
            stream_type: streamType
        };

        this.ws.send(JSON.stringify(message));
        this.subscriptions.delete(streamType);
        console.log(`📊 Unsubscribed from ${streamType} stream`);
    }

    /**
     * Get stream status
     */
    getStatus() {
        if (!this.isConnected) {
            return;
        }

        const message = {
            type: 'get_status'
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Get recent alerts
     */
    getAlerts(limit = 10) {
        if (!this.isConnected) {
            return;
        }

        const message = {
            type: 'get_alerts',
            limit: limit
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        const { type, timestamp } = data;

        switch (type) {
            case 'connection_established':
                console.log('🎯 Real-time market connection established:', data);
                this.notifyListeners('connection_established', data);
                break;

            case 'subscription_confirmed':
                console.log('✅ Subscription confirmed:', data);
                this.notifyListeners('subscription_confirmed', data);
                break;

            case 'unsubscription_confirmed':
                console.log('✅ Unsubscription confirmed:', data);
                this.notifyListeners('unsubscription_confirmed', data);
                break;

            case 'market_update':
                console.log('📈 Market update received:', data.stream_type);
                this.notifyListeners('market_update', data);
                break;

            case 'market_alert':
                console.log('🚨 Market alert received:', data.alert);
                this.notifyListeners('market_alert', data);
                break;

            case 'stream_status':
                console.log('📊 Stream status:', data.status);
                this.notifyListeners('stream_status', data);
                break;

            case 'recent_alerts':
                console.log('📋 Recent alerts:', data.alerts);
                this.notifyListeners('recent_alerts', data);
                break;

            case 'heartbeat':
                // Handle heartbeat silently
                break;

            case 'pong':
                // Handle pong response
                break;

            case 'error':
                console.error('❌ Real-time market error:', data.message);
                this.notifyListeners('error', data);
                break;

            default:
                console.log('📨 Unknown message type:', type, data);
                this.notifyListeners('unknown', data);
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
     * Notify all listeners for an event
     */
    notifyListeners(event, data) {
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
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Send ping every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.notifyListeners('max_reconnect_attempts', {});
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            subscriptions: Array.from(this.subscriptions),
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Subscribe to all market data streams
     */
    subscribeToAll() {
        const streams = [
            'market_overview',
            'indices',
            'commodities',
            'currencies',
            'economic_indicators',
            'sentiment',
            'alerts'
        ];

        streams.forEach(stream => {
            this.subscribe(stream);
        });
    }

    /**
     * Unsubscribe from all streams
     */
    unsubscribeFromAll() {
        this.subscriptions.forEach(stream => {
            this.unsubscribe(stream);
        });
    }
}

// Create singleton instance
const realtimeMarketService = new RealtimeMarketService();

export default realtimeMarketService; 
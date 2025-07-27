import React, { useState, useEffect, useRef } from 'react';
import { 
    Upload, 
    Database, 
    Api, 
    Wifi, 
    FileText, 
    Cloud, 
    Settings, 
    Play, 
    Stop, 
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Info,
    Download,
    Eye,
    BarChart3,
    Zap,
    Globe,
    Server,
    HardDrive
} from 'lucide-react';

const EnhancedDataConnector = () => {
    const [activeTab, setActiveTab] = useState('file');
    const [connections, setConnections] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [errors, setErrors] = useState([]);
    const [status, setStatus] = useState({});
    
    // File upload state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    
    // Database connection state
    const [dbConfig, setDbConfig] = useState({
        type: 'postgresql',
        host: 'localhost',
        port: '5432',
        database: '',
        user: '',
        password: '',
        query: ''
    });
    
    // API connection state
    const [apiConfig, setApiConfig] = useState({
        url: '',
        method: 'GET',
        headers: {},
        body: '',
        auth: {
            type: 'none',
            token: ''
        }
    });
    
    // Real-time connection state
    const [realtimeConfig, setRealtimeConfig] = useState({
        protocol: 'websocket',
        url: '',
        options: {}
    });
    
    const fileInputRef = useRef();
    const wsRef = useRef();

    // ==================== COMPONENT INITIALIZATION ====================

    useEffect(() => {
        fetchConnectionStatus();
        const interval = setInterval(fetchConnectionStatus, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // ==================== API FUNCTIONS ====================

    const fetchConnectionStatus = async () => {
        try {
            const response = await fetch('/api/enhanced-upload/status');
            const data = await response.json();
            if (data.success) {
                setStatus(data.status);
            }
        } catch (error) {
            console.error('Failed to fetch connection status:', error);
        }
    };

    const processFileUpload = async (files, options = {}) => {
        setIsProcessing(true);
        setErrors([]);
        
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            
            // Add options
            Object.keys(options).forEach(key => {
                formData.append(key, JSON.stringify(options[key]));
            });

            const response = await fetch('/api/enhanced-upload/upload-multiple', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                setResults(result);
                setConnections(prev => [...prev, ...result.results]);
            } else {
                setErrors([result.error]);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setIsProcessing(false);
        }
    };

    const connectDatabase = async () => {
        setIsProcessing(true);
        setErrors([]);
        
        try {
            const response = await fetch('/api/enhanced-upload/upload-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: dbConfig.type,
                    config: {
                        host: dbConfig.host,
                        port: parseInt(dbConfig.port),
                        database: dbConfig.database,
                        user: dbConfig.user,
                        password: dbConfig.password
                    },
                    query: dbConfig.query,
                    options: {}
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setResults(result);
                setConnections(prev => [...prev, result.data]);
            } else {
                setErrors([result.error]);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setIsProcessing(false);
        }
    };

    const connectAPI = async () => {
        setIsProcessing(true);
        setErrors([]);
        
        try {
            const response = await fetch('/api/enhanced-upload/upload-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: {
                        url: apiConfig.url,
                        method: apiConfig.method,
                        headers: apiConfig.headers,
                        auth: apiConfig.auth
                    },
                    endpoint: '/',
                    options: {}
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setResults(result);
                setConnections(prev => [...prev, result.data]);
            } else {
                setErrors([result.error]);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setIsProcessing(false);
        }
    };

    const connectRealTime = async () => {
        setIsProcessing(true);
        setErrors([]);
        
        try {
            const response = await fetch('/api/enhanced-upload/connect-realtime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: {
                        protocol: realtimeConfig.protocol,
                        url: realtimeConfig.url,
                        options: realtimeConfig.options
                    }
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setResults(result);
                // Set up WebSocket connection for real-time data
                setupWebSocketConnection(realtimeConfig.url);
            } else {
                setErrors([result.error]);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setIsProcessing(false);
        }
    };

    const setupWebSocketConnection = (url) => {
        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setStatus(prev => ({
                    ...prev,
                    realtimeConnected: true
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setConnections(prev => [...prev, {
                        source: 'realtime',
                        data,
                        timestamp: new Date()
                    }]);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setErrors(prev => [...prev, 'WebSocket connection error']);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setStatus(prev => ({
                    ...prev,
                    realtimeConnected: false
                }));
            };
        } catch (error) {
            setErrors(prev => [...prev, 'Failed to establish WebSocket connection']);
        }
    };

    const closeConnection = async (connectionId) => {
        try {
            const response = await fetch(`/api/enhanced-upload/connection/${connectionId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setConnections(prev => prev.filter(conn => conn.connectionId !== connectionId));
                fetchConnectionStatus();
            }
        } catch (error) {
            console.error('Failed to close connection:', error);
        }
    };

    const closeAllConnections = async () => {
        try {
            const response = await fetch('/api/enhanced-upload/connections', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setConnections([]);
                if (wsRef.current) {
                    wsRef.current.close();
                }
                fetchConnectionStatus();
            }
        } catch (error) {
            console.error('Failed to close all connections:', error);
        }
    };

    // ==================== EVENT HANDLERS ====================

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        
        // Update upload progress
        const progress = {};
        files.forEach(file => {
            progress[file.name] = 0;
        });
        setUploadProgress(progress);
    };

    const handleFileUpload = () => {
        if (selectedFiles.length === 0) return;
        processFileUpload(selectedFiles);
    };

    const handleDatabaseConnect = () => {
        if (!dbConfig.database || !dbConfig.query) {
            setErrors(['Please fill in all required database fields']);
            return;
        }
        connectDatabase();
    };

    const handleAPIConnect = () => {
        if (!apiConfig.url) {
            setErrors(['Please provide API URL']);
            return;
        }
        connectAPI();
    };

    const handleRealTimeConnect = () => {
        if (!realtimeConfig.url) {
            setErrors(['Please provide real-time connection URL']);
            return;
        }
        connectRealTime();
    };

    // ==================== RENDER FUNCTIONS ====================

    const renderFileUpload = () => (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                    <p className="text-lg font-medium">Upload Data Files</p>
                    <p className="text-sm text-gray-500">
                        Support for CSV, Excel, JSON, XML, YAML, and more formats
                    </p>
                    <p className="text-xs text-gray-400">
                        Maximum file size: 500MB | Multiple files: Up to 10
                    </p>
                </div>
                
                <div className="mt-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".csv,.xlsx,.xls,.json,.xml,.yaml,.yml,.parquet,.avro,.orc,.zip,.tar,.gz"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Select Files
                    </button>
                </div>
                
                {selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Selected Files:</p>
                        <div className="space-y-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span>{file.name}</span>
                                    <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleFileUpload}
                            disabled={isProcessing}
                            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {isProcessing ? 'Processing...' : 'Upload & Process'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDatabaseConnection = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Connection
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Database Type</label>
                        <select
                            value={dbConfig.type}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="sqlite">SQLite</option>
                            <option value="mssql">SQL Server</option>
                            <option value="oracle">Oracle</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Host</label>
                        <input
                            type="text"
                            value={dbConfig.host}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="localhost"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <input
                            type="text"
                            value={dbConfig.port}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="5432"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Database</label>
                        <input
                            type="text"
                            value={dbConfig.database}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="database_name"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={dbConfig.user}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, user: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="username"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={dbConfig.password}
                            onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="password"
                        />
                    </div>
                </div>
                
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">SQL Query</label>
                    <textarea
                        value={dbConfig.query}
                        onChange={(e) => setDbConfig(prev => ({ ...prev, query: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 h-24"
                        placeholder="SELECT * FROM your_table LIMIT 1000"
                    />
                </div>
                
                <button
                    onClick={handleDatabaseConnect}
                    disabled={isProcessing}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isProcessing ? 'Connecting...' : 'Connect & Process'}
                </button>
            </div>
        </div>
    );

    const renderAPIConnection = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Api className="h-5 w-5 mr-2" />
                    API Connection
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">API URL</label>
                        <input
                            type="url"
                            value={apiConfig.url}
                            onChange={(e) => setApiConfig(prev => ({ ...prev, url: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="https://api.example.com/data"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Method</label>
                            <select
                                value={apiConfig.method}
                                onChange={(e) => setApiConfig(prev => ({ ...prev, method: e.target.value }))}
                                className="w-full border rounded-md px-3 py-2"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Auth Type</label>
                            <select
                                value={apiConfig.auth.type}
                                onChange={(e) => setApiConfig(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, type: e.target.value }
                                }))}
                                className="w-full border rounded-md px-3 py-2"
                            >
                                <option value="none">None</option>
                                <option value="bearer">Bearer Token</option>
                                <option value="api_key">API Key</option>
                                <option value="basic">Basic Auth</option>
                            </select>
                        </div>
                    </div>
                    
                    {apiConfig.auth.type !== 'none' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Token/Key</label>
                            <input
                                type="password"
                                value={apiConfig.auth.token}
                                onChange={(e) => setApiConfig(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, token: e.target.value }
                                }))}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="Enter your token or key"
                            />
                        </div>
                    )}
                </div>
                
                <button
                    onClick={handleAPIConnect}
                    disabled={isProcessing}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    {isProcessing ? 'Connecting...' : 'Connect & Process'}
                </button>
            </div>
        </div>
    );

    const renderRealTimeConnection = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Real-Time Connection
                </h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Protocol</label>
                            <select
                                value={realtimeConfig.protocol}
                                onChange={(e) => setRealtimeConfig(prev => ({ ...prev, protocol: e.target.value }))}
                                className="w-full border rounded-md px-3 py-2"
                            >
                                <option value="websocket">WebSocket</option>
                                <option value="sse">Server-Sent Events</option>
                                <option value="mqtt">MQTT</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Connection URL</label>
                            <input
                                type="url"
                                value={realtimeConfig.url}
                                onChange={(e) => setRealtimeConfig(prev => ({ ...prev, url: e.target.value }))}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="ws://localhost:8080/stream"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleRealTimeConnect}
                            disabled={isProcessing || status.realtimeConnected}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {isProcessing ? 'Connecting...' : 'Connect'}
                        </button>
                        
                        {status.realtimeConnected && (
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Connected</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConnections = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Active Connections</h3>
                <button
                    onClick={closeAllConnections}
                    className="text-red-600 hover:text-red-700 text-sm"
                >
                    Close All
                </button>
            </div>
            
            {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active connections</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {connections.map((connection, index) => (
                        <div key={index} className="bg-white rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        {connection.source === 'file' && <FileText className="h-4 w-4" />}
                                        {connection.source === 'database' && <Database className="h-4 w-4" />}
                                        {connection.source === 'api' && <Api className="h-4 w-4" />}
                                        {connection.source === 'realtime' && <Wifi className="h-4 w-4" />}
                                        <span className="font-medium">{connection.source}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {connection.recordCount || 0} records
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => {/* View details */}}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => closeConnection(connection.connectionId)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Stop className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStatus = () => (
        <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Status
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-gray-500">Active Connections:</span>
                    <span className="ml-2 font-medium">{status.activeConnections || 0}</span>
                </div>
                <div>
                    <span className="text-gray-500">Cache Size:</span>
                    <span className="ml-2 font-medium">{status.cacheSize || 0}</span>
                </div>
                <div>
                    <span className="text-gray-500">Queue Length:</span>
                    <span className="ml-2 font-medium">{status.queueLength || 0}</span>
                </div>
                <div>
                    <span className="text-gray-500">Processing:</span>
                    <span className="ml-2 font-medium">{status.isProcessing ? 'Yes' : 'No'}</span>
                </div>
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Enhanced Data Connector
                </h1>
                <p className="text-gray-600">
                    Connect to multiple data sources and formats with real-time processing
                </p>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <h3 className="text-sm font-medium text-red-800">Errors</h3>
                    </div>
                    <div className="mt-2 text-sm text-red-700">
                        {errors.map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'file', label: 'File Upload', icon: FileText },
                        { id: 'database', label: 'Database', icon: Database },
                        { id: 'api', label: 'API', icon: Api },
                        { id: 'realtime', label: 'Real-Time', icon: Wifi },
                        { id: 'connections', label: 'Connections', icon: Server },
                        { id: 'status', label: 'Status', icon: Settings }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'file' && renderFileUpload()}
                {activeTab === 'database' && renderDatabaseConnection()}
                {activeTab === 'api' && renderAPIConnection()}
                {activeTab === 'realtime' && renderRealTimeConnection()}
                {activeTab === 'connections' && renderConnections()}
                {activeTab === 'status' && renderStatus()}
            </div>

            {/* Results Display */}
            {results && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Processing Results
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Records Processed:</span>
                                <span className="ml-2 font-medium">{results.data?.recordCount || 0}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Source:</span>
                                <span className="ml-2 font-medium">{results.data?.source || 'Unknown'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Processing Time:</span>
                                <span className="ml-2 font-medium">
                                    {results.data?.metadata?.processingTime || 0}ms
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                View Details
                            </button>
                            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                Export Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedDataConnector; 
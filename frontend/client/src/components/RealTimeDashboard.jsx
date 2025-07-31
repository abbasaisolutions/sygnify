import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Wifi, WifiOff, Server, Database, Brain, 
  TrendingUp, AlertCircle, CheckCircle, Clock, Zap,
  Users, BarChart3, Settings, Globe
} from 'lucide-react';
import websocketService from '../services/websocketService.js';

const RealTimeDashboard = () => {
  const [systemStatus, setSystemStatus] = useState({
    websocket: 'disconnected',
    backend: 'unknown',
    database: 'unknown',
    ml_services: 'unknown'
  });
  
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpu: 0,
    memory: 0,
    activeConnections: 0,
    requestsPerSecond: 0
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      try {
        await websocketService.connect();
        setSystemStatus(prev => ({ ...prev, websocket: 'connected' }));
        
        // Listen for system updates
        websocketService.addEventListener('system_update', handleSystemUpdate);
        websocketService.addEventListener('job_update', handleJobUpdate);
        websocketService.addEventListener('performance_update', handlePerformanceUpdate);
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setSystemStatus(prev => ({ ...prev, websocket: 'failed' }));
      }
    };

    initializeWebSocket();

    // Simulate performance metrics updates
    const performanceInterval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 50) + 10,
        requestsPerSecond: Math.floor(Math.random() * 100) + 20
      }));
    }, 2000);

    // Simulate system status updates
    const systemInterval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        backend: Math.random() > 0.1 ? 'healthy' : 'warning',
        database: Math.random() > 0.05 ? 'healthy' : 'warning',
        ml_services: Math.random() > 0.15 ? 'healthy' : 'warning'
      }));
    }, 5000);

    return () => {
      clearInterval(performanceInterval);
      clearInterval(systemInterval);
      websocketService.removeEventListener('system_update', handleSystemUpdate);
      websocketService.removeEventListener('job_update', handleJobUpdate);
      websocketService.removeEventListener('performance_update', handlePerformanceUpdate);
    };
  }, []);

  const handleSystemUpdate = (data) => {
    setSystemStatus(prev => ({ ...prev, ...data }));
  };

  const handleJobUpdate = (data) => {
    setActiveJobs(prev => {
      const existing = prev.find(job => job.id === data.job_id);
      if (existing) {
        return prev.map(job => 
          job.id === data.job_id 
            ? { ...job, ...data, timestamp: new Date() }
            : job
        );
      } else {
        return [...prev, { id: data.job_id, ...data, timestamp: new Date() }];
      }
    });

    // Add to recent activity
    setRecentActivity(prev => [
      {
        id: Date.now(),
        type: 'job_update',
        message: `Job ${data.job_id}: ${data.stage}`,
        timestamp: new Date(),
        data
      },
      ...prev.slice(0, 9) // Keep only last 10 activities
    ]);
  };

  const handlePerformanceUpdate = (data) => {
    setPerformanceMetrics(prev => ({ ...prev, ...data }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'failed':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Real-Time System Monitor
        </h2>
        <div className="flex items-center gap-2">
          {systemStatus.websocket === 'connected' ? (
            <div className="flex items-center gap-1 text-green-400">
              <Wifi className="w-4 h-4" />
              <span className="text-xs">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div 
          className="bg-slate-800 p-4 rounded-lg border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Backend</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.backend)}`}>
            {getStatusIcon(systemStatus.backend)}
            <span className="text-xs capitalize">{systemStatus.backend}</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-800 p-4 rounded-lg border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Database</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.database)}`}>
            {getStatusIcon(systemStatus.database)}
            <span className="text-xs capitalize">{systemStatus.database}</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-800 p-4 rounded-lg border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">ML Services</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.ml_services)}`}>
            {getStatusIcon(systemStatus.ml_services)}
            <span className="text-xs capitalize">{systemStatus.ml_services}</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-800 p-4 rounded-lg border border-slate-700"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">Connections</span>
          </div>
          <div className="text-cyan-400 font-mono text-lg">
            {performanceMetrics.activeConnections}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Performance Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>CPU Usage</span>
                <span>{performanceMetrics.cpu.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${performanceMetrics.cpu}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Memory Usage</span>
                <span>{performanceMetrics.memory.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${performanceMetrics.memory}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Requests/sec</span>
                <span>{performanceMetrics.requestsPerSecond}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(performanceMetrics.requestsPerSecond / 2, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Active Jobs
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <motion.div 
                  key={job.id}
                  className="flex items-center justify-between p-2 bg-slate-700 rounded text-xs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="font-mono">{job.id.slice(0, 8)}...</span>
                  <span className="text-cyan-400 capitalize">{job.stage}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-slate-500 text-xs">No active jobs</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Recent Activity
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          <AnimatePresence>
            {recentActivity.map(activity => (
              <motion.div 
                key={activity.id}
                className="flex items-center gap-2 p-2 bg-slate-700 rounded text-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="flex-1">{activity.message}</span>
                <span className="text-slate-400">
                  {activity.timestamp.toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {recentActivity.length === 0 && (
            <div className="text-slate-500 text-xs">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard; 
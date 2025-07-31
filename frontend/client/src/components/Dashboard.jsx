import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, DollarSign, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Activity,
  PieChart, Target, Shield, Zap, Download, Share2,
  Globe, TrendingDown, DollarSign as DollarIcon,
  Wifi, WifiOff, Bell
} from 'lucide-react';
import marketDataService from '../services/marketDataService';
import realtimeMarketService from '../services/realtimeMarketService';

const Dashboard = ({ analysisResults, onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [marketDataError, setMarketDataError] = useState(null);
  
  // Real-time market data state
  const [realtimeData, setRealtimeData] = useState({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [marketAlerts, setMarketAlerts] = useState([]);
  const [streamStatus, setStreamStatus] = useState(null);

  // Extract financial KPIs from analysis results
  const financialKPIs = analysisResults?.financial_kpis || {};
  const mlPrompts = analysisResults?.ml_prompts || [];
  const riskAssessment = analysisResults?.risk_assessment || {};
  const recommendations = analysisResults?.recommendations || [];

  // Check for error status
  const hasError = analysisResults?.status === 'error';
  const errorMessage = analysisResults?.error;

  // Fetch market data on component mount
  useEffect(() => {
    const fetchMarketData = async () => {
      setMarketDataLoading(true);
      setMarketDataError(null);
      
      try {
        const data = await marketDataService.getAllMarketData();
        setMarketData(data);
        console.log('📊 Market data loaded successfully:', data);
      } catch (error) {
        console.error('❌ Error fetching market data:', error);
        setMarketDataError(error.message);
      } finally {
        setMarketDataLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Real-time market data functionality
  useEffect(() => {
    // Connect to real-time market service
    realtimeMarketService.connect();

    // Set up event listeners
    const handleConnection = (data) => {
      setRealtimeConnected(data.connected);
      console.log('Real-time connection status:', data.connected);
    };

    const handleMarketUpdate = (data) => {
      setRealtimeData(prev => ({
        ...prev,
        [data.stream_type]: data.data
      }));
      console.log('Real-time market update:', data.stream_type, data.data);
    };

    const handleMarketAlert = (data) => {
      setMarketAlerts(prev => [data.alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      console.log('Market alert received:', data.alert);
    };

    const handleStreamStatus = (data) => {
      setStreamStatus(data.status);
      console.log('Stream status updated:', data.status);
    };

    // Add event listeners
    realtimeMarketService.addEventListener('connection', handleConnection);
    realtimeMarketService.addEventListener('market_update', handleMarketUpdate);
    realtimeMarketService.addEventListener('market_alert', handleMarketAlert);
    realtimeMarketService.addEventListener('stream_status', handleStreamStatus);

    // Subscribe to all market data streams
    setTimeout(() => {
      if (realtimeMarketService.getConnectionStatus().connected) {
        realtimeMarketService.subscribeToAll();
        realtimeMarketService.getStatus();
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      realtimeMarketService.removeEventListener('connection', handleConnection);
      realtimeMarketService.removeEventListener('market_update', handleMarketUpdate);
      realtimeMarketService.removeEventListener('market_alert', handleMarketAlert);
      realtimeMarketService.removeEventListener('stream_status', handleStreamStatus);
      realtimeMarketService.disconnect();
    };
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'kpis', label: 'Financial KPIs', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: Zap },
    { id: 'market', label: 'Market Trends', icon: Activity },
    { id: 'risks', label: 'Risk Assessment', icon: Shield },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  const KPICard = ({ title, value, trend, color, icon: Icon }) => (
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
            </div>
        {value && value !== "N/A" && (
          <div className="flex items-center space-x-1">
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? 'Positive' : 'Negative'}
            </span>
          </div>
        )}
          </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value || "No data available"}</p>
    </motion.div>
  );

  const InsightCard = ({ insight, index }) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Zap className="w-4 h-4 text-white" />
                </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
    </motion.div>
  );

  const RiskCard = ({ risk, level, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg p-4 border ${
        level === 'low' ? 'bg-green-50 border-green-200' :
        level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          level === 'low' ? 'bg-green-500' :
          level === 'medium' ? 'bg-yellow-500' :
          'bg-red-500'
        }`}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{risk}</h4>
          <p className={`text-sm font-medium ${
            level === 'low' ? 'text-green-600' :
            level === 'medium' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {level.toUpperCase()} RISK
                </p>
        </div>
      </div>
          </motion.div>
  );

  const RecommendationCard = ({ recommendation, index }) => (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-green-500 rounded-lg">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">Recommendation {index + 1}</h4>
          <p className="text-sm text-gray-600">{recommendation}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Sygnify Dashboard</h1>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Analysis Complete</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button 
                onClick={onBackToLanding}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Analysis Error</h3>
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* KPIs Grid */}
            {Object.keys(financialKPIs).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Revenue Growth"
                  value={financialKPIs.revenue_growth}
                  trend="up"
                  color="bg-green-500"
                  icon={TrendingUp}
                />
                <KPICard
                  title="Profit Margin"
                  value={financialKPIs.profit_margin}
                  trend="up"
                  color="bg-blue-500"
                  icon={DollarSign}
                />
                <KPICard
                  title="Cash Flow"
                  value={financialKPIs.cash_flow}
                  trend="up"
                  color="bg-purple-500"
                  icon={Activity}
                />
                <KPICard
                  title="ROI"
                  value={financialKPIs.roi}
                  trend="up"
                  color="bg-indigo-500"
                  icon={BarChart3}
                />
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No Financial Data Available</h3>
                    <p className="text-yellow-700">Financial KPIs will be displayed here once the analysis is complete.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional KPIs */}
            {Object.keys(financialKPIs).length > 4 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Financial Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(financialKPIs)
                    .filter(([key]) => !['revenue_growth', 'profit_margin', 'cash_flow', 'roi'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-bold text-gray-900">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Data Summary */}
            {Object.keys(financialKPIs).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Data Points Analyzed:</span>
                      <span className="font-semibold">{analysisResults?.statistical_analysis?.data_points_analyzed || analysisResults?.data_points_analyzed || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Analysis Confidence:</span>
                      <span className="font-semibold">{analysisResults?.ai_analysis?.confidence_score ? `${(analysisResults.ai_analysis.confidence_score * 100).toFixed(1)}%` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Analysis Timestamp:</span>
                      <span className="font-semibold">{analysisResults?.timestamp ? new Date(analysisResults.timestamp).toLocaleString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Risk Score:</span>
                      <span className="font-semibold">{riskAssessment?.risk_score || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    {Object.entries(financialKPIs).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Market Overview */}
            {analysisResults?.market_context && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.market_context.industry_trends && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Industry Trends</h4>
                      <p className="text-sm text-blue-800">{analysisResults.market_context.industry_trends}</p>
                    </div>
                  )}
                  {analysisResults.market_context.economic_outlook && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-1">Economic Outlook</h4>
                      <p className="text-sm text-green-800">{analysisResults.market_context.economic_outlook}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'kpis' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {Object.keys(financialKPIs).length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial KPIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(financialKPIs).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No Financial KPIs Available</h3>
                    <p className="text-yellow-700">Financial KPIs will be displayed here once the analysis is complete.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* AI Analysis Narrative */}
            {analysisResults?.ai_analysis?.analysis && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Narrative</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{analysisResults.ai_analysis.analysis}</p>
                  {analysisResults.ai_analysis.confidence_score && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Confidence Score:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {(analysisResults.ai_analysis.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {analysisResults?.ai_analysis?.key_insights?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {analysisResults.ai_analysis.key_insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="p-1 bg-green-500 rounded-full">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ML Prompts */}
            {mlPrompts.length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Analysis Prompts</h3>
                <div className="space-y-4">
                  {mlPrompts.map((prompt, index) => (
                    <InsightCard
                      key={index}
                      insight={{
                        title: `Analysis Prompt ${index + 1}`,
                        description: prompt
                      }}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No AI Insights Available</h3>
                    <p className="text-yellow-700">AI-generated insights will be displayed here once the analysis is complete.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'market' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Market Data Loading State */}
            {marketDataLoading && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading market data...</span>
                </div>
              </div>
            )}

            {/* Market Data Error State */}
            {marketDataError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Market Data Error</h3>
                    <p className="text-red-700">{marketDataError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Data Content */}
            {marketData && !marketDataLoading && (
              <>
                {/* Market Overview */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Market Overview
                  </h3>
                  
                  {/* Major Indices */}
                  {marketData.indices?.indices && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Major Indices</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(marketData.indices.indices).map(([symbol, data]) => (
                          <div key={symbol} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900">{symbol}</h5>
                                <p className="text-2xl font-bold text-gray-900">${data.price?.toFixed(2) || 'N/A'}</p>
                              </div>
                              <div className={`text-right ${data.change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="flex items-center">
                                  {data.change_percent > 0 ? (
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4 mr-1" />
                                  )}
                                  <span className="font-semibold">
                                    {data.change_percent?.toFixed(2) || 0}%
                                  </span>
                                </div>
                                <p className="text-sm">
                                  {data.change > 0 ? '+' : ''}{data.change?.toFixed(2) || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Market Sentiment */}
                  {marketData.sentiment?.sentiment && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Market Sentiment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h5 className="font-semibold text-blue-900">VIX Volatility Index</h5>
                          <p className="text-2xl font-bold text-blue-900">
                            {marketData.sentiment.sentiment.vix_level?.toFixed(2) || 'N/A'}
                          </p>
                          <p className="text-sm text-blue-700">
                            {marketData.sentiment.sentiment.sentiment} sentiment
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h5 className="font-semibold text-green-900">Fear & Greed Index</h5>
                          <p className="text-2xl font-bold text-green-900">
                            {(marketData.sentiment.sentiment.fear_greed_index * 100)?.toFixed(0) || 'N/A'}
                          </p>
                          <p className="text-sm text-green-700">
                            {marketData.sentiment.sentiment.fear_greed_index > 0.5 ? 'Greed' : 'Fear'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interest Rates */}
                {marketData.rates?.interest_rates && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Interest Rates
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {Object.entries(marketData.rates.interest_rates).map(([term, rate]) => (
                        <div key={term} className="bg-gray-50 rounded-lg p-3 border text-center">
                          <h5 className="font-semibold text-gray-800 text-sm">{term.replace('_', ' ').toUpperCase()}</h5>
                          <p className="text-xl font-bold text-gray-900">{rate?.toFixed(2) || 'N/A'}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commodities */}
                {marketData.commodities?.commodities && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarIcon className="w-5 h-5 mr-2" />
                      Commodities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(marketData.commodities.commodities).map(([symbol, price]) => (
                        <div key={symbol} className="bg-gray-50 rounded-lg p-3 border text-center">
                          <h5 className="font-semibold text-gray-800 text-sm">
                            {symbol === 'GC' ? 'Gold' : 
                             symbol === 'CL' ? 'Crude Oil' :
                             symbol === 'SI' ? 'Silver' :
                             symbol === 'PL' ? 'Platinum' :
                             symbol === 'PA' ? 'Palladium' : symbol}
                          </h5>
                          <p className="text-lg font-bold text-gray-900">${price?.toFixed(2) || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Analysis */}
                {marketData.analysis?.analysis && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Analysis</h3>
                    <div className="space-y-4">
                      {marketData.analysis.analysis.recommendations?.map((rec, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time Market Data */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Wifi className={`w-5 h-5 mr-2 ${realtimeConnected ? 'text-green-500' : 'text-red-500'}`} />
                      Real-time Market Data
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-600">
                        {realtimeConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Connection Status */}
                  {!realtimeConnected && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <WifiOff className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-800">Real-time connection not available</span>
                      </div>
                    </div>
                  )}

                  {/* Real-time Market Updates */}
                  {realtimeConnected && Object.keys(realtimeData).length > 0 && (
                    <div className="space-y-4">
                      {/* Live Indices */}
                      {realtimeData.indices && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Live Market Indices
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(realtimeData.indices.indices || {}).slice(0, 4).map(([symbol, data]) => (
                              <div key={symbol} className="bg-white rounded p-3 border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{symbol}</span>
                                  <span className="font-bold text-gray-900">${data.price?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className={`text-sm ${data.change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.change_percent > 0 ? '+' : ''}{data.change_percent?.toFixed(2) || 0}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Live Sentiment */}
                      {realtimeData.sentiment && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Live Market Sentiment
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white rounded p-3 border">
                              <span className="text-sm text-gray-600">VIX Level</span>
                              <div className="font-bold text-blue-900">
                                {realtimeData.sentiment.sentiment?.vix_level?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-white rounded p-3 border">
                              <span className="text-sm text-gray-600">Fear & Greed</span>
                              <div className="font-bold text-blue-900">
                                {realtimeData.sentiment.sentiment?.fear_greed_index > 0.5 ? 'Greed' : 'Fear'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Market Alerts */}
                  {marketAlerts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Bell className="w-4 h-4 mr-2" />
                        Recent Market Alerts
                      </h4>
                      <div className="space-y-2">
                        {marketAlerts.slice(0, 5).map((alert, index) => (
                          <div key={index} className={`p-3 rounded-lg border ${
                            alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                            alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                                alert.severity === 'critical' ? 'text-red-500' :
                                alert.severity === 'warning' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{alert.symbol}</div>
                                <div className="text-sm text-gray-600">{alert.message}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(alert.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stream Status */}
                  {streamStatus && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Stream Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Active Connections:</span>
                          <div className="font-semibold">{streamStatus.active_connections}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Subscriptions:</span>
                          <div className="font-semibold">{streamStatus.total_subscriptions}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Alert Count:</span>
                          <div className="font-semibold">{streamStatus.alert_count}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Update:</span>
                          <div className="font-semibold">
                            {streamStatus.timestamp ? new Date(streamStatus.timestamp).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'risks' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {riskAssessment?.key_risks?.length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="space-y-4">
                  {riskAssessment.key_risks.map((risk, index) => (
                    <RiskCard
                      key={index}
                      risk={risk}
                      level={riskAssessment.risk_level}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No Risk Assessment Available</h3>
                    <p className="text-yellow-700">Risk assessment will be displayed here once the analysis is complete.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {recommendations.length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={recommendation}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No Recommendations Available</h3>
                    <p className="text-yellow-700">Recommendations will be displayed here once the analysis is complete.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
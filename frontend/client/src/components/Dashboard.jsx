import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, DollarSign, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Activity,
  PieChart, Target, Shield, Zap, Download, Share2,
  Globe, TrendingDown, DollarSign as DollarIcon,
  Wifi, WifiOff, Bell, FileText, Brain
} from 'lucide-react';
import marketDataService from '../services/marketDataService';
import realtimeMarketService from '../services/realtimeMarketService';

const Dashboard = ({ analysisResults, onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState('ai_analysis');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [marketDataError, setMarketDataError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'kpis', label: 'Financial KPIs', icon: TrendingUp },
    { id: 'ai_analysis', label: 'AI Analysis', icon: Zap },
    { id: 'market', label: 'Market Trends', icon: Activity },
    { id: 'risks', label: 'Risk Assessment', icon: Shield },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  // Fetch market data on component mount with enhanced error handling
  useEffect(() => {
    const fetchMarketData = async () => {
      setMarketDataLoading(true);
      setMarketDataError(null);
      
      try {
        const data = await marketDataService.getAllMarketData();
        setMarketData(data);
        
        // Log cache status
        if (data.cacheInfo) {
          console.log('📊 Market data loaded successfully:', {
            totalEntries: data.cacheInfo.totalEntries,
            cacheHitRate: data.comprehensive?.cacheStatus?.cacheHitRate || 'N/A',
            lastUpdated: data.comprehensive?.cacheStatus?.lastUpdated
          });
        }
      } catch (error) {
        console.error('❌ Error fetching market data:', error);
        setMarketDataError(error.message);
      } finally {
        setMarketDataLoading(false);
      }
    };

    fetchMarketData();
    
    // Set up periodic cache cleanup (every 10 minutes)
    const cacheCleanupInterval = setInterval(() => {
      marketDataService.clearExpiredCache();
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(cacheCleanupInterval);
    };
  }, []);

  // Manual refresh function
  const handleRefreshData = async () => {
    setRefreshing(true);
    setMarketDataError(null);
    
    try {
      const data = await marketDataService.refreshAllData();
      setMarketData(data);
      console.log('🔄 Market data manually refreshed');
    } catch (error) {
      console.error('❌ Error refreshing market data:', error);
      setMarketDataError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

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

  // Smart title generation for recommendations
  const generateRecommendationTitle = (recommendation) => {
    const text = recommendation.toLowerCase();
    
    // Define keyword patterns and their corresponding titles
    const patterns = [
      { keywords: ['revenue', 'growth', 'sales'], title: 'Revenue Growth Strategy' },
      { keywords: ['profit', 'margin', 'profitability'], title: 'Profitability Optimization' },
      { keywords: ['cost', 'expense', 'optimization'], title: 'Cost Optimization' },
      { keywords: ['cash', 'flow', 'liquidity'], title: 'Cash Flow Management' },
      { keywords: ['market', 'expansion', 'diversification'], title: 'Market Expansion' },
      { keywords: ['technology', 'digital', 'automation'], title: 'Technology Investment' },
      { keywords: ['risk', 'management', 'mitigation'], title: 'Risk Management' },
      { keywords: ['operational', 'efficiency', 'process'], title: 'Operational Efficiency' },
      { keywords: ['talent', 'human', 'capital', 'development'], title: 'Talent Development' },
      { keywords: ['partnership', 'acquisition', 'merger'], title: 'Strategic Partnerships' },
      { keywords: ['analytics', 'reporting', 'data'], title: 'Analytics Enhancement' },
      { keywords: ['quality', 'standards', 'maintain'], title: 'Quality Standards' },
      { keywords: ['contingency', 'plan', 'backup'], title: 'Contingency Planning' },
      { keywords: ['infrastructure', 'scaling', 'capacity'], title: 'Infrastructure Scaling' },
      { keywords: ['competitive', 'position', 'advantage'], title: 'Competitive Positioning' },
      { keywords: ['investment', 'capital', 'funding'], title: 'Investment Strategy' },
      { keywords: ['compliance', 'regulatory', 'legal'], title: 'Compliance Management' },
      { keywords: ['supply', 'chain', 'logistics'], title: 'Supply Chain Optimization' },
      { keywords: ['customer', 'service', 'experience'], title: 'Customer Experience' },
      { keywords: ['innovation', 'research', 'development'], title: 'Innovation Strategy' }
    ];
    
    // Find matching pattern
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => text.includes(keyword))) {
        return pattern.title;
      }
    }
    
    // Fallback: extract first meaningful phrase
    const words = recommendation.split(' ').slice(0, 4);
    return words.join(' ').replace(/[^\w\s]/g, '') + ' Strategy';
  };

  const RecommendationCard = ({ recommendation, index }) => {
    const title = generateRecommendationTitle(recommendation);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </motion.div>
    );
  };

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
                  value={financialKPIs.revenue_growth || "N/A"}
                  trend="up"
                  color="bg-green-500"
                  icon={TrendingUp}
                />
                <KPICard
                  title="Profit Margin"
                  value={financialKPIs.profit_margin || "N/A"}
                  trend="up"
                  color="bg-blue-500"
                  icon={DollarSign}
                />
                <KPICard
                  title="Cash Flow"
                  value={financialKPIs.cash_flow || "N/A"}
                  trend="up"
                  color="bg-purple-500"
                  icon={Activity}
                />
                <KPICard
                  title="ROI"
                  value={financialKPIs.roi || "N/A"}
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

            {/* Data Source Indicator */}
            {Object.keys(financialKPIs).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Real Data Analysis</h4>
                    <p className="text-blue-700 text-sm">
                      Financial KPIs calculated from your uploaded data • 
                      Data Quality: {financialKPIs.data_quality_score || "N/A"}% • 
                      Points Analyzed: {financialKPIs.data_points_analyzed || "N/A"}
                    </p>
                  </div>
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

        {activeTab === 'ai_analysis' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Executive Summary */}
            {analysisResults?.ai_analysis?.analysis && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-blue-600" />
                  Executive Summary
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="prose max-w-none">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base [&>**]:font-bold [&>**]:text-gray-900 [&>*]:mb-4 [&>*:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:mb-1">
                      {analysisResults.ai_analysis.analysis}
                    </div>
                  </div>
                </div>
                
                {/* Analysis Metadata */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysisResults.ai_analysis.confidence_score && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-800">Confidence Score</span>
                        <span className="text-lg font-bold text-blue-600">
                          {(analysisResults.ai_analysis.confidence_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-green-800">Analysis Type</span>
                      <span className="text-lg font-bold text-green-600">
                        {analysisResults.ai_analysis.analysis_type || 'Comprehensive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-purple-800">Key Insights</span>
                      <span className="text-lg font-bold text-purple-600">
                        {analysisResults.ai_analysis.key_insights?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Insights */}
            {analysisResults?.ai_analysis?.key_insights?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.ai_analysis.key_insights.map((insight, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="p-2 bg-green-500 rounded-full flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-800 font-medium">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Analysis */}
            {analysisResults?.ai_analysis?.market_analysis && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Globe className="w-6 h-6 mr-3 text-blue-600" />
                  Market Analysis
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-800 leading-relaxed text-base">
                    {analysisResults.ai_analysis.market_analysis}
                  </p>
                </div>
              </div>
            )}

            {/* Trend Analysis */}
            {analysisResults?.ai_analysis?.trend_analysis && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-green-600" />
                  Trend Analysis
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-gray-800 leading-relaxed text-base">
                    {analysisResults.ai_analysis.trend_analysis}
                  </p>
                </div>
              </div>
            )}

            {/* ML Prompts */}
            {mlPrompts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-purple-600" />
                  AI-Generated Analysis Prompts
                </h3>
                <div className="space-y-4">
                  {mlPrompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-500 rounded-full flex-shrink-0">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Analysis Prompt {index + 1}
                          </h4>
                          <p className="text-gray-700">{prompt}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback Mode Notice */}
            {analysisResults?.ai_analysis?.fallback && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">Fallback Analysis Mode</h3>
                    <p className="text-yellow-700">This analysis was generated using fallback data due to LLM service unavailability. For enhanced AI insights, ensure the LLM service is running.</p>
                  </div>
                </div>
              </div>
            )}

            {/* No Analysis Available */}
            {!analysisResults?.ai_analysis?.analysis && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No AI Analysis Available</h3>
                    <p className="text-yellow-700">AI-generated analysis will be displayed here once the analysis is complete.</p>
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
                {/* Data Source Indicator */}
                {marketData.comprehensive && (
                  <div className={`border rounded-xl p-4 mb-6 ${
                    marketData.comprehensive.data_source === 'real_apis' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          marketData.comprehensive.data_source === 'real_apis' 
                            ? 'bg-blue-500' 
                            : 'bg-yellow-500'
                        }`}>
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            marketData.comprehensive.data_source === 'real_apis' 
                              ? 'text-blue-900' 
                              : 'text-yellow-900'
                          }`}>
                            {marketData.comprehensive.data_source === 'real_apis' 
                              ? 'Real-time Market Data' 
                              : 'Market Data Unavailable'}
                          </h4>
                          <p className={`text-sm ${
                            marketData.comprehensive.data_source === 'real_apis' 
                              ? 'text-blue-700' 
                              : 'text-yellow-700'
                          }`}>
                            {marketData.comprehensive.data_source === 'real_apis' 
                              ? `✅ ${marketData.comprehensive.apis_connected}/${marketData.comprehensive.total_apis} APIs Connected • Success Rate: ${marketData.comprehensive.success_rate}`
                              : `⚠️ ${marketData.comprehensive.apis_connected}/${marketData.comprehensive.total_apis} APIs Connected • Success Rate: ${marketData.comprehensive.success_rate}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleRefreshData}
                          disabled={refreshing || marketDataLoading}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            refreshing || marketDataLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {refreshing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Refreshing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Refresh</span>
                            </>
                          )}
                        </button>
                        <div className="text-right">
                          <div className="flex flex-col items-end space-y-1">
                            <p className={`text-xs ${
                              marketData.comprehensive.data_source === 'real_apis' 
                                ? 'text-blue-600' 
                                : marketData.comprehensive.data_source === 'fallback'
                                ? 'text-orange-600'
                                : 'text-yellow-600'
                            }`}>
                              {marketData.comprehensive.data_source === 'real_apis' ? '🟢 Live Data' : 
                               marketData.comprehensive.data_source === 'fallback' ? '🟠 Fallback Data' : '🟡 Cached Data'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Updated: {marketData.comprehensive.timestamp ? new Date(marketData.comprehensive.timestamp).toLocaleTimeString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Data Available Message */}
                {marketData.comprehensive && !marketData.comprehensive.data_available && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-3 bg-gray-200 rounded-full">
                        <Globe className="w-8 h-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Market Data Temporarily Unavailable</h3>
                        <p className="text-gray-600 mb-4">
                          We're using cached data while real-time market data is temporarily unavailable. Our system:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 mb-6">
                          <li>• Caches market data for up to 1 hour to reduce API calls</li>
                          <li>• Uses fallback data when APIs are unavailable</li>
                          <li>• Automatically retries when services are restored</li>
                          <li>• Maintains data freshness with smart caching</li>
                        </ul>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Cache Status:</strong> {marketData.comprehensive.data_source === 'fallback' ? 'Using fallback data' : 'Using cached data'} • 
                            Last updated: {marketData.comprehensive.timestamp ? new Date(marketData.comprehensive.timestamp).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Data will automatically refresh when available. No action required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Data Content - Only show if data is available */}
                {marketData.comprehensive && marketData.comprehensive.data_available && (
                  <>
                    {/* Major Indices */}
                    {marketData.indices?.indices && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Major Market Indices</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(marketData.indices.indices).map(([symbol, data]) => {
                          const getIndexName = (symbol) => {
                            const nameMap = {
                              'SPY': 'S&P 500 ETF',
                              'QQQ': 'NASDAQ-100 ETF',
                              'IWM': 'Russell 2000 ETF',
                              'DIA': 'Dow Jones ETF',
                              'VTI': 'Total Stock Market ETF'
                            };
                            return nameMap[symbol] || symbol;
                          };
                          
                          const getIndexDescription = (symbol) => {
                            const descMap = {
                              'SPY': 'Large-cap US stocks',
                              'QQQ': 'Technology stocks',
                              'IWM': 'Small-cap stocks',
                              'DIA': 'Blue-chip stocks',
                              'VTI': 'Broad market index'
                            };
                            return descMap[symbol] || 'Market index';
                          };
                          
                          return (
                            <div key={symbol} className="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{getIndexName(symbol)}</h5>
                                  <p className="text-xs text-gray-500">{getIndexDescription(symbol)}</p>
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
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-gray-900">${data.price?.toFixed(2) || 'N/A'}</p>
                                <p className={`text-sm ${data.change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.change > 0 ? '+' : ''}{data.change?.toFixed(2) || 0}
                                </p>
                              </div>
                              {data.volume && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Volume: {(data.volume / 1000000).toFixed(1)}M
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Market Sentiment */}
                  {marketData.sentiment?.sentiment && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Market Sentiment Indicators</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-blue-900">VIX Volatility Index</h5>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              marketData.sentiment.sentiment.vix_level > 25 ? 'bg-red-100 text-red-800' :
                              marketData.sentiment.sentiment.vix_level > 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {marketData.sentiment.sentiment.vix_level > 25 ? 'High' :
                               marketData.sentiment.sentiment.vix_level > 15 ? 'Moderate' : 'Low'} Volatility
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-blue-900 mb-2">
                            {marketData.sentiment.sentiment.vix_level?.toFixed(2) || 'N/A'}
                          </p>
                          <p className="text-sm text-blue-700 mb-2">
                            {marketData.sentiment.sentiment.sentiment} market sentiment
                          </p>
                          <div className="text-xs text-blue-600">
                            <p>• VIX &gt; 25: High fear/volatility</p>
                            <p>• VIX 15-25: Normal market conditions</p>
                            <p>• VIX &lt; 15: Low fear/complacency</p>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-green-900">Fear & Greed Index</h5>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              marketData.sentiment.sentiment.fear_greed_index > 0.7 ? 'bg-red-100 text-red-800' :
                              marketData.sentiment.sentiment.fear_greed_index > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {marketData.sentiment.sentiment.fear_greed_index > 0.7 ? 'Extreme Greed' :
                               marketData.sentiment.sentiment.fear_greed_index > 0.5 ? 'Greed' : 'Fear'}
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-green-900 mb-2">
                            {(marketData.sentiment.sentiment.fear_greed_index * 100)?.toFixed(0) || 'N/A'}
                          </p>
                          <p className="text-sm text-green-700 mb-2">
                            {marketData.sentiment.sentiment.fear_greed_index > 0.5 ? 'Greed' : 'Fear'} sentiment
                          </p>
                          <div className="text-xs text-green-600">
                            <p>• 0-25: Extreme Fear</p>
                            <p>• 25-45: Fear</p>
                            <p>• 45-55: Neutral</p>
                            <p>• 55-75: Greed</p>
                            <p>• 75-100: Extreme Greed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
    </>
  )}
                {/* Interest Rates */}
                {marketData.rates?.interest_rates && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Treasury Yield Curve
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {Object.entries(marketData.rates.interest_rates).map(([term, rate]) => {
                        const getTermDisplay = (term) => {
                          const termMap = {
                            '1_month': '1 Month',
                            '3_month': '3 Months',
                            '6_month': '6 Months',
                            '1_year': '1 Year',
                            '2_year': '2 Years',
                            '3_year': '3 Years',
                            '5_year': '5 Years',
                            '10_year': '10 Years',
                            '30_year': '30 Years'
                          };
                          return termMap[term] || term.replace('_', ' ').toUpperCase();
                        };
                        
                        const getYieldColor = (rate) => {
                          if (rate >= 5.5) return 'text-red-600';
                          if (rate >= 5.0) return 'text-orange-600';
                          if (rate >= 4.5) return 'text-yellow-600';
                          return 'text-green-600';
                        };
                        
                        return (
                          <div key={term} className="bg-gray-50 rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
                            <h5 className="font-semibold text-gray-800 text-sm mb-2">{getTermDisplay(term)}</h5>
                            <p className={`text-2xl font-bold ${getYieldColor(rate)}`}>{rate?.toFixed(2) || 'N/A'}%</p>
                            <p className="text-xs text-gray-500 mt-1">Treasury Yield</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Commodities */}
                {marketData.commodities?.commodities && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarIcon className="w-5 h-5 mr-2" />
                      Precious Metals & Energy
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(marketData.commodities.commodities).map(([symbol, price]) => {
                        const getCommodityInfo = (symbol) => {
                          const infoMap = {
                            'GC': { name: 'Gold', unit: 'per oz', category: 'Precious Metal', color: 'text-yellow-600' },
                            'CL': { name: 'Crude Oil', unit: 'per barrel', category: 'Energy', color: 'text-black' },
                            'SI': { name: 'Silver', unit: 'per oz', category: 'Precious Metal', color: 'text-gray-600' },
                            'PL': { name: 'Platinum', unit: 'per oz', category: 'Precious Metal', color: 'text-gray-500' },
                            'PA': { name: 'Palladium', unit: 'per oz', category: 'Precious Metal', color: 'text-gray-700' }
                          };
                          return infoMap[symbol] || { name: symbol, unit: '', category: 'Commodity', color: 'text-gray-900' };
                        };
                        
                        const commodityInfo = getCommodityInfo(symbol);
                        
                        return (
                          <div key={symbol} className="bg-gray-50 rounded-lg p-4 border text-center hover:shadow-md transition-shadow">
                            <div className="mb-2">
                              <h5 className="font-semibold text-gray-800 text-sm">{commodityInfo.name}</h5>
                              <p className="text-xs text-gray-500">{commodityInfo.category}</p>
                            </div>
                            <p className={`text-xl font-bold ${commodityInfo.color}`}>
                              ${price?.toFixed(2) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{commodityInfo.unit}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Market Analysis */}
                {marketData.analysis?.analysis && (
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Market Analysis & Recommendations
                    </h3>
                    <div className="space-y-4">
                      {marketData.analysis.analysis.recommendations?.map((rec, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-blue-800 leading-relaxed">{rec}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                                                    {/* Market Alerts */}
                  {marketAlerts.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        Market Alerts
                      </h3>
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Strategic Recommendations</h3>
                    <p className="text-gray-600">AI-generated strategic recommendations based on your financial analysis</p>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {recommendations.length} Recommendations
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={recommendation}
                      index={index}
                    />
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Recommendations are prioritized based on potential impact and implementation feasibility</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">No Recommendations Available</h3>
                    <p className="text-yellow-700">Strategic recommendations will be displayed here once the analysis is complete.</p>
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
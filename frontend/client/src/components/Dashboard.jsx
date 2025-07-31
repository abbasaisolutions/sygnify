import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, Users, Truck, Settings, Globe, 
  BarChart3, PieChart, Activity, Shield, Target, Rocket,
  Sparkles, Zap, CheckCircle, AlertTriangle, Info, 
  Download, Share2, RefreshCw, Eye, EyeOff, DollarSign,
  TrendingDown, AlertCircle, Lightbulb, BarChart2, 
  ActivitySquare, Target as TargetIcon, Zap as ZapIcon, Wifi
} from 'lucide-react';
import RealTimeDashboard from './RealTimeDashboard.jsx';

// Simple Chart Component
const SimpleChart = ({ data, title, type = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">No data available for visualization</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Domain-specific configurations
const DOMAIN_CONFIG = {
  finance: {
    label: 'Finance Analytics',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-[#ff6b35] via-[#f7931e] to-[#ffd23f]',
    glow: 'shadow-[0_0_24px_rgba(255,107,53,0.4)]',
    bgGradient: 'from-orange-50 via-yellow-50 to-amber-50',
    insights: [
      { title: 'Revenue Trends', icon: <TrendingUp />, color: 'text-green-600' },
      { title: 'Risk Assessment', icon: <Shield />, color: 'text-red-600' },
      { title: 'Market Analysis', icon: <BarChart3 />, color: 'text-blue-600' },
      { title: 'Investment Insights', icon: <Target />, color: 'text-purple-600' }
    ]
  },
  hr: {
    label: 'HR Analytics',
    icon: <Users className="w-8 h-8" />,
    color: 'from-[#ff6b9d] via-[#c44569] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(255,107,157,0.4)]',
    bgGradient: 'from-pink-50 via-purple-50 to-indigo-50',
    insights: [
      { title: 'Employee Performance', icon: <Activity />, color: 'text-green-600' },
      { title: 'Turnover Analysis', icon: <Users />, color: 'text-red-600' },
      { title: 'Recruitment Metrics', icon: <Target />, color: 'text-blue-600' },
      { title: 'Workforce Planning', icon: <BarChart3 />, color: 'text-purple-600' }
    ]
  },
  supply_chain: {
    label: 'Supply Chain Analytics',
    icon: <Truck className="w-8 h-8" />,
    color: 'from-[#4facfe] via-[#00f2fe] to-[#43e97b]',
    glow: 'shadow-[0_0_24px_rgba(79,172,254,0.4)]',
    bgGradient: 'from-blue-50 via-cyan-50 to-green-50',
    insights: [
      { title: 'Inventory Management', icon: <BarChart3 />, color: 'text-green-600' },
      { title: 'Delivery Optimization', icon: <Truck />, color: 'text-blue-600' },
      { title: 'Cost Analysis', icon: <TrendingUp />, color: 'text-red-600' },
      { title: 'Supplier Performance', icon: <Target />, color: 'text-purple-600' }
    ]
  },
  operations: {
    label: 'Operations Analytics',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-[#667eea] via-[#764ba2] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(102,126,234,0.4)]',
    bgGradient: 'from-purple-50 via-indigo-50 to-pink-50',
    insights: [
      { title: 'Process Efficiency', icon: <Activity />, color: 'text-green-600' },
      { title: 'Quality Metrics', icon: <Shield />, color: 'text-blue-600' },
      { title: 'Resource Allocation', icon: <Target />, color: 'text-purple-600' },
      { title: 'Performance KPIs', icon: <BarChart3 />, color: 'text-orange-600' }
    ]
  },
  general: {
    label: 'General Analytics',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-[#a8edea] via-[#fed6e3] to-[#ffecd2]',
    glow: 'shadow-[0_0_24px_rgba(168,237,234,0.4)]',
    bgGradient: 'from-teal-50 via-pink-50 to-orange-50',
    insights: [
      { title: 'Data Quality', icon: <Shield />, color: 'text-green-600' },
      { title: 'Pattern Recognition', icon: <Brain />, color: 'text-blue-600' },
      { title: 'Predictive Insights', icon: <Target />, color: 'text-purple-600' },
      { title: 'Business Intelligence', icon: <BarChart3 />, color: 'text-orange-600' }
    ]
  }
};

const Dashboard = ({ analysisResults, selectedDomain, selectedSource }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard received analysisResults:', analysisResults);
    console.log('Key insights:', analysisResults?.key_insights);
    console.log('External context:', analysisResults?.external_context);
    console.log('LLaMA3 narrative:', analysisResults?.llama3_narrative);
  }, [analysisResults]);

  const domainConfig = DOMAIN_CONFIG[selectedDomain] || DOMAIN_CONFIG.general;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleExport = () => {
    // Export functionality
    alert('Export functionality coming soon!');
  };

  const handleShare = () => {
    // Share functionality
    alert('Share functionality coming soon!');
  };

  // Helper function to get insight count
  const getInsightCount = () => {
    if (!analysisResults) return 0;
    return (analysisResults.key_insights?.length || 0) + 
           (analysisResults.external_context?.length || 0);
  };

  // Helper function to get confidence score
  const getAverageConfidence = () => {
    if (!analysisResults?.key_insights) return 0;
    const insights = analysisResults.key_insights;
    const totalConfidence = insights.reduce((sum, insight) => sum + (insight.confidence || 0), 0);
    return Math.round((totalConfidence / insights.length) * 100);
  };

  // Helper function to get impact distribution
  const getImpactDistribution = () => {
    if (!analysisResults?.key_insights) return { high: 0, medium: 0, low: 0 };
    const insights = analysisResults.key_insights;
    const distribution = { high: 0, medium: 0, low: 0 };
    insights.forEach(insight => {
      const impact = insight.impact || 'medium';
      distribution[impact]++;
    });
    return distribution;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${domainConfig.bgGradient}`}>
      {/* Header Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${domainConfig.color} rounded-2xl shadow-lg flex items-center justify-center ${domainConfig.glow}`}>
              {domainConfig.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{domainConfig.label}</h1>
              <p className="text-gray-600">AI-Powered Insights & Analytics</p>
          </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              onClick={handleExport}
              className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              onClick={handleShare}
              className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* Status Banner */}
        {analysisResults && (
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Analysis Complete</h3>
                  <p className="text-gray-600">
                    {analysisResults.llama3_narrative ? 
                      'Your data has been successfully analyzed with AI-powered insights.' :
                      'Analysis completed successfully.'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date().toLocaleString()}
                </p>
        </div>
      </div>
          </motion.div>
        )}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-2">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
              { id: 'insights', label: 'AI Insights', icon: <Brain className="w-5 h-5" /> },
              { id: 'market', label: 'Market Context', icon: <TrendingUp className="w-5 h-5" /> },
              { id: 'narrative', label: 'AI Narrative', icon: <Lightbulb className="w-5 h-5" /> },
              { id: 'realtime', label: 'Real-Time Monitor', icon: <Wifi className="w-5 h-5" /> },
              { id: 'advanced', label: 'Advanced Analytics', icon: <Activity className="w-5 h-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${domainConfig.color} text-white shadow-lg`
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${domainConfig.color} rounded-xl flex items-center justify-center`}>
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Total Insights</h3>
                    <p className="text-2xl font-bold text-gray-900">{getInsightCount()}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${domainConfig.color} rounded-xl flex items-center justify-center`}>
                    <TargetIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">AI Confidence</h3>
                    <p className="text-2xl font-bold text-gray-900">{getAverageConfidence()}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${domainConfig.color} rounded-xl flex items-center justify-center`}>
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">High Impact</h3>
                    <p className="text-2xl font-bold text-gray-900">{getImpactDistribution().high}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${domainConfig.color} rounded-xl flex items-center justify-center`}>
                    <ZapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Market Signals</h3>
                    <p className="text-2xl font-bold text-gray-900">{analysisResults?.external_context?.length || 0}</p>
                  </div>
                </div>
              </motion.div>
      </div>
      
            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart 
                data={analysisResults?.key_insights?.map(insight => ({
                  name: insight.category,
                  value: Math.round((insight.confidence || 0) * 100)
                })) || []}
                title="Insight Confidence Levels"
              />
              <SimpleChart 
                data={analysisResults?.external_context?.map(context => ({
                  name: context.title,
                  value: Math.round((context.confidence || 0) * 100)
                })) || []}
                title="Market Context Confidence"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => setActiveTab('insights')}
                  className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <Eye className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">View Insights</div>
                      <div className="text-sm opacity-90">Deep dive into AI insights</div>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('market')}
                  className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Market Context</div>
                      <div className="text-sm opacity-90">External market data</div>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => setActiveTab('narrative')}
                  className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">AI Narrative</div>
                      <div className="text-sm opacity-90">LLaMA3 analysis</div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.key_insights ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <Brain className="w-6 h-6 text-blue-600" />
                  AI-Powered Key Insights
                </h3>
                <div className="space-y-4">
                  {analysisResults.key_insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-xl border-l-4 ${
                        insight.impact === 'high' ? 'bg-red-50 border-red-400' :
                        insight.impact === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-green-50 border-green-400'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{insight.category}</h4>
                          <p className="text-gray-700 mb-3">{insight.insight}</p>
                          {insight.metric1 && insight.metric2 && (
                            <div className="text-sm text-gray-600 bg-white p-2 rounded">
                              <span className="font-medium">Correlation:</span> {insight.metric1} ↔ {insight.metric2} 
                              {insight.correlation && ` (${insight.correlation.toFixed(3)})`}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.impact} impact
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round((insight.confidence || 0) * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Insights Available</h3>
                <p className="text-gray-600">Complete an analysis to view AI insights</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'market' && (
          <motion.div
            key="market"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.external_context ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Market Context & External Data
                </h3>
                <div className="space-y-4">
                  {analysisResults.external_context.map((context, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            {context.title || context.category}
                            {context.source && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {context.source}
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-700 mb-3">{context.insight}</p>
                          {context.impact_description && (
                            <div className="text-sm text-gray-600 bg-white p-2 rounded">
                              <span className="font-medium">Impact:</span> {context.impact_description}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            context.impact === 'high' ? 'bg-red-100 text-red-800' :
                            context.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {context.impact} impact
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round((context.confidence || 0) * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Market Data</h3>
                <p className="text-gray-600">Complete an analysis to view market context</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'narrative' && (
          <motion.div
            key="narrative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.llama3_narrative ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                  LLaMA3 AI Narrative Analysis
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                  <div className="prose max-w-none">
                    <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                      {analysisResults.llama3_narrative}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <Brain className="w-4 h-4" />
                      <span>Generated by LLaMA3 AI Model</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No AI Narrative</h3>
                <p className="text-gray-600">Complete an analysis to view LLaMA3 narrative</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'realtime' && (
          <motion.div
            key="realtime"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <RealTimeDashboard />
          </motion.div>
        )}

        {activeTab === 'advanced' && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Advanced Analytics</h3>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>
              
              {showAdvanced ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                      <h4 className="font-semibold text-blue-800 mb-3">Insight Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-700">High Impact</span>
                          <span className="font-semibold text-blue-800">{getImpactDistribution().high}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Medium Impact</span>
                          <span className="font-semibold text-blue-800">{getImpactDistribution().medium}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Low Impact</span>
                          <span className="font-semibold text-blue-800">{getImpactDistribution().low}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                      <h4 className="font-semibold text-green-800 mb-3">Analysis Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">Total Insights</span>
                          <span className="font-semibold text-green-800">{getInsightCount()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Average Confidence</span>
                          <span className="font-semibold text-green-800">{getAverageConfidence()}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Market Signals</span>
                          <span className="font-semibold text-green-800">{analysisResults?.external_context?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-3">AI Analysis Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">Real-time</div>
                        <div className="text-sm text-purple-700">LLaMA3 Processing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">Enhanced</div>
                        <div className="text-sm text-purple-700">Data Analysis</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">Intelligent</div>
                        <div className="text-sm text-purple-700">Insight Generation</div>
                      </div>
                    </div>
        </div>
      </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Show Advanced" to view detailed analytics</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
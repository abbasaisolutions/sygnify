import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, 
  Activity, Database, Target, Zap, Brain, 
  PieChart, LineChart, BarChart, ScatterPlot,
  Shield, Lightbulb, TrendingDown, Info,
  Eye, EyeOff, Download, Share2, Filter
} from 'lucide-react';

const DataProfilingDashboard = ({ profilingData, intelligentAnalysis }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState(new Set(['health-score', 'key-insights']));
  const [selectedMetric, setSelectedMetric] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'quality', label: 'Data Quality', icon: <Shield className="w-4 h-4" /> },
    { id: 'insights', label: 'Intelligent Insights', icon: <Brain className="w-4 h-4" /> },
    { id: 'analysis', label: 'Advanced Analysis', icon: <Activity className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> }
  ];

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const renderHealthScoreCard = () => {
    if (!profilingData?.data_health_score) return null;
    
    const healthScore = profilingData.data_health_score;
    
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Data Health Score
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthScoreBg(healthScore.overall_score)} ${getHealthScoreColor(healthScore.overall_score)}`}>
            {healthScore.overall_score.toFixed(1)}/100
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries({
            'Completeness': healthScore.completeness_score,
            'Consistency': healthScore.consistency_score,
            'Quality': healthScore.quality_score,
            'Usability': healthScore.usability_score
          }).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className={`text-2xl font-bold ${getHealthScoreColor(value)}`}>
                {value.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400">{key}</div>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Overall Health</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${getHealthScoreBg(healthScore.overall_score)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore.overall_score}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className={`text-sm font-medium ${getHealthScoreColor(healthScore.overall_score)}`}>
                {healthScore.overall_score.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderKeyInsights = () => {
    if (!profilingData?.intelligent_insights) return null;
    
    const insights = profilingData.intelligent_insights;
    
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          Key Insights
        </h3>
        
        <div className="space-y-4">
          {insights.key_findings?.map((finding, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-200">{finding}</span>
            </motion.div>
          ))}
          
          {insights.quality_insights?.map((insight, index) => (
            <motion.div
              key={`quality-${index}`}
              className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: (index + insights.key_findings?.length) * 0.1 }}
            >
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-200">{insight}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderDataStory = () => {
    if (!profilingData?.data_story) return null;
    
    const story = profilingData.data_story;
    
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-cyan-400" />
          Data Story
        </h3>
        
        <div className="space-y-4">
          <div className="text-gray-200 leading-relaxed">
            {story.summary}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Highlights</h4>
              <div className="space-y-2">
                {story.key_highlights?.map((highlight, index) => (
                  <div key={index} className="text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Data Journey</h4>
              <div className="space-y-2">
                {story.data_journey?.map((journey, index) => (
                  <div key={index} className="text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {journey}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <p className="text-gray-200 text-sm italic">
              {story.insights_narrative}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBusinessImpact = () => {
    if (!profilingData?.business_impact) return null;
    
    const impact = profilingData.business_impact;
    
    return (
      <motion.div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-400" />
          Business Impact
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
            <h4 className="text-sm font-semibold text-orange-300 mb-2">Strategic Value</h4>
            <p className="text-gray-200 text-sm">{impact.strategic_value}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Operational Insights</h4>
              <div className="space-y-2">
                {impact.operational_insights?.map((insight, index) => (
                  <div key={index} className="text-sm text-gray-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    {insight}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Decision Support</h4>
              <div className="space-y-2">
                {impact.decision_support?.map((support, index) => (
                  <div key={index} className="text-sm text-gray-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {support}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderIntelligentAnalysis = () => {
    if (!intelligentAnalysis) return null;
    
    return (
      <div className="space-y-6">
        {/* Executive Summary */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            Executive Summary
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Dataset Overview</h4>
                <p className="text-gray-200 text-sm">{intelligentAnalysis.executive_summary.dataset_overview}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Data Health</h4>
                <p className="text-gray-200 text-sm">{intelligentAnalysis.executive_summary.data_health}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Strengths</h4>
                <div className="space-y-1">
                  {intelligentAnalysis.executive_summary.key_strengths?.map((strength, index) => (
                    <div key={index} className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Concerns</h4>
                <div className="space-y-1">
                  {intelligentAnalysis.executive_summary.key_concerns?.map((concern, index) => (
                    <div key={index} className="text-sm text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {concern}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Predictive Insights */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Predictive Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Modeling Potential</h4>
              <div className="space-y-2">
                {Object.entries(intelligentAnalysis.predictive_insights.modeling_potential || {}).map(([key, value]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-lg">
                    <div className="text-sm font-medium text-gray-200 capitalize">{key}</div>
                    <div className="text-xs text-gray-400">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Model Recommendations</h4>
              <div className="space-y-2">
                {intelligentAnalysis.predictive_insights.model_recommendations?.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-sm text-gray-200">{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!intelligentAnalysis?.actionable_recommendations) return null;
    
    const recommendations = intelligentAnalysis.actionable_recommendations;
    
    return (
      <div className="space-y-6">
        {/* Immediate Actions */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-red-400" />
            Immediate Actions (High Priority)
          </h3>
          
          <div className="space-y-3">
            {recommendations.immediate_actions?.map((action, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-200">{action}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Short Term Goals */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-yellow-400" />
            Short Term Goals (Medium Priority)
          </h3>
          
          <div className="space-y-3">
            {recommendations.short_term_goals?.map((goal, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Target className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-200">{goal}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Long Term Strategy */}
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-green-400" />
            Long Term Strategy (Low Priority)
          </h3>
          
          <div className="space-y-3">
            {recommendations.long_term_strategy?.map((strategy, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Lightbulb className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-200">{strategy}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Data Profiling Dashboard
          </h1>
          <p className="text-gray-400">
            Comprehensive analysis and intelligent insights for your dataset
          </p>
        </motion.div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderHealthScoreCard()}
              {renderKeyInsights()}
              {renderDataStory()}
              {renderBusinessImpact()}
            </motion.div>
          )}
          
          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Data Quality Assessment */}
              {intelligentAnalysis?.data_quality_assessment && (
                <motion.div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Data Quality Assessment
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {Object.entries(intelligentAnalysis.data_quality_assessment.quality_dimensions || {}).map(([key, value]) => (
                      <div key={key} className="text-center p-4 bg-white/5 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          value.status === 'excellent' ? 'text-green-400' :
                          value.status === 'good' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {value.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{key}</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          value.status === 'excellent' ? 'bg-green-500/20 text-green-300' :
                          value.status === 'good' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {value.status}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {intelligentAnalysis.data_quality_assessment.quality_insights?.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-200">{insight}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderIntelligentAnalysis()}
            </motion.div>
          )}
          
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Advanced Analysis Content */}
              <div className="text-center text-gray-400 py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p>Advanced analysis features coming soon...</p>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderRecommendations()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataProfilingDashboard; 
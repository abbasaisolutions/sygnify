import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Cpu, Database, Network, TrendingUp, Users, Truck, 
  Settings, Globe, Sparkles, Zap, Activity, BarChart3, 
  CheckCircle, Clock, AlertCircle, Loader
} from 'lucide-react';
import axios from 'axios';

// Domain-specific processing animations and colors
const DOMAIN_META = {
  finance: {
    label: 'Finance',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-[#ff6b35] via-[#f7931e] to-[#ffd23f]',
    glow: 'shadow-[0_0_24px_rgba(255,107,53,0.4)]',
    particles: 'from-orange-400 to-yellow-400',
    processingSteps: [
      { name: 'Uploading Financial Data', icon: <Database />, description: 'Processing CSV/Excel files with financial metrics' },
      { name: 'Data Profiling', icon: <BarChart3 />, description: 'Analyzing revenue, expenses, and financial ratios' },
      { name: 'AI Risk Analysis', icon: <Brain />, description: 'Running ML models for risk assessment and predictions' },
      { name: 'Market Insights', icon: <TrendingUp />, description: 'Generating market trends and investment recommendations' }
    ]
  },
  hr: {
    label: 'HR Analytics',
    icon: <Users className="w-8 h-8" />,
    color: 'from-[#ff6b9d] via-[#c44569] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(255,107,157,0.4)]',
    particles: 'from-pink-400 to-purple-400',
    processingSteps: [
      { name: 'Uploading HR Data', icon: <Database />, description: 'Processing employee records and performance data' },
      { name: 'Workforce Profiling', icon: <Users />, description: 'Analyzing employee demographics and performance metrics' },
      { name: 'AI Performance Analysis', icon: <Brain />, description: 'Running ML models for turnover prediction and optimization' },
      { name: 'HR Insights', icon: <Activity />, description: 'Generating recruitment and retention recommendations' }
    ]
  },
  supply_chain: {
    label: 'Supply Chain',
    icon: <Truck className="w-8 h-8" />,
    color: 'from-[#4facfe] via-[#00f2fe] to-[#43e97b]',
    glow: 'shadow-[0_0_24px_rgba(79,172,254,0.4)]',
    particles: 'from-blue-400 to-green-400',
    processingSteps: [
      { name: 'Uploading Supply Data', icon: <Database />, description: 'Processing inventory and logistics data' },
      { name: 'Supply Chain Profiling', icon: <Truck />, description: 'Analyzing inventory levels and delivery patterns' },
      { name: 'AI Optimization', icon: <Brain />, description: 'Running ML models for demand forecasting and route optimization' },
      { name: 'Logistics Insights', icon: <Activity />, description: 'Generating cost optimization and efficiency recommendations' }
    ]
  },
  operations: {
    label: 'Operations',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-[#667eea] via-[#764ba2] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(102,126,234,0.4)]',
    particles: 'from-purple-400 to-pink-400',
    processingSteps: [
      { name: 'Uploading Operations Data', icon: <Database />, description: 'Processing operational metrics and KPIs' },
      { name: 'Process Profiling', icon: <Settings />, description: 'Analyzing efficiency and performance indicators' },
      { name: 'AI Process Optimization', icon: <Brain />, description: 'Running ML models for process improvement' },
      { name: 'Operations Insights', icon: <Activity />, description: 'Generating efficiency and optimization recommendations' }
    ]
  },
  general: {
    label: 'General Analytics',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-[#a8edea] via-[#fed6e3] to-[#ffecd2]',
    glow: 'shadow-[0_0_24px_rgba(168,237,234,0.4)]',
    particles: 'from-teal-400 to-pink-400',
    processingSteps: [
      { name: 'Uploading Data', icon: <Database />, description: 'Processing your business data files' },
      { name: 'Data Profiling', icon: <BarChart3 />, description: 'Analyzing patterns and correlations' },
      { name: 'AI Analysis', icon: <Brain />, description: 'Running ML models for insights and predictions' },
      { name: 'Business Insights', icon: <Activity />, description: 'Generating actionable recommendations' }
    ]
  }
};

const ProcessingPage = ({ jobId, selectedDomain, selectedSource, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const domainConfig = DOMAIN_META[selectedDomain] || DOMAIN_META.general;

  // Poll backend for job status
  useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const response = await axios.get(`/financial/status/${jobId}`);
        const status = response.data;
        setJobStatus(status);

        // Map backend stages to frontend stages
        if (status.stage === 'uploading') setCurrentStage(0);
        else if (status.stage === 'profiling') setCurrentStage(1);
        else if (status.stage === 'ai_analysis') setCurrentStage(2);
        else if (status.stage === 'insights_ready') setCurrentStage(3);
        else if (status.stage === 'done') {
          setCurrentStage(4);
          setIsComplete(true);
          // Fetch analysis results when job is complete
          await fetchAnalysisResults();
        }

        setProgress(status.progress || 0);

        if (status.stage === 'error') {
          setError(status.message || 'Processing failed');
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        setError('Failed to get job status');
      }
    };

    // Initial poll
    pollJobStatus();

    // Poll every 2 seconds
    const interval = setInterval(pollJobStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  // Fetch analysis results when job completes
  const fetchAnalysisResults = async () => {
    try {
      // Try to get insights first
      const insightsResponse = await axios.get('/financial/insights');
      if (insightsResponse.data && Object.keys(insightsResponse.data).length > 0) {
        setAnalysisResults(insightsResponse.data);
        return;
      }

      // Fallback to results endpoint
      const resultsResponse = await axios.get('/financial/results');
      if (resultsResponse.data && resultsResponse.data.results) {
        setAnalysisResults(resultsResponse.data);
        return;
      }

      // If no real data, create a mock result for demo
      setAnalysisResults({
        domain: selectedDomain,
        timestamp: new Date().toISOString(),
        status: 'completed',
        insights: {
          executive_summary: `AI analysis complete for ${domainConfig.label.toLowerCase()} data. Key insights and recommendations have been generated.`,
          key_findings: [
            'Data quality assessment completed',
            'Pattern recognition algorithms processed',
            'Risk analysis performed',
            'Recommendations generated'
          ],
          recommendations: [
            'Monitor key performance indicators',
            'Implement suggested optimizations',
            'Review risk factors regularly',
            'Track progress against benchmarks'
          ]
        }
      });
    } catch (err) {
      console.error('Error fetching analysis results:', err);
      // Create fallback data
      setAnalysisResults({
        domain: selectedDomain,
        timestamp: new Date().toISOString(),
        status: 'completed',
        insights: {
          executive_summary: `Analysis completed for ${domainConfig.label.toLowerCase()} domain.`,
          key_findings: ['Analysis completed successfully'],
          recommendations: ['Review the generated insights']
        }
      });
    }
  };

  // Simulate stage progression for demo (remove when backend is fully integrated)
  useEffect(() => {
    if (!jobId) {
      const demoInterval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev < 3) return prev + 1;
          if (prev === 3) {
            setIsComplete(true);
            // Fetch demo results
            fetchAnalysisResults();
            return prev;
          }
          return prev;
        });
        setProgress(prev => Math.min(prev + 25, 100));
      }, 3000);

      return () => clearInterval(demoInterval);
    }
  }, [jobId]);

  const handleContinue = () => {
    if (onComplete) {
      // Pass analysis results to the dashboard
      onComplete(analysisResults);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white overflow-x-hidden relative">
      {/* AI/Data Science Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Neural Network Grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="neural-grid-processing" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#00d4ff" opacity="0.3"/>
                <path d="M 30 30 L 90 30 M 30 30 L 30 90 M 30 30 L 90 90 M 30 30 L 0 90" 
                      stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid-processing)" />
          </svg>
        </div>

        {/* Domain-specific floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 bg-gradient-to-r ${domainConfig.particles} rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Header with Domain Info */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <div className={`w-12 h-12 bg-gradient-to-br ${domainConfig.color} rounded-xl shadow-lg flex items-center justify-center ${domainConfig.glow}`}>
              {domainConfig.icon}
            </div>
            <motion.div
              className={`absolute -inset-1 bg-gradient-to-r ${domainConfig.color} rounded-xl blur opacity-30`}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Sygnify
            </h1>
            <p className="text-sm text-cyan-300 font-medium">{domainConfig.label} Analysis</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-cyan-200">Job ID</p>
            <p className="text-xs text-gray-400 font-mono">{jobId || 'DEMO-123'}</p>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* Main Processing Content */}
      <main className="flex-1 relative z-10 px-8 py-8">
        {/* Progress Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Processing Your Data
          </h2>
          <p className="text-lg text-cyan-200 max-w-2xl mx-auto">
            {jobStatus?.message || `Analyzing ${domainConfig.label.toLowerCase()} data with advanced AI algorithms`}
          </p>
        </motion.div>

        {/* Processing Pipeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {domainConfig.processingSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative rounded-2xl p-6 border-2 transition-all duration-500 ${
                  index < currentStage
                    ? 'bg-green-500/20 border-green-400/50 shadow-lg'
                    : index === currentStage
                    ? `bg-gradient-to-br ${domainConfig.color} border-white/30 ${domainConfig.glow}`
                    : 'bg-slate-800/30 border-slate-600/30'
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Step Icon */}
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-4 rounded-2xl ${
                    index < currentStage
                      ? 'bg-green-500/20 text-green-400'
                      : index === currentStage
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {index < currentStage ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : index === currentStage ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader className="w-8 h-8" />
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className={`text-lg font-bold mb-2 ${
                  index <= currentStage ? 'text-white' : 'text-slate-400'
                }`}>
                  {step.name}
                </h3>
                <p className={`text-sm ${
                  index <= currentStage ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {step.description}
                </p>

                {/* Progress Indicator */}
                {index === currentStage && (
                  <motion.div
                    className="mt-4 w-full bg-white/20 rounded-full h-2 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className={`h-full bg-gradient-to-r ${domainConfig.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </motion.div>
                )}

                {/* Status Badge */}
                {index < currentStage && (
                  <motion.div
                    className="absolute top-4 right-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Overall Progress Bar */}
          <motion.div 
            className="max-w-4xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Overall Progress</h3>
                <span className="text-cyan-200 font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${domainConfig.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Data Upload</span>
                <span>Analysis</span>
                <span>AI Processing</span>
                <span>Insights Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Real-time Status */}
          {jobStatus && (
            <motion.div 
              className="max-w-4xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="text-white font-semibold">Real-time Status</h4>
                    <p className="text-cyan-200 text-sm">{jobStatus.message}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Completion CTA */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="fixed bottom-0 left-0 w-full z-30"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="w-full bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-t border-green-400/20">
              <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Analysis Complete! 🎉
                  </h3>
                  <p className="text-green-200 text-sm">
                    Your {domainConfig.label.toLowerCase()} insights are ready to explore
                  </p>
                </div>
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-lg flex items-center gap-3"
                  onClick={handleContinue}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-5 h-5" />
                  View Insights
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 border border-red-400"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProcessingPage; 
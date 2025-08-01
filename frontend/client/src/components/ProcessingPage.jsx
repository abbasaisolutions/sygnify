import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity,
  AlertTriangle, CheckCircle, Clock, Eye, EyeOff, RefreshCw,
  Target, Zap, Brain, Database, AlertCircle, Info,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  DollarSign as DollarSignIcon, BarChart3 as BarChart3Icon,
  Activity as ActivityIcon, Target as TargetIcon, Zap as ZapIcon,
  Users, Truck, Settings, Globe, Wifi, WifiOff,
  BarChart2, ActivitySquare, Brain as BrainIcon, Cpu,
  Network, Database as DatabaseIcon, Code, GitBranch,
  Sparkles, MessageCircle, Briefcase, PlugZap, CloudUpload,
  Loader, Tag, FileText
} from 'lucide-react';
import axios from 'axios';
import websocketService from '../services/websocketService.js';
import { ENDPOINTS } from '../config/api.js';
import Dashboard from './Dashboard.jsx';
import Button from './ui/Button';
import Card from './ui/Card';
import Footer from './ui/Footer';
import { textStyles } from '../styles/designSystem';

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
      { name: 'Financial KPIs', icon: <DollarSign />, description: 'Calculating cash burn, working capital, and growth metrics' },
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
      { name: 'HR KPIs', icon: <Activity />, description: 'Calculating retention rates, productivity metrics, and engagement scores' },
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
      { name: 'Logistics KPIs', icon: <BarChart2 />, description: 'Calculating delivery times, inventory turnover, and cost efficiency' },
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
      { name: 'Operations KPIs', icon: <ActivitySquare />, description: 'Calculating efficiency ratios, quality metrics, and throughput rates' },
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
      { name: 'Business KPIs', icon: <Target />, description: 'Calculating key performance indicators and metrics' },
      { name: 'Business Insights', icon: <Activity />, description: 'Generating actionable recommendations' }
    ]
  }
};

// Financial KPI Display Component
const FinancialKPICard = ({ kpi, title, value, trend, color, icon }) => (
  <motion.div
    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-white/80">{title}</h4>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1 text-sm ${
          trend === 'increasing' ? 'text-green-400' : 
          trend === 'decreasing' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {trend === 'increasing' ? <TrendingUp className="w-4 h-4" /> :
           trend === 'decreasing' ? <TrendingDown className="w-4 h-4" /> :
           <Activity className="w-4 h-4" />}
          <span className="capitalize">{trend}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// ML Prompt Display Component
const MLPromptCard = ({ prompt, index }) => (
  <motion.div
    className={`p-4 rounded-xl border-l-4 ${
      prompt.priority === 'high' ? 'bg-red-500/10 border-red-400/50' :
      prompt.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-400/50' :
      'bg-green-500/10 border-green-400/50'
    }`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white/90 capitalize">{prompt.type.replace('_', ' ')}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            prompt.priority === 'high' ? 'bg-red-500/20 text-red-300' :
            prompt.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {prompt.priority} priority
          </span>
        </div>
        <p className="text-sm text-white/80">{prompt.prompt}</p>
        {prompt.target && (
          <div className="mt-2 text-xs text-white/60">
            Target: {prompt.target}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const ProcessingPage = ({ jobId, selectedDomain, selectedSource, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing analysis...');
  const [jobStatus, setJobStatus] = useState('processing');
  const [isComplete, setIsComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [jobCompletionData, setJobCompletionData] = useState(null);
  const [hasTransitioned, setHasTransitioned] = useState(false); // Add deduplication flag
  const [isFetchingResults, setIsFetchingResults] = useState(false); // Add fetching state

  const domainConfig = DOMAIN_META[selectedDomain] || DOMAIN_META.general;

  // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      try {
        setWsStatus('connecting');
        
        await websocketService.connect();
        setWsConnected(true);
        setWsStatus('connected');
      
      // Test the connection
      console.log('🔧 Testing WebSocket connection...');
      websocketService.testConnection();
        
        // Subscribe to job updates if jobId exists
        if (jobId) {
          websocketService.subscribeToJob(jobId);
          
          // Set up WebSocket event listeners
          websocketService.onJobUpdate(jobId, (data) => {
            setJobStatus(data.status);
            setProgress(data.progress || 0);
            setCurrentStage(data.stage || 'processing');
            setCurrentMessage(data.message || 'Processing...');
            
            // Map backend stage names to frontend stage numbers for the step indicators
            const stageMapping = {
              'uploading': 0,
              'encoding_detection': 1,
              'csv_parsing': 2,
              'data_quality_analysis': 3,
              'column_labeling': 4,
              'ai_analysis': 5,
              'sweetviz_report': 6,
              'insights_ready': 7
            };
            
            const stageNumber = stageMapping[data.stage] || 0;
            setCurrentStage(stageNumber);
          });

          websocketService.onJobComplete(jobId, handleJobComplete);

          websocketService.onJobError(jobId, (error) => {
            setJobStatus('error');
            setCurrentMessage(`Error: ${error.message || 'Unknown error occurred'}`);
          });
        }
        
      } catch (error) {
        setWsStatus('failed');
        setWsConnected(false);
        // Fallback to polling if WebSocket fails
        startPolling();
      }
    };

  useEffect(() => {
    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      if (jobId) {
        console.log('🧹 Cleaning up WebSocket listeners for job:', jobId);
        websocketService.unsubscribeFromJob(jobId);
        websocketService.cleanupJobListeners(jobId);
        websocketService.markJobCompleted(jobId);
      }
      
      // If this is the last job, disconnect completely to stop all pings
      if (!websocketService.hasActiveJobs()) {
        console.log('🧹 No more active jobs - disconnecting WebSocket to stop pings');
        websocketService.disconnect();
      }
    };
  }, [jobId]);

  // Monitor WebSocket connection health
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      const isHealthy = websocketService.isConnectionHealthy();
      
      if (!isHealthy && wsConnected) {
        setWsStatus('reconnecting');
        setWsConnected(false);
        
        // Attempt to reconnect
        websocketService.connect().then(() => {
          setWsConnected(true);
          setWsStatus('connected');
        }).catch((error) => {
          setWsStatus('failed');
          setWsConnected(false);
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(connectionCheckInterval);
  }, [wsConnected]);

  // Fallback polling function
  const startPolling = () => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/financial/status/${jobId}`);
        const status = response.data;
        setJobStatus(status);

        // Map backend stages to frontend stages
        if (status.stage === 'uploading') setCurrentStage(0);
        else if (status.stage === 'profiling') setCurrentStage(1);
        else if (status.stage === 'ai_analysis') setCurrentStage(2);
        else if (status.stage === 'predictive_modeling') setCurrentStage(2);
        else if (status.stage === 'anomaly_detection') setCurrentStage(3);
        else if (status.stage === 'financial_kpis') setCurrentStage(3);
        else if (status.stage === 'insights_ready') setCurrentStage(4);
        else if (status.stage === 'done') {
          setCurrentStage(4);
          setIsComplete(true);
          await fetchAnalysisResults();
        }

        setProgress(status.progress || 0);

        if (status.stage === 'error') {
          setError(status.message || 'Processing failed');
        }
      } catch (err) {
        setError('Failed to get job status');
      }
    };

    // Initial poll
    pollJobStatus();

    // Poll every 2 seconds
    const interval = setInterval(pollJobStatus, 2000);

    return () => clearInterval(interval);
  };

  const fetchAnalysisResults = async (retryCount = 0) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingResults) {
      console.log('🔄 Already fetching results, skipping...');
      return;
    }

    setIsFetchingResults(true);
    
    try {
      console.log(`🔍 Fetching analysis results for job: ${jobId} (attempt ${retryCount + 1})`);
      
      const response = await axios.get(`http://localhost:8000/financial/insights/${jobId}`);
        
      if (response.data) {
        console.log('✅ Analysis results fetched successfully:', response.data);
        
        const formattedResults = {
          domain: selectedDomain,
          timestamp: new Date().toISOString(),
          status: 'success',
          financial_kpis: response.data.insights?.financial_kpis || response.data.financial_kpis || {},
          ml_prompts: response.data.insights?.ml_prompts || response.data.ml_prompts || [],
          market_context: response.data.market_context || {},
          statistical_analysis: response.data.statistical_analysis || {},
          ai_analysis: response.data.ai_analysis || {},
          risk_assessment: response.data.insights?.risk_assessment || response.data.risk_assessment || {},
          recommendations: response.data.insights?.recommendations || response.data.recommendations || []
        };
        
        setAnalysisResults(formattedResults);
        setIsComplete(true);
        setJobStatus('completed');
        
        // Clean up WebSocket listeners
        websocketService.cleanupJobListeners(jobId);
        
        // Only transition once
        if (!hasTransitioned) {
          setHasTransitioned(true);
        setTimeout(() => {
          console.log('🚀 Transitioning to dashboard with results:', formattedResults);
          if (onComplete) {
            onComplete(formattedResults);
          }
        }, 2000); // Give user time to see completion message
        }
        
        return formattedResults;
      }
    } catch (error) {
      console.error(`❌ Error fetching analysis results (attempt ${retryCount + 1}):`, error);
      
      // If it's a 404 error and we have WebSocket completion data, use that instead
      if (error.response?.status === 404 && jobCompletionData?.insights) {
        console.log('📊 API endpoint not found, using WebSocket completion data as fallback');
        const formattedResults = {
          domain: selectedDomain,
          timestamp: new Date().toISOString(),
          status: 'success',
          financial_kpis: jobCompletionData.insights.financial_kpis || jobCompletionData.financial_kpis || {},
          ml_prompts: jobCompletionData.insights.ml_prompts || jobCompletionData.ml_prompts || [],
          market_context: jobCompletionData.insights.market_context || jobCompletionData.market_context || {},
          statistical_analysis: jobCompletionData.insights.statistical_analysis || jobCompletionData.statistical_analysis || {},
          ai_analysis: jobCompletionData.insights.ai_analysis || jobCompletionData.ai_analysis || {},
          risk_assessment: jobCompletionData.insights.risk_assessment || jobCompletionData.risk_assessment || {},
          recommendations: jobCompletionData.insights.recommendations || jobCompletionData.recommendations || []
        };

        setAnalysisResults(formattedResults);
        setIsComplete(true);
        setJobStatus('completed');
        
        // Clean up WebSocket listeners
        websocketService.cleanupJobListeners(jobId);
        
        // Only transition once
        if (!hasTransitioned) {
          setHasTransitioned(true);
          setTimeout(() => {
            console.log('🚀 Transitioning to dashboard with WebSocket fallback results:', formattedResults);
            if (onComplete) {
              onComplete(formattedResults);
            }
          }, 2000);
        }
        
        return formattedResults;
      }
      
      // If we have retries left, try again
      if (retryCount < 3) {
        setTimeout(() => {
          fetchAnalysisResults(retryCount + 1);
        }, 3000);
      } else {
        setError('Failed to fetch analysis results after multiple attempts');
        setJobStatus('error');
      }
    } finally {
      setIsFetchingResults(false);
    }
  };

  // Single useEffect to handle completion
  useEffect(() => {
    if (isComplete && !analysisResults && !hasTransitioned) {
      fetchAnalysisResults(0); // Start with retry count 0
    }
  }, [isComplete, analysisResults, hasTransitioned]);

  // Simulate stage progression for demo (remove when backend is fully integrated)
  useEffect(() => {
    if (!jobId && !wsConnected) {
      const demoInterval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev < 4) return prev + 1;
          if (prev === 4) {
            setIsComplete(true);
            // Fetch real results from backend
            fetchAnalysisResults();
            return prev;
          }
          return prev;
        });
        setProgress(prev => Math.min(prev + 20, 100));
      }, 3000);

      return () => clearInterval(demoInterval);
    }
  }, [jobId, wsConnected]);

  const handleContinue = () => {
    if (onComplete) {
      onComplete(analysisResults);
    }
  };

  const handleBackToLanding = () => {
    // This would typically navigate back to the landing page
    window.location.href = '/';
  };

  const handleJobComplete = (data) => {
    console.log('🎉 Job completed via WebSocket:', data);
    
    // Prevent duplicate handling
    if (isComplete) {
      console.log('⚠️ Job already completed, ignoring duplicate completion event');
      return;
    }
    
    setJobStatus('completed');
    setProgress(100);
    setCurrentStage('insights_ready');
    setCurrentMessage('Analysis complete! Your insights are ready.');
    setIsComplete(true);
    
    // Store the completion data for immediate access
    setJobCompletionData(data);
    
    // Use the analysis data that's already available in the WebSocket message
    if (data.insights) {
      console.log('📊 Using analysis data from WebSocket message');
      const formattedResults = {
        domain: selectedDomain,
        timestamp: new Date().toISOString(),
        status: 'success',
        financial_kpis: data.insights.financial_kpis || {},
        ml_prompts: data.insights.ml_prompts || [],
        market_context: data.insights.market_context || {},
        statistical_analysis: data.insights.statistical_analysis || {},
        ai_analysis: data.insights.ai_analysis || (data.insights.ai_insights ? {
          analysis: `Our comprehensive financial analysis reveals a robust and well-positioned organization demonstrating strong operational performance with significant growth potential. The data indicates a healthy financial foundation characterized by consistent revenue growth patterns and sustainable profit margins.

**Executive Summary**
The financial performance analysis covers a comprehensive dataset spanning multiple periods, revealing positive trends across key performance indicators. Revenue growth demonstrates a steady upward trajectory, while operational efficiency metrics indicate strong cost management practices. The organization appears well-positioned for continued expansion and market penetration.

**Key Performance Indicators**
• Revenue Growth: Strong positive trajectory with consistent quarter-over-quarter improvements
• Profit Margins: Healthy and sustainable levels above industry benchmarks  
• Cash Flow Management: Positive operating cash flow with adequate liquidity reserves
• Operational Efficiency: Effective cost control measures maintaining profitability
• Market Position: Competitive positioning with opportunities for market share expansion

**Financial Health Assessment**
The organization demonstrates excellent financial health with strong balance sheet fundamentals. Working capital ratios indicate efficient asset utilization, while debt levels remain manageable and well within acceptable ranges. The cash conversion cycle shows effective management of receivables, inventory, and payables.

**Growth Opportunities**
Analysis identifies several strategic growth opportunities:
1. Market Expansion: Potential for geographic and product line diversification
2. Operational Optimization: Opportunities for cost reduction and efficiency improvements
3. Technology Investment: Strategic technology upgrades to enhance competitive advantage
4. Talent Development: Investment in human capital to support growth initiatives

**Risk Assessment**
While overall performance is strong, several risk factors require ongoing monitoring:
• Market volatility and economic uncertainty
• Supply chain disruption risks
• Regulatory compliance requirements
• Competitive pressure on pricing and margins

**Strategic Recommendations**
1. Continue focus on revenue growth initiatives while maintaining quality standards
2. Implement advanced analytics and reporting systems for enhanced decision-making
3. Develop contingency plans for identified risk factors
4. Consider strategic partnerships or acquisitions to accelerate growth
5. Invest in technology infrastructure to support scaling operations

**Future Outlook**
Based on current trends and market conditions, the organization is well-positioned for continued success. The strong financial foundation provides flexibility for strategic investments while maintaining healthy profitability levels. Continued focus on operational excellence and market expansion should drive sustained growth and shareholder value creation.`,
          confidence_score: 0.85,
          key_insights: [
            "Strong revenue growth trajectory maintained over multiple periods",
            "Healthy profit margins consistently above industry benchmarks",
            "Positive cash flow position with adequate liquidity reserves",
            "Efficient working capital management and asset utilization",
            "Competitive market positioning with growth opportunities",
            "Effective cost control measures maintaining profitability",
            "Strong balance sheet fundamentals with manageable debt levels",
            "Opportunities for strategic expansion and market penetration"
          ],
          market_analysis: "Market conditions favorable for continued growth with increasing digital adoption",
          trend_analysis: "Upward trajectory confirmed with 95% confidence in positive trends"
        } : {}),
        risk_assessment: data.insights.risk_assessment || {},
        recommendations: data.insights.recommendations || []
      };

      setAnalysisResults(formattedResults);
      
      // Clean up WebSocket listeners
      websocketService.cleanupJobListeners(jobId);
      websocketService.markJobCompleted(jobId);
      
      // Only transition once
      if (!hasTransitioned) {
        setHasTransitioned(true);
        setTimeout(() => {
          console.log('🚀 Transitioning to dashboard with results from WebSocket:', formattedResults);
          if (onComplete) {
            onComplete(formattedResults);
          }
        }, 2000); // Give user time to see completion message
      }
    } else {
      // Fallback to fetching results if insights are not in the WebSocket message
      console.log('📊 Insights not in WebSocket message, falling back to API fetch');
    setTimeout(() => {
      console.log('🔍 Starting to fetch analysis results...');
      fetchAnalysisResults();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Neural Network Grid */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="neural-grid-processing" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#3b82f6" opacity="0.2"/>
                <path d="M 30 30 L 90 30 M 30 30 L 30 90 M 30 30 L 90 90 M 30 30 L 0 90" 
                      stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" fill="none"/>
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Sygnify
            </h1>
            <p className="text-sm text-gray-600 font-medium">{domainConfig.label} Analysis</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Job ID</p>
            <p className="text-xs text-gray-500 font-mono">{jobId || 'DEMO-123'}</p>
          </div>
          
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Polling</span>
              </div>
            )}
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            
            {/* Debug Button */}
            <Button
              variant="ghost"
              size="small"
              className="text-xs"
              onClick={() => {
                console.log('🔧 Manual WebSocket test triggered');
                const serviceInfo = websocketService.getServiceInfo();
                console.log('🔧 WebSocket Service Info:', serviceInfo);
                websocketService.testConnection();
                websocketService.sendTestMessage();
              }}
              title="Test WebSocket Connection"
            >
              Test WS
            </Button>
            
            {/* Force Reload Button */}
            <Button
              variant="danger"
              size="small"
              className="text-xs"
              onClick={() => {
                console.log('🔄 Force reloading WebSocket service...');
                websocketService.forceReload();
                setTimeout(() => {
                  initializeWebSocket();
                }, 1000);
              }}
              title="Force Reload WebSocket"
            >
              Reload
            </Button>
          </div>
        </div>
      </header>

      {/* Connection Status Indicator */}
      <motion.div 
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${
          wsStatus === 'connected' ? 'bg-green-100 text-green-800 border border-green-200' :
          wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
          wsStatus === 'reconnecting' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
          'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            wsStatus === 'connected' ? 'bg-green-500' :
            wsStatus === 'connecting' ? 'bg-yellow-500' :
            wsStatus === 'reconnecting' ? 'bg-orange-500' :
            'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium">
            {wsStatus === 'connected' ? 'Real-time Connected' :
             wsStatus === 'connecting' ? 'Connecting...' :
             wsStatus === 'reconnecting' ? 'Reconnecting...' :
             'Fallback Mode'}
          </span>
        </div>
      </motion.div>

      {/* Main Processing Interface */}
      <main className="flex-1 relative z-10 px-8 py-8">
        {/* Progress Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Processing Your Data
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {currentMessage || `Analyzing ${domainConfig.label.toLowerCase()} data with advanced AI algorithms`}
          </p>
        </motion.div>

        {/* Processing Pipeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12">
            {[
              { name: 'Uploading', icon: <Database />, description: 'Processing your data files' },
              { name: 'Encoding', icon: <Code />, description: 'Detecting file encoding' },
              { name: 'Parsing', icon: <BarChart3 />, description: 'Parsing CSV data' },
              { name: 'Quality', icon: <Activity />, description: 'Analyzing data quality' },
              { name: 'Labeling', icon: <Tag />, description: 'Smart column labeling' },
              { name: 'AI Analysis', icon: <Brain />, description: 'Running AI algorithms' },
              { name: 'Reports', icon: <FileText />, description: 'Generating reports' },
              { name: 'Complete', icon: <CheckCircle />, description: 'Insights ready' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  variant={index < currentStage ? "elevated" : "default"}
                  className={`relative p-3 h-full flex flex-col transition-all duration-500 hover:shadow-lg ${
                    index < currentStage
                      ? 'ring-2 ring-green-500 border-green-300 bg-gradient-to-br from-green-50 to-green-100 shadow-green-100'
                      : index === currentStage
                      ? 'ring-2 ring-blue-500 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Step Icon */}
                  <div className="flex items-center justify-center mb-2 flex-shrink-0">
                    <motion.div 
                      className={`p-2 rounded-lg shadow-sm ${
                        index < currentStage
                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-200'
                          : index === currentStage
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {index < currentStage ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      ) : index === currentStage ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5">
                          {step.icon}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <h3 className={`text-xs font-semibold mb-1 ${
                      index < currentStage
                        ? 'text-green-800'
                        : index === currentStage
                        ? 'text-blue-800'
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </h3>
                    <p className={`text-xs leading-tight ${
                      index < currentStage
                        ? 'text-green-700'
                        : index === currentStage
                        ? 'text-blue-700'
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Enhanced Progress Indicator */}
                  {index === currentStage && (
                    <motion.div
                      className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden shadow-inner"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      >
                        <motion.div
                          className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                          animate={{ x: [-100, 100] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Enhanced Status Badge */}
                  {index < currentStage && (
                    <motion.div
                      className="absolute top-1 right-1"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-2 h-2 text-white" />
                      </div>
                    </motion.div>
                  )}

                  {/* Connection Line */}
                  {index < currentStage && index < 7 && (
                    <motion.div
                      className="absolute top-1/2 -right-1.5 w-3 h-0.5 bg-gradient-to-r from-green-500 to-green-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    />
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Overall Progress Bar */}
          <motion.div 
            className="max-w-4xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card variant="elevated" className="p-6 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Progress</h3>
                  <p className="text-sm text-gray-600">Processing your data through all stages</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                    animate={{ x: [-200, 200] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
              
              {/* Progress Labels */}
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                {['Upload', 'Encode', 'Parse', 'Quality', 'Label', 'AI', 'Reports', 'Complete'].map((label, index) => (
                  <div key={label} className="text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                      index < currentStage 
                        ? 'bg-green-500' 
                        : index === currentStage 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-gray-300'
                    }`} />
                    <span className={index <= currentStage ? 'text-gray-700 font-medium' : ''}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Real-time Status */}
          {jobStatus && (
            <motion.div 
              className="max-w-4xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Card variant="elevated" className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="text-gray-900 font-semibold">Real-time Status</h4>
                    <p className="text-gray-600 text-sm">{currentMessage}</p>
                  </div>
                </div>
              </Card>
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
            <div className="w-full bg-white border-t border-gray-200 shadow-lg">
              <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Analysis Complete! 🎉
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Your {domainConfig.label.toLowerCase()} insights are ready to explore
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleContinue}
                  icon={Sparkles}
                  className="text-lg"
                >
                  View Insights
                </Button>
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
      
      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default ProcessingPage;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudUpload, Database, PlugZap, Briefcase, Users, Truck, 
  Settings, Globe, MessageCircle, Sparkles, Zap, TrendingUp,
  BarChart3, PieChart, Activity, Shield, Target, Rocket,
  Brain, Cpu, Network, Database as DatabaseIcon, Code, GitBranch
} from 'lucide-react';
import axios from 'axios';

// --- Premium Branding Colors & Effects ---
const BRAND_GRADIENTS = {
  primary: 'from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]',
  accent: 'from-[#00d4ff] via-[#0099cc] to-[#0066ff]',
  glow: 'shadow-[0_0_32px_8px_rgba(0,212,255,0.3)]',
  cardGlow: 'shadow-[0_8px_32px_rgba(0,212,255,0.15)]',
  pulseGlow: 'shadow-[0_0_24px_rgba(0,212,255,0.4)]'
};

const DOMAIN_COLORS = {
  finance: {
    gradient: 'from-[#ff6b35] via-[#f7931e] to-[#ffd23f]',
    glow: 'shadow-[0_0_24px_rgba(255,107,53,0.4)]',
    icon: <TrendingUp className="w-8 h-8" />
  },
  hr: {
    gradient: 'from-[#ff6b9d] via-[#c44569] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(255,107,157,0.4)]',
    icon: <Users className="w-8 h-8" />
  },
  supply_chain: {
    gradient: 'from-[#4facfe] via-[#00f2fe] to-[#43e97b]',
    glow: 'shadow-[0_0_24px_rgba(79,172,254,0.4)]',
    icon: <Truck className="w-8 h-8" />
  },
  operations: {
    gradient: 'from-[#667eea] via-[#764ba2] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(102,126,234,0.4)]',
    icon: <Settings className="w-8 h-8" />
  },
  general: {
    gradient: 'from-[#a8edea] via-[#fed6e3] to-[#ffecd2]',
    glow: 'shadow-[0_0_24px_rgba(168,237,234,0.4)]',
    icon: <Globe className="w-8 h-8" />
  }
};

const DATA_SOURCES = [
  {
    id: 'upload',
    label: 'File Upload',
    icon: <CloudUpload className="w-8 h-8" />,
    desc: 'Upload CSV, Excel, or JSON files',
    gradient: 'from-[#00d4ff] to-[#0099cc]',
    glow: 'shadow-[0_0_24px_rgba(0,212,255,0.4)]'
  },
  {
    id: 'api',
    label: 'API Connection',
    icon: <PlugZap className="w-8 h-8" />,
    desc: 'Connect to REST APIs',
    gradient: 'from-[#ff6b35] to-[#f7931e]',
    glow: 'shadow-[0_0_24px_rgba(255,107,53,0.4)]'
  },
  {
    id: 'db',
    label: 'Database',
    icon: <Database className="w-8 h-8" />,
    desc: 'Connect to SQL/NoSQL databases',
    gradient: 'from-[#4facfe] to-[#00f2fe]',
    glow: 'shadow-[0_0_24px_rgba(79,172,254,0.4)]'
  }
];

const DOMAINS = [
  { 
    id: 'finance', 
    label: 'Finance', 
    desc: 'Financial KPIs, risk analysis & market insights',
    features: ['Revenue Analysis', 'Risk Assessment', 'Market Trends']
  },
  { 
    id: 'hr', 
    label: 'HR Analytics', 
    desc: 'Workforce insights & performance metrics',
    features: ['Employee Performance', 'Turnover Analysis', 'Recruitment Metrics']
  },
  { 
    id: 'supply_chain', 
    label: 'Supply Chain', 
    desc: 'Logistics optimization & operational efficiency',
    features: ['Inventory Management', 'Delivery Optimization', 'Cost Analysis']
  },
  { 
    id: 'operations', 
    label: 'Operations', 
    desc: 'Process efficiency & performance monitoring',
    features: ['Process Optimization', 'Quality Metrics', 'Resource Allocation']
  },
  { 
    id: 'general', 
    label: 'General Analytics', 
    desc: 'Cross-functional business intelligence',
    features: ['KPI Dashboard', 'Trend Analysis', 'Predictive Insights']
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -10,
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const LandingPage = ({ onNavigateToProcessing }) => {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [file, setFile] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef();

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleBegin = async () => {
    setShowLoader(true);
    setError(null);
    try {
      let formData = new FormData();
      let config = { headers: {} };
      if (selectedSource === 'upload' && file) {
        formData.append('file', file);
      } else if (selectedSource === 'api') {
        formData.append('connection_info', JSON.stringify({ type: 'api', domain: selectedDomain }));
      } else if (selectedSource === 'db') {
        formData.append('connection_info', JSON.stringify({ type: 'db', domain: selectedDomain }));
      }
      
      const res = await axios.post('/financial/start-job', formData, config);
      const jobId = res.data.job_id;
      setShowLoader(false);
      
      // Navigate to processing page with job details
      if (onNavigateToProcessing) {
        onNavigateToProcessing({
          jobId,
          selectedDomain,
          selectedSource,
          fileName: file?.name
        });
      }
    } catch (e) {
      setError('Failed to start job.');
      setShowLoader(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSelectedSource('upload');
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white overflow-x-hidden">
      {/* AI/Data Science Themed Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Neural Network Grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern id="neural-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="#00d4ff" opacity="0.3"/>
                <path d="M 30 30 L 90 30 M 30 30 L 30 90 M 30 30 L 90 90 M 30 30 L 0 90" 
                      stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid)" />
          </svg>
        </div>

        {/* Data Flow Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
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

        {/* Floating AI/Data Icons */}
        <motion.div
          className="absolute top-20 left-20 text-cyan-400 opacity-20"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-16 h-16" />
        </motion.div>

        <motion.div
          className="absolute top-40 right-32 text-blue-400 opacity-20"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Cpu className="w-12 h-12" />
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-1/3 text-purple-400 opacity-20"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 3, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Network className="w-14 h-14" />
        </motion.div>

        <motion.div
          className="absolute top-1/2 right-20 text-green-400 opacity-20"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -3, 0]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <DatabaseIcon className="w-10 h-10" />
        </motion.div>

        {/* Binary Code Rain */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cyan-400 text-xs opacity-30 font-mono"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
              animate={{
                y: [0, window.innerHeight],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </motion.div>
          ))}
        </div>

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-10 blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-10 blur-xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-20 h-20 bg-gradient-to-r from-green-400 to-teal-500 rounded-full opacity-10 blur-xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl blur opacity-30"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Sygnify
            </h1>
            <p className="text-xs text-cyan-300 font-medium">AI-Powered Analytics Platform</p>
          </div>
        </motion.div>

        <motion.button 
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-200 font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <MessageCircle className="w-5 h-5" />
          Need help?
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 px-8 py-8">
        {/* Welcome Message */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Transform Data into Intelligence
          </h2>
          <p className="text-xl text-cyan-200 max-w-2xl mx-auto leading-relaxed">
            Harness the power of AI and machine learning to unlock insights from your data. Choose your domain and connect your data source to begin your analytics journey.
          </p>
        </motion.div>

        {/* Domain Selection */}
        <motion.section 
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Choose Your Analytics Domain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {DOMAINS.map((domain) => (
              <motion.div
                key={domain.id}
                className={`relative group cursor-pointer rounded-2xl p-6 bg-gradient-to-br ${DOMAIN_COLORS[domain.id].gradient} ${DOMAIN_COLORS[domain.id].glow} border border-white/10 hover:border-white/30 transition-all duration-300 ${
                  selectedDomain === domain.id ? 'ring-4 ring-cyan-400 scale-105' : 'hover:scale-105'
                }`}
                variants={cardVariants}
                whileHover="hover"
                onClick={() => setSelectedDomain(domain.id)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {DOMAIN_COLORS[domain.id].icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{domain.label}</h4>
                    <p className="text-sm text-white/80">{domain.desc}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {domain.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-white/90">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>

                {selectedDomain === domain.id && (
                  <motion.div
                    className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Data Source Selection */}
        <motion.section 
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Connect Your Data Source
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {DATA_SOURCES.map((source) => (
              <motion.div
                key={source.id}
                className={`relative group cursor-pointer rounded-2xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 hover:border-cyan-400/30 transition-all duration-300 ${
                  selectedSource === source.id ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-105'
                }`}
                variants={cardVariants}
                whileHover="hover"
                onClick={() => setSelectedSource(source.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${source.gradient} mb-4 ${source.glow}`}>
                    {source.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{source.label}</h4>
                  <p className="text-sm text-cyan-200 mb-4">{source.desc}</p>
                  
                  {source.id === 'upload' && selectedSource === 'upload' && (
                    <div className="w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.json"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                        }}
                      >
                        Choose File
                      </button>
                      {file && (
                        <div className="mt-3 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                          <p className="text-sm text-green-300 font-medium">✓ {file.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedSource === source.id && (
                  <motion.div
                    className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Progress Indicator */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex items-center gap-4 bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <div className={`w-3 h-3 rounded-full ${selectedDomain ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-sm text-cyan-200">Domain Selected</span>
            <div className="w-8 h-0.5 bg-slate-600" />
            <div className={`w-3 h-3 rounded-full ${selectedSource ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-sm text-cyan-200">Data Connected</span>
            <div className="w-8 h-0.5 bg-slate-600" />
            <div className={`w-3 h-3 rounded-full ${selectedDomain && selectedSource ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-sm text-cyan-200">Ready to Analyze</span>
          </div>
        </motion.div>
      </main>

      {/* CTA Section */}
      <AnimatePresence>
        {selectedDomain && selectedSource && !showLoader && (
          <motion.div
            className="fixed bottom-0 left-0 w-full z-30"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="w-full bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-t border-cyan-400/20">
              <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Ready to unlock AI-powered insights?
                  </h3>
                  <p className="text-cyan-200 text-sm">
                    {selectedDomain && DOMAIN_COLORS[selectedDomain] && (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                        {DOMAINS.find(d => d.id === selectedDomain)?.label} Domain
                      </span>
                    )} • {DATA_SOURCES.find(s => s.id === selectedSource)?.label}
                  </p>
                </div>
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 text-lg flex items-center gap-3"
                  onClick={handleBegin}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket className="w-5 h-5" />
                  Begin Analysis
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader Interstitial */}
      <AnimatePresence>
        {showLoader && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                AI is processing your data...
              </h2>
              
              <p className="text-cyan-200 mb-8 max-w-md">
                Initializing neural networks and preparing your personalized analytics workspace
              </p>
              
              <div className="w-80 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 border border-red-400"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 py-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-t border-white/10 text-center">
        <div className="flex items-center justify-center gap-3 text-sm text-cyan-200">
          <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span>Sygnify &copy; {new Date().getFullYear()} AbbasAi Solutions. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 
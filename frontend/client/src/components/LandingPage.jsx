import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Brain, TrendingUp, Shield, BarChart3, Zap, ArrowRight, FileText, Database, Globe } from 'lucide-react';

const LandingPage = ({ onNavigateToProcessing }) => {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const domains = [
    {
      id: 'finance',
      name: 'Finance',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      description: 'Financial analytics, risk assessment, and market insights'
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      description: 'Employee analytics, performance metrics, and workforce insights'
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      description: 'Operational efficiency, process optimization, and KPI tracking'
    },
    {
      id: 'supply-chain',
      name: 'Supply Chain',
      icon: Database,
      color: 'from-orange-500 to-orange-600',
      description: 'Supply chain analytics, inventory optimization, and logistics insights'
    },
    {
      id: 'advertising',
      name: 'Advertising',
      icon: Globe,
      color: 'from-pink-500 to-pink-600',
      description: 'Campaign analytics, ROI tracking, and audience insights'
    }
  ];

  const handleFileSelect = (file) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedDomain) {
      alert('Please select a domain first');
      return;
    }
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      onNavigateToProcessing({
        jobId: `job_${Date.now()}`,
        selectedDomain,
        selectedSource: selectedFile.name
      });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4"
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white">
              Sygnify
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Enterprise-grade AI-powered financial analytics platform with intelligent data comprehension, 
            advanced ML integration, and production-ready analysis capabilities
          </p>
        </motion.div>

        {/* Domain Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Select Your Business Domain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {domains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 ${
                  selectedDomain === domain.id ? 'ring-2 ring-blue-400 bg-white/20' : ''
                }`}
                onClick={() => setSelectedDomain(domain.id)}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${domain.color} flex items-center justify-center mb-4`}>
                  <domain.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{domain.name}</h3>
                <p className="text-sm text-gray-300">{domain.description}</p>
                {selectedDomain === domain.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* File Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Upload Your Data
          </h2>
          <div className="max-w-2xl mx-auto">
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600'
              } ${selectedFile ? 'border-green-400 bg-green-500/10' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                {selectedFile ? (
                  <div>
                    <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">File selected successfully</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">Drop your CSV file here</p>
                    <p className="text-gray-400">or click to browse</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Start Analysis Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedDomain || !selectedFile || isProcessing}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center mx-auto space-x-2 ${
              selectedDomain && selectedFile && !isProcessing
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleStartAnalysis}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Start AI Analysis</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-8">
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Insights',
                description: 'Advanced machine learning algorithms provide deep insights and predictions'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-grade security with comprehensive data protection and compliance'
              },
              {
                icon: TrendingUp,
                title: 'Real-time Analytics',
                description: 'Live data processing with instant updates and real-time dashboards'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm"
              >
                <feature.icon className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;

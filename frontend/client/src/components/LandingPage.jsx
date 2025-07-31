import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Brain, TrendingUp, Shield, BarChart3, Zap, ArrowRight, FileText, 
  Database, Globe, Cloud, Server, Wifi, Link, Plus, X, CheckCircle 
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Footer from './ui/Footer';
import { textStyles } from '../styles/designSystem';

const LandingPage = ({ onNavigateToProcessing }) => {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDataSourceOptions, setShowDataSourceOptions] = useState(false);

  const domains = [
    {
      id: 'finance',
      name: 'Finance',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      description: 'Financial analytics & insights'
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      description: 'Employee analytics & metrics'
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      description: 'Process optimization & KPIs'
    },
    {
      id: 'supply-chain',
      name: 'Supply Chain',
      icon: Database,
      color: 'from-orange-500 to-orange-600',
      description: 'Inventory & logistics insights'
    },
    {
      id: 'advertising',
      name: 'Advertising',
      icon: Globe,
      color: 'from-pink-500 to-pink-600',
      description: 'Campaign analytics & ROI'
    }
  ];

  const dataSources = [
    {
      id: 'file-upload',
      name: 'File Upload',
      icon: Upload,
      description: 'Upload CSV, Excel, or JSON files',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'database',
      name: 'Database Connection',
      icon: Database,
      description: 'Connect to MySQL, PostgreSQL, or SQL Server',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'api',
      name: 'API Integration',
      icon: Wifi,
      description: 'Connect to REST APIs or GraphQL endpoints',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'cloud',
      name: 'Cloud Storage',
      icon: Cloud,
      description: 'Connect to AWS S3, Google Cloud, or Azure',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleFileSelect = (file) => {
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
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

  const handleDataSourceSelect = (dataSourceId) => {
    setSelectedDataSource(dataSourceId);
    setShowDataSourceOptions(false);
    if (dataSourceId === 'file-upload') {
      setSelectedFile(null);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedDomain) {
      alert('Please select a domain first');
      return;
    }
    if (!selectedDataSource) {
      alert('Please select a data source first');
      return;
    }
    if (selectedDataSource === 'file-upload' && !selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      onNavigateToProcessing({
        jobId: `job_${Date.now()}`,
        selectedDomain,
        selectedDataSource,
        selectedSource: selectedFile ? selectedFile.name : selectedDataSource
      });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-200/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
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
      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3"
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900">
              Sygnify
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-Powered Analytics That Actually Work
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Domain Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Your Business Domain
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {domains.map((domain, index) => (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    variant="interactive"
                    selected={selectedDomain === domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className="p-4 relative"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${domain.color} flex items-center justify-center mb-3`}>
                      <domain.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{domain.name}</h3>
                    <p className="text-xs text-gray-600">{domain.description}</p>
                    {selectedDomain === domain.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Data Source & Upload */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connect Your Data
            </h2>
            
            {/* Data Source Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {dataSources.map((source, index) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    <Card
                      variant="interactive"
                      selected={selectedDataSource === source.id}
                      onClick={() => handleDataSourceSelect(source.id)}
                      className="p-4 text-center"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${source.color} flex items-center justify-center mb-2 mx-auto`}>
                        <source.icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{source.name}</h3>
                      <p className="text-xs text-gray-600">{source.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* File Upload Section */}
            {selectedDataSource === 'file-upload' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 bg-white shadow-sm ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } ${selectedFile ? 'border-green-500 bg-green-50' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    {selectedFile ? (
                      <div>
                        <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-green-600 font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">File selected successfully</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-900 font-medium text-sm">Drop your file here</p>
                        <p className="text-xs text-gray-500">or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Supports CSV, Excel, JSON</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Database Connection Form */}
            {selectedDataSource === 'database' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Database Connection</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Database Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>MySQL</option>
                        <option>PostgreSQL</option>
                        <option>SQL Server</option>
                        <option>Oracle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Connection String</label>
                      <input 
                        type="text" 
                        placeholder="jdbc:mysql://localhost:3306/database"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* API Connection Form */}
            {selectedDataSource === 'api' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">API Connection</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">API Endpoint</label>
                      <input 
                        type="url" 
                        placeholder="https://api.example.com/data"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Authentication</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>API Key</option>
                        <option>Bearer Token</option>
                        <option>OAuth 2.0</option>
                        <option>None</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Cloud Storage Form */}
            {selectedDataSource === 'cloud' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Cloud Storage</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cloud Provider</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>AWS S3</option>
                        <option>Google Cloud Storage</option>
                        <option>Azure Blob Storage</option>
                        <option>Dropbox</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bucket/Container</label>
                      <input 
                        type="text" 
                        placeholder="my-data-bucket"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Start Analysis Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center"
            >
              <Button
                variant="primary"
                size="large"
                disabled={!selectedDomain || !selectedDataSource || (selectedDataSource === 'file-upload' && !selectedFile) || isProcessing}
                loading={isProcessing}
                onClick={handleStartAnalysis}
                icon={isProcessing ? null : Zap}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    Start AI Analysis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Insights',
                description: 'Advanced ML algorithms for deep analysis'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-grade security & compliance'
              },
              {
                icon: TrendingUp,
                title: 'Real-time Analytics',
                description: 'Live data processing & dashboards'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              >
                <Card variant="feature" className="text-center p-4">
                  <feature.icon className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;

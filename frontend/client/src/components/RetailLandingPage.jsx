import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Brain, TrendingUp, Shield, BarChart3, Zap, ArrowRight, FileText, 
  Database, Users, ShoppingCart, Package, Truck, Store, Target,
  Clock, Plus, X, CheckCircle, Star, Award, Activity
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Footer from './ui/Footer';
import { textStyles } from '../styles/designSystem';

const RetailLandingPage = ({ onNavigateToProcessing }) => {
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDataSourceOptions, setShowDataSourceOptions] = useState(false);

  // Retail-specific data sources
  const dataSources = [
    {
      id: 'csv-upload',
      name: 'CSV File Upload',
      icon: Upload,
      description: 'Upload retail transaction data (CSV format)',
      color: 'from-blue-500 to-blue-600',
      supported_formats: ['CSV', 'Excel'],
      examples: ['Sales transactions', 'Customer data', 'Inventory records']
    },
    {
      id: 'pos-system',
      name: 'POS System Data',
      icon: Store,
      description: 'Connect to point-of-sale systems',
      color: 'from-green-500 to-green-600',
      supported_formats: ['API', 'Database'],
      examples: ['Square', 'Shopify', 'WooCommerce']
    },
    {
      id: 'ecommerce-platform',
      name: 'E-commerce Platform',
      icon: ShoppingCart,
      description: 'Import from e-commerce platforms',
      color: 'from-purple-500 to-purple-600',
      supported_formats: ['API', 'Export'],
      examples: ['Shopify', 'Magento', 'BigCommerce']
    },
    {
      id: 'inventory-system',
      name: 'Inventory Management',
      icon: Package,
      description: 'Connect to inventory management systems',
      color: 'from-orange-500 to-orange-600',
      supported_formats: ['Database', 'API'],
      examples: ['TradeGecko', 'Cin7', 'Zoho Inventory']
    }
  ];

  // Retail analytics features
  const retailFeatures = [
    {
      icon: Users,
      title: 'Customer Analytics',
      description: 'RFM analysis, CLV calculation, customer segmentation',
      metrics: ['Customer Lifetime Value', 'Retention Rate', 'Churn Analysis']
    },
    {
      icon: TrendingUp,
      title: 'Sales Performance',
      description: 'Sales velocity, conversion rates, revenue trends',
      metrics: ['Conversion Rate', 'Average Order Value', 'Sales Growth']
    },
    {
      icon: Package,
      title: 'Inventory Optimization',
      description: 'Turnover analysis, ABC classification, stock optimization',
      metrics: ['Inventory Turnover', 'Stock-out Rate', 'Carrying Costs']
    },
    {
      icon: Truck,
      title: 'Supply Chain Insights',
      description: 'Supplier performance, lead times, logistics optimization',
      metrics: ['On-time Delivery', 'Supplier Quality', 'Lead Time Analysis']
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Predictive analytics, trend analysis, recommendations',
      metrics: ['Demand Forecasting', 'Price Optimization', 'Market Trends']
    },
    {
      icon: Target,
      title: 'Strategic Recommendations',
      description: 'Data-driven recommendations for business growth',
      metrics: ['Action Items', 'ROI Projections', 'Risk Assessment']
    }
  ];

  const handleFileSelect = (file) => {
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') || 
                 file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 file.name.endsWith('.xlsx'))) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV or Excel file');
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

  const handleStartAnalysis = async () => {
    if (!selectedDataSource) {
      alert('Please select a data source');
      return;
    }

    if (selectedDataSource === 'csv-upload' && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const jobData = {
        jobId: `retail_job_${Date.now()}`,
        selectedDomain: 'retail',
        selectedSource: selectedDataSource,
        file: selectedFile,
        timestamp: new Date().toISOString()
      };

      onNavigateToProcessing(jobData);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Error starting analysis. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center items-center mb-6"
            >
              <Store className="h-12 w-12 text-blue-600 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Retail Analytics Hub
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Transform your retail data into actionable insights with AI-powered analytics. 
              Optimize sales, understand customers, manage inventory, and boost profitability.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-8"
            >
              <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Customer Analytics
              </div>
              <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sales Performance
              </div>
              <div className="flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Inventory Optimization
              </div>
              <div className="flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Supply Chain Insights
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column - Data Upload */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📊 Upload Your Retail Data
              </h2>
              
              {/* Data Source Selection */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-700">Choose Your Data Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataSources.map((source) => (
                    <motion.div
                      key={source.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedDataSource === source.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDataSource(source.id)}
                    >
                      <div className="flex items-center mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${source.color} flex items-center justify-center mr-3`}>
                          <source.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{source.name}</h4>
                          <p className="text-sm text-gray-600">{source.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Supported: {source.supported_formats.join(', ')}</p>
                        <p>Examples: {source.examples.join(', ')}</p>
                      </div>
                      {selectedDataSource === source.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* File Upload Area */}
              {selectedDataSource === 'csv-upload' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-700">Upload Your File</h3>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : selectedFile 
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      {selectedFile ? (
                        <>
                          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                          <p className="text-lg font-semibold text-green-700">{selectedFile.name}</p>
                          <p className="text-sm text-green-600">File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedFile(null)}
                            className="mt-4"
                          >
                            Choose Different File
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-semibold text-gray-700">
                            Drop your retail data file here
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            or click to browse (CSV, Excel files supported)
                          </p>
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload">
                            <Button variant="secondary" className="cursor-pointer">
                              Browse Files
                            </Button>
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Data Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Required Data Columns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="font-medium text-blue-800">Essential:</p>
                        <ul className="text-blue-700 ml-4">
                          <li>• customer_id</li>
                          <li>• product_id</li>
                          <li>• transaction_date</li>
                          <li>• quantity_sold</li>
                          <li>• unit_price</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">Optional (for deeper insights):</p>
                        <ul className="text-blue-700 ml-4">
                          <li>• category</li>
                          <li>• supplier</li>
                          <li>• inventory_on_hand</li>
                          <li>• discount_percentage</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Start Analysis Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-6"
              >
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isProcessing || !selectedDataSource || (selectedDataSource === 'csv-upload' && !selectedFile)}
                  className="w-full flex items-center justify-center"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Starting Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Start Retail Analytics
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🎯 Retail Analytics Features
              </h2>
              
              <div className="space-y-4">
                {retailFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{feature.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.metrics.map((metric, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Success Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Expected Outcomes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">15-25%</div>
                  <div className="text-sm text-gray-600">Revenue Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">30-40%</div>
                  <div className="text-sm text-gray-600">Inventory Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">20-30%</div>
                  <div className="text-sm text-gray-600">Customer Retention</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">50-60%</div>
                  <div className="text-sm text-gray-600">Better Decisions</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RetailLandingPage;
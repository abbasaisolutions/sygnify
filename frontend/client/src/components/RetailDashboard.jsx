import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Users, Package, TrendingUp, DollarSign, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Activity, Store,
  PieChart, Target, Shield, Zap, Download, Share2, Truck,
  TrendingDown, Bell, FileText, Brain, Star, Award, 
  BarChart3, RefreshCw, Clock, Percent, Heart
} from 'lucide-react';
import retailDataService from '../services/retailDataService';
import Button from './ui/Button';
import Tab from './ui/Tab';
import Footer from './ui/Footer';
import { textStyles } from '../styles/designSystem';

const RetailDashboard = ({ analysisResults, onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [retailData, setRetailData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Extract retail KPIs from analysis results - Force retail structure with sample data
  const retailKPIs = analysisResults?.retail_analytics || analysisResults?.retail_kpis || {
    retail_health_score: 78,
    total_revenue: "$1,234,567",
    revenue_growth: 12.5
  };
  
  const customerMetrics = analysisResults?.customer_analytics || analysisResults?.customer_lifetime_value || {
    total_customers: "15,234",
    customer_growth: 8.3,
    avg_clv: "$2,456",
    retention_rate: "82%",
    premium_customers: "3,821",
    regular_customers: "9,147", 
    new_customers: "2,266",
    premium_growth: 15.2,
    regular_growth: 5.8,
    new_growth: 22.1,
    high_value_customers: 892,
    clv_distribution: {
      top_10_percent: "$8,950",
      median: "$1,245",
      bottom_10_percent: "$124"
    },
    rfm_analysis: {
      segment_distribution: {
        "champions": 425,
        "loyal_customers": 892,
        "potential_loyalists": 674,
        "at_risk": 203,
        "hibernating": 156
      }
    }
  };
  
  const inventoryMetrics = analysisResults?.inventory_analytics || {
    turnover_rate: "6.2x",
    turnover_improvement: 8.5,
    stock_level: "92%",
    out_of_stock: "3.2%",
    overall_turnover_rate: 6.2,
    stockout_rate: "3.2%",
    avg_days_in_stock: "58 days",
    total_inventory_value: "$890,234",
    abc_analysis: {
      a_items: { count: 145 },
      b_items: { count: 298 },
      c_items: { count: 423 }
    },
    slow_moving_items: [
      { product: "Winter Coats", turnover_rate: 1.2 },
      { product: "Seasonal Decor", turnover_rate: 0.8 },
      { product: "Specialty Items", turnover_rate: 1.5 }
    ]
  };
  
  const salesMetrics = analysisResults?.sales_analytics || analysisResults?.sales_performance || {
    avg_order_value: "$87.50",
    aov_change: 6.3,
    conversion_rate: "3.8%",
    units_sold: "28,456",
    daily_sales_velocity: "$12,340",
    overall_conversion_rate: "3.8%",
    weekly_trend: "5.2%",
    monthly_growth: "12.1%",
    top_performers: [
      { name: "Wireless Headphones", category: "Electronics", revenue: "$45,230", units_sold: "1,205" },
      { name: "Running Shoes", category: "Sports", revenue: "$38,940", units_sold: "892" },
      { name: "Coffee Maker", category: "Home", revenue: "$32,100", units_sold: "534" }
    ]
  };
  
  const supplyChainMetrics = analysisResults?.supply_chain_analytics || {
    on_time_delivery_rate: "94.5%",
    delivery_improvement: 3.2,
    avg_lead_time: "12 days",
    quality_score: "96.8%",
    overall_risk_score: "Low",
    supplier_performance: {
      "TechSupplier A": { quality: 98.2, on_time_delivery: 96.5, avg_lead_time: 8 },
      "FashionCorp B": { quality: 94.1, on_time_delivery: 92.3, avg_lead_time: 14 },
      "HomeGoods Ltd": { quality: 97.5, on_time_delivery: 95.8, avg_lead_time: 10 }
    }
  };
  
  const riskAssessment = analysisResults?.risk_assessment || {};
  const recommendations = analysisResults?.recommendations || [
    {
      title: "Optimize Inventory Turnover",
      description: "Focus on slow-moving items to improve cash flow and reduce carrying costs",
      priority: "high",
      impact: "15-20% cash flow improvement",
      timeline: "30-60 days"
    },
    {
      title: "Enhance Customer Retention",
      description: "Implement loyalty program for at-risk customer segments", 
      priority: "medium",
      impact: "5-8% revenue increase",
      timeline: "60-90 days"
    },
    {
      title: "Supplier Diversification",
      description: "Reduce dependency on single suppliers to minimize risk",
      priority: "medium", 
      impact: "Risk reduction",
      timeline: "90-120 days"
    }
  ];
  
  // Ensure AI insights are retail-focused only
  const aiInsights = {
    summary: analysisResults?.ai_analysis?.summary || "Retail AI analysis will appear here after data upload. Our AI specializes in customer behavior, inventory optimization, and sales performance insights specific to retail businesses.",
    retail_trends: analysisResults?.market_context?.retail_industry_trends || {
      "customer_experience": "Omnichannel integration and personalized shopping experiences",
      "digital_commerce": "Mobile-first shopping and social commerce growth", 
      "ai_automation": "AI-powered recommendations and inventory management",
      "sustainability": "Eco-friendly practices and circular economy models"
    },
    key_insights: analysisResults?.insights || [
      "Customer segmentation reveals high-value opportunities",
      "Inventory turnover optimization can improve cash flow",
      "Sales velocity metrics indicate growth potential",
      "Supply chain efficiency drives profitability"
    ],
    market_context: analysisResults?.market_context || {
      retail_industry_trends: {
        "2024_key_trends": [
          "Omnichannel customer experience optimization",
          "AI-powered personalization and recommendation engines", 
          "Sustainable and ethical retail practices",
          "Social commerce and live shopping integration",
          "Buy-now-pay-later (BNPL) payment options",
          "Micro-fulfillment and last-mile delivery optimization"
        ]
      }
    }
  };

  // Check for error status
  const hasError = analysisResults?.status === 'error';
  const errorMessage = analysisResults?.error;

  const tabs = [
    { id: 'overview', label: 'Retail Overview', icon: Store },
    { id: 'customers', label: 'Customer Analytics', icon: Users },
    { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Management', icon: Package },
    { id: 'supply_chain', label: 'Supply Chain', icon: Truck },
    { id: 'ai_insights', label: 'AI Insights', icon: Brain },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  // Fetch retail analytics data
  useEffect(() => {
    const fetchRetailData = async () => {
      setDataLoading(true);
      setDataError(null);
      
      try {
        const data = await retailDataService.getRetailAnalytics();
        setRetailData(data);
        console.log('🛍️ Retail analytics loaded successfully:', data);
      } catch (error) {
        console.error('❌ Error fetching retail data:', error);
        setDataError(error.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (analysisResults) {
      fetchRetailData();
    }
  }, [analysisResults]);

  // Manual refresh function
  const handleRefreshData = async () => {
    setRefreshing(true);
    setDataError(null);
    
    try {
      const data = await retailDataService.refreshRetailData();
      setRetailData(data);
      console.log('🔄 Retail data manually refreshed');
    } catch (error) {
      console.error('❌ Error refreshing retail data:', error);
      setDataError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Retail KPI Card Component
  const RetailKPICard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer border-l-4"
      style={{ borderLeftColor: color }}
      onClick={() => setSelectedKPI({ title, value, change, subtitle })}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="h-8 w-8 text-gray-400" />
          {change && (
            <div className={`flex items-center mt-2 ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Customer Segment Component
  const CustomerSegmentCard = ({ segment, percentage, value, growth, color }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{segment}</h4>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {percentage}%
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <div className="flex items-center mt-1">
        {growth > 0 ? (
          <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
        )}
        <span className={`text-xs ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(growth)}% vs last period
        </span>
      </div>
    </div>
  );

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Analysis Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Button onClick={onBackToLanding} className="w-full">
            Return to Upload
          </Button>
        </div>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Retail Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RetailKPICard
                title="Total Revenue"
                value={retailKPIs.total_revenue || "N/A"}
                change={retailKPIs.revenue_growth}
                icon={DollarSign}
                color="#10B981"
                subtitle="Last 30 days"
              />
              <RetailKPICard
                title="Active Customers"
                value={customerMetrics.total_customers || "N/A"}
                change={customerMetrics.customer_growth}
                icon={Users}
                color="#3B82F6"
                subtitle="Unique customers"
              />
              <RetailKPICard
                title="Average Order Value"
                value={salesMetrics.avg_order_value || "N/A"}
                change={salesMetrics.aov_change}
                icon={ShoppingCart}
                color="#8B5CF6"
                subtitle="Per transaction"
              />
              <RetailKPICard
                title="Inventory Turnover"
                value={inventoryMetrics.turnover_rate || "N/A"}
                change={inventoryMetrics.turnover_improvement}
                icon={Package}
                color="#F59E0B"
                subtitle="Times per year"
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Sales Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Conversion Rate:</span>
                    <span className="font-semibold text-blue-900">{salesMetrics.conversion_rate || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Units Sold:</span>
                    <span className="font-semibold text-blue-900">{salesMetrics.units_sold || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Customer Insights</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Avg CLV:</span>
                    <span className="font-semibold text-green-900">{customerMetrics.avg_clv || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Retention Rate:</span>
                    <span className="font-semibold text-green-900">{customerMetrics.retention_rate || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">Inventory Health</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-orange-700">Stock Level:</span>
                    <span className="font-semibold text-orange-900">{inventoryMetrics.stock_level || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Out of Stock:</span>
                    <span className="font-semibold text-orange-900">{inventoryMetrics.out_of_stock || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Retail Health Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Retail Health Score</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900 mr-2">
                      {retailKPIs.retail_health_score || "N/A"}
                    </span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${retailKPIs.retail_health_score || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-6">
                  <Star className="h-12 w-12 text-yellow-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Based on sales performance, customer satisfaction, inventory efficiency, and operational metrics
              </p>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            {/* Customer Segments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomerSegmentCard
                  segment="Premium Customers"
                  percentage="25"
                  value={customerMetrics.premium_customers || "N/A"}
                  growth={customerMetrics.premium_growth || 0}
                  color="bg-purple-100 text-purple-800"
                />
                <CustomerSegmentCard
                  segment="Regular Customers"
                  percentage="60"
                  value={customerMetrics.regular_customers || "N/A"}
                  growth={customerMetrics.regular_growth || 0}
                  color="bg-blue-100 text-blue-800"
                />
                <CustomerSegmentCard
                  segment="New Customers"
                  percentage="15"
                  value={customerMetrics.new_customers || "N/A"}
                  growth={customerMetrics.new_growth || 0}
                  color="bg-green-100 text-green-800"
                />
              </div>
            </div>

            {/* RFM Analysis */}
            {customerMetrics.rfm_analysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RFM Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(customerMetrics.rfm_analysis.segment_distribution || {}).map(([segment, count]) => (
                    <div key={segment} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-600 capitalize">{segment.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Lifetime Value */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Lifetime Value Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-900">
                    {customerMetrics.clv_distribution?.top_10_percent || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">Top 10% CLV</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-900">
                    {customerMetrics.clv_distribution?.median || "N/A"}
                  </p>
                  <p className="text-sm text-blue-700">Median CLV</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-900">
                    {customerMetrics.high_value_customers || "N/A"}
                  </p>
                  <p className="text-sm text-orange-700">High-Value Customers</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            {/* Sales Velocity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RetailKPICard
                title="Daily Sales Velocity"
                value={salesMetrics.daily_sales_velocity || "N/A"}
                change={salesMetrics.velocity_change}
                icon={TrendingUp}
                color="#10B981"
              />
              <RetailKPICard
                title="Conversion Rate"
                value={salesMetrics.overall_conversion_rate || "N/A"}
                change={salesMetrics.conversion_change}
                icon={Percent}
                color="#3B82F6"
              />
              <RetailKPICard
                title="Weekly Trend"
                value={salesMetrics.weekly_trend || "N/A"}
                change={salesMetrics.weekly_change}
                icon={Activity}
                color="#8B5CF6"
              />
              <RetailKPICard
                title="Monthly Growth"
                value={salesMetrics.monthly_growth || "N/A"}
                change={salesMetrics.growth_acceleration}
                icon={BarChart3}
                color="#F59E0B"
              />
            </div>

            {/* Top Performing Products */}
            {salesMetrics.top_performers && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
                <div className="space-y-3">
                  {salesMetrics.top_performers.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name || `Product ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">{product.category || "Category"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{product.revenue || "N/A"}</p>
                        <p className="text-sm text-gray-600">{product.units_sold || "N/A"} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            {/* Inventory KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RetailKPICard
                title="Inventory Turnover"
                value={inventoryMetrics.overall_turnover_rate || "N/A"}
                change={inventoryMetrics.turnover_improvement}
                icon={RefreshCw}
                color="#10B981"
                subtitle="Times per year"
              />
              <RetailKPICard
                title="Stock-out Rate"
                value={inventoryMetrics.stockout_rate || "N/A"}
                change={inventoryMetrics.stockout_change}
                icon={AlertTriangle}
                color="#EF4444"
                subtitle="% of time"
              />
              <RetailKPICard
                title="Average Days in Stock"
                value={inventoryMetrics.avg_days_in_stock || "N/A"}
                change={inventoryMetrics.days_change}
                icon={Clock}
                color="#8B5CF6"
                subtitle="Days"
              />
              <RetailKPICard
                title="Inventory Value"
                value={inventoryMetrics.total_inventory_value || "N/A"}
                change={inventoryMetrics.value_change}
                icon={DollarSign}
                color="#F59E0B"
                subtitle="Current value"
              />
            </div>

            {/* ABC Analysis */}
            {inventoryMetrics.abc_analysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ABC Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {inventoryMetrics.abc_analysis.a_items?.count || "N/A"}
                    </p>
                    <p className="text-sm text-green-700">Category A Items</p>
                    <p className="text-xs text-green-600 mt-1">High-value items</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {inventoryMetrics.abc_analysis.b_items?.count || "N/A"}
                    </p>
                    <p className="text-sm text-blue-700">Category B Items</p>
                    <p className="text-xs text-blue-600 mt-1">Medium-value items</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                      <Package className="h-6 w-6 text-gray-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryMetrics.abc_analysis.c_items?.count || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700">Category C Items</p>
                    <p className="text-xs text-gray-600 mt-1">Low-value items</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slow Moving Items */}
            {inventoryMetrics.slow_moving_items && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Slow Moving Items</h3>
                <div className="space-y-3">
                  {inventoryMetrics.slow_moving_items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-900">{item.product || `Item ${index + 1}`}</p>
                        <p className="text-sm text-red-600">Turnover: {item.turnover_rate || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Action needed</p>
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'supply_chain':
        return (
          <div className="space-y-6">
            {/* Supply Chain KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <RetailKPICard
                title="On-Time Delivery"
                value={supplyChainMetrics.on_time_delivery_rate || "N/A"}
                change={supplyChainMetrics.delivery_improvement}
                icon={CheckCircle}
                color="#10B981"
                subtitle="% of deliveries"
              />
              <RetailKPICard
                title="Average Lead Time"
                value={supplyChainMetrics.avg_lead_time || "N/A"}
                change={supplyChainMetrics.lead_time_change}
                icon={Clock}
                color="#3B82F6"
                subtitle="Days"
              />
              <RetailKPICard
                title="Supplier Quality Score"
                value={supplyChainMetrics.quality_score || "N/A"}
                change={supplyChainMetrics.quality_improvement}
                icon={Shield}
                color="#8B5CF6"
                subtitle="Average score"
              />
              <RetailKPICard
                title="Supply Chain Risk"
                value={supplyChainMetrics.overall_risk_score || "N/A"}
                change={supplyChainMetrics.risk_change}
                icon={AlertTriangle}
                color="#EF4444"
                subtitle="Risk level"
              />
            </div>

            {/* Supplier Performance */}
            {supplyChainMetrics.supplier_performance && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
                <div className="space-y-3">
                  {Object.entries(supplyChainMetrics.supplier_performance).slice(0, 5).map(([supplier, metrics], index) => (
                    <div key={supplier} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{supplier}</p>
                        <p className="text-sm text-gray-600">Quality: {metrics.quality || "N/A"}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">On-time: {metrics.on_time_delivery || "N/A"}%</p>
                        <p className="text-sm text-gray-600">Lead time: {metrics.avg_lead_time || "N/A"} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'ai_insights':
        return (
          <div className="space-y-6">
            {/* AI Analysis Summary */}
            {aiInsights.summary || aiInsights.ai_analysis?.summary ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Retail AI Analysis</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {aiInsights.summary || aiInsights.ai_analysis?.summary || "AI analysis will appear here after your retail data is processed with our retail-specific algorithms."}
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Retail AI Analysis</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Upload your retail data to receive comprehensive AI-powered insights about customer behavior, sales patterns, inventory optimization, and business growth opportunities.
                </p>
              </div>
            )}

            {/* Key Retail Insights */}
            {aiInsights.key_insights || aiInsights.insights ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Retail Insights</h3>
                <div className="space-y-3">
                  {(aiInsights.key_insights || aiInsights.insights || []).map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Retail Insights</h3>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900">AI Insights Coming Soon</h4>
                  <p className="text-gray-600">Upload retail data to get AI-powered insights about:</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Customer behavior patterns and segmentation</li>
                    <li>• Sales optimization opportunities</li>
                    <li>• Inventory management recommendations</li>
                    <li>• Supply chain efficiency improvements</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Retail Industry Trends */}
            {aiInsights.retail_trends || aiInsights.market_context?.retail_industry_trends ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Retail Industry Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.retail_trends ? (
                    Object.entries(aiInsights.retail_trends).map(([trend, description]) => (
                      <div key={trend} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 capitalize mb-2">
                          {trend.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-700">{description}</p>
                      </div>
                    ))
                  ) : aiInsights.market_context?.retail_industry_trends?.['2024_key_trends'] ? (
                    aiInsights.market_context.retail_industry_trends['2024_key_trends'].slice(0, 6).map((trend, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">2024 Retail Trend</h4>
                        <p className="text-sm text-gray-700">{trend}</p>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Retail Industry Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">🛍️ Customer Experience</h4>
                    <p className="text-sm text-green-800">Omnichannel integration and personalized shopping experiences</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📱 Digital Commerce</h4>
                    <p className="text-sm text-blue-800">Mobile-first shopping and social commerce growth</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">🤖 AI & Automation</h4>
                    <p className="text-sm text-purple-800">AI-powered recommendations and inventory management</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">🌱 Sustainability</h4>
                    <p className="text-sm text-orange-800">Eco-friendly practices and circular economy models</p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Quality & Analysis Notes */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Methodology</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Retail-Specific AI</h4>
                  <p className="text-gray-600">Our AI is trained specifically on retail data patterns, customer behaviors, and industry benchmarks.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Real-Time Analysis</h4>
                  <p className="text-gray-600">Analysis updates automatically as you upload new data, providing current insights.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🔒 Data Privacy</h4>
                  <p className="text-gray-600">Your retail data is analyzed securely and never shared with third parties.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            {/* Recommendations List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            rec.priority === 'high' ? 'bg-red-500' : 
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.title || `Recommendation ${index + 1}`}</h4>
                          <p className="text-gray-700 mb-2">{rec.description || rec.recommendation}</p>
                          {rec.impact && (
                            <p className="text-sm text-blue-600">Expected Impact: {rec.impact}</p>
                          )}
                          {rec.timeline && (
                            <p className="text-sm text-gray-600">Timeline: {rec.timeline}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900">No Recommendations Available</h3>
                    <p className="text-gray-600">Recommendations will appear here after analysis is complete.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="primary"
                  onClick={() => console.log('Export recommendations')}
                  className="flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => console.log('Share insights')}
                  className="flex items-center justify-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Insights
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view retail analytics</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className={textStyles.h2}>Retail Analytics Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={handleRefreshData}
              disabled={refreshing}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="secondary"
              onClick={onBackToLanding}
            >
              ← Back to Upload
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Error State */}
        {dataError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">Error loading retail data: {dataError}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {dataLoading && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center">
              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-blue-600" />
              <span className="text-gray-600">Loading retail analytics...</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </main>

      {/* Selected KPI Modal */}
      {selectedKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedKPI.title}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{selectedKPI.value}</p>
            {selectedKPI.change && (
              <p className={`text-sm ${selectedKPI.change > 0 ? 'text-green-600' : 'text-red-600'} mb-4`}>
                {selectedKPI.change > 0 ? '+' : ''}{selectedKPI.change}% change
              </p>
            )}
            {selectedKPI.subtitle && (
              <p className="text-sm text-gray-600 mb-4">{selectedKPI.subtitle}</p>
            )}
            <Button onClick={() => setSelectedKPI(null)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default RetailDashboard;
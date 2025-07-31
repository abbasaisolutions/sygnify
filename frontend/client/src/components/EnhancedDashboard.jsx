import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, Users, Truck, Settings, Globe, 
  BarChart3, PieChart, Activity, Shield, Target, Rocket,
  Sparkles, Zap, CheckCircle, AlertTriangle, Info, 
  Download, Share2, RefreshCw, Eye, EyeOff, DollarSign,
  TrendingDown, AlertCircle, Lightbulb, BarChart2, 
  ActivitySquare, Target as TargetIcon, Zap as ZapIcon, Wifi,
  LineChart, BarChart, PieChart as PieChartIcon, ScatterChart,
  Calendar, Clock, TrendingUp as TrendingUpIcon, AlertTriangle as AlertTriangleIcon,
  FileText, Database
} from 'lucide-react';

// Enhanced Financial KPI Cards with comprehensive metrics
const FinancialKPICard = ({ title, value, change, trend, icon, color, subtitle, details, category }) => (
  <motion.div
    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-transparent hover:border-blue-500"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
        trend === 'up' ? 'bg-green-100 text-green-700' : 
        trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {trend === 'up' ? <TrendingUpIcon className="w-4 h-4" /> :
         trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
         <Activity className="w-4 h-4" />}
        <span className="font-medium">{change}</span>
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-gray-600 text-sm font-medium">{title}</p>
    {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    {category && (
      <div className="mt-2">
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
          {category}
        </span>
      </div>
    )}
    {details && (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="font-medium text-gray-700">{val}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

// Interactive Chart Component
const InteractiveChart = ({ data, title, type = 'bar' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
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
          <motion.div 
            key={index} 
            className="flex items-center gap-3"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
            {hoveredIndex === index && (
              <motion.div
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {((item.value / maxValue) * 100).toFixed(1)}%
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight, index }) => (
  <motion.div
    className={`p-6 rounded-xl border-l-4 ${
      insight.impact === 'high' ? 'bg-red-50 border-red-400' :
      insight.impact === 'medium' ? 'bg-yellow-50 border-yellow-400' :
      'bg-green-50 border-green-400'
    }`}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">{insight.category}</h4>
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {insight.impact} impact
          </span>
        </div>
        <p className="text-gray-700 mb-3 leading-relaxed">{insight.insight}</p>
        {insight.metric1 && insight.metric2 && (
          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
            <span className="font-medium">Correlation:</span> {insight.metric1} ↔ {insight.metric2} 
            {insight.correlation && ` (${insight.correlation.toFixed(3)})`}
          </div>
        )}
      </div>
      <div className="ml-4 flex flex-col items-end gap-2">
        <span className="text-sm text-gray-500">
          {Math.round((insight.confidence || 0) * 100)}% confidence
        </span>
      </div>
    </div>
  </motion.div>
);

// Domain-specific configurations
const DOMAIN_CONFIG = {
  finance: {
    label: 'Finance Analytics',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-[#ff6b35] via-[#f7931e] to-[#ffd23f]',
    glow: 'shadow-[0_0_24px_rgba(255,107,53,0.4)]',
    bgGradient: 'from-orange-50 via-yellow-50 to-amber-50',
    kpis: [
      { title: 'Revenue Growth', value: '$1.25M', change: '+8.7%', trend: 'up', icon: <TrendingUp />, color: 'from-green-500 to-green-600', subtitle: 'QoQ growth' },
      { title: 'Cash Burn Rate', value: '-$15K', change: '-12%', trend: 'down', icon: <TrendingDown />, color: 'from-red-500 to-red-600', subtitle: 'Monthly average' },
      { title: 'Working Capital', value: '$450K', change: '+15%', trend: 'up', icon: <DollarSign />, color: 'from-blue-500 to-blue-600', subtitle: 'Current ratio: 2.1' },
      { title: 'Runway Months', value: '30', change: '+5', trend: 'up', icon: <Calendar />, color: 'from-purple-500 to-purple-600', subtitle: 'Cash runway' }
    ]
  },
  hr: {
    label: 'HR Analytics',
    icon: <Users className="w-8 h-8" />,
    color: 'from-[#ff6b9d] via-[#c44569] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(255,107,157,0.4)]',
    bgGradient: 'from-pink-50 via-purple-50 to-indigo-50',
    kpis: [
      { title: 'Employee Retention', value: '92%', change: '+3%', trend: 'up', icon: <Users />, color: 'from-green-500 to-green-600', subtitle: 'Annual rate' },
      { title: 'Productivity Score', value: '8.5/10', change: '+0.3', trend: 'up', icon: <Activity />, color: 'from-blue-500 to-blue-600', subtitle: 'Team average' },
      { title: 'Turnover Rate', value: '8%', change: '-2%', trend: 'down', icon: <TrendingDown />, color: 'from-red-500 to-red-600', subtitle: 'Annual rate' },
      { title: 'Engagement Score', value: '7.8/10', change: '+0.5', trend: 'up', icon: <Target />, color: 'from-purple-500 to-purple-600', subtitle: 'Employee survey' }
    ]
  },
  supply_chain: {
    label: 'Supply Chain Analytics',
    icon: <Truck className="w-8 h-8" />,
    color: 'from-[#4facfe] via-[#00f2fe] to-[#43e97b]',
    glow: 'shadow-[0_0_24px_rgba(79,172,254,0.4)]',
    bgGradient: 'from-blue-50 via-cyan-50 to-green-50',
    kpis: [
      { title: 'Delivery Time', value: '2.3 days', change: '-0.5', trend: 'down', icon: <Clock />, color: 'from-green-500 to-green-600', subtitle: 'Average' },
      { title: 'Inventory Turnover', value: '12.5x', change: '+1.2', trend: 'up', icon: <BarChart2 />, color: 'from-blue-500 to-blue-600', subtitle: 'Annual rate' },
      { title: 'Cost Efficiency', value: '94%', change: '+2%', trend: 'up', icon: <TrendingUp />, color: 'from-green-500 to-green-600', subtitle: 'vs target' },
      { title: 'Supplier Score', value: '8.7/10', change: '+0.3', trend: 'up', icon: <Target />, color: 'from-purple-500 to-purple-600', subtitle: 'Performance' }
    ]
  },
  operations: {
    label: 'Operations Analytics',
    icon: <Settings className="w-8 h-8" />,
    color: 'from-[#667eea] via-[#764ba2] to-[#f093fb]',
    glow: 'shadow-[0_0_24px_rgba(102,126,234,0.4)]',
    bgGradient: 'from-purple-50 via-indigo-50 to-pink-50',
    kpis: [
      { title: 'Efficiency Ratio', value: '87%', change: '+3%', trend: 'up', icon: <ActivitySquare />, color: 'from-green-500 to-green-600', subtitle: 'Overall' },
      { title: 'Quality Score', value: '9.2/10', change: '+0.4', trend: 'up', icon: <Shield />, color: 'from-blue-500 to-blue-600', subtitle: 'Defect rate' },
      { title: 'Throughput Rate', value: '125/hr', change: '+8', trend: 'up', icon: <BarChart2 />, color: 'from-green-500 to-green-600', subtitle: 'Units per hour' },
      { title: 'Resource Utilization', value: '91%', change: '+2%', trend: 'up', icon: <Target />, color: 'from-purple-500 to-purple-600', subtitle: 'Capacity' }
    ]
  },
  general: {
    label: 'General Analytics',
    icon: <Globe className="w-8 h-8" />,
    color: 'from-[#a8edea] via-[#fed6e3] to-[#ffecd2]',
    glow: 'shadow-[0_0_24px_rgba(168,237,234,0.4)]',
    bgGradient: 'from-teal-50 via-pink-50 to-orange-50',
    kpis: [
      { title: 'Data Quality', value: '96%', change: '+2%', trend: 'up', icon: <Shield />, color: 'from-green-500 to-green-600', subtitle: 'Completeness' },
      { title: 'Pattern Recognition', value: '89%', change: '+5%', trend: 'up', icon: <Brain />, color: 'from-blue-500 to-blue-600', subtitle: 'Accuracy' },
      { title: 'Predictive Power', value: '8.7/10', change: '+0.3', trend: 'up', icon: <Target />, color: 'from-purple-500 to-purple-600', subtitle: 'Model score' },
      { title: 'Business Impact', value: 'High', change: '+15%', trend: 'up', icon: <TrendingUp />, color: 'from-orange-500 to-orange-600', subtitle: 'ROI improvement' }
    ]
  }
};

// Comprehensive KPI Dashboard Component
const ComprehensiveKPIDashboard = ({ financialKPIs }) => {
  const [activeKPITab, setActiveKPITab] = useState('overview');
  const [expandedMetrics, setExpandedMetrics] = useState(new Set());

  const kpiTabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'profitability', label: 'Profitability', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'liquidity', label: 'Liquidity', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'efficiency', label: 'Efficiency', icon: <Activity className="w-4 h-4" /> },
    { id: 'growth', label: 'Growth', icon: <Rocket className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk & Cash', icon: <Shield className="w-4 h-4" /> },
    { id: 'health', label: 'Business Health', icon: <Target className="w-4 h-4" /> }
  ];

  const toggleMetricExpansion = (metricId) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId);
    } else {
      newExpanded.add(metricId);
    }
    setExpandedMetrics(newExpanded);
  };

  const renderOverviewKPIs = () => {
    const overviewMetrics = [];
    
    // Business Health Score
    if (financialKPIs?.business_health) {
      const health = financialKPIs.business_health;
      overviewMetrics.push({
        title: 'Business Health Score',
        value: `${health.overall_score}/100`,
        change: health.health_status,
        trend: health.overall_score >= 60 ? 'up' : 'down',
        icon: <Target className="w-6 h-6" />,
        color: health.overall_score >= 80 ? 'from-green-500 to-green-600' : 
               health.overall_score >= 60 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600',
        subtitle: health.health_status,
        category: 'Health Score',
        details: {
          'Status': health.health_status,
          'Factors': health.health_factors?.length || 0
        }
      });
    }

    // Revenue Growth
    if (financialKPIs?.growth_metrics) {
      const growth = financialKPIs.growth_metrics;
      overviewMetrics.push({
        title: 'Revenue Growth (YoY)',
        value: growth.yoy_growth ? `${growth.yoy_growth.toFixed(1)}%` : 'N/A',
        change: growth.mom_growth ? `${growth.mom_growth.toFixed(1)}% MoM` : '',
        trend: growth.yoy_growth > 0 ? 'up' : 'down',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'from-blue-500 to-blue-600',
        subtitle: 'Year-over-Year',
        category: 'Growth'
      });
    }

    // Profitability
    if (financialKPIs?.profitability_ratios) {
      const profit = Object.values(financialKPIs.profitability_ratios)[0];
      if (profit) {
        overviewMetrics.push({
          title: 'Net Profit Margin',
          value: profit.net_profit_margin ? `${profit.net_profit_margin.toFixed(1)}%` : 'N/A',
          change: profit.profit_growth_rate ? `${profit.profit_growth_rate.toFixed(1)}%` : '',
          trend: profit.profit_trend === 'increasing' ? 'up' : 'down',
          icon: <DollarSign className="w-6 h-6" />,
          color: 'from-green-500 to-green-600',
          subtitle: 'Net Profit / Revenue',
          category: 'Profitability'
        });
      }
    }

    // Liquidity
    if (financialKPIs?.liquidity_ratios) {
      const liquidity = financialKPIs.liquidity_ratios;
      overviewMetrics.push({
        title: 'Current Ratio',
        value: liquidity.current_ratio ? liquidity.current_ratio.toFixed(2) : 'N/A',
        change: liquidity.liquidity_trend === 'improving' ? 'Improving' : 'Declining',
        trend: liquidity.current_ratio > 1.5 ? 'up' : 'down',
        icon: <Shield className="w-6 h-6" />,
        color: liquidity.current_ratio > 1.5 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
        subtitle: 'Current Assets / Current Liabilities',
        category: 'Liquidity'
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewMetrics.map((metric, index) => (
          <FinancialKPICard key={index} {...metric} />
        ))}
      </div>
    );
  };

  const renderProfitabilityKPIs = () => {
    if (!financialKPIs?.profitability_ratios) return <div className="text-center text-gray-500 py-8">No profitability data available</div>;
    
    return (
      <div className="space-y-6">
        {Object.entries(financialKPIs.profitability_ratios).map(([key, data], index) => (
          <motion.div
            key={key}
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Profitability Analysis</h3>
              <button
                onClick={() => toggleMetricExpansion(key)}
                className="text-blue-600 hover:text-blue-800"
              >
                {expandedMetrics.has(key) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {data.net_profit_margin ? `${data.net_profit_margin.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Net Profit Margin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {data.gross_profit_margin ? `${data.gross_profit_margin.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Gross Profit Margin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {data.revenue_growth_rate ? `${data.revenue_growth_rate.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Revenue Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {data.profit_growth_rate ? `${data.profit_growth_rate.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Profit Growth</div>
              </div>
            </div>
            
            {expandedMetrics.has(key) && (
              <motion.div
                className="mt-4 pt-4 border-t border-gray-200"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Trends</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Revenue Trend:</span>
                        <span className={`font-medium ${data.revenue_trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                          {data.revenue_trend}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Trend:</span>
                        <span className={`font-medium ${data.profit_trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                          {data.profit_trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Volatility</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Revenue Volatility:</span>
                        <span className="font-medium">{data.revenue_volatility ? data.revenue_volatility.toFixed(2) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Volatility:</span>
                        <span className="font-medium">{data.profit_volatility ? data.profit_volatility.toFixed(2) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderLiquidityKPIs = () => {
    if (!financialKPIs?.liquidity_ratios) return <div className="text-center text-gray-500 py-8">No liquidity data available</div>;
    
    const liquidity = financialKPIs.liquidity_ratios;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Liquidity Ratios</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {liquidity.current_ratio ? liquidity.current_ratio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-blue-700 font-medium">Current Ratio</div>
              <div className="text-xs text-blue-600 mt-1">
                {liquidity.current_ratio > 1.5 ? 'Excellent' : 
                 liquidity.current_ratio > 1 ? 'Good' : 'Needs Attention'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {liquidity.quick_ratio ? liquidity.quick_ratio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-green-700 font-medium">Quick Ratio</div>
              <div className="text-xs text-green-600 mt-1">
                {liquidity.quick_ratio > 1 ? 'Strong' : 'Weak'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {liquidity.cash_ratio ? liquidity.cash_ratio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-purple-700 font-medium">Cash Ratio</div>
              <div className="text-xs text-purple-600 mt-1">
                {liquidity.cash_ratio > 0.5 ? 'Strong' : 'Low'}
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Working Capital</h4>
              <div className="text-2xl font-bold text-gray-800">
                ${liquidity.working_capital ? liquidity.working_capital.toLocaleString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Current Assets - Current Liabilities</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Working Capital Ratio</h4>
              <div className="text-2xl font-bold text-gray-800">
                {liquidity.working_capital_ratio ? `${(liquidity.working_capital_ratio * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Working Capital / Current Assets</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEfficiencyKPIs = () => {
    if (!financialKPIs?.efficiency_ratios) return <div className="text-center text-gray-500 py-8">No efficiency data available</div>;
    
    const efficiency = financialKPIs.efficiency_ratios;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Efficiency Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <h4 className="font-semibold text-orange-700 mb-2">Asset Turnover Ratio</h4>
              <div className="text-3xl font-bold text-orange-600">
                {efficiency.asset_turnover_ratio ? efficiency.asset_turnover_ratio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-orange-600">Revenue / Total Assets</div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
              <h4 className="font-semibold text-teal-700 mb-2">Inventory Turnover</h4>
              <div className="text-3xl font-bold text-teal-600">
                {efficiency.inventory_turnover_ratio ? efficiency.inventory_turnover_ratio.toFixed(2) : 'N/A'}
              </div>
              <div className="text-sm text-teal-600">COGS / Average Inventory</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Revenue per Asset</h4>
              <div className="text-2xl font-bold text-gray-800">
                ${efficiency.revenue_per_asset ? efficiency.revenue_per_asset.toLocaleString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Revenue generated per dollar of assets</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Asset Utilization</h4>
              <div className="text-2xl font-bold text-gray-800">
                {efficiency.asset_utilization ? `${efficiency.asset_utilization.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Percentage of assets generating revenue</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthKPIs = () => {
    if (!financialKPIs?.growth_metrics) return <div className="text-center text-gray-500 py-8">No growth data available</div>;
    
    const growth = financialKPIs.growth_metrics;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Growth Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {growth.cagr ? `${growth.cagr.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-blue-700 font-medium">CAGR</div>
              <div className="text-xs text-blue-600 mt-1">Compound Annual Growth Rate</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {growth.yoy_growth ? `${growth.yoy_growth.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-green-700 font-medium">YoY Growth</div>
              <div className="text-xs text-green-600 mt-1">Year-over-Year</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {growth.mom_growth ? `${growth.mom_growth.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-purple-700 font-medium">MoM Growth</div>
              <div className="text-xs text-purple-600 mt-1">Month-over-Month</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Growth Acceleration</h4>
              <div className="text-2xl font-bold text-gray-800">
                {growth.growth_acceleration ? `${growth.growth_acceleration.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">MoM - YoY Growth Difference</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Growth Consistency</h4>
              <div className="text-2xl font-bold text-gray-800">
                {growth.growth_consistency ? `${growth.growth_consistency.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Coefficient of Variation</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRiskAndCashKPIs = () => {
    const riskMetrics = financialKPIs?.risk_metrics;
    const cashFlowMetrics = Object.entries(financialKPIs || {}).filter(([key]) => key.startsWith('cash_flow_'));
    
    return (
      <div className="space-y-6">
        {/* Risk Metrics */}
        {riskMetrics && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {riskMetrics.revenue_volatility ? riskMetrics.revenue_volatility.toFixed(2) : 'N/A'}
                </div>
                <div className="text-sm text-red-700 font-medium">Revenue Volatility</div>
                <div className="text-xs text-red-600 mt-1">Standard Deviation</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {riskMetrics.coefficient_of_variation ? `${riskMetrics.coefficient_of_variation.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-orange-700 font-medium">Coefficient of Variation</div>
                <div className="text-xs text-orange-600 mt-1">Risk Measure</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {riskMetrics.max_drawdown ? `${riskMetrics.max_drawdown.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-yellow-700 font-medium">Max Drawdown</div>
                <div className="text-xs text-yellow-600 mt-1">Peak to Trough</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Risk Score:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  riskMetrics.risk_score === 'high' ? 'bg-red-100 text-red-700' :
                  riskMetrics.risk_score === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {riskMetrics.risk_score || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Cash Flow Metrics */}
        {cashFlowMetrics.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow Analysis</h3>
            
            {cashFlowMetrics.map(([key, data], index) => (
              <div key={key} className="mb-6 last:mb-0">
                <h4 className="font-semibold text-gray-700 mb-3">{key.replace('cash_flow_', '').replace('_', ' ').toUpperCase()}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      ${data.current_balance ? data.current_balance.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-xs text-green-600">Current Balance</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      ${data.cash_burn_rate ? data.cash_burn_rate.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600">Burn Rate</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {data.runway_months ? `${data.runway_months.toFixed(1)} months` : 'N/A'}
                    </div>
                    <div className="text-xs text-purple-600">Runway</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {data.cash_flow_consistency ? `${data.cash_flow_consistency.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-orange-600">Consistency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBusinessHealth = () => {
    if (!financialKPIs?.business_health) return <div className="text-center text-gray-500 py-8">No business health data available</div>;
    
    const health = financialKPIs.business_health;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Health Assessment</h3>
          
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${
              health.overall_score >= 80 ? 'bg-green-100 text-green-600' :
              health.overall_score >= 60 ? 'bg-yellow-100 text-yellow-600' :
              health.overall_score >= 40 ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {health.overall_score}/100
            </div>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                health.health_status === 'excellent' ? 'bg-green-100 text-green-700' :
                health.health_status === 'good' ? 'bg-yellow-100 text-yellow-700' :
                health.health_status === 'fair' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {health.health_status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Health Factors</h4>
              <div className="space-y-2">
                {health.health_factors?.map((factor, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      factor.includes('positive') ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">
                      {factor.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Recommendations</h4>
              <div className="space-y-2">
                {health.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderKPIContent = () => {
    switch (activeKPITab) {
      case 'overview':
        return renderOverviewKPIs();
      case 'profitability':
        return renderProfitabilityKPIs();
      case 'liquidity':
        return renderLiquidityKPIs();
      case 'efficiency':
        return renderEfficiencyKPIs();
      case 'growth':
        return renderGrowthKPIs();
      case 'risk':
        return renderRiskAndCashKPIs();
      case 'health':
        return renderBusinessHealth();
      default:
        return renderOverviewKPIs();
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex space-x-2 overflow-x-auto">
          {kpiTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveKPITab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                activeKPITab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* KPI Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeKPITab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {renderKPIContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const EnhancedDashboard = ({ analysisResults, onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedKPI, setSelectedKPI] = useState(null);

  // Extract data from analysis results
  const financialKPIs = analysisResults?.financial_kpis || {};
  const mlPrompts = analysisResults?.ml_prompts || [];
  const enhancedProfiling = analysisResults?.enhanced_profiling || {};
  const intelligentAnalysis = analysisResults?.intelligent_analysis || {};

  // Check for error status
  const hasError = analysisResults?.status === 'error';
  const errorMessage = analysisResults?.error;

  // Error display
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-200" />
          <h1 className="text-2xl font-bold mb-2">Analysis Error</h1>
          <p className="text-red-200 mb-4">{errorMessage || 'An error occurred during analysis'}</p>
          <button
            onClick={onBackToLanding}
            className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to Landing
          </button>
        </div>
      </div>
    );
  }

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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'kpis', label: 'Financial KPIs', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'insights', label: 'AI Insights', icon: <Lightbulb className="w-4 h-4" /> },
            { id: 'context', label: 'Market Context', icon: <Globe className="w-4 h-4" /> },
            { id: 'narrative', label: 'AI Narrative', icon: <FileText className="w-4 h-4" /> },
            { id: 'profiling', label: 'Data Profiling', icon: <Database className="w-4 h-4" /> },
            { id: 'intelligent', label: 'Intelligent Analysis', icon: <Brain className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="space-y-8">
        {/* Overview Tab */}
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
              {analysisResults?.financial_kpis ? (
                // Extract key KPIs from real data for overview
                (() => {
                  const kpis = analysisResults.financial_kpis;
                  const overviewKPIs = [];
                  
                  // Revenue Growth (QoQ)
                  if (kpis.growth_metrics?.yoy_growth !== null && kpis.growth_metrics?.yoy_growth !== undefined) {
                    overviewKPIs.push({
                      title: 'Revenue Growth',
                      value: `${kpis.growth_metrics.yoy_growth > 0 ? '+' : ''}${kpis.growth_metrics.yoy_growth?.toFixed(1)}%`,
                      change: `${kpis.growth_metrics.yoy_growth > 0 ? '+' : ''}${kpis.growth_metrics.yoy_growth?.toFixed(1)}%`,
                      trend: kpis.growth_metrics.yoy_growth > 0 ? 'up' : 'down',
                      icon: <TrendingUp />,
                      color: kpis.growth_metrics.yoy_growth > 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
                      subtitle: 'QoQ growth'
                    });
                  }
                  
                  // Cash Burn Rate
                  const cashFlowKeys = Object.keys(kpis).filter(key => key.startsWith('cash_flow_'));
                  if (cashFlowKeys.length > 0) {
                    const cashFlow = kpis[cashFlowKeys[0]];
                    if (cashFlow?.cash_burn_rate !== null && cashFlow?.cash_burn_rate !== undefined) {
                      overviewKPIs.push({
                        title: 'Cash Burn Rate',
                        value: `$${Math.abs(cashFlow.cash_burn_rate).toLocaleString()}`,
                        change: `${cashFlow.cash_burn_rate > 0 ? '+' : '-'}${Math.abs(cashFlow.cash_burn_rate).toFixed(0)}%`,
                        trend: cashFlow.cash_burn_rate < 0 ? 'down' : 'up',
                        icon: <TrendingDown />,
                        color: cashFlow.cash_burn_rate < 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
                        subtitle: 'Monthly average'
                      });
                    }
                  }
                  
                  // Working Capital
                  const liquidityKeys = Object.keys(kpis).filter(key => key.startsWith('liquidity_'));
                  if (liquidityKeys.length > 0) {
                    const liquidity = kpis[liquidityKeys[0]];
                    if (liquidity?.current_ratio !== null && liquidity?.current_ratio !== undefined) {
                      overviewKPIs.push({
                        title: 'Working Capital',
                        value: `${liquidity.current_ratio.toFixed(1)}x`,
                        change: `${liquidity.current_ratio > 2 ? '+' : ''}${((liquidity.current_ratio - 2) * 100).toFixed(0)}%`,
                        trend: liquidity.current_ratio > 2 ? 'up' : 'down',
                        icon: <DollarSign />,
                        color: liquidity.current_ratio > 2 ? 'from-blue-500 to-blue-600' : 'from-yellow-500 to-yellow-600',
                        subtitle: `Current ratio: ${liquidity.current_ratio.toFixed(1)}`
                      });
                    }
                  }
                  
                  // Runway Months
                  if (cashFlowKeys.length > 0) {
                    const cashFlow = kpis[cashFlowKeys[0]];
                    if (cashFlow?.runway_months !== null && cashFlow?.runway_months !== undefined) {
                      overviewKPIs.push({
                        title: 'Runway Months',
                        value: `${cashFlow.runway_months.toFixed(0)}`,
                        change: `${cashFlow.runway_months > 12 ? '+' : ''}${(cashFlow.runway_months - 12).toFixed(0)}`,
                        trend: cashFlow.runway_months > 12 ? 'up' : 'down',
                        icon: <Calendar />,
                        color: cashFlow.runway_months > 12 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600',
                        subtitle: 'Cash runway'
                      });
                    }
                  }
                  
                  // If we don't have enough real KPIs, fill with fallback
                  while (overviewKPIs.length < 4) {
                    overviewKPIs.push({
                      title: 'Data Analysis',
                      value: 'Active',
                      change: '+100%',
                      trend: 'up',
                      icon: <Activity />,
                      color: 'from-green-500 to-green-600',
                      subtitle: 'Analysis complete'
                    });
                  }
                  
                  return overviewKPIs.slice(0, 4).map((kpi, index) => (
                    <FinancialKPICard
                      key={index}
                      title={kpi.title}
                      value={kpi.value}
                      change={kpi.change}
                      trend={kpi.trend}
                      icon={kpi.icon}
                      color={kpi.color}
                      subtitle={kpi.subtitle}
                    />
                  ));
                })()
              ) : (
                // Fallback to domain config if no real data
                domainConfig.kpis.map((kpi, index) => (
                  <FinancialKPICard
                    key={index}
                    title={kpi.title}
                    value={kpi.value}
                    change={kpi.change}
                    trend={kpi.trend}
                    icon={kpi.icon}
                    color={kpi.color}
                    subtitle={kpi.subtitle}
                  />
                ))
              )}
            </div>

            {/* ML Prompts Section */}
            {analysisResults?.ml_prompts?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  ML Analysis Prompts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.ml_prompts.map((prompt, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">{prompt.category}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          prompt.priority === 'high' ? 'bg-red-100 text-red-700' :
                          prompt.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {prompt.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{prompt.prompt}</p>
                      {prompt.context && (
                        <p className="text-xs text-gray-500 italic">{prompt.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Insights Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Insights Generated</h3>
                    <p className="text-sm text-gray-600">AI-powered analysis</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{getInsightCount()}</div>
                <div className="text-sm text-gray-600">Key insights identified</div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Confidence Score</h3>
                    <p className="text-sm text-gray-600">Analysis accuracy</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{getAverageConfidence()}%</div>
                <div className="text-sm text-gray-600">High confidence insights</div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Impact Distribution</h3>
                    <p className="text-sm text-gray-600">Insight significance</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(getImpactDistribution()).map(([impact, count]) => (
                    <div key={impact} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{impact}</span>
                      <span className="text-sm font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Financial KPIs Tab */}
        {activeTab === 'kpis' && (
          <motion.div
            key="kpis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.financial_kpis ? (
              <ComprehensiveKPIDashboard financialKPIs={analysisResults.financial_kpis} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Financial KPIs Available</h3>
                <p className="text-gray-600">Complete an analysis to view financial performance metrics</p>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analysisResults?.key_insights?.map((insight, index) => (
                <InsightCard key={index} insight={insight} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Market Context Tab */}
        {activeTab === 'context' && (
          <motion.div
            key="context"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisResults?.external_context?.map((context, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{context.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{context.source}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        context.confidence > 0.8 ? 'bg-green-500' :
                        context.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{context.insight}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{context.impact_description}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      context.impact === 'high' ? 'bg-red-100 text-red-700' :
                      context.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {context.impact} impact
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Market Summary */}
            {analysisResults?.external_context?.length > 0 && (
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {analysisResults.external_context.length}
                    </div>
                    <div className="text-sm text-gray-600">Market Factors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Math.round(analysisResults.external_context.reduce((sum, ctx) => sum + (ctx.confidence || 0), 0) / analysisResults.external_context.length * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Average Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {analysisResults.external_context.filter(ctx => ctx.impact === 'high').length}
                    </div>
                    <div className="text-sm text-gray-600">High Impact Factors</div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* AI Narrative Tab */}
        {activeTab === 'narrative' && (
          <motion.div
            key="narrative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="prose prose-lg max-w-none">
                {analysisResults?.llama3_narrative ? (
                  <div dangerouslySetInnerHTML={{ 
                    __html: analysisResults.llama3_narrative
                      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-800 mb-4">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-800 mb-3 mt-6">$1</h2>')
                      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-700 mb-2 mt-4">$1</h3>')
                      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-medium text-gray-700 mb-2 mt-3">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
                      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
                      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
                      .replace(/---/g, '<hr class="my-6 border-gray-300">')
                      .replace(/\n\n/g, '</p><p class="mb-4">')
                      .replace(/^(?!<[h|p|l|h])(.*$)/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1')
                  }} />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Narrative Available</h3>
                    <p className="text-gray-600">Complete an analysis to view the AI-generated narrative</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Data Profiling Tab */}
        {activeTab === 'profiling' && (
          <motion.div
            key="profiling"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.enhanced_profiling ? (
              <DataProfilingDashboard 
                profilingData={analysisResults.enhanced_profiling}
                intelligentAnalysis={analysisResults.intelligent_analysis}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Profiling Available</h3>
                <p className="text-gray-600">Complete an analysis to view detailed data profiling results</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Intelligent Analysis Tab */}
        {activeTab === 'intelligent' && (
          <motion.div
            key="intelligent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {analysisResults?.intelligent_analysis ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                {analysisResults.intelligent_analysis.executive_summary && (
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Executive Summary
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700">{analysisResults.intelligent_analysis.executive_summary.summary}</p>
                      {analysisResults.intelligent_analysis.executive_summary.key_points && (
                        <ul className="mt-4 space-y-2">
                          {analysisResults.intelligent_analysis.executive_summary.key_points.map((point, index) => (
                            <li key={index} className="text-gray-700">{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Business Intelligence */}
                {analysisResults.intelligent_analysis.business_intelligence && (
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Business Intelligence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisResults.intelligent_analysis.business_intelligence.strategic_recommendations?.map((rec, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Predictive Insights */}
                {analysisResults.intelligent_analysis.predictive_insights && (
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-600" />
                      Predictive Insights
                    </h3>
                    <div className="space-y-4">
                      {analysisResults.intelligent_analysis.predictive_insights.forecasts?.map((forecast, index) => (
                        <div key={index} className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                          <h4 className="font-medium text-purple-800 mb-2">{forecast.metric}</h4>
                          <p className="text-purple-700">{forecast.prediction}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-purple-600">Confidence:</span>
                            <span className="text-xs font-medium text-purple-800">{forecast.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actionable Recommendations */}
                {analysisResults.intelligent_analysis.actionable_recommendations && (
                  <motion.div
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Actionable Recommendations
                    </h3>
                    <div className="space-y-4">
                      {analysisResults.intelligent_analysis.actionable_recommendations.immediate_actions?.map((action, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                          <p className="text-green-800">{action}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Intelligent Analysis Available</h3>
                <p className="text-gray-600">Complete an analysis to view intelligent analysis results</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard; 
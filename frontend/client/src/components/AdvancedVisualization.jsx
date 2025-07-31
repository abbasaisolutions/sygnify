import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, ComposedChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedVisualization = ({ analysisData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [revenueScenario, setRevenueScenario] = useState(100);
  const [netProfitScenario, setNetProfitScenario] = useState(100);
  const [netMarginScenario, setNetMarginScenario] = useState(100);
  const [ebitdaScenario, setEbitdaScenario] = useState(100);

  // Compute chart data at top-level for use in visuals tab
  const fraudData = analysisData.enhancedML?.anomalies || [];
  const fraudByCategory = {};
  const fraudByState = {};
  const fraudByAmount = { low: 0, medium: 0, high: 0 };
  fraudData.forEach(anomaly => {
    if (anomaly.context?.category) {
      fraudByCategory[anomaly.context.category] = (fraudByCategory[anomaly.context.category] || 0) + 1;
    }
    if (anomaly.context?.state) {
      fraudByState[anomaly.context.state] = (fraudByState[anomaly.context.state] || 0) + 1;
    }
    const amount = parseFloat(anomaly.context?.amount || 0);
    if (amount < 100) fraudByAmount.low++;
    else if (amount < 1000) fraudByAmount.medium++;
    else fraudByAmount.high++;
  });
  const categoryData = Object.entries(fraudByCategory).map(([category, count]) => ({ name: category, value: count }));
  const stateData = Object.entries(fraudByState).map(([state, count]) => ({ name: state, value: count }));
  const amountData = Object.entries(fraudByAmount).map(([range, count]) => ({ name: range.charAt(0).toUpperCase() + range.slice(1), value: count }));
  const correlations = analysisData.enhancedML?.correlations || [];
  const correlationData = correlations.map(corr => ({
    name: `${corr.column1} vs ${corr.column2}`,
    correlation: corr.correlation,
    strength: corr.strength,
    direction: corr.direction
  }));
  const temporalData = analysisData.enhancedML?.trends || [];

  if (!analysisData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Advanced Analytics Dashboard</h3>
          <p>Upload data to see interactive visualizations and insights</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Key Metrics Cards */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Total Records</h3>
        <div className="text-3xl font-bold">
          {analysisData.dataProcessing?.metadata?.totalRows?.toLocaleString() || 'N/A'}
        </div>
        <p className="text-blue-100 text-sm mt-2">Analyzed records</p>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Data Quality</h3>
        <div className="text-3xl font-bold">
          {Math.round((analysisData.dataProcessing?.quality?.score || 0) * 100)}%
        </div>
        <p className="text-green-100 text-sm mt-2">Overall quality score</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Anomalies Detected</h3>
        <div className="text-3xl font-bold">
          {analysisData.enhancedML?.anomalies?.length || 0}
        </div>
        <p className="text-purple-100 text-sm mt-2">Suspicious patterns</p>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Fraud Risk</h3>
        <div className="text-3xl font-bold">
          {analysisData.enhancedML?.risks?.length || 0}
        </div>
        <p className="text-red-100 text-sm mt-2">Risk factors identified</p>
      </div>

      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Patterns Found</h3>
        <div className="text-3xl font-bold">
          {analysisData.enhancedML?.patterns?.length || 0}
        </div>
        <p className="text-yellow-100 text-sm mt-2">ML patterns detected</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Correlations</h3>
        <div className="text-3xl font-bold">
          {analysisData.enhancedML?.correlations?.length || 0}
        </div>
        <p className="text-indigo-100 text-sm mt-2">Significant relationships</p>
      </div>
    </div>
  );

  const renderFraudAnalysis = () => {
    const fraudData = analysisData.enhancedML?.anomalies || [];
    const fraudByCategory = {};
    const fraudByState = {};
    const fraudByAmount = { low: 0, medium: 0, high: 0 };

    fraudData.forEach(anomaly => {
      if (anomaly.context?.category) {
        fraudByCategory[anomaly.context.category] = (fraudByCategory[anomaly.context.category] || 0) + 1;
      }
      if (anomaly.context?.state) {
        fraudByState[anomaly.context.state] = (fraudByState[anomaly.context.state] || 0) + 1;
      }
      
      const amount = parseFloat(anomaly.context?.amount || 0);
      if (amount < 100) fraudByAmount.low++;
      else if (amount < 1000) fraudByAmount.medium++;
      else fraudByAmount.high++;
    });

    const categoryData = Object.entries(fraudByCategory).map(([category, count]) => ({
      name: category,
      value: count
    }));

    const stateData = Object.entries(fraudByState).map(([state, count]) => ({
      name: state,
      value: count
    }));

    const amountData = Object.entries(fraudByAmount).map(([range, count]) => ({
      name: range.charAt(0).toUpperCase() + range.slice(1),
      value: count
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fraud by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Fraud by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Fraud by State */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Fraud by State</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fraud by Amount Range */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Fraud by Amount Range</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={amountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Severity Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Fraud Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={fraudData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Anomaly Score" />
              <Line yAxisId="right" type="monotone" dataKey="severity" stroke="#ff7300" name="Severity" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAnomalyDetails = () => {
    const anomalies = analysisData.enhancedML?.anomalies || [];
    
    if (anomalies.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No Anomalies Detected</h3>
          <p>Your data appears to be clean with no significant anomalies</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Anomaly Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Anomaly Detection Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{anomalies.length}</div>
              <div className="text-sm text-gray-600">Total Anomalies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {anomalies.filter(a => a.severity === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Severity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {anomalies.filter(a => a.severity === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Severity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {anomalies.filter(a => a.severity === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Severity</div>
            </div>
          </div>
        </div>

        {/* Anomaly List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Anomaly Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anomalies.slice(0, 20).map((anomaly, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {anomaly.index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {anomaly.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {anomaly.score?.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {anomaly.context?.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(anomaly.context?.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedAnomaly(anomaly)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anomaly Detail Modal */}
        {selectedAnomaly && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold mb-4">Anomaly Details</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Index:</strong> {selectedAnomaly.index}
                  </div>
                  <div>
                    <strong>Method:</strong> {selectedAnomaly.method}
                  </div>
                  <div>
                    <strong>Severity:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedAnomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                      selectedAnomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedAnomaly.severity}
                    </span>
                  </div>
                  <div>
                    <strong>Score:</strong> {selectedAnomaly.score?.toFixed(3)}
                  </div>
                  {selectedAnomaly.context && (
                    <div>
                      <strong>Context:</strong>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedAnomaly.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setSelectedAnomaly(null)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCorrelationAnalysis = () => {
    const correlations = analysisData.enhancedML?.correlations || [];
    
    if (correlations.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold mb-2">No Correlations Found</h3>
          <p>No significant correlations were detected in your data</p>
        </div>
      );
    }

    const correlationData = correlations.map(corr => ({
      name: `${corr.column1} vs ${corr.column2}`,
      correlation: corr.correlation,
      strength: corr.strength,
      direction: corr.direction
    }));

    return (
      <div className="space-y-6">
        {/* Correlation Strength Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Correlation Strength Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="correlation" 
                fill={(entry) => {
                  const value = Math.abs(entry.correlation);
                  return value > 0.7 ? '#ef4444' : value > 0.5 ? '#f59e0b' : '#10b981';
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Correlation Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variables
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correlation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strength
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Significance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {correlations.map((corr, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {corr.column1} ↔ {corr.column2}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {corr.correlation.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        corr.strength === 'strong' ? 'bg-red-100 text-red-800' :
                        corr.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {corr.strength}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {corr.direction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        corr.significance === 'high' ? 'bg-red-100 text-red-800' :
                        corr.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {corr.significance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTemporalAnalysis = () => {
    const temporalData = analysisData.enhancedML?.trends || [];
    
    if (temporalData.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">No Temporal Data</h3>
          <p>No temporal patterns were detected in your data</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Temporal Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Temporal Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={temporalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {temporalData.map((trend, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{trend.type}</h4>
                <p className="text-sm text-gray-600">{trend.description}</p>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    trend.direction === 'increasing' ? 'bg-green-100 text-green-800' :
                    trend.direction === 'decreasing' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trend.direction}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* 0. Hero Section with gradient, logos, tagline, and glassmorphic AI Narrative card */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#004c97] via-[#007a33] to-[#f0f0f0] opacity-80 rounded-2xl z-0" style={{filter: 'blur(2px)'}}></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl shadow-xl">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img src="/sygnify-logo.png" alt="Sygnify Logo" className="h-12" />
              <span className="text-3xl font-extrabold text-white tracking-tight" style={{fontFamily: 'Inter, Roboto, system-ui'}}>Sygnify Analytics Hub</span>
            </div>
            <div className="flex flex-col items-end">
              <a href="https://www.abbasaisolutions.com" target="_blank" rel="noopener noreferrer">
                <img src="/abbasai-logo.png" alt="AbbasAi Solutions Logo" className="h-8 mb-2" />
              </a>
              <span className="text-white text-sm font-light">AI-Powered Financial Intelligence for Business Leaders</span>
            </div>
          </div>
          {/* Glassmorphic AI Narrative Card */}
          {analysisData.llama3_narrative && (
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-[-40px] w-full max-w-3xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-[#004c97] z-20 animate-fade-in">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-[#007a33] animate-pulse mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <h2 className="text-2xl font-bold text-[#004c97]">AI Narrative</h2>
              </div>
              <p className="text-lg text-[#222] leading-relaxed whitespace-pre-line text-center mb-4" style={{fontFamily: 'Inter, Roboto, system-ui'}}>{analysisData.llama3_narrative}</p>
              <div className="flex space-x-4">
                <button onClick={() => {navigator.clipboard.writeText(analysisData.llama3_narrative)}} className="px-4 py-2 bg-[#007a33] text-white rounded-lg shadow hover:bg-[#004c97] transition">Copy</button>
                <button onClick={() => {const blob = new Blob([analysisData.llama3_narrative], {type: 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'ai-narrative.txt'; a.click(); URL.revokeObjectURL(url);}} className="px-4 py-2 bg-[#ff000f] text-white rounded-lg shadow hover:bg-[#007a33] transition">Download</button>
              </div>
            </div>
          )}
        </div>
        {/* Market Context Section */}
        {analysisData.external_context && analysisData.external_context.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-100 to-yellow-50 rounded shadow">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-orange-800">Market Context & Trends</h3>
              <div className="space-x-2">
                <a href="http://localhost:8000/financial/sweetviz-report" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition">Download Sweetviz Report</a>
                <button onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisData, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute("href", dataStr);
                  dlAnchor.setAttribute("download", "insights.json");
                  document.body.appendChild(dlAnchor);
                  dlAnchor.click();
                  dlAnchor.remove();
                }} className="inline-block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Download Insights (JSON)</button>
              </div>
            </div>
            <ul className="mt-2 space-y-2">
              {analysisData.external_context.map((ctx, idx) => (
                <li key={idx} className="mb-2 text-orange-900">
                  <strong>{ctx.title ? ctx.title + ': ' : ''}</strong>{ctx.insight}
                </li>
              ))}
            </ul>
            {/* Market Trend Chart Example */}
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analysisData.market_trend_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sp500" stroke="#8884d8" name="S&P 500" />
                  <Line type="monotone" dataKey="sector" stroke="#82ca9d" name="Sector ETF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {analysisData.executive_summary && (
          <div className="mb-4 p-4 bg-blue-50 rounded">
            <h3 className="font-bold">Executive Summary</h3>
            <p>{analysisData.executive_summary}</p>
          </div>
        )}
        {analysisData.key_insights && analysisData.key_insights.length > 0 && (
          <div className="mb-4 p-4 bg-purple-50 rounded">
            <h3 className="font-bold">Key Insights</h3>
            <ul>
              {analysisData.key_insights.map((insight, idx) => (
                <li key={idx}>{insight.insight || JSON.stringify(insight)}</li>
              ))}
            </ul>
          </div>
        )}
        {analysisData.trend_analysis && analysisData.trend_analysis.length > 0 && (
          <div className="mb-4 p-4 bg-indigo-50 rounded">
            <h3 className="font-bold">Trend Analysis</h3>
            <ul>
              {analysisData.trend_analysis.map((trend, idx) => (
                <li key={idx}>{trend.trend || JSON.stringify(trend)}</li>
              ))}
            </ul>
          </div>
        )}
        {analysisData.actionable_recommendations && analysisData.actionable_recommendations.length > 0 && (
          <div className="mb-4 p-4 bg-green-50 rounded">
            <h3 className="font-bold">Recommendations</h3>
            <ul>
              {analysisData.actionable_recommendations.map((rec, idx) => (
                <li key={idx}>{rec.recommendation || JSON.stringify(rec)}</li>
              ))}
            </ul>
          </div>
        )}
        {analysisData.risk_assessment && analysisData.risk_assessment.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 rounded">
            <h3 className="font-bold">Risk Assessment</h3>
            <ul>
              {analysisData.risk_assessment.map((risk, idx) => (
                <li key={idx}>{risk.risk || JSON.stringify(risk)}</li>
              ))}
            </ul>
          </div>
        )}
        {analysisData.opportunity_identification && analysisData.opportunity_identification.length > 0 && (
          <div className="mb-4 p-4 bg-pink-50 rounded">
            <h3 className="font-bold">Opportunities</h3>
            <ul>
              {analysisData.opportunity_identification.map((opp, idx) => (
                <li key={idx}>{opp.opportunity || JSON.stringify(opp)}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Financial Health Score Card */}
        {analysisData.financial_health_score && (
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Financial Health Score</h3>
            <div className="text-3xl font-bold">{analysisData.financial_health_score.score}</div>
            <ul className="mt-2 text-teal-100 text-sm list-disc list-inside">
              {analysisData.financial_health_score.components?.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {/* 1. Finance-specific KPI cards (Revenue, Net Profit, Net Margin, EBITDA, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white border-l-4 border-[#004c97] rounded-lg shadow p-6 flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Revenue</span>
            <span className="text-2xl font-bold text-[#004c97]">${analysisData.kpi?.revenue?.toLocaleString() || 'N/A'}</span>
            <span className="text-xs text-gray-400 mt-1">YTD</span>
          </div>
          {/* Net Profit */}
          <div className="bg-white border-l-4 border-[#007a33] rounded-lg shadow p-6 flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Net Profit</span>
            <span className="text-2xl font-bold text-[#007a33]">${analysisData.kpi?.net_profit?.toLocaleString() || 'N/A'}</span>
            <span className="text-xs text-gray-400 mt-1">YTD</span>
          </div>
          {/* Net Margin */}
          <div className="bg-white border-l-4 border-[#ff000f] rounded-lg shadow p-6 flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Net Margin</span>
            <span className="text-2xl font-bold text-[#ff000f]">{analysisData.kpi?.net_margin != null ? `${(analysisData.kpi.net_margin * 100).toFixed(1)}%` : 'N/A'}</span>
            <span className="text-xs text-gray-400 mt-1">YTD</span>
          </div>
          {/* EBITDA */}
          <div className="bg-white border-l-4 border-[#a9a9a9] rounded-lg shadow p-6 flex flex-col">
            <span className="text-sm text-gray-500 mb-1">EBITDA</span>
            <span className="text-2xl font-bold text-[#a9a9a9]">${analysisData.kpi?.ebitda?.toLocaleString() || 'N/A'}</span>
            <span className="text-xs text-gray-400 mt-1">YTD</span>
          </div>
        </div>
        {/* KPI Area/Bar/Line Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analysisData.kpi_trends?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Net Margin Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analysisData.kpi_trends?.net_margin || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#00C49F" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Correlation Explanations */}
        {analysisData.key_insights && analysisData.key_insights.filter(i => i.category === 'Correlation').length > 0 && (
          <div className="mb-4 p-4 bg-indigo-50 rounded">
            <h3 className="font-bold">Correlation Insights</h3>
            <ul>
              {analysisData.key_insights.filter(i => i.category === 'Correlation').map((insight, idx) => (
                <li key={idx}>{insight.insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 flex space-x-8 px-6 py-2 mb-6 rounded-t-2xl shadow">
              {[
                { id: 'hero', name: 'Executive', icon: '🧠' },
                { id: 'kpis', name: 'KPIs', icon: '📊' },
                { id: 'insights', name: 'Insights', icon: '💡' },
                { id: 'recommendations', name: 'Recommendations', icon: '✅' },
                { id: 'visuals', name: 'Visual Analytics', icon: '📈' },
                { id: 'scenario', name: 'Simulate', icon: '🔀' },
                { id: 'risks', name: 'Risks', icon: '⚠️' },
                { id: 'opportunities', name: 'Opportunities', icon: '🚀' },
                { id: 'anomalies', name: 'Anomalies', icon: '🔍' },
                { id: 'market', name: 'Market', icon: '🌐' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 rounded-lg font-medium flex items-center space-x-2 ${activeTab === tab.id ? 'bg-[#004c97] text-white' : 'text-[#004c97] hover:bg-[#f0f0f0]'}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'hero' && (
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-[#004c97] via-[#007a33] to-[#f0f0f0] opacity-80 rounded-2xl z-0" style={{filter: 'blur(2px)'}}></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <img src="/sygnify-logo.png" alt="Sygnify Logo" className="h-12" />
                  <span className="text-3xl font-extrabold text-white tracking-tight" style={{fontFamily: 'Inter, Roboto, system-ui'}}>Sygnify Analytics Hub</span>
                </div>
                <div className="flex flex-col items-end">
                  <a href="https://www.abbasaisolutions.com" target="_blank" rel="noopener noreferrer">
                    <img src="/abbasai-logo.png" alt="AbbasAi Solutions Logo" className="h-8 mb-2" />
                  </a>
                  <span className="text-white text-sm font-light">AI-Powered Financial Intelligence for Business Leaders</span>
                </div>
              </div>
              {/* Glassmorphic AI Narrative Card */}
              {analysisData.llama3_narrative && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-[-40px] w-full max-w-3xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-[#004c97] z-20 animate-fade-in">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-[#007a33] animate-pulse mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                    <h2 className="text-2xl font-bold text-[#004c97]">AI Narrative</h2>
                  </div>
                  <p className="text-lg text-[#222] leading-relaxed whitespace-pre-line text-center mb-4" style={{fontFamily: 'Inter, Roboto, system-ui'}}>{analysisData.llama3_narrative}</p>
                  <div className="flex space-x-4">
                    <button onClick={() => {navigator.clipboard.writeText(analysisData.llama3_narrative)}} className="px-4 py-2 bg-[#007a33] text-white rounded-lg shadow hover:bg-[#004c97] transition">Copy</button>
                    <button onClick={() => {const blob = new Blob([analysisData.llama3_narrative], {type: 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'ai-narrative.txt'; a.click(); URL.revokeObjectURL(url);}} className="px-4 py-2 bg-[#ff000f] text-white rounded-lg shadow hover:bg-[#007a33] transition">Download</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'kpis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Revenue */}
              <div className="bg-white border-l-4 border-[#004c97] rounded-lg shadow p-6 flex flex-col">
                <span className="text-sm text-gray-500 mb-1">Revenue</span>
                <span className="text-2xl font-bold text-[#004c97]">${analysisData.kpi?.revenue?.toLocaleString() || 'N/A'}</span>
                <span className="text-xs text-gray-400 mt-1">YTD</span>
              </div>
              {/* Net Profit */}
              <div className="bg-white border-l-4 border-[#007a33] rounded-lg shadow p-6 flex flex-col">
                <span className="text-sm text-gray-500 mb-1">Net Profit</span>
                <span className="text-2xl font-bold text-[#007a33]">${analysisData.kpi?.net_profit?.toLocaleString() || 'N/A'}</span>
                <span className="text-xs text-gray-400 mt-1">YTD</span>
              </div>
              {/* Net Margin */}
              <div className="bg-white border-l-4 border-[#ff000f] rounded-lg shadow p-6 flex flex-col">
                <span className="text-sm text-gray-500 mb-1">Net Margin</span>
                <span className="text-2xl font-bold text-[#ff000f]">{analysisData.kpi?.net_margin != null ? `${(analysisData.kpi.net_margin * 100).toFixed(1)}%` : 'N/A'}</span>
                <span className="text-xs text-gray-400 mt-1">YTD</span>
              </div>
              {/* EBITDA */}
              <div className="bg-white border-l-4 border-[#a9a9a9] rounded-lg shadow p-6 flex flex-col">
                <span className="text-sm text-gray-500 mb-1">EBITDA</span>
                <span className="text-2xl font-bold text-[#a9a9a9]">${analysisData.kpi?.ebitda?.toLocaleString() || 'N/A'}</span>
                <span className="text-xs text-gray-400 mt-1">YTD</span>
              </div>
            </div>
          )}
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Key Insights */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <ul className="space-y-2">
                  {analysisData.key_insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-indigo-600 text-lg mr-2">{insight.icon || '💡'}</span>
                      <span>{insight.insight || JSON.stringify(insight)}</span>
                      {insight.whats_new && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">What's New</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {analysisData.actionable_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 text-lg mr-2">{rec.icon || '✅'}</span>
                      <span>{rec.recommendation || JSON.stringify(rec)}</span>
                      {rec.whats_new && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">What's New</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Risk Assessment */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
                <ul className="space-y-2">
                  {analysisData.risk_assessment.map((risk, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-600 text-lg mr-2">{risk.icon || '⚠️'}</span>
                      <span>{risk.risk || JSON.stringify(risk)}</span>
                      {risk.whats_new && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">What's New</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Opportunities */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Opportunities</h3>
                <ul className="space-y-2">
                  {analysisData.opportunity_identification.map((opp, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-purple-600 text-lg mr-2">{opp.icon || '🚀'}</span>
                      <span>{opp.opportunity || JSON.stringify(opp)}</span>
                      {opp.whats_new && (
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">What's New</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'visuals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Revenue Trend */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analysisData.kpi_trends?.revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Net Margin Over Time */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Net Margin Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analysisData.kpi_trends?.net_margin || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#00C49F" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Fraud by Category */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Fraud by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Fraud by State */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Fraud by State</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Fraud by Amount Range */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Fraud by Amount Range</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={amountData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Fraud Severity Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Fraud Severity Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={fraudData.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Anomaly Score" />
                    <Line yAxisId="right" type="monotone" dataKey="severity" stroke="#ff7300" name="Severity" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {/* Correlation Strength Analysis */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Correlation Strength Analysis</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="correlation" 
                      fill={(entry) => {
                        const value = Math.abs(entry.correlation);
                        return value > 0.7 ? '#ef4444' : value > 0.5 ? '#f59e0b' : '#10b981';
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Correlation Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Correlation Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variables
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correlation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Strength
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Direction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Significance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {correlations.map((corr, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {corr.column1} ↔ {corr.column2}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {corr.correlation.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              corr.strength === 'strong' ? 'bg-red-100 text-red-800' :
                              corr.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {corr.strength}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {corr.direction}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              corr.significance === 'high' ? 'bg-red-100 text-red-800' :
                              corr.significance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {corr.significance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Temporal Trends */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Temporal Trends</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Trend Analysis */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {temporalData.map((trend, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{trend.type}</h4>
                      <p className="text-sm text-gray-600">{trend.description}</p>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trend.direction === 'increasing' ? 'bg-green-100 text-green-800' :
                          trend.direction === 'decreasing' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trend.direction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'scenario' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Scenario Simulation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Revenue Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Revenue Scenario</h4>
                  <p className="text-sm text-gray-600">Adjust revenue to see its impact on KPIs.</p>
                  <input type="range" min="0" max="100" value={revenueScenario} onChange={e => setRevenueScenario(Number(e.target.value))} className="w-full mt-4" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                {/* Net Profit Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Net Profit Scenario</h4>
                  <p className="text-sm text-gray-600">Simulate changes in net profit.</p>
                  <input type="range" min="0" max="100" value={netProfitScenario} onChange={e => setNetProfitScenario(Number(e.target.value))} className="w-full mt-4" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                {/* Net Margin Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Net Margin Scenario</h4>
                  <p className="text-sm text-gray-600">Adjust net margin to see its effect.</p>
                  <input type="range" min="0" max="100" value={netMarginScenario} onChange={e => setNetMarginScenario(Number(e.target.value))} className="w-full mt-4" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                {/* EBITDA Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">EBITDA Scenario</h4>
                  <p className="text-sm text-gray-600">Simulate changes in EBITDA.</p>
                  <input type="range" min="0" max="100" value={ebitdaScenario} onChange={e => setEbitdaScenario(Number(e.target.value))} className="w-full mt-4" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'anomalies' && renderAnomalyDetails()}
          {activeTab === 'correlations' && renderCorrelationAnalysis()}
          {activeTab === 'temporal' && renderTemporalAnalysis()}
        </div>
        {/* 2. Add more finance KPIs, ratios, and charts (Operating Cash Flow, Free Cash Flow, Current Ratio, Quick Ratio, ROA, ROE, Debt/Equity, Interest Coverage, Working Capital, Expense Breakdown, Top 5 Customers, Financial Health Score, Risk/Opportunity cards) */}
        {/* 3. Branding footer */}
        <footer className="mt-12 py-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-[#f0f0f0]">
          <div className="flex items-center space-x-2">
            <img src="/sygnify-logo.png" alt="Sygnify Logo" className="h-6" />
            <span className="text-sm text-gray-700">Sygnify is a product of</span>
            <a href="https://www.abbasaisolutions.com" target="_blank" rel="noopener noreferrer" className="text-[#004c97] font-semibold hover:underline">AbbasAi Solutions</a>
          </div>
          <div className="text-xs text-gray-400 mt-2 md:mt-0">&copy; {new Date().getFullYear()} AbbasAi Solutions. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default AdvancedVisualization; 
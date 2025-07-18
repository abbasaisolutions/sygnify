import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import axios from 'axios';

function AdvancedDashboard() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const chartRefs = useRef({});

  useEffect(() => {
    fetchAdvancedResults();
    const interval = setInterval(fetchAdvancedResults, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAdvancedResults = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/advanced-results', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.length > 0) {
        setAnalysisResults(response.data[0]); // Get latest result
        setIsLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analysisResults && analysisResults.visualizations) {
      renderVisualizations();
    }
  }, [analysisResults]);

  const renderVisualizations = () => {
    // Clear existing charts
    Object.values(chartRefs.current).forEach(canvas => {
      if (canvas && canvas.chart) {
        canvas.chart.destroy();
      }
    });

    const visualizations = analysisResults.visualizations;
    if (!visualizations.chart_configurations) return;

    Object.entries(visualizations.chart_configurations).forEach(([title, config]) => {
      const canvasId = `chart-${title.replace(/\s+/g, '-').toLowerCase()}`;
      const canvas = document.getElementById(canvasId);
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, config);
        chartRefs.current[canvasId] = { canvas, chart };
      }
    });
  };

  const renderInsightCard = (insight, index) => (
    <div 
      key={index}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        selectedInsight === index 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              insight.impact === 'high' ? 'bg-red-100 text-red-800' :
              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {insight.impact} impact
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {insight.confidence ? `${(insight.confidence * 100).toFixed(0)}% confidence` : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{insight.insight}</p>
          <div className="text-xs text-gray-500">
            Category: {insight.category}
          </div>
        </div>
        <div className="ml-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {selectedInsight === index && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {insight.metric && (
              <div>
                <span className="font-medium">Metric:</span> {insight.metric}
              </div>
            )}
            {insight.value && (
              <div>
                <span className="font-medium">Value:</span> {insight.value}
              </div>
            )}
            {insight.direction && (
              <div>
                <span className="font-medium">Direction:</span> {insight.direction}
              </div>
            )}
            {insight.strength && (
              <div>
                <span className="font-medium">Strength:</span> {insight.strength.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderRecommendationCard = (recommendation, index) => (
    <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {recommendation.priority} priority
          </span>
          <span className="ml-2 text-xs text-gray-500">
            {recommendation.effort} effort
          </span>
        </div>
        <span className="text-xs text-gray-500">{recommendation.timeline}</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{recommendation.recommendation}</p>
      <div className="text-xs text-gray-500">
        Expected impact: {recommendation.expected_impact}
      </div>
    </div>
  );

  const renderRiskCard = (risk, index) => (
    <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          risk.severity === 'high' ? 'bg-red-100 text-red-800' :
          risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {risk.severity} severity
        </span>
        <span className="text-xs text-gray-500">{risk.probability} probability</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{risk.risk}</p>
      <div className="text-xs text-gray-500">
        <span className="font-medium">Mitigation:</span> {risk.mitigation}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading analysis results: {error}</p>
      </div>
    );
  }

  if (!analysisResults) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No analysis results available. Please upload data to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
            <p className="text-gray-600">
              {analysisResults.domain.replace('_', ' ').toUpperCase()} Analysis - 
              {analysisResults.analysis_depth} Depth
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Processing Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {analysisResults.processing_time ? `${(analysisResults.processing_time / 1000).toFixed(1)}s` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {analysisResults.narrative?.executive_summary && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
            <p className="text-blue-800 text-sm">{analysisResults.narrative.executive_summary}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'insights', 'visualizations', 'recommendations', 'risks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              {analysisResults.analysis_results && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(analysisResults.analysis_results).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">{key.replace(/_/g, ' ').toUpperCase()}</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Profile */}
              {analysisResults.data_profile && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Profile</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Domain:</span> {analysisResults.data_profile.domain}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {(analysisResults.data_profile.confidence * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Rows:</span> {analysisResults.data_profile.structure?.shape?.[0] || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Columns:</span> {analysisResults.data_profile.structure?.shape?.[1] || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
              {analysisResults.narrative?.key_insights?.map((insight, index) => 
                renderInsightCard(insight, index)
              )}
              
              {analysisResults.narrative?.trend_analysis && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Trend Analysis</h4>
                  {analysisResults.narrative.trend_analysis.map((trend, index) => 
                    renderInsightCard(trend, `trend-${index}`)
                  )}
                </div>
              )}
            </div>
          )}

          {/* Visualizations Tab */}
          {activeTab === 'visualizations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Intelligent Visualizations</h3>
              {analysisResults.visualizations?.chart_configurations && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(analysisResults.visualizations.chart_configurations).map(([title, config]) => (
                    <div key={title} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">{title}</h4>
                      <canvas 
                        id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
                        className="w-full h-64"
                      ></canvas>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h3>
              {analysisResults.narrative?.actionable_recommendations?.map((recommendation, index) => 
                renderRecommendationCard(recommendation, index)
              )}
            </div>
          )}

          {/* Risks Tab */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              {analysisResults.narrative?.risk_assessment?.map((risk, index) => 
                renderRiskCard(risk, index)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvancedDashboard; 
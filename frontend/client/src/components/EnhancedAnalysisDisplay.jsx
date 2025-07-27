import React, { useState } from 'react';

function EnhancedAnalysisDisplay({ analysis }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState(new Set(['overview']));

  if (!analysis) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    );
  }

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderDataQuality = () => {
    const quality = analysis.comprehension?.dataQuality || analysis.dataProcessing?.quality;
    if (!quality) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Data Quality Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{quality.overallScore || Math.round((quality.score || 0) * 100)}%</div>
            <div className="text-sm text-blue-700">Overall Quality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.comprehension?.metadata?.totalRecords || analysis.dataProcessing?.metadata?.totalRecords || 0}</div>
            <div className="text-sm text-blue-700">Records Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.comprehension?.metadata?.totalColumns || analysis.dataProcessing?.metadata?.totalColumns || 0}</div>
            <div className="text-sm text-blue-700">Data Dimensions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{quality.outliers || 0}</div>
            <div className="text-sm text-blue-700">Anomalies Detected</div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialHealth = () => {
    const health = analysis.advancedAI?.financialHealth;
    if (!health) return null;

    return (
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-2">💊 Financial Health Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{health.metrics.liquidity.score}</div>
            <div className="text-lg font-semibold text-green-700">Grade {health.metrics.liquidity.grade}</div>
            <div className="text-sm text-green-600">liquidity</div>
            <div className="text-xs text-green-500 mt-1">
              {health.metrics.liquidity.insights.join(', ')}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{health.metrics.profitability.score}</div>
            <div className="text-lg font-semibold text-green-700">Grade {health.metrics.profitability.grade}</div>
            <div className="text-sm text-green-600">profitability</div>
            <div className="text-xs text-green-500 mt-1">
              {health.metrics.profitability.insights.join(', ')}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">{health.metrics.efficiency.score}</div>
            <div className="text-lg font-semibold text-green-700">Grade {health.metrics.efficiency.grade}</div>
            <div className="text-sm text-green-600">efficiency</div>
            <div className="text-xs text-green-500 mt-1">
              {health.metrics.efficiency.insights.join(', ')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIInsights = () => {
    const insights = analysis.aiInsights;
    if (!insights) return null;

    // Handle both old format (insights.success) and new format (direct insights)
    const isOldFormat = insights.success !== undefined;
    const insightsData = isOldFormat ? insights : insights;

    const allInsights = [
      ...(insightsData.cashFlow || []),
      ...(insightsData.profitability || []),
      ...(insightsData.risk || []),
      ...(insightsData.efficiency || []),
      ...(insightsData.trends || []),
      ...(insightsData.anomalies || []),
      ...(insightsData.opportunities || [])
    ];

    if (allInsights.length === 0) return null;

    return (
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">🧠 AI-Powered Insights</h3>
        <div className="space-y-3">
          {allInsights.slice(0, 5).map((insight, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              insight.type === 'positive' ? 'bg-green-100 border border-green-200' :
              insight.type === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
              insight.type === 'critical' ? 'bg-red-100 border border-red-200' :
              'bg-blue-100 border border-blue-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{insight.title || insight.description}</h4>
                  <p className="text-sm text-gray-700 mt-1">{insight.description || insight.message}</p>
                  {insight.metrics && (
                    <div className="text-xs text-gray-500 mt-2">
                      {Object.entries(insight.metrics).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      ))}
                    </div>
                  )}
                  {insight.details && (
                    <div className="text-xs text-gray-500 mt-2">
                      {Object.entries(insight.details).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact || 'medium'} impact
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    const recommendations = analysis.aiInsights?.recommendations || analysis.advancedAI?.strategicRecommendations;
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-orange-900 mb-2">💡 Strategic Recommendations</h3>
        <div className="space-y-3">
          {recommendations.slice(0, 5).map((rec, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{rec.description}</h4>
                  <p className="text-sm text-gray-700 mt-1">{rec.action}</p>
                </div>
                <div className="ml-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    const predictions = analysis.advancedAI?.predictions;
    if (!predictions) return null;

    return (
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">🔮 Financial Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-semibold text-indigo-900 mb-2">Revenue Forecast</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Month:</span>
                <span className="font-semibold">${predictions.revenue?.nextMonth?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Quarter:</span>
                <span className="font-semibold">${predictions.revenue?.nextQuarter?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="font-semibold text-green-600">{predictions.revenue?.confidence || 'medium'}</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-semibold text-indigo-900 mb-2">Cash Flow Forecast</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Month:</span>
                <span className="font-semibold">${predictions.cashFlow?.nextMonth?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className="font-semibold text-green-600">{predictions.cashFlow?.riskLevel || 'low'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="font-semibold text-green-600">{predictions.cashFlow?.confidence || 'medium'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRiskAssessment = () => {
    const risk = analysis.advancedAI?.riskAssessment;
    if (!risk) return null;

    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Risk Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              risk.overallRisk === 'low' ? 'text-green-600' :
              risk.overallRisk === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {risk.overallRisk.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{risk.riskScore}/100</div>
            <div className="text-sm text-gray-600">Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{risk.riskFactors?.length || 0}</div>
            <div className="text-sm text-gray-600">Risk Factors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{risk.mitigationStrategies?.length || 0}</div>
            <div className="text-sm text-gray-600">Mitigation Strategies</div>
          </div>
        </div>
        {risk.riskFactors && risk.riskFactors.length > 0 && (
          <div className="mt-3">
            <h4 className="font-semibold text-red-900 mb-2">Key Risk Factors:</h4>
            <div className="flex flex-wrap gap-2">
              {risk.riskFactors.map((factor, index) => (
                <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceMetrics = () => {
    const metrics = analysis.advancedAI?.performanceMetrics;
    if (!metrics) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{metrics.dataQuality}%</div>
            <div className="text-sm text-gray-600">Data Quality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{metrics.totalTransactions?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">${metrics.averageTransaction?.toFixed(2) || 0}</div>
            <div className="text-sm text-gray-600">Avg Transaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">${metrics.netCashFlow?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Net Cash Flow</div>
          </div>
        </div>
      </div>
    );
  };

  const renderMLSummary = () => {
    const mlSummary = analysis.mlSummary;
    if (!mlSummary || !mlSummary.summary) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🧠 ML-Powered Analysis Summary</h3>
        <p className="text-gray-700 leading-relaxed">{mlSummary.summary}</p>
        {mlSummary.metadata && (
          <div className="mt-3 text-sm text-gray-600">
            <span>Patterns: {mlSummary.metadata.patternsDetected || 0}</span>
            <span className="mx-2">•</span>
            <span>Correlations: {mlSummary.metadata.correlationsFound || 0}</span>
            <span className="mx-2">•</span>
            <span>Generated: {new Date(mlSummary.metadata.generatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  const renderEnhancedLabels = () => {
    const labels = analysis.comprehension?.enhancedLabels || analysis.comprehension?.smartLabels;
    if (!labels || Object.keys(labels).length === 0) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🏷️ Enhanced Column Labels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(labels).map(([column, label]) => (
            <div key={column} className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-900">{column}</div>
              <div className="text-sm text-gray-600 mt-1">
                <div>Label: {label.label || label.semantic || 'Unknown'}</div>
                <div>Confidence: {Math.round((label.confidence || 0) * 100)}%</div>
                <div>Type: {label.data_type || label.type || 'N/A'}</div>
                <div>Unique Values: {label.unique_values || label.uniqueCount || 'N/A'}</div>
                <div>Missing: {label.missing_percentage ? `${label.missing_percentage.toFixed(1)}%` : 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnhancedMLInsights = () => {
    const enhancedML = analysis.enhancedML;
    if (!enhancedML) return null;

    return (
      <div className="space-y-4">
        {/* Patterns */}
        {enhancedML.patterns && enhancedML.patterns.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🔍 ML Pattern Detection</h3>
            <div className="space-y-3">
              {enhancedML.patterns.slice(0, 5).map((pattern, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  pattern.type === 'positive' ? 'bg-green-100 border border-green-200' :
                  pattern.type === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
                  pattern.type === 'info' ? 'bg-blue-100 border border-blue-200' :
                  'bg-gray-100 border border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{pattern.category}</h4>
                      <p className="text-sm text-gray-700 mt-1">{pattern.description}</p>
                      {pattern.details && (
                        <div className="text-xs text-gray-500 mt-2">
                          {Object.entries(pattern.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                        pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {pattern.impact || 'medium'} impact
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {enhancedML.anomalies && enhancedML.anomalies.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Anomaly Detection</h3>
            <div className="space-y-3">
              {enhancedML.anomalies.slice(0, 5).map((anomaly, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{anomaly.category}</h4>
                      <p className="text-sm text-gray-700 mt-1">{anomaly.description}</p>
                      {anomaly.details && (
                        <div className="text-xs text-gray-500 mt-2">
                          {Object.entries(anomaly.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity || 'medium'} severity
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {enhancedML.trends && enhancedML.trends.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">📈 Trend Analysis</h3>
            <div className="space-y-3">
              {enhancedML.trends.slice(0, 3).map((trend, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{trend.column}</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        {trend.direction} trend with {trend.strength} strength
                      </p>
                      {trend.details && (
                        <div className="text-xs text-gray-500 mt-2">
                          <span className="mr-3">Slope: {trend.details.slope?.toFixed(3)}</span>
                          <span className="mr-3">R²: {trend.details.rSquared?.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trend.direction === 'increasing' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {trend.direction}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Analysis Results */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">🚀 Advanced AI Financial Intelligence</h2>
          <p className="text-gray-600 mt-2">
            Comprehensive analysis powered by enhanced ML algorithms and AI insights
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Data Quality */}
          {renderDataQuality()}

          {/* Financial Health */}
          {renderFinancialHealth()}

          {/* AI Insights */}
          {renderAIInsights()}

          {/* Recommendations */}
          {renderRecommendations()}

          {/* Predictions */}
          {renderPredictions()}

          {/* Risk Assessment */}
          {renderRiskAssessment()}

          {/* Performance Metrics */}
          {renderPerformanceMetrics()}

          {/* ML Summary */}
          {renderMLSummary()}

          {/* Enhanced Labels */}
          {renderEnhancedLabels()}

          {/* Enhanced ML Insights */}
          {renderEnhancedMLInsights()}
        </div>
      </div>

      {/* Detailed Analysis Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'insights', 'patterns', 'recommendations', 'technical'].map((tab) => (
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
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.advancedAI?.financialHealth?.overallScore || 0}
                  </div>
                  <div className="text-sm text-blue-700">Financial Health Score</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {analysis.advancedAI?.riskAssessment?.overallRisk?.toUpperCase() || 'LOW'}
                  </div>
                  <div className="text-sm text-yellow-700">Risk Level</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.comprehension?.metadata?.predictionConfidence?.toUpperCase() || analysis.advancedAI?.predictions?.revenue?.confidence?.toUpperCase() || 'MEDIUM'}
                  </div>
                  <div className="text-sm text-green-700">Prediction Confidence</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed AI Insights</h3>
              {analysis.aiInsights?.success && (
                <div className="space-y-4">
                  {Object.entries(analysis.aiInsights.insights).map(([category, insights]) => (
                    insights && insights.length > 0 && (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 capitalize">{category.replace(/([A-Z])/g, ' $1')}</h4>
                        <div className="space-y-2">
                          {insights.map((insight, index) => (
                            <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                              {insight.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pattern Analysis</h3>
              {analysis.enhancedML?.patterns && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.enhancedML.patterns).map(([patternType, pattern]) => (
                    <div key={patternType} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 capitalize">{patternType.replace(/([A-Z])/g, ' $1')}</h4>
                      <div className="text-sm text-gray-700">
                        {pattern.description || 'No pattern data available'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Strategic Recommendations</h3>
              {analysis.aiInsights?.recommendations && (
                <div className="space-y-3">
                  {analysis.aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.description}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.action}</p>
                      <div className="text-xs text-gray-500">
                        Effort: {rec.effort} • Impact: {rec.impact} • Confidence: {rec.confidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Data Processing</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>Total Records: {analysis.dataProcessing?.metadata?.totalRecords || 0}</div>
                    <div>Total Columns: {analysis.dataProcessing?.metadata?.totalColumns || 0}</div>
                    <div>Data Quality: {Math.round((analysis.dataProcessing?.quality?.score || 0) * 100)}%</div>
                    <div>Pipeline Version: {analysis.comprehension?.metadata?.pipelineVersion || 'N/A'}</div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Analysis Metadata</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>Domain: {analysis.comprehension?.metadata?.domain || 'N/A'}</div>
                    <div>Enhanced Processing: {analysis.comprehension?.metadata?.enhancedProcessing ? 'Yes' : 'No'}</div>
                    <div>Cross-Column Inference: {analysis.comprehension?.metadata?.crossColumnInference ? 'Yes' : 'No'}</div>
                    <div>Generated: {new Date().toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedAnalysisDisplay; 
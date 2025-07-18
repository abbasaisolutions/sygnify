import React from 'react';

/**
 * ML Summary Display Component
 * Displays comprehensive ML-powered analysis summary
 */
function MLSummaryDisplay({ mlSummary, className = '' }) {
  if (!mlSummary) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <p className="text-gray-500 text-center">No ML summary available</p>
      </div>
    );
  }

  // Handle error case
  if (mlSummary.error) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <h3 className="text-lg font-semibold text-red-800 mb-2">🧠 ML Summary Error</h3>
        <p className="text-red-700">{mlSummary.error}</p>
        {mlSummary.summary && (
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="text-gray-700 text-sm">{mlSummary.summary}</p>
          </div>
        )}
      </div>
    );
  }

  const getRiskLevelColor = (level) => {
    if (!level) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (level.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Summary Section */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
          🧠 ML-Powered Analysis Summary
        </h3>
        <p className="text-purple-700 leading-relaxed text-lg">
          {mlSummary.summary}
        </p>
      </div>

      {/* Risk Assessment Section */}
      {mlSummary.riskProfile && (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            ⚠️ Risk Assessment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(mlSummary.riskProfile.level)}`}>
                {(mlSummary.riskProfile.level || 'UNKNOWN').toUpperCase()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Risk Level</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">
                {mlSummary.riskProfile.score ? mlSummary.riskProfile.score.toFixed(0) : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Risk Score /100</p>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-700">
                {mlSummary.riskProfile.factors ? mlSummary.riskProfile.factors.length : 0} Factors
              </div>
              <p className="text-sm text-gray-600">Identified</p>
            </div>
          </div>
          
          {mlSummary.riskProfile.factors && mlSummary.riskProfile.factors.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-red-800 mb-2">Risk Factors:</h5>
              <ul className="space-y-1">
                {mlSummary.riskProfile.factors.map((factor, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pattern Analysis Section */}
      {mlSummary.patterns && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            🔍 Pattern Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mlSummary.patterns).map(([key, pattern]) => {
              if (key === 'insightPatterns') return null; // Skip insight patterns for now
              
              return (
                <div key={key} className="p-4 bg-white rounded-lg border border-blue-100">
                  <h5 className="font-semibold text-blue-800 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h5>
                  <p className="text-sm text-gray-700 mb-2">
                    {pattern.description}
                  </p>
                  {pattern.severity && (
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                      {pattern.severity}
                    </span>
                  )}
                  {pattern.value !== undefined && (
                    <div className="mt-2 text-sm text-gray-600">
                      Value: {typeof pattern.value === 'number' ? pattern.value.toFixed(2) : pattern.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Profile Section */}
      {mlSummary.performanceProfile && (
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            📈 Performance Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mlSummary.performanceProfile.current && (
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(mlSummary.performanceProfile.current.grade)}`}>
                  Grade {mlSummary.performanceProfile.current.grade}
                </div>
                <div className="text-2xl font-bold text-green-800 mt-2">
                  {mlSummary.performanceProfile.current.score?.toFixed(0) || 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Current Score /100</p>
              </div>
            )}
            
            {mlSummary.performanceProfile.trends && (
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-800">
                  {mlSummary.performanceProfile.trends.direction?.toUpperCase() || 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Trend Direction</p>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {mlSummary.performanceProfile.trends.confidence || 'N/A'}
                </div>
              </div>
            )}
            
            {mlSummary.performanceProfile.outlook && (
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-800">
                  {mlSummary.performanceProfile.outlook?.toUpperCase() || 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Future Outlook</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operational Insights Section */}
      {mlSummary.operationalInsights && (
        <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
            ⚙️ Operational Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded border border-orange-100">
                <span className="text-sm font-medium text-gray-700">Efficiency Score</span>
                <span className="text-lg font-bold text-orange-800">
                  {mlSummary.operationalInsights.efficiency || 'N/A'}/100
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-orange-100">
                <span className="text-sm font-medium text-gray-700">Data Quality</span>
                <span className="text-lg font-bold text-orange-800">
                  {mlSummary.operationalInsights.quality || 'N/A'}/100
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-orange-100">
                <span className="text-sm font-medium text-gray-700">Anomalies Detected</span>
                <span className="text-lg font-bold text-orange-800">
                  {mlSummary.operationalInsights.anomalies || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border border-orange-100">
              <h5 className="font-medium text-gray-700 mb-2">Identified Opportunities</h5>
              {mlSummary.operationalInsights.opportunities && mlSummary.operationalInsights.opportunities.length > 0 ? (
                <ul className="space-y-1">
                  {mlSummary.operationalInsights.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-center">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No specific opportunities identified</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Correlations Section (if available) */}
      {mlSummary.correlations && Object.keys(mlSummary.correlations).length > 0 && (
        <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            🔗 Key Correlations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mlSummary.correlations).map(([key, correlation]) => (
              <div key={key} className="p-4 bg-white rounded-lg border border-indigo-100">
                <h5 className="font-semibold text-indigo-800 mb-2">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Strength:</span>
                    <span className="font-medium text-indigo-800 capitalize">
                      {correlation.strength}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium text-indigo-800">
                      {correlation.value?.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {correlation.interpretation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Section */}
      {mlSummary.metadata && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Metadata</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Type:</span> {mlSummary.metadata.analysisType}
            </div>
            <div>
              <span className="font-medium">Patterns:</span> {mlSummary.metadata.patternsDetected}
            </div>
            <div>
              <span className="font-medium">Correlations:</span> {mlSummary.metadata.correlationsFound}
            </div>
            <div>
              <span className="font-medium">Generated:</span> {new Date(mlSummary.metadata.generatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MLSummaryDisplay; 
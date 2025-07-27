const MLSummaryService = require('../services/MLSummaryService');
const InsightService = require('../services/InsightService');
const LabelService = require('../services/LabelService');

/**
 * Example: Integrating ML Summary into Analysis Pipeline
 * Shows how to add comprehensive ML-powered summaries to your analysis
 */
async function integrateMLSummary() {
  console.log('🔗 ML Summary Integration Example');
  console.log('='.repeat(50));

  // Sample data (your actual CSV data would go here)
  const sampleData = [
    {
      transaction_id: 'TXN001',
      amount: -1500.00,
      current_balance: 45000.00,
      fraud_score: 0.45,
      transaction_type: 'Purchase',
      transaction_date: '2024-01-15',
    },
    {
      transaction_id: 'TXN002',
      amount: 2500.00,
      current_balance: 47500.00,
      fraud_score: 0.12,
      transaction_type: 'Deposit',
      transaction_date: '2024-01-16',
    },
    {
      transaction_id: 'TXN003',
      amount: -800.00,
      current_balance: 46700.00,
      fraud_score: 0.78,
      transaction_type: 'Withdrawal',
      transaction_date: '2024-01-17',
    },
    // ... more records
  ];

  try {
    // Step 1: Generate smart labels
    console.log('🏷️ Step 1: Generating smart labels...');
    const labelService = new LabelService('finance');
    const labels = await labelService.extractLabels(sampleData);

    // Step 2: Compute insights and metrics
    console.log('📊 Step 2: Computing insights and metrics...');
    const insightService = new InsightService('finance');
    const insightResults = await insightService.computeMetrics(sampleData, labels);

    // Step 3: Generate ML-powered summary
    console.log('🧠 Step 3: Generating ML-powered summary...');
    const mlSummaryService = new MLSummaryService('finance');
    const mlSummary = await mlSummaryService.generateMLSummary(
      insightResults.metrics,
      insightResults.insights,
      {}, // forecasts (empty for this example)
      [], // recommendations (empty for this example)
      labels,
    );

    // Step 4: Display results
    if (mlSummary.success) {
      console.log('\n✅ ML Summary Generated Successfully!');
      console.log('\n📝 COMPREHENSIVE SUMMARY:');
      console.log('-'.repeat(40));
      console.log(mlSummary.summary);

      console.log('\n⚠️ RISK ASSESSMENT:');
      console.log('-'.repeat(20));
      console.log(`Level: ${mlSummary.riskProfile.level.toUpperCase()}`);
      console.log(`Score: ${mlSummary.riskProfile.score}/100`);
      console.log(`Factors: ${mlSummary.riskProfile.factors.join(', ')}`);

      console.log('\n🔍 KEY PATTERNS:');
      console.log('-'.repeat(15));
      console.log(`Cash Flow: ${mlSummary.patterns.cashFlow.description}`);
      console.log(`Risk: ${mlSummary.patterns.risk.description}`);
      console.log(`Balance: ${mlSummary.patterns.balance.description}`);

      // Step 5: Integration with your analysis results
      const enhancedAnalysis = {
        // Your existing analysis results
        metrics: insightResults.metrics,
        insights: insightResults.insights,
        labels,

        // New ML-powered summary
        mlSummary: {
          summary: mlSummary.summary,
          riskProfile: mlSummary.riskProfile,
          patterns: mlSummary.patterns,
          performanceProfile: mlSummary.performanceProfile,
          operationalInsights: mlSummary.operationalInsights,
        },

        metadata: {
          recordCount: sampleData.length,
          analysisType: 'Enhanced with ML Summary',
          generatedAt: new Date().toISOString(),
        },
      };

      console.log('\n🎯 INTEGRATION COMPLETE!');
      console.log('Your analysis now includes:');
      console.log('  ✅ Traditional metrics and insights');
      console.log('  ✅ ML-powered pattern recognition');
      console.log('  ✅ Comprehensive risk assessment');
      console.log('  ✅ One-paragraph business summary');
      console.log('  ✅ Operational efficiency analysis');

      return enhancedAnalysis;
    }
    console.log('❌ ML Summary generation failed:', mlSummary.error);
    return null;
  } catch (error) {
    console.error('❌ Integration error:', error.message);
    return null;
  }
}

/**
 * Example: API Integration
 * Shows how to use the ML summary in your API endpoints
 */
async function apiIntegrationExample() {
  console.log('\n🌐 API Integration Example');
  console.log('='.repeat(30));

  // Simulate API request data
  const apiRequest = {
    metrics: {
      amount: {
        count: 10001,
        average: -1001.36,
        min: -50000,
        max: 25000,
        standardDeviation: 8500.25,
        coefficientOfVariation: 0.85,
      },
      current_balance: {
        count: 10001,
        average: 49448.56,
        min: 1000,
        max: 150000,
        standardDeviation: 25000.75,
        coefficientOfVariation: 0.51,
      },
      fraud_score: {
        count: 10001,
        average: 0.498,
        min: 0.01,
        max: 0.99,
        standardDeviation: 0.25,
        coefficientOfVariation: 0.50,
      },
    },
    insights: [
      {
        category: 'cash_flow',
        severity: 'warning',
        description: 'Net negative cash flow pattern detected',
        metric: 'amount',
        value: -1001.36,
      },
      {
        category: 'risk',
        severity: 'warning',
        description: 'Elevated fraud risk with 49.8% average score',
        metric: 'fraud_score',
        value: 0.498,
      },
    ],
    forecasts: {
      revenue: {
        nextMonth: 50000,
        nextQuarter: 150000,
        confidence: 'high',
        trend: 'positive',
      },
    },
    recommendations: [
      {
        title: 'Optimize Transaction Processing',
        description: 'Implement automated fraud detection',
        priority: 'high',
        impact: 'High impact on operational efficiency',
      },
    ],
    labels: {
      amount: {
        semantic: 'Transaction Amount (Revenue/Expense)',
        category: 'Revenue Metric',
        importance: 100,
        type: 'numeric',
      },
    },
  };

  try {
    // Generate ML summary from API data
    const mlSummaryService = new MLSummaryService('finance');
    const mlSummary = await mlSummaryService.generateMLSummary(
      apiRequest.metrics,
      apiRequest.insights,
      apiRequest.forecasts,
      apiRequest.recommendations,
      apiRequest.labels,
    );

    if (mlSummary.success) {
      // API response format
      const apiResponse = {
        success: true,
        analysis: {
          // Original analysis data
          metrics: apiRequest.metrics,
          insights: apiRequest.insights,
          forecasts: apiRequest.forecasts,
          recommendations: apiRequest.recommendations,

          // Enhanced with ML summary
          mlSummary: {
            summary: mlSummary.summary,
            riskProfile: mlSummary.riskProfile,
            patterns: mlSummary.patterns,
            performanceProfile: mlSummary.performanceProfile,
            operationalInsights: mlSummary.operationalInsights,
          },
        },
        metadata: {
          analysisType: 'ML-Enhanced Financial Analysis',
          patternsDetected: Object.keys(mlSummary.patterns).length,
          correlationsFound: Object.keys(mlSummary.correlations).length,
          generatedAt: new Date().toISOString(),
        },
      };

      console.log('✅ API Response Generated:');
      console.log('Summary:', `${apiResponse.analysis.mlSummary.summary.substring(0, 100)}...`);
      console.log('Risk Level:', apiResponse.analysis.mlSummary.riskProfile.level);
      console.log('Patterns Detected:', apiResponse.metadata.patternsDetected);

      return apiResponse;
    }
  } catch (error) {
    console.error('❌ API integration error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Example: Frontend Integration
 * Shows how to display ML summary in your React components
 */
function frontendIntegrationExample() {
  console.log('\n⚛️ Frontend Integration Example');
  console.log('='.repeat(30));

  // React component example
  const MLSummaryComponent = `
import React from 'react';

function MLSummaryDisplay({ analysisResults }) {
    if (!analysisResults.mlSummary) {
        return <div>No ML summary available</div>;
    }
    
    const { mlSummary } = analysisResults;
    
    return (
        <div className="ml-summary-container">
            {/* Main Summary */}
            <div className="summary-section">
                <h3>🧠 ML-Powered Analysis Summary</h3>
                <p className="summary-text">{mlSummary.summary}</p>
            </div>
            
            {/* Risk Profile */}
            <div className="risk-section">
                <h4>⚠️ Risk Assessment</h4>
                <div className="risk-indicators">
                    <span className="risk-level {mlSummary.riskProfile.level}">
                        {mlSummary.riskProfile.level.toUpperCase()}
                    </span>
                    <span className="risk-score">
                        Score: {mlSummary.riskProfile.score}/100
                    </span>
                </div>
                <ul className="risk-factors">
                    {mlSummary.riskProfile.factors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                    ))}
                </ul>
            </div>
            
            {/* Pattern Analysis */}
            <div className="patterns-section">
                <h4>🔍 Pattern Analysis</h4>
                <div className="pattern-grid">
                    <div className="pattern-card">
                        <h5>Cash Flow</h5>
                        <p>{mlSummary.patterns.cashFlow.description}</p>
                        <span className="severity {mlSummary.patterns.cashFlow.severity}">
                            {mlSummary.patterns.cashFlow.severity}
                        </span>
                    </div>
                    <div className="pattern-card">
                        <h5>Risk Level</h5>
                        <p>{mlSummary.patterns.risk.description}</p>
                        <span className="severity {mlSummary.patterns.risk.severity}">
                            {mlSummary.patterns.risk.severity}
                        </span>
                    </div>
                    <div className="pattern-card">
                        <h5>Balance Health</h5>
                        <p>{mlSummary.patterns.balance.description}</p>
                        <span className="severity {mlSummary.patterns.balance.severity}">
                            {mlSummary.patterns.balance.severity}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Performance Profile */}
            <div className="performance-section">
                <h4>📈 Performance Overview</h4>
                <div className="performance-metrics">
                    <div className="metric">
                        <span>Current Grade:</span>
                        <span className="grade">{mlSummary.performanceProfile.current.grade}</span>
                    </div>
                    <div className="metric">
                        <span>Trend:</span>
                        <span className="trend {mlSummary.performanceProfile.trends.direction}">
                            {mlSummary.performanceProfile.trends.direction}
                        </span>
                    </div>
                    <div className="metric">
                        <span>Outlook:</span>
                        <span className="outlook {mlSummary.performanceProfile.outlook}">
                            {mlSummary.performanceProfile.outlook}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MLSummaryDisplay;
    `;

  console.log('✅ React Component Example:');
  console.log('Component includes:');
  console.log('  📝 Main summary paragraph');
  console.log('  ⚠️ Risk assessment display');
  console.log('  🔍 Pattern analysis cards');
  console.log('  📈 Performance metrics');
  console.log('  🎨 Responsive styling classes');

  return MLSummaryComponent;
}

// Run examples
async function runExamples() {
  console.log('🚀 Running ML Summary Integration Examples\n');

  // Example 1: Pipeline Integration
  await integrateMLSummary();

  // Example 2: API Integration
  await apiIntegrationExample();

  // Example 3: Frontend Integration
  frontendIntegrationExample();

  console.log('\n🎉 All examples completed!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Integrate MLSummaryService into your analysis pipeline');
  console.log('   2. Add the /api/analyze/ml-summary endpoint to your API');
  console.log('   3. Create React components to display the ML summary');
  console.log('   4. Customize patterns and thresholds for your domain');
}

// Run if called directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  integrateMLSummary,
  apiIntegrationExample,
  frontendIntegrationExample,
  runExamples,
};

const LabelService = require('../services/LabelService');
const InsightService = require('../services/InsightService');
const PredictionService = require('../services/PredictionService');
const RecommendationService = require('../services/RecommendationService');
const NarrativeService = require('../services/NarrativeService');

/**
 * Basic test coverage for modular services
 * Light automated checks for regression & sanity
 */

// Sample test data
const sampleData = [
  {
    transaction_id: 'TXN001',
    account_id: 'ACC001',
    customer_name: 'John Doe',
    transaction_date: '2024-01-01',
    transaction_type: 'Purchase',
    amount: '-150.00',
    currency: 'USD',
    description: 'Grocery purchase',
    category: 'Groceries',
    current_balance: '5000.00',
    account_type: 'Checking',
    merchant_name: 'SuperMarket',
    merchant_city: 'New York',
    merchant_state: 'NY',
    fraud_score: '0.1',
    is_fraud: '0',
  },
  {
    transaction_id: 'TXN002',
    account_id: 'ACC001',
    customer_name: 'John Doe',
    transaction_date: '2024-01-02',
    transaction_type: 'Deposit',
    amount: '2000.00',
    currency: 'USD',
    description: 'Salary deposit',
    category: 'Income',
    current_balance: '7000.00',
    account_type: 'Checking',
    merchant_name: 'Employer Inc',
    merchant_city: 'New York',
    merchant_state: 'NY',
    fraud_score: '0.05',
    is_fraud: '0',
  },
  {
    transaction_id: 'TXN003',
    account_id: 'ACC001',
    customer_name: 'John Doe',
    transaction_date: '2024-01-03',
    transaction_type: 'Purchase',
    amount: '-500.00',
    currency: 'USD',
    description: 'Electronics purchase',
    category: 'Electronics',
    current_balance: '6500.00',
    account_type: 'Checking',
    merchant_name: 'TechStore',
    merchant_city: 'New York',
    merchant_state: 'NY',
    fraud_score: '0.8',
    is_fraud: '1',
  },
];

/**
 * Test LabelService
 */
async function testLabelService() {
  console.log('🧪 Testing LabelService...');

  try {
    const labelService = new LabelService('finance');
    const labels = await labelService.extractLabels(sampleData);

    // Test 1: Correctly detects amount as numeric
    const amountLabel = labels.amount;
    if (amountLabel && amountLabel.type === 'numeric') {
      console.log('✅ LabelService: Correctly detects amount as numeric');
    } else {
      console.log('❌ LabelService: Failed to detect amount as numeric');
      return false;
    }

    // Test 2: Correct semantic labels
    if (amountLabel && amountLabel.semantic.includes('Amount')) {
      console.log('✅ LabelService: Correct semantic label for amount');
    } else {
      console.log('❌ LabelService: Incorrect semantic label for amount');
      return false;
    }

    // Test 3: Normalized importance scale [0-100]
    for (const [column, label] of Object.entries(labels)) {
      if (label.importance < 0 || label.importance > 100) {
        console.log(`❌ LabelService: Invalid importance value for ${column}: ${label.importance}`);
        return false;
      }
    }
    console.log('✅ LabelService: All importance values in normalized [0-100] scale');

    // Test 4: Validation
    const validation = labelService.validateLabels(labels);
    if (validation.isValid) {
      console.log('✅ LabelService: Labels validation passed');
    } else {
      console.log('❌ LabelService: Labels validation failed:', validation.issues);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ LabelService test failed:', error.message);
    return false;
  }
}

/**
 * Test InsightService
 */
async function testInsightService() {
  console.log('🧪 Testing InsightService...');

  try {
    const insightService = new InsightService('finance');
    const labels = await new LabelService('finance').extractLabels(sampleData);
    const results = await insightService.computeMetrics(sampleData, labels);

    // Test 1: Returns average fraud score within expected bounds
    const fraudCol = Object.keys(results.metrics).find((col) => col.includes('fraud'));
    if (fraudCol) {
      const fraudAvg = results.metrics[fraudCol].average;
      if (fraudAvg >= 0 && fraudAvg <= 1) {
        console.log('✅ InsightService: Fraud score average within expected bounds [0-1]');
      } else {
        console.log('❌ InsightService: Fraud score average outside expected bounds');
        return false;
      }
    }

    // Test 2: Generates insights
    if (results.insights && results.insights.length > 0) {
      console.log('✅ InsightService: Generated insights successfully');
    } else {
      console.log('❌ InsightService: No insights generated');
      return false;
    }

    // Test 3: Includes min, max, std deviation
    const amountCol = Object.keys(results.metrics).find((col) => col.includes('amount'));
    if (amountCol) {
      const metric = results.metrics[amountCol];
      if (metric.min !== undefined && metric.max !== undefined && metric.stdDev !== undefined) {
        console.log('✅ InsightService: Includes min, max, std deviation');
      } else {
        console.log('❌ InsightService: Missing min, max, or std deviation');
        return false;
      }
    }

    // Test 4: Deduplicates insights
    const uniqueInsights = new Set(results.insights.map((i) => i.description));
    if (uniqueInsights.size === results.insights.length) {
      console.log('✅ InsightService: Insights deduplicated successfully');
    } else {
      console.log('❌ InsightService: Duplicate insights found');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ InsightService test failed:', error.message);
    return false;
  }
}

/**
 * Test PredictionService
 */
async function testPredictionService() {
  console.log('🧪 Testing PredictionService...');

  try {
    const predictionService = new PredictionService('finance');
    const labels = await new LabelService('finance').extractLabels(sampleData);
    const insightService = new InsightService('finance');
    const metrics = await insightService.computeMetrics(sampleData, labels);
    const forecasts = await predictionService.generateForecasts(sampleData, labels, metrics.metrics);

    // Test 1: Validates output format
    if (forecasts.revenue && forecasts.revenue.nextMonth) {
      console.log('✅ PredictionService: Valid revenue forecast format');
    } else {
      console.log('❌ PredictionService: Invalid revenue forecast format');
      return false;
    }

    // Test 2: Optional confidence scores
    if (forecasts.revenue.nextMonth.confidence !== undefined) {
      console.log('✅ PredictionService: Includes confidence scores');
    } else {
      console.log('❌ PredictionService: Missing confidence scores');
      return false;
    }

    // Test 3: Variance ranges
    if (forecasts.revenue.nextMonth.variance !== undefined) {
      console.log('✅ PredictionService: Includes variance ranges');
    } else {
      console.log('❌ PredictionService: Missing variance ranges');
      return false;
    }

    // Test 4: Underlying logic
    if (forecasts.revenue.underlyingLogic) {
      console.log('✅ PredictionService: Includes underlying logic');
    } else {
      console.log('❌ PredictionService: Missing underlying logic');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ PredictionService test failed:', error.message);
    return false;
  }
}

/**
 * Test RecommendationService
 */
async function testRecommendationService() {
  console.log('🧪 Testing RecommendationService...');

  try {
    const recommendationService = new RecommendationService('finance');
    const labels = await new LabelService('finance').extractLabels(sampleData);
    const insightService = new InsightService('finance');
    const metrics = await insightService.computeMetrics(sampleData, labels);
    const predictionService = new PredictionService('finance');
    const forecasts = await predictionService.generateForecasts(sampleData, labels, metrics.metrics);

    const recommendations = await recommendationService.generateRecommendations(
      metrics.metrics,
      metrics.insights,
      forecasts,
      labels,
    );

    // Test 1: At least 2 input scenarios trigger expected suggestions
    if (recommendations.recommendations.length >= 2) {
      console.log('✅ RecommendationService: Generated multiple recommendations');
    } else {
      console.log('❌ RecommendationService: Insufficient recommendations generated');
      return false;
    }

    // Test 2: High fraud score triggers fraud detection recommendation
    const fraudRecommendations = recommendations.recommendations.filter((r) => r.title.toLowerCase().includes('fraud'));
    if (fraudRecommendations.length > 0) {
      console.log('✅ RecommendationService: High fraud score triggers fraud detection recommendation');
    } else {
      console.log('❌ RecommendationService: High fraud score does not trigger fraud detection recommendation');
      return false;
    }

    // Test 3: Modular recommendations structure
    if (recommendations.recommendations[0].priority
        && recommendations.recommendations[0].impact
        && recommendations.recommendations[0].effort) {
      console.log('✅ RecommendationService: Modular recommendations structure');
    } else {
      console.log('❌ RecommendationService: Missing modular structure');
      return false;
    }

    // Test 4: Strategic recommendations
    if (recommendations.strategic && recommendations.strategic.length > 0) {
      console.log('✅ RecommendationService: Generated strategic recommendations');
    } else {
      console.log('❌ RecommendationService: Missing strategic recommendations');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ RecommendationService test failed:', error.message);
    return false;
  }
}

/**
 * Test NarrativeService
 */
async function testNarrativeService() {
  console.log('🧪 Testing NarrativeService...');

  try {
    const narrativeService = new NarrativeService('finance');
    const labels = await new LabelService('finance').extractLabels(sampleData);
    const insightService = new InsightService('finance');
    const metrics = await insightService.computeMetrics(sampleData, labels);
    const predictionService = new PredictionService('finance');
    const forecasts = await predictionService.generateForecasts(sampleData, labels, metrics.metrics);
    const recommendationService = new RecommendationService('finance');
    const recommendations = await recommendationService.generateRecommendations(
      metrics.metrics,
      metrics.insights,
      forecasts,
      labels,
    );

    const narratives = await narrativeService.generateNarratives(
      metrics.metrics,
      metrics.insights,
      forecasts,
      recommendations.recommendations,
      labels,
      'executive',
    );

    // Test 1: Human-readable narrative
    if (narratives.main.headline && narratives.main.summary) {
      console.log('✅ NarrativeService: Generated human-readable narrative');
    } else {
      console.log('❌ NarrativeService: Missing human-readable narrative');
      return false;
    }

    // Test 2: Data context included
    if (narratives.main.summary.includes('3') || narratives.main.summary.includes('records')) {
      console.log('✅ NarrativeService: Includes data context');
    } else {
      console.log('❌ NarrativeService: Missing data context');
      return false;
    }

    // Test 3: Multiple tones supported
    const analystNarrative = await narrativeService.generateNarratives(
      metrics.metrics,
      metrics.insights,
      forecasts,
      recommendations.recommendations,
      labels,
      'analyst',
    );

    if (analystNarrative.main.tone !== narratives.main.tone) {
      console.log('✅ NarrativeService: Supports multiple tones');
    } else {
      console.log('❌ NarrativeService: Does not support multiple tones');
      return false;
    }

    // Test 4: Structured format
    if (narratives.main.keyFindings && narratives.main.insights) {
      console.log('✅ NarrativeService: Structured narrative format');
    } else {
      console.log('❌ NarrativeService: Missing structured format');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ NarrativeService test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting comprehensive service tests...\n');

  const tests = [
    { name: 'LabelService', test: testLabelService },
    { name: 'InsightService', test: testInsightService },
    { name: 'PredictionService', test: testPredictionService },
    { name: 'RecommendationService', test: testRecommendationService },
    { name: 'NarrativeService', test: testNarrativeService },
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n📋 Testing ${test.name}...`);
    const result = await test.test();
    if (result) {
      passedTests++;
      console.log(`✅ ${test.name} tests PASSED\n`);
    } else {
      console.log(`❌ ${test.name} tests FAILED\n`);
    }
  }

  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Services are working correctly.');
    return true;
  }
  console.log('⚠️ Some tests failed. Please review the service implementations.');
  return false;
}

// Export for use in other test files
module.exports = {
  testLabelService,
  testInsightService,
  testPredictionService,
  testRecommendationService,
  testNarrativeService,
  runAllTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

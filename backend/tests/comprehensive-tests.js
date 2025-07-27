/**
 * Comprehensive Test Suite for Sygnify Analytics Hub
 * Tests all critical fixes and improvements
 */

const LabelService = require('../services/LabelService');
const InsightService = require('../services/InsightService');
const PredictionService = require('../services/PredictionService');
const RecommendationService = require('../services/RecommendationService');
const NarrativeService = require('../services/NarrativeService');

// Sample test data
const sampleData = [
  {
    transaction_id: 1, amount: -1000, balance: 50000, fraud_score: 0.3, transaction_type: 'purchase', date: '2024-01-01',
  },
  {
    transaction_id: 2, amount: 2000, balance: 52000, fraud_score: 0.1, transaction_type: 'deposit', date: '2024-01-02',
  },
  {
    transaction_id: 3, amount: -500, balance: 51500, fraud_score: 0.8, transaction_type: 'purchase', date: '2024-01-03',
  },
  {
    transaction_id: 4, amount: 1500, balance: 53000, fraud_score: 0.2, transaction_type: 'deposit', date: '2024-01-04',
  },
  {
    transaction_id: 5, amount: -2000, balance: 51000, fraud_score: 0.9, transaction_type: 'purchase', date: '2024-01-05',
  },
  {
    transaction_id: 6, amount: 3000, balance: 54000, fraud_score: 0.1, transaction_type: 'deposit', date: '2024-01-06',
  },
  {
    transaction_id: 7, amount: -800, balance: 53200, fraud_score: 0.4, transaction_type: 'purchase', date: '2024-01-07',
  },
  {
    transaction_id: 8, amount: 1200, balance: 54400, fraud_score: 0.2, transaction_type: 'deposit', date: '2024-01-08',
  },
  {
    transaction_id: 9, amount: -1500, balance: 52900, fraud_score: 0.7, transaction_type: 'purchase', date: '2024-01-09',
  },
  {
    transaction_id: 10, amount: 2500, balance: 55400, fraud_score: 0.1, transaction_type: 'deposit', date: '2024-01-10',
  },
];

/**
 * Test 1: Importance Scoring Normalization
 */
async function testImportanceScoring() {
  console.log('🧩 Test 1: Importance Scoring Normalization');

  try {
    const labelService = new LabelService('finance');
    const labels = await labelService.extractLabels(sampleData);

    let allValid = true;
    const issues = [];

    for (const [column, label] of Object.entries(labels)) {
      // Check if importance is within 0-100 range
      if (label.importance < 0 || label.importance > 100) {
        allValid = false;
        issues.push(`${column}: importance ${label.importance} outside 0-100 range`);
      }

      // Check for reasonable importance values (no 5000%, 7000%, etc.)
      if (label.importance > 100) {
        allValid = false;
        issues.push(`${column}: importance ${label.importance} exceeds 100`);
      }
    }

    if (allValid) {
      console.log('✅ Importance scoring is properly normalized (0-100)');
      console.log(
        '📊 Sample importance scores:',
        Object.entries(labels).slice(0, 3).map(([col, label]) => `${col}: ${label.importance}`).join(', '),
      );
    } else {
      console.log('❌ Importance scoring issues found:', issues);
    }

    return allValid;
  } catch (error) {
    console.log('❌ Importance scoring test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Semantic Labeling Accuracy
 */
async function testSemanticLabeling() {
  console.log('\n🏷️ Test 2: Semantic Labeling Accuracy');

  try {
    const labelService = new LabelService('finance');
    const labels = await labelService.extractLabels(sampleData);

    const expectedLabels = {
      amount: 'Transaction Amount (Revenue/Expense)',
      balance: 'Account Balance',
      fraud_score: 'Fraud Score',
      transaction_type: 'Transaction Type',
    };

    let accuracy = 0;
    let totalChecks = 0;

    for (const [column, expectedLabel] of Object.entries(expectedLabels)) {
      if (labels[column]) {
        totalChecks++;
        if (labels[column].semantic === expectedLabel) {
          accuracy++;
        } else {
          console.log(`⚠️ ${column}: expected "${expectedLabel}", got "${labels[column].semantic}"`);
        }
      }
    }

    const accuracyPercentage = (accuracy / totalChecks) * 100;
    console.log(`📊 Semantic labeling accuracy: ${accuracyPercentage.toFixed(1)}%`);

    // Test binary field detection
    const binaryFields = Object.entries(labels).filter(([col, label]) => label.type === 'binary' || col.includes('is_') || col.includes('flag_'));

    console.log(`🔍 Binary fields detected: ${binaryFields.length}`);

    return accuracyPercentage >= 80;
  } catch (error) {
    console.log('❌ Semantic labeling test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Insight Deduplication
 */
async function testInsightDeduplication() {
  console.log('\n📊 Test 3: Insight Deduplication');

  try {
    const insightService = new InsightService('finance');
    const labelService = new LabelService('finance');

    const labels = await labelService.extractLabels(sampleData);
    const results = await insightService.computeMetrics(sampleData, labels);

    // Check for duplicate insights
    const insightDescriptions = results.insights.map((i) => i.description);
    const uniqueDescriptions = new Set(insightDescriptions);

    const duplicateCount = insightDescriptions.length - uniqueDescriptions.size;

    if (duplicateCount === 0) {
      console.log('✅ No duplicate insights found');
    } else {
      console.log(`⚠️ Found ${duplicateCount} duplicate insights`);
    }

    // Check fact generation
    console.log(`📝 Generated ${results.facts.length} facts from ${results.insights.length} insights`);

    // Check validation
    if (results.validation.isValid) {
      console.log('✅ Health vs risk consistency validation passed');
    } else {
      console.log('⚠️ Health vs risk consistency issues:', results.validation.warnings);
    }

    return duplicateCount === 0 && results.validation.isValid;
  } catch (error) {
    console.log('❌ Insight deduplication test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Forecast Variance and Confidence
 */
async function testForecastVariance() {
  console.log('\n🔮 Test 4: Forecast Variance and Confidence');

  try {
    const predictionService = new PredictionService('finance');
    const labelService = new LabelService('finance');

    const labels = await labelService.extractLabels(sampleData);
    const forecasts = await predictionService.generateForecasts(sampleData, labels, {});

    let hasVariance = false;
    let hasConfidence = false;
    let hasModelInfo = false;

    for (const [metric, forecast] of Object.entries(forecasts)) {
      if (metric === 'summary') continue;

      // Check for variance
      if (forecast.variance !== undefined) {
        hasVariance = true;
        console.log(`📊 ${metric} variance: ${forecast.variance.toFixed(4)}`);
      }

      // Check for confidence intervals
      if (forecast.confidenceIntervals) {
        hasConfidence = true;
        console.log(`🎯 ${metric} confidence intervals:`, forecast.confidenceIntervals);
      }

      // Check for model information
      if (forecast.modelUsed) {
        hasModelInfo = true;
        console.log(`🤖 ${metric} model: ${forecast.modelUsed}`);
      }

      // Check for range
      if (forecast.range) {
        console.log(`📈 ${metric} range: ${forecast.range.min.toFixed(2)} - ${forecast.range.max.toFixed(2)}`);
      }
    }

    if (hasVariance && hasConfidence && hasModelInfo) {
      console.log('✅ Forecast includes variance, confidence intervals, and model info');
    } else {
      console.log('❌ Missing forecast components:', {
        variance: hasVariance,
        confidence: hasConfidence,
        modelInfo: hasModelInfo,
      });
    }

    return hasVariance && hasConfidence && hasModelInfo;
  } catch (error) {
    console.log('❌ Forecast variance test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Recommendation Triggers
 */
async function testRecommendationTriggers() {
  console.log('\n💡 Test 5: Recommendation Triggers');

  try {
    const recommendationService = new RecommendationService('finance');
    const insightService = new InsightService('finance');
    const labelService = new LabelService('finance');
    const predictionService = new PredictionService('finance');

    const labels = await labelService.extractLabels(sampleData);
    const insightResults = await insightService.computeMetrics(sampleData, labels);
    const forecasts = await predictionService.generateForecasts(sampleData, labels, insightResults.metrics);
    const recommendations = await recommendationService.generateRecommendations(
      insightResults.metrics,
      insightResults.insights,
      forecasts,
      labels,
    );

    let hasTriggers = false;
    let hasContext = false;
    let hasImplementationSteps = false;

    for (const rec of recommendations.recommendations) {
      // Check for triggers
      if (rec.trigger) {
        hasTriggers = true;
        console.log(`🔗 Recommendation: ${rec.title}`);
        console.log(`   Triggered by: ${rec.triggered_by}`);
        console.log(`   Condition: ${rec.trigger.condition}`);
        console.log(`   Value: ${rec.trigger.value}, Threshold: ${rec.trigger.threshold}`);
      }

      // Check for context
      if (rec.context) {
        hasContext = true;
      }

      // Check for implementation steps
      if (rec.implementation_steps && rec.implementation_steps.length > 0) {
        hasImplementationSteps = true;
      }
    }

    console.log(`📋 Generated ${recommendations.recommendations.length} recommendations`);
    console.log(`🔗 Recommendations with triggers: ${recommendations.recommendations.filter((r) => r.trigger).length}`);

    if (hasTriggers && hasContext && hasImplementationSteps) {
      console.log('✅ Recommendations include triggers, context, and implementation steps');
    } else {
      console.log('❌ Missing recommendation components:', {
        triggers: hasTriggers,
        context: hasContext,
        implementationSteps: hasImplementationSteps,
      });
    }

    return hasTriggers && hasContext && hasImplementationSteps;
  } catch (error) {
    console.log('❌ Recommendation triggers test failed:', error.message);
    return false;
  }
}

/**
 * Test 6: Health vs Risk Consistency
 */
async function testHealthRiskConsistency() {
  console.log('\n🔐 Test 6: Health vs Risk Consistency');

  try {
    const insightService = new InsightService('finance');
    const labelService = new LabelService('finance');

    const labels = await labelService.extractLabels(sampleData);
    const results = await insightService.computeMetrics(sampleData, labels);

    const { validation } = results;

    console.log(`🏥 Health Score: ${validation.healthScore}`);
    console.log(`⚠️ Risk Level: ${validation.riskLevel}`);
    console.log(`✅ Valid: ${validation.isValid}`);

    if (validation.warnings.length > 0) {
      console.log('⚠️ Warnings:', validation.warnings);
    }

    if (validation.recommendations.length > 0) {
      console.log('💡 Recommendations:', validation.recommendations);
    }

    // Test specific scenarios
    const highHealthLowRisk = validation.healthScore > 80 && validation.riskLevel === 'low';
    const lowHealthHighRisk = validation.healthScore < 60 && validation.riskLevel === 'high';

    if (highHealthLowRisk) {
      console.log('✅ High health score with low risk - consistent');
    } else if (lowHealthHighRisk) {
      console.log('✅ Low health score with high risk - consistent');
    } else if (validation.isValid) {
      console.log('✅ Health and risk levels are consistent');
    } else {
      console.log('⚠️ Health and risk levels may be inconsistent');
    }

    return validation.isValid;
  } catch (error) {
    console.log('❌ Health vs risk consistency test failed:', error.message);
    return false;
  }
}

/**
 * Test 7: Dynamic Narrative Generation
 */
async function testDynamicNarrative() {
  console.log('\n🧠 Test 7: Dynamic Narrative Generation');

  try {
    const narrativeService = new NarrativeService('finance');
    const insightService = new InsightService('finance');
    const labelService = new LabelService('finance');
    const predictionService = new PredictionService('finance');
    const recommendationService = new RecommendationService('finance');

    const labels = await labelService.extractLabels(sampleData);
    const insightResults = await insightService.computeMetrics(sampleData, labels);
    const forecasts = await predictionService.generateForecasts(sampleData, labels, insightResults.metrics);
    const recommendations = await recommendationService.generateRecommendations(
      insightResults.metrics,
      insightResults.insights,
      forecasts,
      labels,
    );

    // Test different tones
    const tones = ['executive', 'analyst', 'technical'];
    let toneVariation = false;
    const narratives = [];

    for (const tone of tones) {
      const narrative = await narrativeService.generateNarratives(
        insightResults.metrics,
        insightResults.insights,
        forecasts,
        recommendations.recommendations,
        labels,
        tone,
      );

      narratives.push(narrative);

      console.log(`📝 ${tone} narrative: ${narrative.main.headline}`);
      console.log(`   Word count: ${narrative.main.wordCount}`);
      console.log(`   AI Generated: ${narrative.metadata.aiGenerated || false}`);
    }

    // Check for tone variation
    const headlines = narratives.map((n) => n.main.headline);
    const uniqueHeadlines = new Set(headlines);
    toneVariation = uniqueHeadlines.size > 1;

    if (toneVariation) {
      console.log('✅ Narrative generation adapts to different tones');
    } else {
      console.log('⚠️ Limited tone variation in narratives');
    }

    // Check for data-driven content
    const hasMetrics = narratives.some((n) => n.main.summary.includes('10') || n.main.summary.includes('record'));

    if (hasMetrics) {
      console.log('✅ Narratives include data-driven content');
    } else {
      console.log('⚠️ Narratives may lack data-driven content');
    }

    return toneVariation && hasMetrics;
  } catch (error) {
    console.log('❌ Dynamic narrative test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Running Comprehensive Test Suite for Sygnify Analytics Hub\n');

  const tests = [
    { name: 'Importance Scoring', fn: testImportanceScoring },
    { name: 'Semantic Labeling', fn: testSemanticLabeling },
    { name: 'Insight Deduplication', fn: testInsightDeduplication },
    { name: 'Forecast Variance', fn: testForecastVariance },
    { name: 'Recommendation Triggers', fn: testRecommendationTriggers },
    { name: 'Health vs Risk Consistency', fn: testHealthRiskConsistency },
    { name: 'Dynamic Narrative', fn: testDynamicNarrative },
  ];

  const results = {};
  let passedTests = 0;

  for (const test of tests) {
    try {
      results[test.name] = await test.fn();
      if (results[test.name]) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test crashed:`, error.message);
      results[test.name] = false;
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');

  for (const [testName, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${testName}: ${result ? 'PASS' : 'FAIL'}`);
  }

  console.log(`\n🎯 Overall: ${passedTests}/${tests.length} tests passed`);

  if (passedTests === tests.length) {
    console.log('🎉 All tests passed! Sygnify Analytics Hub is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the issues above.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testImportanceScoring,
  testSemanticLabeling,
  testInsightDeduplication,
  testForecastVariance,
  testRecommendationTriggers,
  testHealthRiskConsistency,
  testDynamicNarrative,
  runAllTests,
};

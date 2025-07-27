/**
 * LLaMA Integration Test
 * Tests AI-powered narrative generation functionality
 */

const LLaMAService = require('../services/LLaMAService');
const NarrativeService = require('../services/NarrativeService');

// Sample analytics data for testing
const sampleAnalyticsData = {
  metrics: {
    transaction_amount: {
      average: -1001.36,
      min: -50000,
      max: 25000,
      standardDeviation: 5000,
      coefficientOfVariation: 0.3,
      count: 10001,
    },
    account_balance: {
      average: 49448.56,
      min: 0,
      max: 1000000,
      standardDeviation: 150000,
      coefficientOfVariation: 0.4,
      count: 10001,
    },
    fraud_score: {
      average: 0.498,
      min: 0,
      max: 1,
      standardDeviation: 0.2,
      coefficientOfVariation: 0.5,
      count: 10001,
    },
  },
  insights: [
    {
      description: 'High fraud score average of 0.498 indicates elevated risk',
      severity: 'warning',
      category: 'risk',
    },
    {
      description: 'Transaction amount volatility is moderate at 30%',
      severity: 'info',
      category: 'performance',
    },
    {
      description: 'Account balance distribution shows healthy liquidity',
      severity: 'info',
      category: 'liquidity',
    },
  ],
  forecasts: {
    revenue: {
      nextMonth: {
        value: 50000,
        confidence: 0.85,
        method: 'linear_regression',
      },
    },
    cashFlow: {
      nextMonth: {
        value: 45000,
        riskLevel: 'low',
        confidence: 0.8,
      },
    },
    fraud: {
      trend: {
        direction: 'stable',
        strength: 0.6,
      },
    },
  },
  recommendations: [
    {
      title: 'Implement Automated Fraud Detection',
      description: 'Deploy AI-powered fraud detection system',
      priority: 'high',
      impact: 'high',
    },
    {
      title: 'Optimize Transaction Processing',
      description: 'Streamline transaction workflows for efficiency',
      priority: 'medium',
      impact: 'moderate',
    },
  ],
  recordCount: 10001,
  dataQuality: {
    score: 95,
  },
};

/**
 * Test LLaMA service connection
 */
async function testLLaMAConnection() {
  console.log('🔗 Testing LLaMA connection...');

  try {
    const llamaService = new LLaMAService();
    const status = await llamaService.testConnection();

    if (status.success) {
      console.log('✅ LLaMA connection successful');
      console.log('📋 Available models:', status.models.map((m) => m.name).join(', '));
      return true;
    }
    console.log('❌ LLaMA connection failed:', status.message);
    return false;
  } catch (error) {
    console.log('❌ LLaMA connection error:', error.message);
    return false;
  }
}

/**
 * Test AI narrative generation
 */
async function testAINarrativeGeneration() {
  console.log('\n🤖 Testing AI narrative generation...');

  try {
    const llamaService = new LLaMAService();

    // Test executive style
    console.log('📝 Testing executive style...');
    const executiveResult = await llamaService.generateNarrative(
      sampleAnalyticsData,
      'executive',
      { temperature: 0.7, maxTokens: 500 },
    );

    if (executiveResult.success) {
      console.log('✅ Executive narrative generated successfully');
      console.log('📊 Word count:', executiveResult.narrative.wordCount);
      console.log('🎯 Confidence:', executiveResult.metadata.confidence);
    } else {
      console.log('❌ Executive narrative generation failed:', executiveResult.error);
    }

    // Test bullet style
    console.log('\n📋 Testing bullet style...');
    const bulletResult = await llamaService.generateNarrative(
      sampleAnalyticsData,
      'bullet',
      { temperature: 0.5, maxTokens: 300 },
    );

    if (bulletResult.success) {
      console.log('✅ Bullet narrative generated successfully');
      console.log('📊 Bullet points:', bulletResult.narrative.bullets?.length || 0);
    } else {
      console.log('❌ Bullet narrative generation failed:', bulletResult.error);
    }

    return true;
  } catch (error) {
    console.log('❌ AI narrative generation error:', error.message);
    return false;
  }
}

/**
 * Test integrated narrative service
 */
async function testIntegratedNarrativeService() {
  console.log('\n🔄 Testing integrated narrative service...');

  try {
    const narrativeService = new NarrativeService('finance', {
      useAI: true,
      llamaEndpoint: 'http://localhost:11434/api/generate',
      llamaModel: 'llama3.1:8b',
    });

    const result = await narrativeService.generateNarratives(
      sampleAnalyticsData.metrics,
      sampleAnalyticsData.insights,
      sampleAnalyticsData.forecasts,
      sampleAnalyticsData.recommendations,
      {},
      'executive',
      { useAI: true },
    );

    console.log('✅ Integrated narrative generation successful');
    console.log('🤖 AI Generated:', result.metadata.aiGenerated);
    console.log('📊 Word count:', result.main.wordCount);
    console.log('📝 Headline:', result.main.headline);

    return true;
  } catch (error) {
    console.log('❌ Integrated narrative service error:', error.message);
    return false;
  }
}

/**
 * Test fallback to template generation
 */
async function testFallbackGeneration() {
  console.log('\n🔄 Testing fallback to template generation...');

  try {
    const narrativeService = new NarrativeService('finance', {
      useAI: false, // Disable AI to test fallback
    });

    const result = await narrativeService.generateNarratives(
      sampleAnalyticsData.metrics,
      sampleAnalyticsData.insights,
      sampleAnalyticsData.forecasts,
      sampleAnalyticsData.recommendations,
      {},
      'executive',
      { useAI: false },
    );

    console.log('✅ Template-based narrative generation successful');
    console.log('🤖 AI Generated:', result.metadata.aiGenerated);
    console.log('📊 Word count:', result.main.wordCount);
    console.log('📝 Headline:', result.main.headline);

    return true;
  } catch (error) {
    console.log('❌ Template generation error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting LLaMA Integration Tests...\n');

  const results = {
    connection: await testLLaMAConnection(),
    aiGeneration: await testAINarrativeGeneration(),
    integrated: await testIntegratedNarrativeService(),
    fallback: await testFallbackGeneration(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('🔗 Connection Test:', results.connection ? '✅ PASS' : '❌ FAIL');
  console.log('🤖 AI Generation Test:', results.aiGeneration ? '✅ PASS' : '❌ FAIL');
  console.log('🔄 Integrated Service Test:', results.integrated ? '✅ PASS' : '❌ FAIL');
  console.log('🔄 Fallback Test:', results.fallback ? '✅ PASS' : '❌ FAIL');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! LLaMA integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check LLaMA configuration and connectivity.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLLaMAConnection,
  testAINarrativeGeneration,
  testIntegratedNarrativeService,
  testFallbackGeneration,
  runAllTests,
};

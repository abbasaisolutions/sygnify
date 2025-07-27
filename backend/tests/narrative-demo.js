/**
 * Narrative Generation Demo
 * Demonstrates the refined LLaMA 3 integration with structured JSON prompts
 */

const LLaMAService = require('../services/LLaMAService');

// Sample structured data matching the refined format with consistent scoring
const sampleStructuredData = {
  domain: 'Finance',
  records_analyzed: 10001,
  dimensions: 16,
  data_quality_score: 95,
  financial_health_score: 72, // Adjusted for consistency with HIGH risk
  risk_level: 'HIGH',
  prediction_confidence: 'B',
  performance_grade: 'C', // Adjusted for consistency
  avg_transaction_amount: -1001.36,
  avg_account_balance: 49448.56,
  avg_fraud_score: 0.498,
  liquidity: {
    score: 90,
    grade: 'A',
    insight: 'Strong cash flow patterns',
  },
  profitability: {
    score: 65, // Adjusted for negative cash flows
    grade: 'C',
    insight: 'Revenue optimization needed due to net outflows',
  },
  efficiency: {
    score: 85,
    grade: 'A',
    insight: 'Good operational efficiency',
  },
  forecast: {
    revenue_next_month: 50000,
    revenue_next_quarter: 150000,
    cashflow_next_month: 45000,
    revenue_confidence: 'high',
    cashflow_confidence: 'medium',
    cashflow_risk: 'low',
    revenue_trend: 'increasing',
  },
  recommendations: [
    {
      action: 'Implement automated fraud detection',
      priority: 'high',
      impact: 'high',
      rationale: 'Fraud scores of 49.8% indicate elevated risk requiring immediate attention',
    },
    {
      action: 'Optimize transaction processing',
      priority: 'medium',
      impact: 'medium',
      rationale: 'Net negative cash flows of $1,001.36 suggest process optimization is needed',
    },
  ],
  key_insights: [
    'Elevated fraud risk with 49.8% average score',
    'Net negative cash flows indicate revenue optimization needed',
    'Strong liquidity position with 90% score',
  ],
  cash_flow_analysis: {
    pattern: 'net_outflow',
    severity: 'medium',
    ratio: 0.02,
    implication: 'Net negative cash flows of $1,001.36 suggest revenue optimization is needed',
  },
  risk_indicators: [
    'Elevated fraud risk (49.8% average score)',
    'Net negative cash flows ($1,001.36 average)',
  ],
  business_implications: [
    'Fraud prevention should be prioritized due to 49.8% average risk score',
    'Revenue optimization needed due to net negative cash flows',
    'Positive revenue trend expected, supporting growth initiatives',
  ],
};

/**
 * Demo executive summary generation
 */
async function demoExecutiveSummary() {
  console.log('🎯 Demo: Executive Summary Generation');
  console.log('=====================================\n');

  try {
    const llamaService = new LLaMAService({
      apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      model: process.env.LLAMA_MODEL || 'llama3.1:8b',
      temperature: 0.7,
      maxTokens: 1500,
    });

    console.log('📊 Input Data:');
    console.log(JSON.stringify(sampleStructuredData, null, 2));
    console.log('\n🤖 Generating AI Narrative...\n');

    const result = await llamaService.generateNarrative(
      sampleStructuredData,
      'executive',
      {
        customInstructions: 'Focus on business impact and actionable insights',
        temperature: 0.7,
        maxTokens: 1500,
      },
    );

    if (result.success) {
      console.log('✅ AI-Generated Executive Summary:');
      console.log('==================================');
      console.log(result.narrative.content || result.narrative.summary || 'No content generated');
      console.log('\n📈 Metadata:');
      console.log(`- Model: ${result.metadata.model}`);
      console.log(`- Confidence: ${result.metadata.confidence}`);
      console.log(`- Word Count: ${result.narrative.wordCount || 0}`);
      console.log(`- Generation Time: ${result.metadata.generationTime || 0}ms`);
    } else {
      console.log('❌ AI Generation Failed:', result.error);
      console.log('🔄 Falling back to template-based generation...');

      // Fallback narrative
      const fallback = generateFallbackNarrative(sampleStructuredData);
      console.log('\n📝 Fallback Narrative:');
      console.log(fallback.content);
    }
  } catch (error) {
    console.log('❌ Demo failed:', error.message);
  }
}

/**
 * Demo different narrative styles
 */
async function demoNarrativeStyles() {
  console.log('\n🎨 Demo: Different Narrative Styles');
  console.log('===================================\n');

  const styles = ['executive', 'bullet', 'narrative', 'technical'];
  const llamaService = new LLaMAService({
    apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
    model: process.env.LLAMA_MODEL || 'llama3.1:8b',
  });

  for (const style of styles) {
    try {
      console.log(`📝 ${style.toUpperCase()} Style:`);
      console.log('-'.repeat(style.length + 8));

      const result = await llamaService.generateNarrative(
        sampleStructuredData,
        style,
        { maxTokens: 800 },
      );

      if (result.success) {
        const content = result.narrative.content || result.narrative.summary || '';
        console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        console.log(`Word Count: ${result.narrative.wordCount || 0}`);
      } else {
        console.log('Generation failed for this style');
      }

      console.log('\n');
    } catch (error) {
      console.log(`Error generating ${style} style:`, error.message);
    }
  }
}

/**
 * Demo API endpoint usage
 */
function demoAPIUsage() {
  console.log('🌐 Demo: API Endpoint Usage');
  console.log('==========================\n');

  console.log('POST /api/analyze/narrative/generate');
  console.log('Content-Type: application/json');
  console.log('\nRequest Body:');
  console.log(JSON.stringify({
    data: sampleStructuredData,
    style: 'executive',
    customInstructions: 'Focus on business impact and actionable insights',
    temperature: 0.7,
    maxTokens: 1500,
  }, null, 2));

  console.log('\nExpected Response:');
  console.log(JSON.stringify({
    success: true,
    narrative: {
      content: 'Sygnify analyzed 10,001 financial transactions...',
      style: 'executive',
      wordCount: 150,
      sections: {
        'Executive Summary': '...',
        'Key Risks & Opportunities': '...',
        'Strategic Recommendations': '...',
      },
      keyPoints: [
        'Strong liquidity with A grade performance',
        'High risk level requires attention',
        'Revenue forecast shows positive trend',
      ],
      recommendations: [
        'Implement automated fraud detection',
        'Optimize transaction processing',
      ],
    },
    metadata: {
      aiGenerated: true,
      model: 'llama3.1:8b',
      confidence: 0.85,
      generationTime: 2500,
      tokensUsed: 450,
    },
    data: {
      recordCount: 10001,
      domain: 'Finance',
      healthScore: 85,
      riskLevel: 'HIGH',
    },
  }, null, 2));
}

/**
 * Generate fallback narrative
 */
function generateFallbackNarrative(data) {
  const recordCount = data.records_analyzed || 0;
  const healthScore = data.financial_health_score || 0;
  const riskLevel = data.risk_level || 'MEDIUM';
  const avgFraudScore = data.avg_fraud_score || 0;

  return {
    content: `Analysis of ${recordCount} financial records reveals a health score of ${healthScore} with ${riskLevel} risk level. The average fraud score of ${avgFraudScore.toFixed(3)} indicates ${avgFraudScore > 0.5 ? 'elevated' : 'acceptable'} risk exposure. Liquidity performance is strong (Grade A), while profitability shows moderate performance (Grade B). Revenue forecasts are optimistic at $50,000 for next month with high confidence. Key recommendations include implementing automated fraud detection and optimizing transaction processing to enhance operational efficiency and reduce risk exposure.`,
    wordCount: 85,
  };
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('🚀 Sygnify Analytics Hub - LLaMA 3 Narrative Generation Demo\n');

  // Test LLaMA connection first
  const llamaService = new LLaMAService();
  const connectionStatus = await llamaService.testConnection();

  if (!connectionStatus.success) {
    console.log('❌ LLaMA connection failed:', connectionStatus.message);
    console.log('💡 Make sure Ollama is running: ollama serve');
    console.log('💡 Pull the model: ollama pull llama3.1:8b');
    return;
  }

  console.log('✅ LLaMA connection successful\n');

  // Run demos
  await demoExecutiveSummary();
  await demoNarrativeStyles();
  demoAPIUsage();

  console.log('🎉 Demo completed!');
  console.log('\n💡 To use in your application:');
  console.log('1. Start the backend: npm start');
  console.log('2. Send POST request to /api/analyze/narrative/generate');
  console.log('3. Include structured JSON data in request body');
}

// Run demos if this file is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

module.exports = {
  demoExecutiveSummary,
  demoNarrativeStyles,
  demoAPIUsage,
  generateFallbackNarrative,
  runAllDemos,
};

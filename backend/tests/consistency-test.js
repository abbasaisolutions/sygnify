/**
 * Consistency Test for Health Score and Risk Level
 * Validates that the scoring system is consistent and narratives are specific
 */

const LLaMAService = require('../services/LLaMAService');

/**
 * Test health score and risk level consistency
 */
async function testHealthRiskConsistency() {
    console.log('🔐 Test: Health Score and Risk Level Consistency');
    console.log('================================================\n');
    
    const testCases = [
        {
            name: 'High Risk Scenario',
            data: {
                avg_fraud_score: 0.8,
                avg_transaction_amount: -2000,
                financial_health_score: 85,
                risk_level: 'HIGH'
            },
            expected: {
                healthScore: 'reduced',
                riskLevel: 'HIGH',
                consistency: true
            }
        },
        {
            name: 'Low Risk Scenario',
            data: {
                avg_fraud_score: 0.2,
                avg_transaction_amount: 1000,
                financial_health_score: 85,
                risk_level: 'LOW'
            },
            expected: {
                healthScore: 'maintained',
                riskLevel: 'LOW',
                consistency: true
            }
        },
        {
            name: 'Medium Risk Scenario',
            data: {
                avg_fraud_score: 0.5,
                avg_transaction_amount: -500,
                financial_health_score: 75,
                risk_level: 'MEDIUM'
            },
            expected: {
                healthScore: 'adjusted',
                riskLevel: 'MEDIUM',
                consistency: true
            }
        }
    ];
    
    let allConsistent = true;
    
    for (const testCase of testCases) {
        console.log(`📊 Testing: ${testCase.name}`);
        
        const llamaService = new LLaMAService();
        const adjustedData = llamaService.prepareStructuredData({
            metrics: {
                fraud_score: { average: testCase.data.avg_fraud_score },
                amount: { average: testCase.data.avg_transaction_amount }
            },
            insights: [],
            forecasts: {},
            recommendations: [],
            labels: {},
            recordCount: 1000,
            dataQuality: { score: 95 }
        });
        
        const healthScore = adjustedData.financial_health_score;
        const riskLevel = adjustedData.risk_level;
        
        console.log(`   Original Health Score: ${testCase.data.financial_health_score}`);
        console.log(`   Adjusted Health Score: ${healthScore}`);
        console.log(`   Risk Level: ${riskLevel}`);
        
        // Check consistency
        const isConsistent = checkConsistency(healthScore, riskLevel, testCase.data.avg_fraud_score);
        console.log(`   Consistency: ${isConsistent ? '✅ PASS' : '❌ FAIL'}`);
        
        if (!isConsistent) {
            allConsistent = false;
        }
        
        console.log('');
    }
    
    return allConsistent;
}

/**
 * Check if health score and risk level are consistent
 */
function checkConsistency(healthScore, riskLevel, fraudScore) {
    // High fraud score should not have high health score
    if (fraudScore > 0.7 && healthScore > 80) {
        return false;
    }
    
    // High risk should not have excellent health
    if (riskLevel === 'HIGH' && healthScore > 85) {
        return false;
    }
    
    // Low risk should not have poor health
    if (riskLevel === 'LOW' && healthScore < 60) {
        return false;
    }
    
    return true;
}

/**
 * Test narrative specificity
 */
async function testNarrativeSpecificity() {
    console.log('🤖 Test: Narrative Specificity and Quality');
    console.log('==========================================\n');
    
    const testData = {
        domain: "Finance",
        records_analyzed: 10001,
        financial_health_score: 72,
        risk_level: "HIGH",
        avg_fraud_score: 0.498,
        avg_transaction_amount: -1001.36,
        liquidity: { score: 90, grade: "A", insight: "Strong cash flow patterns" },
        profitability: { score: 65, grade: "C", insight: "Revenue optimization needed" },
        efficiency: { score: 85, grade: "A", insight: "Good operational efficiency" },
        forecast: {
            revenue_next_month: 50000,
            revenue_confidence: "high",
            revenue_trend: "increasing"
        },
        recommendations: [
            {
                action: "Implement automated fraud detection",
                priority: "high",
                impact: "high",
                rationale: "Fraud scores of 49.8% indicate elevated risk requiring immediate attention"
            }
        ],
        key_insights: [
            "Elevated fraud risk with 49.8% average score",
            "Net negative cash flows indicate revenue optimization needed"
        ],
        cash_flow_analysis: {
            pattern: "net_outflow",
            implication: "Net negative cash flows of $1,001.36 suggest revenue optimization is needed"
        },
        risk_indicators: [
            "Elevated fraud risk (49.8% average score)",
            "Net negative cash flows ($1,001.36 average)"
        ]
    };
    
    try {
        const llamaService = new LLaMAService({
            apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
            model: process.env.LLAMA_MODEL || 'llama3.1:8b',
            temperature: 0.7,
            maxTokens: 1000
        });
        
        console.log('📝 Generating AI narrative with enhanced prompts...\n');
        
        const result = await llamaService.generateNarrative(testData, 'executive');
        
        if (result.success) {
            const content = result.narrative.content || result.narrative.summary || '';
            
            console.log('✅ Generated Narrative:');
            console.log('======================');
            console.log(content);
            console.log('\n');
            
            // Check for specific elements
            const checks = {
                hasSpecificFraudScore: content.includes('49.8') || content.includes('0.498'),
                hasSpecificCashFlow: content.includes('$1,001') || content.includes('negative cash'),
                hasConcreteRecommendations: content.includes('fraud detection') || content.includes('optimize'),
                avoidsVagueLanguage: !content.includes('opportunities for optimization') && !content.includes('analyzed 5 key insights'),
                hasBusinessContext: content.includes('risk') || content.includes('revenue') || content.includes('cash flow')
            };
            
            console.log('🔍 Specificity Checks:');
            console.log(`   Specific fraud score mentioned: ${checks.hasSpecificFraudScore ? '✅' : '❌'}`);
            console.log(`   Specific cash flow mentioned: ${checks.hasSpecificCashFlow ? '✅' : '❌'}`);
            console.log(`   Concrete recommendations: ${checks.hasConcreteRecommendations ? '✅' : '❌'}`);
            console.log(`   Avoids vague language: ${checks.avoidsVagueLanguage ? '✅' : '❌'}`);
            console.log(`   Has business context: ${checks.hasBusinessContext ? '✅' : '❌'}`);
            
            const specificityScore = Object.values(checks).filter(Boolean).length;
            console.log(`\n📊 Specificity Score: ${specificityScore}/5`);
            
            return specificityScore >= 4; // At least 4 out of 5 checks should pass
            
        } else {
            console.log('❌ AI generation failed:', result.error);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Narrative specificity test failed:', error.message);
        return false;
    }
}

/**
 * Run all consistency tests
 */
async function runConsistencyTests() {
    console.log('🧪 Running Consistency and Quality Tests\n');
    
    const healthRiskTest = await testHealthRiskConsistency();
    const narrativeTest = await testNarrativeSpecificity();
    
    console.log('📊 Test Results Summary:');
    console.log('========================');
    console.log(`Health/Risk Consistency: ${healthRiskTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Narrative Specificity: ${narrativeTest ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallResult = healthRiskTest && narrativeTest;
    console.log(`\n🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallResult) {
        console.log('\n🎉 The system now provides consistent scoring and specific, business-grade narratives!');
    } else {
        console.log('\n⚠️ Some issues remain. Review the test results above.');
    }
    
    return overallResult;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runConsistencyTests().catch(console.error);
}

module.exports = {
    testHealthRiskConsistency,
    testNarrativeSpecificity,
    runConsistencyTests
}; 
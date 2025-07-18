const MLSummaryService = require('../services/MLSummaryService');

/**
 * Simple ML Summary Demo
 * Demonstrates the core functionality without complex dependencies
 */
async function simpleMLDemo() {
    console.log('🧠 Simple ML Summary Demo');
    console.log('=' .repeat(40));
    
    // Initialize the service
    const mlSummaryService = new MLSummaryService('finance');
    
    // Realistic financial data (matching your current analysis)
    const metrics = {
        amount: {
            count: 10001,
            average: -1001.36,
            min: -50000,
            max: 25000,
            standardDeviation: 8500.25,
            coefficientOfVariation: 0.85,
            range: 75000,
            median: -750.50
        },
        current_balance: {
            count: 10001,
            average: 49448.56,
            min: 1000,
            max: 150000,
            standardDeviation: 25000.75,
            coefficientOfVariation: 0.51,
            range: 149000,
            median: 45000
        },
        fraud_score: {
            count: 10001,
            average: 0.498,
            min: 0.01,
            max: 0.99,
            standardDeviation: 0.25,
            coefficientOfVariation: 0.50,
            range: 0.98,
            median: 0.45
        }
    };

    const insights = [
        {
            category: 'cash_flow',
            severity: 'warning',
            description: 'Net negative cash flow pattern detected',
            metric: 'amount',
            value: -1001.36
        },
        {
            category: 'risk',
            severity: 'warning',
            description: 'Elevated fraud risk with 49.8% average score',
            metric: 'fraud_score',
            value: 0.498
        },
        {
            category: 'liquidity',
            severity: 'info',
            description: 'Healthy account balance levels maintained',
            metric: 'current_balance',
            value: 49448.56
        }
    ];

    try {
        console.log('📊 Input Data:');
        console.log(`   Records: ${metrics.amount.count.toLocaleString()}`);
        console.log(`   Average Transaction: $${metrics.amount.average.toFixed(2)}`);
        console.log(`   Average Balance: $${metrics.current_balance.average.toFixed(2)}`);
        console.log(`   Average Fraud Score: ${(metrics.fraud_score.average * 100).toFixed(1)}%`);
        console.log();

        console.log('🧠 Generating ML-Powered Summary...');
        const result = await mlSummaryService.generateMLSummary(
            metrics,
            insights,
            {}, // forecasts
            [], // recommendations
            {}  // labels
        );

        if (result.success) {
            console.log('✅ SUCCESS! ML Summary Generated:');
            console.log();
            
            console.log('📝 COMPREHENSIVE SUMMARY:');
            console.log('=' .repeat(50));
            console.log(result.summary);
            console.log();
            
            console.log('⚠️ RISK ASSESSMENT:');
            console.log('-'.repeat(20));
            console.log(`Level: ${result.riskProfile.level.toUpperCase()}`);
            console.log(`Score: ${result.riskProfile.score.toFixed(0)}/100`);
            console.log(`Factors: ${result.riskProfile.factors.join(', ')}`);
            console.log();
            
            console.log('🔍 PATTERN ANALYSIS:');
            console.log('-'.repeat(20));
            console.log(`Cash Flow: ${result.patterns.cashFlow.description} (${result.patterns.cashFlow.severity})`);
            console.log(`Risk: ${result.patterns.risk.description} (${result.patterns.risk.severity})`);
            console.log(`Balance: ${result.patterns.balance.description} (${result.patterns.balance.severity})`);
            console.log(`Volatility: ${result.patterns.volatility.description} (${result.patterns.volatility.severity})`);
            console.log();
            
            console.log('📈 PERFORMANCE:');
            console.log('-'.repeat(15));
            console.log(`Current Grade: ${result.performanceProfile.current.grade} (${result.performanceProfile.current.score}/100)`);
            console.log(`Trend: ${result.performanceProfile.trends.direction}`);
            console.log(`Outlook: ${result.performanceProfile.outlook}`);
            console.log();
            
            console.log('⚙️ OPERATIONAL INSIGHTS:');
            console.log('-'.repeat(25));
            console.log(`Efficiency: ${result.operationalInsights.efficiency}/100`);
            console.log(`Data Quality: ${result.operationalInsights.quality}/100`);
            console.log(`Anomalies: ${result.operationalInsights.anomalies}`);
            console.log(`Opportunities: ${result.operationalInsights.opportunities.join(', ')}`);
            console.log();
            
            console.log('🎯 KEY BENEFITS:');
            console.log('-'.repeat(15));
            console.log('✅ One-paragraph comprehensive analysis');
            console.log('✅ Pattern recognition across all metrics');
            console.log('✅ Risk assessment with scoring');
            console.log('✅ Performance evaluation and grading');
            console.log('✅ Operational efficiency analysis');
            console.log('✅ Actionable insights and opportunities');
            console.log();
            
            console.log('🚀 INTEGRATION READY!');
            console.log('This ML summary can be easily integrated into:');
            console.log('  📊 Your existing analysis pipeline');
            console.log('  🌐 API endpoints (/api/analyze/ml-summary)');
            console.log('  ⚛️ React frontend components');
            console.log('  📈 Business intelligence dashboards');
            console.log('  📧 Automated reporting systems');
            
        } else {
            console.log('❌ ML Summary generation failed:');
            console.log(`Error: ${result.error}`);
            console.log(`Fallback: ${result.summary}`);
        }
        
    } catch (error) {
        console.error('❌ Demo error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the demo
if (require.main === module) {
    simpleMLDemo().catch(console.error);
}

module.exports = { simpleMLDemo }; 
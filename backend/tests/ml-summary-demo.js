const MLSummaryService = require('../services/MLSummaryService');

/**
 * ML-Powered Summary Service Demo
 * Demonstrates comprehensive analysis and one-paragraph summary generation
 */
async function demoMLSummary() {
    console.log('🧠 ML-Powered Summary Service Demo');
    console.log('=' .repeat(60));
    
    // Initialize ML Summary Service
    const mlSummaryService = new MLSummaryService('finance');
    
    // Sample financial metrics (realistic data)
    const sampleMetrics = {
        amount: {
            count: 10001,
            average: -1001.36,
            min: -50000,
            max: 25000,
            standardDeviation: 8500.25,
            coefficientOfVariation: 0.85,
            range: 75000,
            median: -750.50,
            quartiles: { q1: -2500, q2: -750.50, q3: 500 }
        },
        current_balance: {
            count: 10001,
            average: 49448.56,
            min: 1000,
            max: 150000,
            standardDeviation: 25000.75,
            coefficientOfVariation: 0.51,
            range: 149000,
            median: 45000,
            quartiles: { q1: 25000, q2: 45000, q3: 75000 }
        },
        fraud_score: {
            count: 10001,
            average: 0.498,
            min: 0.01,
            max: 0.99,
            standardDeviation: 0.25,
            coefficientOfVariation: 0.50,
            range: 0.98,
            median: 0.45,
            quartiles: { q1: 0.25, q2: 0.45, q3: 0.75 }
        },
        transaction_type: {
            count: 10001,
            uniqueCount: 8,
            valueCounts: {
                'Purchase': 3500,
                'Transfer': 2500,
                'Withdrawal': 2000,
                'Deposit': 1500,
                'Bill Pay': 300,
                'Refund': 150,
                'Fee': 50,
                'Other': 1
            },
            mostCommon: 'Purchase',
            leastCommon: 'Other',
            diversity: 0.0008
        }
    };

    // Sample insights
    const sampleInsights = [
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
        },
        {
            category: 'operations',
            severity: 'info',
            description: 'High transaction volume with diverse transaction types',
            metric: 'transaction_type',
            value: 'Purchase'
        }
    ];

    // Sample forecasts
    const sampleForecasts = {
        revenue: {
            nextMonth: 50000,
            nextQuarter: 150000,
            confidence: 'high',
            trend: 'positive',
            variance: 0.15,
            confidenceIntervals: { lower: 42500, upper: 57500 },
            modelUsed: 'linear_regression'
        },
        cashFlow: {
            nextMonth: 45000,
            riskLevel: 'low',
            confidence: 'medium',
            trend: 'positive',
            variance: 0.25,
            confidenceIntervals: { lower: 33750, upper: 56250 },
            modelUsed: 'moving_average'
        }
    };

    // Sample recommendations
    const sampleRecommendations = [
        {
            title: 'Optimize Transaction Processing',
            description: 'Implement automated fraud detection and transaction categorization',
            priority: 'high',
            impact: 'High impact on operational efficiency',
            triggered_by: 'High transaction volume with fraud risk'
        },
        {
            title: 'Cash Flow Management',
            description: 'Develop strategies to improve net cash flow position',
            priority: 'medium',
            impact: 'Medium impact on financial health',
            triggered_by: 'Net negative cash flow pattern'
        }
    ];

    // Sample labels
    const sampleLabels = {
        amount: {
            semantic: 'Transaction Amount (Revenue/Expense)',
            category: 'Revenue Metric',
            importance: 100,
            type: 'numeric'
        },
        current_balance: {
            semantic: 'Account Balance',
            category: 'Liquidity Metric',
            importance: 90,
            type: 'numeric'
        },
        fraud_score: {
            semantic: 'Fraud Score',
            category: 'Risk Metric',
            importance: 85,
            type: 'numeric'
        },
        transaction_type: {
            semantic: 'Transaction Type',
            category: 'Transaction Type',
            importance: 80,
            type: 'categorical'
        }
    };

    console.log('📊 Sample Data Overview:');
    console.log(`   - Records: ${sampleMetrics.amount.count.toLocaleString()}`);
    console.log(`   - Average Transaction: $${sampleMetrics.amount.average.toFixed(2)}`);
    console.log(`   - Average Balance: $${sampleMetrics.current_balance.average.toFixed(2)}`);
    console.log(`   - Average Fraud Score: ${(sampleMetrics.fraud_score.average * 100).toFixed(1)}%`);
    console.log(`   - Transaction Types: ${sampleMetrics.transaction_type.uniqueCount}`);
    console.log();

    // Generate ML-powered summary
    console.log('🧠 Generating ML-Powered Summary...');
    console.log('-'.repeat(40));
    
    const mlSummary = await mlSummaryService.generateMLSummary(
        sampleMetrics,
        sampleInsights,
        sampleForecasts,
        sampleRecommendations,
        sampleLabels
    );

    if (mlSummary.success) {
        console.log('✅ ML Summary Generated Successfully!');
        console.log();
        
        // Display the comprehensive summary
        console.log('📝 COMPREHENSIVE ML-POWERED SUMMARY:');
        console.log('=' .repeat(60));
        console.log(mlSummary.summary);
        console.log();
        
        // Display pattern analysis
        console.log('🔍 PATTERN ANALYSIS:');
        console.log('-'.repeat(30));
        console.log(`Cash Flow: ${mlSummary.patterns.cashFlow.description} (${mlSummary.patterns.cashFlow.severity} severity)`);
        console.log(`Risk Level: ${mlSummary.patterns.risk.description} (${mlSummary.patterns.risk.severity} severity)`);
        console.log(`Volatility: ${mlSummary.patterns.volatility.description} (${mlSummary.patterns.volatility.severity} severity)`);
        console.log(`Balance Health: ${mlSummary.patterns.balance.description} (${mlSummary.patterns.balance.severity} severity)`);
        console.log(`Transaction Pattern: ${mlSummary.patterns.transaction.implications}`);
        console.log();
        
        // Display risk profile
        console.log('⚠️ RISK PROFILE:');
        console.log('-'.repeat(20));
        console.log(`Overall Risk Level: ${mlSummary.riskProfile.level.toUpperCase()}`);
        console.log(`Risk Score: ${mlSummary.riskProfile.score.toFixed(0)}/100`);
        console.log(`Risk Factors: ${mlSummary.riskProfile.factors.join(', ')}`);
        console.log();
        
        // Display performance profile
        console.log('📈 PERFORMANCE PROFILE:');
        console.log('-'.repeat(25));
        console.log(`Current Performance: ${mlSummary.performanceProfile.current.grade} (${mlSummary.performanceProfile.current.score}/100)`);
        console.log(`Trend Direction: ${mlSummary.performanceProfile.trends.direction}`);
        console.log(`Future Outlook: ${mlSummary.performanceProfile.outlook}`);
        console.log();
        
        // Display operational insights
        console.log('⚙️ OPERATIONAL INSIGHTS:');
        console.log('-'.repeat(25));
        console.log(`Efficiency Score: ${mlSummary.operationalInsights.efficiency}/100`);
        console.log(`Data Quality: ${mlSummary.operationalInsights.quality}/100`);
        console.log(`Anomalies Detected: ${mlSummary.operationalInsights.anomalies}`);
        console.log(`Opportunities: ${mlSummary.operationalInsights.opportunities.join(', ')}`);
        console.log();
        
        // Display correlations
        if (Object.keys(mlSummary.correlations).length > 0) {
            console.log('🔗 KEY CORRELATIONS:');
            console.log('-'.repeat(20));
            Object.entries(mlSummary.correlations).forEach(([key, correlation]) => {
                console.log(`${key}: ${correlation.strength} correlation (${correlation.value.toFixed(3)})`);
                console.log(`   ${correlation.interpretation}`);
            });
            console.log();
        }
        
        // Display metadata
        console.log('📋 ANALYSIS METADATA:');
        console.log('-'.repeat(20));
        console.log(`Analysis Type: ${mlSummary.metadata.analysisType}`);
        console.log(`Patterns Detected: ${mlSummary.metadata.patternsDetected}`);
        console.log(`Correlations Found: ${mlSummary.metadata.correlationsFound}`);
        console.log(`Generated At: ${mlSummary.metadata.generatedAt}`);
        console.log();
        
    } else {
        console.log('❌ ML Summary Generation Failed:');
        console.log(`Error: ${mlSummary.error}`);
        console.log(`Fallback: ${mlSummary.summary}`);
    }

    // Demonstrate different scenarios
    console.log('🎯 SCENARIO ANALYSIS:');
    console.log('=' .repeat(60));
    
    // Scenario 1: Positive cash flow
    console.log('📈 Scenario 1: Positive Cash Flow');
    const positiveMetrics = { ...sampleMetrics };
    positiveMetrics.amount.average = 1500.50;
    positiveMetrics.amount.min = -10000;
    positiveMetrics.amount.max = 50000;
    
    const positiveSummary = await mlSummaryService.generateMLSummary(
        positiveMetrics,
        sampleInsights,
        sampleForecasts,
        sampleRecommendations,
        sampleLabels
    );
    
    if (positiveSummary.success) {
        console.log('Summary: ' + positiveSummary.summary.substring(0, 150) + '...');
    }
    console.log();

    // Scenario 2: High fraud risk
    console.log('🚨 Scenario 2: High Fraud Risk');
    const highRiskMetrics = { ...sampleMetrics };
    highRiskMetrics.fraud_score.average = 0.85;
    highRiskMetrics.fraud_score.max = 0.99;
    
    const highRiskSummary = await mlSummaryService.generateMLSummary(
        highRiskMetrics,
        sampleInsights,
        sampleForecasts,
        sampleRecommendations,
        sampleLabels
    );
    
    if (highRiskSummary.success) {
        console.log('Summary: ' + highRiskSummary.summary.substring(0, 150) + '...');
    }
    console.log();

    // Scenario 3: Low balance
    console.log('💰 Scenario 3: Low Balance');
    const lowBalanceMetrics = { ...sampleMetrics };
    lowBalanceMetrics.current_balance.average = 2500.00;
    lowBalanceMetrics.current_balance.max = 10000;
    
    const lowBalanceSummary = await mlSummaryService.generateMLSummary(
        lowBalanceMetrics,
        sampleInsights,
        sampleForecasts,
        sampleRecommendations,
        sampleLabels
    );
    
    if (lowBalanceSummary.success) {
        console.log('Summary: ' + lowBalanceSummary.summary.substring(0, 150) + '...');
    }
    console.log();

    console.log('🎉 ML Summary Demo Complete!');
    console.log();
    console.log('💡 Key Features Demonstrated:');
    console.log('   ✅ Pattern recognition across multiple metrics');
    console.log('   ✅ Risk assessment and scoring');
    console.log('   ✅ Performance evaluation');
    console.log('   ✅ Operational efficiency analysis');
    console.log('   ✅ Correlation detection');
    console.log('   ✅ Contextual interpretation');
    console.log('   ✅ One-paragraph comprehensive summary');
    console.log();
    console.log('🚀 Next Steps:');
    console.log('   1. Integrate with your analysis pipeline');
    console.log('   2. Customize patterns for your domain');
    console.log('   3. Add more sophisticated ML algorithms');
    console.log('   4. Implement real-time monitoring');
}

// Run the demo
if (require.main === module) {
    demoMLSummary().catch(console.error);
}

module.exports = { demoMLSummary }; 
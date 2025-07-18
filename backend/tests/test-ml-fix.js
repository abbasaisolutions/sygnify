const MLSummaryService = require('../services/MLSummaryService');

async function testMLFix() {
    console.log('🧪 Testing ML Summary Service Fix...');
    
    const mlSummaryService = new MLSummaryService('finance');
    
    // Test with the actual data structure from your analysis
    const testMetrics = {
        amount: {
            count: 10001,
            average: -1001.36,
            min: -50000,
            max: 25000,
            standardDeviation: 8500.25
        },
        current_balance: {
            count: 10001,
            average: 49448.56,
            min: 1000,
            max: 150000,
            standardDeviation: 25000.75
        },
        fraud_score: {
            count: 10001,
            average: 0.498,
            min: 0.01,
            max: 0.99,
            standardDeviation: 0.25
        }
    };

    const testInsights = [
        {
            category: 'cash_flow',
            severity: 'warning',
            description: 'Net negative cash flow pattern detected',
            metric: 'amount',
            value: -1001.36
        }
    ];

    try {
        console.log('📊 Testing with valid data...');
        const result = await mlSummaryService.generateMLSummary(
            testMetrics,
            testInsights,
            {},
            [],
            {}
        );

        if (result.success) {
            console.log('✅ ML Summary generated successfully!');
            console.log('Summary:', result.summary.substring(0, 100) + '...');
            console.log('Risk Level:', result.riskProfile.level);
            console.log('Risk Score:', result.riskProfile.score);
        } else {
            console.log('❌ ML Summary failed:', result.error);
        }

        // Test with empty/invalid data
        console.log('\n📊 Testing with empty data...');
        const emptyResult = await mlSummaryService.generateMLSummary(
            {},
            [],
            {},
            [],
            {}
        );

        if (emptyResult.success) {
            console.log('✅ ML Summary with empty data generated successfully!');
            console.log('Summary:', emptyResult.summary.substring(0, 100) + '...');
        } else {
            console.log('❌ ML Summary with empty data failed:', emptyResult.error);
        }

        // Test with undefined data
        console.log('\n📊 Testing with undefined data...');
        const undefinedResult = await mlSummaryService.generateMLSummary(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        );

        if (undefinedResult.success) {
            console.log('✅ ML Summary with undefined data generated successfully!');
            console.log('Summary:', undefinedResult.summary.substring(0, 100) + '...');
        } else {
            console.log('❌ ML Summary with undefined data failed:', undefinedResult.error);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testMLFix(); 
const MLSummaryService = require('../services/MLSummaryService');

async function testMLSummary() {
    console.log('🧠 Testing ML Summary Service...');
    
    const mlSummaryService = new MLSummaryService('finance');
    
    // Simple test data
    const metrics = {
        amount: {
            count: 1000,
            average: -1001.36,
            min: -5000,
            max: 2000,
            standardDeviation: 1500,
            coefficientOfVariation: 0.85
        },
        current_balance: {
            count: 1000,
            average: 49448.56,
            min: 1000,
            max: 100000,
            standardDeviation: 25000,
            coefficientOfVariation: 0.51
        },
        fraud_score: {
            count: 1000,
            average: 0.498,
            min: 0.01,
            max: 0.99,
            standardDeviation: 0.25,
            coefficientOfVariation: 0.50
        }
    };

    const insights = [
        {
            category: 'cash_flow',
            severity: 'warning',
            description: 'Net negative cash flow pattern detected',
            metric: 'amount',
            value: -1001.36
        }
    ];

    try {
        const result = await mlSummaryService.generateMLSummary(metrics, insights, {}, [], {});
        
        if (result.success) {
            console.log('✅ ML Summary Generated:');
            console.log(result.summary);
            console.log('\nRisk Level:', result.riskProfile.level);
            console.log('Risk Score:', result.riskProfile.score);
        } else {
            console.log('❌ Failed:', result.error);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testMLSummary(); 
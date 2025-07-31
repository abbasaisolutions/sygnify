// Test script for market data service
import marketDataService from './src/services/marketDataService.js';

async function testMarketData() {
    console.log('🧪 Testing Market Data Service...');
    
    try {
        // Test comprehensive market data
        console.log('\n📊 Testing comprehensive market data...');
        const comprehensive = await marketDataService.getComprehensiveMarketData();
        console.log('✅ Comprehensive data:', comprehensive ? 'Available' : 'Not available');
        
        if (comprehensive) {
            console.log('   - Data available:', comprehensive.data_available);
            console.log('   - Data source:', comprehensive.data_source);
            console.log('   - APIs connected:', comprehensive.apis_connected);
            console.log('   - Success rate:', comprehensive.success_rate);
        }
        
        // Test individual endpoints
        console.log('\n📈 Testing individual endpoints...');
        
        const indices = await marketDataService.getMajorIndices();
        console.log('✅ Indices:', indices ? 'Available' : 'Not available');
        
        const rates = await marketDataService.getInterestRates();
        console.log('✅ Interest rates:', rates ? 'Available' : 'Not available');
        
        const sentiment = await marketDataService.getMarketSentiment();
        console.log('✅ Market sentiment:', sentiment ? 'Available' : 'Not available');
        
        const commodities = await marketDataService.getCommodityPrices();
        console.log('✅ Commodities:', commodities ? 'Available' : 'Not available');
        
        // Test cache functionality
        console.log('\n📦 Testing cache functionality...');
        const cacheStats = marketDataService.getCacheStats();
        console.log('✅ Cache stats:', cacheStats);
        
        console.log('\n🎉 Market data service test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing market data service:', error);
    }
}

// Run the test
testMarketData(); 
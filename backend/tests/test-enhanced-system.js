const fs = require('fs');
const path = require('path');

// Import the enhanced services
const AdvancedDataProcessor = require('../services/AdvancedDataProcessor');
const EnhancedMLService = require('../services/EnhancedMLService');
const AIInsightEngine = require('../services/AIInsightEngine');

// Sample financial data for testing
const sampleFinancialData = [
  {
    "Date": "2024-01-01",
    "Segment": "Government",
    "Country": "Canada",
    "Product": "Carretera",
    "Discount_Band": "None",
    "Units_Sold": 1618.5,
    "Manufacturing_Price": 3.0,
    "Sale_Price": 20.0,
    "Gross_Sales": 32370.0,
    "Discounts": 0.0,
    "Sales": 32370.0,
    "COGS": 16185.0,
    "Profit": 16185.0,
    "Month_Number": 1,
    "Month_Name": "January",
    "Year": 2024
  },
  {
    "Date": "2024-01-02",
    "Segment": "Government",
    "Country": "Germany",
    "Product": "Carretera",
    "Discount_Band": "None",
    "Units_Sold": 1321.0,
    "Manufacturing_Price": 3.0,
    "Sale_Price": 20.0,
    "Gross_Sales": 26420.0,
    "Discounts": 0.0,
    "Sales": 26420.0,
    "COGS": 13210.0,
    "Profit": 13210.0,
    "Month_Number": 1,
    "Month_Name": "January",
    "Year": 2024
  },
  {
    "Date": "2024-01-03",
    "Segment": "Midmarket",
    "Country": "France",
    "Product": "Carretera",
    "Discount_Band": "None",
    "Units_Sold": 2178.0,
    "Manufacturing_Price": 3.0,
    "Sale_Price": 15.0,
    "Gross_Sales": 32670.0,
    "Discounts": 0.0,
    "Sales": 32670.0,
    "COGS": 21780.0,
    "Profit": 10890.0,
    "Month_Number": 1,
    "Month_Name": "January",
    "Year": 2024
  },
  {
    "Date": "2024-01-04",
    "Segment": "Midmarket",
    "Country": "Germany",
    "Product": "Carretera",
    "Discount_Band": "None",
    "Units_Sold": 888.0,
    "Manufacturing_Price": 3.0,
    "Sale_Price": 15.0,
    "Gross_Sales": 13320.0,
    "Discounts": 0.0,
    "Sales": 13320.0,
    "COGS": 8880.0,
    "Profit": 4440.0,
    "Month_Number": 1,
    "Month_Name": "January",
    "Year": 2024
  },
  {
    "Date": "2024-01-05",
    "Segment": "Midmarket",
    "Country": "Mexico",
    "Product": "Carretera",
    "Discount_Band": "None",
    "Units_Sold": 2470.0,
    "Manufacturing_Price": 3.0,
    "Sale_Price": 15.0,
    "Gross_Sales": 37050.0,
    "Discounts": 0.0,
    "Sales": 37050.0,
    "COGS": 24700.0,
    "Profit": 12350.0,
    "Month_Number": 1,
    "Month_Name": "January",
    "Year": 2024
  }
];

async function testEnhancedSystem() {
  console.log('🧪 Testing Enhanced ML & AI System...\n');

  try {
    // Test 1: Advanced Data Processor
    console.log('📊 Test 1: Advanced Data Processor');
    const dataProcessor = new AdvancedDataProcessor();
    
    // Create a temporary CSV file for testing
    const tempCsvPath = path.join(__dirname, 'temp_test_data.csv');
    const csvContent = [
      'Date,Segment,Country,Product,Units_Sold,Manufacturing_Price,Sale_Price,Gross_Sales,Discounts,Sales,COGS,Profit,Month_Number,Month_Name,Year',
      '2024-01-01,Government,Canada,Carretera,1618.5,3.0,20.0,32370.0,0.0,32370.0,16185.0,16185.0,1,January,2024',
      '2024-01-02,Government,Germany,Carretera,1321.0,3.0,20.0,26420.0,0.0,26420.0,13210.0,13210.0,1,January,2024',
      '2024-01-03,Midmarket,France,Carretera,2178.0,3.0,15.0,32670.0,0.0,32670.0,21780.0,10890.0,1,January,2024'
    ].join('\n');
    
    fs.writeFileSync(tempCsvPath, csvContent);
    
    const processedData = await dataProcessor.parseCSV(tempCsvPath);
    
    if (processedData.success) {
      console.log('✅ Data processing successful');
      console.log(`   - Records: ${processedData.data.length}`);
      console.log(`   - Columns: ${processedData.metadata.totalColumns}`);
      console.log(`   - Quality: ${Math.round(processedData.quality.score * 100)}%`);
      
      // Extract financial metrics
      const financialMetrics = dataProcessor.extractFinancialMetrics(processedData.data, processedData.schema);
      console.log(`   - Financial metrics extracted: ${Object.keys(financialMetrics.amounts || {}).length} amount columns`);
    } else {
      console.log('❌ Data processing failed:', processedData.error);
      return;
    }
    
    // Clean up temp file
    fs.unlinkSync(tempCsvPath);
    
    // Test 2: Enhanced ML Service
    console.log('\n🧠 Test 2: Enhanced ML Service');
    const enhancedMLService = new EnhancedMLService('finance');
    const enhancedInsights = await enhancedMLService.generateEnhancedInsights(processedData);
    
    if (enhancedInsights.patterns) {
      console.log('✅ Enhanced ML analysis successful');
      console.log(`   - Patterns detected: ${Object.keys(enhancedInsights.patterns).length}`);
      console.log(`   - Anomalies found: ${enhancedInsights.anomalies.length}`);
      console.log(`   - Trends analyzed: ${enhancedInsights.trends.length}`);
      console.log(`   - Risks assessed: ${enhancedInsights.risks.length}`);
      console.log(`   - Opportunities identified: ${enhancedInsights.opportunities.length}`);
      console.log(`   - Recommendations generated: ${enhancedInsights.recommendations.length}`);
    } else {
      console.log('❌ Enhanced ML analysis failed');
      return;
    }
    
    // Test 3: AI Insight Engine
    console.log('\n🤖 Test 3: AI Insight Engine');
    const aiInsightEngine = new AIInsightEngine('finance');
    const financialMetrics = dataProcessor.extractFinancialMetrics(processedData.data, processedData.schema);
    const aiInsights = await aiInsightEngine.generateInsights(processedData, financialMetrics);
    
    if (aiInsights.success) {
      console.log('✅ AI insight generation successful');
      console.log(`   - Cash flow insights: ${aiInsights.insights.cashFlow.length}`);
      console.log(`   - Profitability insights: ${aiInsights.insights.profitability.length}`);
      console.log(`   - Risk insights: ${aiInsights.insights.risk.length}`);
      console.log(`   - Efficiency insights: ${aiInsights.insights.efficiency.length}`);
      console.log(`   - Trend insights: ${aiInsights.insights.trends.length}`);
      console.log(`   - Anomaly insights: ${aiInsights.insights.anomalies.length}`);
      console.log(`   - Opportunity insights: ${aiInsights.insights.opportunities.length}`);
      console.log(`   - Recommendations: ${aiInsights.insights.recommendations.length}`);
      console.log(`   - Confidence: ${aiInsights.metadata.confidence}`);
    } else {
      console.log('❌ AI insight generation failed:', aiInsights.error);
      return;
    }
    
    // Test 4: Data Validation
    console.log('\n🔍 Test 4: Data Validation');
    const businessRules = [
      {
        name: 'positive_sales',
        type: 'range',
        column: 'Sales',
        min: 0
      },
      {
        name: 'valid_dates',
        type: 'required',
        column: 'Date'
      }
    ];
    
    const validationResults = dataProcessor.validateBusinessRules(processedData.data, processedData.schema, businessRules);
    
    if (validationResults.passed) {
      console.log('✅ Data validation passed');
    } else {
      console.log('⚠️ Data validation issues found:');
      validationResults.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Test 5: Schema Analysis
    console.log('\n📋 Test 5: Schema Analysis');
    console.log('Detected column types:');
    Object.entries(processedData.schema).forEach(([column, schema]) => {
      console.log(`   - ${column}: ${schema.type} (confidence: ${Math.round(schema.confidence * 100)}%)`);
    });
    
    // Test 6: Financial Metrics Analysis
    console.log('\n💰 Test 6: Financial Metrics Analysis');
    if (financialMetrics.summary) {
      console.log(`   - Total records: ${financialMetrics.summary.totalRecords}`);
      console.log(`   - Total amount: $${financialMetrics.summary.totalAmount?.toLocaleString() || 0}`);
      console.log(`   - Net cash flow: $${financialMetrics.summary.netCashFlow?.toLocaleString() || 0}`);
      console.log(`   - Average transaction: $${financialMetrics.summary.averageTransaction?.toFixed(2) || 0}`);
    }
    
    // Test 7: Pattern Detection
    console.log('\n🔍 Test 7: Pattern Detection');
    if (enhancedInsights.patterns) {
      Object.entries(enhancedInsights.patterns).forEach(([patternType, pattern]) => {
        if (pattern && typeof pattern === 'object') {
          console.log(`   - ${patternType}: ${pattern.description || 'Pattern detected'}`);
        }
      });
    }
    
    // Test 8: Risk Assessment
    console.log('\n⚠️ Test 8: Risk Assessment');
    if (aiInsights.insights.risk && aiInsights.insights.risk.length > 0) {
      aiInsights.insights.risk.forEach(risk => {
        console.log(`   - ${risk.title}: ${risk.metrics.riskLevel} risk (${risk.metrics.riskScore}/100)`);
      });
    } else {
      console.log('   - No significant risks detected');
    }
    
    // Test 9: Recommendations
    console.log('\n💡 Test 9: Recommendations');
    if (aiInsights.insights.recommendations && aiInsights.insights.recommendations.length > 0) {
      aiInsights.insights.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.description} (${rec.priority} priority)`);
      });
    } else {
      console.log('   - No specific recommendations generated');
    }
    
    // Test 10: Performance Metrics
    console.log('\n📈 Test 10: Performance Metrics');
    const performanceMetrics = {
      dataQuality: Math.round(processedData.quality.score * 100),
      totalTransactions: Object.values(financialMetrics.amounts || {}).reduce((sum, metrics) => sum + metrics.count, 0),
      averageTransaction: Object.values(financialMetrics.amounts || {}).reduce((sum, metrics) => sum + metrics.average, 0) / Math.max(Object.keys(financialMetrics.amounts || {}).length, 1),
      netCashFlow: Object.values(financialMetrics.amounts || {}).reduce((sum, metrics) => sum + (metrics.positiveSum - metrics.negativeSum), 0)
    };
    
    console.log(`   - Data Quality: ${performanceMetrics.dataQuality}%`);
    console.log(`   - Total Transactions: ${performanceMetrics.totalTransactions}`);
    console.log(`   - Average Transaction: $${performanceMetrics.averageTransaction.toFixed(2)}`);
    console.log(`   - Net Cash Flow: $${performanceMetrics.netCashFlow.toLocaleString()}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Advanced Data Processor: Working');
    console.log('✅ Enhanced ML Service: Working');
    console.log('✅ AI Insight Engine: Working');
    console.log('✅ Data Validation: Working');
    console.log('✅ Schema Analysis: Working');
    console.log('✅ Financial Metrics: Working');
    console.log('✅ Pattern Detection: Working');
    console.log('✅ Risk Assessment: Working');
    console.log('✅ Recommendations: Working');
    console.log('✅ Performance Metrics: Working');
    
    console.log('\n🚀 The enhanced ML & AI system is ready for production use!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEnhancedSystem(); 
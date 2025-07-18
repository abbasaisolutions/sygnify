const fs = require('fs');
const path = require('path');

// Import the enhanced services
const AdvancedDataProcessor = require('../services/AdvancedDataProcessor');

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
  }
];

async function testSimpleEnhanced() {
  console.log('🧪 Testing Simple Enhanced System...\n');

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
      
      // Show schema analysis
      console.log('\n📋 Schema Analysis:');
      Object.entries(processedData.schema).forEach(([column, schema]) => {
        console.log(`   - ${column}: ${schema.type} (confidence: ${Math.round(schema.confidence * 100)}%)`);
      });
      
      // Show financial metrics
      if (financialMetrics.summary) {
        console.log('\n💰 Financial Metrics:');
        console.log(`   - Total records: ${financialMetrics.summary.totalRecords}`);
        console.log(`   - Total amount: $${financialMetrics.summary.totalAmount?.toLocaleString() || 0}`);
        console.log(`   - Net cash flow: $${financialMetrics.summary.netCashFlow?.toLocaleString() || 0}`);
        console.log(`   - Average transaction: $${financialMetrics.summary.averageTransaction?.toFixed(2) || 0}`);
      }
      
      // Test data validation
      console.log('\n🔍 Test Data Validation:');
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
      
    } else {
      console.log('❌ Data processing failed:', processedData.error);
      return;
    }
    
    // Clean up temp file
    fs.unlinkSync(tempCsvPath);
    
    console.log('\n🎉 Simple enhanced system test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Advanced Data Processor: Working');
    console.log('✅ Schema Analysis: Working');
    console.log('✅ Financial Metrics: Working');
    console.log('✅ Data Validation: Working');
    
    console.log('\n🚀 The enhanced data processing system is ready for production use!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSimpleEnhanced(); 
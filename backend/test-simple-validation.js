const DataValidator = require('./services/DataValidator');
const path = require('path');

async function testValidation() {
    console.log('🧪 Testing Validation System\n');
    
    const dataValidator = new DataValidator();
    
    // Test with empty file
    const emptyFilePath = path.join(__dirname, 'test-data/empty-file.csv');
    console.log('Testing empty file:', emptyFilePath);
    
    try {
        const result = await dataValidator.validateCSVForAnalysis(emptyFilePath, 'finance', 'empty-file.csv');
        console.log('Validation result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testValidation(); 
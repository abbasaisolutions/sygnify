const DataValidator = require('./services/DataValidator');
const path = require('path');

async function debugValidation() {
    console.log('🔍 Debugging Validation System\n');

    const dataValidator = new DataValidator();
    
    // Test with the empty file
    const filePath = path.join(__dirname, 'test-data/empty-file.csv');
    console.log(`Testing file: ${filePath}`);
    console.log(`File exists: ${require('fs').existsSync(filePath)}`);
    
    try {
        console.log('Starting validation...');
        const validationResult = await dataValidator.validateCSVForAnalysis(filePath, 'finance');
        console.log('Validation completed');
        console.log('Result type:', typeof validationResult);
        console.log('Result keys:', Object.keys(validationResult || {}));
        
        console.log('Validation Result:');
        console.log(JSON.stringify(validationResult, null, 2));
        
        // Simulate the error response that would be sent to frontend
        if (!validationResult.isValid) {
            const errorResponse = {
                error: 'Data validation failed',
                details: validationResult.errors,
                recommendations: validationResult.recommendations,
                warnings: validationResult.warnings
            };
            
            console.log('\nError Response that would be sent to frontend:');
            console.log(JSON.stringify(errorResponse, null, 2));
        }
        
    } catch (error) {
        console.error('Error during validation:', error);
    }
}

debugValidation().catch(console.error); 
const DataValidator = require('./services/DataValidator');
const path = require('path');

async function testErrorResponse() {
    console.log('🧪 Testing Error Response Format\n');
    
    const dataValidator = new DataValidator();
    const filePath = path.join(__dirname, 'test-data/empty-file.csv');
    
    try {
        const validationResult = await dataValidator.validateCSVForAnalysis(filePath, 'finance');
        
        if (!validationResult.isValid) {
            // Simulate the exact error response that would be sent to frontend
            const errorResponse = {
                error: 'Data validation failed',
                details: validationResult.errors,
                recommendations: validationResult.recommendations,
                warnings: validationResult.warnings
            };
            
            console.log('Backend would send this error response:');
            console.log(JSON.stringify(errorResponse, null, 2));
            
            // Simulate what the frontend would receive
            console.log('\nFrontend would receive this error object:');
            const mockError = {
                response: {
                    status: 400,
                    data: errorResponse
                },
                message: 'Request failed with status code 400'
            };
            
            console.log(JSON.stringify(mockError, null, 2));
            
            // Test frontend error handling logic
            console.log('\nTesting frontend error handling logic:');
            
            if (mockError.response?.status === 400 && mockError.response?.data?.error === 'Data validation failed') {
                console.log('✅ Frontend would detect validation error');
                
                const validationData = mockError.response.data;
                let errorMessage = 'Data validation failed:\n';
                
                if (validationData.details && Array.isArray(validationData.details)) {
                    errorMessage += validationData.details.join('\n');
                }
                
                if (validationData.recommendations && Array.isArray(validationData.recommendations)) {
                    errorMessage += '\n\nRecommendations:\n' + validationData.recommendations.join('\n');
                }
                
                if (validationData.warnings && Array.isArray(validationData.warnings)) {
                    errorMessage += '\n\nWarnings:\n' + validationData.warnings.join('\n');
                }
                
                console.log('Frontend would display this error message:');
                console.log(errorMessage);
            } else {
                console.log('❌ Frontend would NOT detect validation error');
                console.log('Status check:', mockError.response?.status === 400);
                console.log('Error check:', mockError.response?.data?.error === 'Data validation failed');
            }
        }
        
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testErrorResponse().catch(console.error); 
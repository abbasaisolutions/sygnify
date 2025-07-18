const DataValidator = require('./services/DataValidator');
const NarrativeGuard = require('./services/NarrativeGuard');
const path = require('path');

/**
 * Test script for the new validation system
 */
async function testValidationSystem() {
    console.log('🧪 Testing Data Validation System\n');

    const dataValidator = new DataValidator();
    const narrativeGuard = new NarrativeGuard();

    // Test cases
    const testCases = [
        {
            name: 'Truly Empty File',
            file: 'test-data/truly-empty.csv',
            domain: 'finance',
            expected: { isValid: false, hasErrors: true }
        },
        {
            name: 'Empty File (Headers Only)',
            file: 'test-data/empty-file.csv',
            domain: 'finance',
            expected: { isValid: false, hasErrors: true }
        },
        {
            name: 'Auto-numbered Columns',
            file: 'test-data/auto-numbered-columns.csv',
            domain: 'finance',
            expected: { isValid: false, hasErrors: true }
        },
        {
            name: 'Valid Finance Data',
            file: 'test-data/valid-finance-data.csv',
            domain: 'finance',
            expected: { isValid: true, hasErrors: false }
        }
    ];

    for (const testCase of testCases) {
        console.log(`📋 Testing: ${testCase.name}`);
        console.log(`📁 File: ${testCase.file}`);
        console.log(`🎯 Domain: ${testCase.domain}`);
        
        try {
            const filePath = path.join(__dirname, testCase.file);
            console.log(`🔍 Full path: ${filePath}`);
            console.log(`📄 File exists: ${require('fs').existsSync(filePath)}`);
            
            const validationResult = await dataValidator.validateCSVForAnalysis(filePath, testCase.domain);
            
            console.log(`✅ Validation Result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
            
            if (validationResult.errors && validationResult.errors.length > 0) {
                console.log('❌ Errors:');
                validationResult.errors.forEach(error => console.log(`   - ${error}`));
            }
            
            if (validationResult.warnings && validationResult.warnings.length > 0) {
                console.log('⚠️ Warnings:');
                validationResult.warnings.forEach(warning => console.log(`   - ${warning}`));
            }
            
            if (validationResult.recommendations && validationResult.recommendations.length > 0) {
                console.log('💡 Recommendations:');
                validationResult.recommendations.forEach(rec => console.log(`   - ${rec}`));
            }
            
            // Test narrative guard
            if (validationResult.isValid) {
                console.log('\n📝 Testing Narrative Guard...');
                const mockData = {
                    metadata: {
                        totalRecords: validationResult.data.recordCount,
                        columns: validationResult.data.columns
                    },
                    dataQuality: {
                        overallScore: validationResult.data.qualityMetrics?.overallQuality || 100
                    }
                };
                
                const narrativeValidation = narrativeGuard.validateNarrativeData(mockData, testCase.domain);
                console.log(`   Narrative Validation: ${narrativeValidation.isValid ? 'PASSED' : 'FAILED'}`);
                
                if (narrativeValidation.warnings.length > 0) {
                    console.log('   Warnings:');
                    narrativeValidation.warnings.forEach(warning => console.log(`     - ${warning}`));
                }
            }
            
        } catch (error) {
            console.error(`❌ Test failed: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }

    // Test narrative guard with various data scenarios
    console.log('🧪 Testing Narrative Guard Scenarios\n');
    
    const narrativeTestCases = [
        {
            name: 'Empty Data',
            data: {},
            domain: 'finance',
            expected: { isValid: false, fallbackType: 'emptyData' }
        },
        {
            name: 'Insufficient Records',
            data: {
                metadata: { totalRecords: 5 },
                results: { column1: { count: 5 } }
            },
            domain: 'finance',
            expected: { isValid: false, fallbackType: 'insufficientData' }
        },
        {
            name: 'No Numeric Data',
            data: {
                metadata: { totalRecords: 15 },
                results: { text_column: { count: 15 } }
            },
            domain: 'finance',
            expected: { isValid: false, fallbackType: 'insufficientData' }
        },
        {
            name: 'Valid Data',
            data: {
                metadata: { totalRecords: 15 },
                results: { 
                    amount: { count: 15, average: 100 },
                    balance: { count: 15, average: 2000 }
                },
                dataQuality: { overallScore: 85 }
            },
            domain: 'finance',
            expected: { isValid: true }
        }
    ];

    for (const testCase of narrativeTestCases) {
        console.log(`📝 Testing Narrative: ${testCase.name}`);
        
        const validation = narrativeGuard.validateNarrativeData(testCase.data, testCase.domain);
        
        console.log(`   Result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   Fallback Type: ${validation.fallbackType || 'N/A'}`);
        
        if (validation.warnings.length > 0) {
            console.log('   Warnings:');
            validation.warnings.forEach(warning => console.log(`     - ${warning}`));
        }
        
        // Test narrative generation
        const narrative = narrativeGuard.generateAppropriateNarrative(validation);
        console.log(`   Should Use Original: ${narrative.shouldUseOriginal}`);
        
        console.log('');
    }

    console.log('✅ Validation system testing completed!');
}

// Run the tests
testValidationSystem().catch(console.error); 
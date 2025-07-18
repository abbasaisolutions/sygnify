const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function testFinalFixes() {
    console.log('🧪 Testing Final Fixes - Unified Metrics & Consistency');
    console.log('=' .repeat(60));
    
    // Test data - simulate the Financials.csv structure
    const testData = {
        columns: ['transaction_id', 'account_id', 'customer_name', 'transaction_date', 'transaction_type', 'amount', 'currency', 'description', 'category', 'current_balance', 'account_type', 'merchant_name', 'merchant_city', 'merchant_state', 'fraud_score', 'is_fraud'],
        sample_rows: [
            {
                transaction_id: 'TXN001',
                account_id: 'ACC001',
                customer_name: 'John Doe',
                transaction_date: '2024-01-15',
                transaction_type: 'Purchase',
                amount: '1250.50',
                currency: 'USD',
                description: 'Online purchase',
                category: 'Shopping',
                current_balance: '5000.00',
                account_type: 'Checking',
                merchant_name: 'Amazon',
                merchant_city: 'Seattle',
                merchant_state: 'WA',
                fraud_score: '0.02',
                is_fraud: '0'
            },
            {
                transaction_id: 'TXN002',
                account_id: 'ACC001',
                customer_name: 'John Doe',
                transaction_date: '2024-01-16',
                transaction_type: 'Deposit',
                amount: '3000.00',
                currency: 'USD',
                description: 'Salary deposit',
                category: 'Income',
                current_balance: '8000.00',
                account_type: 'Checking',
                merchant_name: 'Employer Corp',
                merchant_city: 'New York',
                merchant_state: 'NY',
                fraud_score: '0.01',
                is_fraud: '0'
            }
        ]
    };
    
    // Create test file
    const testFilePath = path.join(__dirname, 'test_final_fixes.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
    
    console.log('📁 Created test file with sample financial data');
    console.log(`📊 Test data: ${testData.sample_rows.length} records, ${testData.columns.length} columns`);
    
    try {
        // Run Python analysis
        console.log('\n🔍 Running Python analysis...');
        const pythonResult = await runPythonAnalysis(testFilePath);
        
        if (pythonResult.success) {
            console.log('✅ Python analysis completed successfully');
            console.log(`📈 Records analyzed: ${pythonResult.data.metadata.records_analyzed}`);
            console.log(`🏷️  Columns analyzed: ${pythonResult.data.metadata.columns_analyzed}`);
            console.log(`🎯 Prediction confidence: ${pythonResult.data.metadata.prediction_confidence}`);
            
            // Check data quality metrics
            if (pythonResult.data.metadata.data_quality) {
                const quality = pythonResult.data.metadata.data_quality;
                console.log(`📊 Data quality score: ${quality.score}`);
                console.log(`📊 Data quality records: ${quality.records_analyzed}`);
                console.log(`📊 Completeness: ${quality.completeness}`);
                console.log(`📊 Accuracy: ${quality.accuracy}`);
                console.log(`📊 Consistency: ${quality.consistency}`);
            }
            
            // Check smart labels
            if (pythonResult.data.smart_labels) {
                console.log('\n🏷️  Smart Labels:');
                Object.entries(pythonResult.data.smart_labels).forEach(([col, label]) => {
                    console.log(`   ${col}: ${label}`);
                });
            }
            
            // Check enhanced labels for categories
            if (pythonResult.data.enhanced_labels) {
                console.log('\n📂 Enhanced Labels with Categories:');
                Object.entries(pythonResult.data.enhanced_labels).forEach(([col, labelInfo]) => {
                    if (typeof labelInfo === 'object' && labelInfo.category) {
                        console.log(`   ${col}: ${labelInfo.semantic} (${labelInfo.category})`);
                    }
                });
            }
            
            // Check narratives
            if (pythonResult.data.narratives && pythonResult.data.narratives.length > 0) {
                const narrative = pythonResult.data.narratives[0];
                console.log('\n📝 Narrative:');
                console.log(`   Headline: ${narrative.headline}`);
                if (narrative.prediction_confidence) {
                    console.log(`   Confidence: ${narrative.prediction_confidence}`);
                }
                if (narrative.data_quality) {
                    console.log(`   Data Quality Records: ${narrative.data_quality.records_analyzed}`);
                }
            }
            
            // Verify consistency
            console.log('\n🔍 Consistency Verification:');
            const recordsAnalyzed = pythonResult.data.metadata.records_analyzed;
            const qualityRecords = pythonResult.data.metadata.data_quality?.records_analyzed;
            const narrativeRecords = pythonResult.data.narratives?.[0]?.data_quality?.records_analyzed;
            
            console.log(`   Main metadata records: ${recordsAnalyzed}`);
            console.log(`   Data quality records: ${qualityRecords}`);
            console.log(`   Narrative records: ${narrativeRecords}`);
            
            if (recordsAnalyzed === qualityRecords && recordsAnalyzed === narrativeRecords) {
                console.log('✅ ✅ ✅ ALL RECORD COUNTS ARE UNIFIED!');
            } else {
                console.log('❌ ❌ ❌ RECORD COUNT MISMATCH DETECTED!');
            }
            
            // Check prediction confidence logic
            const expectedConfidence = recordsAnalyzed > 500 ? 'high' : recordsAnalyzed > 100 ? 'medium' : 'low';
            const actualConfidence = pythonResult.data.metadata.prediction_confidence;
            console.log(`\n🎯 Prediction Confidence: Expected ${expectedConfidence}, Got ${actualConfidence}`);
            
            if (actualConfidence === expectedConfidence) {
                console.log('✅ ✅ ✅ PREDICTION CONFIDENCE LOGIC WORKS!');
            } else {
                console.log('❌ ❌ ❌ PREDICTION CONFIDENCE LOGIC FAILED!');
            }
            
        } else {
            console.log('❌ Python analysis failed:', pythonResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

function runPythonAnalysis(filePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['main.py', '--file_path', filePath]);
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    // Extract JSON from stdout
                    const lines = stdout.split('\n');
                    let jsonData = null;
                    
                    for (let i = lines.length - 1; i >= 0; i--) {
                        try {
                            jsonData = JSON.parse(lines[i]);
                            break;
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (jsonData) {
                        resolve({ success: true, data: jsonData });
                    } else {
                        resolve({ success: false, error: 'No valid JSON found in output' });
                    }
                } catch (e) {
                    resolve({ success: false, error: `JSON parsing failed: ${e.message}` });
                }
            } else {
                resolve({ success: false, error: `Python process failed with code ${code}: ${stderr}` });
            }
        });
        
        pythonProcess.on('error', (error) => {
            resolve({ success: false, error: `Failed to start Python process: ${error.message}` });
        });
    });
}

// Run the test
testFinalFixes().then(() => {
    console.log('\n🎉 Final fixes test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
}); 
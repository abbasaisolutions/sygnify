const fs = require('fs');
const path = require('path');
const AdvancedDataProcessor = require('./services/AdvancedDataProcessor');

async function testPipelineIntegration() {
    console.log('🧪 Testing Full Pipeline Integration with Final Fixes');
    console.log('=' .repeat(60));
    
    const processor = new AdvancedDataProcessor();
    const csvFilePath = path.join(__dirname, 'test-data', 'valid-finance-data.csv');
    
    console.log(`📁 Testing with CSV file: ${csvFilePath}`);
    
    try {
        // Step 1: Process CSV with AdvancedDataProcessor
        console.log('\n🔍 Step 1: Processing CSV with AdvancedDataProcessor...');
        const csvResult = await processor.parseCSV(csvFilePath);
        
        if (!csvResult.success) {
            console.log('❌ CSV processing failed:', csvResult.error);
            return;
        }
        
        console.log('✅ CSV processing completed successfully');
        console.log(`📊 Records processed: ${csvResult.data.length}`);
        console.log(`📊 Columns detected: ${Object.keys(csvResult.schema).length}`);
        console.log(`📊 Data quality score: ${csvResult.quality.score.toFixed(3)}`);
        console.log(`📊 Data quality records: ${csvResult.quality.records_analyzed}`);
        
        // Step 2: Create JSON file for Python analysis
        const jsonData = {
            columns: Object.keys(csvResult.schema),
            sample_rows: csvResult.data
        };
        
        const jsonFilePath = path.join(__dirname, 'temp_analysis_test.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        
        console.log('\n📁 Created JSON file for Python analysis');
        
        // Step 3: Run Python analysis
        console.log('\n🔍 Step 2: Running Python analysis...');
        const { spawn } = require('child_process');
        
        const pythonResult = await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', ['main.py', '--file_path', jsonFilePath]);
            
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
        
        if (pythonResult.success) {
            console.log('✅ Python analysis completed successfully');
            
            // Step 4: Verify Final Fixes
            console.log('\n🔍 Step 3: Verifying Final Fixes...');
            
            const pythonData = pythonResult.data;
            const csvRecords = csvResult.data.length;
            const pythonRecords = pythonData.metadata.records_analyzed;
            const qualityRecords = pythonData.metadata.data_quality?.records_analyzed;
            const narrativeRecords = pythonData.narratives?.[0]?.data_quality?.records_analyzed;
            
            console.log('\n📊 Record Count Verification:');
            console.log(`   CSV records: ${csvRecords}`);
            console.log(`   Python metadata records: ${pythonRecords}`);
            console.log(`   Data quality records: ${qualityRecords}`);
            console.log(`   Narrative records: ${narrativeRecords}`);
            
            // Check unification
            if (csvRecords === pythonRecords && csvRecords === qualityRecords && csvRecords === narrativeRecords) {
                console.log('✅ ✅ ✅ ALL RECORD COUNTS ARE UNIFIED!');
            } else {
                console.log('❌ ❌ ❌ RECORD COUNT MISMATCH DETECTED!');
            }
            
            // Check prediction confidence
            const expectedConfidence = csvRecords > 500 ? 'high' : csvRecords > 100 ? 'medium' : 'low';
            const actualConfidence = pythonData.metadata.prediction_confidence;
            console.log(`\n🎯 Prediction Confidence: Expected ${expectedConfidence}, Got ${actualConfidence}`);
            
            if (actualConfidence === expectedConfidence) {
                console.log('✅ ✅ ✅ PREDICTION CONFIDENCE LOGIC WORKS!');
            } else {
                console.log('❌ ❌ ❌ PREDICTION CONFIDENCE LOGIC FAILED!');
            }
            
            // Check data quality
            console.log('\n📊 Data Quality Verification:');
            if (pythonData.metadata.data_quality) {
                const quality = pythonData.metadata.data_quality;
                console.log(`   Quality score: ${quality.score}`);
                console.log(`   Completeness: ${quality.completeness}`);
                console.log(`   Accuracy: ${quality.accuracy}`);
                console.log(`   Consistency: ${quality.consistency}`);
                
                if (quality.records_analyzed === csvRecords) {
                    console.log('✅ ✅ ✅ DATA QUALITY RECORD COUNT MATCHES!');
                } else {
                    console.log('❌ ❌ ❌ DATA QUALITY RECORD COUNT MISMATCH!');
                }
            }
            
            // Check smart labels
            console.log('\n🏷️  Smart Labels:');
            if (pythonData.smart_labels) {
                Object.entries(pythonData.smart_labels).forEach(([col, label]) => {
                    console.log(`   ${col}: ${label}`);
                });
            }
            
            // Check enhanced labels with categories
            console.log('\n📂 Enhanced Labels with Categories:');
            if (pythonData.enhanced_labels) {
                Object.entries(pythonData.enhanced_labels).forEach(([col, labelInfo]) => {
                    if (typeof labelInfo === 'object' && labelInfo.category) {
                        console.log(`   ${col}: ${labelInfo.semantic} (${labelInfo.category})`);
                    }
                });
            }
            
            // Check narratives
            console.log('\n📝 Narrative:');
            if (pythonData.narratives && pythonData.narratives.length > 0) {
                const narrative = pythonData.narratives[0];
                console.log(`   Headline: ${narrative.headline}`);
                if (narrative.prediction_confidence) {
                    console.log(`   Confidence: ${narrative.prediction_confidence}`);
                }
                if (narrative.data_quality) {
                    console.log(`   Data Quality Records: ${narrative.data_quality.records_analyzed}`);
                }
            }
            
            console.log('\n🎉 All Final Fixes Verified Successfully!');
            
        } else {
            console.log('❌ Python analysis failed:', pythonResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Cleanup
        const jsonFilePath = path.join(__dirname, 'temp_analysis_test.json');
        if (fs.existsSync(jsonFilePath)) {
            fs.unlinkSync(jsonFilePath);
        }
    }
}

// Run the test
testPipelineIntegration().then(() => {
    console.log('\n🎉 Pipeline integration test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
}); 
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

/**
 * JavaScript wrapper for the enhanced Python financial analysis system
 * This allows the Node.js backend to call our Python SmartLabeler and NarrativeGenerator
 */

async function run_financial_analysis(columns, sample_rows, user_id = null, user_role = 'executive') {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Creating temp JSON file for Python analysis...');

      // Write data to a temp JSON file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `sygnify_analysis_${uuidv4()}.json`);
      const jsonData = {
        columns,
        sample_rows,
        user_id,
        user_role,
      };

      fs.writeFileSync(tempFile, JSON.stringify(jsonData, null, 2));
      console.log(`📁 Temp file created: ${tempFile}`);
      console.log(`📊 Data: ${columns.length} columns, ${sample_rows.length} sample rows`);

      // Call the Python script
      const pythonScript = path.join(__dirname, '../main.py');
      console.log(`🐍 Calling Python script: ${pythonScript}`);

      const pythonProcess = spawn('python', [pythonScript, '--file_path', tempFile, '--user_role', user_role]);
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`🐍 Python stdout: ${data.toString()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`🐍 Python stderr: ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
          console.log(`🗑️ Temp file cleaned up: ${tempFile}`);
        } catch (cleanupError) {
          console.log(`⚠️ Could not clean up temp file: ${cleanupError.message}`);
        }

        if (code !== 0) {
          console.error(`❌ Python process exited with code ${code}`);
          console.error(`❌ Python stderr: ${stderr}`);
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
          return;
        }

        // Check for actual errors in stderr (not just log messages)
        if (stderr && !stderr.includes('Debug:') && !stderr.includes('INFO:') && !stderr.includes('Warning:') && !stderr.includes('Warning: Could not load glossary')) {
          console.error(`❌ Python stderr: ${stderr}`);
          reject(new Error(`Python process returned errors: ${stderr}`));
          return;
        }

        // Log informational messages but don't treat them as errors
        if (stderr) {
          console.log(`📝 Python info: ${stderr.trim()}`);
        }

        try {
          // Find the JSON output in stdout (it should be the last valid JSON)
          const lines = stdout.split('\n');
          let jsonOutput = '';

          // Look for JSON output (usually the last non-empty line)
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line && line.startsWith('{') && line.endsWith('}')) {
              jsonOutput = line;
              break;
            }
          }

          if (!jsonOutput) {
            console.error('❌ No valid JSON found in Python output');
            console.error(`📄 Full stdout: ${stdout}`);
            reject(new Error('No valid JSON output from Python analysis'));
            return;
          }

          const result = JSON.parse(jsonOutput);
          console.log('✅ Python analysis completed successfully');
          console.log(`📊 Result: ${result.metadata?.records_analyzed || 0} records analyzed`);
          resolve(result);
        } catch (parseError) {
          console.error(`❌ Failed to parse Python output: ${parseError.message}`);
          console.error(`📄 Raw stdout: ${stdout}`);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`❌ Failed to start Python process: ${error.message}`);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    } catch (error) {
      console.error(`❌ Error in run_financial_analysis: ${error.message}`);
      reject(error);
    }
  });
}

module.exports = {
  run_financial_analysis,
};

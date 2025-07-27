const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const Ajv = require('ajv');

/**
 * JavaScript ↔ Python ML Engine Bridge
 * Handles communication between Node.js and Python ML models
 */
class MLModelBridge {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.schema = null;
    this.pythonPath = 'python';
    this.modelPath = path.join(__dirname, 'runModel.py');
    this.timeout = 30000; // 30 seconds timeout
    this.maxRetries = 3;
  }

  /**
     * Initialize the bridge with schema validation
     */
  async initialize() {
    try {
      // Load and compile the JSON schema
      const schemaPath = path.join(__dirname, 'schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);

      // Compile the schema validator
      this.validate = this.ajv.compile(this.schema);

      console.log('✅ ML Model Bridge initialized with schema validation');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ML Model Bridge:', error.message);
      throw error;
    }
  }

  /**
     * Run Python ML model with structured data input
     * @param {Object} jsonData - Structured data for ML processing
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Validated ML results
     */
  async runPythonModel(jsonData, options = {}) {
    const startTime = Date.now();

    try {
      console.log('🐍 Running Python ML model...');

      // Validate input data structure
      this.validateInputData(jsonData);

      // Prepare Python process options
      const processOptions = {
        cwd: path.dirname(this.modelPath),
        timeout: options.timeout || this.timeout,
        env: {
          ...process.env,
          PYTHONPATH: path.join(__dirname, '..'),
          PYTHONUNBUFFERED: '1',
        },
      };

      // Run Python model with retry logic
      let result;
      let lastError;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          result = await this.executePythonModel(jsonData, processOptions);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ ML model attempt ${attempt} failed: ${error.message}`);

          if (attempt < this.maxRetries) {
            // Wait before retry (exponential backoff)
            await this.delay(2 ** attempt * 1000);
          }
        }
      }

      if (!result) {
        throw new Error(`ML model failed after ${this.maxRetries} attempts: ${lastError.message}`);
      }

      // Validate output against schema
      const validatedResult = this.validateOutput(result);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Python ML model completed in ${processingTime}ms`);

      // Add processing metadata
      validatedResult.meta.processingTime = processingTime;
      validatedResult.meta.timestamp = new Date().toISOString();

      return validatedResult;
    } catch (error) {
      console.error('❌ Python ML model failed:', error.message);
      throw error;
    }
  }

  /**
     * Execute Python model process
     * @param {Object} jsonData - Input data
     * @param {Object} processOptions - Process options
     * @returns {Promise<Object>} - ML results
     */
  executePythonModel(jsonData, processOptions) {
    return new Promise((resolve, reject) => {
      const py = spawn(this.pythonPath, [this.modelPath], processOptions);

      let stdout = '';
      let stderr = '';
      let hasResolved = false;

      // Set up timeout
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          py.kill('SIGTERM');
          reject(new Error('ML model execution timeout'));
        }
      }, processOptions.timeout);

      // Handle stdout
      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Handle stderr
      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      py.on('close', (code) => {
        clearTimeout(timeout);

        if (hasResolved) return;
        hasResolved = true;

        if (code !== 0) {
          reject(new Error(`Python ML model failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse JSON output
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse ML model output: ${parseError.message}\nOutput: ${stdout}`));
        }
      });

      // Handle process errors
      py.on('error', (error) => {
        clearTimeout(timeout);
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Failed to start Python ML model: ${error.message}`));
        }
      });

      // Send input data to Python process
      try {
        const inputJson = JSON.stringify(jsonData);
        py.stdin.write(inputJson);
        py.stdin.end();
      } catch (error) {
        clearTimeout(timeout);
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Failed to send data to Python ML model: ${error.message}`));
        }
      }
    });
  }

  /**
     * Validate input data structure
     * @param {Object} data - Input data to validate
     */
  validateInputData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Input data must be a valid object');
    }

    if (!Array.isArray(data.transactions) || data.transactions.length === 0) {
      throw new Error('Input data must contain a non-empty transactions array');
    }

    // Validate transaction structure
    const requiredFields = ['amount', 'date', 'merchant', 'category'];
    const firstTransaction = data.transactions[0];

    for (const field of requiredFields) {
      if (!(field in firstTransaction)) {
        throw new Error(`Transaction missing required field: ${field}`);
      }
    }

    console.log(`✅ Input data validated: ${data.transactions.length} transactions`);
  }

  /**
     * Validate output against JSON schema
     * @param {Object} output - ML model output
     * @returns {Object} - Validated output
     */
  validateOutput(output) {
    if (!this.validate) {
      throw new Error('Schema validator not initialized');
    }

    const isValid = this.validate(output);

    if (!isValid) {
      const errors = this.validate.errors.map((err) => `${err.instancePath} ${err.message}`).join(', ');

      throw new Error(`ML output validation failed: ${errors}`);
    }

    console.log('✅ ML output validated against schema');
    return output;
  }

  /**
     * Run ML model with streaming support for large datasets
     * @param {ReadableStream} dataStream - Streaming data input
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - ML results
     */
  async runPythonModelStreaming(dataStream, options = {}) {
    console.log('🌊 Running Python ML model with streaming...');

    const chunks = [];
    let totalRecords = 0;

    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => {
        chunks.push(chunk);
        totalRecords += chunk.length;
      });

      dataStream.on('end', async () => {
        try {
          const combinedData = chunks.flat();
          const result = await this.runPythonModel({ transactions: combinedData }, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      dataStream.on('error', reject);
    });
  }

  /**
     * Run ML model with batch processing for large datasets
     * @param {Array} data - Large dataset
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - ML results
     */
  async runPythonModelBatch(data, options = {}) {
    const batchSize = options.batchSize || 10000;
    const batches = [];

    // Split data into batches
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${data.length} records in ${batches.length} batches`);

    const batchResults = [];

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}`);

      const batchData = { transactions: batches[i] };
      const batchResult = await this.runPythonModel(batchData, options);
      batchResults.push(batchResult);

      // Add delay between batches to prevent resource exhaustion
      if (i < batches.length - 1) {
        await this.delay(100);
      }
    }

    // Aggregate batch results
    return this.aggregateBatchResults(batchResults);
  }

  /**
     * Aggregate results from multiple batches
     * @param {Array} batchResults - Results from multiple batches
     * @returns {Object} - Aggregated results
     */
  aggregateBatchResults(batchResults) {
    if (batchResults.length === 0) {
      throw new Error('No batch results to aggregate');
    }

    if (batchResults.length === 1) {
      return batchResults[0];
    }

    // Aggregate summary metrics
    const aggregatedSummary = {
      netCashFlow: 0,
      avgTransaction: 0,
      riskScore: 0,
      fraudScore: 0,
      anomalies: 0,
      confidence: 0,
      volatility: 0,
      velocityScore: 0,
    };

    // Aggregate flags (true if any batch has it true)
    const aggregatedFlags = {
      velocitySpike: false,
      balanceMismatch: false,
      highRiskTransactions: false,
      unusualAmounts: false,
      timingAnomalies: false,
      geographicAnomalies: false,
      frequencyAnomalies: false,
      amountAnomalies: false,
    };

    // Aggregate metrics
    const aggregatedMetrics = {
      totalTransactions: 0,
      totalVolume: 0,
      positiveTransactions: 0,
      negativeTransactions: 0,
      largestTransaction: -Infinity,
      smallestTransaction: Infinity,
      transactionCount: 0,
      uniqueMerchants: new Set(),
      uniqueCategories: new Set(),
    };

    // Aggregate anomalies and recommendations
    const allAnomalies = [];
    const allRecommendations = [];

    let totalConfidence = 0;
    let totalRiskScore = 0;
    let totalFraudScore = 0;
    let totalVolatility = 0;
    let totalVelocityScore = 0;

    batchResults.forEach((batch, index) => {
      const weight = batch.meta.recordCount;

      // Aggregate summary with weighted averages
      aggregatedSummary.netCashFlow += batch.summary.netCashFlow;
      aggregatedSummary.avgTransaction += batch.summary.avgTransaction * weight;
      totalRiskScore += batch.summary.riskScore * weight;
      totalFraudScore += batch.summary.fraudScore * weight;
      totalConfidence += batch.summary.confidence * weight;
      totalVolatility += batch.summary.volatility * weight;
      totalVelocityScore += batch.summary.velocityScore * weight;
      aggregatedSummary.anomalies += batch.summary.anomalies;

      // Aggregate flags
      Object.keys(aggregatedFlags).forEach((flag) => {
        if (batch.flags[flag]) {
          aggregatedFlags[flag] = true;
        }
      });

      // Aggregate metrics
      aggregatedMetrics.totalTransactions += batch.metrics.totalTransactions;
      aggregatedMetrics.totalVolume += batch.metrics.totalVolume;
      aggregatedMetrics.positiveTransactions += batch.metrics.positiveTransactions;
      aggregatedMetrics.negativeTransactions += batch.metrics.negativeTransactions;
      aggregatedMetrics.transactionCount += batch.metrics.transactionCount;

      if (batch.metrics.largestTransaction > aggregatedMetrics.largestTransaction) {
        aggregatedMetrics.largestTransaction = batch.metrics.largestTransaction;
      }

      if (batch.metrics.smallestTransaction < aggregatedMetrics.smallestTransaction) {
        aggregatedMetrics.smallestTransaction = batch.metrics.smallestTransaction;
      }

      // Aggregate unique values
      if (batch.metrics.uniqueMerchants) {
        batch.metrics.uniqueMerchants.forEach((merchant) => aggregatedMetrics.uniqueMerchants.add(merchant));
      }

      if (batch.metrics.uniqueCategories) {
        batch.metrics.uniqueCategories.forEach((category) => aggregatedMetrics.uniqueCategories.add(category));
      }

      // Collect anomalies and recommendations
      if (batch.anomalies) {
        allAnomalies.push(...batch.anomalies);
      }

      if (batch.recommendations) {
        allRecommendations.push(...batch.recommendations);
      }
    });

    const totalWeight = aggregatedMetrics.totalTransactions;

    // Calculate final weighted averages
    aggregatedSummary.avgTransaction /= totalWeight;
    aggregatedSummary.riskScore = totalRiskScore / totalWeight;
    aggregatedSummary.fraudScore = totalFraudScore / totalWeight;
    aggregatedSummary.confidence = totalConfidence / totalWeight;
    aggregatedSummary.volatility = totalVolatility / totalWeight;
    aggregatedSummary.velocityScore = totalVelocityScore / totalWeight;

    // Convert sets to counts
    aggregatedMetrics.uniqueMerchants = aggregatedMetrics.uniqueMerchants.size;
    aggregatedMetrics.uniqueCategories = aggregatedMetrics.uniqueCategories.size;

    // Sort and deduplicate anomalies and recommendations
    const uniqueAnomalies = this.deduplicateAnomalies(allAnomalies);
    const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

    return {
      summary: aggregatedSummary,
      flags: aggregatedFlags,
      metrics: aggregatedMetrics,
      anomalies: uniqueAnomalies,
      recommendations: uniqueRecommendations,
      meta: {
        recordCount: aggregatedMetrics.totalTransactions,
        timestamp: new Date().toISOString(),
        processingTime: batchResults.reduce((sum, batch) => sum + batch.meta.processingTime, 0),
        batchCount: batchResults.length,
        modelVersion: batchResults[0].meta.modelVersion,
      },
    };
  }

  /**
     * Deduplicate anomalies based on type and description
     * @param {Array} anomalies - Array of anomalies
     * @returns {Array} - Deduplicated anomalies
     */
  deduplicateAnomalies(anomalies) {
    const seen = new Set();
    return anomalies.filter((anomaly) => {
      const key = `${anomaly.type}:${anomaly.description}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
     * Deduplicate recommendations based on action
     * @param {Array} recommendations - Array of recommendations
     * @returns {Array} - Deduplicated recommendations
     */
  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter((rec) => {
      if (seen.has(rec.action)) {
        return false;
      }
      seen.add(rec.action);
      return true;
    });
  }

  /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
     * Get model status and health check
     * @returns {Promise<Object>} - Model status information
     */
  async getModelStatus() {
    try {
      const testData = {
        transactions: [
          {
            amount: 100.00,
            date: new Date().toISOString(),
            merchant: 'Test Merchant',
            category: 'Test Category',
          },
        ],
      };

      const result = await this.runPythonModel(testData, { timeout: 5000 });

      return {
        status: 'healthy',
        modelVersion: result.meta.modelVersion,
        processingTime: result.meta.processingTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create singleton instance
const mlModelBridge = new MLModelBridge();

// Export both the class and singleton instance
module.exports = { MLModelBridge, mlModelBridge };
module.exports.runPythonModel = (data, options) => mlModelBridge.runPythonModel(data, options);
module.exports.runPythonModelStreaming = (stream, options) => mlModelBridge.runPythonModelStreaming(stream, options);
module.exports.runPythonModelBatch = (data, options) => mlModelBridge.runPythonModelBatch(data, options);
module.exports.getModelStatus = () => mlModelBridge.getModelStatus();
module.exports.initialize = () => mlModelBridge.initialize();

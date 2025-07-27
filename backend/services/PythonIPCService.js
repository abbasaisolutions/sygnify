const { spawn } = require('child_process');
const path = require('path');

/**
 * Python IPC Service
 * Implements efficient communication with Python processes using IPC
 */
class PythonIPCService {
  constructor() {
    this.pythonProcesses = new Map();
    this.messageQueue = new Map();
    this.circuitBreaker = this.initializeCircuitBreaker();
  }

  initializeCircuitBreaker() {
    return {
      failures: 0,
      lastFailureTime: 0,
      threshold: 3,
      timeout: 30000, // 30 seconds
      isOpen: false,

      recordFailure: () => {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();

        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
          this.circuitBreaker.isOpen = true;
          console.warn('⚠️ Circuit breaker opened - Python communication temporarily disabled');
        }
      },

      recordSuccess: () => {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.isOpen = false;
      },

      canAttempt: () => {
        if (!this.circuitBreaker.isOpen) return true;

        // Check if timeout has passed
        if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
          this.circuitBreaker.isOpen = false;
          this.circuitBreaker.failures = 0;
          console.log('🔄 Circuit breaker reset - Python communication re-enabled');
          return true;
        }

        return false;
      },
    };
  }

  async executePythonAnalysis(data, analysisType = 'ml', options = {}) {
    if (!this.circuitBreaker.canAttempt()) {
      console.warn('🚫 Circuit breaker is open, using fallback analysis');
      return this.fallbackAnalysis(data, analysisType);
    }

    try {
      console.log(`🐍 Executing Python ${analysisType} analysis via IPC...`);

      const result = await this.runPythonProcess(data, analysisType, options);
      this.circuitBreaker.recordSuccess();

      return result;
    } catch (error) {
      console.error(`❌ Python analysis failed: ${error.message}`);
      this.circuitBreaker.recordFailure();

      // Return fallback analysis
      return this.fallbackAnalysis(data, analysisType);
    }
  }

  async runPythonProcess(data, analysisType, options) {
    return new Promise((resolve, reject) => {
      const pythonScript = this.getPythonScript(analysisType);
      const pythonProcess = spawn('python', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      });

      const processId = Date.now().toString();
      this.pythonProcesses.set(processId, pythonProcess);

      let stdout = '';
      let stderr = '';
      let timeoutId;

      // Set timeout
      timeoutId = setTimeout(() => {
        this.terminateProcess(processId);
        reject(new Error('Python analysis timeout'));
      }, 60000); // 60 second timeout

      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Handle stderr
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        this.pythonProcesses.delete(processId);

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        this.pythonProcesses.delete(processId);
        reject(new Error(`Python process error: ${error.message}`));
      });

      // Send data to Python process
      const inputData = {
        data,
        analysis_type: analysisType,
        options,
      };

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  getPythonScript(analysisType) {
    const scripts = {
      ml: path.join(__dirname, '../financial_analysis/advanced_ml_analysis.py'),
      anomaly: path.join(__dirname, '../financial_analysis/anomaly_detection.py'),
      correlation: path.join(__dirname, '../financial_analysis/correlation_analysis.py'),
      temporal: path.join(__dirname, '../financial_analysis/temporal_analysis.py'),
      clustering: path.join(__dirname, '../financial_analysis/clustering_analysis.py'),
    };

    return scripts[analysisType] || scripts.ml;
  }

  terminateProcess(processId) {
    const process = this.pythonProcesses.get(processId);
    if (process) {
      process.kill('SIGTERM');
      this.pythonProcesses.delete(processId);
    }
  }

  terminateAllProcesses() {
    this.pythonProcesses.forEach((process, processId) => {
      this.terminateProcess(processId);
    });
  }

  fallbackAnalysis(data, analysisType) {
    console.log(`🔄 Using fallback ${analysisType} analysis`);

    switch (analysisType) {
      case 'ml':
        return this.fallbackMLAnalysis(data);
      case 'anomaly':
        return this.fallbackAnomalyDetection(data);
      case 'correlation':
        return this.fallbackCorrelationAnalysis(data);
      case 'temporal':
        return this.fallbackTemporalAnalysis(data);
      case 'clustering':
        return this.fallbackClusteringAnalysis(data);
      default:
        return this.fallbackMLAnalysis(data);
    }
  }

  fallbackMLAnalysis(data) {
    // JavaScript-based ML analysis as fallback
    const fraudTransactions = data.filter((row) => row.is_fraud === '1');
    const normalTransactions = data.filter((row) => row.is_fraud === '0');

    const fraudRate = fraudTransactions.length / data.length;
    const avgFraudAmount = fraudTransactions.length > 0
      ? fraudTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / fraudTransactions.length : 0;

    return {
      success: true,
      fallback: true,
      analysis_type: 'ml',
      results: {
        fraud_rate: fraudRate,
        avg_fraud_amount: avgFraudAmount,
        total_transactions: data.length,
        fraud_transactions: fraudTransactions.length,
        normal_transactions: normalTransactions.length,
        insights: [
          `Fraud rate: ${(fraudRate * 100).toFixed(2)}%`,
          `Average fraud amount: $${avgFraudAmount.toFixed(2)}`,
          `Total transactions analyzed: ${data.length}`,
        ],
      },
    };
  }

  fallbackAnomalyDetection(data) {
    // Simple statistical anomaly detection
    const amounts = data.map((row) => parseFloat(row.amount)).filter((a) => !isNaN(a));
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const std = Math.sqrt(amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length);

    const anomalies = data.filter((row) => {
      const amount = parseFloat(row.amount);
      return Math.abs(amount - mean) > 2 * std; // 2-sigma rule
    });

    return {
      success: true,
      fallback: true,
      analysis_type: 'anomaly',
      results: {
        anomalies_found: anomalies.length,
        anomaly_rate: anomalies.length / data.length,
        threshold: mean + 2 * std,
        anomalies: anomalies.slice(0, 10).map((a) => ({
          index: data.indexOf(a),
          amount: a.amount,
          score: Math.abs(parseFloat(a.amount) - mean) / std,
        })),
      },
    };
  }

  fallbackCorrelationAnalysis(data) {
    // Simple correlation analysis
    const numericColumns = ['amount', 'fraud_score', 'balance'];
    const correlations = [];

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];

        if (data[0] && data[0][col1] !== undefined && data[0][col2] !== undefined) {
          const values1 = data.map((row) => parseFloat(row[col1])).filter((v) => !isNaN(v));
          const values2 = data.map((row) => parseFloat(row[col2])).filter((v) => !isNaN(v));

          if (values1.length > 10 && values2.length > 10) {
            const correlation = this.calculateCorrelation(values1, values2);
            if (Math.abs(correlation) > 0.3) {
              correlations.push({
                column1: col1,
                column2: col2,
                correlation,
                strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate',
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      fallback: true,
      analysis_type: 'correlation',
      results: {
        correlations_found: correlations.length,
        correlations,
      },
    };
  }

  fallbackTemporalAnalysis(data) {
    // Simple temporal analysis
    if (!data[0] || !data[0].transaction_date) {
      return {
        success: true,
        fallback: true,
        analysis_type: 'temporal',
        results: { message: 'No temporal data available' },
      };
    }

    const monthlyStats = {};
    data.forEach((row) => {
      const month = new Date(row.transaction_date).getMonth();
      if (!monthlyStats[month]) {
        monthlyStats[month] = { count: 0, total: 0, fraud: 0 };
      }
      monthlyStats[month].count++;
      monthlyStats[month].total += parseFloat(row.amount);
      if (row.is_fraud === '1') monthlyStats[month].fraud++;
    });

    const trends = Object.entries(monthlyStats).map(([month, stats]) => ({
      month: parseInt(month),
      transaction_count: stats.count,
      avg_amount: stats.total / stats.count,
      fraud_rate: stats.fraud / stats.count,
    }));

    return {
      success: true,
      fallback: true,
      analysis_type: 'temporal',
      results: {
        trends,
        seasonal_patterns: trends.length > 0,
      },
    };
  }

  fallbackClusteringAnalysis(data) {
    // Simple clustering analysis
    const amounts = data.map((row) => parseFloat(row.amount)).filter((a) => !isNaN(a));
    const fraudScores = data.map((row) => parseFloat(row.fraud_score)).filter((f) => !isNaN(f));

    // Simple 3-cluster analysis
    const clusters = {
      low_risk: { count: 0, avg_amount: 0, avg_fraud_score: 0 },
      medium_risk: { count: 0, avg_amount: 0, avg_fraud_score: 0 },
      high_risk: { count: 0, avg_amount: 0, avg_fraud_score: 0 },
    };

    data.forEach((row) => {
      const fraudScore = parseFloat(row.fraud_score);
      const amount = parseFloat(row.amount);

      if (fraudScore < 0.3) {
        clusters.low_risk.count++;
        clusters.low_risk.avg_amount += amount;
        clusters.low_risk.avg_fraud_score += fraudScore;
      } else if (fraudScore < 0.7) {
        clusters.medium_risk.count++;
        clusters.medium_risk.avg_amount += amount;
        clusters.medium_risk.avg_fraud_score += fraudScore;
      } else {
        clusters.high_risk.count++;
        clusters.high_risk.avg_amount += amount;
        clusters.high_risk.avg_fraud_score += fraudScore;
      }
    });

    // Calculate averages
    Object.keys(clusters).forEach((cluster) => {
      if (clusters[cluster].count > 0) {
        clusters[cluster].avg_amount /= clusters[cluster].count;
        clusters[cluster].avg_fraud_score /= clusters[cluster].count;
      }
    });

    return {
      success: true,
      fallback: true,
      analysis_type: 'clustering',
      results: {
        clusters,
        total_clusters: 3,
      },
    };
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Health check method
  async healthCheck() {
    try {
      const testData = [{ amount: 100, fraud_score: 0.1 }];
      const result = await this.executePythonAnalysis(testData, 'ml');
      return {
        status: 'healthy',
        python_available: !result.fallback,
        circuit_breaker_open: this.circuitBreaker.isOpen,
        active_processes: this.pythonProcesses.size,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        python_available: false,
        circuit_breaker_open: this.circuitBreaker.isOpen,
        active_processes: this.pythonProcesses.size,
        error: error.message,
      };
    }
  }

  // Cleanup method
  cleanup() {
    this.terminateAllProcesses();
    this.messageQueue.clear();
  }
}

module.exports = PythonIPCService;

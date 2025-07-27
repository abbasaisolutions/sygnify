const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced Logging Service
 * Implements comprehensive logging with conditional debugging and zero-result handling
 */
class EnhancedLoggingService {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.enableFileLogging = options.enableFileLogging !== false;
    this.logDirectory = options.logDirectory || path.join(__dirname, '../logs');
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
    this.retentionDays = options.retentionDays || 30;

    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };

    this.initializeLogging();
  }

  async initializeLogging() {
    if (this.enableFileLogging) {
      try {
        await fs.mkdir(this.logDirectory, { recursive: true });
        console.log(`📁 Log directory initialized: ${this.logDirectory}`);
      } catch (error) {
        console.warn(`⚠️ Failed to create log directory: ${error.message}`);
        this.enableFileLogging = false;
      }
    }
  }

  // Main logging methods
  error(message, context = {}, error = null) {
    this.log('error', message, context, error);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    this.log('debug', message, context);
  }

  trace(message, context = {}) {
    this.log('trace', message, context);
  }

  // Conditional logging for zero results
  logZeroResults(operation, data, context = {}) {
    const message = `Zero results found for ${operation}`;
    const enhancedContext = {
      ...context,
      operation,
      data_size: data ? data.length : 0,
      data_type: data ? typeof data : 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Log with different levels based on context
    if (data && data.length === 0) {
      this.warn(message, enhancedContext);
    } else if (!data) {
      this.error(message, enhancedContext);
    } else {
      this.info(message, enhancedContext);
    }

    // Additional debugging for zero results
    this.debugZeroResults(operation, data, enhancedContext);
  }

  // Enhanced debugging for zero results
  debugZeroResults(operation, data, context) {
    const debugInfo = {
      operation,
      data_available: !!data,
      data_length: data ? data.length : 0,
      data_structure: data ? this.analyzeDataStructure(data) : null,
      context_keys: Object.keys(context),
      memory_usage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    this.debug(`Zero results debug info for ${operation}`, debugInfo);

    // Log additional context if available
    if (context.filters) {
      this.debug(`Applied filters: ${JSON.stringify(context.filters)}`);
    }
    if (context.query) {
      this.debug(`Query used: ${JSON.stringify(context.query)}`);
    }
    if (context.parameters) {
      this.debug(`Parameters: ${JSON.stringify(context.parameters)}`);
    }
  }

  // Performance logging
  logPerformance(operation, duration, success = true, context = {}) {
    const level = success ? 'info' : 'warn';
    const message = `${operation} completed in ${duration}ms`;

    const performanceContext = {
      ...context,
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    this.log(level, message, performanceContext);

    // Log slow operations as warnings
    if (duration > 5000) { // 5 seconds
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, performanceContext);
    }

    // Log very slow operations as errors
    if (duration > 30000) { // 30 seconds
      this.error(`Very slow operation: ${operation} took ${duration}ms`, performanceContext);
    }
  }

  // Data quality logging
  logDataQuality(data, context = {}) {
    if (!data || data.length === 0) {
      this.logZeroResults('data_quality_check', data, context);
      return;
    }

    const qualityMetrics = this.calculateDataQualityMetrics(data);
    const message = 'Data quality assessment completed';

    const qualityContext = {
      ...context,
      quality_metrics: qualityMetrics,
      data_size: data.length,
      timestamp: new Date().toISOString(),
    };

    // Log quality issues
    if (qualityMetrics.completeness < 0.8) {
      this.warn(`Low data completeness: ${(qualityMetrics.completeness * 100).toFixed(1)}%`, qualityContext);
    }
    if (qualityMetrics.consistency < 0.7) {
      this.warn(`Low data consistency: ${(qualityMetrics.consistency * 100).toFixed(1)}%`, qualityContext);
    }
    if (qualityMetrics.accuracy < 0.9) {
      this.warn(`Low data accuracy: ${(qualityMetrics.accuracy * 100).toFixed(1)}%`, qualityContext);
    }

    this.info(message, qualityContext);
  }

  // ML analysis logging
  logMLAnalysis(analysisType, results, context = {}) {
    if (!results) {
      this.logZeroResults('ml_analysis', results, { ...context, analysis_type: analysisType });
      return;
    }

    const message = `${analysisType} analysis completed`;
    const analysisContext = {
      ...context,
      analysis_type: analysisType,
      results_summary: this.summarizeResults(results),
      timestamp: new Date().toISOString(),
    };

    // Log based on results quality
    if (this.hasSignificantResults(results)) {
      this.info(message, analysisContext);
    } else {
      this.warn(`${analysisType} analysis completed with limited results`, analysisContext);
    }

    // Debug detailed results
    this.debug(`${analysisType} detailed results`, { results, context });
  }

  // Anomaly detection logging
  logAnomalyDetection(anomalies, context = {}) {
    if (!anomalies || anomalies.length === 0) {
      this.logZeroResults('anomaly_detection', anomalies, context);
      return;
    }

    const message = `Anomaly detection completed: ${anomalies.length} anomalies found`;
    const anomalyContext = {
      ...context,
      anomaly_count: anomalies.length,
      anomaly_rate: anomalies.length / (context.total_records || 1),
      severity_distribution: this.calculateSeverityDistribution(anomalies),
      timestamp: new Date().toISOString(),
    };

    this.info(message, anomalyContext);

    // Log high-severity anomalies
    const highSeverityAnomalies = anomalies.filter((a) => a.severity === 'high' || a.severity === 'critical');
    if (highSeverityAnomalies.length > 0) {
      this.warn(`High-severity anomalies detected: ${highSeverityAnomalies.length}`, {
        ...anomalyContext,
        high_severity_count: highSeverityAnomalies.length,
        high_severity_anomalies: highSeverityAnomalies.slice(0, 5), // Log first 5
      });
    }
  }

  // Correlation analysis logging
  logCorrelationAnalysis(correlations, context = {}) {
    if (!correlations || correlations.length === 0) {
      this.logZeroResults('correlation_analysis', correlations, context);
      return;
    }

    const message = `Correlation analysis completed: ${correlations.length} significant correlations found`;
    const correlationContext = {
      ...context,
      correlation_count: correlations.length,
      strong_correlations: correlations.filter((c) => c.strength === 'strong').length,
      moderate_correlations: correlations.filter((c) => c.strength === 'moderate').length,
      timestamp: new Date().toISOString(),
    };

    this.info(message, correlationContext);

    // Log strong correlations
    const strongCorrelations = correlations.filter((c) => c.strength === 'strong');
    if (strongCorrelations.length > 0) {
      this.info(`Strong correlations found: ${strongCorrelations.length}`, {
        ...correlationContext,
        strong_correlations: strongCorrelations.slice(0, 3), // Log first 3
      });
    }
  }

  // Core logging method
  log(level, message, context = {}, error = null) {
    // Check log level
    if (this.logLevels[level] > this.logLevels[this.logLevel]) {
      return;
    }

    const logEntry = {
      level: level.toUpperCase(),
      message,
      context,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    // Console output
    this.outputToConsole(logEntry);

    // File output
    if (this.enableFileLogging) {
      this.outputToFile(logEntry).catch((err) => {
        console.error(`Failed to write to log file: ${err.message}`);
      });
    }
  }

  // Console output with colors
  outputToConsole(logEntry) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      DEBUG: '\x1b[35m', // Magenta
      TRACE: '\x1b[37m', // White
    };
    const reset = '\x1b[0m';

    const color = colors[logEntry.level] || '';
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    let output = `${color}[${logEntry.level}]${reset} ${timestamp} - ${logEntry.message}`;

    if (logEntry.error) {
      output += `\n${color}Error:${reset} ${logEntry.error.message}`;
    }

    if (Object.keys(logEntry.context).length > 0) {
      output += `\n${color}Context:${reset} ${JSON.stringify(logEntry.context, null, 2)}`;
    }

    console.log(output);
  }

  // File output
  async outputToFile(logEntry) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `sygnify-${date}.log`);

    const logLine = `${JSON.stringify(logEntry)}\n`;

    try {
      await fs.appendFile(logFile, logLine);

      // Check file size and rotate if necessary
      const stats = await fs.stat(logFile);
      if (stats.size > this.maxLogSize) {
        await this.rotateLogFile(logFile);
      }
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  // Log file rotation
  async rotateLogFile(logFile) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = `${logFile}.${timestamp}`;

    try {
      await fs.rename(logFile, rotatedFile);
      console.log(`📄 Log file rotated: ${rotatedFile}`);
    } catch (error) {
      console.error(`Failed to rotate log file: ${error.message}`);
    }
  }

  // Utility methods
  analyzeDataStructure(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample_keys: data.length > 0 && data[0] ? Object.keys(data[0]) : [],
      };
    } if (typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data),
        size: Object.keys(data).length,
      };
    }
    return {
      type: typeof data,
      value: String(data).substring(0, 100),
    };
  }

  calculateDataQualityMetrics(data) {
    if (!data || data.length === 0) {
      return { completeness: 0, consistency: 0, accuracy: 0 };
    }

    const sample = data.slice(0, Math.min(1000, data.length));
    const columns = Object.keys(sample[0] || {});

    let totalCompleteness = 0;
    let totalConsistency = 0;
    let totalAccuracy = 0;

    columns.forEach((column) => {
      const values = sample.map((row) => row[column]);
      const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

      // Completeness
      const completeness = nonNullValues.length / values.length;
      totalCompleteness += completeness;

      // Consistency (type consistency)
      const types = nonNullValues.map((v) => typeof v);
      const mostCommonType = this.getMostCommon(types);
      const consistency = types.filter((t) => t === mostCommonType).length / types.length;
      totalConsistency += consistency;

      // Accuracy (basic validation)
      const accuracy = this.validateColumnAccuracy(column, nonNullValues);
      totalAccuracy += accuracy;
    });

    return {
      completeness: totalCompleteness / columns.length,
      consistency: totalConsistency / columns.length,
      accuracy: totalAccuracy / columns.length,
    };
  }

  getMostCommon(arr) {
    const counts = {};
    arr.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  validateColumnAccuracy(column, values) {
    // Basic validation based on column name
    if (column.includes('amount') || column.includes('price')) {
      return values.filter((v) => !isNaN(parseFloat(v))).length / values.length;
    } if (column.includes('date')) {
      return values.filter((v) => !isNaN(new Date(v).getTime())).length / values.length;
    } if (column.includes('email')) {
      return values.filter((v) => v.includes('@')).length / values.length;
    }
    return 1.0; // Default accuracy
  }

  summarizeResults(results) {
    if (!results) return null;

    if (Array.isArray(results)) {
      return {
        type: 'array',
        length: results.length,
        sample: results.slice(0, 3),
      };
    } if (typeof results === 'object') {
      return {
        type: 'object',
        keys: Object.keys(results),
        has_data: Object.keys(results).length > 0,
      };
    }
    return {
      type: typeof results,
      value: String(results).substring(0, 100),
    };
  }

  hasSignificantResults(results) {
    if (!results) return false;

    if (Array.isArray(results)) {
      return results.length > 0;
    } if (typeof results === 'object') {
      return Object.keys(results).length > 0;
    }

    return !!results;
  }

  calculateSeverityDistribution(anomalies) {
    const distribution = {};
    anomalies.forEach((anomaly) => {
      const severity = anomaly.severity || 'unknown';
      distribution[severity] = (distribution[severity] || 0) + 1;
    });
    return distribution;
  }

  // Cleanup old log files
  async cleanupOldLogs() {
    if (!this.enableFileLogging) return;

    try {
      const files = await fs.readdir(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      for (const file of files) {
        if (file.startsWith('sygnify-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup old logs: ${error.message}`);
    }
  }

  // Get log statistics
  async getLogStatistics() {
    if (!this.enableFileLogging) {
      return { message: 'File logging disabled' };
    }

    try {
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files.filter((file) => file.startsWith('sygnify-') && file.endsWith('.log'));

      const stats = {
        total_files: logFiles.length,
        total_size: 0,
        oldest_file: null,
        newest_file: null,
      };

      for (const file of logFiles) {
        const filePath = path.join(this.logDirectory, file);
        const fileStats = await fs.stat(filePath);

        stats.total_size += fileStats.size;

        if (!stats.oldest_file || fileStats.mtime < stats.oldest_file.mtime) {
          stats.oldest_file = { name: file, mtime: fileStats.mtime };
        }
        if (!stats.newest_file || fileStats.mtime > stats.newest_file.mtime) {
          stats.newest_file = { name: file, mtime: fileStats.mtime };
        }
      }

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = EnhancedLoggingService;

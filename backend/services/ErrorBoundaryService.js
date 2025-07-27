const fs = require('fs').promises;

/**
 * Error Boundary Service
 * Implements circuit breakers, fallbacks, and error recovery for production resilience
 */
class ErrorBoundaryService {
  constructor() {
    this.circuitBreakers = this.initializeCircuitBreakers();
    this.fallbacks = this.initializeFallbacks();
    this.errorRecovery = this.initializeErrorRecovery();
    this.monitoring = this.initializeMonitoring();
  }

  initializeCircuitBreakers() {
    return {
      // ML Analysis circuit breaker
      mlAnalysis: {
        failures: 0,
        lastFailureTime: 0,
        threshold: 3,
        timeout: 30000,
        isOpen: false,
        name: 'ML Analysis',
      },

      // Data Processing circuit breaker
      dataProcessing: {
        failures: 0,
        lastFailureTime: 0,
        threshold: 2,
        timeout: 15000,
        isOpen: false,
        name: 'Data Processing',
      },

      // Anomaly Detection circuit breaker
      anomalyDetection: {
        failures: 0,
        lastFailureTime: 0,
        threshold: 3,
        timeout: 25000,
        isOpen: false,
        name: 'Anomaly Detection',
      },

      // Python Communication circuit breaker
      pythonCommunication: {
        failures: 0,
        lastFailureTime: 0,
        threshold: 2,
        timeout: 20000,
        isOpen: false,
        name: 'Python Communication',
      },

      // Database Operations circuit breaker
      databaseOperations: {
        failures: 0,
        lastFailureTime: 0,
        threshold: 5,
        timeout: 10000,
        isOpen: false,
        name: 'Database Operations',
      },
    };
  }

  initializeFallbacks() {
    return {
      // ML Analysis fallback
      mlAnalysis: async (data, error) => {
        console.log('🔄 Using ML analysis fallback');

        const fraudTransactions = data.filter((row) => row.is_fraud === '1');
        const normalTransactions = data.filter((row) => row.is_fraud === '0');

        return {
          success: true,
          fallback: true,
          error: error.message,
          results: {
            fraud_rate: fraudTransactions.length / data.length,
            total_transactions: data.length,
            fraud_transactions: fraudTransactions.length,
            normal_transactions: normalTransactions.length,
            insights: [
              `Basic fraud rate: ${(fraudTransactions.length / data.length * 100).toFixed(2)}%`,
              `Total transactions: ${data.length}`,
              'Analysis completed using fallback method',
            ],
          },
        };
      },

      // Data Processing fallback
      dataProcessing: async (data, error) => {
        console.log('🔄 Using data processing fallback');

        return {
          success: true,
          fallback: true,
          error: error.message,
          results: {
            total_rows: data.length,
            columns: Object.keys(data[0] || {}),
            quality_score: 0.5, // Default score
            warnings: ['Using fallback data processing due to error'],
            metadata: {
              processed_at: new Date().toISOString(),
              method: 'fallback',
            },
          },
        };
      },

      // Anomaly Detection fallback
      anomalyDetection: async (data, error) => {
        console.log('🔄 Using anomaly detection fallback');

        const amounts = data.map((row) => parseFloat(row.amount)).filter((a) => !isNaN(a));
        const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
        const std = Math.sqrt(amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length);

        const anomalies = data.filter((row) => {
          const amount = parseFloat(row.amount);
          return Math.abs(amount - mean) > 2 * std;
        });

        return {
          success: true,
          fallback: true,
          error: error.message,
          results: {
            anomalies_found: anomalies.length,
            anomaly_rate: anomalies.length / data.length,
            method: 'statistical_threshold',
            anomalies: anomalies.slice(0, 20).map((a) => ({
              index: data.indexOf(a),
              amount: a.amount,
              score: Math.abs(parseFloat(a.amount) - mean) / std,
            })),
          },
        };
      },

      // Python Communication fallback
      pythonCommunication: async (data, error) => {
        console.log('🔄 Using Python communication fallback');

        return {
          success: true,
          fallback: true,
          error: error.message,
          results: {
            message: 'Python analysis unavailable, using JavaScript fallback',
            analysis_completed: true,
            method: 'javascript_fallback',
          },
        };
      },

      // Database Operations fallback
      databaseOperations: async (operation, error) => {
        console.log('🔄 Using database operations fallback');

        return {
          success: true,
          fallback: true,
          error: error.message,
          results: {
            message: 'Database operation failed, using in-memory fallback',
            operation,
            method: 'in_memory_fallback',
          },
        };
      },
    };
  }

  initializeErrorRecovery() {
    return {
      // Retry mechanism with exponential backoff
      retry: async (operation, maxRetries = 3, baseDelay = 1000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }

            const delay = baseDelay * 2 ** (attempt - 1);
            console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
            await this.sleep(delay);
          }
        }
      },

      // Graceful degradation
      gracefulDegradation: async (operations) => {
        const results = {};

        for (const [name, operation] of Object.entries(operations)) {
          try {
            results[name] = await operation();
          } catch (error) {
            console.warn(`⚠️ Operation ${name} failed: ${error.message}`);
            results[name] = {
              success: false,
              error: error.message,
              degraded: true,
            };
          }
        }

        return results;
      },

      // Partial success handling
      partialSuccess: async (operations) => {
        const results = {
          successful: {},
          failed: {},
          partial: true,
        };

        for (const [name, operation] of Object.entries(operations)) {
          try {
            results.successful[name] = await operation();
          } catch (error) {
            console.warn(`⚠️ Operation ${name} failed: ${error.message}`);
            results.failed[name] = {
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        }

        return results;
      },
    };
  }

  initializeMonitoring() {
    return {
      errors: [],
      performance: {},
      health: {},

      // Record error
      recordError: (service, error, context = {}) => {
        const errorRecord = {
          service,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          context,
        };

        this.monitoring.errors.push(errorRecord);

        // Keep only last 100 errors
        if (this.monitoring.errors.length > 100) {
          this.monitoring.errors = this.monitoring.errors.slice(-100);
        }

        console.error(`❌ Error in ${service}: ${error.message}`);
      },

      // Record performance
      recordPerformance: (service, duration, success = true) => {
        if (!this.monitoring.performance[service]) {
          this.monitoring.performance[service] = {
            total_calls: 0,
            successful_calls: 0,
            failed_calls: 0,
            avg_duration: 0,
            min_duration: Infinity,
            max_duration: 0,
          };
        }

        const perf = this.monitoring.performance[service];
        perf.total_calls++;

        if (success) {
          perf.successful_calls++;
        } else {
          perf.failed_calls++;
        }

        // Update duration statistics
        perf.avg_duration = (perf.avg_duration * (perf.total_calls - 1) + duration) / perf.total_calls;
        perf.min_duration = Math.min(perf.min_duration, duration);
        perf.max_duration = Math.max(perf.max_duration, duration);
      },

      // Get health status
      getHealthStatus: () => {
        const health = {
          overall: 'healthy',
          services: {},
          circuit_breakers: {},
          error_rate: 0,
        };

        // Check circuit breakers
        Object.entries(this.circuitBreakers).forEach(([name, breaker]) => {
          health.circuit_breakers[name] = {
            status: breaker.isOpen ? 'open' : 'closed',
            failures: breaker.failures,
            last_failure: breaker.lastFailureTime,
          };
        });

        // Check service performance
        Object.entries(this.monitoring.performance).forEach(([service, perf]) => {
          const errorRate = perf.failed_calls / perf.total_calls;
          health.services[service] = {
            status: errorRate > 0.1 ? 'degraded' : 'healthy',
            error_rate: errorRate,
            avg_duration: perf.avg_duration,
            total_calls: perf.total_calls,
          };
        });

        // Calculate overall health
        const openBreakers = Object.values(this.circuitBreakers).filter((b) => b.isOpen).length;
        const degradedServices = Object.values(health.services).filter((s) => s.status === 'degraded').length;

        if (openBreakers > 2 || degradedServices > 2) {
          health.overall = 'unhealthy';
        } else if (openBreakers > 0 || degradedServices > 0) {
          health.overall = 'degraded';
        }

        return health;
      },
    };
  }

  // Main error boundary wrapper
  async withErrorBoundary(service, operation, fallback = null) {
    const startTime = Date.now();
    const circuitBreaker = this.circuitBreakers[service];

    if (!circuitBreaker) {
      throw new Error(`Unknown service: ${service}`);
    }

    // Check if circuit breaker is open
    if (circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < circuitBreaker.timeout) {
        console.warn(`🚫 Circuit breaker for ${service} is open, using fallback`);
        return this.executeFallback(service, fallback);
      }
      // Reset circuit breaker
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      console.log(`🔄 Circuit breaker for ${service} reset`);
    }

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Record success
      this.monitoring.recordPerformance(service, duration, true);
      circuitBreaker.failures = 0;

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failure
      this.monitoring.recordError(service, error);
      this.monitoring.recordPerformance(service, duration, false);

      // Update circuit breaker
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failures >= circuitBreaker.threshold) {
        circuitBreaker.isOpen = true;
        console.warn(`⚠️ Circuit breaker for ${service} opened after ${circuitBreaker.failures} failures`);
      }

      // Execute fallback
      return this.executeFallback(service, fallback, error);
    }
  }

  // Execute fallback operation
  async executeFallback(service, fallback, error = null) {
    if (fallback) {
      try {
        return await fallback(error);
      } catch (fallbackError) {
        this.monitoring.recordError(`${service}_fallback`, fallbackError);
        throw new Error(`Both primary and fallback operations failed for ${service}`);
      }
    }

    // Use default fallback if available
    if (this.fallbacks[service]) {
      return await this.fallbacks[service](null, error);
    }

    throw error || new Error(`No fallback available for ${service}`);
  }

  // Circuit breaker management
  resetCircuitBreaker(service) {
    const breaker = this.circuitBreakers[service];
    if (breaker) {
      breaker.isOpen = false;
      breaker.failures = 0;
      breaker.lastFailureTime = 0;
      console.log(`🔄 Circuit breaker for ${service} manually reset`);
    }
  }

  getCircuitBreakerStatus(service) {
    const breaker = this.circuitBreakers[service];
    if (!breaker) return null;

    return {
      service: breaker.name,
      isOpen: breaker.isOpen,
      failures: breaker.failures,
      threshold: breaker.threshold,
      lastFailureTime: breaker.lastFailureTime,
      timeSinceLastFailure: Date.now() - breaker.lastFailureTime,
    };
  }

  // Error recovery methods
  async retryOperation(operation, maxRetries = 3) {
    return this.errorRecovery.retry(operation, maxRetries);
  }

  async executeWithGracefulDegradation(operations) {
    return this.errorRecovery.gracefulDegradation(operations);
  }

  async executeWithPartialSuccess(operations) {
    return this.errorRecovery.partialSuccess(operations);
  }

  // Monitoring methods
  getErrorLog() {
    return this.monitoring.errors;
  }

  getPerformanceMetrics() {
    return this.monitoring.performance;
  }

  getHealthStatus() {
    return this.monitoring.getHealthStatus();
  }

  // Utility methods
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Cleanup method
  cleanup() {
    // Reset all circuit breakers
    Object.keys(this.circuitBreakers).forEach((service) => {
      this.resetCircuitBreaker(service);
    });

    // Clear monitoring data
    this.monitoring.errors = [];
    this.monitoring.performance = {};

    console.log('🧹 Error boundary service cleaned up');
  }
}

module.exports = ErrorBoundaryService;

const { v4: uuidv4 } = require('uuid');

/**
 * Comprehensive Error Handling Service
 * Provides structured error responses and logging for the Sygnify Analytics platform
 */
class ErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      PROCESSING_ERROR: 'PROCESSING_ERROR',
      PYTHON_ERROR: 'PYTHON_ERROR',
      DATABASE_ERROR: 'DATABASE_ERROR',
      FILE_ERROR: 'FILE_ERROR',
      ML_ERROR: 'ML_ERROR',
      AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
      RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical',
    };
  }

  /**
     * Create a structured error response
     */
  createErrorResponse(error, context = {}) {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();

    // Determine error type and severity
    const errorInfo = this.analyzeError(error);

    // Create structured error response
    const errorResponse = {
      success: false,
      error: {
        id: errorId,
        type: errorInfo.type,
        severity: errorInfo.severity,
        message: errorInfo.message,
        details: errorInfo.details,
        timestamp,
        context: {
          ...context,
          stack_trace: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          user_agent: context.userAgent,
          ip_address: context.ipAddress,
          endpoint: context.endpoint,
          method: context.method,
        },
        suggestions: this.generateSuggestions(errorInfo.type, errorInfo.details),
        recovery_actions: this.generateRecoveryActions(errorInfo.type, errorInfo.severity),
      },
      metadata: {
        request_id: context.requestId || errorId,
        processing_time_ms: context.processingTime || 0,
        timestamp,
        version: process.env.APP_VERSION || '1.0.0',
      },
    };

    // Log the error
    this.logError(errorResponse, context);

    return errorResponse;
  }

  /**
     * Analyze error and determine type, severity, and details
     */
  analyzeError(error) {
    const errorMessage = error.message || error.toString();
    const errorStack = error.stack || '';

    // Determine error type based on message and stack
    let type = this.errorTypes.UNKNOWN_ERROR;
    let severity = this.severityLevels.MEDIUM;
    let details = {};

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')
            || errorMessage.includes('required') || errorMessage.includes('format')) {
      type = this.errorTypes.VALIDATION_ERROR;
      severity = this.severityLevels.LOW;
      details = { field: this.extractFieldFromError(errorMessage) };
    }

    // File processing errors
    else if (errorMessage.includes('file') || errorMessage.includes('upload')
                 || errorMessage.includes('multer') || errorMessage.includes('csv')) {
      type = this.errorTypes.FILE_ERROR;
      severity = this.severityLevels.MEDIUM;
      details = {
        file_type: this.extractFileType(errorMessage),
        file_size: this.extractFileSize(errorMessage),
      };
    }

    // Python analysis errors
    else if (errorMessage.includes('python') || errorMessage.includes('pandas')
                 || errorMessage.includes('numpy') || errorStack.includes('analyze.py')) {
      type = this.errorTypes.PYTHON_ERROR;
      severity = this.severityLevels.HIGH;
      details = {
        python_module: this.extractPythonModule(errorStack),
        analysis_step: this.extractAnalysisStep(errorMessage),
      };
    }

    // Database errors
    else if (errorMessage.includes('database') || errorMessage.includes('sql')
                 || errorMessage.includes('db') || errorMessage.includes('connection')) {
      type = this.errorTypes.DATABASE_ERROR;
      severity = this.severityLevels.HIGH;
      details = {
        operation: this.extractDatabaseOperation(errorMessage),
        table: this.extractTableName(errorMessage),
      };
    }

    // ML processing errors
    else if (errorMessage.includes('ml') || errorMessage.includes('model')
                 || errorMessage.includes('prediction') || errorMessage.includes('pattern')) {
      type = this.errorTypes.ML_ERROR;
      severity = this.severityLevels.MEDIUM;
      details = {
        ml_component: this.extractMLComponent(errorMessage),
        data_size: this.extractDataSize(errorMessage),
      };
    }

    // Authentication errors
    else if (errorMessage.includes('auth') || errorMessage.includes('token')
                 || errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      type = this.errorTypes.AUTHENTICATION_ERROR;
      severity = this.severityLevels.MEDIUM;
      details = {
        auth_method: this.extractAuthMethod(errorMessage),
        required_permissions: this.extractRequiredPermissions(errorMessage),
      };
    }

    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')
                 || errorMessage.includes('ETIMEDOUT')) {
      type = this.errorTypes.TIMEOUT_ERROR;
      severity = this.severityLevels.MEDIUM;
      details = {
        timeout_duration: this.extractTimeoutDuration(errorMessage),
        operation: this.extractTimeoutOperation(errorMessage),
      };
    }

    // Rate limit errors
    else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')
                 || errorMessage.includes('429')) {
      type = this.errorTypes.RATE_LIMIT_ERROR;
      severity = this.severityLevels.LOW;
      details = {
        limit_type: this.extractLimitType(errorMessage),
        retry_after: this.extractRetryAfter(errorMessage),
      };
    }

    // Processing errors (catch-all for business logic)
    else if (errorMessage.includes('processing') || errorMessage.includes('analysis')
                 || errorMessage.includes('calculation')) {
      type = this.errorTypes.PROCESSING_ERROR;
      severity = this.severityLevels.MEDIUM;
      details = {
        processing_step: this.extractProcessingStep(errorMessage),
        data_quality: this.extractDataQualityInfo(errorMessage),
      };
    }

    // Upgrade severity for critical errors
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')
            || errorMessage.includes('crash') || errorMessage.includes('memory')) {
      severity = this.severityLevels.CRITICAL;
    }

    return {
      type,
      severity,
      message: this.sanitizeErrorMessage(errorMessage),
      details,
    };
  }

  /**
     * Generate helpful suggestions based on error type
     */
  generateSuggestions(errorType, details) {
    const suggestions = {
      [this.errorTypes.VALIDATION_ERROR]: [
        'Check that all required fields are provided',
        'Verify data format matches expected schema',
        'Ensure file encoding is UTF-8',
        'Review column headers and data types',
      ],
      [this.errorTypes.FILE_ERROR]: [
        'Ensure file is not corrupted or empty',
        'Check file size is within limits (500MB max)',
        'Verify file format is supported (CSV, JSON, Excel)',
        'Try uploading a smaller sample file first',
      ],
      [this.errorTypes.PYTHON_ERROR]: [
        'Check Python dependencies are installed',
        'Verify data format is compatible with pandas',
        'Ensure sufficient memory for large datasets',
        'Try processing a smaller data sample',
      ],
      [this.errorTypes.DATABASE_ERROR]: [
        'Check database connection and credentials',
        'Verify database schema and permissions',
        'Ensure sufficient disk space',
        'Check for database locks or conflicts',
      ],
      [this.errorTypes.ML_ERROR]: [
        'Verify data quality and completeness',
        'Check for sufficient data points (minimum 10 records)',
        'Ensure numeric columns contain valid numbers',
        'Try different analysis parameters',
      ],
      [this.errorTypes.AUTHENTICATION_ERROR]: [
        'Verify your login credentials',
        'Check if your session has expired',
        'Ensure you have required permissions',
        'Contact administrator for access issues',
      ],
      [this.errorTypes.TIMEOUT_ERROR]: [
        'Try processing a smaller dataset',
        'Check your internet connection',
        'Wait a few minutes and try again',
        'Contact support if issue persists',
      ],
      [this.errorTypes.RATE_LIMIT_ERROR]: [
        'Wait before making another request',
        'Reduce request frequency',
        'Check your subscription limits',
        'Upgrade plan for higher limits',
      ],
      [this.errorTypes.PROCESSING_ERROR]: [
        'Check data quality and completeness',
        'Verify file format and encoding',
        'Try processing a smaller sample',
        'Contact support with error details',
      ],
      [this.errorTypes.UNKNOWN_ERROR]: [
        'Try refreshing the page',
        'Check your internet connection',
        'Clear browser cache and cookies',
        'Contact support with error details',
      ],
    };

    return suggestions[errorType] || suggestions[this.errorTypes.UNKNOWN_ERROR];
  }

  /**
     * Generate recovery actions based on error type and severity
     */
  generateRecoveryActions(errorType, severity) {
    const actions = [];

    // Automatic recovery actions
    if (severity === this.severityLevels.LOW) {
      actions.push('Retry operation automatically');
    }

    if (errorType === this.errorTypes.FILE_ERROR) {
      actions.push('Attempt file format conversion');
      actions.push('Sample data for validation');
    }

    if (errorType === this.errorTypes.PYTHON_ERROR) {
      actions.push('Fall back to basic analysis');
      actions.push('Use alternative processing method');
    }

    if (errorType === this.errorTypes.TIMEOUT_ERROR) {
      actions.push('Implement progressive processing');
      actions.push('Queue for background processing');
    }

    // Manual recovery actions
    if (severity === this.severityLevels.HIGH || severity === this.severityLevels.CRITICAL) {
      actions.push('Contact system administrator');
      actions.push('Review system logs');
    }

    return actions;
  }

  /**
     * Log error with appropriate level
     */
  logError(errorResponse, context) {
    const { error } = errorResponse;

    const logEntry = {
      timestamp: error.timestamp,
      error_id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: {
        endpoint: context.endpoint,
        method: context.method,
        user_id: context.userId,
        ip_address: context.ipAddress,
      },
    };

    // Log based on severity
    switch (error.severity) {
      case this.severityLevels.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logEntry);
        break;
      case this.severityLevels.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logEntry);
        break;
      case this.severityLevels.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logEntry);
        break;
      case this.severityLevels.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logEntry);
        break;
    }
  }

  /**
     * Extract information from error messages
     */
  extractFieldFromError(message) {
    const fieldMatch = message.match(/field[:\s]+([^\s,]+)/i);
    return fieldMatch ? fieldMatch[1] : 'unknown';
  }

  extractFileType(message) {
    const typeMatch = message.match(/\.([a-z]+)/i);
    return typeMatch ? typeMatch[1] : 'unknown';
  }

  extractFileSize(message) {
    const sizeMatch = message.match(/(\d+)\s*(MB|KB|GB)/i);
    return sizeMatch ? `${sizeMatch[1]}${sizeMatch[2]}` : 'unknown';
  }

  extractPythonModule(stack) {
    const moduleMatch = stack.match(/at.*?([^\/\\]+\.py)/);
    return moduleMatch ? moduleMatch[1] : 'unknown';
  }

  extractAnalysisStep(message) {
    const stepMatch = message.match(/(analysis|processing|calculation|validation)/i);
    return stepMatch ? stepMatch[1] : 'unknown';
  }

  extractDatabaseOperation(message) {
    const opMatch = message.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE)/i);
    return opMatch ? opMatch[1] : 'unknown';
  }

  extractTableName(message) {
    const tableMatch = message.match(/table[:\s]+([^\s,]+)/i);
    return tableMatch ? tableMatch[1] : 'unknown';
  }

  extractMLComponent(message) {
    const componentMatch = message.match(/(pattern|anomaly|prediction|clustering|classification)/i);
    return componentMatch ? componentMatch[1] : 'unknown';
  }

  extractDataSize(message) {
    const sizeMatch = message.match(/(\d+)\s*records?/i);
    return sizeMatch ? `${sizeMatch[1]} records` : 'unknown';
  }

  extractAuthMethod(message) {
    const authMatch = message.match(/(token|password|oauth|api_key)/i);
    return authMatch ? authMatch[1] : 'unknown';
  }

  extractRequiredPermissions(message) {
    const permMatch = message.match(/permission[:\s]+([^\s,]+)/i);
    return permMatch ? permMatch[1] : 'unknown';
  }

  extractTimeoutDuration(message) {
    const durationMatch = message.match(/(\d+)\s*(ms|s|m)/i);
    return durationMatch ? `${durationMatch[1]}${durationMatch[2]}` : 'unknown';
  }

  extractTimeoutOperation(message) {
    const opMatch = message.match(/(upload|download|processing|analysis)/i);
    return opMatch ? opMatch[1] : 'unknown';
  }

  extractLimitType(message) {
    const limitMatch = message.match(/(rate|request|concurrent)/i);
    return limitMatch ? limitMatch[1] : 'unknown';
  }

  extractRetryAfter(message) {
    const retryMatch = message.match(/(\d+)\s*(s|m|h)/i);
    return retryMatch ? `${retryMatch[1]}${retryMatch[2]}` : 'unknown';
  }

  extractProcessingStep(message) {
    const stepMatch = message.match(/(parsing|validation|analysis|calculation|export)/i);
    return stepMatch ? stepMatch[1] : 'unknown';
  }

  extractDataQualityInfo(message) {
    const qualityMatch = message.match(/(missing|invalid|corrupted|incomplete)/i);
    return qualityMatch ? qualityMatch[1] : 'unknown';
  }

  /**
     * Sanitize error message for user display
     */
  sanitizeErrorMessage(message) {
    // Remove sensitive information
    let sanitized = message
      .replace(/password[:\s]*[^\s,]+/gi, 'password: [REDACTED]')
      .replace(/token[:\s]*[^\s,]+/gi, 'token: [REDACTED]')
      .replace(/key[:\s]*[^\s,]+/gi, 'key: [REDACTED]')
      .replace(/secret[:\s]*[^\s,]+/gi, 'secret: [REDACTED]');

    // Limit message length
    if (sanitized.length > 200) {
      sanitized = `${sanitized.substring(0, 197)}...`;
    }

    return sanitized;
  }

  /**
     * Create a success response wrapper
     */
  createSuccessResponse(data, context = {}) {
    return {
      success: true,
      data,
      metadata: {
        request_id: context.requestId || uuidv4(),
        processing_time_ms: context.processingTime || 0,
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
      },
    };
  }
}

module.exports = ErrorHandler;

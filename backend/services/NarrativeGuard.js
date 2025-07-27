/**
 * Narrative Guard Service
 * Prevents misleading narratives and ensures accurate reporting
 * when data is insufficient or invalid
 */
class NarrativeGuard {
  constructor() {
    this.dataThresholds = {
      minRecordsForAnalysis: 10,
      minNumericColumns: 1,
      minDataQuality: 50, // Minimum quality score
      maxNullPercentage: 80,
    };

    this.fallbackNarratives = {
      emptyData: {
        headline: '⚠️ Data Analysis Incomplete',
        summary: 'No valid transaction records were detected in the uploaded file. As a result, financial scores, fraud risk assessments, and forecasting models could not be computed.',
        recommendations: [
          'Ensure your CSV includes valid transaction data with key columns such as amount, current_balance, and transaction_date',
          'Check that your file contains at least 10 records with meaningful data',
          'Verify that column headers are properly named (not auto-numbered like 0, 1, 2)',
        ],
      },
      insufficientData: {
        headline: '⚠️ Limited Data Available',
        summary: 'The uploaded file contains insufficient data for comprehensive analysis. Some metrics and predictions may be unreliable.',
        recommendations: [
          'Add more data records (minimum 10 recommended)',
          'Ensure at least one numeric column is present',
          'Clean data by removing excessive null values',
        ],
      },
      poorQuality: {
        headline: '⚠️ Data Quality Issues Detected',
        summary: 'The uploaded data has quality issues that may affect analysis accuracy. Results should be interpreted with caution.',
        recommendations: [
          'Clean data by removing or filling null values',
          'Ensure consistent data types across columns',
          'Verify column headers are meaningful and descriptive',
        ],
      },
      schemaMismatch: {
        headline: '⚠️ Schema Validation Failed',
        summary: "The uploaded file doesn't match the expected schema for this analysis domain. Some features may be unavailable.",
        recommendations: [
          'Check that required columns are present for your selected domain',
          'Ensure column names match expected format',
          'Consider using a different analysis domain or updating your data format',
        ],
      },
    };
  }

  /**
     * Validate narrative data before generation
     */
  validateNarrativeData(data, domain = 'general') {
    const issues = [];
    const warnings = [];

    // Check if data exists
    if (!data || Object.keys(data).length === 0) {
      issues.push('NO_DATA');
      return {
        isValid: false, issues, warnings, fallbackType: 'emptyData',
      };
    }

    // Check record count
    const recordCount = this.getRecordCount(data);
    if (recordCount < this.dataThresholds.minRecordsForAnalysis) {
      issues.push('INSUFFICIENT_RECORDS');
      warnings.push(`Only ${recordCount} records found (minimum ${this.dataThresholds.minRecordsForAnalysis} recommended)`);
    }

    // Check for numeric columns
    const numericColumns = this.getNumericColumns(data);
    if (numericColumns.length < this.dataThresholds.minNumericColumns) {
      issues.push('NO_NUMERIC_DATA');
      warnings.push('No numeric columns detected for analysis');
    }

    // Check data quality
    const qualityScore = this.calculateDataQuality(data);
    if (qualityScore < this.dataThresholds.minDataQuality) {
      issues.push('POOR_QUALITY');
      warnings.push(`Data quality score: ${qualityScore.toFixed(1)}% (minimum ${this.dataThresholds.minDataQuality}% recommended)`);
    }

    // Check for null values
    const nullPercentage = this.calculateNullPercentage(data);
    if (nullPercentage > this.dataThresholds.maxNullPercentage) {
      issues.push('EXCESSIVE_NULLS');
      warnings.push(`${nullPercentage.toFixed(1)}% of data is null/empty`);
    }

    // Check schema compliance
    const schemaIssues = this.validateSchema(data, domain);
    if (schemaIssues.length > 0) {
      issues.push('SCHEMA_MISMATCH');
      warnings.push(...schemaIssues);
    }

    // Determine fallback type
    let fallbackType = null;
    if (issues.includes('NO_DATA')) {
      fallbackType = 'emptyData';
    } else if (issues.includes('SCHEMA_MISMATCH')) {
      fallbackType = 'schemaMismatch';
    } else if (issues.includes('POOR_QUALITY') || issues.includes('EXCESSIVE_NULLS')) {
      fallbackType = 'poorQuality';
    } else if (issues.includes('INSUFFICIENT_RECORDS') || issues.includes('NO_NUMERIC_DATA')) {
      fallbackType = 'insufficientData';
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      fallbackType,
      metrics: {
        recordCount,
        numericColumns: numericColumns.length,
        qualityScore,
        nullPercentage,
      },
    };
  }

  /**
     * Generate appropriate narrative based on data quality
     */
  generateAppropriateNarrative(validationResult, originalNarrative = null) {
    if (validationResult.isValid) {
      return {
        shouldUseOriginal: true,
        narrative: originalNarrative,
        warnings: [],
      };
    }

    const fallback = this.fallbackNarratives[validationResult.fallbackType];
    if (!fallback) {
      return {
        shouldUseOriginal: false,
        narrative: this.createGenericFallback(validationResult),
        warnings: validationResult.warnings,
      };
    }

    return {
      shouldUseOriginal: false,
      narrative: this.createFallbackNarrative(fallback, validationResult),
      warnings: validationResult.warnings,
    };
  }

  /**
     * Create fallback narrative with specific details
     */
  createFallbackNarrative(fallback, validationResult) {
    const { metrics } = validationResult;

    return {
      headline: fallback.headline,
      summary: fallback.summary,
      details: {
        recordCount: metrics?.recordCount || 0,
        qualityScore: metrics?.qualityScore || 0,
        nullPercentage: metrics?.nullPercentage || 0,
        numericColumns: metrics?.numericColumns || 0,
      },
      recommendations: fallback.recommendations,
      issues: validationResult.issues || [],
      warnings: validationResult.warnings || [],
    };
  }

  /**
     * Create generic fallback when specific type not found
     */
  createGenericFallback(validationResult) {
    return {
      headline: '⚠️ Analysis Issues Detected',
      summary: 'The uploaded data has issues that prevent comprehensive analysis. Please review the warnings below.',
      details: validationResult.metrics,
      recommendations: [
        'Check your CSV file format and column headers',
        'Ensure data contains meaningful values',
        'Add more records if analysis requires larger datasets',
      ],
      issues: validationResult.issues,
      warnings: validationResult.warnings,
    };
  }

  /**
     * Validate ML summary data
     */
  validateMLSummary(mlSummary) {
    const issues = [];
    const warnings = [];

    if (!mlSummary) {
      issues.push('NO_ML_SUMMARY');
      return { isValid: false, issues, warnings };
    }

    // Check for contradictory information
    if (mlSummary.metadata) {
      const { metadata } = mlSummary;

      // Check if records analyzed matches actual data
      if (metadata.recordsAnalyzed && metadata.recordsAnalyzed > 0) {
        if (mlSummary.summary && mlSummary.summary.includes('0 records')) {
          issues.push('CONTRADICTORY_RECORD_COUNT');
          warnings.push('ML metadata shows records analyzed but summary indicates no data');
        }
      }

      // Check for impossible predictions
      if (mlSummary.predictions && Object.keys(mlSummary.predictions).length > 0) {
        if (metadata.recordsAnalyzed === 0) {
          issues.push('IMPOSSIBLE_PREDICTIONS');
          warnings.push('Predictions generated despite zero records analyzed');
        }
      }
    }

    // Check for misleading risk assessments
    if (mlSummary.riskProfile) {
      const { riskProfile } = mlSummary;

      if (riskProfile.level === 'LOW' && riskProfile.factors && riskProfile.factors.length > 0) {
        warnings.push('Risk level is LOW but risk factors were identified');
      }

      if (riskProfile.score === 0 && riskProfile.level !== 'LOW') {
        issues.push('INCONSISTENT_RISK_SCORE');
        warnings.push('Risk score is 0 but risk level is not LOW');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
     * Sanitize ML summary to prevent misleading information
     */
  sanitizeMLSummary(mlSummary, validationResult) {
    if (!mlSummary) return mlSummary;

    const sanitized = { ...mlSummary };

    // Remove impossible predictions if no data
    if (validationResult.metrics.recordCount === 0) {
      if (sanitized.predictions) {
        delete sanitized.predictions;
      }
      if (sanitized.forecasts) {
        delete sanitized.forecasts;
      }
    }

    // Adjust risk profile if contradictory
    if (sanitized.riskProfile) {
      if (validationResult.metrics.recordCount === 0) {
        sanitized.riskProfile = {
          level: 'UNKNOWN',
          score: 0,
          factors: ['No data available for risk assessment'],
        };
      }
    }

    // Update metadata to be accurate
    if (sanitized.metadata) {
      sanitized.metadata.recordsAnalyzed = validationResult.metrics.recordCount;
      sanitized.metadata.dataQuality = validationResult.metrics.qualityScore;
    }

    return sanitized;
  }

  /**
     * Get record count from various data structures
     */
  getRecordCount(data) {
    if (data.metadata && data.metadata.totalRecords) {
      return data.metadata.totalRecords;
    }
    if (data.metadata && data.metadata.validRecords) {
      return data.metadata.validRecords;
    }
    if (data.results && Object.keys(data.results).length > 0) {
      const firstColumn = Object.values(data.results)[0];
      return firstColumn.count || 0;
    }
    if (Array.isArray(data)) {
      return data.length;
    }
    return 0;
  }

  /**
     * Get numeric columns from data
     */
  getNumericColumns(data) {
    const numericColumns = [];

    if (data.results) {
      Object.keys(data.results).forEach((column) => {
        const result = data.results[column];
        if (result && typeof result.average === 'number' && !isNaN(result.average)) {
          numericColumns.push(column);
        }
      });
    }

    if (data.dataQuality && data.dataQuality.columns) {
      data.dataQuality.columns.forEach((column) => {
        if (column.dataType === 'numeric' || column.type === 'number') {
          numericColumns.push(column.name);
        }
      });
    }

    return numericColumns;
  }

  /**
     * Calculate data quality score
     */
  calculateDataQuality(data) {
    if (data.dataQuality && data.dataQuality.overallScore) {
      return data.dataQuality.overallScore;
    }

    // Fallback calculation
    let score = 100;

    if (data.validation && data.validation.summary) {
      const { summary } = data.validation;
      if (summary.errorRate > 0) {
        score -= summary.errorRate;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
     * Calculate null percentage
     */
  calculateNullPercentage(data) {
    if (data.validation && data.validation.summary) {
      const { summary } = data.validation;
      return summary.errorRate || 0;
    }

    // Fallback calculation
    if (data.dataQuality && data.dataQuality.columns) {
      const nullPercentages = data.dataQuality.columns
        .map((col) => col.nullPercentage || 0)
        .filter((p) => !isNaN(p));

      if (nullPercentages.length > 0) {
        return nullPercentages.reduce((a, b) => a + b, 0) / nullPercentages.length;
      }
    }

    return 0;
  }

  /**
     * Validate schema against domain requirements
     */
  validateSchema(data, domain) {
    const issues = [];

    if (!data.metadata || !data.metadata.columns) {
      return issues;
    }

    const { columns } = data.metadata;
    const requiredColumns = this.getRequiredColumns(domain);

    if (requiredColumns.length > 0) {
      const missingColumns = requiredColumns.filter((col) => !columns.includes(col));
      if (missingColumns.length > 0) {
        issues.push(`Missing required columns for ${domain} analysis: ${missingColumns.join(', ')}`);
      }
    }

    return issues;
  }

  /**
     * Get required columns for domain
     */
  getRequiredColumns(domain) {
    const requirements = {
      finance: ['transaction_id', 'amount', 'date'],
      advertising: ['campaign_id', 'impressions', 'clicks'],
      supply_chain: ['order_id', 'quantity', 'supplier'],
      hr: ['employee_id', 'salary', 'department'],
      operations: ['process_id', 'duration', 'status'],
    };

    return requirements[domain] || [];
  }
}

module.exports = NarrativeGuard;

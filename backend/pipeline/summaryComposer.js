const { runPythonModel } = require('../ml/runModelBridge');
const { generatePrompt } = require('../llama/generatePrompt');
const { callLlamaAPI } = require('../llama/callLlamaAPI');

/**
 * Summary Composer
 * Orchestrates the complete pipeline: ML Analysis → LLaMA Narrative → Final Report
 */
class SummaryComposer {
  constructor() {
    this.mlBridge = null;
    this.promptGenerator = null;
    this.llamaAPI = null;
    this.cache = new Map();
    this.metrics = {
      totalReports: 0,
      averageProcessingTime: 0,
      successRate: 0,
      errors: [],
    };
  }

  /**
     * Initialize the summary composer
     */
  async initialize() {
    try {
      // Initialize ML bridge
      const { mlModelBridge } = require('../ml/runModelBridge');
      this.mlBridge = mlModelBridge;
      await this.mlBridge.initialize();

      // Initialize prompt generator
      const { llamaPromptGenerator } = require('../llama/generatePrompt');
      this.promptGenerator = llamaPromptGenerator;
      await this.promptGenerator.initialize();

      // Initialize LLaMA API
      this.llamaAPI = require('../llama/callLlamaAPI');

      console.log('✅ Summary Composer initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Summary Composer:', error.message);
      throw error;
    }
  }

  /**
     * Generate complete financial analysis report
     * @param {Object} validatedData - Validated input data
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Complete analysis report
     */
  async generateFullReport(validatedData, options = {}) {
    const startTime = Date.now();
    const reportId = this.generateReportId();

    console.log(`📊 Generating full report: ${reportId}`);

    try {
      // Step 1: Run Python ML Analysis
      const mlResults = await this.runMLAnalysis(validatedData, options);

      // Step 2: Generate LLaMA Prompt
      const prompt = await this.generateLLAMAPrompt(mlResults, options);

      // Step 3: Get LLaMA Narrative
      const narrative = await this.getLLAMANarrative(prompt, options);

      // Step 4: Compose Final Report
      const finalReport = this.composeFinalReport(mlResults, narrative, options);

      // Step 5: Update Metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(true, processingTime);

      console.log(`✅ Full report generated in ${processingTime}ms`);

      return {
        success: true,
        reportId,
        report: finalReport,
        metadata: {
          processingTime,
          reportId,
          timestamp: new Date().toISOString(),
          mlResults: mlResults.meta,
          promptLength: prompt.length,
          narrativeLength: narrative.length,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime, error.message);

      console.error(`❌ Failed to generate report: ${error.message}`);
      throw error;
    }
  }

  /**
     * Run ML analysis using Python engine
     * @param {Object} validatedData - Validated input data
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - ML analysis results
     */
  async runMLAnalysis(validatedData, options = {}) {
    console.log('🐍 Running ML analysis...');

    try {
      const mlOptions = {
        timeout: options.mlTimeout || 30000,
        batchSize: options.batchSize || 10000,
        ...options.ml,
      };

      let mlResults;

      // Choose processing method based on data size
      if (validatedData.transactions && validatedData.transactions.length > 50000) {
        console.log('📦 Using batch processing for large dataset');
        mlResults = await this.mlBridge.runPythonModelBatch(validatedData.transactions, mlOptions);
      } else if (options.streaming) {
        console.log('🌊 Using streaming processing');
        mlResults = await this.mlBridge.runPythonModelStreaming(validatedData.stream, mlOptions);
      } else {
        console.log('⚡ Using standard processing');
        mlResults = await this.mlBridge.runPythonModel(validatedData, mlOptions);
      }

      console.log('✅ ML analysis completed');
      return mlResults;
    } catch (error) {
      console.error('❌ ML analysis failed:', error.message);
      throw new Error(`ML analysis failed: ${error.message}`);
    }
  }

  /**
     * Generate LLaMA prompt from ML results
     * @param {Object} mlResults - ML analysis results
     * @param {Object} options - Processing options
     * @returns {Promise<string>} - Generated prompt
     */
  async generateLLAMAPrompt(mlResults, options = {}) {
    console.log('🧠 Generating LLaMA prompt...');

    try {
      const promptOptions = {
        template: options.promptTemplate || 'default',
        systemInstructions: options.systemInstructions,
        context: options.context,
        outputFormat: options.outputFormat,
        ...options.prompt,
      };

      const prompt = this.promptGenerator.generatePrompt(mlResults, promptOptions);

      console.log('✅ LLaMA prompt generated');
      return prompt;
    } catch (error) {
      console.error('❌ Failed to generate LLaMA prompt:', error.message);
      throw new Error(`Prompt generation failed: ${error.message}`);
    }
  }

  /**
     * Get narrative from LLaMA API
     * @param {string} prompt - Generated prompt
     * @param {Object} options - Processing options
     * @returns {Promise<string>} - LLaMA narrative
     */
  async getLLAMANarrative(prompt, options = {}) {
    console.log('🤖 Getting LLaMA narrative...');

    try {
      const llamaOptions = {
        model: options.llamaModel || 'llama-3.1-8b-instruct',
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        timeout: options.llamaTimeout || 30000,
        ...options.llama,
      };

      const narrative = await this.llamaAPI.callLlamaAPI(prompt, llamaOptions);

      console.log('✅ LLaMA narrative received');
      return narrative;
    } catch (error) {
      console.error('❌ Failed to get LLaMA narrative:', error.message);
      throw new Error(`LLaMA API failed: ${error.message}`);
    }
  }

  /**
     * Compose final report from ML results and narrative
     * @param {Object} mlResults - ML analysis results
     * @param {string} narrative - LLaMA generated narrative
     * @param {Object} options - Processing options
     * @returns {Object} - Final composed report
     */
  composeFinalReport(mlResults, narrative, options = {}) {
    console.log('📄 Composing final report...');

    try {
      const report = {
        summary: narrative,
        insights: {
          summary: mlResults.summary,
          flags: mlResults.flags,
          metrics: mlResults.metrics,
          anomalies: mlResults.anomalies || [],
          recommendations: mlResults.recommendations || [],
        },
        analysis: {
          riskLevel: this.calculateRiskLevel(mlResults.summary.riskScore),
          fraudLevel: this.calculateRiskLevel(mlResults.summary.fraudScore),
          confidence: this.calculateConfidenceLevel(mlResults.summary.confidence),
          trend: mlResults.summary.trend,
          keyFindings: this.extractKeyFindings(mlResults),
          alerts: this.generateAlerts(mlResults.flags),
        },
        metadata: {
          recordCount: mlResults.meta.recordCount,
          processingTime: mlResults.meta.processingTime,
          modelVersion: mlResults.meta.modelVersion,
          timestamp: mlResults.meta.timestamp,
          dataQuality: mlResults.meta.dataQuality || {},
        },
      };

      // Add executive summary if requested
      if (options.includeExecutiveSummary) {
        report.executiveSummary = this.generateExecutiveSummary(report);
      }

      // Add risk assessment if requested
      if (options.includeRiskAssessment) {
        report.riskAssessment = this.generateRiskAssessment(report);
      }

      // Add recommendations summary if requested
      if (options.includeRecommendations) {
        report.recommendationsSummary = this.generateRecommendationsSummary(report);
      }

      console.log('✅ Final report composed');
      return report;
    } catch (error) {
      console.error('❌ Failed to compose final report:', error.message);
      throw new Error(`Report composition failed: ${error.message}`);
    }
  }

  /**
     * Generate executive summary
     * @param {Object} report - Complete report
     * @returns {string} - Executive summary
     */
  generateExecutiveSummary(report) {
    const { insights, analysis } = report;
    const { summary } = insights;

    const { netCashFlow } = summary;
    const { riskLevel } = analysis;
    const { confidence } = analysis;
    const { trend } = analysis;

    let summaryText = `Financial analysis of ${insights.metrics.totalTransactions} transactions shows `;

    if (netCashFlow > 0) {
      summaryText += `a positive net cash flow of $${netCashFlow.toLocaleString()}. `;
    } else {
      summaryText += `a negative net cash flow of $${Math.abs(netCashFlow).toLocaleString()}. `;
    }

    summaryText += `The risk level is ${riskLevel.toLowerCase()} with ${confidence} confidence. `;
    summaryText += `Cash flow is ${trend}.`;

    if (insights.anomalies.length > 0) {
      summaryText += ` ${insights.anomalies.length} anomalies were detected requiring attention.`;
    }

    return summaryText;
  }

  /**
     * Generate risk assessment
     * @param {Object} report - Complete report
     * @returns {Object} - Risk assessment
     */
  generateRiskAssessment(report) {
    const { insights, analysis } = report;
    const { summary, flags } = insights;

    const riskFactors = [];

    if (summary.riskScore > 0.7) {
      riskFactors.push('High overall risk score');
    }

    if (summary.fraudScore > 0.6) {
      riskFactors.push('Elevated fraud probability');
    }

    if (flags.velocitySpike) {
      riskFactors.push('Unusual transaction velocity');
    }

    if (flags.highRiskTransactions) {
      riskFactors.push('High-risk transaction patterns');
    }

    if (flags.balanceMismatch) {
      riskFactors.push('Balance reconciliation issues');
    }

    return {
      overallRisk: analysis.riskLevel,
      fraudRisk: analysis.fraudLevel,
      riskFactors,
      confidence: analysis.confidence,
      recommendations: insights.recommendations.filter((rec) => rec.category === 'risk_mitigation' || rec.category === 'fraud_prevention'),
    };
  }

  /**
     * Generate recommendations summary
     * @param {Object} report - Complete report
     * @returns {Object} - Recommendations summary
     */
  generateRecommendationsSummary(report) {
    const { insights } = report;
    const { recommendations } = insights;

    const priorityGroups = {
      critical: recommendations.filter((rec) => rec.priority === 'critical'),
      high: recommendations.filter((rec) => rec.priority === 'high'),
      medium: recommendations.filter((rec) => rec.priority === 'medium'),
      low: recommendations.filter((rec) => rec.priority === 'low'),
    };

    return {
      total: recommendations.length,
      byPriority: priorityGroups,
      byCategory: this.groupRecommendationsByCategory(recommendations),
      topRecommendations: recommendations
        .filter((rec) => rec.priority === 'critical' || rec.priority === 'high')
        .slice(0, 5),
    };
  }

  /**
     * Group recommendations by category
     * @param {Array} recommendations - Recommendations array
     * @returns {Object} - Grouped recommendations
     */
  groupRecommendationsByCategory(recommendations) {
    const categories = {};

    recommendations.forEach((rec) => {
      if (!categories[rec.category]) {
        categories[rec.category] = [];
      }
      categories[rec.category].push(rec);
    });

    return categories;
  }

  /**
     * Calculate risk level from score
     * @param {number} score - Risk score (0-1)
     * @returns {string} - Risk level
     */
  calculateRiskLevel(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    if (score >= 0.2) return 'LOW';
    return 'MINIMAL';
  }

  /**
     * Calculate confidence level from score
     * @param {number} score - Confidence score (0-1)
     * @returns {string} - Confidence level
     */
  calculateConfidenceLevel(score) {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.8) return 'High';
    if (score >= 0.7) return 'Moderate';
    if (score >= 0.6) return 'Low';
    return 'Very Low';
  }

  /**
     * Extract key findings from ML results
     * @param {Object} mlResults - ML analysis results
     * @returns {Array} - Key findings
     */
  extractKeyFindings(mlResults) {
    const findings = [];
    const { summary, flags, metrics } = mlResults;

    // Net cash flow finding
    if (summary.netCashFlow > 0) {
      findings.push(`Positive net cash flow of $${summary.netCashFlow.toLocaleString()}`);
    } else {
      findings.push(`Negative net cash flow of $${Math.abs(summary.netCashFlow).toLocaleString()}`);
    }

    // Risk findings
    if (summary.riskScore > 0.6) {
      findings.push(`High risk score of ${(summary.riskScore * 100).toFixed(1)}%`);
    }

    // Anomaly findings
    if (summary.anomalies > 0) {
      findings.push(`${summary.anomalies} anomalies detected`);
    }

    // Flag findings
    Object.entries(flags).forEach(([flag, value]) => {
      if (value) {
        findings.push(`${flag.replace(/([A-Z])/g, ' $1').toLowerCase()} detected`);
      }
    });

    return findings;
  }

  /**
     * Generate alerts from flags
     * @param {Object} flags - Risk flags
     * @returns {Array} - Alerts
     */
  generateAlerts(flags) {
    const alerts = [];

    Object.entries(flags).forEach(([flag, value]) => {
      if (value) {
        alerts.push({
          type: flag,
          severity: this.getFlagSeverity(flag),
          message: this.getFlagMessage(flag),
        });
      }
    });

    return alerts;
  }

  /**
     * Get flag severity
     * @param {string} flag - Flag name
     * @returns {string} - Severity level
     */
  getFlagSeverity(flag) {
    const severityMap = {
      velocitySpike: 'high',
      balanceMismatch: 'critical',
      highRiskTransactions: 'high',
      unusualAmounts: 'medium',
      timingAnomalies: 'medium',
      geographicAnomalies: 'medium',
      frequencyAnomalies: 'low',
      amountAnomalies: 'low',
    };

    return severityMap[flag] || 'medium';
  }

  /**
     * Get flag message
     * @param {string} flag - Flag name
     * @returns {string} - Human-readable message
     */
  getFlagMessage(flag) {
    const messageMap = {
      velocitySpike: 'Unusual transaction velocity detected',
      balanceMismatch: 'Balance reconciliation issues found',
      highRiskTransactions: 'High-risk transaction patterns identified',
      unusualAmounts: 'Unusual transaction amounts detected',
      timingAnomalies: 'Unusual transaction timing patterns',
      geographicAnomalies: 'Unusual geographic transaction patterns',
      frequencyAnomalies: 'Unusual transaction frequency patterns',
      amountAnomalies: 'Unusual transaction amount patterns',
    };

    return messageMap[flag] || 'Anomaly detected';
  }

  /**
     * Update performance metrics
     * @param {boolean} success - Whether the operation was successful
     * @param {number} processingTime - Processing time in milliseconds
     * @param {string} error - Error message if failed
     */
  updateMetrics(success, processingTime, error = null) {
    this.metrics.totalReports++;

    if (success) {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalReports - 1) + 1) / this.metrics.totalReports;
    } else {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalReports - 1)) / this.metrics.totalReports;
      if (error) {
        this.metrics.errors.push({
          timestamp: new Date().toISOString(),
          error,
        });
      }
    }

    this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalReports - 1) + processingTime) / this.metrics.totalReports;
  }

  /**
     * Get performance metrics
     * @returns {Object} - Performance metrics
     */
  getMetrics() {
    return {
      ...this.metrics,
      recentErrors: this.metrics.errors.slice(-10), // Last 10 errors
    };
  }

  /**
     * Generate unique report ID
     * @returns {string} - Unique report ID
     */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
     * Clear cache
     */
  clearCache() {
    this.cache.clear();
    console.log('✅ Cache cleared');
  }

  /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
const summaryComposer = new SummaryComposer();

// Export both the class and singleton instance
module.exports = { SummaryComposer, summaryComposer };
module.exports.generateFullReport = (validatedData, options) => summaryComposer.generateFullReport(validatedData, options);
module.exports.initialize = () => summaryComposer.initialize();
module.exports.getMetrics = () => summaryComposer.getMetrics();
module.exports.clearCache = () => summaryComposer.clearCache();
module.exports.getCacheStats = () => summaryComposer.getCacheStats();

const fs = require('fs').promises;
const path = require('path');

/**
 * LLaMA 3 Prompt Generator
 * Converts ML engine output into structured prompts for narrative generation
 */
class LLAMAPromptGenerator {
  constructor() {
    this.templates = new Map();
    this.defaultTemplate = null;
    this.templatePath = path.join(__dirname, 'templates');
    this.maxTokens = 4000; // Conservative token limit
    this.initialize();
  }

  /**
     * Initialize prompt generator with templates
     */
  async initialize() {
    try {
      // Load default template
      this.defaultTemplate = await this.loadTemplate('default');

      // Load specialized templates
      await this.loadTemplates();

      console.log('✅ LLaMA Prompt Generator initialized');
    } catch (error) {
      console.error('❌ Failed to initialize LLaMA Prompt Generator:', error.message);
      throw error;
    }
  }

  /**
     * Load all available templates
     */
  async loadTemplates() {
    try {
      const templateFiles = [
        'executive_summary',
        'risk_assessment',
        'fraud_analysis',
        'operational_insights',
        'financial_review',
        'compliance_report',
      ];

      for (const templateName of templateFiles) {
        try {
          const template = await this.loadTemplate(templateName);
          this.templates.set(templateName, template);
        } catch (error) {
          console.warn(`⚠️ Could not load template ${templateName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load templates:', error.message);
    }
  }

  /**
     * Load a specific template
     * @param {string} templateName - Name of the template to load
     * @returns {string} - Template content
     */
  async loadTemplate(templateName) {
    const templatePath = path.join(this.templatePath, `${templateName}.txt`);

    try {
      const content = await fs.readFile(templatePath, 'utf8');
      return content.trim();
    } catch (error) {
      // If template doesn't exist, create default
      if (templateName === 'default') {
        return this.createDefaultTemplate();
      }
      throw new Error(`Template ${templateName} not found: ${error.message}`);
    }
  }

  /**
     * Create default template if none exists
     * @returns {string} - Default template content
     */
  createDefaultTemplate() {
    return `Generate a comprehensive financial analysis report based on the following data:

## Financial Summary
- Net Cash Flow: ${{ netCashFlow }}
- Average Transaction: ${{ avgTransaction }}
- Total Transactions: {{totalTransactions}}
- Total Volume: ${{ totalVolume }}

## Risk Assessment
- Risk Score: {{riskScore}}/1.0 ({{riskLevel}})
- Fraud Score: {{fraudScore}}/1.0 ({{fraudLevel}})
- Confidence Level: {{confidence}}/1.0
- Anomalies Detected: {{anomalies}}

## Key Metrics
- Volatility: {{volatility}}/1.0
- Velocity Score: {{velocityScore}}/1.0
- Trend: {{trend}}
- Liquidity Ratio: {{liquidityRatio}}

## Risk Flags
{{#if velocitySpike}}⚠️ Velocity Spike Detected{{/if}}
{{#if balanceMismatch}}⚠️ Balance Mismatch Detected{{/if}}
{{#if highRiskTransactions}}⚠️ High Risk Transactions Detected{{/if}}
{{#if unusualAmounts}}⚠️ Unusual Amounts Detected{{/if}}

## Analysis Requirements
1. Provide an executive summary of the financial health
2. Assess the risk profile and identify key concerns
3. Explain any anomalies or unusual patterns
4. Provide actionable recommendations
5. Give a confidence assessment of the analysis

Please be concise, professional, and focus on actionable insights.`;
  }

  /**
     * Generate prompt from ML output data
     * @param {Object} mlOutput - Output from Python ML engine
     * @param {Object} options - Generation options
     * @returns {string} - Generated prompt for LLaMA
     */
  generatePrompt(mlOutput, options = {}) {
    try {
      const templateName = options.template || 'default';
      const template = this.templates.get(templateName) || this.defaultTemplate;

      if (!template) {
        throw new Error('No template available for prompt generation');
      }

      // Prepare data for template substitution
      const templateData = this.prepareTemplateData(mlOutput);

      // Generate prompt using template
      let prompt = this.substituteTemplate(template, templateData);

      // Apply post-processing
      prompt = this.postProcessPrompt(prompt, options);

      // Validate prompt length
      this.validatePromptLength(prompt);

      console.log(`✅ Generated LLaMA prompt (${prompt.length} characters)`);

      return prompt;
    } catch (error) {
      console.error('❌ Failed to generate prompt:', error.message);
      throw error;
    }
  }

  /**
     * Prepare data for template substitution
     * @param {Object} mlOutput - ML engine output
     * @returns {Object} - Prepared template data
     */
  prepareTemplateData(mlOutput) {
    const {
      summary, flags, metrics, anomalies, recommendations,
    } = mlOutput;

    // Format numbers for display
    const formatCurrency = (amount) => {
      if (amount === null || amount === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatPercent = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${(value * 100).toFixed(1)}%`;
    };

    const formatNumber = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US').format(value);
    };

    // Determine risk and fraud levels
    const getRiskLevel = (score) => {
      if (score >= 0.8) return 'CRITICAL';
      if (score >= 0.6) return 'HIGH';
      if (score >= 0.4) return 'MEDIUM';
      if (score >= 0.2) return 'LOW';
      return 'MINIMAL';
    };

    const getTrendDescription = (trend) => {
      const descriptions = {
        increasing: 'showing an upward trend',
        decreasing: 'showing a downward trend',
        stable: 'remaining stable',
        volatile: 'showing high volatility',
      };
      return descriptions[trend] || 'showing mixed patterns';
    };

    // Prepare anomaly descriptions
    const anomalyDescriptions = anomalies ? anomalies.map((anomaly) => `- ${anomaly.severity.toUpperCase()}: ${anomaly.description} (Score: ${(anomaly.score * 100).toFixed(1)}%)`).join('\n') : 'None detected';

    // Prepare recommendation descriptions
    const recommendationDescriptions = recommendations ? recommendations.map((rec) => `- ${rec.priority.toUpperCase()} Priority: ${rec.action} (Impact: ${rec.impact})`).join('\n') : 'No specific recommendations';

    return {
      // Summary metrics
      netCashFlow: formatCurrency(summary.netCashFlow),
      avgTransaction: formatCurrency(summary.avgTransaction),
      riskScore: summary.riskScore.toFixed(3),
      fraudScore: summary.fraudScore.toFixed(3),
      confidence: summary.confidence.toFixed(3),
      anomalies: summary.anomalies,
      volatility: summary.volatility.toFixed(3),
      velocityScore: summary.velocityScore.toFixed(3),
      trend: getTrendDescription(summary.trend),
      liquidityRatio: summary.liquidityRatio.toFixed(2),

      // Risk levels
      riskLevel: getRiskLevel(summary.riskScore),
      fraudLevel: getRiskLevel(summary.fraudScore),

      // Metrics
      totalTransactions: formatNumber(metrics.totalTransactions),
      totalVolume: formatCurrency(metrics.totalVolume),
      positiveTransactions: formatNumber(metrics.positiveTransactions),
      negativeTransactions: formatNumber(metrics.negativeTransactions),
      largestTransaction: formatCurrency(metrics.largestTransaction),
      smallestTransaction: formatCurrency(metrics.smallestTransaction),
      uniqueMerchants: formatNumber(metrics.uniqueMerchants),
      uniqueCategories: formatNumber(metrics.uniqueCategories),

      // Flags (boolean values for conditional rendering)
      velocitySpike: flags.velocitySpike,
      balanceMismatch: flags.balanceMismatch,
      highRiskTransactions: flags.highRiskTransactions,
      unusualAmounts: flags.unusualAmounts,
      timingAnomalies: flags.timingAnomalies,
      geographicAnomalies: flags.geographicAnomalies,
      frequencyAnomalies: flags.frequencyAnomalies,
      amountAnomalies: flags.amountAnomalies,

      // Detailed information
      anomalyDescriptions,
      recommendationDescriptions,

      // Metadata
      recordCount: formatNumber(mlOutput.meta.recordCount),
      processingTime: `${mlOutput.meta.processingTime}ms`,
      timestamp: new Date(mlOutput.meta.timestamp).toLocaleString(),

      // Raw values for calculations
      rawNetCashFlow: summary.netCashFlow,
      rawRiskScore: summary.riskScore,
      rawFraudScore: summary.fraudScore,
      rawConfidence: summary.confidence,
    };
  }

  /**
     * Substitute template variables with data
     * @param {string} template - Template string
     * @param {Object} data - Template data
     * @returns {string} - Substituted template
     */
  substituteTemplate(template, data) {
    let result = template;

    // Replace simple variables {{variable}}
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const placeholder = `{{${key}}}`;

      if (typeof value === 'boolean') {
        // Handle boolean values for conditional rendering
        const truePattern = new RegExp(`{{#if ${key}}}(.*?){{/if}}`, 'gs');
        result = result.replace(truePattern, (match, content) => (value ? content : ''));
      } else {
        // Replace simple placeholders
        result = result.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    // Handle conditional blocks
    result = this.processConditionalBlocks(result, data);

    return result;
  }

  /**
     * Process conditional blocks in template
     * @param {string} template - Template string
     * @param {Object} data - Template data
     * @returns {string} - Processed template
     */
  processConditionalBlocks(template, data) {
    // Handle {{#if condition}}...{{/if}} blocks
    const conditionalPattern = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;

    return template.replace(conditionalPattern, (match, condition, content) => {
      const value = data[condition];
      return value ? content : '';
    });
  }

  /**
     * Post-process the generated prompt
     * @param {string} prompt - Generated prompt
     * @param {Object} options - Processing options
     * @returns {string} - Post-processed prompt
     */
  postProcessPrompt(prompt, options = {}) {
    let processed = prompt;

    // Remove extra whitespace
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    processed = processed.trim();

    // Add system instructions if specified
    if (options.systemInstructions) {
      processed = `System: ${options.systemInstructions}\n\n${processed}`;
    }

    // Add context if specified
    if (options.context) {
      processed = `Context: ${options.context}\n\n${processed}`;
    }

    // Add output format instructions
    if (options.outputFormat) {
      processed += `\n\nPlease provide your response in the following format:\n${options.outputFormat}`;
    }

    return processed;
  }

  /**
     * Validate prompt length
     * @param {string} prompt - Generated prompt
     */
  validatePromptLength(prompt) {
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimation

    if (estimatedTokens > this.maxTokens) {
      console.warn(`⚠️ Prompt may exceed token limit: ~${estimatedTokens} tokens (limit: ${this.maxTokens})`);
    }
  }

  /**
     * Generate specialized prompt for specific analysis type
     * @param {Object} mlOutput - ML engine output
     * @param {string} analysisType - Type of analysis
     * @param {Object} options - Generation options
     * @returns {string} - Specialized prompt
     */
  generateSpecializedPrompt(mlOutput, analysisType, options = {}) {
    const specializedTemplates = {
      executive: 'executive_summary',
      risk: 'risk_assessment',
      fraud: 'fraud_analysis',
      operational: 'operational_insights',
      financial: 'financial_review',
      compliance: 'compliance_report',
    };

    const templateName = specializedTemplates[analysisType] || 'default';

    return this.generatePrompt(mlOutput, {
      ...options,
      template: templateName,
    });
  }

  /**
     * Generate multiple prompts for different perspectives
     * @param {Object} mlOutput - ML engine output
     * @param {Array} perspectives - Array of analysis perspectives
     * @returns {Object} - Multiple prompts
     */
  generateMultiPerspectivePrompts(mlOutput, perspectives = ['executive', 'risk', 'operational']) {
    const prompts = {};

    perspectives.forEach((perspective) => {
      try {
        prompts[perspective] = this.generateSpecializedPrompt(mlOutput, perspective);
      } catch (error) {
        console.warn(`⚠️ Failed to generate ${perspective} prompt: ${error.message}`);
        prompts[perspective] = this.generatePrompt(mlOutput); // Fallback to default
      }
    });

    return prompts;
  }

  /**
     * Create a custom template
     * @param {string} templateName - Name of the template
     * @param {string} content - Template content
     * @returns {Promise<boolean>} - Success status
     */
  async createCustomTemplate(templateName, content) {
    try {
      const templatePath = path.join(this.templatePath, `${templateName}.txt`);
      await fs.writeFile(templatePath, content, 'utf8');

      // Reload templates
      const template = await this.loadTemplate(templateName);
      this.templates.set(templateName, template);

      console.log(`✅ Custom template '${templateName}' created`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create custom template '${templateName}':`, error.message);
      return false;
    }
  }

  /**
     * Get available templates
     * @returns {Array} - List of available template names
     */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
     * Get template statistics
     * @returns {Object} - Template statistics
     */
  getTemplateStats() {
    const stats = {
      totalTemplates: this.templates.size,
      availableTemplates: this.getAvailableTemplates(),
      defaultTemplate: this.defaultTemplate ? 'loaded' : 'not loaded',
      maxTokens: this.maxTokens,
    };

    return stats;
  }
}

// Create singleton instance
const llamaPromptGenerator = new LLAMAPromptGenerator();

// Export both the class and singleton instance
module.exports = { LLAMAPromptGenerator, llamaPromptGenerator };
module.exports.generatePrompt = (mlOutput, options) => llamaPromptGenerator.generatePrompt(mlOutput, options);
module.exports.generateSpecializedPrompt = (mlOutput, analysisType, options) => llamaPromptGenerator.generateSpecializedPrompt(mlOutput, analysisType, options);
module.exports.generateMultiPerspectivePrompts = (mlOutput, perspectives) => llamaPromptGenerator.generateMultiPerspectivePrompts(mlOutput, perspectives);
module.exports.initialize = () => llamaPromptGenerator.initialize();
module.exports.getTemplateStats = () => llamaPromptGenerator.getTemplateStats();

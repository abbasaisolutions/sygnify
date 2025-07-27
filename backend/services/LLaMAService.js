const axios = require('axios');
const { mean } = require('simple-statistics');

/**
 * LLaMA 3 Integration Service for AI-Powered Narrative Generation
 * Provides context-aware, data-driven narratives using structured JSON prompts
 * Supports multiple output formats: executive summary, bullet points, human-readable reports
 */
class LLaMAService {
  constructor(config = {}) {
    this.config = {
      // LLaMA API configuration
      apiEndpoint: config.apiEndpoint || 'http://localhost:11434/api/generate', // Ollama default
      model: config.model || 'llama3.1:8b',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2048,
      topP: config.topP || 0.9,

      // Fallback configuration
      enableFallback: false, // Enforce LLaMA 3 only
      fallbackService: null,

      // Prompt templates
      prompts: this.loadPromptTemplates(),

      // Rate limiting
      rateLimit: config.rateLimit || 10, // requests per minute
      requestTimeout: config.requestTimeout || 30000, // 30 seconds

      ...config,
    };

    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
     * Load prompt templates for different narrative styles
     */
  loadPromptTemplates() {
    return {
      executive: {
        system: `You are a senior financial intelligence analyst AI. Generate professional narrative summaries for business dashboards.

Focus on clarity, insight, and business value. Avoid repeating numeric stats — interpret them instead.
Provide actionable insights and clear recommendations. Use professional, confident language.
Be specific about risks, opportunities, and business implications.`,

        user: `Using the structured data below, generate a professional executive summary for a business dashboard.

IMPORTANT: Be specific and concrete. Avoid vague statements like "opportunities for optimization" or "analyzed X insights". 
Instead, provide specific insights like "fraud scores of 0.498 indicate elevated risk requiring immediate attention" or 
"net negative cash flows of $1,001.36 suggest revenue optimization is needed".

Summarize key findings, scores, and recommendations with specific business implications.

Data:
{JSON_DATA}

Format the response as a professional executive summary with:
1. Executive Summary (2-3 paragraphs with specific insights)
2. Key Risks & Opportunities (specific bullet points with data context)
3. Strategic Recommendations (actionable items with business rationale)
4. Overall Assessment (concrete business implications)`,
      },

      bullet: {
        system: `You are a financial summarization engine specializing in bullet-point analysis.
Convert complex financial data into clear, scannable bullet points.
Focus on key metrics, trends, and actionable insights. Be specific and data-driven.`,

        user: `Create a bullet-point summary of the following financial analytics data.
Focus on the most important findings, metrics, and recommendations.
Be specific: mention actual values, percentages, and concrete implications.

Data:
{JSON_DATA}

Format as specific bullet points covering:
• Data Overview (with actual record count and quality score)
• Key Metrics (with specific values and implications)
• Risk Factors (with specific risk levels and data points)
• Recommendations (with specific actions and expected outcomes)
• Next Steps (with concrete timelines or priorities)`,
      },

      narrative: {
        system: `You are an AI financial analyst creating human-readable business intelligence reports.
Generate comprehensive, narrative-style reports that tell the data story.
Use natural language that flows well and provides context for non-technical audiences.
Be specific about data implications and business impact.`,

        user: `Create a comprehensive narrative report based on the following financial analytics data.
Write in a natural, flowing style that tells the complete data story.
Be specific: mention actual values, explain what they mean for the business, and provide concrete insights.

Data:
{JSON_DATA}

Structure the narrative with:
1. Executive Summary (with specific data points and business implications)
2. Key Findings and Insights (specific metrics with interpretation)
3. Risk Assessment (specific risks with data backing)
4. Performance Analysis (specific performance indicators with context)
5. Strategic Recommendations (specific actions with business rationale)
6. Future Outlook (specific forecasts with confidence levels)`,
      },

      technical: {
        system: `You are a technical financial analyst AI specializing in detailed analytical reports.
Generate comprehensive technical analysis with statistical context and methodology.
Include confidence intervals, statistical significance, and analytical caveats.
Be specific about statistical measures and their business implications.`,

        user: `Generate a technical analysis report based on the following financial analytics data.
Include statistical context, confidence levels, and methodological considerations.
Be specific about statistical measures, variance, and their business implications.

Data:
{JSON_DATA}

Structure the technical report with:
1. Methodology and Data Quality (specific quality metrics and methodology)
2. Statistical Analysis (specific statistical measures with interpretation)
3. Confidence Intervals (specific confidence levels and ranges)
4. Risk Assessment with Quantification (specific risk measures with data)
5. Technical Recommendations (specific technical actions with rationale)
6. Model Performance Metrics (specific performance indicators)`,
      },
    };
  }

  /**
     * Generate AI-powered narratives using LLaMA 3
     * @param {Object} analyticsData - Structured analytics results
     * @param {string} style - Narrative style: 'executive', 'bullet', 'narrative', 'technical'
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Generated narrative with metadata
     */
  async generateNarrative(analyticsData, style = 'executive', options = {}) {
    try {
      // Rate limiting check
      await this.checkRateLimit();

      // Prepare structured JSON data
      const structuredData = this.prepareStructuredData(analyticsData);

      // Get prompt template
      const promptTemplate = this.prompts[style] || this.prompts.executive;

      // Generate prompt
      const prompt = this.buildPrompt(promptTemplate, structuredData, options);

      // Call LLaMA API
      const response = await this.callLLaMA(prompt, style, options);

      // Parse and structure response
      const narrative = this.parseResponse(response, style, structuredData);

      return {
        success: true,
        narrative,
        metadata: {
          style,
          model: this.config.model,
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: response.generationTime || 0,
          confidence: this.calculateConfidence(response),
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('LLaMA narrative generation failed:', error);
      // Do not fallback, propagate error
      throw new Error('LLaMA 3 narrative generation failed: ' + error.message);
    }
  }

  /**
     * Prepare structured JSON data for LLaMA prompts with enhanced context
     */
  prepareStructuredData(analyticsData) {
    const {
      metrics = {},
      insights = [],
      forecasts = {},
      recommendations = [],
      labels = {},
      recordCount = 0,
      dataQuality = {},
    } = analyticsData;

    // Calculate key metrics
    const avgTransactionAmount = this.getMetricValue(metrics, 'amount') || 0;
    const avgAccountBalance = this.getMetricValue(metrics, 'balance') || 0;
    const avgFraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;

    // Calculate scores and grades with consistency
    const financialHealthScore = this.calculateHealthScore(metrics);
    const riskLevel = this.calculateRiskLevel(insights);
    const predictionConfidence = this.calculatePredictionConfidence(forecasts);
    const performanceGrade = this.calculatePerformanceGrade(metrics);

    // Calculate domain-specific scores
    const liquidity = this.calculateLiquidityScore(metrics);
    const profitability = this.calculateProfitabilityScore(metrics);
    const efficiency = this.calculateEfficiencyScore(metrics);

    // Prepare forecasts with enhanced context
    const forecast = {};
    if (forecasts.revenue) {
      forecast.revenue_next_month = Math.round(forecasts.revenue.nextMonth?.value || 0);
      forecast.revenue_next_quarter = Math.round((forecasts.revenue.nextMonth?.value || 0) * 3);
      forecast.revenue_confidence = forecasts.revenue.nextMonth?.confidence > 0.8 ? 'high'
        : forecasts.revenue.nextMonth?.confidence > 0.6 ? 'medium' : 'low';
      forecast.revenue_trend = forecasts.revenue.nextMonth?.trend || 'stable';
    }

    if (forecasts.cashFlow) {
      forecast.cashflow_next_month = Math.round(forecasts.cashFlow.nextMonth?.value || 0);
      forecast.cashflow_confidence = forecasts.cashFlow.nextMonth?.confidence > 0.8 ? 'high'
        : forecasts.cashFlow.nextMonth?.confidence > 0.6 ? 'medium' : 'low';
      forecast.cashflow_risk = forecasts.cashFlow.nextMonth?.riskLevel || 'medium';
    }

    // Prepare recommendations with context
    const recs = recommendations.slice(0, 5).map((rec) => ({
      action: rec.title || rec.description,
      priority: rec.priority || 'medium',
      impact: rec.impact || 'moderate',
      rationale: this.generateRecommendationRationale(rec, metrics, insights),
    }));

    // Extract key insights for narrative context
    const keyInsights = insights
      .filter((i) => i.severity === 'critical' || i.severity === 'warning')
      .slice(0, 3)
      .map((i) => i.description);

    // Calculate cash flow analysis
    const cashFlowAnalysis = this.analyzeCashFlow(avgTransactionAmount, avgAccountBalance);

    return {
      domain: 'Finance',
      records_analyzed: recordCount,
      dimensions: Object.keys(metrics).length,
      data_quality_score: dataQuality.score || 95,
      financial_health_score: financialHealthScore,
      risk_level: riskLevel.toUpperCase(),
      prediction_confidence: predictionConfidence,
      performance_grade: performanceGrade,
      avg_transaction_amount: avgTransactionAmount,
      avg_account_balance: avgAccountBalance,
      avg_fraud_score: avgFraudScore,
      liquidity: {
        score: liquidity.score,
        grade: liquidity.grade,
        insight: liquidity.summary,
      },
      profitability: {
        score: profitability.score,
        grade: profitability.grade,
        insight: profitability.summary,
      },
      efficiency: {
        score: efficiency.score,
        grade: efficiency.grade,
        insight: efficiency.summary,
      },
      forecast,
      recommendations: recs,
      key_insights: keyInsights,
      cash_flow_analysis: cashFlowAnalysis,
      risk_indicators: this.extractRiskIndicators(metrics, insights),
      business_implications: this.generateBusinessImplications(metrics, insights, forecasts),
    };
  }

  /**
     * Build prompt for LLaMA
     */
  buildPrompt(template, structuredData, options) {
    const jsonData = JSON.stringify(structuredData, null, 2);

    let userPrompt = template.user.replace('{JSON_DATA}', jsonData);

    // Add custom instructions if provided
    if (options.customInstructions) {
      userPrompt += `\n\nAdditional Instructions: ${options.customInstructions}`;
    }

    // Add tone preferences
    if (options.tone) {
      userPrompt += `\n\nTone: ${options.tone}`;
    }

    return {
      system: template.system,
      user: userPrompt,
    };
  }

  /**
     * Call LLaMA API
     */
  async callLLaMA(prompt, style, options) {
    const startTime = Date.now();

    const requestBody = {
      model: this.config.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
      top_p: options.topP || this.config.topP,
      stream: false,
    };

    const response = await axios.post(this.config.apiEndpoint, requestBody, {
      timeout: this.config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const generationTime = Date.now() - startTime;

    return {
      ...response.data,
      generationTime,
    };
  }

  /**
     * Parse LLaMA response into structured narrative
     */
  parseResponse(response, style, structuredData) {
    const content = response.choices?.[0]?.message?.content || response.response || '';

    // Parse based on style
    switch (style) {
      case 'executive':
        return this.parseExecutiveResponse(content, structuredData);
      case 'bullet':
        return this.parseBulletResponse(content, structuredData);
      case 'narrative':
        return this.parseNarrativeResponse(content, structuredData);
      case 'technical':
        return this.parseTechnicalResponse(content, structuredData);
      default:
        return this.parseGenericResponse(content, structuredData);
    }
  }

  /**
     * Parse executive summary response
     */
  parseExecutiveResponse(content, data) {
    const sections = this.extractSections(content, ['Executive Summary', 'Key Risks & Opportunities', 'Strategic Recommendations', 'Overall Assessment']);

    return {
      type: 'executive_summary',
      headline: this.generateHeadline(data),
      summary: sections['Executive Summary'] || `${content.substring(0, 200)}...`,
      keyFindings: this.extractBulletPoints(sections['Key Risks & Opportunities'] || ''),
      riskAssessment: sections['Overall Assessment'] || '',
      recommendations: this.extractBulletPoints(sections['Strategic Recommendations'] || ''),
      wordCount: content.split(/\s+/).length,
    };
  }

  /**
     * Parse bullet point response
     */
  parseBulletResponse(content, data) {
    const bullets = content.split('\n')
      .filter((line) => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map((line) => line.replace(/^[•\-]\s*/, '').trim())
      .filter((line) => line.length > 0);

    return {
      type: 'bullet_summary',
      title: `Financial Analytics Summary - ${data.summary.recordCount} Records`,
      bullets,
      categories: this.categorizeBullets(bullets),
      wordCount: content.split(/\s+/).length,
    };
  }

  /**
     * Parse narrative response
     */
  parseNarrativeResponse(content, data) {
    const sections = this.extractSections(content, [
      'Executive Summary', 'Key Findings', 'Risk Assessment',
      'Performance Analysis', 'Strategic Recommendations', 'Future Outlook',
    ]);

    return {
      type: 'narrative_report',
      title: 'Comprehensive Financial Analysis Report',
      sections,
      summary: sections['Executive Summary'] || `${content.substring(0, 300)}...`,
      wordCount: content.split(/\s+/).length,
      dataContext: {
        recordCount: data.summary.recordCount,
        dimensions: data.summary.dimensions,
        keyMetrics: Object.keys(data.keyMetrics).length,
      },
    };
  }

  /**
     * Parse technical response
     */
  parseTechnicalResponse(content, data) {
    const sections = this.extractSections(content, [
      'Methodology', 'Statistical Analysis', 'Confidence Intervals',
      'Risk Assessment', 'Technical Recommendations', 'Model Performance Metrics',
    ]);

    return {
      type: 'technical_report',
      title: 'Technical Financial Analysis Report',
      sections,
      methodology: sections.Methodology || '',
      statisticalAnalysis: sections['Statistical Analysis'] || '',
      confidenceIntervals: sections['Confidence Intervals'] || '',
      wordCount: content.split(/\s+/).length,
      technicalMetrics: {
        dataQuality: data.summary.dataQualityScore,
        confidenceLevel: data.forecast.confidence || 0.7,
        statisticalSignificance: this.calculateStatisticalSignificance(data),
      },
    };
  }

  /**
     * Parse generic response
     */
  parseGenericResponse(content, data) {
    return {
      type: 'generic_narrative',
      content,
      wordCount: content.split(/\s+/).length,
      dataContext: {
        recordCount: data.summary.recordCount,
        dimensions: data.summary.dimensions,
      },
    };
  }

  /**
     * Extract sections from content
     */
  extractSections(content, sectionNames) {
    const sections = {};
    let currentSection = 'summary';
    let currentContent = [];

    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this is a section header
      const sectionMatch = sectionNames.find((name) => trimmedLine.toLowerCase().includes(name.toLowerCase()));

      if (sectionMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }

        // Start new section
        currentSection = sectionMatch;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
     * Extract bullet points from content
     */
  extractBulletPoints(content) {
    const bullets = content.split('\n')
      .filter((line) => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map((line) => line.replace(/^[•\-]\s*/, '').trim())
      .filter((line) => line.length > 0);
    return bullets;
  }

  /**
     * Categorize bullet points
     */
  categorizeBullets(bullets) {
    const categories = {
      metrics: [],
      risks: [],
      recommendations: [],
      insights: [],
    };

    for (const bullet of bullets) {
      const lower = bullet.toLowerCase();
      if (lower.includes('risk') || lower.includes('warning') || lower.includes('critical')) {
        categories.risks.push(bullet);
      } else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('implement')) {
        categories.recommendations.push(bullet);
      } else if (lower.includes('average') || lower.includes('total') || lower.includes('score')) {
        categories.metrics.push(bullet);
      } else {
        categories.insights.push(bullet);
      }
    }

    return categories;
  }

  /**
     * Generate headline from data
     */
  generateHeadline(data) {
    const { recordCount } = data.summary;
    const { riskLevel } = data.summary;

    if (riskLevel === 'high') {
      return `Financial Analysis Alert: ${recordCount} Records Show Elevated Risk`;
    } if (riskLevel === 'medium') {
      return `Financial Analysis Report: ${recordCount} Records with Moderate Risk`;
    }
    return `Financial Analysis Summary: ${recordCount} Records Show Stable Performance`;
  }

  /**
     * Calculate health score with risk level consistency
     */
  calculateHealthScore(metrics) {
    let totalScore = 0;
    let weightSum = 0;

    for (const [column, metric] of Object.entries(metrics)) {
      const weight = this.getMetricWeight(column);

      if (metric.average !== undefined) {
        const score = this.calculateMetricHealthScore(column, metric);
        totalScore += score * weight;
        weightSum += weight;
      }
    }

    const healthScore = weightSum > 0 ? Math.round(totalScore / weightSum) : 85;

    // Ensure health score aligns with risk level
    return this.adjustHealthScoreForConsistency(healthScore, metrics);
  }

  /**
     * Adjust health score to maintain consistency with risk level
     */
  adjustHealthScoreForConsistency(healthScore, metrics) {
    // Check for high-risk indicators
    const fraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;
    const hasHighRisk = fraudScore > 0.7 || healthScore < 60;

    if (hasHighRisk && healthScore > 75) {
      // If high risk indicators exist but health score is too high, reduce it
      return Math.max(60, healthScore - 15);
    } if (!hasHighRisk && healthScore < 70) {
      // If no high risk indicators but health score is low, increase it
      return Math.min(85, healthScore + 10);
    }

    return healthScore;
  }

  /**
     * Calculate risk level with health score consideration
     */
  calculateRiskLevel(insights) {
    const criticalCount = insights.filter((i) => i.severity === 'critical').length;
    const warningCount = insights.filter((i) => i.severity === 'warning').length;

    // Base risk calculation
    let riskLevel = 'low';
    if (criticalCount > 0) riskLevel = 'high';
    else if (warningCount > 2) riskLevel = 'medium';

    // Adjust based on health score consistency
    return this.adjustRiskLevelForConsistency(riskLevel, insights);
  }

  /**
     * Adjust risk level to maintain consistency with health score
     */
  adjustRiskLevelForConsistency(riskLevel, insights) {
    // If we have high risk but good health indicators, consider medium risk
    if (riskLevel === 'high') {
      const hasGoodHealthIndicators = insights.some((i) => i.description.toLowerCase().includes('strong')
                || i.description.toLowerCase().includes('good')
                || i.description.toLowerCase().includes('excellent'));

      if (hasGoodHealthIndicators) {
        return 'medium';
      }
    }

    return riskLevel;
  }

  /**
     * Calculate liquidity score
     */
  calculateLiquidityScore(metrics) {
    const balance = metrics.account_balance?.average || 0;
    const amount = metrics.transaction_amount?.average || 0;

    if (balance > 0 && Math.abs(amount) < balance * 0.1) {
      return { score: 90, grade: 'A', summary: 'Strong cash flow patterns' };
    } if (balance > 0 && Math.abs(amount) < balance * 0.2) {
      return { score: 80, grade: 'B', summary: 'Adequate liquidity' };
    }
    return { score: 60, grade: 'C', summary: 'Liquidity concerns' };
  }

  /**
     * Calculate profitability score
     */
  calculateProfitabilityScore(metrics) {
    const amount = metrics.transaction_amount?.average || 0;

    if (amount > 0) {
      return { score: 85, grade: 'A', summary: 'Positive revenue streams' };
    } if (amount > -1000) {
      return { score: 75, grade: 'B', summary: 'Moderate performance' };
    }
    return { score: 60, grade: 'C', summary: 'Performance concerns' };
  }

  /**
     * Calculate efficiency score
     */
  calculateEfficiencyScore(metrics) {
    let totalVolatility = 0;
    let count = 0;

    for (const metric of Object.values(metrics)) {
      totalVolatility += metric.volatility || 0;
      count++;
    }

    const avgVolatility = count > 0 ? totalVolatility / count : 0.5;

    if (avgVolatility < 0.3) {
      return { score: 90, grade: 'A', summary: 'Excellent operational efficiency' };
    } if (avgVolatility < 0.5) {
      return { score: 80, grade: 'B', summary: 'Good operational efficiency' };
    }
    return { score: 70, grade: 'C', summary: 'Efficiency improvements needed' };
  }

  /**
     * Calculate statistical significance
     */
  calculateStatisticalSignificance(data) {
    const { recordCount } = data.summary;
    if (recordCount > 1000) return 'high';
    if (recordCount > 100) return 'medium';
    return 'low';
  }

  /**
     * Calculate confidence score
     */
  calculateConfidence(response) {
    // Simple confidence calculation based on response quality
    const content = response.choices?.[0]?.message?.content || '';
    const wordCount = content.split(/\s+/).length;

    if (wordCount > 100 && content.includes('recommend') && content.includes('risk')) {
      return 0.9;
    } if (wordCount > 50) {
      return 0.7;
    }
    return 0.5;
  }

  /**
     * Check rate limiting
     */
  async checkRateLimit() {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute

    if (now - this.lastRequestTime < timeWindow) {
      this.requestCount++;
      if (this.requestCount > this.config.rateLimit) {
        throw new Error('Rate limit exceeded');
      }
    } else {
      this.requestCount = 1;
      this.lastRequestTime = now;
    }
  }

  /**
     * Fallback generation
     */
  async fallbackGeneration(analyticsData, style, options) {
    if (!this.config.fallbackService) {
      throw new Error('No fallback service configured');
    }

    return await this.config.fallbackService.generateNarratives(
      analyticsData.metrics,
      analyticsData.insights,
      analyticsData.forecasts,
      analyticsData.recommendations,
      analyticsData.labels,
      style,
    );
  }

  /**
     * Generate error narrative
     */
  generateErrorNarrative(style) {
    return {
      type: 'error_narrative',
      content: 'Unable to generate AI-powered narrative. Please check your LLaMA configuration or try again later.',
      style,
      error: true,
    };
  }

  /**
     * Test LLaMA connection
     */
  async testConnection() {
    try {
      const response = await axios.get(this.config.apiEndpoint.replace('/api/generate', '/api/tags'), {
        timeout: 5000,
      });
      return {
        success: true,
        models: response.data.models || [],
        message: 'LLaMA API connection successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'LLaMA API connection failed',
      };
    }
  }

  /**
     * Get available models
     */
  async getAvailableModels() {
    try {
      const response = await axios.get(this.config.apiEndpoint.replace('/api/generate', '/api/tags'), {
        timeout: 5000,
      });
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  /**
     * Helper to get metric value by column name
     */
  getMetricValue(metrics, columnName) {
    const metric = metrics[columnName];
    if (metric && metric.average !== undefined) {
      return metric.average;
    }
    return 0;
  }

  /**
     * Calculate prediction confidence grade
     */
  calculatePredictionConfidence(forecasts) {
    let totalConfidence = 0;
    let count = 0;

    for (const [metric, forecast] of Object.entries(forecasts)) {
      if (forecast.nextMonth?.confidence) {
        totalConfidence += forecast.nextMonth.confidence;
        count++;
      }
    }

    if (count === 0) return 'C';

    const avgConfidence = totalConfidence / count;
    if (avgConfidence > 0.8) return 'A';
    if (avgConfidence > 0.6) return 'B';
    return 'C';
  }

  /**
     * Calculate performance grade with consistency
     */
  calculatePerformanceGrade(metrics) {
    let totalScore = 0;
    let count = 0;

    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.average !== undefined) {
        const score = this.calculateMetricPerformanceScore(column, metric);
        totalScore += score;
        count++;
      }
    }

    if (count === 0) return 'C';

    const avgScore = totalScore / count;

    // Adjust grade based on risk factors
    const fraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;
    const hasHighRisk = fraudScore > 0.7;

    if (hasHighRisk) {
      // Downgrade performance if high fraud risk
      if (avgScore > 85) return 'B';
      if (avgScore > 70) return 'C';
      return 'D';
    }

    // Normal grading
    if (avgScore > 85) return 'A';
    if (avgScore > 70) return 'B';
    if (avgScore > 55) return 'C';
    return 'D';
  }

  /**
     * Calculate metric performance score
     */
  calculateMetricPerformanceScore(column, metric) {
    let score = 80; // Base score

    // Adjust based on volatility
    if (metric.coefficientOfVariation > 0.5) score -= 20;
    else if (metric.coefficientOfVariation > 0.3) score -= 10;

    // Adjust based on value ranges
    if (column.includes('fraud') && metric.average > 0.7) score -= 30;
    else if (column.includes('fraud') && metric.average > 0.4) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
     * Calculate metric health score
     */
  calculateMetricHealthScore(column, metric) {
    let score = 80; // Base score

    // Adjust based on volatility
    if (metric.coefficientOfVariation > 0.5) score -= 20;
    else if (metric.coefficientOfVariation > 0.3) score -= 10;

    // Adjust based on value ranges
    if (column.includes('fraud') && metric.average > 0.7) score -= 30;
    else if (column.includes('fraud') && metric.average > 0.4) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
     * Get metric weight
     */
  getMetricWeight(columnName) {
    // Define weights for different metrics
    switch (columnName) {
      case 'transaction_amount':
      case 'revenue':
      case 'cashflow':
        return 1.2; // Higher weight for revenue/cashflow
      case 'account_balance':
      case 'liquidity':
        return 1.0; // Medium weight for balance/liquidity
      case 'fraud_score':
      case 'risk_level':
        return 0.8; // Lower weight for risk indicators
      default:
        return 1.0; // Default weight
    }
  }

  /**
     * Analyze cash flow patterns
     */
  analyzeCashFlow(avgTransactionAmount, avgAccountBalance) {
    const isNegativeFlow = avgTransactionAmount < 0;
    const flowRatio = Math.abs(avgTransactionAmount) / avgAccountBalance;

    return {
      pattern: isNegativeFlow ? 'net_outflow' : 'net_inflow',
      severity: flowRatio > 0.1 ? 'high' : flowRatio > 0.05 ? 'medium' : 'low',
      ratio: flowRatio,
      implication: isNegativeFlow
        ? `Net negative cash flows of $${Math.abs(avgTransactionAmount).toFixed(2)} suggest revenue optimization is needed`
        : `Positive cash flows of $${avgTransactionAmount.toFixed(2)} indicate healthy revenue generation`,
    };
  }

  /**
     * Extract specific risk indicators
     */
  extractRiskIndicators(metrics, insights) {
    const indicators = [];

    const fraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;
    if (fraudScore > 0.7) {
      indicators.push(`High fraud risk (${(fraudScore * 100).toFixed(1)}% average score)`);
    } else if (fraudScore > 0.5) {
      indicators.push(`Elevated fraud risk (${(fraudScore * 100).toFixed(1)}% average score)`);
    }

    const amount = this.getMetricValue(metrics, 'amount') || 0;
    if (amount < 0) {
      indicators.push(`Net negative cash flows ($${Math.abs(amount).toFixed(2)} average)`);
    }

    // Add volatility indicators
    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.coefficientOfVariation > 0.5) {
        indicators.push(`High volatility in ${column} (${(metric.coefficientOfVariation * 100).toFixed(1)}% variation)`);
      }
    }

    return indicators;
  }

  /**
     * Generate business implications
     */
  generateBusinessImplications(metrics, insights, forecasts) {
    const implications = [];

    const fraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;
    if (fraudScore > 0.5) {
      implications.push(`Fraud prevention should be prioritized due to ${(fraudScore * 100).toFixed(1)}% average risk score`);
    }

    const amount = this.getMetricValue(metrics, 'amount') || 0;
    if (amount < 0) {
      implications.push('Revenue optimization needed due to net negative cash flows');
    }

    if (forecasts.revenue && forecasts.revenue.nextMonth?.trend === 'increasing') {
      implications.push('Positive revenue trend expected, supporting growth initiatives');
    }

    return implications;
  }

  /**
     * Generate recommendation rationale
     */
  generateRecommendationRationale(rec, metrics, insights) {
    const fraudScore = this.getMetricValue(metrics, 'fraud_score') || 0;
    const amount = this.getMetricValue(metrics, 'amount') || 0;

    if (rec.title?.toLowerCase().includes('fraud')) {
      return `Fraud scores of ${(fraudScore * 100).toFixed(1)}% indicate elevated risk requiring immediate attention`;
    }

    if (rec.title?.toLowerCase().includes('transaction') || rec.title?.toLowerCase().includes('process')) {
      return amount < 0
        ? `Net negative cash flows of $${Math.abs(amount).toFixed(2)} suggest process optimization is needed`
        : 'Transaction processing efficiency can be improved for better cash flow management';
    }

    return rec.description || 'General operational improvement';
  }
}

module.exports = LLaMAService;

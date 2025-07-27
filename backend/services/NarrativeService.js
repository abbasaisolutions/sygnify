const { mean } = require('simple-statistics');
const LLaMAService = require('./LLaMAService');

/**
 * Enhanced Narrative Generation Service
 * Composes structured narratives using insights with human-readable summaries
 * Supports multiple tones: executive summary vs analyst breakdown
 * Now integrates with LLaMA 3 for AI-powered generation
 */
class NarrativeService {
  constructor(domain = 'finance', config = {}) {
    this.domain = domain;
    this.domainConfig = this.loadDomainConfig();
    this.templates = this.loadTemplates();

    // Initialize LLaMA service
    this.llamaService = new LLaMAService({
      apiEndpoint: config.llamaEndpoint || 'http://localhost:11434/api/generate',
      model: config.llamaModel || 'llama3.1:8b',
      enableFallback: true,
      fallbackService: this, // Use this service as fallback
      ...config.llama,
    });

    this.useAI = config.useAI !== false; // Default to using AI
  }

  loadDomainConfig() {
    const configs = {
      finance: {
        tones: {
          executive: {
            maxLength: 200,
            style: 'high_level',
            focus: ['summary', 'key_insights', 'recommendations'],
          },
          analyst: {
            maxLength: 500,
            style: 'detailed',
            focus: ['summary', 'insights', 'metrics', 'trends', 'recommendations'],
          },
          technical: {
            maxLength: 800,
            style: 'comprehensive',
            focus: ['summary', 'insights', 'metrics', 'trends', 'anomalies', 'recommendations', 'methodology'],
          },
        },
        keyMetrics: ['amount', 'balance', 'fraud_score', 'transaction_count'],
        narrativeStructure: ['headline', 'summary', 'key_findings', 'insights', 'trends', 'recommendations'],
      },
      healthcare: {
        tones: {
          executive: { maxLength: 200, style: 'high_level' },
          analyst: { maxLength: 500, style: 'detailed' },
        },
        keyMetrics: ['treatment_cost', 'patient_satisfaction', 'recovery_time'],
      },
      retail: {
        tones: {
          executive: { maxLength: 200, style: 'high_level' },
          analyst: { maxLength: 500, style: 'detailed' },
        },
        keyMetrics: ['sales_amount', 'inventory_turnover', 'customer_satisfaction'],
      },
    };
    return configs[domain] || configs.finance;
  }

  loadTemplates() {
    return {
      executive: {
        headline: [
          'Financial Analysis Summary: {domain} Insights',
          'Key Financial Metrics Analysis: {domain}',
          'Strategic Financial Overview: {domain} Performance',
        ],
        summary: [
          'Analysis of {recordCount} records reveals {keyInsight} with {riskLevel} risk level.',
          'Based on {recordCount} data points, {keyFinding} with {confidenceLevel} confidence.',
          'Comprehensive review of {recordCount} transactions shows {keyTrend} patterns.',
        ],
        keyFindings: [
          'Average {metric} is ${value} with {volatility} volatility.',
          '{metric} shows {trend} trend with {confidence} confidence.',
          'Key performance indicator: {metric} at {value} ({status}).',
        ],
      },
      analyst: {
        headline: [
          'Detailed Financial Analysis Report: {domain}',
          'Comprehensive Financial Metrics Analysis: {domain}',
          'In-Depth Financial Performance Review: {domain}',
        ],
        summary: [
          'Detailed analysis of {recordCount} records across {metricCount} dimensions reveals {keyInsight}.',
          'Comprehensive review of {recordCount} data points shows {keyFinding} with supporting evidence.',
          'Multi-dimensional analysis of {recordCount} transactions indicates {keyTrend} with {confidenceLevel} confidence.',
        ],
        insights: [
          'Metric Analysis: {metric} averages ${value} with {stdDev} standard deviation.',
          'Trend Analysis: {metric} shows {trend} pattern over time.',
          'Risk Assessment: {riskFactor} identified with {severity} severity.',
        ],
      },
      technical: {
        headline: [
          'Technical Financial Analysis Report: {domain}',
          'Comprehensive Financial Data Analysis: {domain}',
          'Advanced Financial Metrics Analysis: {domain}',
        ],
        summary: [
          'Advanced analysis of {recordCount} records using {methodCount} analytical methods reveals {keyInsight}.',
          'Comprehensive statistical analysis of {recordCount} data points shows {keyFinding} with {confidenceLevel} confidence.',
          'Multi-methodological analysis of {recordCount} transactions indicates {keyTrend} with detailed statistical backing.',
        ],
        methodology: [
          'Analysis Methodology: {methods} with {confidenceLevel} confidence intervals.',
          'Statistical Approach: {statisticalMethods} applied to {dataQuality} quality data.',
          'Model Performance: {modelMetrics} with {validationResults}.',
        ],
      },
    };
  }

  /**
     * Generate comprehensive narratives for different audiences
     * @param {Object} metrics - Computed metrics from InsightService
     * @param {Array} insights - Generated insights from InsightService
     * @param {Object} forecasts - Forecasts from PredictionService
     * @param {Array} recommendations - Recommendations from RecommendationService
     * @param {Object} labels - Smart labels from LabelService
     * @param {string} tone - Narrative tone: 'executive', 'analyst', 'technical'
     * @param {Object} options - Additional options including AI preferences
     * @returns {Object} - Structured narratives with multiple formats
     */
  async generateNarratives(metrics, insights, forecasts, recommendations, labels, tone = 'executive', options = {}) {
    if (!metrics || Object.keys(metrics).length === 0) {
      return this.generateFallbackNarrative(tone);
    }

    // Try AI-powered generation first if enabled
    if (this.useAI && options.useAI !== false) {
      try {
        const aiResult = await this.generateAINarrative(metrics, insights, forecasts, recommendations, labels, tone, options);
        if (aiResult.success) {
          return aiResult;
        }
      } catch (error) {
        console.warn('AI narrative generation failed, falling back to templates:', error.message);
      }
    }

    // Fallback to template-based generation
    return this.generateTemplateNarratives(metrics, insights, forecasts, recommendations, labels, tone, options);
  }

  /**
     * Generate AI-powered narratives using LLaMA 3
     */
  async generateAINarrative(metrics, insights, forecasts, recommendations, labels, tone, options) {
    // Map tone to LLaMA style
    const styleMap = {
      executive: 'executive',
      analyst: 'narrative',
      technical: 'technical',
    };

    const style = styleMap[tone] || 'executive';

    // Prepare analytics data for LLaMA
    const analyticsData = {
      metrics,
      insights,
      forecasts,
      recommendations,
      labels,
      recordCount: this.getRecordCount(metrics),
      dataQuality: {
        score: this.calculateDataQualityScore(metrics, insights),
      },
    };

    // Generate AI narrative
    const aiResult = await this.llamaService.generateNarrative(analyticsData, style, options);

    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI generation failed');
    }

    // Transform AI result to match our narrative structure
    return this.transformAIResult(aiResult.narrative, analyticsData, tone);
  }

  /**
     * Transform AI result to standard narrative format
     */
  transformAIResult(aiNarrative, analyticsData, tone) {
    const {
      metrics, insights, forecasts, recommendations,
    } = analyticsData;

    // Extract main narrative components
    const mainNarrative = {
      headline: aiNarrative.headline || aiNarrative.title || 'AI-Generated Financial Analysis',
      summary: aiNarrative.summary || aiNarrative.content || '',
      keyFindings: aiNarrative.keyFindings || [],
      insights: aiNarrative.insights || [],
      trends: aiNarrative.trends || [],
      recommendations: aiNarrative.recommendations || [],
      tone,
      wordCount: aiNarrative.wordCount || 0,
    };

    // Handle different AI response formats
    if (aiNarrative.type === 'bullet_summary') {
      mainNarrative.keyFindings = aiNarrative.bullets || [];
    } else if (aiNarrative.type === 'narrative_report') {
      mainNarrative.summary = aiNarrative.summary || '';
      mainNarrative.keyFindings = aiNarrative.sections?.['Key Findings'] || [];
      mainNarrative.recommendations = aiNarrative.sections?.['Strategic Recommendations'] || [];
    }

    // Generate supporting narratives using template approach
    const supportingNarratives = this.generateSupportingNarratives(metrics, insights, forecasts, recommendations, labels, tone);

    // Generate data story
    const dataStory = this.generateDataStory(metrics, insights, forecasts, labels, tone);

    return {
      main: mainNarrative,
      supporting: supportingNarratives,
      dataStory,
      summary: this.generateNarrativeSummary(mainNarrative, supportingNarratives, tone),
      metadata: {
        tone,
        recordCount: this.getRecordCount(metrics),
        metricCount: Object.keys(metrics).length,
        insightCount: insights.length,
        recommendationCount: recommendations.length,
        generatedAt: new Date().toISOString(),
        aiGenerated: true,
        model: this.llamaService.config.model,
      },
    };
  }

  /**
     * Generate template-based narratives (fallback method)
     */
  async generateTemplateNarratives(metrics, insights, forecasts, recommendations, labels, tone, options) {
    const toneConfig = this.domainConfig.tones[tone] || this.domainConfig.tones.executive;
    const templates = this.templates[tone] || this.templates.executive;

    // Generate main narrative
    const mainNarrative = this.generateMainNarrative(metrics, insights, forecasts, recommendations, labels, toneConfig, templates);

    // Generate supporting narratives
    const supportingNarratives = this.generateSupportingNarratives(metrics, insights, forecasts, recommendations, labels, tone);

    // Generate data story
    const dataStory = this.generateDataStory(metrics, insights, forecasts, labels, tone);

    return {
      main: mainNarrative,
      supporting: supportingNarratives,
      dataStory,
      summary: this.generateNarrativeSummary(mainNarrative, supportingNarratives, tone),
      metadata: {
        tone,
        recordCount: this.getRecordCount(metrics),
        metricCount: Object.keys(metrics).length,
        insightCount: insights.length,
        recommendationCount: recommendations.length,
        generatedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    };
  }

  /**
     * Calculate data quality score
     */
  calculateDataQualityScore(metrics, insights) {
    let score = 85; // Base score

    // Adjust based on data completeness
    const metricCount = Object.keys(metrics).length;
    if (metricCount < 5) score -= 20;
    else if (metricCount < 10) score -= 10;

    // Adjust based on insights quality
    const criticalInsights = insights.filter((i) => i.severity === 'critical');
    if (criticalInsights.length > 0) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
     * Generate main narrative
     */
  generateMainNarrative(metrics, insights, forecasts, recommendations, labels, toneConfig, templates) {
    const context = this.buildNarrativeContext(metrics, insights, forecasts, recommendations, labels);

    // Generate headline
    const headline = this.generateHeadline(templates.headline, context);

    // Generate summary
    const summary = this.generateSummary(templates.summary, context, toneConfig);

    // Generate key findings
    const keyFindings = this.generateKeyFindings(templates.keyFindings, context, toneConfig);

    // Generate insights section
    const insightsSection = this.generateInsightsSection(insights, toneConfig);

    // Generate trends section
    const trendsSection = this.generateTrendsSection(forecasts, toneConfig);

    // Generate recommendations section
    const recommendationsSection = this.generateRecommendationsSection(recommendations, toneConfig);

    return {
      headline,
      summary,
      keyFindings,
      insights: insightsSection,
      trends: trendsSection,
      recommendations: recommendationsSection,
      tone: toneConfig.style,
      wordCount: this.calculateWordCount([headline, summary, ...keyFindings, ...insightsSection, ...trendsSection, ...recommendationsSection]),
    };
  }

  /**
     * Generate supporting narratives
     */
  generateSupportingNarratives(metrics, insights, forecasts, recommendations, labels, tone) {
    const narratives = {};

    // Financial health narrative
    if (this.domain === 'finance') {
      narratives.financialHealth = this.generateFinancialHealthNarrative(metrics, insights, forecasts, tone);
    }

    // Risk assessment narrative
    narratives.riskAssessment = this.generateRiskAssessmentNarrative(metrics, insights, forecasts, tone);

    // Performance narrative
    narratives.performance = this.generatePerformanceNarrative(metrics, insights, forecasts, tone);

    // Operational narrative
    narratives.operational = this.generateOperationalNarrative(metrics, insights, recommendations, tone);

    return narratives;
  }

  /**
     * Generate data story
     */
  generateDataStory(metrics, insights, forecasts, labels, tone) {
    const story = {
      title: `Data Story: ${this.domain.charAt(0).toUpperCase() + this.domain.slice(1)} Analytics Journey`,
      chapters: [],
    };

    // Chapter 1: Data Overview
    story.chapters.push({
      title: 'Data Overview',
      content: this.generateDataOverviewChapter(metrics, labels, tone),
    });

    // Chapter 2: Key Discoveries
    story.chapters.push({
      title: 'Key Discoveries',
      content: this.generateKeyDiscoveriesChapter(insights, tone),
    });

    // Chapter 3: Future Outlook
    story.chapters.push({
      title: 'Future Outlook',
      content: this.generateFutureOutlookChapter(forecasts, tone),
    });

    // Chapter 4: Action Items
    story.chapters.push({
      title: 'Action Items',
      content: this.generateActionItemsChapter(insights, forecasts, tone),
    });

    return story;
  }

  /**
     * Build narrative context
     */
  buildNarrativeContext(metrics, insights, forecasts, recommendations, labels) {
    const context = {
      domain: this.domain,
      recordCount: this.getRecordCount(metrics),
      metricCount: Object.keys(metrics).length,
      insightCount: insights.length,
      recommendationCount: recommendations.length,
      keyMetrics: {},
      keyInsight: '',
      keyFinding: '',
      keyTrend: '',
      riskLevel: 'low',
      confidenceLevel: 'medium',
      methods: [],
      dataQuality: 'good',
    };

    // Extract key metrics
    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.average !== undefined) {
        context.keyMetrics[column] = {
          average: metric.average,
          volatility: metric.coefficientOfVariation || 0,
          trend: this.determineTrend(metric),
        };
      }
    }

    // Determine key insight
    const criticalInsights = insights.filter((i) => i.severity === 'critical');
    if (criticalInsights.length > 0) {
      context.keyInsight = criticalInsights[0].description;
    } else {
      const highPriorityInsights = insights.filter((i) => i.severity === 'warning');
      context.keyInsight = highPriorityInsights.length > 0
        ? highPriorityInsights[0].description
        : 'stable performance patterns';
    }

    // Determine key finding
    const amountMetrics = Object.entries(metrics).find(([col, metric]) => col.toLowerCase().includes('amount') && metric.average);
    if (amountMetrics) {
      const [col, metric] = amountMetrics;
      context.keyFinding = `average ${col} of $${Math.abs(metric.average).toFixed(2)}`;
    }

    // Determine key trend
    if (forecasts.revenue) {
      const trend = forecasts.revenue.nextMonth.value > 0 ? 'positive' : 'negative';
      context.keyTrend = `${trend} revenue trend`;
    }

    // Determine risk level
    const riskFactors = insights.filter((i) => i.severity === 'critical' || i.severity === 'warning');
    if (riskFactors.length > 3) context.riskLevel = 'high';
    else if (riskFactors.length > 1) context.riskLevel = 'medium';

    // Determine confidence level
    if (forecasts.revenue && forecasts.revenue.nextMonth.confidence) {
      const { confidence } = forecasts.revenue.nextMonth;
      if (confidence > 0.8) context.confidenceLevel = 'high';
      else if (confidence > 0.6) context.confidenceLevel = 'medium';
      else context.confidenceLevel = 'low';
    }

    // Determine methods used
    if (forecasts.revenue && forecasts.revenue.method) {
      context.methods.push(forecasts.revenue.method);
    }

    return context;
  }

  /**
     * Generate headline
     */
  generateHeadline(templates, context) {
    const template = this.selectTemplate(templates);
    return this.fillTemplate(template, context);
  }

  /**
     * Generate summary
     */
  generateSummary(templates, context, toneConfig) {
    const template = this.selectTemplate(templates);
    let summary = this.fillTemplate(template, context);

    // Adjust length based on tone
    if (summary.length > toneConfig.maxLength) {
      summary = `${summary.substring(0, toneConfig.maxLength - 3)}...`;
    }

    return summary;
  }

  /**
     * Generate key findings
     */
  generateKeyFindings(templates, context, toneConfig) {
    const findings = [];
    const maxFindings = toneConfig.style === 'high_level' ? 3
      : toneConfig.style === 'detailed' ? 5 : 7;

    // Add key metric findings
    for (const [column, metric] of Object.entries(context.keyMetrics)) {
      if (findings.length >= maxFindings) break;

      const template = this.selectTemplate(templates);
      const finding = this.fillTemplate(template, {
        ...context,
        metric: column,
        value: metric.average.toFixed(2),
        volatility: metric.volatility > 0.5 ? 'high' : 'low',
        trend: metric.trend,
        status: this.getMetricStatus(metric),
      });

      findings.push(finding);
    }

    return findings;
  }

  /**
     * Generate insights section
     */
  generateInsightsSection(insights, toneConfig) {
    const maxInsights = toneConfig.style === 'high_level' ? 2
      : toneConfig.style === 'detailed' ? 4 : 6;

    return insights
      .slice(0, maxInsights)
      .map((insight) => insight.description);
  }

  /**
     * Generate trends section
     */
  generateTrendsSection(forecasts, toneConfig) {
    const trends = [];

    if (forecasts.revenue) {
      const trend = forecasts.revenue.nextMonth.value > 0 ? 'positive' : 'negative';
      trends.push(`Revenue shows ${trend} trend with ${forecasts.revenue.nextMonth.confidence.toFixed(2)} confidence`);
    }

    if (forecasts.cashFlow) {
      trends.push(`Cash flow risk level: ${forecasts.cashFlow.nextMonth.riskLevel}`);
    }

    if (forecasts.fraud) {
      trends.push(`Fraud trend: ${forecasts.fraud.trend.direction} with ${forecasts.fraud.trend.strength.toFixed(2)} strength`);
    }

    return trends.slice(0, toneConfig.style === 'high_level' ? 2 : 4);
  }

  /**
     * Generate recommendations section
     */
  generateRecommendationsSection(recommendations, toneConfig) {
    const maxRecs = toneConfig.style === 'high_level' ? 2
      : toneConfig.style === 'detailed' ? 4 : 6;

    return recommendations
      .slice(0, maxRecs)
      .map((rec) => `${rec.title}: ${rec.description}`);
  }

  /**
     * Generate financial health narrative
     */
  generateFinancialHealthNarrative(metrics, insights, forecasts, tone) {
    const narrative = {
      title: 'Financial Health Assessment',
      score: 85,
      grade: 'B+',
      summary: 'Overall financial health is good with some areas for improvement',
      metrics: {},
    };

    // Calculate health score based on metrics
    let totalScore = 0;
    let metricCount = 0;

    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.average !== undefined) {
        const score = this.calculateHealthScore(column, metric);
        narrative.metrics[column] = {
          score,
          grade: this.getGrade(score),
          status: score > 80 ? 'excellent' : score > 60 ? 'good' : 'needs_attention',
        };
        totalScore += score;
        metricCount++;
      }
    }

    if (metricCount > 0) {
      narrative.score = Math.round(totalScore / metricCount);
      narrative.grade = this.getGrade(narrative.score);
    }

    return narrative;
  }

  /**
     * Generate risk assessment narrative
     */
  generateRiskAssessmentNarrative(metrics, insights, forecasts, tone) {
    const narrative = {
      title: 'Risk Assessment',
      overallRisk: 'low',
      riskFactors: [],
      summary: 'Overall risk level is acceptable with minor concerns',
    };

    // Identify risk factors
    const riskInsights = insights.filter((i) => i.severity === 'critical' || i.severity === 'warning');
    narrative.riskFactors = riskInsights.map((i) => i.description);

    // Determine overall risk
    if (riskInsights.filter((i) => i.severity === 'critical').length > 0) {
      narrative.overallRisk = 'high';
      narrative.summary = 'Critical risks identified requiring immediate attention';
    } else if (riskInsights.length > 2) {
      narrative.overallRisk = 'medium';
      narrative.summary = 'Multiple risk factors identified requiring monitoring';
    }

    return narrative;
  }

  /**
     * Generate performance narrative
     */
  generatePerformanceNarrative(metrics, insights, forecasts, tone) {
    const narrative = {
      title: 'Performance Analysis',
      summary: 'Performance metrics show stable patterns',
      keyMetrics: {},
      trends: [],
    };

    // Analyze key performance metrics
    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.average !== undefined) {
        narrative.keyMetrics[column] = {
          current: metric.average,
          trend: this.determineTrend(metric),
          performance: this.assessPerformance(metric),
        };
      }
    }

    // Add trend information
    if (forecasts.revenue) {
      narrative.trends.push(`Revenue trend: ${forecasts.revenue.nextMonth.value > 0 ? 'positive' : 'negative'}`);
    }

    return narrative;
  }

  /**
     * Generate operational narrative
     */
  generateOperationalNarrative(metrics, insights, recommendations, tone) {
    const narrative = {
      title: 'Operational Insights',
      summary: 'Operational efficiency is within acceptable parameters',
      efficiency: 'good',
      recommendations: [],
    };

    // Extract operational recommendations
    const operationalRecs = recommendations.filter((r) => r.title.toLowerCase().includes('operational')
            || r.title.toLowerCase().includes('efficiency')
            || r.title.toLowerCase().includes('processing'));

    narrative.recommendations = operationalRecs.map((r) => r.title);

    return narrative;
  }

  /**
     * Generate data overview chapter
     */
  generateDataOverviewChapter(metrics, labels, tone) {
    const recordCount = this.getRecordCount(metrics);
    const metricCount = Object.keys(metrics).length;

    return `This analysis examines ${recordCount} records across ${metricCount} key metrics. `
               + `The dataset provides comprehensive coverage of ${this.domain} operations with `
               + 'detailed insights into transaction patterns, performance indicators, and risk factors.';
  }

  /**
     * Generate key discoveries chapter
     */
  generateKeyDiscoveriesChapter(insights, tone) {
    const keyInsights = insights.slice(0, 3);

    return keyInsights.map((insight) => `• ${insight.description}`).join(' ');
  }

  /**
     * Generate future outlook chapter
     */
  generateFutureOutlookChapter(forecasts, tone) {
    const outlook = [];

    if (forecasts.revenue) {
      outlook.push(`Revenue forecast: $${forecasts.revenue.nextMonth.value.toFixed(2)} with ${forecasts.revenue.nextMonth.confidence.toFixed(2)} confidence`);
    }

    if (forecasts.cashFlow) {
      outlook.push(`Cash flow risk: ${forecasts.cashFlow.nextMonth.riskLevel}`);
    }

    return `${outlook.join('. ')}.`;
  }

  /**
     * Generate action items chapter
     */
  generateActionItemsChapter(insights, forecasts, tone) {
    const actions = [];

    const criticalInsights = insights.filter((i) => i.severity === 'critical');
    if (criticalInsights.length > 0) {
      actions.push('Address critical issues immediately');
    }

    if (forecasts.fraud && forecasts.fraud.trend.direction === 'increasing') {
      actions.push('Implement enhanced fraud detection measures');
    }

    return `${actions.join('. ')}.`;
  }

  /**
     * Generate narrative summary
     */
  generateNarrativeSummary(mainNarrative, supportingNarratives, tone) {
    return {
      wordCount: mainNarrative.wordCount,
      sections: Object.keys(supportingNarratives).length + 1,
      tone,
      keyPoints: mainNarrative.keyFindings.slice(0, 3),
    };
  }

  /**
     * Generate fallback narrative
     */
  generateFallbackNarrative(tone) {
    return {
      main: {
        headline: 'Data Analysis Unavailable',
        summary: 'No data was provided for analysis. Please upload a valid dataset.',
        keyFindings: ['No data available for analysis'],
        insights: [],
        trends: [],
        recommendations: ['Upload valid data for analysis'],
        tone: 'informational',
        wordCount: 20,
      },
      supporting: {},
      dataStory: {
        title: 'No Data Available',
        chapters: [],
      },
      summary: {
        wordCount: 20,
        sections: 1,
        tone,
        keyPoints: ['No data available'],
      },
      metadata: {
        tone,
        recordCount: 0,
        metricCount: 0,
        insightCount: 0,
        recommendationCount: 0,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // Helper methods
  getRecordCount(metrics) {
    let maxCount = 0;
    for (const [column, metric] of Object.entries(metrics)) {
      if (metric.count) {
        maxCount = Math.max(maxCount, metric.count);
      }
    }
    return maxCount;
  }

  selectTemplate(templates) {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  fillTemplate(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => context[key] || match);
  }

  determineTrend(metric) {
    // Simplified trend determination
    if (metric.coefficientOfVariation > 0.5) return 'volatile';
    if (metric.average > 0) return 'positive';
    return 'stable';
  }

  getMetricStatus(metric) {
    if (metric.volatility > 0.5) return 'volatile';
    if (metric.average > 0) return 'positive';
    return 'stable';
  }

  calculateHealthScore(column, metric) {
    // Simplified health score calculation
    let score = 80; // Base score

    // Adjust based on volatility
    if (metric.coefficientOfVariation > 0.5) score -= 20;
    else if (metric.coefficientOfVariation > 0.3) score -= 10;

    // Adjust based on value ranges
    if (column.toLowerCase().includes('fraud')) {
      if (metric.average > 0.7) score -= 30;
      else if (metric.average > 0.4) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  assessPerformance(metric) {
    if (metric.coefficientOfVariation < 0.2) return 'excellent';
    if (metric.coefficientOfVariation < 0.4) return 'good';
    if (metric.coefficientOfVariation < 0.6) return 'fair';
    return 'poor';
  }

  calculateWordCount(texts) {
    return texts.join(' ').split(/\s+/).length;
  }
}

module.exports = NarrativeService;

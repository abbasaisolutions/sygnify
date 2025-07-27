/**
 * LLaMA 3 Configuration
 * Settings for AI-powered narrative generation
 */

module.exports = {
  // API Configuration
  api: {
    endpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
    timeout: parseInt(process.env.LLAMA_TIMEOUT) || 30000,
    retries: parseInt(process.env.LLAMA_RETRIES) || 3,
  },

  // Model Configuration
  model: {
    name: process.env.LLAMA_MODEL || 'llama3.1:8b',
    temperature: parseFloat(process.env.LLAMA_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.LLAMA_MAX_TOKENS) || 2048,
    topP: parseFloat(process.env.LLAMA_TOP_P) || 0.9,
    topK: parseInt(process.env.LLAMA_TOP_K) || 40,
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: parseInt(process.env.LLAMA_RATE_LIMIT) || 10,
    burstLimit: parseInt(process.env.LLAMA_BURST_LIMIT) || 5,
  },

  // Fallback Configuration
  fallback: {
    enabled: process.env.LLAMA_FALLBACK_ENABLED !== 'false',
    timeout: parseInt(process.env.LLAMA_FALLBACK_TIMEOUT) || 5000,
  },

  // Prompt Templates
  prompts: {
    executive: {
      system: `You are a senior financial analyst AI with expertise in executive-level reporting. 
Generate clear, concise, and actionable narratives suitable for C-level executives.
Focus on high-level insights, strategic implications, and key recommendations.
Use professional, confident language with specific metrics and data points.`,

      user: `Generate an executive summary based on the following structured financial analytics data.
Focus on key insights, risk assessment, and strategic recommendations.
Keep it concise (150-200 words) and actionable.

Analytics Data:
{JSON_DATA}

Format the response as a professional executive summary with:
1. Key Findings (2-3 bullet points)
2. Risk Assessment (1-2 sentences)
3. Strategic Recommendations (2-3 actionable items)`,
    },

    bullet: {
      system: `You are a financial summarization engine specializing in bullet-point analysis.
Convert complex financial data into clear, scannable bullet points.
Focus on key metrics, trends, and actionable insights.`,

      user: `Create a bullet-point summary of the following financial analytics data.
Focus on the most important findings, metrics, and recommendations.

Analytics Data:
{JSON_DATA}

Format as bullet points covering:
• Data Overview
• Key Metrics
• Risk Factors
• Recommendations`,
    },

    narrative: {
      system: `You are an AI financial analyst creating human-readable business intelligence reports.
Generate comprehensive, narrative-style reports that tell the data story.
Use natural language that flows well and provides context for non-technical audiences.`,

      user: `Create a comprehensive narrative report based on the following financial analytics data.
Write in a natural, flowing style that tells the complete data story.

Analytics Data:
{JSON_DATA}

Structure the narrative with:
1. Executive Summary
2. Key Findings and Insights
3. Risk Assessment
4. Performance Analysis
5. Strategic Recommendations`,
    },

    technical: {
      system: `You are a technical financial analyst AI specializing in detailed analytical reports.
Generate comprehensive technical analysis with statistical context and methodology.
Include confidence intervals, statistical significance, and analytical caveats.`,

      user: `Generate a technical analysis report based on the following financial analytics data.
Include statistical context, confidence levels, and methodological considerations.

Analytics Data:
{JSON_DATA}

Structure the technical report with:
1. Methodology and Data Quality
2. Statistical Analysis
3. Confidence Intervals
4. Risk Assessment with Quantification
5. Technical Recommendations`,
    },
  },

  // Domain-specific configurations
  domains: {
    finance: {
      keyMetrics: ['transaction_amount', 'account_balance', 'fraud_score', 'transaction_count'],
      riskFactors: ['fraud_detection', 'liquidity_risk', 'credit_risk', 'operational_risk'],
      recommendations: ['fraud_prevention', 'liquidity_management', 'risk_mitigation', 'operational_efficiency'],
    },
    healthcare: {
      keyMetrics: ['treatment_cost', 'patient_satisfaction', 'recovery_time', 'readmission_rate'],
      riskFactors: ['patient_safety', 'regulatory_compliance', 'cost_management', 'quality_metrics'],
      recommendations: ['quality_improvement', 'cost_optimization', 'patient_care', 'compliance_enhancement'],
    },
    retail: {
      keyMetrics: ['sales_amount', 'inventory_turnover', 'customer_satisfaction', 'profit_margin'],
      riskFactors: ['inventory_risk', 'customer_churn', 'market_competition', 'supply_chain_disruption'],
      recommendations: ['inventory_optimization', 'customer_retention', 'market_expansion', 'supply_chain_resilience'],
    },
  },

  // Error handling
  errors: {
    connectionTimeout: 'LLaMA API connection timeout',
    rateLimitExceeded: 'Rate limit exceeded for LLaMA API',
    modelNotFound: 'Specified LLaMA model not found',
    generationFailed: 'Narrative generation failed',
    fallbackEnabled: 'Falling back to template-based generation',
  },
};

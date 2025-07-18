const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const { db } = require('../config');
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

// Import our modular services
const LabelService = require('../../services/LabelService');
const InsightService = require('../../services/InsightService');
const PredictionService = require('../../services/PredictionService');
const RecommendationService = require('../../services/RecommendationService');
const NarrativeService = require('../../services/NarrativeService');
const MLSummaryService = require('../../services/MLSummaryService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/csv/)) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit (increased from 10MB)
});

/**
 * POST /api/analyze/upload
 * Upload and analyze CSV file with comprehensive analysis
 */
router.post(
  '/upload',
  upload.single('file'),
  [
    body('domain').isIn(['finance', 'healthcare', 'retail', 'general']).optional(),
    body('tone').isIn(['executive', 'analyst', 'technical']).optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { domain = 'finance', tone = 'executive' } = req.body;
      
      // Parse CSV file
      const data = await parseCSVFile(req.file.path);
      
      console.log('🚀 Starting comprehensive analysis...');
      console.log(`📊 Processing ${data.length} records with domain: ${domain}, tone: ${tone}`);
      
      // Initialize services
      const labelService = new LabelService(domain);
      const insightService = new InsightService(domain);
      const predictionService = new PredictionService(domain);
      const recommendationService = new RecommendationService(domain);
      const narrativeService = new NarrativeService(domain);
      
      // Step 1: Smart Labeling
      console.log('🏷️ Generating smart labels...');
      const labels = await labelService.extractLabels(data);
      
      // Step 2: Insight Generation
      console.log('📈 Computing insights and metrics...');
      const insightResults = await insightService.computeMetrics(data, labels);
      
      // Step 3: Forecasting
      console.log('🔮 Generating forecasts...');
      const forecasts = await predictionService.generateForecasts(data, labels, insightResults.metrics);
      
      // Step 4: Recommendations
      console.log('💡 Generating recommendations...');
      const recommendations = await recommendationService.generateRecommendations(
        insightResults.metrics, 
        insightResults.insights, 
        forecasts, 
        labels
      );
      
      // Step 5: Narrative Generation
      console.log('📝 Composing narratives...');
      const narratives = await narrativeService.generateNarratives(
        insightResults.metrics,
        insightResults.insights,
        forecasts,
        recommendations.recommendations,
        labels,
        tone
      );
      
      // Compile comprehensive analysis
      const analysis = {
        scorecard: this.generateScorecard(insightResults.metrics, forecasts),
        insights: insightResults.insights,
        forecast: this.formatForecasts(forecasts),
        narrative: narratives.main,
        recommendations: recommendations.recommendations,
        metadata: {
          recordCount: data.length,
          domain: domain,
          tone: tone,
          generatedAt: new Date().toISOString(),
          pipelineVersion: '2.1.0'
        }
      };
      
      // Store results in database
      const analysisId = await this.storeAnalysisResults(analysis, req.file.originalname, domain);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({ 
        message: 'Analysis completed successfully',
        analysisId: analysisId,
        analysis: analysis
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed: ' + error.message });
    }
  }
);

/**
 * GET /api/analyze/summary
 * Get analysis summary by ID
 */
router.get('/summary/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    const summary = {
      scorecard: analysis.scorecard,
      keyInsights: analysis.insights.slice(0, 5),
      riskLevel: this.calculateRiskLevel(analysis.insights),
      recordCount: analysis.metadata.recordCount,
      generatedAt: analysis.metadata.generatedAt
    };
    
    res.json({ summary });
    
  } catch (error) {
    console.error('Summary retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve summary' });
  }
});

/**
 * GET /api/analyze/predictions
 * Get forecasts and predictions by analysis ID
 */
router.get('/predictions/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({ 
      predictions: analysis.forecast,
      confidence: this.calculateOverallConfidence(analysis.forecast)
    });
    
  } catch (error) {
    console.error('Predictions retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve predictions' });
  }
});

/**
 * GET /api/analyze/recommendations
 * Get recommendations by analysis ID
 */
router.get('/recommendations/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    const recommendations = {
      critical: analysis.recommendations.filter(r => r.priority === 'critical'),
      high: analysis.recommendations.filter(r => r.priority === 'high'),
      medium: analysis.recommendations.filter(r => r.priority === 'medium'),
      low: analysis.recommendations.filter(r => r.priority === 'low')
    };
    
    res.json({ recommendations });
    
  } catch (error) {
    console.error('Recommendations retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
});

/**
 * GET /api/analyze/narrative
 * Get narrative by analysis ID with optional AI generation
 */
router.get('/narrative/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { 
      tone = 'executive', 
      useAI = 'true',
      style = 'executive',
      customInstructions 
    } = req.query;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Initialize narrative service with AI options
    const narrativeService = new NarrativeService(analysis.metadata.domain, {
      useAI: useAI === 'true',
      llamaEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      llamaModel: process.env.LLAMA_MODEL || 'llama3.1:8b'
    });
    
    // Generate narrative with AI options
    const narratives = await narrativeService.generateNarratives(
      analysis.scorecard.metrics || {},
      analysis.insights || [],
      analysis.forecast || {},
      analysis.recommendations || [],
      analysis.labels || {},
      tone,
      {
        useAI: useAI === 'true',
        style: style,
        customInstructions: customInstructions
      }
    );
    
    res.json({ 
      narrative: narratives.main,
      supporting: narratives.supporting,
      dataStory: narratives.dataStory,
      metadata: narratives.metadata
    });
    
  } catch (error) {
    console.error('Narrative generation error:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
});

/**
 * POST /api/analyze/narrative/ai
 * Generate AI-powered narrative with custom options
 */
router.post('/narrative/ai', [
  body('analysisId').isUUID().notEmpty(),
  body('style').isIn(['executive', 'bullet', 'narrative', 'technical']).optional(),
  body('customInstructions').isString().optional(),
  body('temperature').isFloat({ min: 0, max: 2 }).optional(),
  body('maxTokens').isInt({ min: 100, max: 4000 }).optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      analysisId, 
      style = 'executive',
      customInstructions,
      temperature,
      maxTokens
    } = req.body;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Initialize narrative service with AI enabled
    const narrativeService = new NarrativeService(analysis.metadata.domain, {
      useAI: true,
      llamaEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      llamaModel: process.env.LLAMA_MODEL || 'llama3.1:8b'
    });
    
    // Generate AI narrative with custom options
    const narratives = await narrativeService.generateNarratives(
      analysis.scorecard.metrics || {},
      analysis.insights || [],
      analysis.forecast || {},
      analysis.recommendations || [],
      analysis.labels || {},
      style,
      {
        useAI: true,
        style: style,
        customInstructions: customInstructions,
        temperature: temperature,
        maxTokens: maxTokens
      }
    );
    
    res.json({
      success: true,
      narrative: narratives.main,
      supporting: narratives.supporting,
      dataStory: narratives.dataStory,
      metadata: narratives.metadata,
      aiGenerated: narratives.metadata.aiGenerated || false
    });
    
  } catch (error) {
    console.error('AI narrative generation error:', error);
    res.status(500).json({ 
      error: 'AI narrative generation failed',
      details: error.message,
      fallback: 'Consider using template-based generation'
    });
  }
});

/**
 * POST /api/analyze/narrative/generate
 * Generate professional narrative summary using LLaMA 3
 */
router.post('/narrative/generate', [
  body('data').isObject().notEmpty(),
  body('style').isIn(['executive', 'bullet', 'narrative', 'technical']).optional(),
  body('customInstructions').isString().optional(),
  body('temperature').isFloat({ min: 0, max: 2 }).optional(),
  body('maxTokens').isInt({ min: 100, max: 4000 }).optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      data, 
      style = 'executive',
      customInstructions,
      temperature = 0.7,
      maxTokens = 1500
    } = req.body;
    
    // Initialize LLaMA service
    const LLaMAService = require('../../services/LLaMAService');
    const llamaService = new LLaMAService({
      apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      model: process.env.LLAMA_MODEL || 'llama3.1:8b',
      temperature: temperature,
      maxTokens: maxTokens
    });
    
    // Generate AI narrative with refined prompt structure
    const aiResult = await llamaService.generateNarrative(data, style, {
      customInstructions: customInstructions,
      temperature: temperature,
      maxTokens: maxTokens
    });
    
    if (!aiResult.success) {
      return res.status(500).json({
        error: 'AI narrative generation failed',
        details: aiResult.error,
        fallback: 'Consider using template-based generation'
      });
    }
    
    // Format response for dashboard consumption
    const response = {
      success: true,
      narrative: {
        content: aiResult.narrative.content || aiResult.narrative.summary || '',
        style: style,
        wordCount: aiResult.narrative.wordCount || 0,
        sections: this.extractNarrativeSections(aiResult.narrative),
        keyPoints: this.extractKeyPoints(aiResult.narrative),
        recommendations: this.extractRecommendations(aiResult.narrative)
      },
      metadata: {
        aiGenerated: true,
        model: aiResult.metadata.model,
        confidence: aiResult.metadata.confidence,
        generationTime: aiResult.metadata.generationTime,
        tokensUsed: aiResult.metadata.tokensUsed,
        generatedAt: aiResult.metadata.generatedAt
      },
      data: {
        recordCount: data.records_analyzed || 0,
        domain: data.domain || 'Finance',
        healthScore: data.financial_health_score || 0,
        riskLevel: data.risk_level || 'MEDIUM'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Narrative generation error:', error);
    res.status(500).json({ 
      error: 'Narrative generation failed',
      details: error.message
    });
  }
});

/**
 * POST /api/analyze/narrative/quick
 * Quick narrative generation with minimal configuration
 */
router.post('/narrative/quick', [
  body('data').isObject().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { data } = req.body;
    
    // Initialize LLaMA service with default settings
    const LLaMAService = require('../../services/LLaMAService');
    const llamaService = new LLaMAService({
      apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      model: process.env.LLAMA_MODEL || 'llama3.1:8b',
      temperature: 0.7,
      maxTokens: 1000
    });
    
    // Generate executive summary by default
    const aiResult = await llamaService.generateNarrative(data, 'executive');
    
    if (!aiResult.success) {
      // Fallback to simple template-based generation
      const fallbackNarrative = this.generateFallbackNarrative(data);
      return res.json({
        success: true,
        narrative: fallbackNarrative,
        metadata: {
          aiGenerated: false,
          fallback: true,
          reason: aiResult.error
        }
      });
    }
    
    res.json({
      success: true,
      narrative: {
        content: aiResult.narrative.content || aiResult.narrative.summary || '',
        style: 'executive',
        wordCount: aiResult.narrative.wordCount || 0
      },
      metadata: {
        aiGenerated: true,
        model: aiResult.metadata.model,
        confidence: aiResult.metadata.confidence
      }
    });
    
  } catch (error) {
    console.error('Quick narrative generation error:', error);
    res.status(500).json({ 
      error: 'Quick narrative generation failed',
      details: error.message
    });
  }
});

/**
 * GET /api/analyze/llama/status
 * Check LLaMA service status and available models
 */
router.get('/llama/status', async (req, res) => {
  try {
    const LLaMAService = require('../../services/LLaMAService');
    const llamaService = new LLaMAService({
      apiEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate'
    });
    
    const connectionStatus = await llamaService.testConnection();
    const availableModels = await llamaService.getAvailableModels();
    
    res.json({
      connection: connectionStatus,
      availableModels: availableModels,
      configuredEndpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
      configuredModel: process.env.LLAMA_MODEL || 'llama3.1:8b'
    });
    
  } catch (error) {
    console.error('LLaMA status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check LLaMA status',
      details: error.message
    });
  }
});

/**
 * GET /api/analyze/labels
 * Get smart labels by analysis ID
 */
router.get('/labels/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Extract labels from scorecard if available
    const labels = analysis.scorecard.labels || {};
    
    res.json({ labels });
    
  } catch (error) {
    console.error('Labels retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve labels' });
  }
});

/**
 * GET /api/analyze/metrics
 * Get detailed metrics by analysis ID
 */
router.get('/metrics/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({ 
      metrics: analysis.scorecard.metrics || {},
      anomalies: analysis.scorecard.anomalies || []
    });
    
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * POST /api/analyze/ml-summary
 * Generate ML-powered comprehensive summary using all statistics
 */
router.post('/ml-summary', [
  body('metrics').isObject().notEmpty(),
  body('insights').isArray().optional(),
  body('forecasts').isObject().optional(),
  body('recommendations').isArray().optional(),
  body('labels').isObject().optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      metrics, 
      insights = [], 
      forecasts = {}, 
      recommendations = [], 
      labels = {} 
    } = req.body;
    
    if (!metrics || Object.keys(metrics).length === 0) {
      return res.status(400).json({ 
        error: 'No metrics provided for ML summary generation' 
      });
    }

    console.log('🧠 Generating ML-powered comprehensive summary...');
    
    // Initialize ML Summary Service
    const mlSummaryService = new MLSummaryService('finance');
    
    const mlSummary = await mlSummaryService.generateMLSummary(
      metrics, 
      insights, 
      forecasts, 
      recommendations, 
      labels
    );

    if (mlSummary.success) {
      console.log('✅ ML summary generated successfully');
      res.status(200).json({
        success: true,
        mlSummary: mlSummary,
        message: 'ML-powered summary generated successfully'
      });
    } else {
      console.log('❌ ML summary generation failed:', mlSummary.error);
      res.status(500).json({
        success: false,
        error: mlSummary.error,
        fallbackSummary: mlSummary.summary
      });
    }

  } catch (error) {
    console.error('ML Summary generation error:', error);
    res.status(500).json({ 
      error: 'ML summary generation failed: ' + error.message 
    });
  }
});

/**
 * POST /api/analyze/ml-summary/analysis
 * Generate ML summary from existing analysis ID
 */
router.post('/ml-summary/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    console.log('🧠 Generating ML summary from existing analysis...');
    
    // Initialize ML Summary Service
    const mlSummaryService = new MLSummaryService(analysis.metadata.domain || 'finance');
    
    const mlSummary = await mlSummaryService.generateMLSummary(
      analysis.scorecard.metrics || {},
      analysis.insights || [],
      analysis.forecast || {},
      analysis.recommendations || [],
      analysis.labels || {}
    );

    if (mlSummary.success) {
      console.log('✅ ML summary generated from analysis successfully');
      res.status(200).json({
        success: true,
        mlSummary: mlSummary,
        analysisId: analysisId,
        message: 'ML-powered summary generated from analysis'
      });
    } else {
      console.log('❌ ML summary generation failed:', mlSummary.error);
      res.status(500).json({
        success: false,
        error: mlSummary.error,
        fallbackSummary: mlSummary.summary
      });
    }

  } catch (error) {
    console.error('ML Summary generation error:', error);
    res.status(500).json({ 
      error: 'ML summary generation failed: ' + error.message 
    });
  }
});

// Helper methods
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(parse({ 
        header: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

function generateScorecard(metrics, forecasts) {
  const scorecard = {
    metrics: metrics,
    kpis: {},
    health: {
      overall: 85,
      liquidity: 90,
      profitability: 80,
      efficiency: 85
    },
    risk: {
      level: 'low',
      factors: []
    }
  };
  
  // Calculate KPIs
  for (const [column, metric] of Object.entries(metrics)) {
    if (metric.average !== undefined) {
      scorecard.kpis[column] = {
        current: metric.average,
        trend: metric.average > 0 ? 'positive' : 'negative',
        volatility: metric.coefficientOfVariation || 0
      };
    }
  }
  
  // Calculate health scores
  if (metrics.amount) {
    scorecard.health.profitability = Math.min(100, Math.max(0, 100 - Math.abs(metrics.amount.average) / 100));
  }
  
  if (metrics.current_balance) {
    scorecard.health.liquidity = Math.min(100, Math.max(0, 100 - metrics.current_balance.coefficientOfVariation * 100));
  }
  
  scorecard.health.overall = Math.round(
    (scorecard.health.liquidity + scorecard.health.profitability + scorecard.health.efficiency) / 3
  );
  
  return scorecard;
}

function formatForecasts(forecasts) {
  return {
    revenue: forecasts.revenue ? {
      nextMonth: `$${forecasts.revenue.nextMonth.value.toFixed(2)} ± $${forecasts.revenue.nextMonth.variance.toFixed(2)}`,
      nextQuarter: `$${forecasts.revenue.nextQuarter.value.toFixed(2)} ± $${forecasts.revenue.nextQuarter.variance.toFixed(2)}`,
      confidence: forecasts.revenue.nextMonth.confidence
    } : null,
    cashFlow: forecasts.cashFlow ? {
      nextMonth: `$${forecasts.cashFlow.nextMonth.value.toFixed(2)} ± $${forecasts.cashFlow.nextMonth.variance.toFixed(2)}`,
      riskLevel: forecasts.cashFlow.nextMonth.riskLevel,
      confidence: forecasts.cashFlow.nextMonth.confidence
    } : null,
    fraud: forecasts.fraud ? {
      trend: forecasts.fraud.trend.direction,
      nextMonth: forecasts.fraud.nextMonth.value.toFixed(3),
      riskLevel: forecasts.fraud.nextMonth.riskLevel
    } : null
  };
}

function calculateRiskLevel(insights) {
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  
  if (criticalCount > 0) return 'high';
  if (warningCount > 2) return 'medium';
  return 'low';
}

function calculateOverallConfidence(forecasts) {
  const confidences = [];
  
  if (forecasts.revenue?.nextMonth?.confidence) {
    confidences.push(forecasts.revenue.nextMonth.confidence);
  }
  if (forecasts.cashFlow?.nextMonth?.confidence) {
    confidences.push(forecasts.cashFlow.nextMonth.confidence);
  }
  
  return confidences.length > 0 ? 
    (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2) : 
    '0.50';
}

async function storeAnalysisResults(analysis, fileName, domain) {
  // Create analysis_results table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      file_name TEXT,
      domain TEXT,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  const insert = db.prepare(
    'INSERT INTO analysis_results (user_id, file_name, domain, results) VALUES (?, ?, ?, ?)'
  );
  
  const result = insert.run(1, fileName, domain, JSON.stringify(analysis));
  return result.lastInsertRowid;
}

async function getAnalysisById(analysisId) {
  const analysis = db.prepare(
    'SELECT * FROM analysis_results WHERE id = ?'
  ).get(analysisId);
  
  if (!analysis) return null;
  
  return {
    ...analysis,
    scorecard: JSON.parse(analysis.results).scorecard,
    insights: JSON.parse(analysis.results).insights,
    forecast: JSON.parse(analysis.results).forecast,
    narrative: JSON.parse(analysis.results).narrative,
    recommendations: JSON.parse(analysis.results).recommendations,
    metadata: JSON.parse(analysis.results).metadata
  };
}

/**
 * Extract narrative sections from AI response
 */
function extractNarrativeSections(narrative) {
  const sections = {};
  
  if (narrative.sections) {
    return narrative.sections;
  }
  
  // Try to extract sections from content
  const content = narrative.content || narrative.summary || '';
  
  // Look for common section headers
  const sectionPatterns = {
    'Executive Summary': /executive summary:?(.*?)(?=Key|Risk|Strategic|Overall)/is,
    'Key Risks': /key risks[^:]*:?(.*?)(?=Strategic|Overall|$)/is,
    'Strategic Recommendations': /strategic recommendations:?(.*?)(?=Overall|$)/is,
    'Overall Assessment': /overall assessment:?(.*?)$/is
  };
  
  for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
    const match = content.match(pattern);
    if (match) {
      sections[sectionName] = match[1].trim();
    }
  }
  
  return sections;
}

/**
 * Extract key points from narrative
 */
function extractKeyPoints(narrative) {
  const content = narrative.content || narrative.summary || '';
  const keyPoints = [];
  
  // Look for bullet points or key findings
  const bulletPattern = /[•\-\*]\s*(.+?)(?=\n|$)/g;
  let match;
  
  while ((match = bulletPattern.exec(content)) !== null) {
    keyPoints.push(match[1].trim());
  }
  
  // If no bullets found, extract sentences with key terms
  if (keyPoints.length === 0) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyTerms = ['risk', 'opportunity', 'recommend', 'forecast', 'trend'];
    
    for (const sentence of sentences) {
      if (keyTerms.some(term => sentence.toLowerCase().includes(term))) {
        keyPoints.push(sentence.trim());
      }
    }
  }
  
  return keyPoints.slice(0, 5); // Limit to 5 key points
}

/**
 * Extract recommendations from narrative
 */
function extractRecommendations(narrative) {
  const content = narrative.content || narrative.summary || '';
  const recommendations = [];
  
  // Look for recommendation patterns
  const recPatterns = [
    /recommend[^.!?]*[.!?]/gi,
    /implement[^.!?]*[.!?]/gi,
    /optimize[^.!?]*[.!?]/gi,
    /improve[^.!?]*[.!?]/gi
  ];
  
  for (const pattern of recPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      recommendations.push(...matches.map(m => m.trim()));
    }
  }
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

/**
 * Generate fallback narrative when AI fails
 */
function generateFallbackNarrative(data) {
  const recordCount = data.records_analyzed || 0;
  const healthScore = data.financial_health_score || 0;
  const riskLevel = data.risk_level || 'MEDIUM';
  
  return {
    content: `Analysis of ${recordCount} records shows a financial health score of ${healthScore} with ${riskLevel} risk level. The data indicates ${healthScore > 80 ? 'strong' : healthScore > 60 ? 'moderate' : 'concerning'} performance patterns. Consider implementing risk mitigation strategies and monitoring key metrics closely.`,
    style: 'executive',
    wordCount: 45
  };
}

module.exports = router; 
const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const { db } = require('../config');
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

// Import our enhanced financial analysis system
const { run_financial_analysis } = require('../../financial_analysis/analyze.js');

// Import Enhanced ML Services
const MLSummaryService = require('../../services/MLSummaryService');
const EnhancedMLService = require('../../services/EnhancedMLService');
const AdvancedDataProcessor = require('../../services/AdvancedDataProcessor');
const AIInsightEngine = require('../../services/AIInsightEngine');

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/csv/)) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post(
  '/upload',
  upload.single('file'),
  [
    body('domain').isIn(['general', 'advertising', 'supply_chain', 'finance', 'hr', 'operations']).optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { domain } = req.body;
      
      console.log('🚀 Starting enhanced AI-powered analysis...');
      
      // Step 1: Advanced Data Processing
      console.log('📊 Step 1: Advanced data processing...');
      const dataProcessor = new AdvancedDataProcessor();
      const processedData = await dataProcessor.parseCSV(req.file.path);
      
      if (!processedData.success) {
        throw new Error(`Data processing failed: ${processedData.error}`);
      }
      
      console.log(`✅ Processed ${processedData.data.length} records with ${processedData.metadata.totalColumns} columns`);
      console.log(`📈 Data quality score: ${Math.round(processedData.quality.score * 100)}%`);
      
      // Step 2: Enhanced ML Analysis
      console.log('🧠 Step 2: Enhanced ML analysis...');
      const enhancedMLService = new EnhancedMLService(domain || 'finance');
      
      // Create proper data structure for EnhancedMLService
      const enhancedDataStructure = {
        data: processedData.data,
        metadata: processedData.metadata,
        schema: processedData.schema,
        quality: processedData.quality,
        numericColumns: processedData.schema ? 
          Object.fromEntries(
            Object.entries(processedData.schema)
              .filter(([, schema]) => schema.type === 'numeric' || schema.type === 'currency')
              .map(([column, schema]) => [column, { type: schema.type, confidence: schema.confidence }])
          ) : {},
        amountColumns: processedData.schema ? 
          Object.fromEntries(
            Object.entries(processedData.schema)
              .filter(([, schema]) => schema.type === 'currency')
              .map(([column, schema]) => [column, { type: schema.type, confidence: schema.confidence }])
          ) : {},
        categoricalColumns: processedData.schema ? 
          Object.fromEntries(
            Object.entries(processedData.schema)
              .filter(([, schema]) => schema.type === 'text' || schema.type === 'categorical')
              .map(([column, schema]) => [column, { type: schema.type, confidence: schema.confidence }])
          ) : {}
      };
      
      const enhancedInsights = await enhancedMLService.generateEnhancedInsights(enhancedDataStructure);
      
      console.log(`✅ Generated ${enhancedInsights.patterns.length} patterns and ${enhancedInsights.anomalies.length} anomalies`);
      
      // Step 3: AI Insight Engine
      console.log('🤖 Step 3: AI insight generation...');
      const aiInsightEngine = new AIInsightEngine(domain || 'finance');
      const financialMetrics = dataProcessor.extractFinancialMetrics(processedData.data, processedData.schema);
      const aiInsights = await aiInsightEngine.generateInsights(processedData, financialMetrics);
      
      console.log(`✅ Generated ${aiInsights.insights.cashFlow.length + aiInsights.insights.profitability.length} financial insights`);
      
      // Step 4: Legacy Analysis for Compatibility
      console.log('📈 Step 4: Running legacy analysis...');
      const simpleAnalysis = await runSimpleAnalysis(domain || 'finance', processedData.data);
      console.log('✅ Legacy analysis completed');
      
      // Step 5: Enhanced Financial Analysis
      console.log('💰 Step 5: Enhanced financial analysis...');
      const columns = Object.keys(processedData.data[0] || {});
      
      // Ensure we have valid data before calling financial analysis
      if (!processedData.data || processedData.data.length === 0) {
        throw new Error('No data available for financial analysis');
      }
      
      // DEBUG: Log columns and sample row
      console.log('Columns sent to Python:', columns);
      console.log('Sample row sent to Python:', processedData.data[0]);
      
      const enhancedAnalysis = await run_financial_analysis(
        columns,
        processedData.data.slice(0, 100), // Send first 100 rows for analysis to avoid memory issues
        1, // Default user
        'executive' // Default role
      );
      console.log('✅ Enhanced financial analysis completed');
      
      // Step 6: ML Summary Generation
      console.log('📝 Step 6: Generating comprehensive ML summary...');
      const mlSummaryService = new MLSummaryService(domain || 'finance');
      const mlSummary = await mlSummaryService.generateMLSummary(
        simpleAnalysis.results,
        enhancedAnalysis.facts?.facts || [],
        enhancedAnalysis.predictions || {},
        enhancedAnalysis.recommendations || [],
        enhancedAnalysis.enhanced_labels || {}
      );
      console.log('✅ ML summary generated');
      
      // Combine all analyses into comprehensive result
      const unifiedRecordsAnalyzed = enhancedAnalysis?.metadata?.records_analyzed || processedData.data.length;
      
      // Enhanced data quality calculation with better fallback logic
      let unifiedDataQuality = 0;
      if (enhancedAnalysis?.metadata?.data_quality?.score) {
        unifiedDataQuality = Math.round(enhancedAnalysis.metadata.data_quality.score * 100);
      } else if (processedData.quality?.score) {
        unifiedDataQuality = Math.round(processedData.quality.score * 100);
      } else {
        // Default high quality for valid data
        unifiedDataQuality = 95;
      }
      
      const unifiedMetrics = enhancedAnalysis?.metrics || {};
      const unifiedTotalColumns = processedData.metadata?.totalColumns || columns.length;

      // DEBUG: Confirm unified values
      console.log('[Unified] Records Analyzed:', unifiedRecordsAnalyzed);
      console.log('[Unified] Data Quality:', unifiedDataQuality);
      console.log('[Unified] Enhanced Analysis Metadata:', enhancedAnalysis?.metadata);
      console.log('[Unified] Processed Data Quality:', processedData.quality);
      console.log('[Unified] Metrics:', unifiedMetrics);
      console.log('[Unified] Total Columns:', unifiedTotalColumns);

      const analysis = {
        // Enhanced Data Processing Results
        dataProcessing: {
          metadata: {
            ...processedData.metadata,
            totalRows: unifiedRecordsAnalyzed,
            totalColumns: unifiedTotalColumns
          },
          schema: processedData.schema,
          quality: {
            ...processedData.quality,
            score: unifiedDataQuality / 100
          },
          validation: processedData.validation || { passed: true, errors: [] }
        },
        // Enhanced ML Analysis Results
        enhancedML: {
          patterns: enhancedInsights.patterns,
          anomalies: enhancedInsights.anomalies,
          trends: enhancedInsights.trends,
          risks: enhancedInsights.risks,
          opportunities: enhancedInsights.opportunities,
          recommendations: enhancedInsights.recommendations,
          predictions: enhancedInsights.predictions,
          summary: enhancedInsights.summary
        },
        // AI Insight Engine Results
        aiInsights: aiInsights.success ? {
          cashFlow: aiInsights.insights.cashFlow,
          profitability: aiInsights.insights.profitability,
          risk: aiInsights.insights.risk,
          efficiency: aiInsights.insights.efficiency,
          trends: aiInsights.insights.trends,
          anomalies: aiInsights.insights.anomalies,
          opportunities: aiInsights.insights.opportunities,
          recommendations: aiInsights.insights.recommendations,
          summary: aiInsights.insights.summary,
          metadata: aiInsights.metadata
        } : {
          error: aiInsights.error,
          insights: aiInsights.insights
        },
        // Financial Metrics
        financialMetrics: financialMetrics,
        // Legacy Results for Compatibility
        results: simpleAnalysis.results,
        insights: simpleAnalysis.insights,
        visualizations: simpleAnalysis.visualizations,
        // Enhanced System Results
        comprehension: {
          metadata: {
            totalRecords: unifiedRecordsAnalyzed,
            totalColumns: unifiedTotalColumns,
            domain: domain || 'finance',
            pipelineVersion: '3.0.0',
            crossColumnInference: true,
            enhancedProcessing: true,
            predictionConfidence: enhancedAnalysis?.metadata?.prediction_confidence || (unifiedRecordsAnalyzed > 500 ? 'high' : unifiedRecordsAnalyzed > 100 ? 'medium' : 'low')
          },
          dataQuality: {
            overallScore: unifiedDataQuality,
            outliers: enhancedInsights.anomalies.length,
            completeness: enhancedAnalysis?.metadata?.data_quality?.completeness || processedData.quality.completeness,
            accuracy: enhancedAnalysis?.metadata?.data_quality?.accuracy || processedData.quality.accuracy,
            consistency: enhancedAnalysis?.metadata?.data_quality?.consistency || 0.91
          },
          smartLabels: enhancedAnalysis.smart_labels || {},
          enhancedLabels: enhancedAnalysis.enhanced_labels || {},
          narratives: enhancedAnalysis.narratives || [],
          facts: enhancedAnalysis.facts || {},
          recommendations: enhancedAnalysis.recommendations || [],
          insights: enhancedAnalysis.facts?.facts || []
        },
        // ML-Powered Summary
        mlSummary: mlSummary.success ? {
          summary: mlSummary.summary,
          riskProfile: mlSummary.riskProfile,
          patterns: mlSummary.patterns,
          performanceProfile: mlSummary.performanceProfile,
          operationalInsights: mlSummary.operationalInsights,
          correlations: mlSummary.correlations,
          metadata: mlSummary.metadata
        } : {
          summary: mlSummary.summary,
          error: mlSummary.error
        },
        // Advanced AI Features
        advancedAI: {
          financialHealth: calculateFinancialHealth({ metrics: unifiedMetrics }, aiInsights),
          predictions: generatePredictions({ metrics: unifiedMetrics }, enhancedInsights),
          strategicRecommendations: generateStrategicRecommendations(aiInsights),
          businessInsights: enhancedAnalysis.facts?.facts || [],
          riskAssessment: generateRiskAssessment({ metrics: unifiedMetrics }, aiInsights),
          performanceMetrics: generatePerformanceMetrics({ metrics: unifiedMetrics }, processedData)
        }
      };
      
      // Store results in database
      const defaultUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@sygnify.com');
      const userId = defaultUser ? defaultUser.id : 1;
      
      // Create analysis_results table if it doesn't exist
      db.prepare(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          file_name TEXT,
          file_type TEXT,
          analysis_type TEXT,
          results TEXT,
          insights TEXT,
          visualizations TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      const insert = db.prepare(
        'INSERT INTO analysis_results (user_id, file_name, file_type, analysis_type, results, insights, visualizations) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      
      insert.run(
        userId,
        req.file.originalname,
        'csv',
        'enhanced_ai_analysis',
        JSON.stringify(analysis.results),
        JSON.stringify(analysis.aiInsights),
        JSON.stringify(analysis.visualizations)
      );
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      console.log('🎉 Enhanced AI analysis completed successfully!');
      
      res.status(200).json({ 
        message: 'File uploaded and analyzed successfully with enhanced AI',
        analysis: analysis
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  }
);

function detectDomain(data) {
  if (!data || data.length === 0) return 'general';
  
  const columns = Object.keys(data[0] || {});
  const domainKeywords = {
    advertising: ['clicks', 'impressions', 'ctr', 'conversion', 'ratings', 'reviews', 'campaign', 'ad'],
    supply_chain: ['supplier', 'inventory', 'lead_time', 'demand', 'warehouse', 'shipping'],
    finance: ['revenue', 'profit', 'expense', 'cash_flow', 'income', 'cost', 'budget'],
    hr: ['employee', 'satisfaction', 'turnover', 'salary', 'performance', 'attendance'],
    operations: ['production', 'downtime', 'efficiency', 'quality', 'output', 'capacity']
  };
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => columns.some(col => col.toLowerCase().includes(keyword)))) {
      return domain;
    }
  }
  return 'general';
}

async function runSimpleAnalysis(domain, data) {
  try {
    // Basic statistical analysis
    const numericColumns = [];
    const textColumns = [];
    
    if (data.length > 0) {
      const firstRow = data[0];
      Object.keys(firstRow).forEach(key => {
        const sampleValue = firstRow[key];
        if (!isNaN(sampleValue) && sampleValue !== '') {
          numericColumns.push(key);
        } else {
          textColumns.push(key);
        }
      });
    }
    
    // Calculate basic statistics for numeric columns
    const results = {};
    numericColumns.forEach(col => {
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length > 0) {
        results[col] = {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });
    
    // Generate insights based on domain
    const insights = generateDomainInsights(domain, data, results);
    
    // Generate simple visualizations
    const visualizations = generateVisualizations(domain, results);
    
    return {
      results,
      insights,
      visualizations
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      results: {},
      insights: ['Analysis failed due to processing error'],
      visualizations: []
    };
  }
}

function generateDomainInsights(domain, data, results) {
  const insights = [];
  
  switch (domain) {
    case 'finance':
      insights.push('Financial data analysis completed');
      if (Object.keys(results).length > 0) {
        insights.push('Key financial metrics calculated');
      }
      break;
    case 'hr':
      insights.push('HR data analysis completed');
      insights.push('Employee metrics processed');
      break;
    case 'operations':
      insights.push('Operations data analysis completed');
      insights.push('Performance metrics calculated');
      break;
    case 'advertising':
      insights.push('Advertising data analysis completed');
      insights.push('Campaign metrics processed');
      break;
    case 'supply_chain':
      insights.push('Supply chain data analysis completed');
      insights.push('Inventory and logistics metrics calculated');
      break;
    default:
      insights.push('General data analysis completed');
      insights.push(`${data.length} records processed`);
  }
  
  return insights;
}

function generateVisualizations(domain, results) {
  const visualizations = [];
  
  // Generate chart configurations for numeric data
  Object.keys(results).forEach(column => {
    const data = results[column];
    visualizations.push({
      type: 'bar',
      title: `${column} Statistics`,
      data: {
        labels: ['Count', 'Average', 'Min', 'Max'],
        datasets: [{
          label: column,
          data: [data.count, data.average, data.min, data.max],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    });
  });
  
  return visualizations;
}

// Helper methods for generating advanced AI features
function calculateFinancialHealth(financialMetrics, aiInsights) {
  const health = {
    overallScore: 0,
    riskLevel: 'low',
    metrics: {
      liquidity: { score: 0, grade: 'F', insights: [] },
      profitability: { score: 0, grade: 'F', insights: [] },
      efficiency: { score: 0, grade: 'F', insights: [] }
    }
  };

  // Use metrics object if available (from main.py)
  const metrics = financialMetrics.metrics || {};
  const amountAvg = metrics.amount_avg;
  const amountSum = metrics.amount_sum;
  const amountCount = metrics.amount_count;
  const fraudScorePct = metrics.fraud_score_pct;

  // Dynamic liquidity calculation
  if (typeof amountSum === 'number' && typeof amountCount === 'number' && amountCount > 0) {
    const netCashFlow = amountSum;
    const avgTransaction = amountAvg;
    const cashFlowRatio = avgTransaction > 0 ? 1 : 0; // crude, can be improved
    if (netCashFlow > 0 && cashFlowRatio > 0.6) {
      health.metrics.liquidity.score = 90;
      health.metrics.liquidity.grade = 'A';
      health.metrics.liquidity.insights.push('Strong positive cash flow');
    } else if (netCashFlow > 0) {
      health.metrics.liquidity.score = 70;
      health.metrics.liquidity.grade = 'B';
      health.metrics.liquidity.insights.push('Positive cash flow');
    } else {
      health.metrics.liquidity.score = 40;
      health.metrics.liquidity.grade = 'D';
      health.metrics.liquidity.insights.push('Negative cash flow');
    }
    console.log(`[Health] Liquidity: netCashFlow=${netCashFlow}, avgTransaction=${avgTransaction}, score=${health.metrics.liquidity.score}`);
  }

  // Dynamic profitability calculation
  if (typeof amountAvg === 'number') {
    // For demo: treat positive avg as profit, negative as loss
    const profitMargin = amountAvg > 0 ? 20 : (amountAvg < 0 ? -20 : 0);
    if (profitMargin > 20) {
      health.metrics.profitability.score = 90;
      health.metrics.profitability.grade = 'A';
      health.metrics.profitability.insights.push('High profitability');
    } else if (profitMargin > 10) {
      health.metrics.profitability.score = 75;
      health.metrics.profitability.grade = 'B';
      health.metrics.profitability.insights.push('Good profitability');
    } else if (profitMargin > 0) {
      health.metrics.profitability.score = 60;
      health.metrics.profitability.grade = 'C';
      health.metrics.profitability.insights.push('Low profitability');
    } else {
      health.metrics.profitability.score = 30;
      health.metrics.profitability.grade = 'F';
      health.metrics.profitability.insights.push('Negative profitability');
    }
    console.log(`[Health] Profitability: avgTransaction=${amountAvg}, score=${health.metrics.profitability.score}`);
  }

  // Dynamic efficiency calculation (placeholder: always good for now)
  health.metrics.efficiency.score = 85;
  health.metrics.efficiency.grade = 'A';
  health.metrics.efficiency.insights.push('Good operational efficiency');

  // Calculate overall score
  const scores = Object.values(health.metrics).map(m => m.score);
  health.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Determine risk level
  if (health.overallScore > 80) health.riskLevel = 'low';
  else if (health.overallScore > 60) health.riskLevel = 'medium';
  else health.riskLevel = 'high';

  return health;
}

function generatePredictions(financialMetrics, enhancedInsights) {
  const metrics = financialMetrics.metrics || {};
  const amountAvg = metrics.amount_avg;
  const amountCount = metrics.amount_count;
  const predictions = {
    revenue: {
      nextMonth: 0,
      nextQuarter: 0,
      confidence: 'low'
    },
    cashFlow: {
      nextMonth: 0,
      riskLevel: 'low',
      confidence: 'low'
    }
  };

  if (typeof amountAvg === 'number' && typeof amountCount === 'number' && amountCount > 0) {
    predictions.revenue.nextMonth = Math.round(amountAvg * 30);
    predictions.revenue.nextQuarter = Math.round(amountAvg * 90);
    predictions.cashFlow.nextMonth = Math.round(amountAvg * 25);
    predictions.revenue.confidence = amountCount > 100 ? 'high' : (amountCount > 50 ? 'medium' : 'low');
    predictions.cashFlow.confidence = predictions.revenue.confidence;
    predictions.cashFlow.riskLevel = amountAvg < 0 ? 'high' : (amountAvg === 0 ? 'medium' : 'low');
    console.log(`[Predictions] avgTransaction=${amountAvg}, count=${amountCount}, nextMonth=${predictions.revenue.nextMonth}`);
  }

  return predictions;
}

function generateStrategicRecommendations(aiInsights) {
  const recommendations = [];
  
  if (aiInsights.success && aiInsights.insights.recommendations) {
    aiInsights.insights.recommendations.slice(0, 3).forEach(rec => {
      recommendations.push({
        description: rec.description,
        action: rec.action,
        priority: rec.priority
      });
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      description: 'Optimize transaction processing',
      action: 'Implement automated fraud detection',
      priority: 'high'
    });
  }
  
  return recommendations;
}

function generateRiskAssessment(financialMetrics, aiInsights) {
  const assessment = {
    overallRisk: 'low',
    riskScore: 0,
    riskFactors: [],
    mitigationStrategies: []
  };
  
  if (aiInsights.success && aiInsights.insights.risk) {
    const riskInsights = aiInsights.insights.risk;
    if (riskInsights.length > 0) {
      const highestRisk = riskInsights.reduce((max, risk) => 
        risk.metrics.riskScore > max.metrics.riskScore ? risk : max
      );
      
      assessment.overallRisk = highestRisk.metrics.riskLevel;
      assessment.riskScore = highestRisk.metrics.riskScore;
      assessment.riskFactors = highestRisk.metrics.factors || [];
    }
  }
  
  return assessment;
}

function generatePerformanceMetrics(financialMetrics, processedData) {
  // Use actual processed data instead of financialMetrics.amounts
  const totalRecords = processedData.data.length;
  let totalTransactions = 0;
  let averageTransaction = 0;
  let netCashFlow = 0;
  
  // Calculate metrics from actual data
  if (processedData.data && processedData.data.length > 0) {
    // Find amount column
    const amountColumn = Object.keys(processedData.data[0]).find(col => 
      col.toLowerCase().includes('amount') || 
      col.toLowerCase().includes('value') || 
      col.toLowerCase().includes('price')
    );
    
    if (amountColumn) {
      const amounts = processedData.data
        .map(row => parseFloat(row[amountColumn]))
        .filter(amount => !isNaN(amount));
      
      totalTransactions = amounts.length;
      averageTransaction = amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0;
      netCashFlow = amounts.reduce((sum, amount) => sum + amount, 0);
    }
  }
  
  return {
    dataQuality: Math.round(processedData.quality.score * 100),
    totalTransactions: totalTransactions,
    averageTransaction: averageTransaction,
    netCashFlow: netCashFlow
  };
}

module.exports = router;
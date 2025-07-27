const MultiFormatDataParser = require('./MultiFormatDataParser');
const RealTimeDataConnector = require('./RealTimeDataConnector');
const ProductionSamplingService = require('./ProductionSamplingService');
const AdvancedMLService = require('./AdvancedMLService');
const AdvancedAnomalyDetectionService = require('./AdvancedAnomalyDetectionService');
const PythonIPCService = require('./PythonIPCService');
const ErrorBoundaryService = require('./ErrorBoundaryService');
const EnhancedLoggingService = require('./EnhancedLoggingService');

/**
 * Enhanced ML Pipeline Service
 * Integrates all data sources and formats while maintaining existing architecture
 */
class EnhancedMLPipeline {
  constructor() {
    this.dataParser = new MultiFormatDataParser();
    this.dataConnector = new RealTimeDataConnector();
    this.samplingService = new ProductionSamplingService();
    this.mlService = new AdvancedMLService();
    this.anomalyService = new AdvancedAnomalyDetectionService();
    this.pythonService = new PythonIPCService();
    this.errorBoundary = new ErrorBoundaryService();
    this.logger = new EnhancedLoggingService();

    this.pipelineStages = this.initializePipelineStages();
    this.dataSources = new Map();
    this.processingModes = this.initializeProcessingModes();
  }

  initializePipelineStages() {
    return {
      // Stage 1: Data Ingestion
      ingestion: {
        name: 'Data Ingestion',
        execute: async (input, context) => await this.executeDataIngestion(input, context),
      },

      // Stage 2: Data Validation
      validation: {
        name: 'Data Validation',
        execute: async (data, context) => await this.executeDataValidation(data, context),
      },

      // Stage 3: Data Processing
      processing: {
        name: 'Data Processing',
        execute: async (data, context) => await this.executeDataProcessing(data, context),
      },

      // Stage 4: ML Analysis
      mlAnalysis: {
        name: 'ML Analysis',
        execute: async (data, context) => await this.executeMLAnalysis(data, context),
      },

      // Stage 5: Python Integration
      pythonIntegration: {
        name: 'Python Integration',
        execute: async (data, context) => await this.executePythonIntegration(data, context),
      },

      // Stage 6: Insight Generation
      insightGeneration: {
        name: 'Insight Generation',
        execute: async (data, context) => await this.executeInsightGeneration(data, context),
      },
    };
  }

  initializeProcessingModes() {
    return {
      // Batch processing mode
      batch: {
        name: 'Batch Processing',
        description: 'Process data in batches for large datasets',
        execute: async (data, config) => await this.executeBatchProcessing(data, config),
      },

      // Real-time processing mode
      realtime: {
        name: 'Real-time Processing',
        description: 'Process data in real-time for live streams',
        execute: async (stream, config) => await this.executeRealtimeProcessing(stream, config),
      },

      // Hybrid processing mode
      hybrid: {
        name: 'Hybrid Processing',
        description: 'Combine batch and real-time processing',
        execute: async (data, config) => await this.executeHybridProcessing(data, config),
      },
    };
  }

  // Main pipeline execution method
  async executePipeline(input, config = {}) {
    const startTime = Date.now();
    const pipelineId = this.generatePipelineId();

    console.log(`🚀 Starting Enhanced ML Pipeline: ${pipelineId}`);
    this.logger.info('Pipeline started', { pipelineId, inputType: typeof input, config });

    try {
      const context = {
        pipelineId,
        startTime,
        config,
        stageResults: {},
        errors: [],
        warnings: [],
      };

      // Execute pipeline stages
      for (const [stageName, stage] of Object.entries(this.pipelineStages)) {
        try {
          console.log(`📋 Executing stage: ${stage.name}`);
          this.logger.info(`Stage started: ${stage.name}`, { pipelineId, stageName });

          const stageStartTime = Date.now();
          const stageResult = await stage.execute(input, context);
          const stageDuration = Date.now() - stageStartTime;

          context.stageResults[stageName] = {
            success: true,
            result: stageResult,
            duration: stageDuration,
            timestamp: new Date().toISOString(),
          };

          // Update input for next stage
          input = stageResult;

          this.logger.logPerformance(stage.name, stageDuration, true, { pipelineId, stageName });
          console.log(`✅ ${stage.name} completed in ${stageDuration}ms`);
        } catch (error) {
          const stageDuration = Date.now() - context.startTime;
          context.stageResults[stageName] = {
            success: false,
            error: error.message,
            duration: stageDuration,
            timestamp: new Date().toISOString(),
          };

          context.errors.push({
            stage: stageName,
            error: error.message,
            timestamp: new Date().toISOString(),
          });

          this.logger.error(`Stage failed: ${stage.name}`, { pipelineId, stageName }, error);
          console.error(`❌ ${stage.name} failed: ${error.message}`);

          // Execute fallback for failed stage
          const fallbackResult = await this.executeStageFallback(stageName, input, context);
          input = fallbackResult;
        }
      }

      const totalDuration = Date.now() - startTime;

      const result = {
        success: context.errors.length === 0,
        pipelineId,
        result: input,
        metadata: {
          totalDuration,
          stageResults: context.stageResults,
          errors: context.errors,
          warnings: context.warnings,
          timestamp: new Date().toISOString(),
        },
      };

      this.logger.logPerformance('Complete Pipeline', totalDuration, result.success, { pipelineId });
      console.log(`🎉 Pipeline completed in ${totalDuration}ms`);

      return result;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.logger.error('Pipeline failed', { pipelineId, totalDuration }, error);
      throw error;
    }
  }

  // Stage 1: Data Ingestion
  async executeDataIngestion(input, context) {
    return await this.errorBoundary.withErrorBoundary('dataIngestion', async () => {
      if (typeof input === 'string') {
        // File path input
        return await this.ingestFileData(input, context);
      } if (input.type === 'connection') {
        // Data source connection
        return await this.ingestConnectionData(input, context);
      } if (Array.isArray(input)) {
        // Direct data array
        return await this.ingestDirectData(input, context);
      } if (input.type === 'stream') {
        // Streaming data
        return await this.ingestStreamData(input, context);
      }
      throw new Error(`Unsupported input type: ${typeof input}`);
    });
  }

  // Stage 2: Data Validation
  async executeDataValidation(data, context) {
    return await this.errorBoundary.withErrorBoundary('dataValidation', async () => {
      if (!data || data.length === 0) {
        this.logger.logZeroResults('data_validation', data, context);
        throw new Error('No data to validate');
      }

      // Validate data structure
      const validation = await this.dataParser.validators.schema.validate(data);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      // Check data quality
      const quality = await this.dataParser.validators.dataQuality.validate(data);
      if (quality.issues.length > 0) {
        context.warnings.push(...quality.issues);
        this.logger.warn('Data quality issues detected', { issues: quality.issues });
      }

      return {
        data,
        validation,
        quality,
        recordCount: data.length,
        columns: Object.keys(data[0] || {}),
      };
    });
  }

  // Stage 3: Data Processing
  async executeDataProcessing(validationResult, context) {
    return await this.errorBoundary.withErrorBoundary('dataProcessing', async () => {
      const { data } = validationResult;

      // Normalize data
      const normalizedData = await this.dataParser.normalizers.schema.normalize(data);
      const typeNormalizedData = await this.dataParser.normalizers.dataTypes.normalize(normalizedData);
      const valueNormalizedData = await this.dataParser.normalizers.values.normalize(typeNormalizedData);

      // Apply sampling if needed
      const samplingResult = await this.samplingService.getOptimalSample(valueNormalizedData, {
        minSampleSize: 1000,
        maxSampleSize: 100000,
      });

      return {
        originalData: data,
        processedData: samplingResult.data,
        samplingInfo: samplingResult.metadata,
        schema: this.dataParser.extractSchema(samplingResult.data),
      };
    });
  }

  // Stage 4: ML Analysis
  async executeMLAnalysis(processingResult, context) {
    return await this.errorBoundary.withErrorBoundary('mlAnalysis', async () => {
      const { processedData } = processingResult;

      if (!processedData || processedData.length === 0) {
        this.logger.logZeroResults('ml_analysis', processedData, context);
        throw new Error('No data for ML analysis');
      }

      // Run advanced ML analysis
      const mlResults = await this.mlService.runAdvancedAnalysis(processedData);

      // Run anomaly detection
      const anomalyResults = await this.anomalyService.detectAnomalies(processedData);

      return {
        ...processingResult,
        mlResults,
        anomalyResults,
        insights: this.generateMLInsights(mlResults, anomalyResults),
      };
    });
  }

  // Stage 5: Python Integration
  async executePythonIntegration(mlResult, context) {
    return await this.errorBoundary.withErrorBoundary('pythonIntegration', async () => {
      const { processedData, mlResults, anomalyResults } = mlResult;

      // Run Python-based analysis
      const pythonResults = await this.pythonService.executePythonAnalysis(processedData, 'ml', {
        includeAnomalies: true,
        includeCorrelations: true,
        includeTemporal: true,
      });

      return {
        ...mlResult,
        pythonResults,
        combinedInsights: this.combineInsights(mlResults, anomalyResults, pythonResults),
      };
    });
  }

  // Stage 6: Insight Generation
  async executeInsightGeneration(integrationResult, context) {
    return await this.errorBoundary.withErrorBoundary('insightGeneration', async () => {
      const {
        processedData, mlResults, anomalyResults, pythonResults, combinedInsights,
      } = integrationResult;

      // Generate comprehensive insights
      const insights = await this.generateComprehensiveInsights({
        data: processedData,
        mlResults,
        anomalyResults,
        pythonResults,
        combinedInsights,
      });

      // Generate recommendations
      const recommendations = await this.generateRecommendations(insights);

      // Generate summary
      const summary = await this.generateSummary(insights, recommendations);

      return {
        success: true,
        insights,
        recommendations,
        summary,
        metadata: {
          recordCount: processedData.length,
          anomalyCount: anomalyResults.anomalies?.length || 0,
          insightCount: insights.length,
          recommendationCount: recommendations.length,
          timestamp: new Date().toISOString(),
        },
      };
    });
  }

  // Data ingestion methods
  async ingestFileData(filePath, context) {
    console.log(`📁 Ingesting file: ${filePath}`);

    const result = await this.dataParser.parseData(filePath);

    this.logger.info('File ingestion completed', {
      filePath,
      recordCount: result.data.length,
      format: result.metadata.format,
    });

    return result.data;
  }

  async ingestConnectionData(connectionConfig, context) {
    console.log(`🔌 Ingesting from connection: ${connectionConfig.name}`);

    // Connect to data source
    const connection = await this.dataConnector.connectToDataSource(connectionConfig);

    // Fetch data based on connection type
    const data = await this.fetchDataFromConnection(connection, connectionConfig);

    this.logger.info('Connection ingestion completed', {
      connectionName: connectionConfig.name,
      recordCount: data.length,
    });

    return data;
  }

  async ingestDirectData(data, context) {
    console.log(`📊 Ingesting direct data: ${data.length} records`);

    this.logger.info('Direct data ingestion completed', {
      recordCount: data.length,
    });

    return data;
  }

  async ingestStreamData(streamConfig, context) {
    console.log(`🌊 Ingesting stream data: ${streamConfig.name}`);

    // Create stream processor
    const streamProcessor = this.dataConnector.processors.stream;
    const processedStream = await streamProcessor.process(streamConfig.stream, streamConfig);

    this.logger.info('Stream ingestion completed', {
      streamName: streamConfig.name,
    });

    return processedStream;
  }

  // Connection data fetching
  async fetchDataFromConnection(connection, config) {
    const { type, connection: conn } = connection;

    switch (type) {
      case 'rest':
        return await this.fetchRESTData(conn, config);
      case 'graphql':
        return await this.fetchGraphQLData(conn, config);
      case 'postgresql':
        return await this.fetchPostgreSQLData(conn, config);
      case 'mongodb':
        return await this.fetchMongoDBData(conn, config);
      case 'bigquery':
        return await this.fetchBigQueryData(conn, config);
      case 'websocket':
        return await this.fetchWebSocketData(conn, config);
      case 'kafka':
        return await this.fetchKafkaData(conn, config);
      default:
        throw new Error(`Unsupported connection type: ${type}`);
    }
  }

  async fetchRESTData(conn, config) {
    const { endpoint, method = 'GET', params = {} } = config;
    return await conn.fetch(endpoint, { params });
  }

  async fetchGraphQLData(conn, config) {
    const { query, variables = {} } = config;
    return await conn.query(query, variables);
  }

  async fetchPostgreSQLData(conn, config) {
    const { query, params = [] } = config;
    return await conn.query(query, params);
  }

  async fetchMongoDBData(conn, config) {
    const { collection, query = {}, options = {} } = config;
    return await conn.query(collection, query, options);
  }

  async fetchBigQueryData(conn, config) {
    const { query, options = {} } = config;
    return await conn.query(query, options);
  }

  async fetchWebSocketData(conn, config) {
    return new Promise((resolve) => {
      const data = [];
      conn.onMessage((message) => {
        data.push(message);
        if (data.length >= config.maxRecords) {
          resolve(data);
        }
      });
    });
  }

  async fetchKafkaData(conn, config) {
    // Kafka data is handled by the Python process
    return new Promise((resolve) => {
      const data = [];
      // Implementation depends on Kafka connector
      resolve(data);
    });
  }

  // Processing modes
  async executeBatchProcessing(data, config) {
    const batchProcessor = this.dataConnector.processors.batch;
    const batches = await batchProcessor.process(data, config);

    const results = [];
    for (const batch of batches) {
      const result = await this.executePipeline(batch, config);
      results.push(result);
    }

    return this.mergeBatchResults(results);
  }

  async executeRealtimeProcessing(stream, config) {
    const realtimeProcessor = this.dataConnector.processors.realtime;

    return new Promise((resolve) => {
      const results = [];

      stream.on('processed', async (batch) => {
        const result = await this.executePipeline(batch, config);
        results.push(result);

        // Emit real-time results
        stream.emit('insights', result);
      });

      stream.on('end', () => {
        resolve(this.mergeBatchResults(results));
      });
    });
  }

  async executeHybridProcessing(data, config) {
    // Combine batch and real-time processing
    const batchResults = await this.executeBatchProcessing(data, config);
    const realtimeResults = await this.executeRealtimeProcessing(data.stream, config);

    return {
      batch: batchResults,
      realtime: realtimeResults,
      combined: this.mergeBatchResults([batchResults, realtimeResults]),
    };
  }

  // Insight generation methods
  generateMLInsights(mlResults, anomalyResults) {
    const insights = [];

    // ML model insights
    if (mlResults.models) {
      Object.entries(mlResults.models).forEach(([modelName, metrics]) => {
        insights.push({
          type: 'ml_model',
          model: modelName,
          accuracy: metrics.accuracy,
          precision: metrics.precision,
          recall: metrics.recall,
          insight: `${modelName} achieved ${(metrics.accuracy * 100).toFixed(1)}% accuracy`,
        });
      });
    }

    // Anomaly insights
    if (anomalyResults.anomalies) {
      const anomalyCount = anomalyResults.anomalies.length;
      const severityDistribution = this.calculateSeverityDistribution(anomalyResults.anomalies);

      insights.push({
        type: 'anomaly_detection',
        anomalyCount,
        severityDistribution,
        insight: `Detected ${anomalyCount} anomalies with ${severityDistribution.high + severityDistribution.critical} high-severity cases`,
      });
    }

    return insights;
  }

  combineInsights(mlResults, anomalyResults, pythonResults) {
    const combined = [];

    // Combine all insights
    if (mlResults.insights) combined.push(...mlResults.insights);
    if (anomalyResults.insights) combined.push(...anomalyResults.insights);
    if (pythonResults.insights) combined.push(...pythonResults.insights);

    // Remove duplicates and sort by importance
    const uniqueInsights = this.removeDuplicateInsights(combined);
    return uniqueInsights.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }

  async generateComprehensiveInsights(data) {
    const insights = [];

    // Data quality insights
    if (data.data) {
      const qualityInsights = this.generateDataQualityInsights(data.data);
      insights.push(...qualityInsights);
    }

    // Business insights
    if (data.mlResults) {
      const businessInsights = this.generateBusinessInsights(data.mlResults);
      insights.push(...businessInsights);
    }

    // Risk insights
    if (data.anomalyResults) {
      const riskInsights = this.generateRiskInsights(data.anomalyResults);
      insights.push(...riskInsights);
    }

    return insights;
  }

  async generateRecommendations(insights) {
    const recommendations = [];

    insights.forEach((insight) => {
      switch (insight.type) {
        case 'data_quality':
          recommendations.push({
            type: 'data_improvement',
            priority: 'medium',
            action: 'Improve data quality by addressing missing values and inconsistencies',
            impact: 'High',
          });
          break;
        case 'anomaly_detection':
          if (insight.severityDistribution?.critical > 0) {
            recommendations.push({
              type: 'immediate_action',
              priority: 'high',
              action: 'Investigate critical anomalies immediately',
              impact: 'Critical',
            });
          }
          break;
        case 'ml_model':
          if (insight.accuracy < 0.9) {
            recommendations.push({
              type: 'model_improvement',
              priority: 'medium',
              action: 'Consider retraining model with more data or feature engineering',
              impact: 'Medium',
            });
          }
          break;
      }
    });

    return recommendations;
  }

  async generateSummary(insights, recommendations) {
    return {
      totalInsights: insights.length,
      totalRecommendations: recommendations.length,
      keyFindings: insights.slice(0, 5),
      priorityActions: recommendations.filter((r) => r.priority === 'high'),
      riskLevel: this.calculateOverallRiskLevel(insights),
      confidence: this.calculateOverallConfidence(insights),
    };
  }

  // Utility methods
  generatePipelineId() {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async executeStageFallback(stageName, input, context) {
    console.log(`🔄 Executing fallback for stage: ${stageName}`);

    switch (stageName) {
      case 'ingestion':
        return this.executeIngestionFallback(input, context);
      case 'validation':
        return this.executeValidationFallback(input, context);
      case 'processing':
        return this.executeProcessingFallback(input, context);
      case 'mlAnalysis':
        return this.executeMLAnalysisFallback(input, context);
      case 'pythonIntegration':
        return this.executePythonIntegrationFallback(input, context);
      case 'insightGeneration':
        return this.executeInsightGenerationFallback(input, context);
      default:
        return input;
    }
  }

  executeIngestionFallback(input, context) {
    // Return empty data structure
    return [];
  }

  executeValidationFallback(input, context) {
    // Return input as-is with basic validation
    return {
      data: input,
      validation: { isValid: true, errors: [] },
      quality: { completeness: 0.5, consistency: 0.5, accuracy: 0.5 },
      recordCount: input.length,
      columns: input.length > 0 ? Object.keys(input[0]) : [],
    };
  }

  executeProcessingFallback(input, context) {
    // Return input as-is
    return {
      originalData: input,
      processedData: input,
      samplingInfo: { originalSize: input.length, sampleSize: input.length },
      schema: {},
    };
  }

  executeMLAnalysisFallback(input, context) {
    // Return basic ML results
    return {
      ...input,
      mlResults: { models: {}, insights: [] },
      anomalyResults: { anomalies: [], insights: [] },
      insights: [],
    };
  }

  executePythonIntegrationFallback(input, context) {
    // Return input as-is
    return {
      ...input,
      pythonResults: { insights: [] },
      combinedInsights: input.insights || [],
    };
  }

  executeInsightGenerationFallback(input, context) {
    // Return basic insights
    return {
      success: true,
      insights: [],
      recommendations: [],
      summary: {
        totalInsights: 0,
        totalRecommendations: 0,
        keyFindings: [],
        priorityActions: [],
        riskLevel: 'unknown',
        confidence: 0.5,
      },
      metadata: {
        recordCount: 0,
        anomalyCount: 0,
        insightCount: 0,
        recommendationCount: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  calculateSeverityDistribution(anomalies) {
    const distribution = {
      low: 0, medium: 0, high: 0, critical: 0,
    };
    anomalies.forEach((anomaly) => {
      const severity = anomaly.severity || 'medium';
      distribution[severity]++;
    });
    return distribution;
  }

  removeDuplicateInsights(insights) {
    const seen = new Set();
    return insights.filter((insight) => {
      const key = `${insight.type}_${insight.insight}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  generateDataQualityInsights(data) {
    const insights = [];
    const columns = Object.keys(data[0] || {});

    columns.forEach((column) => {
      const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
      const completeness = values.length / data.length;

      if (completeness < 0.8) {
        insights.push({
          type: 'data_quality',
          column,
          completeness,
          insight: `Column ${column} has ${(completeness * 100).toFixed(1)}% completeness`,
        });
      }
    });

    return insights;
  }

  generateBusinessInsights(mlResults) {
    const insights = [];

    if (mlResults.fraudRate !== undefined) {
      insights.push({
        type: 'business',
        metric: 'fraud_rate',
        value: mlResults.fraudRate,
        insight: `Fraud rate is ${(mlResults.fraudRate * 100).toFixed(2)}%`,
      });
    }

    return insights;
  }

  generateRiskInsights(anomalyResults) {
    const insights = [];

    if (anomalyResults.anomalies) {
      const criticalAnomalies = anomalyResults.anomalies.filter((a) => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        insights.push({
          type: 'risk',
          severity: 'critical',
          count: criticalAnomalies.length,
          insight: `${criticalAnomalies.length} critical anomalies detected`,
        });
      }
    }

    return insights;
  }

  calculateOverallRiskLevel(insights) {
    const riskInsights = insights.filter((i) => i.type === 'risk');
    if (riskInsights.some((i) => i.severity === 'critical')) return 'critical';
    if (riskInsights.some((i) => i.severity === 'high')) return 'high';
    if (riskInsights.some((i) => i.severity === 'medium')) return 'medium';
    return 'low';
  }

  calculateOverallConfidence(insights) {
    const mlInsights = insights.filter((i) => i.type === 'ml_model');
    if (mlInsights.length === 0) return 0.5;

    const avgAccuracy = mlInsights.reduce((sum, i) => sum + i.accuracy, 0) / mlInsights.length;
    return avgAccuracy;
  }

  mergeBatchResults(results) {
    return {
      success: results.every((r) => r.success),
      results: results.map((r) => r.result).flat(),
      metadata: {
        batchCount: results.length,
        totalRecords: results.reduce((sum, r) => sum + (r.metadata?.recordCount || 0), 0),
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = EnhancedMLPipeline;

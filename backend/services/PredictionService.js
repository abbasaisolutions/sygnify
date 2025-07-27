const { mean, std, linearRegression } = require('simple-statistics');

/**
 * Enhanced Prediction Service with Variance and Confidence Intervals
 * Provides comprehensive forecasting with model transparency
 */
class PredictionService {
  constructor(domain = 'finance') {
    this.domain = domain;
    this.domainConfig = this.loadDomainConfig();
    this.models = {
      linear: this.linearRegressionModel,
      movingAverage: this.movingAverageModel,
      exponential: this.exponentialSmoothingModel,
    };
  }

  loadDomainConfig() {
    const configs = {
      finance: {
        forecastHorizon: 12, // months
        confidenceLevels: {
          low: 0.6,
          medium: 0.8,
          high: 0.95,
        },
        varianceThresholds: {
          low: 0.1,
          medium: 0.25,
          high: 0.5,
        },
        keyMetrics: ['revenue', 'cashFlow', 'fraud', 'transactions'],
      },
      healthcare: {
        forecastHorizon: 6,
        confidenceLevels: { low: 0.6, medium: 0.8, high: 0.95 },
        keyMetrics: ['treatment_cost', 'patient_satisfaction', 'recovery_time'],
      },
      retail: {
        forecastHorizon: 12,
        confidenceLevels: { low: 0.6, medium: 0.8, high: 0.95 },
        keyMetrics: ['sales_amount', 'inventory_turnover', 'customer_satisfaction'],
      },
    };
    return configs[domain] || configs.finance;
  }

  /**
     * Generate comprehensive forecasts with variance and confidence
     * @param {Array} data - Historical data
     * @param {Object} labels - Smart labels
     * @param {Object} metrics - Computed metrics
     * @returns {Object} - Forecasts with confidence intervals and model info
     */
  async generateForecasts(data, labels, metrics) {
    if (!data || data.length === 0) {
      throw new Error('No data provided for forecasting');
    }

    console.log(`🔮 Generating forecasts for ${data.length} records...`);

    const forecasts = {};

    // Generate revenue forecast
    const revenueData = this.extractTimeSeriesData(data, 'amount', labels);
    if (revenueData.length > 0) {
      forecasts.revenue = await this.forecastMetric(revenueData, 'revenue', 'amount');
    }

    // Generate cash flow forecast
    const cashFlowData = this.extractTimeSeriesData(data, 'balance', labels);
    if (cashFlowData.length > 0) {
      forecasts.cashFlow = await this.forecastMetric(cashFlowData, 'cashFlow', 'balance');
    }

    // Generate fraud trend forecast
    const fraudData = this.extractTimeSeriesData(data, 'fraud_score', labels);
    if (fraudData.length > 0) {
      forecasts.fraud = await this.forecastMetric(fraudData, 'fraud', 'fraud_score');
    }

    // Generate transaction volume forecast
    const transactionData = this.extractTimeSeriesData(data, 'transaction_count', labels);
    if (transactionData.length > 0) {
      forecasts.transactions = await this.forecastMetric(transactionData, 'transactions', 'transaction_count');
    }

    // Add overall forecast summary
    forecasts.summary = this.generateForecastSummary(forecasts, metrics);

    return forecasts;
  }

  /**
     * Forecast a specific metric with comprehensive analysis
     */
  async forecastMetric(timeSeriesData, metricName, columnName) {
    if (timeSeriesData.length < 3) {
      return this.generateSimpleForecast(timeSeriesData, metricName);
    }

    // Try multiple models and select the best one
    const models = await this.evaluateModels(timeSeriesData, metricName);
    const bestModel = this.selectBestModel(models);

    // Generate forecast with the best model
    const forecast = await this.generateModelForecast(timeSeriesData, bestModel, metricName);

    // Add variance and confidence intervals
    const enhancedForecast = this.addVarianceAndConfidence(forecast, timeSeriesData, bestModel);

    return enhancedForecast;
  }

  /**
     * Evaluate multiple forecasting models
     */
  async evaluateModels(timeSeriesData, metricName) {
    const models = {};

    // Linear regression model
    try {
      models.linear = await this.linearRegressionModel(timeSeriesData, metricName);
    } catch (error) {
      console.warn(`Linear regression failed for ${metricName}:`, error.message);
    }

    // Moving average model
    try {
      models.movingAverage = await this.movingAverageModel(timeSeriesData, metricName);
    } catch (error) {
      console.warn(`Moving average failed for ${metricName}:`, error.message);
    }

    // Exponential smoothing model
    try {
      models.exponential = await this.exponentialSmoothingModel(timeSeriesData, metricName);
    } catch (error) {
      console.warn(`Exponential smoothing failed for ${metricName}:`, error.message);
    }

    return models;
  }

  /**
     * Select the best model based on accuracy metrics
     */
  selectBestModel(models) {
    let bestModel = null;
    let bestScore = -Infinity;

    for (const [name, model] of Object.entries(models)) {
      if (model.accuracy > bestScore) {
        bestScore = model.accuracy;
        bestModel = { name, ...model };
      }
    }

    return bestModel || { name: 'simple', accuracy: 0.5 };
  }

  /**
     * Linear regression forecasting model
     */
  async linearRegressionModel(timeSeriesData, metricName) {
    const x = timeSeriesData.map((_, index) => index);
    const y = timeSeriesData.map((point) => point.value);

    const regression = linearRegression(x.map((xi) => [xi]), y);

    // Calculate accuracy (R-squared)
    const predicted = x.map((xi) => regression.m * xi + regression.b);
    const accuracy = this.calculateRSquared(y, predicted);

    // Generate next month prediction
    const nextMonth = timeSeriesData.length;
    const nextValue = regression.m * nextMonth + regression.b;

    return {
      type: 'linear_regression',
      accuracy,
      parameters: { slope: regression.m, intercept: regression.b },
      nextMonth: {
        value: nextValue,
        trend: regression.m > 0 ? 'increasing' : 'decreasing',
        strength: Math.abs(regression.m),
      },
      variance: this.calculateVariance(y, predicted),
    };
  }

  /**
     * Moving average forecasting model
     */
  async movingAverageModel(timeSeriesData, metricName) {
    const windowSize = Math.min(3, Math.floor(timeSeriesData.length / 2));
    const values = timeSeriesData.map((point) => point.value);

    // Calculate moving average
    const movingAverages = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      movingAverages.push(mean(window));
    }

    // Calculate accuracy
    const actual = values.slice(windowSize - 1);
    const accuracy = this.calculateAccuracy(actual, movingAverages);

    // Predict next value
    const lastWindow = values.slice(-windowSize);
    const nextValue = mean(lastWindow);

    return {
      type: 'moving_average',
      accuracy,
      parameters: { windowSize },
      nextMonth: {
        value: nextValue,
        trend: this.calculateTrend(values),
        strength: 0.5,
      },
      variance: this.calculateVariance(actual, movingAverages),
    };
  }

  /**
     * Exponential smoothing forecasting model
     */
  async exponentialSmoothingModel(timeSeriesData, metricName) {
    const alpha = 0.3; // Smoothing factor
    const values = timeSeriesData.map((point) => point.value);

    // Calculate exponential smoothing
    const smoothed = [values[0]];
    for (let i = 1; i < values.length; i++) {
      const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(values, smoothed);

    // Predict next value
    const nextValue = alpha * values[values.length - 1] + (1 - alpha) * smoothed[smoothed.length - 1];

    return {
      type: 'exponential_smoothing',
      accuracy,
      parameters: { alpha },
      nextMonth: {
        value: nextValue,
        trend: this.calculateTrend(values),
        strength: 0.6,
      },
      variance: this.calculateVariance(values, smoothed),
    };
  }

  /**
     * Generate forecast with model information
     */
  async generateModelForecast(timeSeriesData, model, metricName) {
    const forecast = {
      metric: metricName,
      model: model.type,
      accuracy: model.accuracy,
      parameters: model.parameters,
      nextMonth: model.nextMonth,
      variance: model.variance,
      confidence: this.calculateConfidence(model.accuracy, model.variance),
      riskLevel: this.calculateRiskLevel(model.variance),
      range: this.calculateForecastRange(model.nextMonth.value, model.variance),
    };

    return forecast;
  }

  /**
     * Add variance and confidence intervals to forecast
     */
  addVarianceAndConfidence(forecast, timeSeriesData, model) {
    const values = timeSeriesData.map((point) => point.value);
    const stdDev = std(values);

    // Calculate confidence intervals
    const confidenceIntervals = {
      low: this.calculateConfidenceInterval(forecast.nextMonth.value, stdDev, 0.6),
      medium: this.calculateConfidenceInterval(forecast.nextMonth.value, stdDev, 0.8),
      high: this.calculateConfidenceInterval(forecast.nextMonth.value, stdDev, 0.95),
    };

    return {
      ...forecast,
      confidenceIntervals,
      modelUsed: model.name,
      dataPoints: timeSeriesData.length,
      lastValue: values[values.length - 1],
      trendStrength: this.calculateTrendStrength(values),
      seasonality: this.detectSeasonality(values),
    };
  }

  /**
     * Generate simple forecast for insufficient data
     */
  generateSimpleForecast(timeSeriesData, metricName) {
    const values = timeSeriesData.map((point) => point.value);
    const avg = mean(values);
    const trend = this.calculateTrend(values);

    return {
      metric: metricName,
      model: 'simple_average',
      accuracy: 0.5,
      nextMonth: {
        value: avg,
        trend,
        strength: 0.3,
      },
      variance: this.calculateVariance(values, [avg]),
      confidence: 'low',
      riskLevel: 'medium',
      range: { min: avg * 0.8, max: avg * 1.2 },
      warning: 'Limited data for accurate forecasting',
    };
  }

  /**
     * Generate overall forecast summary
     */
  generateForecastSummary(forecasts, metrics) {
    const summary = {
      overallTrend: 'stable',
      confidence: 'medium',
      riskLevel: 'low',
      keyDrivers: [],
      recommendations: [],
    };

    // Analyze overall trends
    const trends = Object.values(forecasts)
      .filter((f) => f.nextMonth && f.nextMonth.trend)
      .map((f) => f.nextMonth.trend);

    const increasing = trends.filter((t) => t === 'increasing').length;
    const decreasing = trends.filter((t) => t === 'decreasing').length;

    if (increasing > decreasing) summary.overallTrend = 'positive';
    else if (decreasing > increasing) summary.overallTrend = 'negative';

    // Calculate overall confidence
    const confidences = Object.values(forecasts)
      .filter((f) => f.confidence)
      .map((f) => f.confidence);

    if (confidences.length > 0) {
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      summary.confidence = avgConfidence > 0.8 ? 'high' : avgConfidence > 0.6 ? 'medium' : 'low';
    }

    // Identify key drivers
    Object.entries(forecasts).forEach(([metric, forecast]) => {
      if (forecast.nextMonth && forecast.nextMonth.strength > 0.7) {
        summary.keyDrivers.push({
          metric,
          impact: forecast.nextMonth.trend,
          strength: forecast.nextMonth.strength,
        });
      }
    });

    return summary;
  }

  // Helper methods
  extractTimeSeriesData(data, columnName, labels) {
    const timeSeries = [];

    // Try to find date column
    const dateColumn = Object.keys(labels).find((col) => labels[col].semantic === 'Transaction Date'
            || col.toLowerCase().includes('date'));

    if (dateColumn) {
      // Sort by date and extract values
      const sortedData = data
        .filter((row) => row[columnName] != null && row[dateColumn] != null)
        .sort((a, b) => new Date(a[dateColumn]) - new Date(b[dateColumn]));

      sortedData.forEach((row, index) => {
        timeSeries.push({
          index,
          date: row[dateColumn],
          value: parseFloat(row[columnName]) || 0,
        });
      });
    } else {
      // Use index as time series
      data.forEach((row, index) => {
        if (row[columnName] != null) {
          timeSeries.push({
            index,
            value: parseFloat(row[columnName]) || 0,
          });
        }
      });
    }

    return timeSeries;
  }

  calculateRSquared(actual, predicted) {
    const meanActual = mean(actual);
    const ssRes = actual.reduce((sum, val, i) => sum + (val - predicted[i]) ** 2, 0);
    const ssTot = actual.reduce((sum, val) => sum + (val - meanActual) ** 2, 0);
    return 1 - (ssRes / ssTot);
  }

  calculateAccuracy(actual, predicted) {
    const mape = actual.reduce((sum, val, i) => sum + Math.abs((val - predicted[i]) / val), 0) / actual.length;
    return Math.max(0, 1 - mape);
  }

  calculateVariance(actual, predicted) {
    const squaredErrors = actual.map((val, i) => (val - predicted[i]) ** 2);
    return mean(squaredErrors);
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = mean(firstHalf);
    const secondAvg = mean(secondHalf);

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  calculateConfidence(accuracy, variance) {
    const baseConfidence = accuracy;
    const variancePenalty = Math.min(0.3, variance / 1000);
    return Math.max(0.1, Math.min(1, baseConfidence - variancePenalty));
  }

  calculateRiskLevel(variance) {
    const threshold = this.domainConfig.varianceThresholds;
    if (variance > threshold.high) return 'high';
    if (variance > threshold.medium) return 'medium';
    return 'low';
  }

  calculateForecastRange(value, variance) {
    const stdDev = Math.sqrt(variance);
    return {
      min: Math.max(0, value - 2 * stdDev),
      max: value + 2 * stdDev,
    };
  }

  calculateConfidenceInterval(value, stdDev, confidence) {
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.8 ? 1.28 : 0.84;
    const margin = zScore * stdDev;
    return {
      min: Math.max(0, value - margin),
      max: value + margin,
    };
  }

  calculateTrendStrength(values) {
    if (values.length < 2) return 0;

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      changes.push((values[i] - values[i - 1]) / values[i - 1]);
    }

    return Math.abs(mean(changes));
  }

  detectSeasonality(values) {
    // Simple seasonality detection
    if (values.length < 8) return 'insufficient_data';

    // Check for repeating patterns
    const correlations = [];
    for (let lag = 1; lag <= Math.min(6, values.length / 2); lag++) {
      const correlation = this.calculateCorrelation(values, values.slice(lag));
      correlations.push({ lag, correlation });
    }

    const maxCorrelation = Math.max(...correlations.map((c) => c.correlation));
    if (maxCorrelation > 0.7) {
      const bestLag = correlations.find((c) => c.correlation === maxCorrelation).lag;
      return `seasonal_${bestLag}`;
    }

    return 'no_seasonality';
  }

  calculateCorrelation(x, y) {
    const minLength = Math.min(x.length, y.length);
    const xSlice = x.slice(0, minLength);
    const ySlice = y.slice(0, minLength);

    const xMean = mean(xSlice);
    const yMean = mean(ySlice);

    const numerator = xSlice.reduce((sum, xi, i) => sum + (xi - xMean) * (ySlice[i] - yMean), 0);

    const xDenom = Math.sqrt(xSlice.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0));
    const yDenom = Math.sqrt(ySlice.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0));

    return numerator / (xDenom * yDenom);
  }
}

module.exports = PredictionService;

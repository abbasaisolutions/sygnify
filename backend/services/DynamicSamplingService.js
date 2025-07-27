const { mean, std, variance } = require('simple-statistics');

/**
 * Dynamic Sampling Service
 * Adjusts sampling rates based on data complexity, variance, and patterns
 */
class DynamicSamplingService {
  constructor() {
    this.complexityAnalyzer = this.initializeComplexityAnalyzer();
    this.varianceAnalyzer = this.initializeVarianceAnalyzer();
    this.patternAnalyzer = this.initializePatternAnalyzer();
  }

  initializeComplexityAnalyzer() {
    return {
      analyzeDataComplexity: (data) => {
        if (!data || data.length === 0) {
          return { complexity: 'low', score: 0 };
        }

        const complexity = {
          // Column complexity
          columnCount: Object.keys(data[0] || {}).length,

          // Data type complexity
          numericColumns: 0,
          categoricalColumns: 0,
          dateColumns: 0,

          // Value complexity
          uniqueValueRatios: {},
          missingValueRatios: {},

          // Relationship complexity
          correlationComplexity: 0,

          // Overall complexity score
          score: 0,
        };

        // Analyze each column
        Object.keys(data[0] || {}).forEach((column) => {
          const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
          const uniqueValues = new Set(values);

          complexity.uniqueValueRatios[column] = uniqueValues.size / values.length;
          complexity.missingValueRatios[column] = (data.length - values.length) / data.length;

          // Determine column type
          if (this.isNumericColumn(values)) {
            complexity.numericColumns++;
          } else if (this.isDateColumn(values)) {
            complexity.dateColumns++;
          } else {
            complexity.categoricalColumns++;
          }
        });

        // Calculate correlation complexity
        complexity.correlationComplexity = this.calculateCorrelationComplexity(data);

        // Calculate overall complexity score
        complexity.score = this.calculateComplexityScore(complexity);

        // Classify complexity level
        if (complexity.score > 0.7) {
          complexity.complexity = 'high';
        } else if (complexity.score > 0.4) {
          complexity.complexity = 'medium';
        } else {
          complexity.complexity = 'low';
        }

        return complexity;
      },

      calculateCorrelationComplexity: (data) => {
        const numericColumns = Object.keys(data[0] || {}).filter((column) => {
          const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
          return this.isNumericColumn(values);
        });

        if (numericColumns.length < 2) return 0;

        let correlationCount = 0;
        for (let i = 0; i < numericColumns.length; i++) {
          for (let j = i + 1; j < numericColumns.length; j++) {
            const values1 = data.map((row) => parseFloat(row[numericColumns[i]])).filter((v) => !isNaN(v));
            const values2 = data.map((row) => parseFloat(row[numericColumns[j]])).filter((v) => !isNaN(v));

            if (values1.length > 10 && values2.length > 10) {
              const correlation = this.calculateCorrelation(values1, values2);
              if (Math.abs(correlation) > 0.3) {
                correlationCount++;
              }
            }
          }
        }

        return correlationCount / (numericColumns.length * (numericColumns.length - 1) / 2);
      },

      calculateComplexityScore: (complexity) => {
        let score = 0;

        // Column count factor (0-0.2)
        score += Math.min(0.2, complexity.columnCount / 20);

        // Data type diversity factor (0-0.2)
        const typeDiversity = (complexity.numericColumns + complexity.categoricalColumns + complexity.dateColumns) / complexity.columnCount;
        score += typeDiversity * 0.2;

        // Unique value complexity factor (0-0.2)
        const avgUniqueRatio = Object.values(complexity.uniqueValueRatios).reduce((sum, ratio) => sum + ratio, 0) / Object.keys(complexity.uniqueValueRatios).length;
        score += avgUniqueRatio * 0.2;

        // Missing value complexity factor (0-0.1)
        const avgMissingRatio = Object.values(complexity.missingValueRatios).reduce((sum, ratio) => sum + ratio, 0) / Object.keys(complexity.missingValueRatios).length;
        score += avgMissingRatio * 0.1;

        // Correlation complexity factor (0-0.3)
        score += complexity.correlationComplexity * 0.3;

        return Math.min(1, score);
      },
    };
  }

  initializeVarianceAnalyzer() {
    return {
      analyzeVariance: (data) => {
        const variance = {
          numericVariances: {},
          categoricalVariances: {},
          overallVariance: 0,
        };

        // Analyze numeric column variances
        Object.keys(data[0] || {}).forEach((column) => {
          const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);

          if (this.isNumericColumn(values)) {
            const numericValues = values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
            if (numericValues.length > 1) {
              const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
              const varianceValue = numericValues.reduce((sum, val) => sum + (val - mean) ** 2, 0) / numericValues.length;
              const coefficientOfVariation = Math.sqrt(varianceValue) / Math.abs(mean);

              variance.numericVariances[column] = {
                variance: varianceValue,
                coefficientOfVariation,
                isHighVariance: coefficientOfVariation > 1.0,
              };
            }
          } else {
            // Categorical variance (entropy)
            const valueCounts = {};
            values.forEach((value) => {
              valueCounts[value] = (valueCounts[value] || 0) + 1;
            });

            const entropy = this.calculateEntropy(valueCounts, values.length);
            variance.categoricalVariances[column] = {
              entropy,
              maxEntropy: Math.log(Object.keys(valueCounts).length),
              normalizedEntropy: entropy / Math.log(Object.keys(valueCounts).length),
              isHighVariance: entropy > Math.log(Object.keys(valueCounts).length) * 0.7,
            };
          }
        });

        // Calculate overall variance score
        const numericVarianceScores = Object.values(variance.numericVariances).map((v) => v.coefficientOfVariation);
        const categoricalVarianceScores = Object.values(variance.categoricalVariances).map((v) => v.normalizedEntropy);

        const allVarianceScores = [...numericVarianceScores, ...categoricalVarianceScores];
        variance.overallVariance = allVarianceScores.length > 0
          ? allVarianceScores.reduce((sum, score) => sum + score, 0) / allVarianceScores.length : 0;

        return variance;
      },

      calculateEntropy: (valueCounts, totalCount) => {
        let entropy = 0;
        Object.values(valueCounts).forEach((count) => {
          const probability = count / totalCount;
          entropy -= probability * Math.log2(probability);
        });
        return entropy;
      },
    };
  }

  initializePatternAnalyzer() {
    return {
      analyzePatterns: (data) => {
        const patterns = {
          temporalPatterns: this.analyzeTemporalPatterns(data),
          spatialPatterns: this.analyzeSpatialPatterns(data),
          behavioralPatterns: this.analyzeBehavioralPatterns(data),
          patternComplexity: 0,
        };

        // Calculate pattern complexity score
        patterns.patternComplexity = this.calculatePatternComplexity(patterns);

        return patterns;
      },

      analyzeTemporalPatterns: (data) => {
        const temporalPatterns = {
          hasDateColumn: false,
          seasonalPatterns: false,
          trendPatterns: false,
          volatilityPatterns: false,
        };

        // Check for date columns
        const dateColumns = Object.keys(data[0] || {}).filter((column) => {
          const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
          return this.isDateColumn(values);
        });

        if (dateColumns.length > 0) {
          temporalPatterns.hasDateColumn = true;

          // Analyze temporal patterns
          const dateColumn = dateColumns[0];
          const timeSeries = data.map((row) => ({
            time: new Date(row[dateColumn]),
            amount: parseFloat(row.amount || 0),
          })).sort((a, b) => a.time - b.time);

          if (timeSeries.length > 30) {
            // Check for seasonal patterns
            temporalPatterns.seasonalPatterns = this.detectSeasonality(timeSeries);

            // Check for trend patterns
            temporalPatterns.trendPatterns = this.detectTrend(timeSeries);

            // Check for volatility patterns
            temporalPatterns.volatilityPatterns = this.detectVolatility(timeSeries);
          }
        }

        return temporalPatterns;
      },

      analyzeSpatialPatterns: (data) => {
        const spatialPatterns = {
          hasLocationData: false,
          geographicClustering: false,
          locationDiversity: 0,
        };

        // Check for location columns
        const locationColumns = Object.keys(data[0] || {}).filter((column) => column.toLowerCase().includes('state')
                    || column.toLowerCase().includes('city')
                    || column.toLowerCase().includes('country'));

        if (locationColumns.length > 0) {
          spatialPatterns.hasLocationData = true;

          // Analyze location diversity
          const locations = new Set();
          data.forEach((row) => {
            locationColumns.forEach((col) => {
              if (row[col]) locations.add(row[col]);
            });
          });

          spatialPatterns.locationDiversity = locations.size / data.length;
          spatialPatterns.geographicClustering = locations.size < data.length * 0.1; // Low diversity indicates clustering
        }

        return spatialPatterns;
      },

      analyzeBehavioralPatterns: (data) => {
        const behavioralPatterns = {
          customerBehavior: false,
          merchantBehavior: false,
          transactionPatterns: false,
          fraudPatterns: false,
        };

        // Check for customer/merchant patterns
        if (data[0] && data[0].customer_id) {
          const customerCount = new Set(data.map((row) => row.customer_id)).size;
          behavioralPatterns.customerBehavior = customerCount < data.length * 0.5; // Multiple transactions per customer
        }

        if (data[0] && data[0].merchant_id) {
          const merchantCount = new Set(data.map((row) => row.merchant_id)).size;
          behavioralPatterns.merchantBehavior = merchantCount < data.length * 0.3; // Multiple transactions per merchant
        }

        // Check for transaction patterns
        if (data[0] && data[0].transaction_type) {
          const transactionTypes = new Set(data.map((row) => row.transaction_type));
          behavioralPatterns.transactionPatterns = transactionTypes.size > 1;
        }

        // Check for fraud patterns
        if (data[0] && data[0].is_fraud) {
          const fraudCount = data.filter((row) => row.is_fraud === '1').length;
          behavioralPatterns.fraudPatterns = fraudCount > 0;
        }

        return behavioralPatterns;
      },

      calculatePatternComplexity: (patterns) => {
        let score = 0;

        // Temporal pattern complexity (0-0.3)
        if (patterns.temporalPatterns.hasDateColumn) {
          score += 0.1;
          if (patterns.temporalPatterns.seasonalPatterns) score += 0.1;
          if (patterns.temporalPatterns.trendPatterns) score += 0.05;
          if (patterns.temporalPatterns.volatilityPatterns) score += 0.05;
        }

        // Spatial pattern complexity (0-0.2)
        if (patterns.spatialPatterns.hasLocationData) {
          score += 0.1;
          if (patterns.spatialPatterns.geographicClustering) score += 0.1;
        }

        // Behavioral pattern complexity (0-0.5)
        if (patterns.behavioralPatterns.customerBehavior) score += 0.15;
        if (patterns.behavioralPatterns.merchantBehavior) score += 0.15;
        if (patterns.behavioralPatterns.transactionPatterns) score += 0.1;
        if (patterns.behavioralPatterns.fraudPatterns) score += 0.1;

        return Math.min(1, score);
      },
    };
  }

  // Main sampling method
  calculateOptimalSamplingRate(data) {
    console.log('📊 Analyzing data for optimal sampling rate...');

    // Analyze data characteristics
    const complexity = this.complexityAnalyzer.analyzeDataComplexity(data);
    const variance = this.varianceAnalyzer.analyzeVariance(data);
    const patterns = this.patternAnalyzer.analyzePatterns(data);

    console.log(`  Data complexity: ${complexity.complexity} (score: ${complexity.score.toFixed(3)})`);
    console.log(`  Overall variance: ${variance.overallVariance.toFixed(3)}`);
    console.log(`  Pattern complexity: ${patterns.patternComplexity.toFixed(3)}`);

    // Calculate base sampling rate
    const baseRate = this.calculateBaseSamplingRate(data.length);

    // Adjust for complexity
    const complexityAdjustment = this.calculateComplexityAdjustment(complexity);

    // Adjust for variance
    const varianceAdjustment = this.calculateVarianceAdjustment(variance);

    // Adjust for patterns
    const patternAdjustment = this.calculatePatternAdjustment(patterns);

    // Calculate final sampling rate
    const finalRate = Math.max(0.1, Math.min(1.0, baseRate * complexityAdjustment * varianceAdjustment * patternAdjustment));

    const samplingInfo = {
      dataSize: data.length,
      baseRate,
      complexityAdjustment,
      varianceAdjustment,
      patternAdjustment,
      finalRate,
      sampleSize: Math.ceil(data.length * finalRate),
      reasoning: this.generateSamplingReasoning(complexity, variance, patterns, finalRate),
    };

    console.log(`  Final sampling rate: ${(finalRate * 100).toFixed(1)}% (${samplingInfo.sampleSize} records)`);
    console.log(`  Reasoning: ${samplingInfo.reasoning}`);

    return samplingInfo;
  }

  calculateBaseSamplingRate(dataSize) {
    if (dataSize <= 10000) return 1.0; // Full dataset
    if (dataSize <= 50000) return 0.5; // 50% sampling
    if (dataSize <= 100000) return 0.3; // 30% sampling
    if (dataSize <= 500000) return 0.2; // 20% sampling
    return 0.1; // 10% sampling for very large datasets
  }

  calculateComplexityAdjustment(complexity) {
    // Higher complexity requires more data
    if (complexity.complexity === 'high') return 1.5;
    if (complexity.complexity === 'medium') return 1.2;
    return 1.0; // Low complexity
  }

  calculateVarianceAdjustment(variance) {
    // Higher variance requires more data
    if (variance.overallVariance > 0.8) return 1.4;
    if (variance.overallVariance > 0.5) return 1.2;
    if (variance.overallVariance > 0.2) return 1.1;
    return 1.0; // Low variance
  }

  calculatePatternAdjustment(patterns) {
    // More complex patterns require more data
    if (patterns.patternComplexity > 0.7) return 1.3;
    if (patterns.patternComplexity > 0.4) return 1.15;
    if (patterns.patternComplexity > 0.2) return 1.05;
    return 1.0; // Simple patterns
  }

  generateSamplingReasoning(complexity, variance, patterns, finalRate) {
    const reasons = [];

    if (complexity.complexity === 'high') {
      reasons.push('high data complexity');
    }
    if (variance.overallVariance > 0.5) {
      reasons.push('high variance');
    }
    if (patterns.patternComplexity > 0.4) {
      reasons.push('complex patterns');
    }

    if (reasons.length === 0) {
      reasons.push('standard sampling');
    }

    return reasons.join(', ');
  }

  // Intelligent sampling methods
  intelligentSample(data, sampleSize) {
    if (data.length <= sampleSize) return data;

    console.log(`🎯 Performing intelligent sampling: ${sampleSize} from ${data.length} records`);

    // Stratified sampling by key dimensions
    const stratifiedSample = this.stratifiedSample(data, sampleSize);

    // Add random samples for diversity
    const randomSample = this.randomSample(data, Math.ceil(sampleSize * 0.1));

    // Combine samples
    const combinedSample = [...stratifiedSample, ...randomSample];

    // Remove duplicates and limit to sample size
    const uniqueSample = this.removeDuplicates(combinedSample);
    const finalSample = uniqueSample.slice(0, sampleSize);

    console.log(`✅ Intelligent sampling completed: ${finalSample.length} records`);

    return finalSample;
  }

  stratifiedSample(data, sampleSize) {
    const sample = [];

    // Stratify by merchant category
    const categoryGroups = this.groupBy(data, 'merchant_category');
    const categorySampleSize = Math.ceil(sampleSize * 0.4); // 40% for category stratification

    Object.entries(categoryGroups).forEach(([category, transactions]) => {
      const categorySampleCount = Math.ceil(categorySampleSize * transactions.length / data.length);
      const categorySample = this.sampleFromGroup(transactions, categorySampleCount);
      sample.push(...categorySample);
    });

    // Stratify by transaction type
    const typeGroups = this.groupBy(data, 'transaction_type');
    const typeSampleSize = Math.ceil(sampleSize * 0.3); // 30% for type stratification

    Object.entries(typeGroups).forEach(([type, transactions]) => {
      const typeSampleCount = Math.ceil(typeSampleSize * transactions.length / data.length);
      const typeSample = this.sampleFromGroup(transactions, typeSampleCount);
      sample.push(...typeSample);
    });

    // Stratify by fraud status
    const fraudGroups = this.groupBy(data, 'is_fraud');
    const fraudSampleSize = Math.ceil(sampleSize * 0.3); // 30% for fraud stratification

    Object.entries(fraudGroups).forEach(([fraud, transactions]) => {
      const fraudSampleCount = Math.ceil(fraudSampleSize * transactions.length / data.length);
      const fraudSample = this.sampleFromGroup(transactions, fraudSampleCount);
      sample.push(...fraudSample);
    });

    return sample;
  }

  randomSample(data, sampleSize) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  sampleFromGroup(group, sampleSize) {
    if (group.length <= sampleSize) return group;

    const shuffled = [...group].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  removeDuplicates(data) {
    const seen = new Set();
    return data.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  groupBy(data, key, transform = (val) => val) {
    return data.reduce((groups, item) => {
      const group = transform(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  // Helper methods
  isNumericColumn(values) {
    const numericCount = values.filter((v) => !isNaN(parseFloat(v)) && isFinite(v)).length;
    return numericCount / values.length > 0.8;
  }

  isDateColumn(values) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/,
      /^\d{2}\/\d{2}\/\d{4}/,
      /^\d{2}-\d{2}-\d{4}/,
      /^\d{4}\/\d{2}\/\d{2}/,
    ];

    const dateCount = values.filter((v) => datePatterns.some((pattern) => pattern.test(String(v)))).length;

    return dateCount / values.length > 0.7;
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  detectSeasonality(timeSeries) {
    // Simplified seasonality detection
    if (timeSeries.length < 12) return false;

    const monthlyTotals = new Array(12).fill(0);
    timeSeries.forEach((ts) => {
      const month = ts.time.getMonth();
      monthlyTotals[month] += ts.amount;
    });

    const mean = monthlyTotals.reduce((sum, val) => sum + val, 0) / 12;
    const variance = monthlyTotals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / 12;
    const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);

    return coefficientOfVariation > 0.3; // Significant seasonal variation
  }

  detectTrend(timeSeries) {
    if (timeSeries.length < 10) return false;

    const x = Array.from({ length: timeSeries.length }, (_, i) => i);
    const y = timeSeries.map((ts) => ts.amount);

    const correlation = this.calculateCorrelation(x, y);
    return Math.abs(correlation) > 0.3; // Significant trend
  }

  detectVolatility(timeSeries) {
    if (timeSeries.length < 10) return false;

    const amounts = timeSeries.map((ts) => ts.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + (val - mean) ** 2, 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);

    return coefficientOfVariation > 1.0; // High volatility
  }
}

module.exports = DynamicSamplingService;

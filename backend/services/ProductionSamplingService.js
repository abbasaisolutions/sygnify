const { mean, std } = require('simple-statistics');

/**
 * Production-Ready Sampling Service
 * Implements intelligent sampling strategies avoiding small samples for ML analysis
 */
class ProductionSamplingService {
  constructor() {
    this.samplingStrategies = this.initializeSamplingStrategies();
    this.qualityAssurance = this.initializeQualityAssurance();
  }

  initializeSamplingStrategies() {
    return {
      // Full dataset sampling for small datasets
      fullDataset: {
        shouldUse: (dataSize) => dataSize <= 10000,
        sample: (data) => data,
        description: 'Full dataset analysis',
      },

      // Stratified sampling for medium datasets
      stratified: {
        shouldUse: (dataSize) => dataSize > 10000 && dataSize <= 100000,
        sample: (data, targetSize = 20000) => this.stratifiedSample(data, targetSize),
        description: 'Stratified sampling preserving distribution',
      },

      // Intelligent sampling for large datasets
      intelligent: {
        shouldUse: (dataSize) => dataSize > 100000,
        sample: (data, targetSize = 50000) => this.intelligentSample(data, targetSize),
        description: 'Intelligent sampling with feature preservation',
      },

      // Adaptive sampling based on data characteristics
      adaptive: {
        shouldUse: (dataSize, complexity) => true, // Always available
        sample: (data, targetSize, complexity) => this.adaptiveSample(data, targetSize, complexity),
        description: 'Adaptive sampling based on data complexity',
      },
    };
  }

  initializeQualityAssurance() {
    return {
      validateSample: (originalData, sampledData) => {
        const validation = {
          originalSize: originalData.length,
          sampleSize: sampledData.length,
          samplingRatio: sampledData.length / originalData.length,
          distributionPreserved: true,
          qualityScore: 0,
          warnings: [],
        };

        // Check if sample is too small
        if (sampledData.length < 1000) {
          validation.warnings.push('Sample size is very small (< 1000 records)');
          validation.qualityScore -= 0.3;
        }

        // Check distribution preservation for key columns
        const keyColumns = ['amount', 'fraud_score', 'merchant_category'];
        keyColumns.forEach((column) => {
          if (originalData[0] && originalData[0][column] !== undefined) {
            const originalDist = this.calculateDistribution(originalData, column);
            const sampleDist = this.calculateDistribution(sampledData, column);
            const distributionDiff = this.calculateDistributionDifference(originalDist, sampleDist);

            if (distributionDiff > 0.2) {
              validation.warnings.push(`Distribution significantly changed for ${column}`);
              validation.distributionPreserved = false;
              validation.qualityScore -= 0.2;
            }
          }
        });

        // Calculate overall quality score
        validation.qualityScore = Math.max(0, 1 + validation.qualityScore);

        return validation;
      },

      calculateDistribution: (data, column) => {
        const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
        const uniqueValues = new Set(values);
        const distribution = {};

        uniqueValues.forEach((value) => {
          distribution[value] = values.filter((v) => v === value).length / values.length;
        });

        return distribution;
      },

      calculateDistributionDifference: (dist1, dist2) => {
        const allKeys = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
        let totalDiff = 0;

        allKeys.forEach((key) => {
          const val1 = dist1[key] || 0;
          const val2 = dist2[key] || 0;
          totalDiff += Math.abs(val1 - val2);
        });

        return totalDiff / 2; // Normalize to [0,1]
      },
    };
  }

  // Main sampling method with intelligent strategy selection
  async getOptimalSample(data, options = {}) {
    const {
      targetSize = null,
      minSampleSize = 1000,
      maxSampleSize = 100000,
      preserveFraudRate = true,
      complexity = 'medium',
    } = options;

    console.log(`📊 Production sampling: ${data.length.toLocaleString()} records`);

    // Determine optimal sample size if not specified
    let optimalSize = targetSize;
    if (!optimalSize) {
      optimalSize = this.calculateOptimalSampleSize(data.length, complexity);
    }

    // Ensure minimum sample size
    optimalSize = Math.max(minSampleSize, optimalSize);
    optimalSize = Math.min(maxSampleSize, optimalSize);

    // Select sampling strategy
    const strategy = this.selectSamplingStrategy(data.length, complexity);
    console.log(`  Strategy: ${strategy.description}`);

    // Perform sampling
    const sampledData = strategy.sample(data, optimalSize, complexity);

    // Validate sample quality
    const validation = this.qualityAssurance.validateSample(data, sampledData);

    console.log(`  Sample size: ${sampledData.length.toLocaleString()} (${(validation.samplingRatio * 100).toFixed(1)}%)`);
    console.log(`  Quality score: ${(validation.qualityScore * 100).toFixed(1)}%`);

    if (validation.warnings.length > 0) {
      console.log(`  Warnings: ${validation.warnings.join(', ')}`);
    }

    return {
      data: sampledData,
      strategy: strategy.description,
      validation,
      metadata: {
        originalSize: data.length,
        sampleSize: sampledData.length,
        samplingRatio: validation.samplingRatio,
        qualityScore: validation.qualityScore,
      },
    };
  }

  calculateOptimalSampleSize(dataSize, complexity) {
    if (dataSize <= 10000) {
      return dataSize; // Full dataset
    } if (dataSize <= 50000) {
      return Math.min(20000, Math.ceil(dataSize * 0.6)); // 60% or 20k max
    } if (dataSize <= 200000) {
      return Math.min(50000, Math.ceil(dataSize * 0.4)); // 40% or 50k max
    }
    return Math.min(100000, Math.ceil(dataSize * 0.2)); // 20% or 100k max
  }

  selectSamplingStrategy(dataSize, complexity) {
    // Prioritize strategies based on data size and complexity
    if (this.samplingStrategies.fullDataset.shouldUse(dataSize)) {
      return this.samplingStrategies.fullDataset;
    } if (this.samplingStrategies.stratified.shouldUse(dataSize)) {
      return this.samplingStrategies.stratified;
    } if (this.samplingStrategies.intelligent.shouldUse(dataSize)) {
      return this.samplingStrategies.intelligent;
    }
    return this.samplingStrategies.adaptive;
  }

  stratifiedSample(data, targetSize) {
    console.log('  Performing stratified sampling...');

    // Group by key dimensions
    const fraudGroups = this.groupBy(data, 'is_fraud');
    const categoryGroups = this.groupBy(data, 'merchant_category');
    const stateGroups = this.groupBy(data, 'merchant_state');

    const sample = [];
    const remainingSize = targetSize;

    // Stratify by fraud status (most important)
    if (fraudGroups['1'] && fraudGroups['0']) {
      const fraudSampleSize = Math.ceil(remainingSize * 0.3); // 30% for fraud
      const normalSampleSize = remainingSize - fraudSampleSize;

      const fraudSample = this.sampleFromGroup(fraudGroups['1'], fraudSampleSize);
      const normalSample = this.sampleFromGroup(fraudGroups['0'], normalSampleSize);

      sample.push(...fraudSample, ...normalSample);
    }

    // Add category stratification
    const categorySampleSize = Math.ceil(targetSize * 0.4);
    Object.entries(categoryGroups).forEach(([category, transactions]) => {
      const categorySampleCount = Math.ceil(categorySampleSize * transactions.length / data.length);
      const categorySample = this.sampleFromGroup(transactions, categorySampleCount);
      sample.push(...categorySample);
    });

    // Add geographic stratification
    const stateSampleSize = Math.ceil(targetSize * 0.3);
    Object.entries(stateGroups).forEach(([state, transactions]) => {
      const stateSampleCount = Math.ceil(stateSampleSize * transactions.length / data.length);
      const stateSample = this.sampleFromGroup(transactions, stateSampleCount);
      sample.push(...stateSample);
    });

    // Remove duplicates and limit to target size
    const uniqueSample = this.removeDuplicates(sample);
    return uniqueSample.slice(0, targetSize);
  }

  intelligentSample(data, targetSize) {
    console.log('  Performing intelligent sampling...');

    const sample = [];
    const featureColumns = ['amount', 'fraud_score', 'balance'];

    // Feature-based sampling
    featureColumns.forEach((column) => {
      if (data[0] && data[0][column] !== undefined) {
        const columnSample = this.sampleByFeature(data, column, Math.ceil(targetSize * 0.2));
        sample.push(...columnSample);
      }
    });

    // Temporal sampling
    if (data[0] && data[0].transaction_date) {
      const temporalSample = this.sampleByTemporalPattern(data, Math.ceil(targetSize * 0.2));
      sample.push(...temporalSample);
    }

    // Random sampling for diversity
    const randomSample = this.randomSample(data, Math.ceil(targetSize * 0.4));
    sample.push(...randomSample);

    // Remove duplicates and limit to target size
    const uniqueSample = this.removeDuplicates(sample);
    return uniqueSample.slice(0, targetSize);
  }

  adaptiveSample(data, targetSize, complexity) {
    console.log('  Performing adaptive sampling...');

    // Analyze data characteristics
    const characteristics = this.analyzeDataCharacteristics(data);

    // Adjust sampling based on characteristics
    let adjustedSize = targetSize;
    if (characteristics.highVariance) {
      adjustedSize = Math.ceil(targetSize * 1.2); // Increase sample for high variance
    }
    if (characteristics.lowComplexity) {
      adjustedSize = Math.ceil(targetSize * 0.8); // Decrease sample for low complexity
    }

    // Use appropriate sampling method based on characteristics
    if (characteristics.hasSeasonalPatterns) {
      return this.stratifiedSample(data, adjustedSize);
    } if (characteristics.hasGeographicPatterns) {
      return this.intelligentSample(data, adjustedSize);
    }
    return this.stratifiedSample(data, adjustedSize);
  }

  sampleByFeature(data, column, sampleSize) {
    const values = data.map((row) => parseFloat(row[column])).filter((v) => !isNaN(v));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length);

    // Sample from different ranges
    const lowRange = data.filter((row) => parseFloat(row[column]) < mean - std);
    const midRange = data.filter((row) => parseFloat(row[column]) >= mean - std && parseFloat(row[column]) <= mean + std);
    const highRange = data.filter((row) => parseFloat(row[column]) > mean + std);

    const lowSample = this.sampleFromGroup(lowRange, Math.ceil(sampleSize * 0.3));
    const midSample = this.sampleFromGroup(midRange, Math.ceil(sampleSize * 0.4));
    const highSample = this.sampleFromGroup(highRange, Math.ceil(sampleSize * 0.3));

    return [...lowSample, ...midSample, ...highSample];
  }

  sampleByTemporalPattern(data, sampleSize) {
    // Group by month and sample proportionally
    const monthlyGroups = this.groupBy(data, 'transaction_date', (date) => new Date(date).getMonth());

    const sample = [];
    Object.entries(monthlyGroups).forEach(([month, transactions]) => {
      const monthSampleCount = Math.ceil(sampleSize * transactions.length / data.length);
      const monthSample = this.sampleFromGroup(transactions, monthSampleCount);
      sample.push(...monthSample);
    });

    return sample;
  }

  analyzeDataCharacteristics(data) {
    const characteristics = {
      highVariance: false,
      lowComplexity: false,
      hasSeasonalPatterns: false,
      hasGeographicPatterns: false,
    };

    // Check for high variance in numeric columns
    const numericColumns = ['amount', 'fraud_score', 'balance'];
    numericColumns.forEach((column) => {
      if (data[0] && data[0][column] !== undefined) {
        const values = data.map((row) => parseFloat(row[column])).filter((v) => !isNaN(v));
        if (values.length > 0) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
          const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);

          if (coefficientOfVariation > 1.0) {
            characteristics.highVariance = true;
          }
        }
      }
    });

    // Check for seasonal patterns
    if (data[0] && data[0].transaction_date) {
      const monthlyCounts = {};
      data.forEach((row) => {
        const month = new Date(row.transaction_date).getMonth();
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      });

      const totalTransactions = data.length;
      const expectedMonthly = totalTransactions / 12;
      const seasonalVariation = Object.values(monthlyCounts).some((count) => Math.abs(count - expectedMonthly) / expectedMonthly > 0.3);

      characteristics.hasSeasonalPatterns = seasonalVariation;
    }

    // Check for geographic patterns
    if (data[0] && data[0].merchant_state) {
      const stateCounts = {};
      data.forEach((row) => {
        stateCounts[row.merchant_state] = (stateCounts[row.merchant_state] || 0) + 1;
      });

      const totalStates = Object.keys(stateCounts).length;
      const expectedPerState = data.length / totalStates;
      const geographicVariation = Object.values(stateCounts).some((count) => Math.abs(count - expectedPerState) / expectedPerState > 0.5);

      characteristics.hasGeographicPatterns = geographicVariation;
    }

    // Determine complexity
    characteristics.lowComplexity = !characteristics.highVariance
                                      && !characteristics.hasSeasonalPatterns
                                      && !characteristics.hasGeographicPatterns;

    return characteristics;
  }

  // Helper methods
  groupBy(data, key, transform = (val) => val) {
    return data.reduce((groups, item) => {
      const group = transform(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  sampleFromGroup(group, sampleSize) {
    if (group.length <= sampleSize) return group;

    const shuffled = [...group].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  randomSample(data, sampleSize) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
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
}

module.exports = ProductionSamplingService;

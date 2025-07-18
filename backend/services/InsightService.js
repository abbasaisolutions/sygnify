const { mean, std, min, max } = require('simple-statistics');

/**
 * Enhanced Insight Generation Service
 * Provides unified insights, facts, and metrics with deduplication
 * Includes health vs risk consistency validation
 */
class InsightService {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.domainConfig = this.loadDomainConfig();
        this.insightCache = new Map(); // Prevent duplicate insights
        this.factCache = new Map(); // Cache generated facts
    }

    loadDomainConfig() {
        const configs = {
            finance: {
                thresholds: {
                    fraud: { low: 0.3, medium: 0.5, high: 0.7 },
                    volatility: { low: 0.2, medium: 0.4, high: 0.6 },
                    health: { poor: 60, fair: 75, good: 85, excellent: 95 },
                    risk: { low: 30, medium: 60, high: 80 }
                },
                anomalyDetection: {
                    zScoreThreshold: 2.5,
                    iqrMultiplier: 1.5
                },
                keyMetrics: ['amount', 'balance', 'fraud_score', 'transaction_count']
            },
            healthcare: {
                thresholds: {
                    cost: { low: 1000, medium: 5000, high: 10000 },
                    satisfaction: { low: 6, medium: 7, high: 8 }
                },
                keyMetrics: ['treatment_cost', 'patient_satisfaction', 'recovery_time']
            },
            retail: {
                thresholds: {
                    sales: { low: 100, medium: 500, high: 1000 },
                    inventory: { low: 10, medium: 50, high: 100 }
                },
                keyMetrics: ['sales_amount', 'inventory_turnover', 'customer_satisfaction']
            }
        };
        return configs[domain] || configs.finance;
    }

    /**
     * Compute comprehensive metrics and insights
     * @param {Array} data - Raw data array
     * @param {Object} labels - Smart labels from LabelService
     * @returns {Object} - Unified insights, facts, and metrics
     */
    async computeMetrics(data, labels) {
        if (!data || data.length === 0) {
            throw new Error('No data provided for analysis');
        }

        console.log(`📊 Computing metrics for ${data.length} records...`);

        // Clear caches for fresh analysis
        this.insightCache.clear();
        this.factCache.clear();

        // Compute basic metrics
        const metrics = this.computeBasicMetrics(data, labels);
        
        // Generate insights with deduplication
        const insights = await this.generateInsights(metrics, data, labels);
        
        // Generate facts (subset of insights)
        const facts = this.generateFacts(insights, metrics);
        
        // Validate health vs risk consistency
        const validation = this.validateHealthRiskConsistency(metrics, insights);
        
        // Generate anomalies
        const anomalies = this.detectAnomalies(data, metrics, labels);

        return {
            metrics,
            insights,
            facts,
            anomalies,
            validation,
            metadata: {
                recordCount: data.length,
                metricCount: Object.keys(metrics).length,
                insightCount: insights.length,
                factCount: facts.length,
                anomalyCount: anomalies.length,
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Compute basic statistical metrics
     */
    computeBasicMetrics(data, labels) {
        const metrics = {};
        const columns = Object.keys(data[0]);

        for (const column of columns) {
            const values = data.map(row => row[column]).filter(v => v != null);
            const label = labels[column];
            
            if (!label) continue;

            const dataType = label.type;
            
            if (dataType === 'numeric') {
                metrics[column] = this.computeNumericMetrics(values, label);
            } else if (dataType === 'categorical') {
                metrics[column] = this.computeCategoricalMetrics(values, label);
            } else if (dataType === 'binary') {
                metrics[column] = this.computeBinaryMetrics(values, label);
            }
        }

        return metrics;
    }

    /**
     * Compute metrics for numeric columns
     */
    computeNumericMetrics(values, label) {
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        
        if (numericValues.length === 0) {
            return { count: 0, average: 0, min: 0, max: 0, standardDeviation: 0 };
        }

        const avg = mean(numericValues);
        const stdDev = std(numericValues);
        const minVal = min(numericValues);
        const maxVal = max(numericValues);
        const coefficientOfVariation = stdDev / Math.abs(avg);

        return {
            count: numericValues.length,
            average: avg,
            min: minVal,
            max: maxVal,
            standardDeviation: stdDev,
            coefficientOfVariation: coefficientOfVariation,
            range: maxVal - minVal,
            median: this.calculateMedian(numericValues),
            quartiles: this.calculateQuartiles(numericValues)
        };
    }

    /**
     * Compute metrics for categorical columns
     */
    computeCategoricalMetrics(values, label) {
        const valueCounts = {};
        values.forEach(v => {
            const key = String(v);
            valueCounts[key] = (valueCounts[key] || 0) + 1;
        });

        const uniqueValues = Object.keys(valueCounts);
        const totalCount = values.length;

        return {
            count: totalCount,
            uniqueCount: uniqueValues.length,
            valueCounts,
            mostCommon: this.getMostCommon(valueCounts),
            leastCommon: this.getLeastCommon(valueCounts),
            diversity: uniqueValues.length / totalCount
        };
    }

    /**
     * Compute metrics for binary columns
     */
    computeBinaryMetrics(values, label) {
        const valueCounts = {};
        values.forEach(v => {
            const key = String(v).toLowerCase();
            valueCounts[key] = (valueCounts[key] || 0) + 1;
        });

        const totalCount = values.length;
        const trueCount = valueCounts['true'] || valueCounts['1'] || valueCounts['yes'] || 0;
        const falseCount = valueCounts['false'] || valueCounts['0'] || valueCounts['no'] || 0;

        return {
            count: totalCount,
            trueCount,
            falseCount,
            truePercentage: (trueCount / totalCount) * 100,
            falsePercentage: (falseCount / totalCount) * 100,
            balance: Math.abs(trueCount - falseCount) / totalCount
        };
    }

    /**
     * Generate insights with deduplication
     */
    async generateInsights(metrics, data, labels) {
        const insights = [];
        const insightKeys = new Set(); // Prevent duplicates

        // Generate insights for each metric
        for (const [column, metric] of Object.entries(metrics)) {
            const label = labels[column];
            if (!label) continue;

            const columnInsights = this.generateColumnInsights(column, metric, label, data);
            
            // Add non-duplicate insights
            for (const insight of columnInsights) {
                const key = `${insight.category}_${insight.severity}_${insight.description.substring(0, 50)}`;
                if (!insightKeys.has(key)) {
                    insightKeys.add(key);
                    insights.push(insight);
                }
            }
        }

        // Generate cross-column insights
        const crossInsights = this.generateCrossColumnInsights(metrics, labels);
        insights.push(...crossInsights);

        // Sort by severity and importance
        return insights.sort((a, b) => {
            const severityOrder = { critical: 4, warning: 3, info: 2, success: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    /**
     * Generate facts from insights (subset for narrative)
     */
    generateFacts(insights, metrics) {
        // Select top facts based on importance and severity
        const topInsights = insights
            .filter(insight => insight.severity === 'critical' || insight.severity === 'warning')
            .slice(0, 5);

        return topInsights.map(insight => ({
            fact: insight.description,
            category: insight.category,
            severity: insight.severity,
            metric: insight.metric,
            value: insight.value
        }));
    }

    /**
     * Validate health vs risk consistency
     */
    validateHealthRiskConsistency(metrics, insights) {
        const validation = {
            isValid: true,
            warnings: [],
            healthScore: 85,
            riskLevel: 'low',
            recommendations: []
        };

        // Calculate health score
        validation.healthScore = this.calculateHealthScore(metrics);
        
        // Calculate risk level
        validation.riskLevel = this.calculateRiskLevel(insights);

        // Check for inconsistencies
        if (validation.healthScore > 80 && validation.riskLevel === 'high') {
            validation.isValid = false;
            validation.warnings.push('Health score and risk level are inconsistent');
            validation.recommendations.push('Review risk calculation methodology');
        }

        if (validation.healthScore < 60 && validation.riskLevel === 'low') {
            validation.warnings.push('Low health score but low risk level detected');
            validation.recommendations.push('Reassess risk assessment criteria');
        }

        return validation;
    }

    /**
     * Calculate health score
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

        return weightSum > 0 ? Math.round(totalScore / weightSum) : 85;
    }

    /**
     * Calculate risk level
     */
    calculateRiskLevel(insights) {
        const criticalCount = insights.filter(i => i.severity === 'critical').length;
        const warningCount = insights.filter(i => i.severity === 'warning').length;

        if (criticalCount > 0) return 'high';
        if (warningCount > 2) return 'medium';
        return 'low';
    }

    /**
     * Detect anomalies in data
     */
    detectAnomalies(data, metrics, labels) {
        const anomalies = [];

        for (const [column, metric] of Object.entries(metrics)) {
            if (metric.average === undefined) continue;

            const values = data.map(row => row[column]).filter(v => v != null);
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

            // Z-score based anomaly detection
            const zScoreAnomalies = this.detectZScoreAnomalies(numericValues, metric, column);
            anomalies.push(...zScoreAnomalies);

            // IQR based anomaly detection
            const iqrAnomalies = this.detectIQRAnomalies(numericValues, metric, column);
            anomalies.push(...iqrAnomalies);
        }

        return anomalies;
    }

    // Helper methods
    calculateMedian(values) {
        const sorted = values.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    calculateQuartiles(values) {
        const sorted = values.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        return { q1, q3, iqr: q3 - q1 };
    }

    getMostCommon(valueCounts) {
        return Object.entries(valueCounts)
            .sort(([,a], [,b]) => b - a)[0];
    }

    getLeastCommon(valueCounts) {
        return Object.entries(valueCounts)
            .sort(([,a], [,b]) => a - b)[0];
    }

    getMetricWeight(column) {
        const weights = {
            'amount': 95,
            'balance': 90,
            'fraud_score': 85,
            'transaction_count': 80
        };
        return weights[column] || 70;
    }

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

    detectZScoreAnomalies(values, metric, column) {
        const anomalies = [];
        const threshold = this.domainConfig.anomalyDetection.zScoreThreshold;

        values.forEach((value, index) => {
            const zScore = Math.abs((value - metric.average) / metric.standardDeviation);
            if (zScore > threshold) {
                anomalies.push({
                    column,
                    value,
                    index,
                    zScore,
                    type: 'z_score',
                    severity: zScore > threshold * 1.5 ? 'critical' : 'warning'
                });
            }
        });

        return anomalies;
    }

    detectIQRAnomalies(values, metric, column) {
        const anomalies = [];
        const { q1, q3, iqr } = metric.quartiles;
        const multiplier = this.domainConfig.anomalyDetection.iqrMultiplier;
        const lowerBound = q1 - (iqr * multiplier);
        const upperBound = q3 + (iqr * multiplier);

        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                anomalies.push({
                    column,
                    value,
                    index,
                    type: 'iqr',
                    severity: 'warning',
                    bounds: { lower: lowerBound, upper: upperBound }
                });
            }
        });

        return anomalies;
    }
}

module.exports = InsightService; 
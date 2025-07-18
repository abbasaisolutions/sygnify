const { mean, std, correlation, linearRegression, quantile } = require('simple-statistics');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

/**
 * Enhanced ML-Powered Analytics Service
 * Advanced pattern recognition, anomaly detection, and AI-powered insights
 */
class EnhancedMLService {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.patterns = this.loadAdvancedPatterns();
        this.aiModels = this.initializeAIModels();
        this.anomalyDetectors = this.initializeAnomalyDetectors();
    }

    loadAdvancedPatterns() {
        return {
            finance: {
                cashFlowPatterns: {
                    seasonal: { threshold: 0.3, description: 'Seasonal cash flow patterns' },
                    cyclical: { threshold: 0.4, description: 'Cyclical cash flow patterns' },
                    trend: { threshold: 0.2, description: 'Trending cash flow patterns' },
                    volatile: { threshold: 0.6, description: 'Volatile cash flow patterns' },
                    stable: { threshold: 0.1, description: 'Stable cash flow patterns' }
                },
                profitabilityPatterns: {
                    growing: { threshold: 0.05, description: 'Growing profitability' },
                    declining: { threshold: -0.05, description: 'Declining profitability' },
                    stable: { threshold: 0.02, description: 'Stable profitability' },
                    cyclical: { threshold: 0.3, description: 'Cyclical profitability' }
                },
                riskPatterns: {
                    fraud: { threshold: 0.7, description: 'High fraud risk' },
                    liquidity: { threshold: 0.5, description: 'Liquidity risk' },
                    market: { threshold: 0.6, description: 'Market risk' },
                    operational: { threshold: 0.4, description: 'Operational risk' }
                },
                efficiencyPatterns: {
                    improving: { threshold: 0.1, description: 'Improving efficiency' },
                    declining: { threshold: -0.1, description: 'Declining efficiency' },
                    optimal: { threshold: 0.05, description: 'Optimal efficiency' }
                }
            }
        };
    }

    initializeAIModels() {
        return {
            sentimentAnalyzer: new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn'),
            classifier: new natural.BayesClassifier(),
            tfidf: new natural.TfIdf()
        };
    }

    initializeAnomalyDetectors() {
        return {
            iqr: this.createIQRDetector(),
            zscore: this.createZScoreDetector(),
            isolationForest: this.createIsolationForestDetector()
        };
    }

    createIQRDetector() {
        return {
            detect: (data, factor = 1.5) => {
                const sorted = data.sort((a, b) => a - b);
                const q1 = quantile(sorted, 0.25);
                const q3 = quantile(sorted, 0.75);
                const iqr = q3 - q1;
                const lowerBound = q1 - factor * iqr;
                const upperBound = q3 + factor * iqr;
                
                return data.filter(value => value < lowerBound || value > upperBound);
            }
        };
    }

    createZScoreDetector() {
        return {
            detect: (data, threshold = 3) => {
                const avg = mean(data);
                const stdDev = std(data);
                return data.filter(value => Math.abs((value - avg) / stdDev) > threshold);
            }
        };
    }

    createIsolationForestDetector() {
        return {
            detect: (data, contamination = 0.1) => {
                // Simplified isolation forest implementation
                const anomalies = [];
                const sampleSize = Math.ceil(data.length * contamination);
                
                // Simple anomaly detection based on distance from mean
                const avg = mean(data);
                const distances = data.map((value, index) => ({
                    value,
                    index,
                    distance: Math.abs(value - avg)
                }));
                
                distances.sort((a, b) => b.distance - a.distance);
                return distances.slice(0, sampleSize).map(item => item.value);
            }
        };
    }

    /**
     * Enhanced data preprocessing with intelligent column detection
     */
    preprocessData(data) {
        if (!data || data.length === 0) {
            throw new Error('No data provided for preprocessing');
        }

        const processedData = {
            raw: data,
            columns: Object.keys(data[0] || {}),
            numericColumns: {},
            categoricalColumns: {},
            temporalColumns: {},
            amountColumns: {},
            dateColumns: {},
            metadata: {
                totalRecords: data.length,
                totalColumns: Object.keys(data[0] || {}).length,
                dataQuality: this.assessDataQuality(data)
            }
        };

        // Intelligent column classification
        processedData.columns.forEach(column => {
            const sampleValues = data.slice(0, 100).map(row => row[column]).filter(v => v !== null && v !== undefined);
            
            if (this.isNumericColumn(sampleValues)) {
                processedData.numericColumns[column] = this.analyzeNumericColumn(data, column);
            } else if (this.isTemporalColumn(sampleValues)) {
                processedData.temporalColumns[column] = this.analyzeTemporalColumn(data, column);
            } else if (this.isAmountColumn(column, sampleValues)) {
                processedData.amountColumns[column] = this.analyzeAmountColumn(data, column);
            } else {
                processedData.categoricalColumns[column] = this.analyzeCategoricalColumn(data, column);
            }
        });

        return processedData;
    }

    isNumericColumn(values) {
        const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
        return numericCount / values.length > 0.8;
    }

    isTemporalColumn(values) {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/,
            /^\d{2}\/\d{2}\/\d{4}/,
            /^\d{2}-\d{2}-\d{4}/,
            /^\d{4}\/\d{2}\/\d{2}/
        ];
        
        const dateCount = values.filter(v => 
            datePatterns.some(pattern => pattern.test(String(v)))
        ).length;
        
        return dateCount / values.length > 0.7;
    }

    isAmountColumn(columnName, values) {
        const amountKeywords = ['amount', 'price', 'cost', 'revenue', 'sales', 'profit', 'expense', 'income'];
        const hasAmountKeyword = amountKeywords.some(keyword => 
            columnName.toLowerCase().includes(keyword)
        );
        
        if (hasAmountKeyword) {
            const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
            return numericCount / values.length > 0.8;
        }
        
        return false;
    }

    analyzeNumericColumn(data, column) {
        const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v) && isFinite(v));
        
        if (values.length === 0) {
            return { error: 'No valid numeric data found' };
        }

        const analysis = {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            average: mean(values),
            median: quantile(values, 0.5),
            stdDev: std(values),
            min: Math.min(...values),
            max: Math.max(...values),
            q1: quantile(values, 0.25),
            q3: quantile(values, 0.75),
            coefficientOfVariation: std(values) / Math.abs(mean(values)),
            skewness: this.calculateSkewness(values),
            kurtosis: this.calculateKurtosis(values),
            anomalies: {
                iqr: this.anomalyDetectors.iqr.detect(values),
                zscore: this.anomalyDetectors.zscore.detect(values),
                isolationForest: this.anomalyDetectors.isolationForest.detect(values)
            },
            patterns: this.detectNumericPatterns(values),
            trends: this.analyzeTrends(values)
        };

        return analysis;
    }

    analyzeTemporalColumn(data, column) {
        const values = data.map(row => row[column]).filter(v => v);
        const parsedDates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        
        return {
            count: parsedDates.length,
            minDate: new Date(Math.min(...parsedDates.map(d => d.getTime()))),
            maxDate: new Date(Math.max(...parsedDates.map(d => d.getTime()))),
            dateRange: this.calculateDateRange(parsedDates),
            seasonality: this.detectSeasonality(parsedDates),
            gaps: this.detectDateGaps(parsedDates)
        };
    }

    analyzeAmountColumn(data, column) {
        const numericAnalysis = this.analyzeNumericColumn(data, column);
        
        // Add financial-specific analysis
        const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v) && isFinite(v));
        
        return {
            ...numericAnalysis,
            financialMetrics: {
                netCashFlow: values.reduce((a, b) => a + b, 0),
                positiveCashFlow: values.filter(v => v > 0).reduce((a, b) => a + b, 0),
                negativeCashFlow: Math.abs(values.filter(v => v < 0).reduce((a, b) => a + b, 0)),
                cashFlowRatio: values.filter(v => v > 0).length / values.length,
                averageTransactionSize: mean(values),
                transactionVolume: values.length,
                volatility: std(values) / Math.abs(mean(values))
            },
            riskAssessment: this.assessFinancialRisk(values),
            profitabilityAnalysis: this.analyzeProfitability(values)
        };
    }

    analyzeCategoricalColumn(data, column) {
        const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
        const uniqueValues = [...new Set(values)];
        const valueCounts = {};
        
        values.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });

        return {
            count: values.length,
            uniqueCount: uniqueValues.length,
            mostCommon: Object.entries(valueCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([value, count]) => ({ value, count, percentage: (count / values.length) * 100 })),
            distribution: valueCounts,
            entropy: this.calculateEntropy(values),
            patterns: this.detectCategoricalPatterns(values)
        };
    }

    /**
     * Advanced pattern detection
     */
    detectNumericPatterns(values) {
        const patterns = {
            trend: this.detectTrend(values),
            seasonality: this.detectSeasonality(values),
            cycles: this.detectCycles(values),
            volatility: this.analyzeVolatility(values),
            outliers: this.detectOutliers(values)
        };

        return patterns;
    }

    detectTrend(values) {
        if (values.length < 3) return { type: 'insufficient_data' };
        
        const x = Array.from({ length: values.length }, (_, i) => i);
        const regression = linearRegression(x.map(x => [x]), values);
        
        const slope = regression.m;
        const rSquared = this.calculateRSquared(x, values, regression);
        
        if (Math.abs(slope) < 0.01) {
            return { type: 'stable', slope, rSquared, confidence: 'low' };
        } else if (slope > 0) {
            return { type: 'increasing', slope, rSquared, confidence: rSquared > 0.7 ? 'high' : 'medium' };
        } else {
            return { type: 'decreasing', slope, rSquared, confidence: rSquared > 0.7 ? 'high' : 'medium' };
        }
    }

    detectSeasonality(values) {
        if (values.length < 12) return { type: 'insufficient_data' };
        
        // Simple seasonality detection using autocorrelation
        const autocorr = this.calculateAutocorrelation(values);
        const seasonalPeriods = this.findSeasonalPeriods(autocorr);
        
        return {
            type: seasonalPeriods.length > 0 ? 'seasonal' : 'non_seasonal',
            periods: seasonalPeriods,
            strength: this.calculateSeasonalStrength(values, seasonalPeriods)
        };
    }

    detectCycles(values) {
        // Simplified cycle detection
        const volatility = std(values) / Math.abs(mean(values));
        const cycleCount = this.countCycles(values);
        
        return {
            type: cycleCount > 2 ? 'cyclical' : 'non_cyclical',
            cycleCount,
            volatility,
            averageCycleLength: values.length / Math.max(cycleCount, 1)
        };
    }

    analyzeVolatility(values) {
        const volatility = std(values) / Math.abs(mean(values));
        const rollingVolatility = this.calculateRollingVolatility(values, 5);
        
        return {
            overall: volatility,
            trend: this.detectTrend(rollingVolatility),
            stability: volatility < 0.1 ? 'stable' : volatility < 0.3 ? 'moderate' : 'volatile',
            riskLevel: volatility < 0.1 ? 'low' : volatility < 0.3 ? 'medium' : 'high'
        };
    }

    detectOutliers(values) {
        const iqrOutliers = this.anomalyDetectors.iqr.detect(values);
        const zscoreOutliers = this.anomalyDetectors.zscore.detect(values);
        const isolationOutliers = this.anomalyDetectors.isolationForest.detect(values);
        
        return {
            iqr: iqrOutliers,
            zscore: zscoreOutliers,
            isolationForest: isolationOutliers,
            total: new Set([...iqrOutliers, ...zscoreOutliers, ...isolationOutliers]).size,
            percentage: (new Set([...iqrOutliers, ...zscoreOutliers, ...isolationOutliers]).size / values.length) * 100
        };
    }

    /**
     * Financial-specific analysis
     */
    assessFinancialRisk(values) {
        const volatility = std(values) / Math.abs(mean(values));
        const negativeRatio = values.filter(v => v < 0).length / values.length;
        const maxDrawdown = this.calculateMaxDrawdown(values);
        
        let riskScore = 0;
        let riskFactors = [];
        
        if (volatility > 0.5) {
            riskScore += 30;
            riskFactors.push('high_volatility');
        }
        
        if (negativeRatio > 0.6) {
            riskScore += 25;
            riskFactors.push('high_negative_cash_flow');
        }
        
        if (maxDrawdown > 0.3) {
            riskScore += 25;
            riskFactors.push('significant_drawdown');
        }
        
        if (values.length < 30) {
            riskScore += 20;
            riskFactors.push('limited_data');
        }
        
        return {
            score: Math.min(100, riskScore),
            level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
            factors: riskFactors,
            volatility,
            negativeRatio,
            maxDrawdown
        };
    }

    analyzeProfitability(values) {
        const positiveValues = values.filter(v => v > 0);
        const negativeValues = values.filter(v => v < 0);
        
        const totalRevenue = positiveValues.reduce((a, b) => a + b, 0);
        const totalExpenses = Math.abs(negativeValues.reduce((a, b) => a + b, 0));
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            profitability: profitMargin > 20 ? 'high' : profitMargin > 10 ? 'medium' : 'low',
            revenueStability: std(positiveValues) / Math.abs(mean(positiveValues)),
            expenseControl: std(negativeValues) / Math.abs(mean(negativeValues))
        };
    }

    /**
     * Generate comprehensive AI-powered insights
     */
    async generateEnhancedInsights(processedData) {
        try {
            // Validate processedData structure
            if (!processedData || typeof processedData !== 'object') {
                console.warn('EnhancedMLService: Invalid processedData provided');
                return this.generateFallbackInsights();
            }

            const insights = {
                patterns: this.generatePatternInsights(processedData),
                anomalies: this.generateAnomalyInsights(processedData),
                trends: this.generateTrendInsights(processedData),
                risks: this.generateRiskInsights(processedData),
                opportunities: this.generateOpportunityInsights(processedData),
                recommendations: this.generateRecommendations(processedData),
                predictions: this.generatePredictions(processedData),
                summary: this.generateExecutiveSummary(processedData)
            };

            return insights;
        } catch (error) {
            console.error('EnhancedMLService: Error generating insights:', error);
            return this.generateFallbackInsights();
        }
    }

    generateFallbackInsights() {
        return {
            patterns: [],
            anomalies: [],
            trends: [],
            risks: [],
            opportunities: [],
            recommendations: [{
                priority: 'medium',
                category: 'general',
                description: 'Improve data quality for better analysis',
                action: 'Collect more comprehensive data',
                effort: 'medium',
                impact: 'medium'
            }],
            predictions: {},
            summary: {
                overview: { totalRecords: 0, dataQuality: 0 },
                keyFindings: [],
                riskAssessment: [],
                opportunities: [],
                recommendations: []
            }
        };
    }

    generatePatternInsights(processedData) {
        const insights = [];
        
        // Analyze amount columns for financial patterns
        const amountColumns = processedData.amountColumns || {};
        Object.entries(amountColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.financialMetrics) {
                const { netCashFlow, cashFlowRatio, volatility } = analysis.financialMetrics;
                
                if (netCashFlow > 0) {
                    insights.push({
                        type: 'positive',
                        category: 'cash_flow',
                        description: `Positive net cash flow of $${netCashFlow.toLocaleString()}`,
                        impact: 'high',
                        confidence: 'high'
                    });
                }
                
                if (cashFlowRatio > 0.7) {
                    insights.push({
                        type: 'positive',
                        category: 'transaction_pattern',
                        description: `${(cashFlowRatio * 100).toFixed(1)}% of transactions are positive`,
                        impact: 'medium',
                        confidence: 'high'
                    });
                }
                
                if (volatility > 0.5) {
                    insights.push({
                        type: 'warning',
                        category: 'volatility',
                        description: `High transaction volatility (${(volatility * 100).toFixed(1)}%)`,
                        impact: 'medium',
                        confidence: 'high'
                    });
                }
            }
        });

        return insights;
    }

    generateAnomalyInsights(processedData) {
        const insights = [];
        
        const numericColumns = processedData.numericColumns || {};
        Object.entries(numericColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.anomalies) {
                const totalAnomalies = analysis.anomalies.total;
                const anomalyPercentage = analysis.anomalies.percentage;
                
                if (anomalyPercentage > 5) {
                    insights.push({
                        type: 'warning',
                        category: 'anomalies',
                        description: `${totalAnomalies} anomalies detected (${anomalyPercentage.toFixed(1)}% of data)`,
                        impact: 'high',
                        confidence: 'high',
                        details: {
                            column,
                            anomalyTypes: {
                                iqr: analysis.anomalies.iqr.length,
                                zscore: analysis.anomalies.zscore.length,
                                isolationForest: analysis.anomalies.isolationForest.length
                            }
                        }
                    });
                }
            }
        });

        return insights;
    }

    generateTrendInsights(processedData) {
        const insights = [];
        
        const numericColumns = processedData.numericColumns || {};
        Object.entries(numericColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.trends) {
                const trend = analysis.trends.trend;
                
                if (trend.type === 'increasing' && trend.confidence === 'high') {
                    insights.push({
                        type: 'positive',
                        category: 'trend',
                        description: `Strong upward trend in ${column}`,
                        impact: 'high',
                        confidence: 'high',
                        details: { slope: trend.slope, rSquared: trend.rSquared }
                    });
                } else if (trend.type === 'decreasing' && trend.confidence === 'high') {
                    insights.push({
                        type: 'warning',
                        category: 'trend',
                        description: `Strong downward trend in ${column}`,
                        impact: 'high',
                        confidence: 'high',
                        details: { slope: trend.slope, rSquared: trend.rSquared }
                    });
                }
            }
        });

        return insights;
    }

    generateRiskInsights(processedData) {
        const insights = [];
        
        const amountColumns = processedData.amountColumns || {};
        Object.entries(amountColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.riskAssessment) {
                const { level, factors, score } = analysis.riskAssessment;
                
                if (level === 'high') {
                    insights.push({
                        type: 'critical',
                        category: 'risk',
                        description: `High risk level (${score}/100) in ${column}`,
                        impact: 'high',
                        confidence: 'high',
                        details: { factors, score }
                    });
                } else if (level === 'medium') {
                    insights.push({
                        type: 'warning',
                        category: 'risk',
                        description: `Medium risk level (${score}/100) in ${column}`,
                        impact: 'medium',
                        confidence: 'high',
                        details: { factors, score }
                    });
                }
            }
        });

        return insights;
    }

    generateOpportunityInsights(processedData) {
        const insights = [];
        
        const amountColumns = processedData.amountColumns || {};
        Object.entries(amountColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.profitabilityAnalysis) {
                const { profitMargin, profitability } = analysis.profitabilityAnalysis;
                
                if (profitability === 'high') {
                    insights.push({
                        type: 'opportunity',
                        category: 'profitability',
                        description: `High profitability margin (${profitMargin.toFixed(1)}%)`,
                        impact: 'high',
                        confidence: 'high',
                        details: { profitMargin }
                    });
                } else if (profitability === 'low') {
                    insights.push({
                        type: 'opportunity',
                        category: 'improvement',
                        description: `Opportunity to improve profitability (current: ${profitMargin.toFixed(1)}%)`,
                        impact: 'medium',
                        confidence: 'high',
                        details: { currentMargin: profitMargin }
                    });
                }
            }
        });

        return insights;
    }

    generateRecommendations(processedData) {
        const recommendations = [];
        
        // Generate recommendations based on insights
        const allInsights = [
            ...this.generatePatternInsights(processedData),
            ...this.generateAnomalyInsights(processedData),
            ...this.generateRiskInsights(processedData)
        ];
        
        allInsights.forEach(insight => {
            if (insight.type === 'warning' || insight.type === 'critical') {
                recommendations.push({
                    priority: insight.type === 'critical' ? 'high' : 'medium',
                    category: insight.category,
                    description: this.generateRecommendationDescription(insight),
                    action: this.generateRecommendationAction(insight),
                    effort: 'medium',
                    impact: insight.impact
                });
            }
        });

        return recommendations;
    }

    generatePredictions(processedData) {
        const predictions = {};
        
        const numericColumns = processedData.numericColumns || {};
        Object.entries(numericColumns).forEach(([column, analysis]) => {
            if (analysis && analysis.trends && analysis.trends.trend) {
                const trend = analysis.trends.trend;
                const lastValue = analysis.max;
                
                if (trend.type === 'increasing' && trend.confidence === 'high') {
                    predictions[column] = {
                        nextPeriod: lastValue * (1 + trend.slope),
                        nextQuarter: lastValue * (1 + trend.slope * 3),
                        confidence: 'high',
                        trend: 'positive'
                    };
                } else if (trend.type === 'decreasing' && trend.confidence === 'high') {
                    predictions[column] = {
                        nextPeriod: lastValue * (1 + trend.slope),
                        nextQuarter: lastValue * (1 + trend.slope * 3),
                        confidence: 'high',
                        trend: 'negative'
                    };
                }
            }
        });

        return predictions;
    }

    generateExecutiveSummary(processedData) {
        const summary = {
            overview: this.generateOverview(processedData),
            keyMetrics: this.extractKeyMetrics(processedData),
            riskAssessment: this.generateRiskSummary(processedData),
            opportunities: this.generateOpportunitySummary(processedData),
            recommendations: this.generateTopRecommendations(processedData)
        };

        return summary;
    }

    // Helper methods
    calculateSkewness(values) {
        const avg = mean(values);
        const stdDev = std(values);
        const n = values.length;
        
        const skewness = values.reduce((sum, value) => {
            return sum + Math.pow((value - avg) / stdDev, 3);
        }, 0) / n;
        
        return skewness;
    }

    calculateKurtosis(values) {
        const avg = mean(values);
        const stdDev = std(values);
        const n = values.length;
        
        const kurtosis = values.reduce((sum, value) => {
            return sum + Math.pow((value - avg) / stdDev, 4);
        }, 0) / n - 3;
        
        return kurtosis;
    }

    calculateRSquared(x, y, regression) {
        const yPred = x.map(xi => regression.m * xi + regression.b);
        const yMean = mean(y);
        
        const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
        const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        
        return 1 - (ssRes / ssTot);
    }

    calculateAutocorrelation(values) {
        const maxLag = Math.min(20, Math.floor(values.length / 2));
        const autocorr = [];
        
        for (let lag = 1; lag <= maxLag; lag++) {
            let numerator = 0;
            let denominator = 0;
            
            for (let i = lag; i < values.length; i++) {
                numerator += (values[i] - mean(values)) * (values[i - lag] - mean(values));
                denominator += Math.pow(values[i] - mean(values), 2);
            }
            
            autocorr.push(numerator / denominator);
        }
        
        return autocorr;
    }

    findSeasonalPeriods(autocorr) {
        const periods = [];
        const threshold = 0.3;
        
        for (let i = 1; i < autocorr.length; i++) {
            if (autocorr[i] > threshold) {
                periods.push(i + 1);
            }
        }
        
        return periods;
    }

    calculateSeasonalStrength(values, periods) {
        if (periods.length === 0) return 0;
        
        const seasonalVariance = periods.reduce((sum, period) => {
            const seasonalValues = [];
            for (let i = 0; i < values.length; i += period) {
                if (i < values.length) seasonalValues.push(values[i]);
            }
            return sum + std(seasonalValues);
        }, 0) / periods.length;
        
        const totalVariance = std(values);
        return seasonalVariance / totalVariance;
    }

    countCycles(values) {
        let cycles = 0;
        let inPeak = false;
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i - 1] && !inPeak) {
                inPeak = true;
            } else if (values[i] < values[i - 1] && inPeak) {
                cycles++;
                inPeak = false;
            }
        }
        
        return cycles;
    }

    calculateRollingVolatility(values, window) {
        const rollingVol = [];
        
        for (let i = window; i < values.length; i++) {
            const windowValues = values.slice(i - window, i);
            rollingVol.push(std(windowValues) / Math.abs(mean(windowValues)));
        }
        
        return rollingVol;
    }

    calculateMaxDrawdown(values) {
        let maxDrawdown = 0;
        let peak = values[0];
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] > peak) {
                peak = values[i];
            } else {
                const drawdown = (peak - values[i]) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }
        
        return maxDrawdown;
    }

    calculateEntropy(values) {
        const valueCounts = {};
        values.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        const total = values.length;
        let entropy = 0;
        
        Object.values(valueCounts).forEach(count => {
            const probability = count / total;
            entropy -= probability * Math.log2(probability);
        });
        
        return entropy;
    }

    assessDataQuality(data) {
        if (!data || data.length === 0) return 0;
        
        const columns = Object.keys(data[0] || {});
        let totalQuality = 0;
        
        columns.forEach(column => {
            const values = data.map(row => row[column]);
            const nonNullCount = values.filter(v => v !== null && v !== undefined && v !== '').length;
            const quality = nonNullCount / values.length;
            totalQuality += quality;
        });
        
        return totalQuality / columns.length;
    }

    generateRecommendationDescription(insight) {
        const descriptions = {
            'high_volatility': 'Implement volatility management strategies',
            'high_negative_cash_flow': 'Optimize cash flow management',
            'significant_drawdown': 'Develop risk mitigation strategies',
            'limited_data': 'Collect more data for better analysis',
            'anomalies': 'Investigate and address data anomalies'
        };
        
        return descriptions[insight.details?.factors?.[0]] || 'Review and optimize current processes';
    }

    generateRecommendationAction(insight) {
        const actions = {
            'high_volatility': 'Implement hedging strategies and diversify investments',
            'high_negative_cash_flow': 'Review expenses and optimize revenue streams',
            'significant_drawdown': 'Establish stop-loss mechanisms and risk limits',
            'limited_data': 'Extend data collection period and improve data quality',
            'anomalies': 'Implement automated anomaly detection and investigation procedures'
        };
        
        return actions[insight.details?.factors?.[0]] || 'Conduct detailed analysis and implement improvements';
    }

    generateOverview(processedData) {
        return {
            totalRecords: processedData?.metadata?.totalRecords || 0,
            dataQuality: Math.round((processedData?.quality?.score || 0) * 100),
            financialMetrics: Object.keys(processedData?.amountColumns || {}).length,
            analysisDepth: 'comprehensive',
            confidence: this.calculateConfidence({})
        };
    }

    calculateConfidence(insights) {
        // Simple confidence calculation
        return 'medium';
    }

    extractKeyMetrics(processedData) {
        const metrics = {};
        
        Object.entries(processedData.amountColumns).forEach(([column, analysis]) => {
            if (analysis.financialMetrics) {
                metrics[column] = {
                    netCashFlow: analysis.financialMetrics.netCashFlow,
                    averageTransaction: analysis.financialMetrics.averageTransactionSize,
                    transactionVolume: analysis.financialMetrics.transactionVolume,
                    volatility: analysis.financialMetrics.volatility
                };
            }
        });
        
        return metrics;
    }

    generateRiskSummary(processedData) {
        const risks = [];
        
        Object.entries(processedData.amountColumns).forEach(([column, analysis]) => {
            if (analysis.riskAssessment) {
                risks.push({
                    column,
                    level: analysis.riskAssessment.level,
                    score: analysis.riskAssessment.score,
                    factors: analysis.riskAssessment.factors
                });
            }
        });
        
        return risks;
    }

    generateOpportunitySummary(processedData) {
        const opportunities = [];
        
        Object.entries(processedData.amountColumns).forEach(([column, analysis]) => {
            if (analysis.profitabilityAnalysis) {
                opportunities.push({
                    column,
                    profitMargin: analysis.profitabilityAnalysis.profitMargin,
                    profitability: analysis.profitabilityAnalysis.profitability
                });
            }
        });
        
        return opportunities;
    }

    generateTopRecommendations(processedData) {
        const recommendations = this.generateRecommendations(processedData);
        return recommendations
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, 5);
    }
}

module.exports = EnhancedMLService; 
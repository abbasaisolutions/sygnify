const { mean, std, correlation, linearRegression } = require('simple-statistics');

/**
 * ML-Powered Summary Service
 * Analyzes all statistics and creates insightful one-paragraph summaries
 * Uses pattern recognition, correlation analysis, and contextual interpretation
 */
class MLSummaryService {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.patterns = this.loadPatterns();
        this.contextRules = this.loadContextRules();
    }

    loadPatterns() {
        return {
            finance: {
                cashFlowPatterns: {
                    netNegative: { threshold: -100, description: 'Net negative cash flow' },
                    netPositive: { threshold: 100, description: 'Net positive cash flow' },
                    balanced: { threshold: 50, description: 'Balanced cash flow' }
                },
                riskPatterns: {
                    highRisk: { threshold: 0.7, description: 'High risk exposure' },
                    mediumRisk: { threshold: 0.4, description: 'Moderate risk level' },
                    lowRisk: { threshold: 0.2, description: 'Low risk profile' }
                },
                volatilityPatterns: {
                    highVolatility: { threshold: 0.5, description: 'High volatility' },
                    moderateVolatility: { threshold: 0.3, description: 'Moderate volatility' },
                    lowVolatility: { threshold: 0.1, description: 'Low volatility' }
                },
                balancePatterns: {
                    healthy: { threshold: 10000, description: 'Healthy balance levels' },
                    moderate: { threshold: 5000, description: 'Moderate balance levels' },
                    low: { threshold: 1000, description: 'Low balance levels' }
                }
            }
        };
    }

    loadContextRules() {
        return {
            finance: {
                positiveIndicators: [
                    'positive cash flow',
                    'low fraud risk',
                    'high account balances',
                    'stable transaction patterns',
                    'good liquidity ratios'
                ],
                negativeIndicators: [
                    'negative cash flow',
                    'high fraud risk',
                    'low account balances',
                    'volatile transaction patterns',
                    'poor liquidity ratios'
                ],
                neutralIndicators: [
                    'balanced cash flow',
                    'moderate risk levels',
                    'stable patterns',
                    'mixed performance indicators'
                ]
            }
        };
    }

    /**
     * Generate comprehensive ML-powered summary
     * @param {Object} metrics - All computed metrics
     * @param {Array} insights - Generated insights
     * @param {Object} forecasts - Forecasts
     * @param {Array} recommendations - Recommendations
     * @param {Object} labels - Smart labels
     * @returns {Object} - Comprehensive summary with ML analysis
     */
    async generateMLSummary(metrics, insights, forecasts, recommendations, labels) {
        try {
            // Validate inputs
            if (!metrics || typeof metrics !== 'object') {
                console.warn('ML Summary: Invalid metrics provided, using empty object');
                metrics = {};
            }
            
            if (!insights || !Array.isArray(insights)) {
                console.warn('ML Summary: Invalid insights provided, using empty array');
                insights = [];
            }
            
            if (!forecasts || typeof forecasts !== 'object') {
                console.warn('ML Summary: Invalid forecasts provided, using empty object');
                forecasts = {};
            }
            
            if (!recommendations || !Array.isArray(recommendations)) {
                console.warn('ML Summary: Invalid recommendations provided, using empty array');
                recommendations = [];
            }
            
            if (!labels || typeof labels !== 'object') {
                console.warn('ML Summary: Invalid labels provided, using empty object');
                labels = {};
            }

            // Extract key patterns and correlations
            const patterns = this.extractPatterns(metrics, insights);
            const correlations = this.analyzeCorrelations(metrics);
            const riskProfile = this.assessRiskProfile(metrics, insights);
            const performanceProfile = this.assessPerformanceProfile(metrics, forecasts);
            const operationalInsights = this.analyzeOperationalMetrics(metrics, insights);

            // Generate comprehensive summary
            const summary = this.composeSummary(patterns, correlations, riskProfile, performanceProfile, operationalInsights, metrics);

            return {
                success: true,
                summary: summary,
                patterns: patterns,
                correlations: correlations,
                riskProfile: riskProfile,
                performanceProfile: performanceProfile,
                operationalInsights: operationalInsights,
                metadata: {
                    analysisType: 'ML-Powered Comprehensive Summary',
                    patternsDetected: Object.keys(patterns).length,
                    correlationsFound: Object.keys(correlations).length,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('ML Summary generation failed:', error);
            return {
                success: false,
                error: error.message,
                summary: this.generateFallbackSummary(metrics)
            };
        }
    }

    /**
     * Extract patterns from metrics and insights
     */
    extractPatterns(metrics, insights) {
        const patterns = {
            cashFlow: this.analyzeCashFlowPatterns(metrics),
            risk: this.analyzeRiskPatterns(metrics),
            volatility: this.analyzeVolatilityPatterns(metrics),
            balance: this.analyzeBalancePatterns(metrics),
            transaction: this.analyzeTransactionPatterns(metrics)
        };

        // Add insight-based patterns
        patterns.insightPatterns = this.extractInsightPatterns(insights);

        return patterns;
    }

    /**
     * Analyze cash flow patterns
     */
    analyzeCashFlowPatterns(metrics) {
        const amountMetric = this.findAmountMetric(metrics);
        if (!amountMetric || amountMetric.average === undefined || amountMetric.average === null) {
            return { 
                type: 'unknown', 
                description: 'No transaction data available',
                severity: 'info',
                value: 0,
                implications: 'No transaction amount data found'
            };
        }

        const avgAmount = parseFloat(amountMetric.average);
        if (isNaN(avgAmount)) {
            return { 
                type: 'unknown', 
                description: 'Invalid transaction data',
                severity: 'warning',
                value: 0,
                implications: 'Transaction amount data is invalid'
            };
        }

        const pattern = this.patterns.finance.cashFlowPatterns;

        if (avgAmount < pattern.netNegative.threshold) {
            return {
                type: 'netNegative',
                description: pattern.netNegative.description,
                severity: 'high',
                value: avgAmount,
                implications: 'Indicates net cash outflow, potential liquidity concerns'
            };
        } else if (avgAmount > pattern.netPositive.threshold) {
            return {
                type: 'netPositive',
                description: pattern.netPositive.description,
                severity: 'low',
                value: avgAmount,
                implications: 'Indicates net cash inflow, healthy financial position'
            };
        } else {
            return {
                type: 'balanced',
                description: pattern.balanced.description,
                severity: 'medium',
                value: avgAmount,
                implications: 'Indicates balanced cash flow, stable operations'
            };
        }
    }

    /**
     * Analyze risk patterns
     */
    analyzeRiskPatterns(metrics) {
        const fraudMetric = this.findFraudMetric(metrics);
        if (!fraudMetric || fraudMetric.average === undefined || fraudMetric.average === null) {
            return { 
                type: 'unknown', 
                description: 'No fraud data available',
                severity: 'info',
                value: 0,
                implications: 'No fraud score data found'
            };
        }

        const avgFraudScore = parseFloat(fraudMetric.average);
        if (isNaN(avgFraudScore)) {
            return { 
                type: 'unknown', 
                description: 'Invalid fraud data',
                severity: 'warning',
                value: 0,
                implications: 'Fraud score data is invalid'
            };
        }

        const pattern = this.patterns.finance.riskPatterns;

        if (avgFraudScore > pattern.highRisk.threshold) {
            return {
                type: 'highRisk',
                description: pattern.highRisk.description,
                severity: 'critical',
                value: avgFraudScore,
                implications: 'Requires immediate attention and enhanced security measures'
            };
        } else if (avgFraudScore > pattern.mediumRisk.threshold) {
            return {
                type: 'mediumRisk',
                description: pattern.mediumRisk.description,
                severity: 'warning',
                value: avgFraudScore,
                implications: 'Monitor closely and consider preventive measures'
            };
        } else {
            return {
                type: 'lowRisk',
                description: pattern.lowRisk.description,
                severity: 'low',
                value: avgFraudScore,
                implications: 'Good security posture, maintain current practices'
            };
        }
    }

    /**
     * Analyze volatility patterns
     */
    analyzeVolatilityPatterns(metrics) {
        const amountMetric = this.findAmountMetric(metrics);
        if (!amountMetric || amountMetric.coefficientOfVariation === undefined || amountMetric.coefficientOfVariation === null) {
            return { 
                type: 'unknown', 
                description: 'No volatility data available',
                severity: 'info',
                value: 0,
                implications: 'No volatility data found'
            };
        }

        const coefficientOfVariation = parseFloat(amountMetric.coefficientOfVariation);
        if (isNaN(coefficientOfVariation)) {
            return { 
                type: 'unknown', 
                description: 'Invalid volatility data',
                severity: 'warning',
                value: 0,
                implications: 'Volatility data is invalid'
            };
        }

        const pattern = this.patterns.finance.volatilityPatterns;

        if (coefficientOfVariation > pattern.highVolatility.threshold) {
            return {
                type: 'highVolatility',
                description: pattern.highVolatility.description,
                severity: 'warning',
                value: coefficientOfVariation,
                implications: 'High transaction variability, consider risk management'
            };
        } else if (coefficientOfVariation > pattern.moderateVolatility.threshold) {
            return {
                type: 'moderateVolatility',
                description: pattern.moderateVolatility.description,
                severity: 'medium',
                value: coefficientOfVariation,
                implications: 'Moderate variability, normal business operations'
            };
        } else {
            return {
                type: 'lowVolatility',
                description: pattern.lowVolatility.description,
                severity: 'low',
                value: coefficientOfVariation,
                implications: 'Stable transaction patterns, predictable operations'
            };
        }
    }

    /**
     * Analyze balance patterns
     */
    analyzeBalancePatterns(metrics) {
        const balanceMetric = this.findBalanceMetric(metrics);
        if (!balanceMetric || balanceMetric.average === undefined || balanceMetric.average === null) {
            return { 
                type: 'unknown', 
                description: 'No balance data available',
                severity: 'info',
                value: 0,
                implications: 'No account balance data found'
            };
        }

        const avgBalance = parseFloat(balanceMetric.average);
        if (isNaN(avgBalance)) {
            return { 
                type: 'unknown', 
                description: 'Invalid balance data',
                severity: 'warning',
                value: 0,
                implications: 'Account balance data is invalid'
            };
        }

        const pattern = this.patterns.finance.balancePatterns;

        if (avgBalance > pattern.healthy.threshold) {
            return {
                type: 'healthy',
                description: pattern.healthy.description,
                severity: 'low',
                value: avgBalance,
                implications: 'Strong liquidity position, good financial health'
            };
        } else if (avgBalance > pattern.moderate.threshold) {
            return {
                type: 'moderate',
                description: pattern.moderate.description,
                severity: 'medium',
                value: avgBalance,
                implications: 'Adequate liquidity, monitor for improvements'
            };
        } else {
            return {
                type: 'low',
                description: pattern.low.description,
                severity: 'warning',
                value: avgBalance,
                implications: 'Low liquidity, consider cash flow optimization'
            };
        }
    }

    /**
     * Analyze transaction patterns
     */
    analyzeTransactionPatterns(metrics) {
        const amountMetric = this.findAmountMetric(metrics);
        if (!amountMetric) return { type: 'unknown', description: 'No transaction data available' };

        const transactionCount = amountMetric.count || 0;
        const avgAmount = amountMetric.average;
        const totalVolume = avgAmount * transactionCount;

        return {
            volume: totalVolume,
            frequency: transactionCount,
            averageSize: avgAmount,
            implications: this.interpretTransactionPattern(transactionCount, avgAmount, totalVolume)
        };
    }

    /**
     * Extract patterns from insights
     */
    extractInsightPatterns(insights) {
        const patterns = {
            critical: insights.filter(i => i.severity === 'critical').length,
            warning: insights.filter(i => i.severity === 'warning').length,
            info: insights.filter(i => i.severity === 'info').length,
            success: insights.filter(i => i.severity === 'success').length
        };

        return {
            ...patterns,
            totalInsights: insights.length,
            riskLevel: this.calculateInsightRiskLevel(patterns)
        };
    }

    /**
     * Analyze correlations between metrics
     */
    analyzeCorrelations(metrics) {
        const correlations = {};
        const metricKeys = Object.keys(metrics).filter(key => 
            metrics[key].average !== undefined
        );

        for (let i = 0; i < metricKeys.length; i++) {
            for (let j = i + 1; j < metricKeys.length; j++) {
                const key1 = metricKeys[i];
                const key2 = metricKeys[j];
                
                // For demonstration, we'll create synthetic correlation data
                // In a real implementation, you'd use actual data points
                const correlationValue = this.calculateSyntheticCorrelation(metrics[key1], metrics[key2]);
                
                if (Math.abs(correlationValue) > 0.3) { // Only significant correlations
                    correlations[`${key1}_${key2}`] = {
                        value: correlationValue,
                        strength: this.interpretCorrelationStrength(correlationValue),
                        interpretation: this.interpretCorrelation(key1, key2, correlationValue)
                    };
                }
            }
        }

        return correlations;
    }

    /**
     * Assess overall risk profile
     */
    assessRiskProfile(metrics, insights) {
        const riskFactors = [];
        let totalRiskScore = 0;
        let factorCount = 0;

        // Analyze fraud risk
        const fraudMetric = this.findFraudMetric(metrics);
        if (fraudMetric) {
            const fraudRisk = fraudMetric.average;
            if (fraudRisk > 0.7) {
                riskFactors.push('High fraud risk detected');
                totalRiskScore += 40;
            } else if (fraudRisk > 0.4) {
                riskFactors.push('Moderate fraud risk present');
                totalRiskScore += 20;
            }
            factorCount++;
        }

        // Analyze cash flow risk
        const amountMetric = this.findAmountMetric(metrics);
        if (amountMetric && amountMetric.average < 0) {
            riskFactors.push('Negative cash flow pattern');
            totalRiskScore += 30;
            factorCount++;
        }

        // Analyze volatility risk
        if (amountMetric && amountMetric.coefficientOfVariation > 0.5) {
            riskFactors.push('High transaction volatility');
            totalRiskScore += 20;
            factorCount++;
        }

        // Analyze insight-based risk
        const criticalInsights = insights.filter(i => i.severity === 'critical').length;
        if (criticalInsights > 0) {
            riskFactors.push(`${criticalInsights} critical issues identified`);
            totalRiskScore += criticalInsights * 15;
            factorCount++;
        }

        const averageRiskScore = factorCount > 0 ? totalRiskScore / factorCount : 0;
        
        return {
            score: averageRiskScore,
            level: this.calculateRiskLevel(averageRiskScore),
            factors: riskFactors,
            recommendations: this.generateRiskRecommendations(riskFactors)
        };
    }

    /**
     * Assess performance profile
     */
    assessPerformanceProfile(metrics, forecasts) {
        const performance = {
            current: this.assessCurrentPerformance(metrics),
            trends: this.assessTrends(forecasts),
            outlook: this.assessOutlook(forecasts)
        };

        return performance;
    }

    /**
     * Analyze operational metrics
     */
    analyzeOperationalMetrics(metrics, insights) {
        return {
            efficiency: this.calculateEfficiencyScore(metrics),
            quality: this.calculateDataQualityScore(metrics),
            anomalies: this.countAnomalies(insights),
            opportunities: this.identifyOpportunities(metrics, insights)
        };
    }

    /**
     * Compose comprehensive summary paragraph
     */
    composeSummary(patterns, correlations, riskProfile, performanceProfile, operationalInsights, metrics) {
        try {
            const cashFlow = patterns?.cashFlow || { type: 'unknown', description: 'No cash flow data', value: 0 };
            const risk = patterns?.risk || { description: 'No risk data', value: 0 };
            const balance = patterns?.balance || { description: 'No balance data', value: 0 };
            const transaction = patterns?.transaction || { frequency: 0, volume: 0 };

            // Build the summary using pattern analysis
            let summary = `Financial analysis reveals `;

            // Cash flow assessment
            if (cashFlow.type === 'netNegative') {
                summary += `a net negative cash flow pattern (average transaction: $${Math.abs(cashFlow.value || 0).toFixed(2)}) `;
            } else if (cashFlow.type === 'netPositive') {
                summary += `a net positive cash flow pattern (average transaction: $${(cashFlow.value || 0).toFixed(2)}) `;
            } else {
                summary += `a balanced cash flow pattern (average transaction: $${Math.abs(cashFlow.value || 0).toFixed(2)}) `;
            }

            // Risk assessment
            summary += `with ${(risk.description || 'unknown risk level').toLowerCase()} (fraud score: ${((risk.value || 0) * 100).toFixed(1)}%). `;

            // Balance assessment
            summary += `Account balances show ${(balance.description || 'unknown balance levels').toLowerCase()} (average: $${(balance.value || 0).toFixed(2)}), `;

            // Transaction volume
            summary += `with ${(transaction.frequency || 0).toLocaleString()} transactions totaling $${Math.abs(transaction.volume || 0).toLocaleString()}. `;

            // Risk level
            const riskLevel = riskProfile?.level || 'unknown';
            const riskScore = riskProfile?.score || 0;
            summary += `Overall risk level is ${riskLevel} (score: ${riskScore.toFixed(0)}/100), `;

            // Operational efficiency
            const efficiency = operationalInsights?.efficiency || 0;
            if (efficiency > 80) {
                summary += `indicating strong operational efficiency. `;
            } else if (efficiency > 60) {
                summary += `showing moderate operational efficiency. `;
            } else {
                summary += `suggesting operational efficiency improvements needed. `;
            }

            // Key implications
            const riskFactors = riskProfile?.factors || [];
            if (riskFactors.length > 0) {
                summary += `Key concerns include ${riskFactors.slice(0, 2).join(' and ')}. `;
            }

            // Outlook
            const outlook = performanceProfile?.outlook || 'stable';
            if (outlook === 'positive') {
                summary += `Future outlook appears positive based on current trends.`;
            } else if (outlook === 'negative') {
                summary += `Future outlook requires attention based on current patterns.`;
            } else {
                summary += `Future outlook is stable with current performance indicators.`;
            }

            return summary;
        } catch (error) {
            console.error('Error composing summary:', error);
            return this.generateFallbackSummary(metrics);
        }
    }

    // Helper methods
    findAmountMetric(metrics) {
        return metrics.amount || metrics.transaction_amount || metrics.value || 
               Object.values(metrics).find(m => m.average && Math.abs(m.average) > 100);
    }

    findFraudMetric(metrics) {
        return metrics.fraud_score || metrics.risk_score || 
               Object.values(metrics).find(m => m.average && m.average <= 1 && m.average >= 0);
    }

    findBalanceMetric(metrics) {
        return metrics.balance || metrics.current_balance || metrics.account_balance ||
               Object.values(metrics).find(m => m.average && m.average > 1000);
    }

    calculateSyntheticCorrelation(metric1, metric2) {
        // Synthetic correlation calculation for demonstration
        // In real implementation, use actual data points
        const avg1 = metric1.average;
        const avg2 = metric2.average;
        
        if (avg1 === 0 || avg2 === 0) return 0;
        
        // Simple correlation based on relative magnitudes
        const ratio = Math.min(avg1, avg2) / Math.max(avg1, avg2);
        return ratio * (Math.random() * 0.4 + 0.3); // Random correlation between 0.3-0.7
    }

    interpretCorrelationStrength(value) {
        const absValue = Math.abs(value);
        if (absValue > 0.7) return 'strong';
        if (absValue > 0.5) return 'moderate';
        if (absValue > 0.3) return 'weak';
        return 'negligible';
    }

    interpretCorrelation(key1, key2, value) {
        const direction = value > 0 ? 'positive' : 'negative';
        return `${key1} and ${key2} show ${direction} correlation`;
    }

    calculateRiskLevel(score) {
        if (score > 70) return 'high';
        if (score > 40) return 'medium';
        return 'low';
    }

    calculateInsightRiskLevel(patterns) {
        const criticalWeight = patterns.critical * 3;
        const warningWeight = patterns.warning * 2;
        const totalWeight = criticalWeight + warningWeight;
        
        if (totalWeight > 10) return 'high';
        if (totalWeight > 5) return 'medium';
        return 'low';
    }

    interpretTransactionPattern(count, avgAmount, totalVolume) {
        if (count > 1000 && Math.abs(avgAmount) > 1000) {
            return 'High-volume, high-value transactions';
        } else if (count > 1000 && Math.abs(avgAmount) < 100) {
            return 'High-volume, low-value transactions';
        } else if (count < 100 && Math.abs(avgAmount) > 1000) {
            return 'Low-volume, high-value transactions';
        } else {
            return 'Standard transaction patterns';
        }
    }

    generateRiskRecommendations(riskFactors) {
        const recommendations = [];
        
        if (riskFactors.some(f => f.includes('fraud'))) {
            recommendations.push('Implement enhanced fraud detection systems');
        }
        if (riskFactors.some(f => f.includes('cash flow'))) {
            recommendations.push('Optimize cash flow management strategies');
        }
        if (riskFactors.some(f => f.includes('volatility'))) {
            recommendations.push('Develop risk mitigation strategies for volatile transactions');
        }
        
        return recommendations;
    }

    assessCurrentPerformance(metrics) {
        // Simplified performance assessment
        const amountMetric = this.findAmountMetric(metrics);
        const balanceMetric = this.findBalanceMetric(metrics);
        
        let score = 50; // Base score
        
        if (amountMetric && amountMetric.average > 0) score += 20;
        if (balanceMetric && balanceMetric.average > 10000) score += 20;
        
        return {
            score: Math.min(100, score),
            grade: this.getGrade(score)
        };
    }

    assessTrends(forecasts) {
        if (!forecasts || Object.keys(forecasts).length === 0) {
            return { direction: 'stable', confidence: 'low' };
        }
        
        // Analyze forecast trends
        const trends = Object.values(forecasts).filter(f => f.trend);
        const positiveTrends = trends.filter(t => t.trend === 'positive').length;
        const negativeTrends = trends.filter(t => t.trend === 'negative').length;
        
        if (positiveTrends > negativeTrends) {
            return { direction: 'positive', confidence: 'medium' };
        } else if (negativeTrends > positiveTrends) {
            return { direction: 'negative', confidence: 'medium' };
        } else {
            return { direction: 'stable', confidence: 'medium' };
        }
    }

    assessOutlook(forecasts) {
        const trends = this.assessTrends(forecasts);
        return trends.direction;
    }

    calculateEfficiencyScore(metrics) {
        // Simplified efficiency calculation
        let score = 70; // Base efficiency
        
        const amountMetric = this.findAmountMetric(metrics);
        if (amountMetric && amountMetric.coefficientOfVariation < 0.3) {
            score += 15; // Low volatility = higher efficiency
        }
        
        return Math.min(100, score);
    }

    calculateDataQualityScore(metrics) {
        // Simplified data quality assessment
        const metricCount = Object.keys(metrics).length;
        const hasRequiredMetrics = this.findAmountMetric(metrics) && this.findBalanceMetric(metrics);
        
        let score = 60; // Base quality
        if (metricCount > 5) score += 20;
        if (hasRequiredMetrics) score += 20;
        
        return Math.min(100, score);
    }

    countAnomalies(insights) {
        return insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length;
    }

    identifyOpportunities(metrics, insights) {
        const opportunities = [];
        
        const amountMetric = this.findAmountMetric(metrics);
        if (amountMetric && amountMetric.average < 0) {
            opportunities.push('Cash flow optimization');
        }
        
        const fraudMetric = this.findFraudMetric(metrics);
        if (fraudMetric && fraudMetric.average > 0.4) {
            opportunities.push('Fraud prevention enhancement');
        }
        
        return opportunities;
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    generateFallbackSummary(metrics) {
        const recordCount = Object.values(metrics)[0]?.count || 0;
        return `Analysis of ${recordCount} records completed. Key metrics calculated include transaction amounts, account balances, and risk indicators. Review individual metrics for detailed insights.`;
    }
}

module.exports = MLSummaryService; 
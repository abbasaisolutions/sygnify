const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

/**
 * AI-Powered Insight Engine
 * Generates sophisticated business insights and recommendations
 */
class AIInsightEngine {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.insightTemplates = this.loadInsightTemplates();
        this.analysisRules = this.loadAnalysisRules();
        this.recommendationEngine = this.initializeRecommendationEngine();
    }

    loadInsightTemplates() {
        return {
            finance: {
                cashFlow: {
                    positive: "Strong positive cash flow of ${amount} indicates healthy financial position",
                    negative: "Negative cash flow of ${amount} requires attention to liquidity management",
                    balanced: "Balanced cash flow pattern with ${positive} inflows and ${negative} outflows",
                    volatile: "Volatile cash flow pattern with ${volatility}% coefficient of variation"
                },
                profitability: {
                    high: "Excellent profitability with ${margin}% profit margin",
                    medium: "Moderate profitability at ${margin}% profit margin",
                    low: "Low profitability at ${margin}% profit margin needs improvement",
                    negative: "Negative profitability requires immediate attention"
                },
                risk: {
                    low: "Low risk profile with ${score}/100 risk score",
                    medium: "Medium risk level (${score}/100) requires monitoring",
                    high: "High risk level (${score}/100) needs immediate mitigation",
                    critical: "Critical risk level (${score}/100) requires urgent action"
                },
                efficiency: {
                    high: "High operational efficiency with ${score}/100 efficiency score",
                    medium: "Moderate efficiency (${score}/100) with room for improvement",
                    low: "Low efficiency (${score}/100) requires process optimization"
                },
                trends: {
                    improving: "Positive trend with ${slope}% monthly growth rate",
                    declining: "Declining trend with ${slope}% monthly decrease",
                    stable: "Stable performance with minimal variation",
                    cyclical: "Cyclical pattern detected with ${period} period"
                }
            }
        };
    }

    loadAnalysisRules() {
        return {
            finance: {
                cashFlowAnalysis: {
                    thresholds: {
                        positive: 1000,
                        negative: -1000,
                        volatile: 0.5
                    },
                    weights: {
                        netFlow: 0.4,
                        consistency: 0.3,
                        volume: 0.3
                    }
                },
                profitabilityAnalysis: {
                    thresholds: {
                        excellent: 0.25,
                        good: 0.15,
                        moderate: 0.10,
                        poor: 0.05
                    }
                },
                riskAnalysis: {
                    thresholds: {
                        low: 30,
                        medium: 60,
                        high: 80
                    },
                    factors: {
                        volatility: 0.3,
                        negativeRatio: 0.25,
                        concentration: 0.25,
                        dataQuality: 0.2
                    }
                }
            }
        };
    }

    initializeRecommendationEngine() {
        return {
            cashFlow: {
                positive: [
                    "Consider investment opportunities with excess cash",
                    "Implement cash management strategies",
                    "Explore expansion opportunities"
                ],
                negative: [
                    "Review and optimize expense structure",
                    "Implement cash flow forecasting",
                    "Consider financing options",
                    "Negotiate payment terms with suppliers"
                ],
                volatile: [
                    "Implement cash flow smoothing strategies",
                    "Establish emergency reserves",
                    "Improve cash flow forecasting",
                    "Diversify revenue streams"
                ]
            },
            profitability: {
                high: [
                    "Maintain current operational excellence",
                    "Consider strategic investments",
                    "Explore market expansion opportunities"
                ],
                medium: [
                    "Identify cost optimization opportunities",
                    "Review pricing strategies",
                    "Improve operational efficiency"
                ],
                low: [
                    "Conduct comprehensive cost analysis",
                    "Review pricing and margin strategies",
                    "Implement efficiency improvements",
                    "Consider business model optimization"
                ]
            },
            risk: {
                low: [
                    "Maintain current risk management practices",
                    "Continue monitoring key risk indicators"
                ],
                medium: [
                    "Strengthen risk monitoring systems",
                    "Develop contingency plans",
                    "Review risk mitigation strategies"
                ],
                high: [
                    "Implement immediate risk controls",
                    "Develop comprehensive risk management plan",
                    "Consider risk transfer strategies",
                    "Establish crisis management procedures"
                ]
            }
        };
    }

    /**
     * Generate comprehensive AI insights
     */
    async generateInsights(processedData, financialMetrics) {
        try {
            const insights = {
                cashFlow: this.analyzeCashFlow(processedData, financialMetrics),
                profitability: this.analyzeProfitability(processedData, financialMetrics),
                risk: this.analyzeRisk(processedData, financialMetrics),
                efficiency: this.analyzeEfficiency(processedData, financialMetrics),
                trends: this.analyzeTrends(processedData, financialMetrics),
                anomalies: this.detectAnomalies(processedData, financialMetrics),
                opportunities: this.identifyOpportunities(processedData, financialMetrics),
                recommendations: this.generateRecommendations(processedData, financialMetrics),
                summary: this.generateExecutiveSummary(processedData, financialMetrics)
            };

            return {
                success: true,
                insights,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    domain: this.domain,
                    analysisDepth: 'comprehensive',
                    confidence: this.calculateConfidence(insights)
                }
            };
        } catch (error) {
            console.error('AI Insight generation failed:', error);
            return {
                success: false,
                error: error.message,
                insights: this.generateFallbackInsights(processedData, financialMetrics)
            };
        }
    }

    analyzeCashFlow(processedData, financialMetrics) {
        const insights = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const netCashFlow = metrics.positiveSum - metrics.negativeSum;
            const cashFlowRatio = metrics.positiveCount / metrics.count;
            const volatility = this.calculateVolatility(metrics);
            
            // Net cash flow analysis
            if (netCashFlow > this.analysisRules.finance.cashFlowAnalysis.thresholds.positive) {
                insights.push({
                    type: 'positive',
                    category: 'cash_flow',
                    title: 'Strong Positive Cash Flow',
                    description: this.insightTemplates.finance.cashFlow.positive
                        .replace('${amount}', `$${netCashFlow.toLocaleString()}`),
                    metrics: {
                        netCashFlow,
                        positiveRatio: cashFlowRatio,
                        volatility
                    },
                    impact: 'high',
                    confidence: 'high'
                });
            } else if (netCashFlow < this.analysisRules.finance.cashFlowAnalysis.thresholds.negative) {
                insights.push({
                    type: 'warning',
                    category: 'cash_flow',
                    title: 'Negative Cash Flow Detected',
                    description: this.insightTemplates.finance.cashFlow.negative
                        .replace('${amount}', `$${Math.abs(netCashFlow).toLocaleString()}`),
                    metrics: {
                        netCashFlow,
                        negativeRatio: 1 - cashFlowRatio,
                        volatility
                    },
                    impact: 'high',
                    confidence: 'high'
                });
            } else {
                insights.push({
                    type: 'neutral',
                    category: 'cash_flow',
                    title: 'Balanced Cash Flow',
                    description: this.insightTemplates.finance.cashFlow.balanced
                        .replace('${positive}', `$${metrics.positiveSum.toLocaleString()}`)
                        .replace('${negative}', `$${metrics.negativeSum.toLocaleString()}`),
                    metrics: {
                        netCashFlow,
                        positiveSum: metrics.positiveSum,
                        negativeSum: metrics.negativeSum
                    },
                    impact: 'medium',
                    confidence: 'high'
                });
            }

            // Volatility analysis
            if (volatility > this.analysisRules.finance.cashFlowAnalysis.thresholds.volatile) {
                insights.push({
                    type: 'warning',
                    category: 'volatility',
                    title: 'High Cash Flow Volatility',
                    description: this.insightTemplates.finance.cashFlow.volatile
                        .replace('${volatility}', (volatility * 100).toFixed(1)),
                    metrics: { volatility },
                    impact: 'medium',
                    confidence: 'high'
                });
            }
        });

        return insights;
    }

    analyzeProfitability(processedData, financialMetrics) {
        const insights = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const totalRevenue = metrics.positiveSum;
            const totalExpenses = metrics.negativeSum;
            const netProfit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            
            const thresholds = this.analysisRules.finance.profitabilityAnalysis.thresholds;
            
            if (profitMargin > thresholds.excellent * 100) {
                insights.push({
                    type: 'positive',
                    category: 'profitability',
                    title: 'Excellent Profitability',
                    description: this.insightTemplates.finance.profitability.high
                        .replace('${margin}', profitMargin.toFixed(1)),
                    metrics: {
                        profitMargin,
                        netProfit,
                        totalRevenue,
                        totalExpenses
                    },
                    impact: 'high',
                    confidence: 'high'
                });
            } else if (profitMargin > thresholds.good * 100) {
                insights.push({
                    type: 'positive',
                    category: 'profitability',
                    title: 'Good Profitability',
                    description: this.insightTemplates.finance.profitability.medium
                        .replace('${margin}', profitMargin.toFixed(1)),
                    metrics: {
                        profitMargin,
                        netProfit,
                        totalRevenue,
                        totalExpenses
                    },
                    impact: 'medium',
                    confidence: 'high'
                });
            } else if (profitMargin > thresholds.moderate * 100) {
                insights.push({
                    type: 'warning',
                    category: 'profitability',
                    title: 'Moderate Profitability',
                    description: this.insightTemplates.finance.profitability.low
                        .replace('${margin}', profitMargin.toFixed(1)),
                    metrics: {
                        profitMargin,
                        netProfit,
                        totalRevenue,
                        totalExpenses
                    },
                    impact: 'medium',
                    confidence: 'high'
                });
            } else if (profitMargin > thresholds.poor * 100) {
                insights.push({
                    type: 'warning',
                    category: 'profitability',
                    title: 'Low Profitability',
                    description: this.insightTemplates.finance.profitability.low
                        .replace('${margin}', profitMargin.toFixed(1)),
                    metrics: {
                        profitMargin,
                        netProfit,
                        totalRevenue,
                        totalExpenses
                    },
                    impact: 'high',
                    confidence: 'high'
                });
            } else {
                insights.push({
                    type: 'critical',
                    category: 'profitability',
                    title: 'Negative Profitability',
                    description: this.insightTemplates.finance.profitability.negative,
                    metrics: {
                        profitMargin,
                        netProfit,
                        totalRevenue,
                        totalExpenses
                    },
                    impact: 'critical',
                    confidence: 'high'
                });
            }
        });

        return insights;
    }

    analyzeRisk(processedData, financialMetrics) {
        const insights = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const riskScore = this.calculateRiskScore(metrics, processedData);
            const riskLevel = this.determineRiskLevel(riskScore);
            
            insights.push({
                type: riskLevel === 'low' ? 'positive' : riskLevel === 'medium' ? 'warning' : 'critical',
                category: 'risk',
                title: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk Level`,
                description: this.insightTemplates.finance.risk[riskLevel]
                    .replace('${score}', riskScore.toFixed(0)),
                metrics: {
                    riskScore,
                    riskLevel,
                    volatility: this.calculateVolatility(metrics),
                    negativeRatio: metrics.negativeCount / metrics.count,
                    concentration: this.calculateConcentration(metrics)
                },
                impact: riskLevel === 'low' ? 'low' : riskLevel === 'medium' ? 'medium' : 'high',
                confidence: 'high'
            });
        });

        return insights;
    }

    analyzeEfficiency(processedData, financialMetrics) {
        const insights = [];
        
        // Calculate efficiency metrics
        const efficiencyScore = this.calculateEfficiencyScore(processedData, financialMetrics);
        
        if (efficiencyScore > 80) {
            insights.push({
                type: 'positive',
                category: 'efficiency',
                title: 'High Operational Efficiency',
                description: this.insightTemplates.finance.efficiency.high
                    .replace('${score}', efficiencyScore.toFixed(0)),
                metrics: { efficiencyScore },
                impact: 'medium',
                confidence: 'high'
            });
        } else if (efficiencyScore > 60) {
            insights.push({
                type: 'neutral',
                category: 'efficiency',
                title: 'Moderate Efficiency',
                description: this.insightTemplates.finance.efficiency.medium
                    .replace('${score}', efficiencyScore.toFixed(0)),
                metrics: { efficiencyScore },
                impact: 'medium',
                confidence: 'high'
            });
        } else {
            insights.push({
                type: 'warning',
                category: 'efficiency',
                title: 'Low Efficiency',
                description: this.insightTemplates.finance.efficiency.low
                    .replace('${score}', efficiencyScore.toFixed(0)),
                metrics: { efficiencyScore },
                impact: 'high',
                confidence: 'high'
            });
        }

        return insights;
    }

    analyzeTrends(processedData, financialMetrics) {
        const insights = [];
        
        // Analyze trends in amount columns
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const trend = this.calculateTrend(processedData, column);
            
            if (trend.slope > 0.05 && trend.confidence > 0.7) {
                insights.push({
                    type: 'positive',
                    category: 'trend',
                    title: 'Positive Trend Detected',
                    description: this.insightTemplates.finance.trends.improving
                        .replace('${slope}', (trend.slope * 100).toFixed(1)),
                    metrics: {
                        slope: trend.slope,
                        confidence: trend.confidence,
                        direction: 'increasing'
                    },
                    impact: 'medium',
                    confidence: trend.confidence > 0.8 ? 'high' : 'medium'
                });
            } else if (trend.slope < -0.05 && trend.confidence > 0.7) {
                insights.push({
                    type: 'warning',
                    category: 'trend',
                    title: 'Declining Trend Detected',
                    description: this.insightTemplates.finance.trends.declining
                        .replace('${slope}', Math.abs(trend.slope * 100).toFixed(1)),
                    metrics: {
                        slope: trend.slope,
                        confidence: trend.confidence,
                        direction: 'decreasing'
                    },
                    impact: 'medium',
                    confidence: trend.confidence > 0.8 ? 'high' : 'medium'
                });
            } else {
                insights.push({
                    type: 'neutral',
                    category: 'trend',
                    title: 'Stable Performance',
                    description: this.insightTemplates.finance.trends.stable,
                    metrics: {
                        slope: trend.slope,
                        confidence: trend.confidence,
                        direction: 'stable'
                    },
                    impact: 'low',
                    confidence: 'medium'
                });
            }
        });

        return insights;
    }

    detectAnomalies(processedData, financialMetrics) {
        const insights = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const anomalies = this.findAnomalies(processedData, column);
            
            if (anomalies.length > 0) {
                insights.push({
                    type: 'warning',
                    category: 'anomalies',
                    title: 'Anomalies Detected',
                    description: `${anomalies.length} anomalies detected in ${column}`,
                    metrics: {
                        anomalyCount: anomalies.length,
                        anomalyPercentage: (anomalies.length / metrics.count) * 100,
                        anomalies: anomalies.slice(0, 5) // Show first 5 anomalies
                    },
                    impact: anomalies.length > 5 ? 'high' : 'medium',
                    confidence: 'high'
                });
            }
        });

        return insights;
    }

    identifyOpportunities(processedData, financialMetrics) {
        const opportunities = [];
        
        // Identify improvement opportunities
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const profitMargin = metrics.positiveSum > 0 ? 
                ((metrics.positiveSum - metrics.negativeSum) / metrics.positiveSum) * 100 : 0;
            
            if (profitMargin < 15) {
                opportunities.push({
                    type: 'opportunity',
                    category: 'profitability_improvement',
                    title: 'Profitability Enhancement Opportunity',
                    description: `Current profit margin of ${profitMargin.toFixed(1)}% can be improved`,
                    metrics: { currentMargin: profitMargin, targetMargin: 15 },
                    impact: 'high',
                    confidence: 'high'
                });
            }
            
            if (metrics.negativeCount / metrics.count > 0.6) {
                opportunities.push({
                    type: 'opportunity',
                    category: 'expense_optimization',
                    title: 'Expense Optimization Opportunity',
                    description: `${(metrics.negativeCount / metrics.count * 100).toFixed(1)}% of transactions are expenses`,
                    metrics: { expenseRatio: metrics.negativeCount / metrics.count },
                    impact: 'medium',
                    confidence: 'high'
                });
            }
        });

        return opportunities;
    }

    generateRecommendations(processedData, financialMetrics) {
        const recommendations = [];
        
        // Generate recommendations based on insights
        const allInsights = [
            ...this.analyzeCashFlow(processedData, financialMetrics),
            ...this.analyzeProfitability(processedData, financialMetrics),
            ...this.analyzeRisk(processedData, financialMetrics)
        ];
        
        allInsights.forEach(insight => {
            const categoryRecommendations = this.recommendationEngine[insight.category];
            
            if (categoryRecommendations) {
                const applicableRecommendations = this.getApplicableRecommendations(insight, categoryRecommendations);
                
                applicableRecommendations.forEach(rec => {
                    recommendations.push({
                        priority: insight.impact === 'critical' ? 'high' : insight.impact === 'high' ? 'medium' : 'low',
                        category: insight.category,
                        description: rec,
                        action: this.generateActionPlan(rec),
                        effort: this.estimateEffort(rec),
                        impact: insight.impact,
                        confidence: insight.confidence
                    });
                });
            }
        });

        // Sort by priority and impact
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            return impactOrder[b.impact] - impactOrder[a.impact];
        }).slice(0, 10); // Return top 10 recommendations
    }

    generateExecutiveSummary(processedData, financialMetrics) {
        const summary = {
            overview: this.generateOverview(processedData, financialMetrics),
            keyFindings: this.extractKeyFindings(processedData, financialMetrics),
            riskAssessment: this.generateRiskSummary(processedData, financialMetrics),
            opportunities: this.generateOpportunitySummary(processedData, financialMetrics),
            recommendations: this.generateTopRecommendations(processedData, financialMetrics)
        };

        return summary;
    }

    // Helper methods
    calculateVolatility(metrics) {
        // Simplified volatility calculation
        const values = [metrics.average, metrics.min, metrics.max];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance) / Math.abs(mean);
    }

    calculateRiskScore(metrics, processedData) {
        const factors = this.analysisRules.finance.riskAnalysis.factors;
        const weights = this.analysisRules.finance.riskAnalysis.factors;
        
        const volatilityRisk = this.calculateVolatility(metrics) * weights.volatility;
        const negativeRatioRisk = (metrics.negativeCount / metrics.count) * weights.negativeRatio;
        const concentrationRisk = this.calculateConcentration(metrics) * weights.concentration;
        const dataQualityRisk = (1 - processedData.quality.score) * weights.dataQuality;
        
        return Math.min(100, (volatilityRisk + negativeRatioRisk + concentrationRisk + dataQualityRisk) * 100);
    }

    calculateConcentration(metrics) {
        // Simplified concentration calculation
        return metrics.max / Math.abs(metrics.average);
    }

    determineRiskLevel(score) {
        const thresholds = this.analysisRules.finance.riskAnalysis.thresholds;
        
        if (score <= thresholds.low) return 'low';
        if (score <= thresholds.medium) return 'medium';
        if (score <= thresholds.high) return 'high';
        return 'critical';
    }

    calculateEfficiencyScore(processedData, financialMetrics) {
        let score = 70; // Base score
        
        // Adjust based on data quality
        score += processedData.quality.score * 20;
        
        // Adjust based on transaction volume
        const totalTransactions = Object.values(financialMetrics.amounts || {}).reduce((sum, metrics) => sum + metrics.count, 0);
        if (totalTransactions > 100) score += 10;
        
        return Math.min(100, score);
    }

    calculateTrend(data, column) {
        const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (values.length < 3) {
            return { slope: 0, confidence: 0 };
        }
        
        const x = Array.from({ length: values.length }, (_, i) => i);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        
        const numerator = x.reduce((sum, xi, i) => sum + (xi - x.length/2) * (values[i] - mean), 0);
        const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - x.length/2, 2), 0);
        
        const slope = denominator !== 0 ? numerator / denominator : 0;
        const rSquared = this.calculateRSquared(x, values, { m: slope, b: mean });
        
        return {
            slope: slope / Math.abs(mean), // Normalize by mean
            confidence: rSquared
        };
    }

    calculateRSquared(x, y, regression) {
        const yPred = x.map(xi => regression.m * xi + regression.b);
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        
        const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
        const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        
        return ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    }

    findAnomalies(data, column) {
        const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (values.length < 3) return [];
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
        
        return values.filter(value => Math.abs(value - mean) > 2 * std);
    }

    getApplicableRecommendations(insight, recommendations) {
        if (insight.type === 'positive') {
            return recommendations.positive || [];
        } else if (insight.type === 'warning') {
            return recommendations.negative || recommendations.volatile || [];
        } else if (insight.type === 'critical') {
            return recommendations.negative || recommendations.volatile || [];
        }
        
        return [];
    }

    generateActionPlan(recommendation) {
        const actionPlans = {
            'Consider investment opportunities with excess cash': 'Develop investment strategy and identify suitable opportunities',
            'Review and optimize expense structure': 'Conduct expense audit and identify cost reduction opportunities',
            'Implement cash flow forecasting': 'Set up automated cash flow forecasting system',
            'Consider financing options': 'Evaluate various financing alternatives and their costs',
            'Negotiate payment terms with suppliers': 'Review current payment terms and negotiate better conditions',
            'Implement cash flow smoothing strategies': 'Develop strategies to reduce cash flow volatility',
            'Establish emergency reserves': 'Set aside funds for emergency situations',
            'Improve cash flow forecasting': 'Enhance forecasting accuracy with better data and models',
            'Diversify revenue streams': 'Identify and develop new revenue sources',
            'Maintain current operational excellence': 'Continue current best practices and monitor performance',
            'Consider strategic investments': 'Evaluate strategic investment opportunities',
            'Explore market expansion opportunities': 'Research and plan market expansion strategies',
            'Identify cost optimization opportunities': 'Analyze costs and identify optimization areas',
            'Review pricing strategies': 'Evaluate current pricing and consider adjustments',
            'Improve operational efficiency': 'Implement efficiency improvement initiatives',
            'Conduct comprehensive cost analysis': 'Perform detailed cost analysis and identify savings',
            'Review pricing and margin strategies': 'Analyze pricing and margin optimization opportunities',
            'Implement efficiency improvements': 'Execute efficiency improvement programs',
            'Consider business model optimization': 'Evaluate and optimize business model',
            'Maintain current risk management practices': 'Continue current risk management approach',
            'Continue monitoring key risk indicators': 'Maintain monitoring of key risk metrics',
            'Strengthen risk monitoring systems': 'Enhance risk monitoring and reporting systems',
            'Develop contingency plans': 'Create comprehensive contingency planning',
            'Review risk mitigation strategies': 'Evaluate and update risk mitigation approaches',
            'Implement immediate risk controls': 'Deploy immediate risk control measures',
            'Develop comprehensive risk management plan': 'Create detailed risk management strategy',
            'Consider risk transfer strategies': 'Evaluate insurance and other risk transfer options',
            'Establish crisis management procedures': 'Develop crisis management protocols'
        };
        
        return actionPlans[recommendation] || 'Implement recommended action with appropriate planning';
    }

    estimateEffort(recommendation) {
        const effortEstimates = {
            'Consider investment opportunities with excess cash': 'high',
            'Review and optimize expense structure': 'medium',
            'Implement cash flow forecasting': 'medium',
            'Consider financing options': 'high',
            'Negotiate payment terms with suppliers': 'medium',
            'Implement cash flow smoothing strategies': 'high',
            'Establish emergency reserves': 'low',
            'Improve cash flow forecasting': 'medium',
            'Diversify revenue streams': 'high',
            'Maintain current operational excellence': 'low',
            'Consider strategic investments': 'high',
            'Explore market expansion opportunities': 'high',
            'Identify cost optimization opportunities': 'medium',
            'Review pricing strategies': 'medium',
            'Improve operational efficiency': 'medium',
            'Conduct comprehensive cost analysis': 'high',
            'Review pricing and margin strategies': 'medium',
            'Implement efficiency improvements': 'medium',
            'Consider business model optimization': 'high',
            'Maintain current risk management practices': 'low',
            'Continue monitoring key risk indicators': 'low',
            'Strengthen risk monitoring systems': 'medium',
            'Develop contingency plans': 'high',
            'Review risk mitigation strategies': 'medium',
            'Implement immediate risk controls': 'high',
            'Develop comprehensive risk management plan': 'high',
            'Consider risk transfer strategies': 'medium',
            'Establish crisis management procedures': 'high'
        };
        
        return effortEstimates[recommendation] || 'medium';
    }

    calculateConfidence(insights) {
        const allInsights = [
            ...(insights.cashFlow || []),
            ...(insights.profitability || []),
            ...(insights.risk || []),
            ...(insights.efficiency || []),
            ...(insights.trends || [])
        ];
        
        if (allInsights.length === 0) return 'low';
        
        const highConfidence = allInsights.filter(insight => insight.confidence === 'high').length;
        const confidenceRatio = highConfidence / allInsights.length;
        
        if (confidenceRatio > 0.8) return 'high';
        if (confidenceRatio > 0.6) return 'medium';
        return 'low';
    }

    generateOverview(processedData, financialMetrics) {
        return {
            totalRecords: processedData.metadata.totalRecords,
            dataQuality: Math.round(processedData.quality.score * 100),
            financialMetrics: Object.keys(financialMetrics.amounts || {}).length,
            analysisDepth: 'comprehensive',
            confidence: this.calculateConfidence({})
        };
    }

    extractKeyFindings(processedData, financialMetrics) {
        const findings = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const netCashFlow = metrics.positiveSum - metrics.negativeSum;
            const profitMargin = metrics.positiveSum > 0 ? 
                ((metrics.positiveSum - metrics.negativeSum) / metrics.positiveSum) * 100 : 0;
            
            findings.push({
                metric: column,
                netCashFlow,
                profitMargin,
                transactionCount: metrics.count,
                averageTransaction: metrics.average
            });
        });
        
        return findings;
    }

    generateRiskSummary(processedData, financialMetrics) {
        const risks = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const riskScore = this.calculateRiskScore(metrics, processedData);
            risks.push({
                column,
                riskScore,
                riskLevel: this.determineRiskLevel(riskScore),
                volatility: this.calculateVolatility(metrics)
            });
        });
        
        return risks;
    }

    generateOpportunitySummary(processedData, financialMetrics) {
        const opportunities = [];
        
        Object.entries(financialMetrics.amounts || {}).forEach(([column, metrics]) => {
            const profitMargin = metrics.positiveSum > 0 ? 
                ((metrics.positiveSum - metrics.negativeSum) / metrics.positiveSum) * 100 : 0;
            
            if (profitMargin < 15) {
                opportunities.push({
                    column,
                    currentMargin: profitMargin,
                    improvementPotential: 15 - profitMargin
                });
            }
        });
        
        return opportunities;
    }

    generateTopRecommendations(processedData, financialMetrics) {
        const recommendations = this.generateRecommendations(processedData, financialMetrics);
        return recommendations.slice(0, 5);
    }

    generateFallbackInsights(processedData, financialMetrics) {
        return {
            cashFlow: [{
                type: 'neutral',
                category: 'cash_flow',
                title: 'Analysis Unavailable',
                description: 'Unable to analyze cash flow patterns due to insufficient data',
                impact: 'low',
                confidence: 'low'
            }],
            profitability: [],
            risk: [],
            efficiency: [],
            trends: [],
            anomalies: [],
            opportunities: [],
            recommendations: [{
                priority: 'medium',
                category: 'general',
                description: 'Improve data quality for better analysis',
                action: 'Collect more comprehensive data',
                effort: 'medium',
                impact: 'medium',
                confidence: 'low'
            }],
            summary: {
                overview: { totalRecords: 0, dataQuality: 0 },
                keyFindings: [],
                riskAssessment: [],
                opportunities: [],
                recommendations: []
            }
        };
    }
}

module.exports = AIInsightEngine; 
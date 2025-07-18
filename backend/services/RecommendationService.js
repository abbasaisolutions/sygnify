const { mean, std } = require('simple-statistics');

/**
 * Enhanced Recommendation Service with Data-Driven Triggers
 * Links recommendations to specific metrics and thresholds
 */
class RecommendationService {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.domainConfig = this.loadDomainConfig();
        this.recommendationTemplates = this.loadRecommendationTemplates();
    }

    loadDomainConfig() {
        const configs = {
            finance: {
                thresholds: {
                    fraud: {
                        low: 0.3,
                        medium: 0.5,
                        high: 0.7,
                        critical: 0.8
                    },
                    volatility: {
                        low: 0.2,
                        medium: 0.4,
                        high: 0.6
                    },
                    liquidity: {
                        poor: 0.3,
                        fair: 0.6,
                        good: 0.8
                    },
                    profitability: {
                        poor: -0.1,
                        fair: 0.05,
                        good: 0.15
                    }
                },
                triggers: {
                    fraud_detection: {
                        condition: 'fraud_score > 0.45',
                        priority: 'high',
                        impact: 'high'
                    },
                    liquidity_management: {
                        condition: 'liquidity_ratio < 0.6',
                        priority: 'medium',
                        impact: 'high'
                    },
                    cost_optimization: {
                        condition: 'expense_ratio > 0.8',
                        priority: 'medium',
                        impact: 'medium'
                    }
                }
            },
            healthcare: {
                thresholds: {
                    cost: { low: 1000, medium: 5000, high: 10000 },
                    satisfaction: { low: 6, medium: 7, high: 8 }
                },
                triggers: {
                    cost_reduction: { condition: 'treatment_cost > 5000', priority: 'high' },
                    quality_improvement: { condition: 'satisfaction < 7', priority: 'medium' }
                }
            },
            retail: {
                thresholds: {
                    sales: { low: 100, medium: 500, high: 1000 },
                    inventory: { low: 10, medium: 50, high: 100 }
                },
                triggers: {
                    inventory_optimization: { condition: 'inventory_turnover < 5', priority: 'medium' },
                    sales_improvement: { condition: 'sales_amount < 500', priority: 'high' }
                }
            }
        };
        return configs[domain] || configs.finance;
    }

    loadRecommendationTemplates() {
        return {
            fraud: {
                high_risk: {
                    title: 'Implement Advanced Fraud Detection System',
                    description: 'Deploy AI-powered fraud detection with real-time monitoring',
                    triggered_by: 'Average fraud score > 0.7 (High Risk)',
                    priority: 'critical',
                    impact: 'high',
                    effort: 'medium',
                    timeline: '2-4 weeks',
                    metrics: ['fraud_score', 'transaction_amount'],
                    expected_outcome: 'Reduce fraud incidents by 60-80%'
                },
                medium_risk: {
                    title: 'Enhance Fraud Monitoring Procedures',
                    description: 'Implement additional fraud screening and alert mechanisms',
                    triggered_by: 'Average fraud score > 0.5 (Medium Risk)',
                    priority: 'high',
                    impact: 'medium',
                    effort: 'low',
                    timeline: '1-2 weeks',
                    metrics: ['fraud_score'],
                    expected_outcome: 'Reduce fraud incidents by 30-50%'
                }
            },
            liquidity: {
                poor: {
                    title: 'Implement Cash Flow Management System',
                    description: 'Deploy automated cash flow monitoring and forecasting',
                    triggered_by: 'Liquidity ratio < 0.3 (Poor)',
                    priority: 'critical',
                    impact: 'high',
                    effort: 'high',
                    timeline: '4-6 weeks',
                    metrics: ['account_balance', 'transaction_amount'],
                    expected_outcome: 'Improve cash flow visibility by 80%'
                },
                fair: {
                    title: 'Optimize Working Capital Management',
                    description: 'Review and optimize accounts receivable and payable processes',
                    triggered_by: 'Liquidity ratio < 0.6 (Fair)',
                    priority: 'medium',
                    impact: 'medium',
                    effort: 'medium',
                    timeline: '2-3 weeks',
                    metrics: ['account_balance'],
                    expected_outcome: 'Improve working capital efficiency by 20%'
                }
            },
            profitability: {
                poor: {
                    title: 'Conduct Cost Structure Analysis',
                    description: 'Analyze and optimize operational costs and revenue streams',
                    triggered_by: 'Profitability ratio < -0.1 (Poor)',
                    priority: 'high',
                    impact: 'high',
                    effort: 'high',
                    timeline: '3-4 weeks',
                    metrics: ['transaction_amount', 'expense_ratio'],
                    expected_outcome: 'Improve profitability by 15-25%'
                },
                fair: {
                    title: 'Revenue Optimization Strategy',
                    description: 'Implement pricing optimization and revenue enhancement initiatives',
                    triggered_by: 'Profitability ratio < 0.05 (Fair)',
                    priority: 'medium',
                    impact: 'medium',
                    effort: 'medium',
                    timeline: '2-3 weeks',
                    metrics: ['transaction_amount'],
                    expected_outcome: 'Increase revenue by 10-15%'
                }
            },
            operational: {
                high_volatility: {
                    title: 'Implement Process Standardization',
                    description: 'Standardize operational processes to reduce variability',
                    triggered_by: 'Transaction volatility > 0.6 (High)',
                    priority: 'medium',
                    impact: 'medium',
                    effort: 'high',
                    timeline: '4-6 weeks',
                    metrics: ['transaction_amount', 'transaction_count'],
                    expected_outcome: 'Reduce process variability by 40%'
                },
                efficiency: {
                    title: 'Automate Transaction Processing',
                    description: 'Implement automated workflows for transaction processing',
                    triggered_by: 'Processing efficiency < 0.7',
                    priority: 'medium',
                    impact: 'high',
                    effort: 'medium',
                    timeline: '3-4 weeks',
                    metrics: ['transaction_count', 'processing_time'],
                    expected_outcome: 'Improve processing efficiency by 50%'
                }
            }
        };
    }

    /**
     * Generate data-driven recommendations with triggers
     * @param {Object} metrics - Computed metrics
     * @param {Array} insights - Generated insights
     * @param {Object} forecasts - Forecasts
     * @param {Object} labels - Smart labels
     * @returns {Object} - Recommendations with triggers and context
     */
    async generateRecommendations(metrics, insights, forecasts, labels) {
        if (!metrics || Object.keys(metrics).length === 0) {
            return { recommendations: [], summary: 'No data available for recommendations' };
        }

        console.log('💡 Generating data-driven recommendations...');

        const recommendations = [];
        const triggers = this.identifyTriggers(metrics, insights, forecasts);
        
        // Generate recommendations based on triggers
        for (const trigger of triggers) {
            const recommendation = this.generateRecommendationFromTrigger(trigger, metrics, forecasts);
            if (recommendation) {
                recommendations.push(recommendation);
            }
        }

        // Add strategic recommendations
        const strategicRecs = this.generateStrategicRecommendations(metrics, insights, forecasts);
        recommendations.push(...strategicRecs);

        // Sort by priority and impact
        recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const impactOrder = { high: 3, medium: 2, low: 1 };
            
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            return impactOrder[b.impact] - impactOrder[a.impact];
        });

        return {
            recommendations,
            summary: this.generateRecommendationSummary(recommendations),
            triggers: triggers,
            metadata: {
                totalRecommendations: recommendations.length,
                criticalCount: recommendations.filter(r => r.priority === 'critical').length,
                highCount: recommendations.filter(r => r.priority === 'high').length,
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Identify triggers based on metrics and insights
     */
    identifyTriggers(metrics, insights, forecasts) {
        const triggers = [];

        // Check fraud-related triggers
        const fraudScore = this.getMetricValue(metrics, 'fraud_score');
        if (fraudScore !== null) {
            if (fraudScore > this.domainConfig.thresholds.fraud.critical) {
                triggers.push({
                    type: 'fraud',
                    level: 'critical',
                    metric: 'fraud_score',
                    value: fraudScore,
                    threshold: this.domainConfig.thresholds.fraud.critical,
                    condition: `fraud_score > ${this.domainConfig.thresholds.fraud.critical}`
                });
            } else if (fraudScore > this.domainConfig.thresholds.fraud.high) {
                triggers.push({
                    type: 'fraud',
                    level: 'high',
                    metric: 'fraud_score',
                    value: fraudScore,
                    threshold: this.domainConfig.thresholds.fraud.high,
                    condition: `fraud_score > ${this.domainConfig.thresholds.fraud.high}`
                });
            } else if (fraudScore > this.domainConfig.thresholds.fraud.medium) {
                triggers.push({
                    type: 'fraud',
                    level: 'medium',
                    metric: 'fraud_score',
                    value: fraudScore,
                    threshold: this.domainConfig.thresholds.fraud.medium,
                    condition: `fraud_score > ${this.domainConfig.thresholds.fraud.medium}`
                });
            }
        }

        // Check liquidity triggers
        const balance = this.getMetricValue(metrics, 'balance');
        const amount = this.getMetricValue(metrics, 'amount');
        if (balance !== null && amount !== null) {
            const liquidityRatio = Math.abs(amount) / balance;
            if (liquidityRatio > 0.8) {
                triggers.push({
                    type: 'liquidity',
                    level: 'poor',
                    metric: 'liquidity_ratio',
                    value: liquidityRatio,
                    threshold: 0.8,
                    condition: 'liquidity_ratio > 0.8'
                });
            } else if (liquidityRatio > 0.6) {
                triggers.push({
                    type: 'liquidity',
                    level: 'fair',
                    metric: 'liquidity_ratio',
                    value: liquidityRatio,
                    threshold: 0.6,
                    condition: 'liquidity_ratio > 0.6'
                });
            }
        }

        // Check volatility triggers
        for (const [column, metric] of Object.entries(metrics)) {
            if (metric.coefficientOfVariation > this.domainConfig.thresholds.volatility.high) {
                triggers.push({
                    type: 'operational',
                    level: 'high_volatility',
                    metric: column,
                    value: metric.coefficientOfVariation,
                    threshold: this.domainConfig.thresholds.volatility.high,
                    condition: `volatility > ${this.domainConfig.thresholds.volatility.high}`
                });
            }
        }

        // Check forecast-based triggers
        if (forecasts.fraud && forecasts.fraud.nextMonth.trend === 'increasing') {
            triggers.push({
                type: 'fraud',
                level: 'trending_up',
                metric: 'fraud_forecast',
                value: forecasts.fraud.nextMonth.value,
                condition: 'Fraud trend is increasing'
            });
        }

        return triggers;
    }

    /**
     * Generate recommendation from trigger
     */
    generateRecommendationFromTrigger(trigger, metrics, forecasts) {
        const template = this.recommendationTemplates[trigger.type]?.[trigger.level];
        if (!template) return null;

        // Calculate effort and timeline based on metrics
        const effort = this.calculateEffort(trigger, metrics);
        const timeline = this.calculateTimeline(trigger, effort);
        const impact = this.calculateImpact(trigger, metrics);

        return {
            title: template.title,
            description: template.description,
            triggered_by: template.triggered_by,
            priority: template.priority,
            impact: impact,
            effort: effort,
            timeline: timeline,
            metrics: template.metrics,
            expected_outcome: template.expected_outcome,
            trigger: {
                type: trigger.type,
                level: trigger.level,
                condition: trigger.condition,
                value: trigger.value,
                threshold: trigger.threshold
            },
            context: this.generateRecommendationContext(trigger, metrics, forecasts),
            implementation_steps: this.generateImplementationSteps(template, trigger)
        };
    }

    /**
     * Generate strategic recommendations
     */
    generateStrategicRecommendations(metrics, insights, forecasts) {
        const recommendations = [];

        // Add general improvement recommendations
        if (Object.keys(metrics).length > 5) {
            recommendations.push({
                title: 'Implement Comprehensive Analytics Dashboard',
                description: 'Deploy real-time analytics dashboard for continuous monitoring',
                triggered_by: 'Multiple metrics available for analysis',
                priority: 'medium',
                impact: 'high',
                effort: 'medium',
                timeline: '3-4 weeks',
                metrics: Object.keys(metrics),
                expected_outcome: 'Improve decision-making speed by 40%',
                context: 'Multiple data points available for comprehensive analysis',
                implementation_steps: [
                    'Design dashboard requirements',
                    'Select visualization tools',
                    'Implement data pipeline',
                    'Deploy and train users'
                ]
            });
        }

        // Add forecasting recommendations
        if (forecasts.revenue && forecasts.revenue.confidence === 'low') {
            recommendations.push({
                title: 'Improve Data Quality for Forecasting',
                description: 'Enhance data collection and preprocessing for better predictions',
                triggered_by: 'Low confidence in revenue forecasts',
                priority: 'medium',
                impact: 'medium',
                effort: 'high',
                timeline: '4-6 weeks',
                metrics: ['data_quality', 'forecast_confidence'],
                expected_outcome: 'Improve forecast accuracy by 30%',
                context: 'Forecast confidence is low, indicating need for better data quality',
                implementation_steps: [
                    'Audit data sources',
                    'Implement data validation',
                    'Enhance preprocessing pipeline',
                    'Retrain forecasting models'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Generate recommendation context
     */
    generateRecommendationContext(trigger, metrics, forecasts) {
        const context = [];

        // Add metric context
        if (trigger.metric && metrics[trigger.metric]) {
            const metric = metrics[trigger.metric];
            context.push(`Current ${trigger.metric}: ${metric.average?.toFixed(2) || trigger.value}`);
        }

        // Add trend context
        if (forecasts[trigger.type]) {
            const forecast = forecasts[trigger.type];
            context.push(`Forecasted trend: ${forecast.nextMonth?.trend || 'stable'}`);
        }

        // Add comparison context
        if (trigger.threshold) {
            context.push(`Threshold exceeded by ${((trigger.value - trigger.threshold) / trigger.threshold * 100).toFixed(1)}%`);
        }

        return context.join('. ');
    }

    /**
     * Generate implementation steps
     */
    generateImplementationSteps(template, trigger) {
        const baseSteps = [
            'Assess current state',
            'Define requirements',
            'Select solution',
            'Implement changes',
            'Monitor results'
        ];

        // Add domain-specific steps
        if (trigger.type === 'fraud') {
            baseSteps.splice(2, 0, 'Configure fraud detection rules');
            baseSteps.splice(3, 0, 'Train detection models');
        } else if (trigger.type === 'liquidity') {
            baseSteps.splice(2, 0, 'Analyze cash flow patterns');
            baseSteps.splice(3, 0, 'Design cash management strategy');
        }

        return baseSteps;
    }

    /**
     * Calculate effort level
     */
    calculateEffort(trigger, metrics) {
        let effort = 'medium';

        if (trigger.type === 'fraud' && trigger.level === 'critical') {
            effort = 'high';
        } else if (trigger.type === 'liquidity' && trigger.level === 'poor') {
            effort = 'high';
        } else if (trigger.level === 'trending_up') {
            effort = 'low';
        }

        return effort;
    }

    /**
     * Calculate timeline
     */
    calculateTimeline(trigger, effort) {
        const timelines = {
            low: '1-2 weeks',
            medium: '2-4 weeks',
            high: '4-6 weeks'
        };
        return timelines[effort] || '2-3 weeks';
    }

    /**
     * Calculate impact level
     */
    calculateImpact(trigger, metrics) {
        let impact = 'medium';

        if (trigger.type === 'fraud') {
            impact = 'high';
        } else if (trigger.type === 'liquidity' && trigger.level === 'poor') {
            impact = 'high';
        } else if (trigger.level === 'trending_up') {
            impact = 'medium';
        }

        return impact;
    }

    /**
     * Generate recommendation summary
     */
    generateRecommendationSummary(recommendations) {
        if (recommendations.length === 0) {
            return 'No specific recommendations at this time.';
        }

        const critical = recommendations.filter(r => r.priority === 'critical').length;
        const high = recommendations.filter(r => r.priority === 'high').length;
        const medium = recommendations.filter(r => r.priority === 'medium').length;

        let summary = `Generated ${recommendations.length} recommendations: `;
        
        if (critical > 0) {
            summary += `${critical} critical, `;
        }
        if (high > 0) {
            summary += `${high} high priority, `;
        }
        if (medium > 0) {
            summary += `${medium} medium priority. `;
        }

        summary += 'Focus on critical and high-priority items for immediate impact.';

        return summary;
    }

    /**
     * Get metric value safely
     */
    getMetricValue(metrics, metricName) {
        // Try exact match first
        if (metrics[metricName] && metrics[metricName].average !== undefined) {
            return metrics[metricName].average;
        }

        // Try partial match
        const matchingKey = Object.keys(metrics).find(key => 
            key.toLowerCase().includes(metricName.toLowerCase())
        );

        if (matchingKey && metrics[matchingKey].average !== undefined) {
            return metrics[matchingKey].average;
        }

        return null;
    }
}

module.exports = RecommendationService; 
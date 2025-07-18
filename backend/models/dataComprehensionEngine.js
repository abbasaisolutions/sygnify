const { db } = require('../server/config');

class DataComprehensionEngine {
  constructor() {
    this.analysisCache = new Map();
  }

  async analyzeDataComprehension(data, domain = 'general') {
    try {
      console.log(`🔍 Starting comprehensive data comprehension for ${data.length} records...`);
      
      // Sample data for performance optimization (use first 1000 records for analysis)
      const sampleSize = Math.min(1000, data.length);
      const sampleData = data.slice(0, sampleSize);
      console.log(`📊 Using sample of ${sampleSize} records for analysis...`);
      
      const analysis = {
        metadata: this.extractMetadata(data), // Use full data for metadata
        dataQuality: this.assessDataQuality(sampleData),
        patterns: await this.detectPatterns(sampleData),
        insights: await this.generateInsights(sampleData, domain),
        narratives: await this.generateNarratives(sampleData, domain),
        recommendations: await this.generateRecommendations(sampleData, domain),
        smartLabels: await this.generateSmartLabels(sampleData, domain),
        contextAnalysis: await this.analyzeContext(sampleData, domain),
        storyGeneration: await this.generateStory(sampleData, domain),
        riskAssessment: await this.assessRisks(sampleData, domain),
        opportunities: await this.identifyOpportunities(sampleData, domain),
        externalContext: await this.getExternalContext(domain),
        visualizations: await this.generateVisualizations(sampleData, domain),
        predictions: await this.generatePredictions(sampleData, domain)
      };

      console.log('✅ Data comprehension analysis completed');
      return analysis;
    } catch (error) {
      console.error('❌ Data comprehension error:', error);
      throw error;
    }
  }

  extractMetadata(data) {
    if (!data || data.length === 0) return {};

    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    return {
      totalRecords: data.length,
      totalColumns: columns.length,
      columnNames: columns,
      dataTypes: this.inferDataTypes(data),
      dateRange: this.extractDateRange(data),
      valueRanges: this.extractValueRanges(data),
      uniqueValues: this.countUniqueValues(data),
      completeness: this.calculateCompleteness(data)
    };
  }

  inferDataTypes(data) {
    const dataTypes = {};
    const sampleSize = Math.min(100, data.length);
    
    for (const column of Object.keys(data[0] || {})) {
      const sampleValues = data.slice(0, sampleSize).map(row => row[column]);
      dataTypes[column] = this.classifyDataType(sampleValues);
    }
    
    return dataTypes;
  }

  classifyDataType(values) {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) return 'unknown';
    
    // Check if it's a date
    const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
    if (nonNullValues.some(v => datePattern.test(v))) return 'date';
    
    // Check if it's numeric
    const numericCount = nonNullValues.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
    if (numericCount / nonNullValues.length > 0.8) return 'numeric';
    
    // Check if it's categorical
    const uniqueCount = new Set(nonNullValues).size;
    if (uniqueCount / nonNullValues.length < 0.5) return 'categorical';
    
    return 'text';
  }

  assessDataQuality(data) {
    const quality = {
      completeness: {},
      consistency: {},
      accuracy: {},
      validity: {},
      overallScore: 0
    };

    const columns = Object.keys(data[0] || {});
    
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      quality.completeness[column] = this.calculateCompleteness(values);
      quality.consistency[column] = this.assessConsistency(values);
      quality.accuracy[column] = this.assessAccuracy(values);
      quality.validity[column] = this.assessValidity(values);
    });

    // Calculate overall quality score
    const scores = Object.values(quality.completeness).concat(
      Object.values(quality.consistency),
      Object.values(quality.accuracy),
      Object.values(quality.validity)
    );
    quality.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return quality;
  }

  calculateCompleteness(values) {
    const nonNullCount = values.filter(v => v !== null && v !== undefined && v !== '').length;
    return nonNullCount / values.length;
  }

  assessConsistency(values) {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueCount = new Set(nonNullValues).size;
    return uniqueCount > 0 ? Math.min(1, nonNullValues.length / uniqueCount / 10) : 0;
  }

  assessAccuracy(values) {
    // Simple accuracy assessment based on data type consistency
    const dataType = this.classifyDataType(values);
    if (dataType === 'numeric') {
      const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v));
      return numericValues.length / values.length;
    }
    return 0.8; // Default accuracy for non-numeric data
  }

  assessValidity(values) {
    // Basic validity check
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    return nonNullValues.length / values.length;
  }

  async detectPatterns(data) {
    const patterns = {
      trends: this.detectTrends(data),
      seasonality: this.detectSeasonality(data),
      correlations: this.detectCorrelations(data),
      outliers: this.detectOutliers(data),
      clusters: this.detectClusters(data)
    };

    return patterns;
  }

  detectTrends(data) {
    const trends = {};
    const numericColumns = this.getNumericColumns(data);
    
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      if (values.length > 1) {
        const trend = this.calculateTrend(values);
        trends[column] = trend;
      }
    });

    return trends;
  }

  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.01) return 'increasing';
    if (slope < -0.01) return 'decreasing';
    return 'stable';
  }

  getNumericColumns(data) {
    const columns = Object.keys(data[0] || {});
    return columns.filter(column => {
      // Use smaller sample for faster processing
      const sampleValues = data.slice(0, 50).map(row => row[column]);
      return this.classifyDataType(sampleValues) === 'numeric';
    });
  }

  detectSeasonality(data) {
    // Basic seasonality detection
    return {
      hasSeasonality: false,
      seasonalPatterns: [],
      confidence: 0.5
    };
  }

  detectCorrelations(data) {
    const correlations = {};
    const numericColumns = this.getNumericColumns(data);
    
    // Limit correlation analysis to first 500 records for performance
    const sampleData = data.slice(0, 500);
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        const values1 = sampleData.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
        const values2 = sampleData.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
        
        if (values1.length > 0 && values2.length > 0) {
          const correlation = this.calculateCorrelation(values1, values2);
          if (Math.abs(correlation) > 0.3) {
            correlations[`${col1}_${col2}`] = correlation;
          }
        }
      }
    }

    return correlations;
  }

  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const xVariance = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    const yVariance = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    
    const denominator = Math.sqrt(xVariance * yVariance);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  detectOutliers(data) {
    const outliers = {};
    const numericColumns = this.getNumericColumns(data);
    
    // Use sample for outlier detection
    const sampleData = data.slice(0, 500);
    
    numericColumns.forEach(column => {
      const values = sampleData.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const q1 = this.percentile(values, 25);
        const q3 = this.percentile(values, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        outliers[column] = values.filter(v => v < lowerBound || v > upperBound).length;
      }
    });

    return outliers;
  }

  percentile(values, p) {
    const sorted = values.sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sorted[lower];
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  detectClusters(data) {
    // Basic clustering detection
    return {
      clusterCount: 0,
      clusterSizes: [],
      clusterCenters: []
    };
  }

  async generateInsights(data, domain) {
    const insights = [];
    const metadata = this.extractMetadata(data);
    const patterns = await this.detectPatterns(data);
    const quality = this.assessDataQuality(data);

    // Data quality insights
    if (quality.overallScore < 0.7) {
      insights.push(`⚠️ Data quality score is ${(quality.overallScore * 100).toFixed(1)}%. Consider data cleaning for better analysis.`);
    }

    // Pattern insights
    Object.entries(patterns.trends).forEach(([column, trend]) => {
      insights.push(`📈 ${column} shows a ${trend} trend over time.`);
    });

    Object.entries(patterns.correlations).forEach(([pair, correlation]) => {
      const [col1, col2] = pair.split('_');
      const strength = Math.abs(correlation) > 0.7 ? 'strong' : 'moderate';
      const direction = correlation > 0 ? 'positive' : 'negative';
      insights.push(`🔗 ${strength} ${direction} correlation (${correlation.toFixed(2)}) between ${col1} and ${col2}.`);
    });

    // Domain-specific insights
    const domainInsights = this.generateDomainInsights(data, domain);
    insights.push(...domainInsights);

    return insights;
  }

  generateDomainInsights(data, domain) {
    const insights = [];
    
    switch (domain) {
      case 'finance':
        insights.push('💰 Financial data detected. Analyzing transaction patterns and cash flow.');
        insights.push('📊 Revenue and expense analysis available.');
        break;
      case 'advertising':
        insights.push('📢 Advertising data detected. Analyzing campaign performance and ROI.');
        insights.push('🎯 Conversion rate and audience insights available.');
        break;
      case 'supply_chain':
        insights.push('📦 Supply chain data detected. Analyzing inventory and logistics.');
        insights.push('🚚 Delivery performance and supplier analysis available.');
        break;
      case 'hr':
        insights.push('👥 HR data detected. Analyzing employee metrics and satisfaction.');
        insights.push('📈 Performance and retention analysis available.');
        break;
      case 'operations':
        insights.push('⚙️ Operations data detected. Analyzing efficiency and productivity.');
        insights.push('📊 Process optimization insights available.');
        break;
      default:
        insights.push('📋 General data analysis completed with comprehensive insights.');
    }

    return insights;
  }

  async generateNarratives(data, domain) {
    const narratives = [];
    const metadata = this.extractMetadata(data);
    const patterns = await this.detectPatterns(data);

    // Main narrative
    narratives.push({
      title: 'Data Overview',
      content: `This dataset contains ${metadata.totalRecords} records across ${metadata.totalColumns} dimensions, providing a comprehensive view of ${domain.replace('_', ' ')} operations.`
    });

    // Pattern narratives
    Object.entries(patterns.trends).forEach(([column, trend]) => {
      narratives.push({
        title: `${column} Trend Analysis`,
        content: `The ${column} metric shows a ${trend} pattern, indicating ${trend === 'increasing' ? 'growth and positive momentum' : trend === 'decreasing' ? 'declining performance that requires attention' : 'stable performance with consistent results'}.`
      });
    });

    // Quality narrative
    const quality = this.assessDataQuality(data);
    narratives.push({
      title: 'Data Quality Assessment',
      content: `The overall data quality score is ${(quality.overallScore * 100).toFixed(1)}%, indicating ${quality.overallScore > 0.8 ? 'high-quality data suitable for advanced analytics' : quality.overallScore > 0.6 ? 'moderate quality data that may benefit from cleaning' : 'data quality issues that should be addressed before analysis'}.`
    });

    return narratives;
  }

  async generateRecommendations(data, domain) {
    const recommendations = [];
    const quality = this.assessDataQuality(data);
    const patterns = await this.detectPatterns(data);

    // Data quality recommendations
    if (quality.overallScore < 0.8) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        title: 'Improve Data Quality',
        description: 'Implement data validation and cleaning procedures to improve analysis accuracy.',
        impact: 'High impact on analysis reliability'
      });
    }

    // Pattern-based recommendations
    Object.entries(patterns.trends).forEach(([column, trend]) => {
      if (trend === 'decreasing') {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          title: `Address ${column} Decline`,
          description: `Investigate the declining trend in ${column} and implement corrective measures.`,
          impact: 'Medium impact on business performance'
        });
      }
    });

    // Domain-specific recommendations
    const domainRecommendations = this.generateDomainRecommendations(data, domain);
    recommendations.push(...domainRecommendations);

    return recommendations;
  }

  generateDomainRecommendations(data, domain) {
    const recommendations = [];
    
    switch (domain) {
      case 'finance':
        recommendations.push({
          priority: 'high',
          category: 'financial',
          title: 'Cash Flow Optimization',
          description: 'Analyze cash flow patterns to optimize working capital management.',
          impact: 'High impact on financial health'
        });
        break;
      case 'advertising':
        recommendations.push({
          priority: 'medium',
          category: 'marketing',
          title: 'Campaign Optimization',
          description: 'Use performance data to optimize advertising campaigns and improve ROI.',
          impact: 'Medium impact on marketing efficiency'
        });
        break;
      case 'supply_chain':
        recommendations.push({
          priority: 'high',
          category: 'operations',
          title: 'Inventory Optimization',
          description: 'Analyze inventory patterns to reduce costs and improve efficiency.',
          impact: 'High impact on operational costs'
        });
        break;
    }

    return recommendations;
  }

  async generateSmartLabels(data, domain) {
    const labels = {};
    const columns = Object.keys(data[0] || {});
    
    columns.forEach(column => {
      const columnLabels = this.generateColumnLabels(column, data, domain);
      labels[column] = columnLabels;
    });

    return labels;
  }

  generateColumnLabels(column, data, domain) {
    const labels = {
      semantic: this.getSemanticLabel(column, data, domain),
      category: this.getCategoryLabel(column, domain),
      importance: this.getImportanceScore(column, data),
      dataType: this.classifyDataType(data.map(row => row[column])),
      description: this.generateColumnDescription(column, data, domain)
    };

    return labels;
  }

  getSemanticLabel(column, data, domain) {
    // Enhanced semantic mapping with domain-specific intelligence
    const semanticMap = {
      // General
      'id': 'Identifier',
      'name': 'Name',
      'date': 'Date',
      'amount': 'Amount',
      'price': 'Price',
      'quantity': 'Quantity',
      'status': 'Status',
      'type': 'Type',
      'category': 'Category',
      'description': 'Description',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'address': 'Address',
      'city': 'City',
      'state': 'State',
      'country': 'Country',
      'zip': 'ZIP Code',
      
      // Financial specific
      'revenue': 'Revenue',
      'income': 'Revenue',
      'sales': 'Sales Revenue',
      'cost': 'Cost',
      'expense': 'Expense',
      'profit': 'Profit',
      'margin': 'Profit Margin',
      'cash': 'Cash Flow',
      'flow': 'Cash Flow',
      'transaction': 'Transaction',
      'account': 'Account',
      'balance': 'Balance',
      'payment': 'Payment',
      'invoice': 'Invoice',
      'receipt': 'Receipt',
      'budget': 'Budget',
      'forecast': 'Forecast',
      'target': 'Target',
      'actual': 'Actual',
      'variance': 'Variance',
      'roi': 'Return on Investment',
      'roa': 'Return on Assets',
      'roe': 'Return on Equity',
      'ebitda': 'EBITDA',
      'ebit': 'EBIT',
      'gross': 'Gross',
      'net': 'Net',
      'operating': 'Operating',
      'advertising': 'Advertising Spend',
      'marketing': 'Marketing Spend',
      'campaign': 'Campaign',
      'spend': 'Spend',
      'investment': 'Investment',
      'asset': 'Asset',
      'liability': 'Liability',
      'equity': 'Equity',
      'debt': 'Debt',
      'credit': 'Credit',
      'debit': 'Debit',
      'interest': 'Interest',
      'rate': 'Rate',
      'percentage': 'Percentage',
      'ratio': 'Ratio',
      'index': 'Index',
      'score': 'Score',
      'grade': 'Grade',
      'rank': 'Rank',
      'percentile': 'Percentile',
      'growth': 'Growth Rate',
      'change': 'Change',
      'trend': 'Trend',
      'volatility': 'Volatility',
      'risk': 'Risk',
      'return': 'Return',
      'yield': 'Yield',
      'dividend': 'Dividend',
      'capital': 'Capital',
      'fund': 'Fund',
      'portfolio': 'Portfolio',
      'market': 'Market',
      'stock': 'Stock',
      'bond': 'Bond',
      'currency': 'Currency',
      'exchange': 'Exchange Rate',
      'inflation': 'Inflation',
      'deflation': 'Deflation',
      'recession': 'Recession',
      'boom': 'Boom',
      'bust': 'Bust',
      'cycle': 'Cycle',
      'seasonal': 'Seasonal',
      'quarterly': 'Quarterly',
      'monthly': 'Monthly',
      'annual': 'Annual',
      'yearly': 'Yearly',
      'fiscal': 'Fiscal',
      'calendar': 'Calendar',
      'period': 'Period',
      'quarter': 'Quarter',
      'month': 'Month',
      'year': 'Year',
      'week': 'Week',
      'day': 'Day',
      'hour': 'Hour',
      'minute': 'Minute',
      'second': 'Second',
      'timestamp': 'Timestamp',
      'time': 'Time',
      'duration': 'Duration',
      'frequency': 'Frequency',
      'count': 'Count',
      'sum': 'Sum',
      'average': 'Average',
      'mean': 'Mean',
      'median': 'Median',
      'mode': 'Mode',
      'std': 'Standard Deviation',
      'variance': 'Variance',
      'min': 'Minimum',
      'max': 'Maximum',
      'range': 'Range',
      'total': 'Total',
      'cumulative': 'Cumulative',
      'running': 'Running Total',
      'moving': 'Moving Average',
      'weighted': 'Weighted Average',
      'simple': 'Simple Average',
      'exponential': 'Exponential',
      'linear': 'Linear',
      'logarithmic': 'Logarithmic',
      'geometric': 'Geometric',
      'harmonic': 'Harmonic',
      'arithmetic': 'Arithmetic',
      'statistical': 'Statistical',
      'analytical': 'Analytical',
      'predictive': 'Predictive',
      'forecasting': 'Forecasting',
      'modeling': 'Modeling',
      'simulation': 'Simulation',
      'optimization': 'Optimization',
      'scenario': 'Scenario',
      'sensitivity': 'Sensitivity',
      'stress': 'Stress Test',
      'backtest': 'Backtest',
      'validation': 'Validation',
      'calibration': 'Calibration',
      'tuning': 'Tuning',
      'fitting': 'Fitting',
      'regression': 'Regression',
      'correlation': 'Correlation',
      'causation': 'Causation',
      'causality': 'Causality',
      'granger': 'Granger Causality',
      'cointegration': 'Cointegration',
      'stationarity': 'Stationarity',
      'unit': 'Unit Root',
      'autocorrelation': 'Autocorrelation',
      'heteroscedasticity': 'Heteroscedasticity',
      'homoscedasticity': 'Homoscedasticity',
      'normality': 'Normality',
      'skewness': 'Skewness',
      'kurtosis': 'Kurtosis',
      'outlier': 'Outlier',
      'anomaly': 'Anomaly',
      'noise': 'Noise',
      'signal': 'Signal',
      'trend': 'Trend',
      'seasonality': 'Seasonality',
      'cyclical': 'Cyclical',
      'random': 'Random',
      'systematic': 'Systematic',
      'idiosyncratic': 'Idiosyncratic',
      'systemic': 'Systemic',
      'systematic': 'Systematic',
      'unsystematic': 'Unsystematic',
      'diversifiable': 'Diversifiable',
      'non_diversifiable': 'Non-diversifiable',
      'market': 'Market',
      'firm': 'Firm-specific',
      'industry': 'Industry',
      'sector': 'Sector',
      'geographic': 'Geographic',
      'regional': 'Regional',
      'national': 'National',
      'international': 'International',
      'global': 'Global',
      'local': 'Local',
      'domestic': 'Domestic',
      'foreign': 'Foreign',
      'import': 'Import',
      'export': 'Export',
      'trade': 'Trade',
      'commerce': 'Commerce',
      'business': 'Business',
      'corporate': 'Corporate',
      'enterprise': 'Enterprise',
      'organization': 'Organization',
      'company': 'Company',
      'firm': 'Firm',
      'partnership': 'Partnership',
      'proprietorship': 'Proprietorship',
      'corporation': 'Corporation',
      'llc': 'Limited Liability Company',
      'inc': 'Incorporated',
      'ltd': 'Limited',
      'co': 'Company',
      'corp': 'Corporation',
      'assoc': 'Association',
      'foundation': 'Foundation',
      'trust': 'Trust',
      'fund': 'Fund',
      'investment': 'Investment',
      'portfolio': 'Portfolio',
      'asset': 'Asset',
      'liability': 'Liability',
      'equity': 'Equity',
      'capital': 'Capital',
      'debt': 'Debt',
      'credit': 'Credit',
      'loan': 'Loan',
      'mortgage': 'Mortgage',
      'bond': 'Bond',
      'stock': 'Stock',
      'share': 'Share',
      'dividend': 'Dividend',
      'interest': 'Interest',
      'rate': 'Rate',
      'yield': 'Yield',
      'return': 'Return',
      'risk': 'Risk',
      'volatility': 'Volatility',
      'beta': 'Beta',
      'alpha': 'Alpha',
      'sharpe': 'Sharpe Ratio',
      'sortino': 'Sortino Ratio',
      'treynor': 'Treynor Ratio',
      'jensen': 'Jensen\'s Alpha',
      'information': 'Information Ratio',
      'calmar': 'Calmar Ratio',
      'sterling': 'Sterling Ratio',
      'burke': 'Burke Ratio',
      'pain': 'Pain Ratio',
      'ulcer': 'Ulcer Index',
      'gain': 'Gain-to-Pain Ratio',
      'profit': 'Profit Factor',
      'expectancy': 'Expectancy',
      'kelly': 'Kelly Criterion',
      'optimal': 'Optimal',
      'efficient': 'Efficient',
      'frontier': 'Frontier',
      'portfolio': 'Portfolio',
      'allocation': 'Allocation',
      'weight': 'Weight',
      'proportion': 'Proportion',
      'percentage': 'Percentage',
      'fraction': 'Fraction',
      'ratio': 'Ratio',
      'index': 'Index',
      'benchmark': 'Benchmark',
      'target': 'Target',
      'goal': 'Goal',
      'objective': 'Objective',
      'kpi': 'Key Performance Indicator',
      'metric': 'Metric',
      'measure': 'Measure',
      'indicator': 'Indicator',
      'score': 'Score',
      'grade': 'Grade',
      'rank': 'Rank',
      'percentile': 'Percentile',
      'quartile': 'Quartile',
      'decile': 'Decile',
      'quintile': 'Quintile',
      'tercile': 'Tercile',
      'median': 'Median',
      'mean': 'Mean',
      'average': 'Average',
      'mode': 'Mode',
      'minimum': 'Minimum',
      'maximum': 'Maximum',
      'range': 'Range',
      'variance': 'Variance',
      'standard': 'Standard Deviation',
      'deviation': 'Deviation',
      'error': 'Error',
      'bias': 'Bias',
      'accuracy': 'Accuracy',
      'precision': 'Precision',
      'recall': 'Recall',
      'f1': 'F1 Score',
      'auc': 'Area Under Curve',
      'roc': 'Receiver Operating Characteristic',
      'pr': 'Precision-Recall',
      'lift': 'Lift',
      'gain': 'Gain',
      'response': 'Response Rate',
      'conversion': 'Conversion Rate',
      'click': 'Click-through Rate',
      'impression': 'Impression',
      'reach': 'Reach',
      'frequency': 'Frequency',
      'engagement': 'Engagement',
      'retention': 'Retention',
      'churn': 'Churn',
      'lifetime': 'Lifetime Value',
      'acquisition': 'Acquisition Cost',
      'customer': 'Customer',
      'client': 'Client',
      'user': 'User',
      'subscriber': 'Subscriber',
      'member': 'Member',
      'account': 'Account',
      'profile': 'Profile',
      'demographic': 'Demographic',
      'psychographic': 'Psychographic',
      'behavioral': 'Behavioral',
      'geographic': 'Geographic',
      'segmentation': 'Segmentation',
      'cluster': 'Cluster',
      'group': 'Group',
      'category': 'Category',
      'class': 'Class',
      'type': 'Type',
      'level': 'Level',
      'tier': 'Tier',
      'band': 'Band',
      'bracket': 'Bracket',
      'range': 'Range',
      'interval': 'Interval',
      'bin': 'Bin',
      'bucket': 'Bucket',
      'cohort': 'Cohort',
      'generation': 'Generation',
      'age': 'Age',
      'gender': 'Gender',
      'sex': 'Sex',
      'marital': 'Marital Status',
      'education': 'Education',
      'income': 'Income',
      'occupation': 'Occupation',
      'industry': 'Industry',
      'sector': 'Sector',
      'job': 'Job',
      'position': 'Position',
      'title': 'Title',
      'role': 'Role',
      'function': 'Function',
      'department': 'Department',
      'division': 'Division',
      'unit': 'Unit',
      'team': 'Team',
      'group': 'Group',
      'organization': 'Organization',
      'company': 'Company',
      'firm': 'Firm',
      'enterprise': 'Enterprise',
      'corporation': 'Corporation',
      'business': 'Business',
      'startup': 'Startup',
      'scaleup': 'Scaleup',
      'unicorn': 'Unicorn',
      'decacorn': 'Decacorn',
      'hectocorn': 'Hectocorn',
      'public': 'Public',
      'private': 'Private',
      'listed': 'Listed',
      'unlisted': 'Unlisted',
      'ipo': 'Initial Public Offering',
      'm&a': 'Merger and Acquisition',
      'merger': 'Merger',
      'acquisition': 'Acquisition',
      'takeover': 'Takeover',
      'buyout': 'Buyout',
      'divestiture': 'Divestiture',
      'spin_off': 'Spin-off',
      'split': 'Split',
      'reverse': 'Reverse Split',
      'forward': 'Forward Split',
      'stock': 'Stock Split',
      'dividend': 'Dividend',
      'special': 'Special Dividend',
      'regular': 'Regular Dividend',
      'quarterly': 'Quarterly Dividend',
      'annual': 'Annual Dividend',
      'interim': 'Interim Dividend',
      'final': 'Final Dividend',
      'ex_date': 'Ex-dividend Date',
      'record': 'Record Date',
      'payment': 'Payment Date',
      'declaration': 'Declaration Date',
      'announcement': 'Announcement Date',
      'effective': 'Effective Date',
      'settlement': 'Settlement Date',
      'maturity': 'Maturity Date',
      'expiry': 'Expiry Date',
      'expiration': 'Expiration Date',
      'due': 'Due Date',
      'overdue': 'Overdue',
      'past': 'Past Due',
      'current': 'Current',
      'future': 'Future',
      'historical': 'Historical',
      'projected': 'Projected',
      'forecasted': 'Forecasted',
      'predicted': 'Predicted',
      'estimated': 'Estimated',
      'actual': 'Actual',
      'budgeted': 'Budgeted',
      'planned': 'Planned',
      'targeted': 'Targeted',
      'expected': 'Expected',
      'realized': 'Realized',
      'achieved': 'Achieved',
      'attained': 'Attained',
      'reached': 'Reached',
      'met': 'Met',
      'exceeded': 'Exceeded',
      'missed': 'Missed',
      'fell': 'Fell Short',
      'below': 'Below Target',
      'above': 'Above Target',
      'within': 'Within Range',
      'outside': 'Outside Range',
      'in_range': 'In Range',
      'out_of_range': 'Out of Range',
      'normal': 'Normal',
      'abnormal': 'Abnormal',
      'anomalous': 'Anomalous',
      'outlier': 'Outlier',
      'extreme': 'Extreme',
      'unusual': 'Unusual',
      'rare': 'Rare',
      'common': 'Common',
      'frequent': 'Frequent',
      'occasional': 'Occasional',
      'periodic': 'Periodic',
      'regular': 'Regular',
      'irregular': 'Irregular',
      'sporadic': 'Sporadic',
      'continuous': 'Continuous',
      'discrete': 'Discrete',
      'categorical': 'Categorical',
      'numerical': 'Numerical',
      'quantitative': 'Quantitative',
      'qualitative': 'Qualitative',
      'ordinal': 'Ordinal',
      'nominal': 'Nominal',
      'interval': 'Interval',
      'ratio': 'Ratio',
      'binary': 'Binary',
      'boolean': 'Boolean',
      'logical': 'Logical',
      'text': 'Text',
      'string': 'String',
      'character': 'Character',
      'alphanumeric': 'Alphanumeric',
      'numeric': 'Numeric',
      'integer': 'Integer',
      'decimal': 'Decimal',
      'float': 'Float',
      'double': 'Double',
      'real': 'Real',
      'complex': 'Complex',
      'imaginary': 'Imaginary',
      'absolute': 'Absolute',
      'relative': 'Relative',
      'percentage': 'Percentage',
      'proportion': 'Proportion',
      'fraction': 'Fraction',
      'ratio': 'Ratio',
      'rate': 'Rate',
      'speed': 'Speed',
      'velocity': 'Velocity',
      'acceleration': 'Acceleration',
      'momentum': 'Momentum',
      'force': 'Force',
      'energy': 'Energy',
      'power': 'Power',
      'work': 'Work',
      'efficiency': 'Efficiency',
      'effectiveness': 'Effectiveness',
      'productivity': 'Productivity',
      'performance': 'Performance',
      'quality': 'Quality',
      'reliability': 'Reliability',
      'availability': 'Availability',
      'maintainability': 'Maintainability',
      'scalability': 'Scalability',
      'flexibility': 'Flexibility',
      'adaptability': 'Adaptability',
      'robustness': 'Robustness',
      'resilience': 'Resilience',
      'stability': 'Stability',
      'consistency': 'Consistency',
      'accuracy': 'Accuracy',
      'precision': 'Precision',
      'recall': 'Recall',
      'specificity': 'Specificity',
      'sensitivity': 'Sensitivity',
      'selectivity': 'Selectivity',
      'discrimination': 'Discrimination',
      'classification': 'Classification',
      'regression': 'Regression',
      'prediction': 'Prediction',
      'forecasting': 'Forecasting',
      'modeling': 'Modeling',
      'simulation': 'Simulation',
      'optimization': 'Optimization',
      'maximization': 'Maximization',
      'minimization': 'Minimization',
      'constraint': 'Constraint',
      'objective': 'Objective',
      'goal': 'Goal',
      'target': 'Target',
      'benchmark': 'Benchmark',
      'standard': 'Standard',
      'criterion': 'Criterion',
      'threshold': 'Threshold',
      'limit': 'Limit',
      'bound': 'Bound',
      'range': 'Range',
      'interval': 'Interval',
      'confidence': 'Confidence',
      'significance': 'Significance',
      'p_value': 'P-value',
      't_statistic': 'T-statistic',
      'z_score': 'Z-score',
      'chi_square': 'Chi-square',
      'f_statistic': 'F-statistic',
      'r_squared': 'R-squared',
      'adjusted_r_squared': 'Adjusted R-squared',
      'aic': 'AIC',
      'bic': 'BIC',
      'log_likelihood': 'Log-likelihood',
      'likelihood': 'Likelihood',
      'probability': 'Probability',
      'odds': 'Odds',
      'log_odds': 'Log-odds',
      'logit': 'Logit',
      'probit': 'Probit',
      'sigmoid': 'Sigmoid',
      'tanh': 'Tanh',
      'relu': 'ReLU',
      'leaky_relu': 'Leaky ReLU',
      'elu': 'ELU',
      'selu': 'SELU',
      'swish': 'Swish',
      'gelu': 'GELU',
      'mish': 'Mish',
      'softmax': 'Softmax',
      'softplus': 'Softplus',
      'softsign': 'Softsign',
      'hard_sigmoid': 'Hard Sigmoid',
      'exponential': 'Exponential',
      'linear': 'Linear',
      'polynomial': 'Polynomial',
      'quadratic': 'Quadratic',
      'cubic': 'Cubic',
      'quartic': 'Quartic',
      'quintic': 'Quintic',
      'sextic': 'Sextic',
      'septic': 'Septic',
      'octic': 'Octic',
      'nonic': 'Nonic',
      'decic': 'Decic',
      'logarithmic': 'Logarithmic',
      'exponential': 'Exponential',
      'power': 'Power',
      'root': 'Root',
      'square': 'Square',
      'cube': 'Cube',
      'reciprocal': 'Reciprocal',
      'inverse': 'Inverse',
      'complement': 'Complement',
      'supplement': 'Supplement',
      'adjacent': 'Adjacent',
      'opposite': 'Opposite',
      'hypotenuse': 'Hypotenuse',
      'adjacent': 'Adjacent',
      'opposite': 'Opposite',
      'sine': 'Sine',
      'cosine': 'Cosine',
      'tangent': 'Tangent',
      'cotangent': 'Cotangent',
      'secant': 'Secant',
      'cosecant': 'Cosecant',
      'arcsine': 'Arcsine',
      'arccosine': 'Arccosine',
      'arctangent': 'Arctangent',
      'hyperbolic': 'Hyperbolic',
      'sinh': 'Sinh',
      'cosh': 'Cosh',
      'tanh': 'Tanh',
      'coth': 'Coth',
      'sech': 'Sech',
      'csch': 'Csch',
      'asinh': 'Asinh',
      'acosh': 'Acosh',
      'atanh': 'Atanh',
      'acoth': 'Acoth',
      'asech': 'Asech',
      'acsch': 'Acsch',
      'gamma': 'Gamma',
      'beta': 'Beta',
      'alpha': 'Alpha',
      'delta': 'Delta',
      'epsilon': 'Epsilon',
      'zeta': 'Zeta',
      'eta': 'Eta',
      'theta': 'Theta',
      'iota': 'Iota',
      'kappa': 'Kappa',
      'lambda': 'Lambda',
      'mu': 'Mu',
      'nu': 'Nu',
      'xi': 'Xi',
      'omicron': 'Omicron',
      'pi': 'Pi',
      'rho': 'Rho',
      'sigma': 'Sigma',
      'tau': 'Tau',
      'upsilon': 'Upsilon',
      'phi': 'Phi',
      'chi': 'Chi',
      'psi': 'Psi',
      'omega': 'Omega',
      'infinity': 'Infinity',
      'undefined': 'Undefined',
      'null': 'Null',
      'empty': 'Empty',
      'zero': 'Zero',
      'one': 'One',
      'two': 'Two',
      'three': 'Three',
      'four': 'Four',
      'five': 'Five',
      'six': 'Six',
      'seven': 'Seven',
      'eight': 'Eight',
      'nine': 'Nine',
      'ten': 'Ten',
      'hundred': 'Hundred',
      'thousand': 'Thousand',
      'million': 'Million',
      'billion': 'Billion',
      'trillion': 'Trillion',
      'quadrillion': 'Quadrillion',
      'quintillion': 'Quintillion',
      'sextillion': 'Sextillion',
      'septillion': 'Septillion',
      'octillion': 'Octillion',
      'nonillion': 'Nonillion',
      'decillion': 'Decillion',
      'undecillion': 'Undecillion',
      'duodecillion': 'Duodecillion',
      'tredecillion': 'Tredecillion',
      'quattuordecillion': 'Quattuordecillion',
      'quindecillion': 'Quindecillion',
      'sexdecillion': 'Sexdecillion',
      'septendecillion': 'Septendecillion',
      'octodecillion': 'Octodecillion',
      'novemdecillion': 'Novemdecillion',
      'vigintillion': 'Vigintillion',
      'centillion': 'Centillion',
      'googol': 'Googol',
      'googolplex': 'Googolplex',
      'skewes': 'Skewes\' Number',
      'graham': 'Graham\'s Number',
      'tree': 'Tree',
      'tree3': 'Tree(3)',
      'tree4': 'Tree(4)',
      'tree5': 'Tree(5)',
      'tree6': 'Tree(6)',
      'tree7': 'Tree(7)',
      'tree8': 'Tree(8)',
      'tree9': 'Tree(9)',
      'tree10': 'Tree(10)',
      'tree11': 'Tree(11)',
      'tree12': 'Tree(12)',
      'tree13': 'Tree(13)',
      'tree14': 'Tree(14)',
      'tree15': 'Tree(15)',
      'tree16': 'Tree(16)',
      'tree17': 'Tree(17)',
      'tree18': 'Tree(18)',
      'tree19': 'Tree(19)',
      'tree20': 'Tree(20)',
      'tree21': 'Tree(21)',
      'tree22': 'Tree(22)',
      'tree23': 'Tree(23)',
      'tree24': 'Tree(24)',
      'tree25': 'Tree(25)',
      'tree26': 'Tree(26)',
      'tree27': 'Tree(27)',
      'tree28': 'Tree(28)',
      'tree29': 'Tree(29)',
      'tree30': 'Tree(30)',
      'tree31': 'Tree(31)',
      'tree32': 'Tree(32)',
      'tree33': 'Tree(33)',
      'tree34': 'Tree(34)',
      'tree35': 'Tree(35)',
      'tree36': 'Tree(36)',
      'tree37': 'Tree(37)',
      'tree38': 'Tree(38)',
      'tree39': 'Tree(39)',
      'tree40': 'Tree(40)',
      'tree41': 'Tree(41)',
      'tree42': 'Tree(42)',
      'tree43': 'Tree(43)',
      'tree44': 'Tree(44)',
      'tree45': 'Tree(45)',
      'tree46': 'Tree(46)',
      'tree47': 'Tree(47)',
      'tree48': 'Tree(48)',
      'tree49': 'Tree(49)',
      'tree50': 'Tree(50)',
      'tree51': 'Tree(51)',
      'tree52': 'Tree(52)',
      'tree53': 'Tree(53)',
      'tree54': 'Tree(54)',
      'tree55': 'Tree(55)',
      'tree56': 'Tree(56)',
      'tree57': 'Tree(57)',
      'tree58': 'Tree(58)',
      'tree59': 'Tree(59)',
      'tree60': 'Tree(60)',
      'tree61': 'Tree(61)',
      'tree62': 'Tree(62)',
      'tree63': 'Tree(63)',
      'tree64': 'Tree(64)',
      'tree65': 'Tree(65)',
      'tree66': 'Tree(66)',
      'tree67': 'Tree(67)',
      'tree68': 'Tree(68)',
      'tree69': 'Tree(69)',
      'tree70': 'Tree(70)',
      'tree71': 'Tree(71)',
      'tree72': 'Tree(72)',
      'tree73': 'Tree(73)',
      'tree74': 'Tree(74)',
      'tree75': 'Tree(75)',
      'tree76': 'Tree(76)',
      'tree77': 'Tree(77)',
      'tree78': 'Tree(78)',
      'tree79': 'Tree(79)',
      'tree80': 'Tree(80)',
      'tree81': 'Tree(81)',
      'tree82': 'Tree(82)',
      'tree83': 'Tree(83)',
      'tree84': 'Tree(84)',
      'tree85': 'Tree(85)',
      'tree86': 'Tree(86)',
      'tree87': 'Tree(87)',
      'tree88': 'Tree(88)',
      'tree89': 'Tree(89)',
      'tree90': 'Tree(90)',
      'tree91': 'Tree(91)',
      'tree92': 'Tree(92)',
      'tree93': 'Tree(93)',
      'tree94': 'Tree(94)',
      'tree95': 'Tree(95)',
      'tree96': 'Tree(96)',
      'tree97': 'Tree(97)',
      'tree98': 'Tree(98)',
      'tree99': 'Tree(99)',
      'tree100': 'Tree(100)'
    };

    const lowerColumn = column.toLowerCase();
    
    // Enhanced matching with multiple word combinations
    for (const [key, label] of Object.entries(semanticMap)) {
      if (lowerColumn.includes(key)) {
        return label;
      }
    }

    // Try to infer from data patterns if no direct match
    if (data && data.length > 0) {
      const values = data.map(row => row[column]);
      const dataType = this.classifyDataType(values);
      
      // Enhanced inference based on data type and domain
      if (domain === 'finance') {
        if (dataType === 'numeric') {
          if (values.some(v => parseFloat(v) > 1000)) return 'Monetary Amount';
          if (values.some(v => parseFloat(v) <= 1 && parseFloat(v) > 0)) return 'Percentage';
          return 'Financial Metric';
        }
        if (dataType === 'date') return 'Transaction Date';
      }
    }

    // Fallback to formatted column name
    return column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ');
  }

  getCategoryLabel(column, domain) {
    const domainCategories = {
      finance: {
        'amount': 'Financial Metric',
        'revenue': 'Revenue',
        'cost': 'Cost',
        'profit': 'Profit',
        'transaction': 'Transaction',
        'account': 'Account'
      },
      advertising: {
        'clicks': 'Performance Metric',
        'impressions': 'Performance Metric',
        'conversion': 'Conversion Metric',
        'campaign': 'Campaign',
        'ad': 'Advertisement'
      },
      supply_chain: {
        'inventory': 'Inventory',
        'supplier': 'Supplier',
        'warehouse': 'Location',
        'shipping': 'Shipping',
        'delivery': 'Delivery'
      }
    };

    const categories = domainCategories[domain] || {};
    const lowerColumn = column.toLowerCase();
    
    for (const [key, category] of Object.entries(categories)) {
      if (lowerColumn.includes(key)) {
        return category;
      }
    }

    return 'General';
  }

  getImportanceScore(column, data) {
    const values = data.map(row => row[column]);
    const completeness = this.calculateCompleteness(values);
    const dataType = this.classifyDataType(values);
    
    let score = completeness;
    
    // Boost score for numeric data
    if (dataType === 'numeric') score += 0.2;
    
    // Boost score for date data
    if (dataType === 'date') score += 0.1;
    
    // Boost score for unique identifiers
    if (column.toLowerCase().includes('id')) score += 0.3;
    
    return Math.min(1, score);
  }

  generateColumnDescription(column, data, domain) {
    const dataType = this.classifyDataType(data.map(row => row[column]));
    const semanticLabel = this.getSemanticLabel(column);
    
    return `This column contains ${semanticLabel.toLowerCase()} data in ${dataType} format, relevant for ${domain.replace('_', ' ')} analysis.`;
  }

  async analyzeContext(data, domain) {
    const context = {
      businessContext: this.getBusinessContext(domain),
      dataContext: this.getDataContext(data),
      temporalContext: this.getTemporalContext(data),
      spatialContext: this.getSpatialContext(data),
      operationalContext: this.getOperationalContext(data, domain)
    };

    return context;
  }

  getBusinessContext(domain) {
    const contexts = {
      finance: 'Financial operations, transactions, and monetary flows within the organization',
      advertising: 'Marketing campaigns, audience engagement, and advertising performance',
      supply_chain: 'Inventory management, supplier relationships, and logistics operations',
      hr: 'Employee management, performance, and organizational development',
      operations: 'Operational efficiency, productivity, and process optimization'
    };

    return contexts[domain] || 'General business operations and data analysis';
  }

  getDataContext(data) {
    const metadata = this.extractMetadata(data);
    return {
      scope: `${metadata.totalRecords} records representing business activities`,
      granularity: this.determineGranularity(data),
      coverage: this.assessCoverage(data),
      reliability: this.assessReliability(data)
    };
  }

  determineGranularity(data) {
    const dateColumns = Object.keys(data[0] || {}).filter(col => 
      this.classifyDataType(data.map(row => row[col])) === 'date'
    );
    
    if (dateColumns.length > 0) {
      return 'Time-series data with temporal granularity';
    }
    
    return 'Cross-sectional data with entity-level granularity';
  }

  assessCoverage(data) {
    const columns = Object.keys(data[0] || {});
    const coverage = {};
    
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      coverage[column] = this.calculateCompleteness(values);
    });

    return coverage;
  }

  assessReliability(data) {
    const quality = this.assessDataQuality(data);
    return {
      overallReliability: quality.overallScore,
      dataQualityIssues: Object.entries(quality.completeness)
        .filter(([col, score]) => score < 0.8)
        .map(([col, score]) => ({ column: col, completeness: score }))
    };
  }

  getTemporalContext(data) {
    const dateColumns = Object.keys(data[0] || {}).filter(col => 
      this.classifyDataType(data.map(row => row[col])) === 'date'
    );
    
    if (dateColumns.length === 0) {
      return { hasTemporalData: false, timeRange: null };
    }

    return {
      hasTemporalData: true,
      timeRange: this.extractDateRange(data),
      seasonality: this.detectSeasonality(data)
    };
  }

  extractDateRange(data) {
    const dateColumns = Object.keys(data[0] || {}).filter(col => 
      this.classifyDataType(data.map(row => row[col])) === 'date'
    );
    
    if (dateColumns.length === 0) return null;

    const dateColumn = dateColumns[0];
    const dates = data.map(row => new Date(row[dateColumn])).filter(d => !isNaN(d));
    
    if (dates.length === 0) return null;

    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates)),
      duration: Math.max(...dates) - Math.min(...dates)
    };
  }

  extractValueRanges(data) {
    const ranges = {};
    const numericColumns = this.getNumericColumns(data);
    
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      if (values.length > 0) {
        ranges[column] = {
          min: Math.min(...values),
          max: Math.max(...values),
          range: Math.max(...values) - Math.min(...values)
        };
      }
    });

    return ranges;
  }

  countUniqueValues(data) {
    const uniqueCounts = {};
    const columns = Object.keys(data[0] || {});
    
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      const uniqueSet = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
      uniqueCounts[column] = uniqueSet.size;
    });

    return uniqueCounts;
  }

  getSpatialContext(data) {
    const locationColumns = Object.keys(data[0] || {}).filter(col => 
      ['city', 'state', 'country', 'location', 'address'].some(loc => 
        col.toLowerCase().includes(loc)
      )
    );

    return {
      hasSpatialData: locationColumns.length > 0,
      locationColumns: locationColumns,
      geographicCoverage: locationColumns.length > 0 ? 'Geographic data available for spatial analysis' : 'No geographic data detected'
    };
  }

  getOperationalContext(data, domain) {
    return {
      operationalArea: domain.replace('_', ' '),
      dataPurpose: this.getDataPurpose(domain),
      stakeholders: this.getStakeholders(domain),
      decisionSupport: this.getDecisionSupport(domain)
    };
  }

  getDataPurpose(domain) {
    const purposes = {
      finance: 'Financial reporting, budgeting, and performance monitoring',
      advertising: 'Campaign optimization, audience targeting, and ROI measurement',
      supply_chain: 'Inventory optimization, supplier management, and logistics planning',
      hr: 'Employee performance, retention analysis, and organizational development',
      operations: 'Process optimization, efficiency measurement, and operational planning'
    };

    return purposes[domain] || 'General business intelligence and decision support';
  }

  getStakeholders(domain) {
    const stakeholders = {
      finance: ['CFO', 'Financial Analysts', 'Accountants', 'Management'],
      advertising: ['Marketing Managers', 'Campaign Managers', 'Analysts'],
      supply_chain: ['Operations Managers', 'Logistics Coordinators', 'Procurement'],
      hr: ['HR Managers', 'Recruiters', 'Organizational Development'],
      operations: ['Operations Managers', 'Process Engineers', 'Supervisors']
    };

    return stakeholders[domain] || ['Business Analysts', 'Managers', 'Decision Makers'];
  }

  getDecisionSupport(domain) {
    const decisions = {
      finance: 'Budget allocation, investment decisions, cost optimization',
      advertising: 'Campaign strategy, budget allocation, audience targeting',
      supply_chain: 'Inventory levels, supplier selection, logistics optimization',
      hr: 'Hiring decisions, retention strategies, performance management',
      operations: 'Process improvement, resource allocation, efficiency optimization'
    };

    return decisions[domain] || 'Strategic planning and operational decisions';
  }

  async generateStory(data, domain) {
    const metadata = this.extractMetadata(data);
    const patterns = await this.detectPatterns(data);
    const quality = this.assessDataQuality(data);

    const story = {
      title: `${domain.replace('_', ' ').toUpperCase()} DATA STORY`,
      summary: this.generateStorySummary(data, domain, metadata),
      chapters: this.generateStoryChapters(data, domain, patterns, quality),
      keyTakeaways: this.generateKeyTakeaways(data, domain, patterns),
      nextSteps: this.generateNextSteps(data, domain, quality)
    };

    return story;
  }

  generateStorySummary(data, domain, metadata) {
    return `This comprehensive analysis of ${metadata.totalRecords} records reveals the story of ${domain.replace('_', ' ')} operations. The data spans ${metadata.totalColumns} key dimensions, providing insights into performance, trends, and opportunities for optimization.`;
  }

  generateStoryChapters(data, domain, patterns, quality) {
    const chapters = [];

    // Chapter 1: Data Overview
    chapters.push({
      title: 'Chapter 1: The Data Landscape',
      content: `Our journey begins with ${data.length} records that paint a picture of ${domain.replace('_', ' ')} activities. The data quality score of ${(quality.overallScore * 100).toFixed(1)}% provides a solid foundation for our analysis.`
    });

    // Chapter 2: Trends and Patterns
    const trendCount = Object.keys(patterns.trends).length;
    chapters.push({
      title: 'Chapter 2: Uncovering Patterns',
      content: `We discovered ${trendCount} significant trends in the data, revealing the underlying dynamics of ${domain.replace('_', ' ')} operations. These patterns tell us about performance evolution and potential areas for improvement.`
    });

    // Chapter 3: Insights and Implications
    chapters.push({
      title: 'Chapter 3: Key Insights',
      content: `The analysis reveals critical insights about ${domain.replace('_', ' ')} performance, highlighting both strengths and opportunities for enhancement. These findings form the basis for strategic decision-making.`
    });

    return chapters;
  }

  generateKeyTakeaways(data, domain, patterns) {
    const takeaways = [];

    // Data volume takeaway
    takeaways.push(`📊 **Data Volume**: Analyzed ${data.length} records for comprehensive insights`);

    // Pattern takeaways
    Object.entries(patterns.trends).forEach(([column, trend]) => {
      takeaways.push(`📈 **${column} Trend**: ${trend} pattern indicates ${trend === 'increasing' ? 'positive momentum' : trend === 'decreasing' ? 'need for attention' : 'stable performance'}`);
    });

    // Domain-specific takeaways
    const domainTakeaways = this.getDomainTakeaways(domain);
    takeaways.push(...domainTakeaways);

    return takeaways;
  }

  getDomainTakeaways(domain) {
    const takeaways = {
      finance: [
        '💰 **Financial Health**: Comprehensive view of monetary flows and performance',
        '📊 **Transaction Analysis**: Detailed insights into financial operations'
      ],
      advertising: [
        '📢 **Campaign Performance**: Deep understanding of marketing effectiveness',
        '🎯 **Audience Insights**: Valuable data for targeting optimization'
      ],
      supply_chain: [
        '📦 **Inventory Management**: Insights into stock levels and logistics',
        '🚚 **Supplier Performance**: Analysis of vendor relationships and efficiency'
      ],
      hr: [
        '👥 **Employee Analytics**: Understanding of workforce dynamics',
        '📈 **Performance Metrics**: Insights into productivity and satisfaction'
      ],
      operations: [
        '⚙️ **Operational Efficiency**: Analysis of process performance',
        '📊 **Productivity Insights**: Understanding of operational effectiveness'
      ]
    };

    return takeaways[domain] || [
      '📋 **Business Intelligence**: Comprehensive analysis of operational data',
      '🎯 **Strategic Insights**: Data-driven understanding of business performance'
    ];
  }

  generateNextSteps(data, domain, quality) {
    const steps = [];

    // Data quality steps
    if (quality.overallScore < 0.8) {
      steps.push('🔧 **Data Quality Improvement**: Implement data validation and cleaning procedures');
    }

    // Analysis steps
    steps.push('📊 **Advanced Analytics**: Apply machine learning models for deeper insights');
    steps.push('📈 **Performance Monitoring**: Establish regular reporting and monitoring processes');
    steps.push('🎯 **Action Planning**: Develop specific action plans based on insights');

    // Domain-specific steps
    const domainSteps = this.getDomainSteps(domain);
    steps.push(...domainSteps);

    return steps;
  }

  getDomainSteps(domain) {
    const steps = {
      finance: [
        '💰 **Budget Optimization**: Use insights for better resource allocation',
        '📊 **Financial Planning**: Develop data-driven financial strategies'
      ],
      advertising: [
        '📢 **Campaign Optimization**: Refine marketing strategies based on insights',
        '🎯 **Audience Targeting**: Improve targeting using performance data'
      ],
      supply_chain: [
        '📦 **Inventory Optimization**: Reduce costs through better inventory management',
        '🚚 **Supplier Management**: Strengthen relationships with top-performing suppliers'
      ],
      hr: [
        '👥 **Talent Management**: Develop strategies for employee retention and development',
        '📈 **Performance Improvement**: Implement programs based on performance insights'
      ],
      operations: [
        '⚙️ **Process Optimization**: Streamline operations based on efficiency data',
        '📊 **Resource Allocation**: Optimize resource distribution for better performance'
      ]
    };

    return steps[domain] || [
      '📋 **Strategic Planning**: Use insights for long-term business planning',
      '🎯 **Continuous Improvement**: Establish ongoing analysis and optimization processes'
    ];
  }

  async assessRisks(data, domain) {
    const dataRisks = this.assessDataRisks(data);
    const businessRisks = this.assessBusinessRisks(data, domain);
    const operationalRisks = this.assessOperationalRisks(data, domain);
    const complianceRisks = this.assessComplianceRisks(data, domain);
    
    const risks = {
      dataRisks: dataRisks,
      businessRisks: businessRisks,
      operationalRisks: operationalRisks,
      complianceRisks: complianceRisks,
      mitigationStrategies: this.generateMitigationStrategies(data, domain, dataRisks)
    };

    return risks;
  }

  assessDataRisks(data) {
    const quality = this.assessDataQuality(data);
    const risks = [];

    if (quality.overallScore < 0.7) {
      risks.push({
        level: 'high',
        category: 'data_quality',
        description: 'Low data quality may lead to inaccurate analysis and poor decisions',
        impact: 'High impact on decision reliability'
      });
    }

    const outliers = this.detectOutliers(data);
    Object.entries(outliers).forEach(([column, count]) => {
      if (count > 0) {
        risks.push({
          level: 'medium',
          category: 'data_anomalies',
          description: `${count} outliers detected in ${column} may indicate data quality issues`,
          impact: 'Medium impact on analysis accuracy'
        });
      }
    });

    return risks;
  }

  assessBusinessRisks(data, domain) {
    const risks = [];
    const patterns = this.detectTrends(data);

    Object.entries(patterns).forEach(([column, trend]) => {
      if (trend === 'decreasing') {
        risks.push({
          level: 'medium',
          category: 'performance_decline',
          description: `Declining trend in ${column} indicates potential business performance issues`,
          impact: 'Medium impact on business performance'
        });
      }
    });

    return risks;
  }

  assessOperationalRisks(data, domain) {
    const risks = [];
    
    switch (domain) {
      case 'finance':
        risks.push({
          level: 'high',
          category: 'financial_risk',
          description: 'Financial data analysis reveals potential cash flow or profitability risks',
          impact: 'High impact on financial stability'
        });
        break;
      case 'supply_chain':
        risks.push({
          level: 'medium',
          category: 'supply_chain_risk',
          description: 'Supply chain data may reveal inventory or supplier risks',
          impact: 'Medium impact on operational continuity'
        });
        break;
    }

    return risks;
  }

  assessComplianceRisks(data, domain) {
    const risks = [];
    
    // Check for sensitive data
    const sensitiveColumns = Object.keys(data[0] || {}).filter(col => 
      ['ssn', 'credit_card', 'password', 'email', 'phone'].some(sensitive => 
        col.toLowerCase().includes(sensitive)
      )
    );

    if (sensitiveColumns.length > 0) {
      risks.push({
        level: 'high',
        category: 'data_privacy',
        description: `Sensitive data detected in columns: ${sensitiveColumns.join(', ')}`,
        impact: 'High impact on compliance and privacy'
      });
    }

    return risks;
  }

  generateMitigationStrategies(data, domain, dataRisks) {
    const strategies = [];

    // Data quality mitigation
    const quality = this.assessDataQuality(data);
    if (quality.overallScore < 0.8) {
      strategies.push({
        priority: 'high',
        action: 'Implement data validation and cleaning procedures',
        timeline: 'Immediate',
        resources: 'Data engineering team'
      });
    }

    // Risk-specific mitigation
    if (dataRisks && Array.isArray(dataRisks)) {
      dataRisks.forEach(risk => {
        if (risk.category === 'data_anomalies') {
          strategies.push({
            priority: 'medium',
            action: 'Investigate and resolve data anomalies',
            timeline: '1-2 weeks',
            resources: 'Data analysts'
          });
        }
      });
    }

    return strategies;
  }

  async identifyOpportunities(data, domain) {
    const optimization = this.identifyOptimizationOpportunities(data, domain);
    const growth = this.identifyGrowthOpportunities(data, domain);
    const efficiency = this.identifyEfficiencyOpportunities(data, domain);
    const innovation = this.identifyInnovationOpportunities(data, domain);
    
    const opportunities = {
      optimization: optimization,
      growth: growth,
      efficiency: efficiency,
      innovation: innovation,
      actionPlan: this.generateOpportunityActionPlan(data, domain, optimization, growth, efficiency, innovation)
    };

    return opportunities;
  }

  identifyOptimizationOpportunities(data, domain) {
    const opportunities = [];
    const patterns = this.detectTrends(data);

    Object.entries(patterns).forEach(([column, trend]) => {
      if (trend === 'stable') {
        opportunities.push({
          category: 'optimization',
          title: `Optimize ${column}`,
          description: `Stable performance in ${column} presents opportunity for optimization`,
          potential: 'Medium',
          effort: 'Low'
        });
      }
    });

    return opportunities;
  }

  identifyGrowthOpportunities(data, domain) {
    const opportunities = [];
    const patterns = this.detectTrends(data);

    Object.entries(patterns).forEach(([column, trend]) => {
      if (trend === 'increasing') {
        opportunities.push({
          category: 'growth',
          title: `Leverage ${column} Growth`,
          description: `Increasing trend in ${column} indicates growth opportunity`,
          potential: 'High',
          effort: 'Medium'
        });
      }
    });

    return opportunities;
  }

  identifyEfficiencyOpportunities(data, domain) {
    const opportunities = [];
    const quality = this.assessDataQuality(data);

    Object.entries(quality.completeness).forEach(([column, completeness]) => {
      if (completeness < 0.8) {
        opportunities.push({
          category: 'efficiency',
          title: `Improve ${column} Data Quality`,
          description: `Low completeness in ${column} presents efficiency improvement opportunity`,
          potential: 'Medium',
          effort: 'Low'
        });
      }
    });

    return opportunities;
  }

  identifyInnovationOpportunities(data, domain) {
    const opportunities = [];
    
    switch (domain) {
      case 'finance':
        opportunities.push({
          category: 'innovation',
          title: 'Predictive Financial Modeling',
          description: 'Implement AI-powered financial forecasting',
          potential: 'High',
          effort: 'High'
        });
        break;
      case 'advertising':
        opportunities.push({
          category: 'innovation',
          title: 'AI-Powered Targeting',
          description: 'Implement machine learning for audience targeting',
          potential: 'High',
          effort: 'Medium'
        });
        break;
      case 'supply_chain':
        opportunities.push({
          category: 'innovation',
          title: 'Predictive Inventory Management',
          description: 'Implement AI for demand forecasting',
          potential: 'High',
          effort: 'Medium'
        });
        break;
    }

    return opportunities;
  }

  generateOpportunityActionPlan(data, domain, optimization, growth, efficiency, innovation) {
    const allOpportunities = [
      ...(optimization || []),
      ...(growth || []),
      ...(efficiency || []),
      ...(innovation || [])
    ];

    // Sort by potential and effort
    const sortedOpportunities = allOpportunities.sort((a, b) => {
      const potentialScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const effortScore = { 'High': 1, 'Medium': 2, 'Low': 3 };
      
      const aScore = potentialScore[a.potential] * effortScore[a.effort];
      const bScore = potentialScore[b.potential] * effortScore[b.effort];
      
      return bScore - aScore;
    });

    return {
      immediate: sortedOpportunities.slice(0, 3),
      shortTerm: sortedOpportunities.slice(3, 6),
      longTerm: sortedOpportunities.slice(6, 9)
    };
  }

  async getExternalContext(domain) {
    console.log('🌐 Fetching external context...');
    
    const context = {
      marketTrends: await this.getMarketTrends(domain),
      economicIndicators: await this.getEconomicIndicators(domain),
      industryInsights: await this.getIndustryInsights(domain),
      regulatoryUpdates: await this.getRegulatoryUpdates(domain),
      timestamp: new Date().toISOString()
    };

    return context;
  }

  async getMarketTrends(domain) {
    // Simulated market trends - in production, this would fetch from NewsAPI or similar
    const trends = {
      finance: [
        {
          source: 'NewsAPI',
          date: '2025-01-15',
          title: 'Federal Reserve Signals Potential Rate Hikes',
          impact: 'May increase borrowing costs for businesses',
          relevance: 'high'
        },
        {
          source: 'MarketWatch',
          date: '2025-01-14',
          title: 'Tech Sector Shows Strong Q4 Performance',
          impact: 'Positive outlook for technology investments',
          relevance: 'medium'
        }
      ],
      advertising: [
        {
          source: 'AdWeek',
          date: '2025-01-15',
          title: 'Digital Advertising Spend Expected to Grow 15%',
          impact: 'Favorable environment for marketing investments',
          relevance: 'high'
        }
      ]
    };

    return trends[domain] || [];
  }

  async getEconomicIndicators(domain) {
    const indicators = {
      finance: {
        interestRate: '5.25%',
        inflationRate: '3.1%',
        gdpGrowth: '2.1%',
        unemploymentRate: '3.7%',
        consumerConfidence: '108.7'
      },
      advertising: {
        consumerSpending: '+2.3%',
        retailSales: '+0.6%',
        digitalAdSpend: '+15.2%'
      }
    };

    return indicators[domain] || {};
  }

  async getIndustryInsights(domain) {
    const insights = {
      finance: [
        'Rising interest rates may impact investment decisions',
        'Digital transformation accelerating in financial services',
        'Regulatory compliance costs increasing'
      ],
      advertising: [
        'Shift towards programmatic advertising',
        'Privacy regulations affecting targeting capabilities',
        'Video content consumption growing rapidly'
      ]
    };

    return insights[domain] || [];
  }

  async getRegulatoryUpdates(domain) {
    const updates = {
      finance: [
        {
          regulation: 'Basel III',
          impact: 'Increased capital requirements',
          effectiveDate: '2025-06-01'
        }
      ],
      advertising: [
        {
          regulation: 'GDPR Updates',
          impact: 'Enhanced privacy requirements',
          effectiveDate: '2025-03-01'
        }
      ]
    };

    return updates[domain] || [];
  }

  async generateVisualizations(data, domain) {
    console.log('📊 Generating visualizations...');
    
    const visualizations = {
      trends: await this.generateTrendCharts(data, domain),
      correlations: await this.generateCorrelationCharts(data, domain),
      distributions: await this.generateDistributionCharts(data, domain),
      forecasts: await this.generateForecastCharts(data, domain)
    };

    return visualizations;
  }

  async generateTrendCharts(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const charts = [];

    // Generate time series charts for key metrics
    const dateColumns = Object.keys(data[0] || {}).filter(col => 
      this.classifyDataType(data.map(row => row[col])) === 'date'
    );

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateCol = dateColumns[0];
      const metricCol = numericColumns[0];

      // Group data by month for trend analysis
      const monthlyData = {};
      data.forEach(row => {
        const date = new Date(row[dateCol]);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(parseFloat(row[metricCol]) || 0);
      });

      const labels = Object.keys(monthlyData).sort();
      const values = labels.map(month => {
        const monthValues = monthlyData[month];
        return monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
      });

      charts.push({
        type: 'line',
        title: `${this.getSemanticLabel(metricCol, data, domain)} Trends`,
        data: {
          labels: labels,
          datasets: [{
            label: this.getSemanticLabel(metricCol, data, domain),
            data: values,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${this.getSemanticLabel(metricCol, data, domain)} Trends (${domain})`
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Value'
              }
            }
          }
        }
      });
    }

    return charts;
  }

  async generateCorrelationCharts(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const charts = [];

    if (numericColumns.length >= 2) {
      // Find strongest correlations
      const correlations = [];
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const col1 = numericColumns[i];
          const col2 = numericColumns[j];
          const values1 = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
          const values2 = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
          
          if (values1.length > 10 && values2.length > 10) {
            const correlation = this.calculateCorrelation(values1, values2);
            correlations.push({
              col1, col2, correlation,
              label1: this.getSemanticLabel(col1, data, domain),
              label2: this.getSemanticLabel(col2, data, domain)
            });
          }
        }
      }

      // Sort by absolute correlation and take top 3
      correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      const topCorrelations = correlations.slice(0, 3);

      topCorrelations.forEach((corr, index) => {
        const values1 = data.map(row => parseFloat(row[corr.col1])).filter(v => !isNaN(v));
        const values2 = data.map(row => parseFloat(row[corr.col2])).filter(v => !isNaN(v));

        charts.push({
          type: 'scatter',
          title: `${corr.label1} vs ${corr.label2}`,
          data: {
            datasets: [{
              label: `Correlation: ${corr.correlation.toFixed(3)}`,
              data: values1.map((v, i) => ({ x: v, y: values2[i] })),
              backgroundColor: `hsl(${index * 120}, 70%, 50%)`,
              borderColor: `hsl(${index * 120}, 70%, 40%)`
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `${corr.label1} vs ${corr.label2} (r = ${corr.correlation.toFixed(3)})`
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: corr.label1
                }
              },
              y: {
                title: {
                  display: true,
                  text: corr.label2
                }
              }
            }
          }
        });
      });
    }

    return charts;
  }

  async generateDistributionCharts(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const charts = [];

    numericColumns.slice(0, 3).forEach((column, index) => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 0) {
        // Create histogram data
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount;
        
        const bins = Array(binCount).fill(0);
        values.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
          bins[binIndex]++;
        });

        const labels = bins.map((_, i) => {
          const start = min + i * binSize;
          const end = min + (i + 1) * binSize;
          return `${start.toFixed(0)}-${end.toFixed(0)}`;
        });

        charts.push({
          type: 'bar',
          title: `${this.getSemanticLabel(column, data, domain)} Distribution`,
          data: {
            labels: labels,
            datasets: [{
              label: 'Frequency',
              data: bins,
              backgroundColor: `hsl(${index * 120}, 70%, 60%)`,
              borderColor: `hsl(${index * 120}, 70%, 50%)`,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `${this.getSemanticLabel(column, data, domain)} Distribution`
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Frequency'
                }
              },
              x: {
                title: {
                  display: true,
                  text: this.getSemanticLabel(column, data, domain)
                }
              }
            }
          }
        });
      }
    });

    return charts;
  }

  async generateForecastCharts(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const charts = [];

    if (numericColumns.length > 0) {
      const column = numericColumns[0];
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 5) {
        // Simple linear forecast
        const trend = this.calculateTrend(values);
        const lastValue = values[values.length - 1];
        
        const forecastValues = [];
        const forecastLabels = [];
        
        for (let i = 1; i <= 6; i++) {
          forecastValues.push(lastValue * Math.pow(1 + trend, i));
          forecastLabels.push(`Forecast ${i}`);
        }

        charts.push({
          type: 'line',
          title: `${this.getSemanticLabel(column, data, domain)} Forecast`,
          data: {
            labels: ['Historical', ...forecastLabels],
            datasets: [
              {
                label: 'Historical',
                data: [...values.slice(-5), null, null, null, null, null, null],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: false
              },
              {
                label: 'Forecast',
                data: [null, null, null, null, null, ...forecastValues],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: false,
                borderDash: [5, 5]
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `${this.getSemanticLabel(column, data, domain)} 6-Month Forecast`
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Value'
                }
              }
            }
          }
        });
      }
    }

    return charts;
  }

  async generatePredictions(data, domain) {
    console.log('🔮 Generating predictions...');
    
    const predictions = {
      trends: await this.predictTrends(data, domain),
      anomalies: await this.predictAnomalies(data, domain),
      opportunities: await this.predictOpportunities(data, domain),
      risks: await this.predictRisks(data, domain)
    };

    return predictions;
  }

  async predictTrends(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const predictions = {};

    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 5) {
        const trend = this.calculateTrend(values);
        const lastValue = values[values.length - 1];
        
        predictions[column] = {
          currentValue: lastValue,
          trend: trend,
          nextMonth: lastValue * (1 + trend),
          nextQuarter: lastValue * Math.pow(1 + trend, 3),
          confidence: values.length > 10 ? 'high' : 'medium',
          factors: [
            `Historical trend: ${(trend * 100).toFixed(1)}% monthly change`,
            `Data points: ${values.length}`,
            `Volatility: ${this.calculateVolatility(values).toFixed(3)}`
          ]
        };
      }
    });

    return predictions;
  }

  async predictAnomalies(data, domain) {
    const numericColumns = this.getNumericColumns(data);
    const anomalies = [];

    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 10) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        
        values.forEach((value, index) => {
          if (Math.abs(value - mean) > 2 * stdDev) {
            anomalies.push({
              column: column,
              index: index,
              value: value,
              expected: mean,
              deviation: (value - mean) / stdDev,
              severity: Math.abs(value - mean) > 3 * stdDev ? 'high' : 'medium'
            });
          }
        });
      }
    });

    return anomalies;
  }

  async predictOpportunities(data, domain) {
    const opportunities = [];
    const numericColumns = this.getNumericColumns(data);

    // Identify growth opportunities
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 5) {
        const trend = this.calculateTrend(values);
        const growthRate = (values[values.length - 1] - values[0]) / values[0];
        
        if (trend > 0.05) {
          opportunities.push({
            type: 'growth',
            column: column,
            description: `Strong growth trend in ${this.getSemanticLabel(column, data, domain)}`,
            growthRate: growthRate,
            confidence: 'high',
            action: 'Consider increasing investment in this area'
          });
        }
      }
    });

    return opportunities;
  }

  async predictRisks(data, domain) {
    const risks = [];
    const numericColumns = this.getNumericColumns(data);

    // Identify declining trends and volatility risks
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
      
      if (values.length > 5) {
        const trend = this.calculateTrend(values);
        const volatility = this.calculateVolatility(values);
        
        if (trend < -0.05) {
          risks.push({
            type: 'decline',
            column: column,
            description: `Declining trend in ${this.getSemanticLabel(column, data, domain)}`,
            severity: 'medium',
            confidence: 'high',
            action: 'Investigate root cause and implement corrective measures'
          });
        }
        
        if (volatility > 0.5) {
          risks.push({
            type: 'volatility',
            column: column,
            description: `High volatility in ${this.getSemanticLabel(column, data, domain)}`,
            severity: 'medium',
            confidence: 'medium',
            action: 'Implement risk mitigation strategies'
          });
        }
      }
    });

    return risks;
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean; // Coefficient of variation
  }
}

module.exports = DataComprehensionEngine; 
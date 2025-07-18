# Sygnify Analytics Hub - Modular Service Architecture

## Overview

The Sygnify Analytics Hub has been refactored into a modular service architecture that provides clean, testable, and scalable analysis capabilities. This new architecture separates concerns into dedicated services and provides flexible API endpoints for different analysis needs.

## 🏗️ Architecture Overview

```
backend/
├── services/                    # Core service modules
│   ├── LabelService.js         # Smart labeling and data type detection
│   ├── InsightService.js       # Metrics computation and insight generation
│   ├── PredictionService.js    # Forecasting with confidence scores
│   ├── RecommendationService.js # Strategic recommendations
│   └── NarrativeService.js     # Human-readable narrative generation
├── config/                     # Domain-specific configurations
│   └── domains/
│       └── finance.yaml        # Finance domain configuration
├── server/routes/
│   └── analyze.js              # Modular API endpoints
├── tests/
│   └── service-tests.js        # Automated test coverage
└── main.py                     # Legacy Python integration (maintained)
```

## 🧱 Service Layer Components

### 1. LabelService.js
**Purpose**: Handles semantic labeling, data types, and importance scoring

**Key Features**:
- Prioritized glossary lookup over cross-column inference
- Normalized [0-100] importance scale (fixes 10000% bug)
- Robust data type detection with 80% threshold
- Domain-specific field semantics
- Validation for label consistency

**Example Usage**:
```javascript
const labelService = new LabelService('finance');
const labels = await labelService.extractLabels(data);
// Returns: { column: { semantic, category, importance, type, confidence } }
```

### 2. InsightService.js
**Purpose**: Computes averages, scoring metrics, and generates explainable insights

**Key Features**:
- Comprehensive metrics (min, max, std deviation, variance)
- Anomaly detection (Z-score and IQR methods)
- Deduplication of insights to prevent redundancy
- Dynamic KPI support per domain
- Clear anomaly flagging

**Example Usage**:
```javascript
const insightService = new InsightService('finance');
const results = await insightService.computeMetrics(data, labels);
// Returns: { metrics, insights, anomalies, kpis, summary }
```

### 3. PredictionService.js
**Purpose**: Handles forecasting with variance ranges and risk-aware predictions

**Key Features**:
- Multiple forecasting methods (simple, linear, seasonal, ensemble)
- Variance ranges in forecast outputs (±$3,000)
- Confidence scores based on historical volatility
- Fraud trend integration into cash flow forecasts
- Visual confidence tags (high/medium/low)

**Example Usage**:
```javascript
const predictionService = new PredictionService('finance');
const forecasts = await predictionService.generateForecasts(data, labels, metrics);
// Returns: { revenue, cashFlow, fraud, summary }
```

### 4. RecommendationService.js
**Purpose**: Maps insights to concrete actionable recommendations

**Key Features**:
- Modular rule system for easy addition of new rules
- High fraud score → "Automated fraud detection" mapping
- Low profitability vs balance → "Optimize pricing strategy"
- Priority and impact scoring
- Implementation plans with timelines

**Example Usage**:
```javascript
const recommendationService = new RecommendationService('finance');
const recommendations = await recommendationService.generateRecommendations(metrics, insights, forecasts, labels);
// Returns: { recommendations, strategic, summary, categories }
```

### 5. NarrativeService.js
**Purpose**: Composes structured narratives using insights

**Key Features**:
- Multiple tones: executive summary vs analyst breakdown
- Data context inclusion ("Based on 10,001 records...")
- Sentence template variation to avoid redundancy
- Structured format with key findings and insights
- Human-readable summaries

**Example Usage**:
```javascript
const narrativeService = new NarrativeService('finance');
const narratives = await narrativeService.generateNarratives(metrics, insights, forecasts, recommendations, labels, 'executive');
// Returns: { main, supporting, dataStory, summary }
```

## 🏷️ Enhanced Smart Labeling Engine

### Fixed Issues:
- ✅ Replaced hardcoded importance values (10000%) with normalized [0-100] scale
- ✅ Added checks to prevent mislabeled types (amount as object)
- ✅ Implemented fallback logic for missing headers
- ✅ YAML config per domain for expected field semantics

### Key Improvements:
```javascript
// Before: Generic importance values
importance: 10000

// After: Normalized scale
importance: 95 // 0-100 scale

// Before: Incorrect data types
amount: { type: "object" }

// After: Correct data types
amount: { type: "numeric" }
```

## 📊 Insight Engine Improvements

### Features:
- ✅ Min, max, std deviation with each average
- ✅ Clear anomaly flagging (negative transaction amounts)
- ✅ Dynamic KPIs per domain
- ✅ Deduplication to prevent repeating values

### Example Output:
```javascript
{
  "amount": {
    "average": -1001.36,
    "min": -5000.00,
    "max": 2000.00,
    "stdDev": 1500.25,
    "anomalies": [
      { "type": "negative_amount", "count": 150 }
    ]
  }
}
```

## 🔮 Forecasting & Confidence Scores

### Features:
- ✅ Variance ranges in forecast outputs (±$3,000)
- ✅ Fraud trends factored into cash flow confidence
- ✅ Visual confidence tags: high/medium/low
- ✅ Underlying logic explanation ("3-month trailing average")

### Example Output:
```javascript
{
  "revenue": {
    "nextMonth": {
      "value": 50000,
      "variance": 3000,
      "confidence": 0.85,
      "range": { "low": 47000, "high": 53000 }
    }
  }
}
```

## 🤖 Recommendation Intelligence

### Features:
- ✅ High fraud_score avg → "Automated fraud detection" rec
- ✅ Low profitability vs balance → "Optimize pricing strategy"
- ✅ Modular rules for quick addition
- ✅ Priority and impact scoring

### Example Output:
```javascript
{
  "recommendations": [
    {
      "title": "Implement Advanced Fraud Detection",
      "priority": "critical",
      "impact": "high",
      "effort": "medium",
      "timeline": "2-4 weeks"
    }
  ]
}
```

## 📝 Narrative Generation

### Features:
- ✅ Human-readable summaries with data context
- ✅ Multiple tones: executive vs analyst
- ✅ Sentence template variation
- ✅ Structured format

### Example Output:
```javascript
{
  "headline": "Financial Analysis Summary: Finance Insights",
  "summary": "Analysis of 10,001 records reveals stable performance patterns with low risk level.",
  "keyFindings": [
    "Average transaction amount: $-1,001.36 with low volatility",
    "Account balance shows stable trend with 85% confidence"
  ]
}
```

## ⚙️ Modular API Routes

### New Endpoints:
```
POST /api/analyze/upload          # Upload and analyze CSV
GET /api/analyze/summary/:id      # Get analysis summary
GET /api/analyze/predictions/:id  # Get forecasts
GET /api/analyze/recommendations/:id # Get recommendations
GET /api/analyze/narrative/:id    # Get narrative
GET /api/analyze/labels/:id       # Get smart labels
GET /api/analyze/metrics/:id      # Get detailed metrics
```

### Example Response Format:
```javascript
{
  "scorecard": { 
    "liquidity": 90, 
    "profitability": 80 
  },
  "insights": [...],
  "forecast": { 
    "revenue": "$50k", 
    "confidence": "high" 
  },
  "narrative": "Based on 10,001 records..."
}
```

## 🧪 Test Coverage

### Automated Tests:
- ✅ Label engine: correctly detects amount as numeric
- ✅ Insight engine: returns average fraud score within expected bounds
- ✅ Forecasting: validates output format and confidence scores
- ✅ Recommendation: at least 2 input scenarios trigger expected suggestions

### Running Tests:
```bash
cd backend
node tests/service-tests.js
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
# Server runs on http://localhost:3000
```

### 3. Upload and Analyze
```bash
curl -X POST http://localhost:3000/api/analyze/upload \
  -F "file=@financial_transactions_data.csv" \
  -F "domain=finance" \
  -F "tone=executive"
```

### 4. Get Analysis Results
```bash
# Get summary
curl http://localhost:3000/api/analyze/summary/{analysisId}

# Get predictions
curl http://localhost:3000/api/analyze/predictions/{analysisId}

# Get recommendations
curl http://localhost:3000/api/analyze/recommendations/{analysisId}
```

## 🔧 Configuration

### Domain Configuration (YAML)
```yaml
# config/domains/finance.yaml
domain: finance
expected_fields:
  amount: "Transaction Amount (Revenue/Expense)"
  balance: "Account Balance"
  fraud_score: "Fraud Score"

thresholds:
  fraud_score:
    high: 0.7
    medium: 0.4
```

### Adding New Domains
1. Create `config/domains/{domain}.yaml`
2. Define expected fields and thresholds
3. Services automatically load domain-specific config

## 📈 Performance Improvements

### Before (Legacy):
- Monolithic analysis function
- Hardcoded values and logic
- No separation of concerns
- Difficult to test and maintain

### After (Modular):
- Clean service separation
- Configurable domain settings
- Comprehensive test coverage
- Scalable architecture

## 🔄 Migration Guide

### From Legacy to Modular:
1. **Immediate**: Use new `/api/analyze/*` endpoints
2. **Gradual**: Legacy `/api/v1/upload` still supported
3. **Testing**: Run `service-tests.js` to validate
4. **Configuration**: Add domain-specific YAML configs

### Backward Compatibility:
- Legacy Python integration maintained in `main.py`
- Existing frontend continues to work
- Gradual migration path available

## 🎯 Future Enhancements

### Planned Features:
- [ ] Excel (.xlsx) file support
- [ ] Admin override for auto-generated insights
- [ ] Multiple dataset comparison
- [ ] Real-time streaming analysis
- [ ] Advanced ML model integration

### Extensibility:
- Add new services by extending base classes
- Create domain-specific configurations
- Implement custom recommendation rules
- Add new narrative templates

## 📚 API Documentation

### Full API docs available at:
```
GET http://localhost:3000/api/docs
```

### Swagger/OpenAPI spec:
```yaml
openapi: 3.0.0
info:
  title: Sygnify Analytics Hub API
  version: 2.1.0
  description: Modular financial analysis API
```

## 🤝 Contributing

### Development Workflow:
1. Create feature branch
2. Implement service changes
3. Add/update tests
4. Update documentation
5. Submit pull request

### Code Standards:
- ES6+ JavaScript
- Async/await patterns
- Comprehensive error handling
- JSDoc documentation
- Unit test coverage

## 📞 Support

For questions or issues:
- Check test results: `node tests/service-tests.js`
- Review service logs in console
- Validate configuration files
- Check API documentation at `/api/docs`

---

**Version**: 2.1.0  
**Last Updated**: July 2024  
**Architecture**: Modular Service Layer  
**Status**: Production Ready ✅ 
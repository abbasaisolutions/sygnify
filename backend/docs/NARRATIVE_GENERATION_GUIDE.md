# LLaMA 3 Narrative Generation Guide

## 🎯 Overview

This guide demonstrates how to use the refined LLaMA 3 integration for generating professional narrative summaries from structured financial data. The system uses carefully crafted prompts to produce high-quality, business-ready narratives.

## 📊 Structured Data Format

### Required JSON Structure

```json
{
  "domain": "Finance",
  "records_analyzed": 10001,
  "dimensions": 16,
  "data_quality_score": 95,
  "financial_health_score": 85,
  "risk_level": "HIGH",
  "prediction_confidence": "B",
  "performance_grade": "B",
  "avg_transaction_amount": -1001.36,
  "avg_account_balance": 49448.56,
  "avg_fraud_score": 0.498,
  "liquidity": { 
    "score": 90, 
    "grade": "A", 
    "insight": "Strong cash flow patterns" 
  },
  "profitability": { 
    "score": 80, 
    "grade": "B", 
    "insight": "Stable revenue streams" 
  },
  "efficiency": { 
    "score": 85, 
    "grade": "A", 
    "insight": "Good operational efficiency" 
  },
  "forecast": {
    "revenue_next_month": 50000,
    "revenue_next_quarter": 150000,
    "cashflow_next_month": 45000,
    "revenue_confidence": "high",
    "cashflow_confidence": "medium",
    "cashflow_risk": "low"
  },
  "recommendations": [
    "Optimize transaction processing",
    "Implement automated fraud detection"
  ]
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `domain` | string | Business domain | "Finance", "Healthcare", "Retail" |
| `records_analyzed` | number | Total records processed | 10001 |
| `dimensions` | number | Number of data columns | 16 |
| `data_quality_score` | number | Data quality percentage | 95 |
| `financial_health_score` | number | Overall health score (0-100) | 85 |
| `risk_level` | string | Risk assessment | "LOW", "MEDIUM", "HIGH" |
| `prediction_confidence` | string | Forecast confidence grade | "A", "B", "C" |
| `performance_grade` | string | Performance grade | "A", "B", "C", "D" |
| `avg_transaction_amount` | number | Average transaction value | -1001.36 |
| `avg_account_balance` | number | Average account balance | 49448.56 |
| `avg_fraud_score` | number | Average fraud risk score | 0.498 |
| `liquidity` | object | Liquidity metrics | `{score: 90, grade: "A", insight: "..."}` |
| `profitability` | object | Profitability metrics | `{score: 80, grade: "B", insight: "..."}` |
| `efficiency` | object | Efficiency metrics | `{score: 85, grade: "A", insight: "..."}` |
| `forecast` | object | Forecast data | `{revenue_next_month: 50000, ...}` |
| `recommendations` | array | Action items | `["Optimize...", "Implement..."]` |

## 🚀 API Usage

### Endpoint 1: Full Narrative Generation

**POST** `/api/analyze/narrative/generate`

```bash
curl -X POST http://localhost:3000/api/analyze/narrative/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "domain": "Finance",
      "records_analyzed": 10001,
      "financial_health_score": 85,
      "risk_level": "HIGH",
      "avg_fraud_score": 0.498,
      "liquidity": {"score": 90, "grade": "A", "insight": "Strong cash flow"},
      "profitability": {"score": 80, "grade": "B", "insight": "Stable revenue"},
      "efficiency": {"score": 85, "grade": "A", "insight": "Good efficiency"},
      "forecast": {
        "revenue_next_month": 50000,
        "revenue_confidence": "high",
        "cashflow_next_month": 45000,
        "cashflow_risk": "low"
      },
      "recommendations": [
        "Optimize transaction processing",
        "Implement automated fraud detection"
      ]
    },
    "style": "executive",
    "customInstructions": "Focus on business impact and actionable insights",
    "temperature": 0.7,
    "maxTokens": 1500
  }'
```

**Response:**
```json
{
  "success": true,
  "narrative": {
    "content": "Sygnify analyzed 10,001 financial transactions across 16 dimensions, achieving a data quality score of 95%, indicating strong dataset integrity...",
    "style": "executive",
    "wordCount": 150,
    "sections": {
      "Executive Summary": "...",
      "Key Risks & Opportunities": "...",
      "Strategic Recommendations": "..."
    },
    "keyPoints": [
      "Strong liquidity with A grade performance",
      "High risk level requires attention",
      "Revenue forecast shows positive trend"
    ],
    "recommendations": [
      "Implement automated fraud detection",
      "Optimize transaction processing"
    ]
  },
  "metadata": {
    "aiGenerated": true,
    "model": "llama3.1:8b",
    "confidence": 0.85,
    "generationTime": 2500,
    "tokensUsed": 450
  },
  "data": {
    "recordCount": 10001,
    "domain": "Finance",
    "healthScore": 85,
    "riskLevel": "HIGH"
  }
}
```

### Endpoint 2: Quick Narrative Generation

**POST** `/api/analyze/narrative/quick`

```bash
curl -X POST http://localhost:3000/api/analyze/narrative/quick \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "domain": "Finance",
      "records_analyzed": 10001,
      "financial_health_score": 85,
      "risk_level": "HIGH",
      "avg_fraud_score": 0.498
    }
  }'
```

## 🎨 Narrative Styles

### 1. Executive Style
- **Purpose**: C-level executive summaries
- **Length**: 150-200 words
- **Focus**: High-level insights, strategic implications
- **Structure**: Executive Summary → Key Risks → Strategic Recommendations → Overall Assessment

### 2. Bullet Style
- **Purpose**: Quick, scannable summaries
- **Format**: Bullet points
- **Focus**: Key metrics, risk factors, recommendations
- **Structure**: Data Overview → Key Metrics → Risk Factors → Recommendations → Next Steps

### 3. Narrative Style
- **Purpose**: Comprehensive business intelligence reports
- **Length**: 500-800 words
- **Focus**: Complete data story, context, detailed analysis
- **Structure**: Executive Summary → Key Findings → Risk Assessment → Performance Analysis → Strategic Recommendations → Future Outlook

### 4. Technical Style
- **Purpose**: Detailed technical analysis
- **Length**: 800-1200 words
- **Focus**: Statistical context, methodology, confidence intervals
- **Structure**: Methodology → Statistical Analysis → Confidence Intervals → Risk Assessment → Technical Recommendations → Model Performance

## 🧪 Demo and Testing

### Run the Demo

```bash
# Start LLaMA service first
ollama serve

# Pull the model
ollama pull llama3.1:8b

# Run the demo
npm run demo:narrative
```

### Demo Output

```
🚀 Sygnify Analytics Hub - LLaMA 3 Narrative Generation Demo

✅ LLaMA connection successful

🎯 Demo: Executive Summary Generation
=====================================

📊 Input Data:
{
  "domain": "Finance",
  "records_analyzed": 10001,
  "financial_health_score": 85,
  "risk_level": "HIGH",
  ...
}

🤖 Generating AI Narrative...

✅ AI-Generated Executive Summary:
==================================
Sygnify analyzed 10,001 financial transactions across 16 dimensions, 
achieving a data quality score of 95%, indicating strong dataset integrity.

The organization demonstrates strong liquidity and operational efficiency, 
supported by an 'A' grade in both areas. Profitability is moderate but stable. 
However, the financial health score of 85 is offset by a high risk level, 
and a confidence grade of 'B' suggests moderate certainty in projections.

Revenue and cash flow forecasts for the upcoming month are optimistic, 
at $50,000 and $45,000 respectively, with low cash flow risk. 
These figures point toward a promising short-term outlook.

Key Risks & Opportunities:
• Average fraud scores indicate potential exposure, warranting investment in risk mitigation.
• Negative average transaction amounts suggest outflows dominate inflows—requiring closer scrutiny.

Strategic Recommendations:
• Automate fraud detection to reduce potential financial threats.
• Streamline transaction processes to improve efficiency and cost savings.

Overall, the financial system appears healthy but could benefit from 
risk reduction strategies and continued investment in analytics automation.

📈 Metadata:
- Model: llama3.1:8b
- Confidence: 0.85
- Word Count: 145
- Generation Time: 2500ms
```

## 🔧 Configuration

### Environment Variables

```env
# LLaMA Configuration
LLAMA_ENDPOINT=http://localhost:11434/api/generate
LLAMA_MODEL=llama3.1:8b
LLAMA_TEMPERATURE=0.7
LLAMA_MAX_TOKENS=2048
LLAMA_TIMEOUT=30000

# Optional: Rate limiting
LLAMA_RATE_LIMIT=10
LLAMA_BURST_LIMIT=5
```

### Prompt Customization

You can customize prompts by modifying the `loadPromptTemplates()` method in `LLaMAService.js`:

```javascript
executive: {
    system: `You are a financial intelligence analyst AI. Generate professional narrative summaries for business dashboards.

Focus on clarity, insight, and business value. Avoid repeating numeric stats — interpret them instead.
Provide actionable insights and clear recommendations. Use professional, confident language.`,
    
    user: `Using the structured data below, generate a professional executive summary for a business dashboard.

Summarize key findings, scores, and recommendations. Focus on clarity, insight, and business value. 
Avoid repeating numeric stats — interpret them instead.

Data:
{JSON_DATA}

Format the response as a professional executive summary with:
1. Executive Summary (2-3 paragraphs)
2. Key Risks & Opportunities (bullet points)
3. Strategic Recommendations (bullet points)
4. Overall Assessment (1 paragraph)`
}
```

## 📈 Best Practices

### 1. Data Quality
- Ensure all required fields are present
- Validate numeric ranges (scores 0-100, grades A-D)
- Use consistent risk level terminology (LOW, MEDIUM, HIGH)

### 2. Prompt Engineering
- Keep prompts clear and specific
- Include format instructions
- Specify tone and style requirements
- Add custom instructions for domain-specific needs

### 3. Error Handling
- Always implement fallback mechanisms
- Monitor generation times and token usage
- Log errors for debugging
- Provide meaningful error messages

### 4. Performance Optimization
- Cache frequently requested narratives
- Use appropriate temperature settings (0.7 for creativity, 0.3 for consistency)
- Limit token usage based on use case
- Implement rate limiting for production

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```
   Error: LLaMA API connection timeout
   Solution: Verify Ollama is running and endpoint is correct
   ```

2. **Model Not Found**
   ```
   Error: Specified LLaMA model not found
   Solution: Pull the model: ollama pull llama3.1:8b
   ```

3. **Poor Quality Output**
   ```
   Issue: Narratives are generic or inaccurate
   Solution: Improve data quality and prompt specificity
   ```

4. **Slow Generation**
   ```
   Issue: Takes too long to generate narratives
   Solution: Reduce maxTokens, use smaller model, optimize prompts
   ```

### Debug Mode

Enable debug logging by setting environment variables:

```env
DEBUG=llama:*
LOG_LEVEL=debug
```

## 🔮 Future Enhancements

### Planned Features

1. **Multi-language Support**
   - Spanish, French, German narratives
   - Localized business terminology

2. **Advanced Customization**
   - User-defined prompt templates
   - Industry-specific terminology
   - Brand voice customization

3. **Real-time Generation**
   - Streaming responses
   - Progressive narrative building
   - Interactive editing

4. **Enhanced Analytics**
   - Narrative quality scoring
   - A/B testing for prompts
   - Performance analytics

---

*This guide covers the refined LLaMA 3 integration for professional narrative generation. For additional support, refer to the main documentation or create an issue in the repository.* 
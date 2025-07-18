# Sygnify Financial Analysis Module

A production-ready, scalable financial analytics module with LLM-powered insights, interactive visualizations, and role-based narratives.

## 🚀 Features

### Core Capabilities
- **Smart Labeling**: AI-powered financial metric identification and categorization
- **External Context**: Real-time market data integration (NewsAPI, FRED, Alpha Vantage)
- **Interactive Visualizations**: Adaptive Chart.js configs with drill-down capabilities
- **LLM-Driven Narratives**: Role-based, preference-driven financial insights
- **Data Quality Analysis**: Outlier detection and missing data assessment
- **SMART Recommendations**: Actionable, prioritized business recommendations

### Advanced Features
- **A/B Testing**: Narrative style optimization based on user engagement
- **User Preferences**: Personalized tone, verbosity, and role-based content
- **Redis Caching**: Performance optimization for external data and LLM calls
- **Modular Architecture**: Independently deployable and testable components
- **Fallback Systems**: Robust error handling with template-based alternatives

## 📁 Architecture

```
backend/financial_analysis/
├── __init__.py
├── smart_labeler.py          # AI-powered financial label extraction
├── external_context.py       # Market data integration & caching
├── visualization.py          # Chart.js config generation
├── narrative.py              # LLM-driven narrative generation
├── data_quality.py           # Outlier detection & data assessment
├── recommendations.py        # SMART recommendation engine
├── analyze.py                # Main orchestrator
├── test_runner.py            # Test suite runner
├── finance_glossary.json     # Financial terms mapping
├── templates/
│   └── narrative_fallback.txt # Fallback narrative templates
└── tests/
    ├── __init__.py
    └── test_narrative.py     # Comprehensive unit tests
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Redis (for caching)
- PostgreSQL (for user preferences and feedback)

### Dependencies
```bash
pip install numpy redis pytest asyncio
```

### Environment Variables
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# External APIs (optional)
NEWS_API_KEY=your_news_api_key
FRED_API_KEY=your_fred_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# LLM Configuration (for production)
LLM_ENDPOINT=http://localhost:11434  # Ollama endpoint
LLM_MODEL=llama3.2:3b-q4_0
```

## 📖 Usage

### Basic Usage
```python
import asyncio
from analyze import run_financial_analysis

# Sample financial data
columns = ["Revenue", "Net Income", "Total Assets"]
sample_rows = [
    {"Revenue": 100000, "Net Income": 15000, "Total Assets": 500000},
    {"Revenue": 120000, "Net Income": 18000, "Total Assets": 520000},
    {"Revenue": 90000, "Net Income": 12000, "Total Assets": 480000}
]

# Run complete analysis
result = await run_financial_analysis(
    columns=columns,
    sample_rows=sample_rows,
    user_id=123,
    user_role="executive"
)

print(result["narrative"]["headline"])
print(result["recommendations"])
```

### Narrative Generation Only
```python
from narrative import NarrativeGenerator

narrative_gen = NarrativeGenerator()
result = await narrative_gen.generate_complete_analysis(
    {"data": sample_rows, "labels": labels},
    user_id=123,
    user_role="analyst"
)
```

## 🧪 Testing

### Run All Tests
```bash
cd backend/financial_analysis
python test_runner.py
```

### Run Unit Tests Only
```bash
pytest tests/ -v
```

### Run Integration Test
```bash
python analyze.py
```

## 🔧 Configuration

### User Preferences
The system supports personalized user preferences stored in PostgreSQL:

```sql
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY,
    tone VARCHAR(20) DEFAULT 'professional',
    verbosity VARCHAR(20) DEFAULT 'detailed',
    role VARCHAR(20) DEFAULT 'analyst',
    ab_test_group VARCHAR(20) DEFAULT 'detailed',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### A/B Test Variants
```python
ab_test_variants = {
    "concise": {"max_length": 150, "style": "bullet_points"},
    "detailed": {"max_length": 300, "style": "paragraphs"},
    "executive": {"max_length": 200, "style": "high_level"}
}
```

## 📊 Output Format

The module returns a structured JSON response:

```json
{
  "version": "1.0.0",
  "success": true,
  "smart_labels": {
    "Revenue": "Revenue Metric",
    "Net Income": "Profitability Metric"
  },
  "external_context": {
    "news": [...],
    "fred": {...},
    "alpha_vantage": {...}
  },
  "visualizations": {
    "chart_config": {...},
    "caption": "Revenue shows increasing trend..."
  },
  "narrative": {
    "headline": "Executive Summary: Key Financial Insights",
    "paragraphs": ["Based on our analysis..."],
    "metadata": {
      "variant": "executive",
      "method": "template",
      "generated_at": "2024-01-01T00:00:00Z"
    }
  },
  "facts": {
    "facts": ["Revenue shows increasing trend..."]
  },
  "data_quality": {
    "outliers": [2],
    "missing": {"count": 0, "suggestion": "None"},
    "problematic_rows": [...]
  },
  "recommendations": [
    {
      "recommendation": "Optimize revenue growth",
      "priority": 1,
      "specific": true,
      "measurable": true,
      "achievable": true,
      "relevant": true,
      "time_bound": true
    }
  ],
  "metadata": {
    "user_id": 123,
    "user_role": "executive",
    "generated_at": "2024-01-01T00:00:00Z",
    "pipeline_version": "1.0.0"
  }
}
```

## 🔄 API Integration

### FastAPI Endpoint Example
```python
from fastapi import FastAPI, HTTPException
from analyze import run_financial_analysis

app = FastAPI()

@app.post("/analyze/financial")
async def analyze_financial_data(request: dict):
    try:
        result = await run_financial_analysis(
            columns=request["columns"],
            sample_rows=request["data"],
            user_id=request.get("user_id"),
            user_role=request.get("user_role", "analyst")
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🚀 Production Deployment

### Docker Setup
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Performance Optimization
- **LLM Quantization**: Use `llama3.2:3b-q4_0` for 2-5s response times
- **Redis Caching**: 1-hour TTL for external API data
- **Batch Processing**: Process multiple narratives concurrently
- **Connection Pooling**: Reuse database and Redis connections

### Monitoring
- Track A/B test engagement scores
- Monitor LLM latency and fallback rates
- Log user preference changes
- Alert on data quality issues

## 🔮 Future Enhancements

### Planned Features
- **Fine-tuned BERT**: Domain-specific label extraction
- **Isolation Forest**: Advanced outlier detection
- **Sankey Diagrams**: Cash flow visualization
- **Real-time Alerts**: Threshold-based notifications
- **Multi-language Support**: International financial terms

### Scalability Improvements
- **Microservices**: Independent deployment of each module
- **Event-driven Architecture**: Async processing with message queues
- **Horizontal Scaling**: Load balancing across multiple instances
- **CDN Integration**: Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
- Create an issue in the repository
- Check the test suite for usage examples
- Review the integration tests in `analyze.py`

---

**Built with ❤️ for scalable, intelligent financial analytics** 
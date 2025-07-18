# LLaMA 3 Integration for AI-Powered Narrative Generation

## Overview

Sygnify Analytics Hub now supports **Meta LLaMA 3** for generating context-aware, data-driven narratives that are far more nuanced than template-based methods. This integration provides:

- **Structured JSON prompts** for consistent, high-quality output
- **Multiple narrative styles**: executive summaries, bullet points, comprehensive reports, technical analysis
- **Fallback mechanisms** to template-based generation when AI is unavailable
- **Rate limiting** and error handling for production reliability

## 🚀 Quick Start

### 1. Install LLaMA 3

#### Option A: Using Ollama (Recommended)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull LLaMA 3 model
ollama pull llama3.1:8b

# Start Ollama service
ollama serve
```

#### Option B: Using llama.cpp
```bash
# Clone and build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Download LLaMA 3 model and run server
./server -m models/llama-3.1-8b.gguf -c 2048 -ngl 35
```

### 2. Configure Environment Variables

Create or update your `.env` file:

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

# Optional: Fallback settings
LLAMA_FALLBACK_ENABLED=true
LLAMA_FALLBACK_TIMEOUT=5000
```

### 3. Test the Integration

```bash
# Test LLaMA connection and narrative generation
npm run test:llama
```

## 📊 API Usage

### Basic Narrative Generation

```javascript
const NarrativeService = require('./services/NarrativeService');

// Initialize with AI enabled
const narrativeService = new NarrativeService('finance', {
  useAI: true,
  llamaEndpoint: 'http://localhost:11434/api/generate',
  llamaModel: 'llama3.1:8b'
});

// Generate AI-powered narrative
const narratives = await narrativeService.generateNarratives(
  metrics,
  insights,
  forecasts,
  recommendations,
  labels,
  'executive',
  { useAI: true }
);
```

### Advanced AI Options

```javascript
// Custom AI generation with specific parameters
const narratives = await narrativeService.generateNarratives(
  metrics,
  insights,
  forecasts,
  recommendations,
  labels,
  'executive',
  {
    useAI: true,
    style: 'executive',
    customInstructions: 'Focus on risk assessment and compliance implications',
    temperature: 0.8,
    maxTokens: 1500
  }
);
```

## 🔌 API Endpoints

### 1. AI-Powered Narrative Generation

**POST** `/api/analyze/narrative/ai`

```json
{
  "analysisId": "uuid-of-analysis",
  "style": "executive",
  "customInstructions": "Focus on executive-level insights",
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response:**
```json
{
  "success": true,
  "narrative": {
    "headline": "Financial Analysis Alert: 10,001 Records Show Elevated Risk",
    "summary": "Analysis reveals concerning patterns...",
    "keyFindings": ["Finding 1", "Finding 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "metadata": {
    "aiGenerated": true,
    "model": "llama3.1:8b",
    "confidence": 0.85
  }
}
```

### 2. LLaMA Status Check

**GET** `/api/analyze/llama/status`

**Response:**
```json
{
  "connection": {
    "success": true,
    "message": "LLaMA API connection successful"
  },
  "availableModels": [
    {"name": "llama3.1:8b", "size": "4.7GB"},
    {"name": "llama3.1:70b", "size": "40GB"}
  ],
  "configuredEndpoint": "http://localhost:11434/api/generate",
  "configuredModel": "llama3.1:8b"
}
```

## 🎨 Narrative Styles

### 1. Executive Style
- **Purpose**: C-level executive summaries
- **Length**: 150-200 words
- **Focus**: High-level insights, strategic implications, key recommendations
- **Tone**: Professional, confident, actionable

### 2. Bullet Style
- **Purpose**: Quick, scannable summaries
- **Format**: Bullet points
- **Focus**: Key metrics, risk factors, recommendations
- **Use Case**: Dashboards, quick reports

### 3. Narrative Style
- **Purpose**: Comprehensive business intelligence reports
- **Length**: 500-800 words
- **Focus**: Complete data story, context, detailed analysis
- **Tone**: Natural, flowing, educational

### 4. Technical Style
- **Purpose**: Detailed technical analysis
- **Length**: 800-1200 words
- **Focus**: Statistical context, methodology, confidence intervals
- **Tone**: Technical, precise, analytical

## 📝 Prompt Engineering

### Structured JSON Input

The system automatically transforms analytics data into structured JSON:

```json
{
  "summary": {
    "recordCount": 10001,
    "dimensions": 16,
    "dataQualityScore": 95,
    "avgTransactionAmount": -1001.36,
    "avgAccountBalance": 49448.56,
    "avgFraudScore": 0.498,
    "riskLevel": "high",
    "financialHealthScore": 85
  },
  "keyMetrics": {
    "transaction_amount": {
      "average": -1001.36,
      "volatility": 0.3
    }
  },
  "insights": [
    {
      "description": "High fraud score indicates elevated risk",
      "severity": "warning"
    }
  ],
  "forecast": {
    "revenue": 50000,
    "confidence": 0.85
  },
  "recommendations": [
    {
      "title": "Implement Fraud Detection",
      "priority": "high"
    }
  ]
}
```

### Custom Instructions

You can provide custom instructions for specific use cases:

```javascript
const customInstructions = `
Focus on:
1. Regulatory compliance implications
2. Risk mitigation strategies
3. Cost-benefit analysis of recommendations
4. Implementation timeline considerations
`;
```

## 🔧 Configuration

### LLaMA Service Configuration

```javascript
const LLaMAService = require('./services/LLaMAService');

const llamaService = new LLaMAService({
  // API Configuration
  apiEndpoint: 'http://localhost:11434/api/generate',
  model: 'llama3.1:8b',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  
  // Rate Limiting
  rateLimit: 10, // requests per minute
  requestTimeout: 30000,
  
  // Fallback Configuration
  enableFallback: true,
  fallbackService: templateService
});
```

### Domain-Specific Configuration

```javascript
// Finance domain configuration
const financeConfig = {
  keyMetrics: ['transaction_amount', 'account_balance', 'fraud_score'],
  riskFactors: ['fraud_detection', 'liquidity_risk', 'credit_risk'],
  recommendations: ['fraud_prevention', 'liquidity_management']
};

// Healthcare domain configuration
const healthcareConfig = {
  keyMetrics: ['treatment_cost', 'patient_satisfaction', 'recovery_time'],
  riskFactors: ['patient_safety', 'regulatory_compliance'],
  recommendations: ['quality_improvement', 'cost_optimization']
};
```

## 🧪 Testing

### Run Integration Tests

```bash
# Test LLaMA connection and functionality
npm run test:llama

# Run all tests including LLaMA integration
npm test
```

### Manual Testing

```javascript
const { runAllTests } = require('./tests/llama-test');

// Run comprehensive tests
const results = await runAllTests();
console.log('Test Results:', results);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Timeout
```
Error: LLaMA API connection timeout
```

**Solution:**
- Verify Ollama is running: `ollama serve`
- Check endpoint URL in `.env`
- Ensure firewall allows connections to port 11434

#### 2. Model Not Found
```
Error: Specified LLaMA model not found
```

**Solution:**
- List available models: `ollama list`
- Pull the model: `ollama pull llama3.1:8b`
- Update model name in configuration

#### 3. Rate Limiting
```
Error: Rate limit exceeded for LLaMA API
```

**Solution:**
- Increase rate limit in configuration
- Implement request queuing
- Use fallback to template generation

#### 4. Memory Issues
```
Error: Out of memory
```

**Solution:**
- Use smaller model (8B instead of 70B)
- Reduce max tokens
- Increase system memory
- Use GPU acceleration

### Performance Optimization

#### 1. Model Selection
- **8B model**: Fast, good for real-time applications
- **70B model**: Higher quality, slower generation
- **Quantized models**: Smaller memory footprint

#### 2. Caching
```javascript
// Implement response caching
const cache = new Map();
const cacheKey = JSON.stringify({ data, style, options });

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const result = await llamaService.generateNarrative(data, style, options);
cache.set(cacheKey, result);
```

#### 3. Batch Processing
```javascript
// Process multiple narratives in parallel
const narratives = await Promise.all(
  analysisIds.map(id => generateNarrative(id, 'executive'))
);
```

## 🔒 Security Considerations

### 1. API Security
- Use HTTPS for production deployments
- Implement API key authentication
- Rate limit by user/IP
- Validate input data

### 2. Data Privacy
- Sanitize sensitive data before sending to LLaMA
- Implement data retention policies
- Log access and usage patterns
- Comply with GDPR/CCPA requirements

### 3. Model Security
- Use trusted model sources
- Validate model outputs
- Implement content filtering
- Monitor for prompt injection attacks

## 📈 Monitoring and Logging

### 1. Performance Metrics
```javascript
// Track generation metrics
const metrics = {
  generationTime: Date.now() - startTime,
  tokensUsed: response.usage?.total_tokens,
  successRate: successfulGenerations / totalGenerations,
  averageConfidence: totalConfidence / generationCount
};
```

### 2. Error Tracking
```javascript
// Log errors for analysis
const errorLog = {
  timestamp: new Date().toISOString(),
  error: error.message,
  context: { style, options, dataSize },
  stack: error.stack
};
```

### 3. Usage Analytics
```javascript
// Track usage patterns
const analytics = {
  styleUsage: { executive: 45, bullet: 30, narrative: 20, technical: 5 },
  averageTokens: 1250,
  peakUsageHours: [9, 14, 16],
  fallbackRate: 0.05
};
```

## 🔮 Future Enhancements

### 1. Model Fine-tuning
- Fine-tune on domain-specific data
- Create custom LoRA adapters
- Implement continuous learning

### 2. Advanced Features
- Multi-modal analysis (text + charts)
- Real-time streaming responses
- Interactive narrative editing
- Multi-language support

### 3. Integration Options
- LangChain integration
- OpenAI API compatibility
- Hugging Face models
- Custom model hosting

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [LLaMA 3 Paper](https://arxiv.org/abs/2402.19460)
- [Meta AI Blog](https://ai.meta.com/blog/meta-llama-3/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

For support and questions, please refer to the main project documentation or create an issue in the repository. 
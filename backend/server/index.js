require('dotenv').config();
const express = require('express');
require('./config'); // Initialize database
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploadHandler');
const resultsRoutes = require('./routes/results');
const subscriptionRoutes = require('./routes/subscription');
const analyzeRoutes = require('./routes/analyze'); // New modular analysis routes

const app = express();

app.use(helmet());

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3001',  // Vite default port
  'http://localhost:5173',  // Vite alternative port
  'http://localhost:3000',  // React default port
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests
}));

// Legacy routes (for backward compatibility)
app.use('/api/v1', authRoutes.router);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1', resultsRoutes);
app.use('/api/v1', subscriptionRoutes);

// New modular analysis routes
app.use('/api/analyze', analyzeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.1.0'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    version: '2.1.0',
    endpoints: {
      'POST /api/analyze/upload': 'Upload and analyze CSV file with comprehensive analysis',
      'GET /api/analyze/summary/:analysisId': 'Get analysis summary by ID',
      'GET /api/analyze/predictions/:analysisId': 'Get forecasts and predictions by analysis ID',
      'GET /api/analyze/recommendations/:analysisId': 'Get recommendations by analysis ID',
      'GET /api/analyze/narrative/:analysisId': 'Get narrative by analysis ID',
      'GET /api/analyze/labels/:analysisId': 'Get smart labels by analysis ID',
      'GET /api/analyze/metrics/:analysisId': 'Get detailed metrics by analysis ID'
    },
    legacy: {
      'POST /api/v1/upload': 'Legacy upload endpoint (maintained for backward compatibility)'
    }
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
# 🚀 Sygnify Analytics Hub v2.0

**Advanced AI-powered analytics platform with intelligent data comprehension, visualization, and narrative generation**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)](package.json)

## 🌟 Features

### 🤖 **Advanced Data Comprehension**
- **Intelligent Pattern Recognition**: Automatically identifies temporal, categorical, numerical, and geographic data
- **Anomaly Detection**: Multi-algorithm approach (IQR + Isolation Forest) for robust outlier detection
- **Correlation Analysis**: Discovers high-correlation relationships between variables
- **Domain Detection**: Smart classification with confidence scoring for 5+ business domains
- **Seasonality & Trend Analysis**: Identifies temporal patterns and forecasting opportunities

### 📊 **Intelligent Visualization**
- **Auto-Chart Selection**: Automatically chooses the most appropriate chart types
- **Domain-Specific Visualizations**: Tailored charts for Advertising, Finance, Supply Chain, HR, and Operations
- **Chart.js Integration**: Complete configuration generation for immediate rendering
- **Multi-Chart Dashboards**: Comprehensive visualization plans with primary and secondary charts

### 📝 **Smart Narrative Generation**
- **Contextual Insights**: Domain-specific insights with confidence scoring
- **Actionable Recommendations**: Prioritized recommendations with effort estimates
- **Risk Assessment**: Identifies and categorizes risks with mitigation strategies
- **External Context Integration**: Incorporates market insights and external factors
- **Executive Summaries**: Business-ready explanations for stakeholders

### 🔄 **Advanced Processing Pipeline**
- **Multi-Source Support**: CSV files, database connections, and API integrations
- **Analysis Depth Options**: Basic, Comprehensive, and Expert analysis levels
- **Background Processing**: Bull queue with Redis for scalable processing
- **Real-time Progress Tracking**: Live job status and progress monitoring

## 🚀 Quick Start

### **One-Command Setup & Launch**
```bash
# Complete setup and launch (recommended)
npm run setup

# Or step by step:
npm run setup:env    # Environment setup
npm run setup:db     # Database setup
npm run install:all  # Install dependencies
npm start           # Launch application
```

### **Alternative Launch Methods**

#### **Windows Users**
```bash
# Double-click or run:
start.bat

# Or command line:
npm start
```

#### **Unix/Linux/Mac Users**
```bash
# Make executable and run:
chmod +x start.sh
./start.sh

# Or command line:
npm start
```

#### **Docker Users**
```bash
# Build and run with Docker:
npm run setup:docker
npm run start:docker

# Or rebuild and run:
npm run start:docker:build
```

## 📋 Prerequisites

### **Required Dependencies**
- **Node.js** 18.0.0 or higher
- **Python** 3.8+ with pip
- **PostgreSQL** 12+
- **Redis** 6+
- **Ollama** (for AI analysis)

### **Optional Dependencies**
- **Docker** & **Docker Compose** (for containerized deployment)

### **Python Packages**
```bash
pip install pandas numpy scikit-learn prophet
```

## 🛠️ Installation

### **1. Clone Repository**
```bash
git clone https://github.com/sygnify/analytics-hub.git
cd analytics-hub
```

### **2. Automated Setup**
```bash
# Complete automated setup
npm run setup
```

This command will:
- ✅ Check Node.js version
- ✅ Create environment configuration
- ✅ Set up directories and files
- ✅ Check system dependencies
- ✅ Install Python packages
- ✅ Start Ollama service
- ✅ Create startup scripts
- ✅ Set up database
- ✅ Install all dependencies

### **3. Manual Setup (if needed)**

#### **Environment Configuration**
```bash
# Edit .env file with your configuration
nano .env
```

#### **Database Setup**
```bash
# Set up PostgreSQL database
npm run setup:db
```

#### **Dependencies Installation**
```bash
# Install all dependencies
npm run install:all
```

## 🚀 Launching the Application

### **Start All Services**
```bash
npm start
```

This launches:
- 🖥️ **Backend API** (Port 3000)
- 🌐 **Frontend Dashboard** (Port 3000)
- 🗄️ **PostgreSQL Database** (Port 5432)
- 🔄 **Redis Cache** (Port 6379)
- 🤖 **Ollama AI Service** (Port 11434)

### **Individual Service Management**
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Check service status
npm run status

# Stop all services
npm run stop
```

## 🌐 Access URLs

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health

## 🔑 Default Credentials

- **Email**: admin@sygnify.com
- **Password**: admin123

## 📊 Available Commands

### **Development**
```bash
npm run dev              # Start development mode
npm run dev:backend      # Backend development
npm run dev:frontend     # Frontend development
npm run build            # Build for production
npm run test             # Run all tests
npm run lint             # Lint code
```

### **Database Management**
```bash
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run backup           # Backup database
npm run restore          # Restore database
```

### **Monitoring & Maintenance**
```bash
npm run status           # Check service status
npm run health           # Health check
npm run logs             # View logs
npm run monitor          # System monitoring
npm run clean            # Clean temporary files
```

### **Docker Operations**
```bash
npm run start:docker     # Start with Docker
npm run setup:docker     # Build Docker images
npm run stop:docker      # Stop Docker containers
```

## 🏗️ Architecture

```
Sygnify Analytics Hub
├── 📁 backend/
│   ├── 🖥️ server/           # Express.js API server
│   ├── 🤖 models/           # AI analysis modules
│   ├── 🗄️ database/         # Database migrations
│   └── 📝 logs/             # Application logs
├── 📁 frontend/
│   └── 🎨 client/           # React + Vite frontend
├── 📁 scripts/              # Automation scripts
├── 🐳 docker-compose.yml    # Docker configuration
└── 📋 package.json          # Project configuration
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=sygnify_user
DB_PASSWORD=sygnify_password
DB_NAME=sygnify_analytics

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
NEWSAPI_KEY=your-newsapi-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Analysis
OLLAMA_MODEL=llama3.2:3b-q4_0
ANALYSIS_TIMEOUT=30000
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Test with coverage
npm run test:coverage
```

## 📈 Performance

### **Optimization Features**
- **Background Processing**: Bull queue for scalable analysis
- **Caching**: Redis for session and data caching
- **Connection Pooling**: PostgreSQL connection optimization
- **Lazy Loading**: Frontend component optimization
- **GPU Acceleration**: Ollama with GPU layers for AI analysis

### **Scaling**
- **Horizontal Scaling**: Docker containerization
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: Multi-tenant architecture
- **CDN Integration**: Static asset optimization

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: express-validator middleware
- **Rate Limiting**: DDoS protection
- **CORS Configuration**: Cross-origin security
- **Helmet.js**: Security headers
- **SQL Injection Protection**: Parameterized queries

## 🐛 Troubleshooting

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
npm run status

# Kill processes on specific ports
npm run stop
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### **Ollama Not Running**
```bash
# Start Ollama
ollama serve

# Check available models
ollama list
```

#### **Python Dependencies Missing**
```bash
# Install Python packages
pip install pandas numpy scikit-learn prophet
```

### **Logs and Debugging**
```bash
# View all logs
npm run logs

# Backend logs only
npm run logs:backend

# Error logs
npm run logs:error
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/sygnify/analytics-hub/wiki)
- **Issues**: [GitHub Issues](https://github.com/sygnify/analytics-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sygnify/analytics-hub/discussions)

## 🎯 Roadmap

- [ ] **Real-time Analytics**: Live data streaming and analysis
- [ ] **Advanced ML Models**: Custom model training and deployment
- [ ] **Mobile App**: React Native mobile application
- [ ] **API Marketplace**: Third-party integrations
- [ ] **Advanced Security**: OAuth2, SSO, and enterprise features
- [ ] **Cloud Deployment**: AWS, Azure, and GCP deployment guides

---

**Made with ❤️ by the Sygnify Analytics Hub Team**


#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Sygnify Analytics Hub environment...\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '18.0.0';
if (parseFloat(nodeVersion.slice(1)) < parseFloat(requiredVersion)) {
  console.error(`❌ Node.js version ${requiredVersion} or higher is required. Current version: ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js version: ${nodeVersion}`);

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envTemplate = `# Sygnify Analytics Hub Environment Configuration
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=sygnify_user
DB_PASSWORD=sygnify_password
DB_NAME=sygnify_analytics

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
NEWSAPI_KEY=your-newsapi-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./backend/uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b-q4_0

# Analysis Configuration
ANALYSIS_TIMEOUT=30000
MAX_CONCURRENT_ANALYSES=5

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with default configuration');
} else {
  console.log('✅ .env file already exists');
}

// Create necessary directories
const directories = [
  'logs',
  'backend/uploads',
  'backend/database/migrations',
  'scripts'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Check for required system dependencies
console.log('\n🔍 Checking system dependencies...');

const dependencies = [
  { name: 'Python', command: 'python --version', required: true },
  { name: 'pip', command: 'pip --version', required: true },
  { name: 'Redis', command: 'redis-server --version', required: true },
  { name: 'PostgreSQL', command: 'psql --version', required: true },
  { name: 'Docker', command: 'docker --version', required: false },
  { name: 'Docker Compose', command: 'docker-compose --version', required: false }
];

dependencies.forEach(dep => {
  try {
    const version = execSync(dep.command, { encoding: 'utf8' }).trim();
    console.log(`✅ ${dep.name}: ${version}`);
  } catch (error) {
    if (dep.required) {
      console.error(`❌ ${dep.name} is required but not found. Please install it.`);
      console.error(`   Installation guide: https://github.com/sygnify/analytics-hub#installation`);
    } else {
      console.log(`⚠️  ${dep.name} not found (optional)`);
    }
  }
});

// Install Python dependencies
console.log('\n📦 Installing Python dependencies...');
try {
  execSync('pip install pandas numpy scikit-learn prophet', { stdio: 'inherit' });
  console.log('✅ Python dependencies installed');
} catch (error) {
  console.error('❌ Failed to install Python dependencies');
  console.error('   Please install manually: pip install pandas numpy scikit-learn prophet');
}

// Check if Ollama is running
console.log('\n🤖 Checking Ollama status...');
try {
  execSync('ollama list', { stdio: 'pipe' });
  console.log('✅ Ollama is running');
} catch (error) {
  console.log('⚠️  Ollama not running. Starting Ollama...');
  try {
    execSync('ollama serve', { stdio: 'pipe', detached: true });
    console.log('✅ Ollama started in background');
  } catch (ollamaError) {
    console.error('❌ Failed to start Ollama. Please install and start it manually.');
    console.error('   Installation: https://ollama.ai/download');
  }
}

// Create startup script for Windows
if (process.platform === 'win32') {
  const startupScript = `@echo off
echo Starting Sygnify Analytics Hub...
cd /d "%~dp0"
npm start
pause
`;
  fs.writeFileSync(path.join(__dirname, '..', 'start.bat'), startupScript);
  console.log('✅ Created start.bat for Windows');
}

// Create startup script for Unix-like systems
const startupScript = `#!/bin/bash
echo "Starting Sygnify Analytics Hub..."
cd "$(dirname "$0")"
npm start
`;
fs.writeFileSync(path.join(__dirname, '..', 'start.sh'), startupScript);
fs.chmodSync(path.join(__dirname, '..', 'start.sh'), '755');
console.log('✅ Created start.sh for Unix-like systems');

console.log('\n🎉 Environment setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env file with your specific configuration');
console.log('2. Run: npm run setup:db (to set up database)');
console.log('3. Run: npm run install:all (to install all dependencies)');
console.log('4. Run: npm start (to launch the application)');
console.log('\n🚀 Quick start: npm run setup'); 
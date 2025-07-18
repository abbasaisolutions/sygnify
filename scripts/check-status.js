#!/usr/bin/env node

const axios = require('axios');
const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

console.log('🔍 Checking Sygnify Analytics Hub Status...\n');

const status = {
  backend: { status: 'unknown', details: '' },
  frontend: { status: 'unknown', details: '' },
  database: { status: 'unknown', details: '' },
  redis: { status: 'unknown', details: '' },
  ollama: { status: 'unknown', details: '' },
  python: { status: 'unknown', details: '' }
};

async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/health', { timeout: 5000 });
    status.backend.status = 'running';
    status.backend.details = `Port: 3000, Version: ${response.data.version || 'unknown'}`;
  } catch (error) {
    status.backend.status = 'stopped';
    status.backend.details = error.message;
  }
}

async function checkFrontend() {
  try {
    const response = await axios.get('http://localhost:3000', { timeout: 5000 });
    status.frontend.status = 'running';
    status.frontend.details = 'Port: 3000';
  } catch (error) {
    status.frontend.status = 'stopped';
    status.frontend.details = error.message;
  }
}

async function checkDatabase() {
  try {
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'sygnify_user',
      password: process.env.DB_PASSWORD || 'sygnify_password',
      database: process.env.DB_NAME || 'sygnify_analytics'
    });
    
    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();
    
    status.database.status = 'running';
    status.database.details = `PostgreSQL ${result.rows[0].version.split(' ')[1]}`;
  } catch (error) {
    status.database.status = 'stopped';
    status.database.details = error.message;
  }
}

function checkRedis() {
  try {
    const result = execSync('redis-cli ping', { encoding: 'utf8', timeout: 5000 });
    if (result.trim() === 'PONG') {
      status.redis.status = 'running';
      status.redis.details = 'Port: 6379';
    } else {
      status.redis.status = 'error';
      status.redis.details = 'Unexpected response';
    }
  } catch (error) {
    status.redis.status = 'stopped';
    status.redis.details = error.message;
  }
}

function checkOllama() {
  try {
    const result = execSync('ollama list', { encoding: 'utf8', timeout: 5000 });
    status.ollama.status = 'running';
    status.ollama.details = `Models: ${result.split('\n').length - 1}`;
  } catch (error) {
    status.ollama.status = 'stopped';
    status.ollama.details = error.message;
  }
}

function checkPython() {
  try {
    const result = execSync('python --version', { encoding: 'utf8', timeout: 5000 });
    status.python.status = 'available';
    status.python.details = result.trim();
  } catch (error) {
    status.ollama.status = 'not available';
    status.ollama.details = error.message;
  }
}

function displayStatus() {
  console.log('📊 Service Status:');
  console.log('==================');
  
  Object.entries(status).forEach(([service, info]) => {
    const icon = info.status === 'running' || info.status === 'available' ? '✅' : 
                 info.status === 'stopped' ? '❌' : '⚠️';
    console.log(`${icon} ${service.toUpperCase()}: ${info.status}`);
    if (info.details) {
      console.log(`   ${info.details}`);
    }
  });
  
  console.log('\n🌐 Access URLs:');
  console.log('===============');
  console.log('Frontend: http://localhost:3000');
  console.log('Backend API: http://localhost:3000/api/v1');
  console.log('Health Check: http://localhost:3000/api/v1/health');
  
  console.log('\n🔑 Default Login:');
  console.log('=================');
  console.log('Email: admin@sygnify.com');
  console.log('Password: admin123');
  
  // Overall status
  const allRunning = Object.values(status).every(s => 
    s.status === 'running' || s.status === 'available'
  );
  
  console.log('\n🎯 Overall Status:');
  console.log('==================');
  if (allRunning) {
    console.log('✅ All services are running! Sygnify Analytics Hub is ready to use.');
  } else {
    console.log('⚠️  Some services are not running. Run "npm start" to start all services.');
  }
}

async function main() {
  await Promise.all([
    checkBackend(),
    checkFrontend(),
    checkDatabase(),
    checkRedis(),
    checkOllama(),
    checkPython()
  ]);
  
  displayStatus();
}

main().catch(console.error); 
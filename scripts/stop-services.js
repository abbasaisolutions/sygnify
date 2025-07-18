#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛑 Stopping Sygnify Analytics Hub services...\n');

function stopService(serviceName, commands) {
  console.log(`Stopping ${serviceName}...`);
  
  for (const command of commands) {
    try {
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ ${serviceName} stopped`);
      return true;
    } catch (error) {
      // Continue to next command if this one fails
      continue;
    }
  }
  
  console.log(`⚠️  ${serviceName} may not be running or could not be stopped`);
  return false;
}

function killProcessByPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a`, { stdio: 'pipe' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' });
    }
    console.log(`✅ Process on port ${port} killed`);
  } catch (error) {
    console.log(`⚠️  No process found on port ${port}`);
  }
}

// Stop services
const services = [
  {
    name: 'Redis',
    commands: [
      'redis-cli shutdown',
      'pkill redis-server',
      'taskkill /f /im redis-server.exe'
    ]
  },
  {
    name: 'PostgreSQL',
    commands: [
      'pg_ctl -D /usr/local/var/postgres stop',
      'sudo systemctl stop postgresql',
      'brew services stop postgresql'
    ]
  },
  {
    name: 'Ollama',
    commands: [
      'pkill ollama',
      'taskkill /f /im ollama.exe'
    ]
  }
];

services.forEach(service => {
  stopService(service.name, service.commands);
});

// Kill processes by port
console.log('\n🔌 Killing processes by port...');
killProcessByPort(3000); // Backend
killProcessByPort(3001); // Frontend (if different port)
killProcessByPort(6379); // Redis
killProcessByPort(5432); // PostgreSQL
killProcessByPort(11434); // Ollama

// Stop Docker containers if running
console.log('\n🐳 Stopping Docker containers...');
try {
  execSync('docker-compose down', { stdio: 'pipe' });
  console.log('✅ Docker containers stopped');
} catch (error) {
  console.log('⚠️  No Docker containers running or docker-compose not found');
}

// Clean up temporary files
console.log('\n🧹 Cleaning up temporary files...');
const tempDirs = [
  'backend/uploads/temp_*',
  'logs/*.tmp',
  '*.pid'
];

tempDirs.forEach(pattern => {
  try {
    if (process.platform === 'win32') {
      execSync(`del /q ${pattern}`, { stdio: 'pipe' });
    } else {
      execSync(`rm -f ${pattern}`, { stdio: 'pipe' });
    }
  } catch (error) {
    // Ignore errors for cleanup
  }
});

console.log('\n✅ All services stopped and cleaned up!');
console.log('\n📋 To restart the application:');
console.log('   npm start');
console.log('\n📋 To check service status:');
console.log('   npm run status'); 
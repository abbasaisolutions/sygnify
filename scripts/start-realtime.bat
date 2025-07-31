@echo off
setlocal enabledelayedexpansion

REM Sygnify Real-Time Analytics Startup Script for Windows
REM This script starts both backend and frontend with real-time WebSocket support

echo 🚀 Starting Sygnify Analytics with Real-Time Capabilities...

REM Check Python version
echo 📋 Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed or not in PATH.
    pause
    exit /b 1
)

echo ✅ Python found: 
python --version

REM Check Node.js
echo 📋 Checking Node.js environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed or not in PATH.
    pause
    exit /b 1
)

echo ✅ Node.js found:
node --version

REM Check if ports are available
echo 📋 Checking port availability...
netstat -an | findstr ":8000" >nul
if not errorlevel 1 (
    echo ⚠️  Port 8000 is already in use. Backend may not start properly.
)

netstat -an | findstr ":3001" >nul
if not errorlevel 1 (
    echo ⚠️  Port 3001 is already in use. Frontend may not start properly.
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo 📦 Installing/upgrading Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Install WebSocket dependencies
echo 📦 Installing WebSocket dependencies...
pip install websockets>=11.0.0

cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend\client

REM Install/upgrade dependencies
echo 📦 Installing/upgrading Node.js dependencies...
npm install

REM Install WebSocket dependencies
echo 📦 Installing WebSocket dependencies...
npm install socket.io-client@^4.7.4

cd ..\..

REM Start backend server
echo 🚀 Starting backend server...
cd backend
call venv\Scripts\activate.bat

echo ✅ Starting FastAPI server with WebSocket support...
echo 📍 Backend will be available at: http://localhost:8000
echo 📍 WebSocket endpoint: ws://localhost:8000/ws
echo 📍 API documentation: http://localhost:8000/docs

start "Sygnify Backend" cmd /k "uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload"

cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo 🚀 Starting frontend server...
cd frontend\client

echo ✅ Starting React development server...
echo 📍 Frontend will be available at: http://localhost:3001 (or 3002 if 3001 is in use)
echo 📍 Real-time dashboard will be available in the Real-Time Monitor tab

start "Sygnify Frontend" cmd /k "npm run dev"

cd ..\..

echo.
echo 🎉 Sygnify Analytics is starting up!
echo 📊 Real-time features enabled:
echo    • WebSocket connections for live updates
echo    • Real-time job progress tracking
echo    • Live system monitoring dashboard
echo    • Interactive progress indicators
echo.
echo 🌐 Access your application:
echo    • Frontend: http://localhost:3001
echo    • Backend API: http://localhost:8000
echo    • API Docs: http://localhost:8000/docs
echo.
echo 💡 Tips:
echo    • Use the 'Real-Time Monitor' tab to see live system status
echo    • Upload a file to see real-time processing progress
echo    • Watch the WebSocket connection indicator for live status
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul 
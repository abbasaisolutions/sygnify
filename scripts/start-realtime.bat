@echo off
echo 🚀 Starting Sygnify Financial Analytics Platform v1.0
echo ===================================================

REM Check if Python 3.11 is available
python --version 2>nul
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.11+ and try again
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and try again
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create virtual environment if it doesn't exist
if not exist ".venv311" (
    echo 📦 Creating Python virtual environment...
    python -m venv .venv311
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call .venv311\Scripts\activate.bat

REM Install backend dependencies
echo 📦 Installing backend dependencies...
pip install -r backend\requirements.txt

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend\client
npm install
cd ..\..

REM Start backend server in background
echo 🖥️ Starting backend server...
start /B .venv311\Scripts\python.exe -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start frontend server
echo 🎨 Starting frontend server...
cd frontend\client
start /B npm run dev

REM Wait for frontend to start
echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo ===================================================
echo 🎉 Sygnify Financial Analytics Platform is starting!
echo ===================================================
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo 💚 Health Check: http://localhost:8000/health
echo ===================================================
echo.
echo 💡 To stop the servers, close this window or press Ctrl+C
echo 💡 For Ollama AI features, make sure Ollama is running on http://localhost:11434
echo.

REM Keep the script running
pause 
#!/bin/bash

echo "🚀 Starting Sygnify Financial Analytics Platform v1.0"
echo "==================================================="

# Check if Python 3.11 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.11+ and try again"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv311" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv .venv311
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv311/bin/activate

# Install backend dependencies
echo "📦 Installing backend dependencies..."
pip install -r backend/requirements.txt

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend/client
npm install
cd ../..

# Start backend server in background
echo "🖥️ Starting backend server..."
nohup .venv311/bin/python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend/client
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

echo "==================================================="
echo "🎉 Sygnify Financial Analytics Platform is starting!"
echo "==================================================="
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "💚 Health Check: http://localhost:8000/health"
echo "==================================================="
echo ""
echo "💡 To stop the servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo "💡 For Ollama AI features, make sure Ollama is running on http://localhost:11434"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "Press Ctrl+C to stop the servers..."
wait 
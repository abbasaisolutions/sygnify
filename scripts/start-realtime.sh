#!/bin/bash

# Sygnify Real-Time Analytics Startup Script
# This script starts both backend and frontend with real-time WebSocket support

echo "🚀 Starting Sygnify Analytics with Real-Time Capabilities..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check Python version
echo -e "${BLUE}📋 Checking Python environment...${NC}"
if command_exists python3.11; then
    PYTHON_CMD="python3.11"
elif command_exists python3; then
    PYTHON_CMD="python3"
else
    echo -e "${RED}❌ Python 3.11 or Python 3 is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using Python: $($PYTHON_CMD --version)${NC}"

# Check Node.js
echo -e "${BLUE}📋 Checking Node.js environment...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if ports are available
echo -e "${BLUE}📋 Checking port availability...${NC}"
if port_in_use 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Backend may not start properly.${NC}"
fi

if port_in_use 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use. Frontend may not start properly.${NC}"
fi

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${BLUE}📦 Installing/upgrading Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Install WebSocket dependencies
echo -e "${BLUE}📦 Installing WebSocket dependencies...${NC}"
pip install websockets>=11.0.0

cd ..

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend/client

# Install/upgrade dependencies
echo -e "${BLUE}📦 Installing/upgrading Node.js dependencies...${NC}"
npm install

# Install WebSocket dependencies
echo -e "${BLUE}📦 Installing WebSocket dependencies...${NC}"
npm install socket.io-client@^4.7.4

cd ../..

# Start backend server
echo -e "${BLUE}🚀 Starting backend server...${NC}"
cd backend
source venv/bin/activate

# Start backend in background
echo -e "${GREEN}✅ Starting FastAPI server with WebSocket support...${NC}"
echo -e "${YELLOW}📍 Backend will be available at: http://localhost:8000${NC}"
echo -e "${YELLOW}📍 WebSocket endpoint: ws://localhost:8000/ws${NC}"
echo -e "${YELLOW}📍 API documentation: http://localhost:8000/docs${NC}"

uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo -e "${BLUE}🚀 Starting frontend server...${NC}"
cd frontend/client

echo -e "${GREEN}✅ Starting React development server...${NC}"
echo -e "${YELLOW}📍 Frontend will be available at: http://localhost:3001 (or 3002 if 3001 is in use)${NC}"
echo -e "${YELLOW}📍 Real-time dashboard will be available in the Real-Time Monitor tab${NC}"

npm run dev &
FRONTEND_PID=$!

cd ../..

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}🎉 Sygnify Analytics is starting up!${NC}"
echo -e "${BLUE}📊 Real-time features enabled:${NC}"
echo -e "   • WebSocket connections for live updates"
echo -e "   • Real-time job progress tracking"
echo -e "   • Live system monitoring dashboard"
echo -e "   • Interactive progress indicators"
echo -e "\n${YELLOW}🌐 Access your application:${NC}"
echo -e "   • Frontend: http://localhost:3001"
echo -e "   • Backend API: http://localhost:8000"
echo -e "   • API Docs: http://localhost:8000/docs"
echo -e "\n${BLUE}💡 Tips:${NC}"
echo -e "   • Use the 'Real-Time Monitor' tab to see live system status"
echo -e "   • Upload a file to see real-time processing progress"
echo -e "   • Watch the WebSocket connection indicator for live status"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for processes
wait 
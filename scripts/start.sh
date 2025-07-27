#!/bin/bash
# Start script for Sygnify Analytics Hub
set -e

echo "Starting API service..."
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

echo "Starting Streamlit dashboard..."
streamlit run frontend/streamlit_apps/main_dashboard.py --server.port=8501 --server.address=0.0.0.0 &
STREAMLIT_PID=$!

# Health monitoring loop (placeholder)
while true; do
  sleep 60
  curl -f http://localhost:8000/health || echo "API health check failed"
done

# Graceful shutdown
trap "kill $API_PID $STREAMLIT_PID" SIGINT SIGTERM
wait 
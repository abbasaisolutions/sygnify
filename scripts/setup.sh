#!/bin/bash
# Setup script for Sygnify Analytics Hub
set -e

# Install Python dependencies
pip install -r backend/requirements.txt

# Initialize database (placeholder)
echo "Initializing database..."
# TODO: Add DB migration/init commands

# Health checks
curl -f http://localhost:8000/health || echo "API not running yet" 
#!/bin/bash
# Setup script for Mana Voice Bot

set -e

echo "Setting up Mana Voice Bot..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "To start the service:"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 3024 --reload"
echo ""
echo "Or use the start script:"
echo "  ./start.sh"

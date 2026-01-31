#!/bin/bash

# Start mana-llm service
# Automatically creates venv and installs dependencies if needed

cd "$(dirname "$0")"

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install/update dependencies
pip install -q -r requirements.txt

# Copy .env if not exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Start the service
echo "Starting mana-llm on port 3025..."
exec python -m uvicorn src.main:app --port 3025 --reload

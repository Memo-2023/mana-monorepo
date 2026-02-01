#!/bin/bash
# Start Mana Voice Bot

cd "$(dirname "$0")"
source venv/bin/activate

export PORT=${PORT:-3050}
export STT_URL=${STT_URL:-http://localhost:3020}
export OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}
export DEFAULT_MODEL=${DEFAULT_MODEL:-gemma3:4b}
export DEFAULT_VOICE=${DEFAULT_VOICE:-de-DE-ConradNeural}

echo "Starting Mana Voice Bot..."
echo "  Port: $PORT"
echo "  STT: $STT_URL"
echo "  Ollama: $OLLAMA_URL"
echo "  Model: $DEFAULT_MODEL"
echo "  Voice: $DEFAULT_VOICE"
echo ""

exec uvicorn app.main:app --host 0.0.0.0 --port $PORT

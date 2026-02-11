#!/bin/bash
# Start vLLM server for Voxtral
#
# Usage: ./scripts/start-vllm-voxtral.sh [model]
#   model: "3b" (default) or "4b" for Realtime

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SERVICE_DIR/.venv-vllm"
MODEL="${1:-3b}"
PORT="${VLLM_PORT:-8100}"

# Activate venv
source "$VENV_DIR/bin/activate"

echo "Starting vLLM Voxtral server..."
echo "Port: $PORT"

if [[ "$MODEL" == "4b" || "$MODEL" == "realtime" ]]; then
    echo "Model: Voxtral Mini 4B Realtime"
    exec vllm serve mistralai/Voxtral-Mini-4B-Realtime-2602 \
        --host 0.0.0.0 \
        --port "$PORT" \
        --max-model-len 8192
else
    echo "Model: Voxtral Mini 3B"
    exec vllm serve mistralai/Voxtral-Mini-3B-2507 \
        --tokenizer_mode mistral \
        --config_format mistral \
        --load_format mistral \
        --host 0.0.0.0 \
        --port "$PORT" \
        --max-model-len 32768
fi

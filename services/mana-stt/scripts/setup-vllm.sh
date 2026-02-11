#!/bin/bash
# Setup vLLM for Voxtral on Mac Mini M4
#
# vLLM runs in CPU mode on macOS (no CUDA), but still provides
# the optimized inference pipeline for Voxtral models.
#
# Usage: ./scripts/setup-vllm.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SERVICE_DIR/.venv-vllm"

echo "============================================"
echo "vLLM Setup for Voxtral on Mac Mini M4"
echo "============================================"
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [[ "$PYTHON_MAJOR" -lt 3 ]] || [[ "$PYTHON_MAJOR" -eq 3 && "$PYTHON_MINOR" -lt 10 ]]; then
    echo "Error: Python 3.10+ required (found $PYTHON_VERSION)"
    exit 1
fi
echo "Python version: $PYTHON_VERSION"

# Create separate venv for vLLM (to avoid conflicts with whisper)
echo ""
echo "Creating virtual environment for vLLM..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Upgrade pip
pip install --upgrade pip --quiet

# Install vLLM with audio support
echo ""
echo "Installing vLLM with audio support..."
echo "This may take a few minutes..."

# Install uv for faster package installation
pip install uv --quiet

# Install vLLM with audio support (nightly for best Voxtral support)
uv pip install "vllm[audio]>=0.10.0" --extra-index-url https://wheels.vllm.ai/nightly 2>&1 || {
    echo "Nightly install failed, trying stable..."
    uv pip install "vllm[audio]>=0.10.0"
}

# Install mistral-common with audio
uv pip install "mistral-common[audio]>=1.8.1"

echo ""
echo "============================================"
echo "Installation complete!"
echo "============================================"
echo ""
echo "To start Voxtral Mini 3B server:"
echo "  source $VENV_DIR/bin/activate"
echo "  vllm serve mistralai/Voxtral-Mini-3B-2507 \\"
echo "    --tokenizer_mode mistral \\"
echo "    --config_format mistral \\"
echo "    --load_format mistral \\"
echo "    --host 0.0.0.0 \\"
echo "    --port 8100"
echo ""
echo "To start Voxtral Realtime 4B server:"
echo "  source $VENV_DIR/bin/activate"
echo "  vllm serve mistralai/Voxtral-Mini-4B-Realtime-2602 \\"
echo "    --host 0.0.0.0 \\"
echo "    --port 8100"
echo ""
echo "API Endpoint: http://localhost:8100/v1/audio/transcriptions"
echo ""
echo "Test with:"
echo "  curl http://localhost:8100/v1/audio/transcriptions \\"
echo "    -F file=@test.mp3 \\"
echo "    -F model=mistralai/Voxtral-Mini-3B-2507 \\"
echo "    -F language=de"

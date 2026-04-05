#!/bin/bash
# Mana STT Service Setup Script
# For Mac Mini M4 (Apple Silicon)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON_VERSION="3.11"

echo "=============================================="
echo "  Mana STT Service Setup"
echo "  Whisper (Lightning MLX) + Voxtral"
echo "=============================================="
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Warning: This script is optimized for macOS (Apple Silicon)"
fi

# Check for Apple Silicon
if [[ "$(uname -m)" != "arm64" ]]; then
    echo "Warning: Not running on Apple Silicon. MLX optimizations won't work."
fi

# Check Python version
echo "1. Checking Python installation..."
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PY_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo "   Found Python $PY_VERSION"
else
    echo "Error: Python 3 not found. Please install Python 3.11+"
    echo "   brew install python@3.11"
    exit 1
fi

# Create virtual environment
echo ""
echo "2. Creating virtual environment..."
if [ -d "$VENV_DIR" ]; then
    echo "   Virtual environment already exists at $VENV_DIR"
    read -p "   Recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VENV_DIR"
        $PYTHON_CMD -m venv "$VENV_DIR"
        echo "   Virtual environment recreated"
    fi
else
    $PYTHON_CMD -m venv "$VENV_DIR"
    echo "   Virtual environment created at $VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo ""
echo "3. Upgrading pip..."
pip install --upgrade pip wheel setuptools

# Install dependencies
echo ""
echo "4. Installing dependencies..."
echo "   This may take several minutes (downloading large models)..."

# Install PyTorch with MPS support first
pip install torch torchvision torchaudio

# Install MLX for Apple Silicon
pip install mlx

# Install other dependencies
pip install -r "$SCRIPT_DIR/requirements.txt"

# Install scipy for audio resampling (needed by Voxtral)
pip install scipy

echo ""
echo "5. Verifying installation..."

# Test imports
python -c "import torch; print(f'   PyTorch {torch.__version__} - MPS available: {torch.backends.mps.is_available()}')"
python -c "import mlx; print(f'   MLX installed')" 2>/dev/null || echo "   MLX not available (CPU fallback)"
python -c "import fastapi; print(f'   FastAPI {fastapi.__version__}')"

echo ""
echo "6. Downloading Whisper model (large-v3)..."
echo "   This will download ~2.9 GB on first run..."
# Pre-download the model
python -c "
from lightning_whisper_mlx import LightningWhisperMLX
print('   Initializing Whisper model...')
whisper = LightningWhisperMLX(model='large-v3', batch_size=12)
print('   Whisper model ready!')
" || echo "   Note: Model will be downloaded on first transcription request"

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "To start the STT service:"
echo ""
echo "  cd $SCRIPT_DIR"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 3020"
echo ""
echo "Or use the systemd/launchd service (recommended for production):"
echo ""
echo "  ./scripts/mac-mini/setup-stt.sh"
echo ""
echo "API Endpoints:"
echo "  POST /transcribe         - Whisper transcription"
echo "  POST /transcribe/voxtral - Voxtral transcription"
echo "  POST /transcribe/auto    - Auto-select best model"
echo "  GET  /health             - Health check"
echo "  GET  /models             - List available models"
echo ""

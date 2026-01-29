#!/bin/bash
# Setup script for Mana TTS service
# Optimized for Apple Silicon (MLX)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON_VERSION="3.11"

echo "=========================================="
echo "Mana TTS Setup"
echo "=========================================="
echo ""

# Check platform
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Warning: This service is optimized for macOS with Apple Silicon."
    echo "Some features may not work on other platforms."
    echo ""
fi

# Check for Apple Silicon
if [[ "$(uname -m)" != "arm64" ]]; then
    echo "Warning: This service is optimized for Apple Silicon (arm64)."
    echo "Performance may be reduced on Intel Macs."
    echo ""
fi

# Find Python
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo "Error: Python 3 not found. Please install Python 3.11 or later."
    exit 1
fi

echo "Using Python: $PYTHON_CMD"
$PYTHON_CMD --version
echo ""

# Check Python version
PYTHON_MAJOR=$($PYTHON_CMD -c "import sys; print(sys.version_info.major)")
PYTHON_MINOR=$($PYTHON_CMD -c "import sys; print(sys.version_info.minor)")

if [[ $PYTHON_MAJOR -lt 3 ]] || [[ $PYTHON_MINOR -lt 10 ]]; then
    echo "Error: Python 3.10 or later required. Found $PYTHON_MAJOR.$PYTHON_MINOR"
    exit 1
fi

# Create or recreate virtual environment
if [[ -d "$VENV_DIR" ]]; then
    echo "Virtual environment exists at $VENV_DIR"
    read -p "Recreate it? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing virtual environment..."
        rm -rf "$VENV_DIR"
        echo "Creating new virtual environment..."
        $PYTHON_CMD -m venv "$VENV_DIR"
    fi
else
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# Install ffmpeg check (for MP3 support)
echo ""
echo "Checking for ffmpeg (required for MP3 output)..."
if command -v ffmpeg &> /dev/null; then
    echo "ffmpeg found: $(which ffmpeg)"
else
    echo "Warning: ffmpeg not found. MP3 output will not work."
    echo "Install with: brew install ffmpeg"
fi

# Verify installations
echo ""
echo "Verifying installations..."

# Test FastAPI
python -c "import fastapi; print(f'FastAPI {fastapi.__version__}')" || {
    echo "Error: FastAPI not installed correctly"
    exit 1
}

# Test soundfile
python -c "import soundfile; print(f'soundfile {soundfile.__version__}')" || {
    echo "Error: soundfile not installed correctly"
    exit 1
}

# Test MLX (on Apple Silicon)
if [[ "$(uname -m)" == "arm64" ]]; then
    python -c "import mlx; print(f'MLX {mlx.__version__}')" || {
        echo "Warning: MLX not installed correctly. TTS may not work."
    }
fi

# Test mlx-audio
python -c "import mlx_audio; print('mlx-audio installed')" 2>/dev/null || {
    echo "Warning: mlx-audio not imported successfully."
    echo "You may need to install it manually or models won't load."
}

# Create directories
echo ""
echo "Creating required directories..."
mkdir -p "$SCRIPT_DIR/voices"
mkdir -p "$SCRIPT_DIR/mlx_models"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the service:"
echo ""
echo "  cd $SCRIPT_DIR"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 3022"
echo ""
echo "Or for development with auto-reload:"
echo ""
echo "  uvicorn app.main:app --host 0.0.0.0 --port 3022 --reload"
echo ""
echo "Test the service:"
echo ""
echo "  curl http://localhost:3022/health"
echo ""
echo "For Mac Mini deployment, run:"
echo ""
echo "  ./../../scripts/mac-mini/setup-tts.sh"
echo ""

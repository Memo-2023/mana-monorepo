#!/bin/bash
# Setup script for Mana Image Generation service
# Installs flux2.c and FLUX.2 klein 4B model
# Optimized for Apple Silicon (MPS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
FLUX_DIR="/opt/flux2"
MODEL_DIR="$FLUX_DIR/model"

echo "=========================================="
echo "Mana Image Generation Setup"
echo "=========================================="
echo ""

# Check platform
if [[ "$(uname)" != "Darwin" ]]; then
    echo "Error: This service requires macOS with Apple Silicon."
    echo "flux2.c uses MPS (Metal Performance Shaders) for acceleration."
    exit 1
fi

# Check for Apple Silicon
if [[ "$(uname -m)" != "arm64" ]]; then
    echo "Error: This service requires Apple Silicon (arm64)."
    echo "flux2.c is optimized for M1/M2/M3/M4 chips."
    exit 1
fi

echo "Platform: macOS $(sw_vers -productVersion) on $(uname -m)"
echo ""

# ============================================
# Step 1: Install flux2.c
# ============================================

echo "Step 1: Installing flux2.c"
echo "----------------------------------------"

# Check if flux2.c already exists
if [[ -f "$FLUX_DIR/flux" ]]; then
    echo "flux2.c already installed at $FLUX_DIR/flux"
    echo "To reinstall, remove the directory first: sudo rm -rf $FLUX_DIR"
else
    echo "Creating installation directory..."
    sudo mkdir -p "$FLUX_DIR"
    sudo chown $(whoami) "$FLUX_DIR"

    # Clone flux2.c repository
    echo "Cloning flux2.c repository..."
    cd "$FLUX_DIR"
    git clone https://github.com/antirez/flux2.c.git src
    cd src

    # Build with MPS support (Apple Silicon optimized)
    echo "Building flux2.c with MPS acceleration..."
    make mps

    # Move binary to parent directory
    cp flux "$FLUX_DIR/flux"
    chmod +x "$FLUX_DIR/flux"

    echo "flux2.c installed successfully!"
fi

# Verify binary
if [[ -x "$FLUX_DIR/flux" ]]; then
    echo "Binary: $FLUX_DIR/flux"
else
    echo "Error: flux2.c binary not found or not executable"
    exit 1
fi

echo ""

# ============================================
# Step 2: Download FLUX.2 klein 4B model
# ============================================

echo "Step 2: Downloading FLUX.2 klein 4B model"
echo "----------------------------------------"
echo "Note: This will download ~16GB of model weights"
echo ""

if [[ -d "$MODEL_DIR" ]] && [[ -f "$MODEL_DIR/flux.safetensors" ]]; then
    echo "Model already downloaded at $MODEL_DIR"
else
    mkdir -p "$MODEL_DIR"
    cd "$FLUX_DIR/src"

    # Run the model download script
    if [[ -f "./download-model.sh" ]]; then
        echo "Running download script..."
        ./download-model.sh "$MODEL_DIR"
    else
        echo "Downloading model manually..."
        # flux2.c expects the model in a specific format
        # The model includes:
        # - flux.safetensors (main weights)
        # - qwen3-4b.safetensors (text encoder)
        # - ae.safetensors (autoencoder)

        echo "Please run the following commands manually:"
        echo ""
        echo "  cd $FLUX_DIR/src"
        echo "  ./download-model.sh $MODEL_DIR"
        echo ""
        echo "Or download from Hugging Face:"
        echo "  https://huggingface.co/black-forest-labs/FLUX.2-klein-4B"
        echo ""
    fi
fi

echo ""

# ============================================
# Step 3: Setup Python environment
# ============================================

echo "Step 3: Setting up Python environment"
echo "----------------------------------------"

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

# Create virtual environment
if [[ -d "$VENV_DIR" ]]; then
    echo "Virtual environment exists at $VENV_DIR"
    read -p "Recreate it? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VENV_DIR"
        $PYTHON_CMD -m venv "$VENV_DIR"
    fi
else
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activate and install dependencies
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$SCRIPT_DIR/requirements.txt"

echo ""

# ============================================
# Step 4: Create output directory
# ============================================

echo "Step 4: Creating output directory"
echo "----------------------------------------"

OUTPUT_DIR="/tmp/mana-image-gen"
mkdir -p "$OUTPUT_DIR"
echo "Output directory: $OUTPUT_DIR"

echo ""

# ============================================
# Step 5: Test flux2.c
# ============================================

echo "Step 5: Testing flux2.c"
echo "----------------------------------------"

if [[ -x "$FLUX_DIR/flux" ]] && [[ -d "$MODEL_DIR" ]]; then
    echo "Testing image generation..."
    TEST_OUTPUT="$OUTPUT_DIR/test_setup.png"

    # Quick test with low resolution
    "$FLUX_DIR/flux" -d "$MODEL_DIR" -p "A simple test image" -o "$TEST_OUTPUT" -W 256 -H 256 -s 2 2>/dev/null && {
        echo "Test successful! Generated: $TEST_OUTPUT"
        rm -f "$TEST_OUTPUT"
    } || {
        echo "Warning: Test generation failed. Model may not be fully downloaded."
        echo "Please ensure the model is complete before using the service."
    }
else
    echo "Skipping test - flux2.c or model not ready"
fi

echo ""

# ============================================
# Done
# ============================================

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  FLUX_BINARY: $FLUX_DIR/flux"
echo "  FLUX_MODEL_DIR: $MODEL_DIR"
echo "  OUTPUT_DIR: $OUTPUT_DIR"
echo ""
echo "To start the service:"
echo ""
echo "  cd $SCRIPT_DIR"
echo "  source .venv/bin/activate"
echo "  FLUX_BINARY=$FLUX_DIR/flux FLUX_MODEL_DIR=$MODEL_DIR uvicorn app.main:app --host 0.0.0.0 --port 3025"
echo ""
echo "Or for development with auto-reload:"
echo ""
echo "  FLUX_BINARY=$FLUX_DIR/flux FLUX_MODEL_DIR=$MODEL_DIR uvicorn app.main:app --host 0.0.0.0 --port 3025 --reload"
echo ""
echo "Test the service:"
echo ""
echo "  curl http://localhost:3025/health"
echo "  curl -X POST http://localhost:3025/generate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"prompt\": \"A cat wearing sunglasses\"}'"
echo ""

#!/bin/bash
# ============================================================================
# Mana Video Generation - Setup Script
# Installs LTX-Video for NVIDIA GPU (CUDA)
# ============================================================================

set -e

echo "============================================"
echo "  Mana Video Generation - Setup"
echo "  Model: LTX-Video (~2B params)"
echo "  Requires: NVIDIA GPU with CUDA"
echo "============================================"
echo ""

# ---- Check NVIDIA GPU ----
echo "[1/4] Checking GPU..."

if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -1)
    echo "  GPU: $GPU_NAME ($GPU_MEM)"
else
    echo "  WARNING: nvidia-smi not found. CUDA may not be available."
    echo "  Install NVIDIA drivers and CUDA toolkit first."
fi

# ---- Python venv ----
echo ""
echo "[2/4] Setting up Python environment..."

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "  Created virtual environment"
else
    echo "  Virtual environment already exists"
fi

source .venv/bin/activate
pip install --upgrade pip -q

# ---- Install dependencies ----
echo ""
echo "[3/4] Installing dependencies..."
echo "  This will download PyTorch + LTX-Video (~5 GB total)"

# Install PyTorch with CUDA support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 -q

# Install remaining dependencies
pip install -r requirements.txt -q

echo "  Dependencies installed"

# ---- Verify installation ----
echo ""
echo "[4/4] Verifying installation..."

python3 -c "
import torch
print(f'  PyTorch: {torch.__version__}')
print(f'  CUDA available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'  GPU: {torch.cuda.get_device_name(0)}')
    print(f'  VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB')

import diffusers
print(f'  Diffusers: {diffusers.__version__}')
print()
print('  LTX-Video model will be downloaded on first generation (~4 GB)')
"

# ---- Create output directory ----
mkdir -p /tmp/mana-video-gen

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  Start the service:"
echo "    source .venv/bin/activate"
echo "    uvicorn app.main:app --host 0.0.0.0 --port 3026 --reload"
echo ""
echo "  Test:"
echo "    curl http://localhost:3026/health"
echo "    curl -X POST http://localhost:3026/generate \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"prompt\": \"A cat walking in a garden\"}'"
echo "============================================"

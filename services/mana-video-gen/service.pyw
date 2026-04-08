"""mana-video-gen service runner."""
import os
import sys

os.chdir(r"C:\mana\services\mana-video-gen")
sys.path.insert(0, r"C:\mana\services\mana-video-gen")

# Redirect stdout/stderr to log file FIRST
log = open(r"C:\mana\services\mana-video-gen\service.log", "w", buffering=1)
sys.stdout = log
sys.stderr = log

# Load .env file
from dotenv import load_dotenv
load_dotenv(r"C:\mana\services\mana-video-gen\.env")

# Ensure FFmpeg is in PATH (LTX needs it for video encoding)
ffmpeg_dir = r"C:\Users\tills\AppData\Local\Microsoft\WinGet\Links"
if ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

# HF token for model downloads
hf_token = os.environ.get("HF_TOKEN", "")
if hf_token:
    os.environ["HUGGING_FACE_HUB_TOKEN"] = hf_token

# Pre-initialize CUDA before importing diffusers
import torch
if torch.cuda.is_available():
    torch.cuda.init()
    print(f"CUDA initialized: {torch.cuda.get_device_name(0)}", flush=True)
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB", flush=True)
else:
    print("WARNING: CUDA not available, LTX will be unusably slow on CPU", flush=True)

import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=3026, log_level="info")

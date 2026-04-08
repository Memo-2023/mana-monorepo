"""mana-stt service runner."""
import os
import sys

os.chdir(r"C:\mana\services\mana-stt")
sys.path.insert(0, r"C:\mana\services\mana-stt")

# Redirect stdout/stderr to log file FIRST (before any imports that warn)
log = open(r"C:\mana\services\mana-stt\service.log", "w", buffering=1)
sys.stdout = log
sys.stderr = log

# Load .env file
from dotenv import load_dotenv
load_dotenv(r"C:\mana\services\mana-stt\.env")

# Ensure FFmpeg is in PATH
ffmpeg_dir = r"C:\Users\tills\AppData\Local\Microsoft\WinGet\Links"
if ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

# Set HF token
hf_token = os.environ.get("HF_TOKEN", "")
if hf_token:
    os.environ["HUGGING_FACE_HUB_TOKEN"] = hf_token

# Pre-initialize CUDA before importing whisperx (avoids hangs)
import torch
if torch.cuda.is_available():
    torch.cuda.init()
    print(f"CUDA initialized: {torch.cuda.get_device_name(0)}", flush=True)

import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=3020, log_level="info")

"""mana-image-gen service runner."""
import os
import sys
os.chdir(r"C:\mana\services\mana-image-gen")
sys.path.insert(0, r"C:\mana\services\mana-image-gen")

# Load .env file
from dotenv import load_dotenv
load_dotenv(r"C:\mana\services\mana-image-gen\.env")

# Redirect stdout/stderr to log file
log = open(r"C:\mana\services\mana-image-gen\service.log", "w", buffering=1)
sys.stdout = log
sys.stderr = log

import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=3023, log_level="info")

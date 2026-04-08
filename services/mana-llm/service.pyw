"""mana-llm service runner (run with pythonw.exe to run headless)."""
import os
import sys
os.chdir(r"C:\mana\services\mana-llm")
sys.path.insert(0, r"C:\mana\services\mana-llm")

# Load .env file
from dotenv import load_dotenv
load_dotenv(r"C:\mana\services\mana-llm\.env")

# Redirect stdout/stderr to log file
log = open(r"C:\mana\services\mana-llm\service.log", "w", buffering=1)
sys.stdout = log
sys.stderr = log

import uvicorn
uvicorn.run("src.main:app", host="0.0.0.0", port=3025, log_level="info")

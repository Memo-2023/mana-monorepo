#!/bin/bash
# Configure Ollama for optimal memory usage on Mac Mini
#
# Sets OLLAMA_KEEP_ALIVE=5m so models unload from RAM after 5 minutes
# of inactivity. This is critical on the 16GB Mac Mini where Ollama
# models can consume 3-16 GB RAM.
#
# Run on the Mac Mini:
#   ./scripts/mac-mini/configure-ollama.sh

set -e

PLIST_DIR="$HOME/Library/LaunchAgents"
OLLAMA_PLIST="$PLIST_DIR/homebrew.mxcl.ollama.plist"

echo "=== Ollama Memory Optimization ==="
echo ""

# Check if Ollama is installed
if ! command -v ollama &>/dev/null && [ ! -f /opt/homebrew/bin/ollama ]; then
    echo "ERROR: Ollama not found. Install with: brew install ollama"
    exit 1
fi

# Create override plist that sets environment variables
# This is the recommended way to add env vars to a Homebrew service
OVERRIDE_PLIST="$PLIST_DIR/com.manacore.ollama-env.plist"

cat > "$OVERRIDE_PLIST" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.manacore.ollama-env</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>
            # Set Ollama environment variables system-wide via launchctl
            launchctl setenv OLLAMA_KEEP_ALIVE 5m
            launchctl setenv OLLAMA_FLASH_ATTENTION 1
            launchctl setenv OLLAMA_KV_CACHE_TYPE q8_0
            launchctl setenv OLLAMA_NUM_PARALLEL 1
            launchctl setenv OLLAMA_MAX_LOADED_MODELS 1
        </string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST

echo "Created: $OVERRIDE_PLIST"

# Apply immediately (no reboot needed)
launchctl setenv OLLAMA_KEEP_ALIVE 5m
launchctl setenv OLLAMA_FLASH_ATTENTION 1
launchctl setenv OLLAMA_KV_CACHE_TYPE q8_0
launchctl setenv OLLAMA_NUM_PARALLEL 1
launchctl setenv OLLAMA_MAX_LOADED_MODELS 1

echo ""
echo "Environment variables set:"
echo "  OLLAMA_KEEP_ALIVE=5m        (unload models after 5min idle → saves 3-16GB RAM)"
echo "  OLLAMA_FLASH_ATTENTION=1    (faster attention computation)"
echo "  OLLAMA_KV_CACHE_TYPE=q8_0   (efficient KV cache)"
echo "  OLLAMA_NUM_PARALLEL=1       (max 1 parallel request → predictable memory)"
echo "  OLLAMA_MAX_LOADED_MODELS=1  (max 1 model in RAM at a time)"
echo ""

# Restart Ollama to pick up new settings
echo "Restarting Ollama..."
/opt/homebrew/bin/brew services restart ollama 2>/dev/null || {
    echo "Homebrew restart failed, trying launchctl..."
    launchctl stop homebrew.mxcl.ollama 2>/dev/null
    sleep 2
    launchctl start homebrew.mxcl.ollama 2>/dev/null
}

echo ""
echo "Done! Verify with:"
echo "  ollama ps                    # Should show no loaded models (or model with 5m timeout)"
echo "  curl localhost:11434/api/ps  # Same via API"
echo ""
echo "Expected behavior:"
echo "  - First request: ~2-5s cold start (model loads into RAM)"
echo "  - Subsequent requests within 5min: instant (model in RAM)"
echo "  - After 5min idle: model unloads, RAM freed"

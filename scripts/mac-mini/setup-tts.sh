#!/bin/bash
# Setup script for Mana TTS as a launchd service on Mac Mini
# Run this on the Mac Mini server to install and start the TTS service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_DIR="$REPO_DIR/services/mana-tts"
PLIST_NAME="com.manacore.tts"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "=========================================="
echo "Mana TTS - Mac Mini Setup"
echo "=========================================="
echo ""
echo "Service directory: $SERVICE_DIR"
echo "Plist path: $PLIST_PATH"
echo ""

# Verify service directory exists
if [[ ! -d "$SERVICE_DIR" ]]; then
    echo "Error: Service directory not found: $SERVICE_DIR"
    exit 1
fi

# Run main setup if venv doesn't exist
if [[ ! -d "$SERVICE_DIR/.venv" ]]; then
    echo "Virtual environment not found. Running setup..."
    echo ""
    "$SERVICE_DIR/setup.sh"
    echo ""
fi

# Create LaunchAgents directory if needed
mkdir -p "$HOME/Library/LaunchAgents"

# Unload existing service if running
if launchctl list | grep -q "$PLIST_NAME"; then
    echo "Stopping existing service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# Create plist file
echo "Creating launchd plist..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>

    <key>ProgramArguments</key>
    <array>
        <string>$SERVICE_DIR/.venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>3022</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$SERVICE_DIR</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:$SERVICE_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>PORT</key>
        <string>3022</string>
        <key>PRELOAD_MODELS</key>
        <string>false</string>
        <key>MAX_TEXT_LENGTH</key>
        <string>1000</string>
        <key>CORS_ORIGINS</key>
        <string>https://mana.how</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardOutPath</key>
    <string>/tmp/manacore-tts.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/manacore-tts.error.log</string>
</dict>
</plist>
EOF

echo "Plist created: $PLIST_PATH"

# Load service
echo ""
echo "Loading service..."
launchctl load "$PLIST_PATH"

# Wait for startup
echo "Waiting for service to start..."
sleep 3

# Check if running
if launchctl list | grep -q "$PLIST_NAME"; then
    echo "Service loaded successfully!"
else
    echo "Warning: Service may not have loaded correctly."
    echo "Check logs: tail -f /tmp/manacore-tts.log"
fi

# Health check
echo ""
echo "Running health check..."
sleep 2

if curl -s http://localhost:3022/health | grep -q "healthy"; then
    echo "Health check passed!"
    echo ""
    curl -s http://localhost:3022/health | python3 -m json.tool
else
    echo "Health check failed. Service may still be starting."
    echo "Try again in a few seconds: curl http://localhost:3022/health"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Service management commands:"
echo ""
echo "  # View logs"
echo "  tail -f /tmp/manacore-tts.log"
echo ""
echo "  # Stop service"
echo "  launchctl unload $PLIST_PATH"
echo ""
echo "  # Start service"
echo "  launchctl load $PLIST_PATH"
echo ""
echo "  # Restart service"
echo "  launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH"
echo ""
echo "  # Check status"
echo "  launchctl list | grep $PLIST_NAME"
echo ""
echo "Test endpoints:"
echo ""
echo "  # Health check"
echo "  curl http://localhost:3022/health"
echo ""
echo "  # List voices"
echo "  curl http://localhost:3022/voices"
echo ""
echo "  # Synthesize with Kokoro"
echo "  curl -X POST http://localhost:3022/synthesize/kokoro \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"text\": \"Hello world\", \"voice\": \"af_heart\"}' \\"
echo "    --output test.wav"
echo ""

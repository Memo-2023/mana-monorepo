#!/bin/bash
# Setup STT Service on Mac Mini
# Creates launchd service for auto-start

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
STT_DIR="$REPO_DIR/services/mana-stt"
PLIST_NAME="com.mana.stt"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "=============================================="
echo "  Mana STT Service Setup (Mac Mini)"
echo "=============================================="
echo ""

# Check if STT service directory exists
if [ ! -d "$STT_DIR" ]; then
    echo "Error: STT service directory not found at $STT_DIR"
    exit 1
fi

# Run the main setup script first
echo "1. Running STT service setup..."
cd "$STT_DIR"
if [ ! -d ".venv" ]; then
    echo "   Installing dependencies..."
    ./setup.sh
else
    echo "   Virtual environment already exists"
    echo "   Skipping dependency installation"
fi

# Create launchd plist
echo ""
echo "2. Creating launchd service..."

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>

    <key>ProgramArguments</key>
    <array>
        <string>$STT_DIR/.venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>3020</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$STT_DIR</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:$STT_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>PORT</key>
        <string>3020</string>
        <key>WHISPER_MODEL</key>
        <string>large-v3</string>
        <key>PRELOAD_MODELS</key>
        <string>false</string>
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
    <string>/tmp/mana-stt.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/mana-stt.error.log</string>
</dict>
</plist>
EOF

echo "   Created: $PLIST_PATH"

# Unload if already loaded
echo ""
echo "3. Loading launchd service..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

# Wait for service to start
sleep 2

# Check if service is running
echo ""
echo "4. Checking service status..."
if launchctl list | grep -q "$PLIST_NAME"; then
    echo "   Service is running"

    # Check health endpoint
    sleep 3
    if curl -s http://localhost:3020/health > /dev/null 2>&1; then
        echo "   Health check passed"
        HEALTH=$(curl -s http://localhost:3020/health)
        echo "   $HEALTH"
    else
        echo "   Warning: Health check failed (service may still be starting)"
        echo "   Check logs: tail -f /tmp/mana-stt.log"
    fi
else
    echo "   Warning: Service may not be running"
    echo "   Check logs: tail -f /tmp/mana-stt.error.log"
fi

echo ""
echo "=============================================="
echo "  STT Service Setup Complete!"
echo "=============================================="
echo ""
echo "Service URL: http://localhost:3020"
echo ""
echo "Useful commands:"
echo "  # View logs"
echo "  tail -f /tmp/mana-stt.log"
echo ""
echo "  # Restart service"
echo "  launchctl kickstart -k gui/\$(id -u)/$PLIST_NAME"
echo ""
echo "  # Stop service"
echo "  launchctl unload $PLIST_PATH"
echo ""
echo "  # Start service"
echo "  launchctl load $PLIST_PATH"
echo ""
echo "  # Test transcription"
echo "  curl -X POST http://localhost:3020/transcribe \\"
echo "    -F 'file=@audio.mp3' \\"
echo "    -F 'language=de'"
echo ""

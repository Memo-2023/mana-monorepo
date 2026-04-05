#!/bin/bash
# Setup script for Mana Image Generation as a launchd service on Mac Mini
# Run this on the Mac Mini server to install and start the image generation service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_DIR="$REPO_DIR/services/mana-image-gen"
PLIST_NAME="com.mana.image-gen"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# flux2.c paths (in home directory, no sudo required)
FLUX_BINARY="$HOME/flux2/flux"
FLUX_MODEL_DIR="$HOME/flux2/model"

echo "=========================================="
echo "Mana Image Generation - Mac Mini Setup"
echo "=========================================="
echo ""
echo "Service directory: $SERVICE_DIR"
echo "Plist path: $PLIST_PATH"
echo "Flux binary: $FLUX_BINARY"
echo "Flux model: $FLUX_MODEL_DIR"
echo ""

# Verify service directory exists
if [[ ! -d "$SERVICE_DIR" ]]; then
    echo "Error: Service directory not found: $SERVICE_DIR"
    exit 1
fi

# Run main setup if venv doesn't exist or flux2.c not installed
if [[ ! -d "$SERVICE_DIR/.venv" ]] || [[ ! -x "$FLUX_BINARY" ]]; then
    echo "Running setup (installs flux2.c + Python environment)..."
    echo ""
    "$SERVICE_DIR/setup.sh"
    echo ""
fi

# Verify flux2.c is available
if [[ ! -x "$FLUX_BINARY" ]]; then
    echo "Error: flux2.c not found at $FLUX_BINARY"
    echo "Please run setup.sh first to install flux2.c"
    exit 1
fi

if [[ ! -d "$FLUX_MODEL_DIR" ]]; then
    echo "Error: Model not found at $FLUX_MODEL_DIR"
    echo "Please download the FLUX.2 klein 4B model"
    exit 1
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
        <string>3025</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$SERVICE_DIR</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:$SERVICE_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>PORT</key>
        <string>3025</string>
        <key>FLUX_BINARY</key>
        <string>$FLUX_BINARY</string>
        <key>FLUX_MODEL_DIR</key>
        <string>$FLUX_MODEL_DIR</string>
        <key>DEFAULT_STEPS</key>
        <string>4</string>
        <key>DEFAULT_WIDTH</key>
        <string>1024</string>
        <key>DEFAULT_HEIGHT</key>
        <string>1024</string>
        <key>GENERATION_TIMEOUT</key>
        <string>120</string>
        <key>CORS_ORIGINS</key>
        <string>https://mana.how,http://localhost:5173</string>
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
    <string>/tmp/mana-image-gen.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/mana-image-gen.error.log</string>
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
    echo "Check logs: tail -f /tmp/mana-image-gen.log"
fi

# Health check
echo ""
echo "Running health check..."
sleep 2

if curl -s http://localhost:3025/health | grep -q "healthy\|degraded"; then
    echo "Health check passed!"
    echo ""
    curl -s http://localhost:3025/health | python3 -m json.tool
else
    echo "Health check failed. Service may still be starting."
    echo "Try again in a few seconds: curl http://localhost:3025/health"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Service management commands:"
echo ""
echo "  # View logs"
echo "  tail -f /tmp/mana-image-gen.log"
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
echo "  curl http://localhost:3025/health"
echo ""
echo "  # Model info"
echo "  curl http://localhost:3025/models"
echo ""
echo "  # Generate image"
echo "  curl -X POST http://localhost:3025/generate \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"prompt\": \"A cat in space\"}'"
echo ""

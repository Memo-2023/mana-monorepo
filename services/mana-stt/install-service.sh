#!/bin/bash
# Install mana-stt as a launchd service on macOS
# Run this script on the Mac Mini server

set -e

SERVICE_NAME="com.manacore.mana-stt"
PLIST_FILE="$SERVICE_NAME.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/logs"

echo "Installing mana-stt launchd service..."

# Create logs directory
mkdir -p "$LOG_DIR"

# Stop existing service if running
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "Stopping existing service..."
    launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true
fi

# Copy plist to LaunchAgents
cp "$SCRIPT_DIR/$PLIST_FILE" "$LAUNCH_AGENTS_DIR/"

# Load the service
echo "Loading service..."
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_FILE"

# Check status
sleep 2
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "Service installed and running!"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    tail -f $LOG_DIR/mana-stt.log"
    echo "  View errors:  tail -f $LOG_DIR/mana-stt.error.log"
    echo "  Stop:         launchctl unload $LAUNCH_AGENTS_DIR/$PLIST_FILE"
    echo "  Start:        launchctl load $LAUNCH_AGENTS_DIR/$PLIST_FILE"
    echo "  Health check: curl http://localhost:3020/health"
else
    echo "ERROR: Service failed to start. Check logs at $LOG_DIR/mana-stt.error.log"
    exit 1
fi

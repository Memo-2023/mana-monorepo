#!/bin/bash
# Install mana-stt and vllm-voxtral as launchd services on macOS
# Run this script on the Mac Mini server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/logs"

echo "============================================"
echo "Installing Mana STT Services"
echo "============================================"
echo ""

# Create logs directory
mkdir -p "$LOG_DIR"

install_service() {
    local service_name="$1"
    local plist_file="$service_name.plist"

    echo "Installing $service_name..."

    # Stop existing service if running
    if launchctl list | grep -q "$service_name"; then
        echo "  Stopping existing service..."
        launchctl unload "$LAUNCH_AGENTS_DIR/$plist_file" 2>/dev/null || true
    fi

    # Copy plist to LaunchAgents
    cp "$SCRIPT_DIR/$plist_file" "$LAUNCH_AGENTS_DIR/"

    # Load the service
    echo "  Loading service..."
    launchctl load "$LAUNCH_AGENTS_DIR/$plist_file"

    sleep 2
    if launchctl list | grep -q "$service_name"; then
        echo "  ✓ $service_name installed and running"
    else
        echo "  ✗ $service_name failed to start"
        return 1
    fi
}

# Install vLLM first (STT depends on it)
install_service "com.mana.vllm-voxtral"

# Wait for vLLM to initialize
echo ""
echo "Waiting for vLLM server to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8100/health > /dev/null 2>&1; then
        echo "  ✓ vLLM server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ! vLLM server not responding yet (may still be loading model)"
    fi
    sleep 2
done

# Install STT service
echo ""
install_service "com.mana.mana-stt"

echo ""
echo "============================================"
echo "Installation complete!"
echo "============================================"
echo ""
echo "Services:"
echo "  vLLM Voxtral: http://localhost:8100"
echo "  Mana STT: http://localhost:3020"
echo ""
echo "Useful commands:"
echo "  View vLLM logs:  tail -f $LOG_DIR/vllm-voxtral.log"
echo "  View STT logs:   tail -f $LOG_DIR/mana-stt.log"
echo "  Health check:    curl http://localhost:3020/health"
echo ""
echo "Stop all:"
echo "  launchctl unload $LAUNCH_AGENTS_DIR/com.mana.vllm-voxtral.plist"
echo "  launchctl unload $LAUNCH_AGENTS_DIR/com.mana.mana-stt.plist"

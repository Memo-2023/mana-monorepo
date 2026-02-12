#!/bin/bash
# Configure Docker daemon for log rotation
# This prevents docker logs from consuming unlimited disk space
#
# Run once after Docker Desktop installation

set -e

DOCKER_CONFIG_DIR="$HOME/.docker"
DAEMON_JSON="$DOCKER_CONFIG_DIR/daemon.json"

echo "=== Docker Log Rotation Setup ==="

# Create config directory if needed
mkdir -p "$DOCKER_CONFIG_DIR"

# Backup existing config
if [ -f "$DAEMON_JSON" ]; then
    cp "$DAEMON_JSON" "${DAEMON_JSON}.backup.$(date +%Y%m%d)"
    echo "Backed up existing daemon.json"
fi

# Check if config exists and has content
if [ -f "$DAEMON_JSON" ] && [ -s "$DAEMON_JSON" ]; then
    # Merge with existing config using jq if available
    if command -v jq &> /dev/null; then
        echo "Merging with existing daemon.json..."
        jq '. + {
            "log-driver": "json-file",
            "log-opts": {
                "max-size": "50m",
                "max-file": "3",
                "compress": "true"
            }
        }' "$DAEMON_JSON" > "${DAEMON_JSON}.tmp" && mv "${DAEMON_JSON}.tmp" "$DAEMON_JSON"
    else
        echo "WARNING: jq not installed, cannot merge configs"
        echo "Please manually add log settings to $DAEMON_JSON"
        echo ""
        echo 'Add this to your daemon.json:'
        echo '  "log-driver": "json-file",'
        echo '  "log-opts": {'
        echo '    "max-size": "50m",'
        echo '    "max-file": "3",'
        echo '    "compress": "true"'
        echo '  }'
        exit 1
    fi
else
    # Create new config
    echo "Creating new daemon.json..."
    cat > "$DAEMON_JSON" << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "50m",
        "max-file": "3",
        "compress": "true"
    }
}
EOF
fi

echo ""
echo "Log rotation configured:"
echo "  - Max size per log file: 50MB"
echo "  - Max files per container: 3"
echo "  - Compression: enabled"
echo "  - Total max logs per container: ~150MB"
echo ""
echo "IMPORTANT: Restart Docker Desktop for changes to take effect!"
echo ""
echo "To verify after restart:"
echo "  docker info | grep -A5 'Logging Driver'"

#!/bin/bash
# Mana Mac Mini Auto-Start Setup
# Run this ONCE on the Mac Mini to configure automatic startup on boot
#
# This sets up:
# 1. Cloudflared tunnel (via launchd)
# 2. Docker containers (via launchd, after Docker starts)
# 3. Periodic health checks (every 5 minutes)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
USER_HOME="$HOME"
LAUNCH_AGENTS_DIR="$USER_HOME/Library/LaunchAgents"

echo "=== Mana Mac Mini Auto-Start Setup ==="
echo ""
echo "Project root: $PROJECT_ROOT"
echo "User: $(whoami)"
echo ""

# Create LaunchAgents directory
mkdir -p "$LAUNCH_AGENTS_DIR"

# Make scripts executable
chmod +x "$SCRIPT_DIR/startup.sh"
chmod +x "$SCRIPT_DIR/health-check.sh"
chmod +x "$SCRIPT_DIR/setup-cloudflared-service.sh"

# ============================================
# 1. Cloudflared Tunnel Service
# ============================================
echo "=== Setting up Cloudflared Service ==="

TUNNEL_ID="bb0ea86d-8253-4a54-838b-107bb7945be9"
CLOUDFLARED_CONFIG="$PROJECT_ROOT/cloudflared-config.yml"
CREDENTIALS_FILE="$USER_HOME/.cloudflared/${TUNNEL_ID}.json"

# Check if credentials exist
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo ""
    echo "WARNING: Cloudflare credentials not found!"
    echo "Run these commands first:"
    echo "  cloudflared tunnel login"
    echo "  cloudflared tunnel create mana-server"
    echo ""
    echo "Then run this script again."
    echo ""
else
    # Create cloudflared plist
    CLOUDFLARED_PLIST="$LAUNCH_AGENTS_DIR/com.cloudflare.cloudflared.plist"
    cat > "$CLOUDFLARED_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.cloudflared</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>--config</string>
        <string>${CLOUDFLARED_CONFIG}</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cloudflared.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cloudflared.error.log</string>
</dict>
</plist>
EOF
    echo "Created: $CLOUDFLARED_PLIST"

    # Load cloudflared service
    launchctl unload "$CLOUDFLARED_PLIST" 2>/dev/null || true
    launchctl load "$CLOUDFLARED_PLIST"
    echo "Cloudflared service loaded"
fi

# ============================================
# 2. Mana Docker Startup Service
# ============================================
echo ""
echo "=== Setting up Docker Startup Service ==="

DOCKER_PLIST="$LAUNCH_AGENTS_DIR/com.mana.docker-startup.plist"
cat > "$DOCKER_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mana.docker-startup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_DIR}/startup.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>0</integer>
    <key>StandardOutPath</key>
    <string>/tmp/mana-startup.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mana-startup.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF
echo "Created: $DOCKER_PLIST"

# Load docker startup service
launchctl unload "$DOCKER_PLIST" 2>/dev/null || true
launchctl load "$DOCKER_PLIST"
echo "Docker startup service loaded"

# ============================================
# 3. Health Check Service (every 5 minutes)
# ============================================
echo ""
echo "=== Setting up Health Check Service ==="

HEALTH_PLIST="$LAUNCH_AGENTS_DIR/com.mana.health-check.plist"
cat > "$HEALTH_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mana.health-check</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_DIR}/health-check.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>StandardOutPath</key>
    <string>/tmp/mana-health.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mana-health.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF
echo "Created: $HEALTH_PLIST"

# Load health check service
launchctl unload "$HEALTH_PLIST" 2>/dev/null || true
launchctl load "$HEALTH_PLIST"
echo "Health check service loaded (runs every 5 minutes)"

# ============================================
# Summary
# ============================================
echo ""
echo "=========================================="
echo "  Auto-Start Setup Complete!"
echo "=========================================="
echo ""
echo "Services configured:"
echo "  1. Cloudflared tunnel (starts on login)"
echo "  2. Docker containers (starts on login)"
echo "  3. Health checks (every 5 minutes)"
echo ""
echo "Log files:"
echo "  /tmp/cloudflared.log"
echo "  /tmp/mana-startup.log"
echo "  /tmp/mana-health.log"
echo ""
echo "Manual commands:"
echo "  Check status:    launchctl list | grep -E 'cloudflare|mana'"
echo "  View logs:       tail -f /tmp/mana-startup.log"
echo "  Health check:    $SCRIPT_DIR/health-check.sh"
echo "  Restart docker:  launchctl kickstart -k gui/\$(id -u)/com.mana.docker-startup"
echo ""
echo "IMPORTANT: Make sure Docker Desktop is set to start on login!"
echo "  Docker Desktop > Settings > General > 'Start Docker Desktop when you sign in'"
echo ""

# Optional: Configure notifications
echo "Optional: To enable push notifications on failures, set:"
echo "  export NTFY_TOPIC=your-topic-name"
echo "  in your .zshrc or .bashrc"
echo ""

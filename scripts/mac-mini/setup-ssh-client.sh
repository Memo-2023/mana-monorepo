#!/bin/bash
# Setup SSH access to Mac Mini via Cloudflare Tunnel
# Run this on your LOCAL machine (not on Mac Mini)

set -e

echo "=== SSH Client Setup for Mac Mini ==="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    else
        echo "Please install cloudflared manually: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

# Create SSH config directory
mkdir -p ~/.ssh

# Add SSH config for Mac Mini
if ! grep -q "Host mac-mini" ~/.ssh/config 2>/dev/null; then
    echo "" >> ~/.ssh/config
    cat >> ~/.ssh/config << 'EOF'

# Mac Mini via Cloudflare Tunnel
Host mac-mini
    HostName ssh.mana.how
    User mana
    ProxyCommand cloudflared access ssh --hostname %h
EOF
    echo "Added mac-mini to ~/.ssh/config"
else
    echo "mac-mini already in ~/.ssh/config"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "You can now connect with:"
echo "  ssh mac-mini"
echo ""
echo "First connection will open browser for Cloudflare Access login."
echo ""

#!/bin/bash

# Get SSH Private Key Content for GitHub Secret

echo "================================================"
echo "  SSH PRIVATE KEY FOR STAGING_SSH_KEY"
echo "================================================"
echo ""
echo "Copy the ENTIRE output below (including BEGIN and END lines):"
echo ""
echo "================================================"

cat ~/.ssh/hetzner_deploy_key

echo "================================================"
echo ""
echo "This is the value for: STAGING_SSH_KEY"
echo ""

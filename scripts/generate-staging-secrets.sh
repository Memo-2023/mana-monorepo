#!/bin/bash

# Generate Staging Secrets for GitHub
# Run this script and copy the output to GitHub Secrets

set -e

echo "================================================"
echo "  STAGING SECRETS GENERATOR"
echo "================================================"
echo ""
echo "Copy each value below to GitHub Settings → Secrets and variables → Actions"
echo ""
echo "Note: Configuration values (host, ports, etc.) are now hardcoded in the workflow"
echo "Only sensitive values (passwords, keys) need to be added as secrets"
echo ""
echo "================================================"
echo ""

# Generate secure random passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Generate Ed25519 key pair for JWT
TEMP_KEY_DIR=$(mktemp -d)
ssh-keygen -t ed25519 -f "$TEMP_KEY_DIR/jwt_key" -N "" -C "manacore-staging-jwt" > /dev/null 2>&1

# Convert SSH keys to raw format for JWT
PRIVATE_KEY=$(cat "$TEMP_KEY_DIR/jwt_key" | grep -v "BEGIN" | grep -v "END" | tr -d '\n')
PUBLIC_KEY=$(ssh-keygen -e -m PKCS8 -f "$TEMP_KEY_DIR/jwt_key.pub" 2>/dev/null | grep -v "BEGIN" | grep -v "END" | tr -d '\n' || cat "$TEMP_KEY_DIR/jwt_key.pub" | awk '{print $2}')

# Clean up temp files
rm -rf "$TEMP_KEY_DIR"

# Output all secrets in GitHub format
echo "# ============================================"
echo "# DATABASE SECRETS (2 secrets)"
echo "# ============================================"
echo ""
echo "STAGING_POSTGRES_PASSWORD"
echo "$POSTGRES_PASSWORD"
echo ""

echo "# ============================================"
echo "# REDIS SECRETS (1 secret)"
echo "# ============================================"
echo ""
echo "STAGING_REDIS_PASSWORD"
echo "$REDIS_PASSWORD"
echo ""

echo "# ============================================"
echo "# MANA CORE AUTH SECRETS (3 secrets)"
echo "# ============================================"
echo ""
echo "STAGING_JWT_SECRET"
echo "$JWT_SECRET"
echo ""
echo "STAGING_JWT_PUBLIC_KEY"
echo "$PUBLIC_KEY"
echo ""
echo "STAGING_JWT_PRIVATE_KEY"
echo "$PRIVATE_KEY"
echo ""

echo "# ============================================"
echo "# SUPABASE SECRETS (Fill these manually - 3 secrets)"
echo "# ============================================"
echo ""
echo "STAGING_SUPABASE_URL"
echo "https://YOUR_PROJECT.supabase.co"
echo ""
echo "STAGING_SUPABASE_ANON_KEY"
echo "YOUR_SUPABASE_ANON_KEY_HERE"
echo ""
echo "STAGING_SUPABASE_SERVICE_ROLE_KEY"
echo "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"
echo ""

echo "# ============================================"
echo "# AZURE OPENAI SECRETS (Fill these manually - 2 secrets)"
echo "# ============================================"
echo ""
echo "STAGING_AZURE_OPENAI_ENDPOINT"
echo "https://YOUR_RESOURCE.openai.azure.com/"
echo ""
echo "STAGING_AZURE_OPENAI_API_KEY"
echo "YOUR_AZURE_OPENAI_API_KEY_HERE"
echo ""

echo "# ============================================"
echo "# SSH DEPLOYMENT SECRETS (Fill these manually - 1 secret)"
echo "# ============================================"
echo ""
echo "STAGING_SSH_KEY"
echo "Run: cat ~/.ssh/hetzner_deploy_key"
echo "(Copy the ENTIRE output including -----BEGIN and -----END lines)"
echo ""

echo "================================================"
echo "  SUMMARY"
echo "================================================"
echo ""
echo "Total secrets to add: 12"
echo "  - Auto-generated: 6 (passwords, JWT keys)"
echo "  - Manual: 6 (Supabase, Azure, SSH key)"
echo ""
echo "The following are now HARDCODED in the workflow:"
echo "  - POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER"
echo "  - REDIS_HOST, REDIS_PORT"
echo "  - MANA_SERVICE_URL"
echo "  - STAGING_HOST (46.224.108.214)"
echo "  - STAGING_USER (deploy)"
echo ""
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/YOUR_ORG/manacore-monorepo/settings/secrets/actions"
echo "2. Click 'New repository secret' for each value above"
echo "3. Copy the secret name (e.g., STAGING_POSTGRES_PASSWORD)"
echo "4. Copy the secret value (the line below the name)"
echo "5. Fill in Supabase, Azure, and SSH key values manually"
echo ""

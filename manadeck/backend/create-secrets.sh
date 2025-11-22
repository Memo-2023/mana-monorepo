#!/bin/bash
# Create GCP secrets for Manadeck Backend
# Usage: ./create-secrets.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Manadeck Backend - GCP Secrets Setup"
echo "=========================================="
echo ""

# Configuration
DEPLOY_PROJECT_ID="memo-2c4c4"  # Project where Cloud Run service is deployed
SECRETS_PROJECT_ID="mana-core-453821"  # Project where all secrets are stored
REGION="europe-west3"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗${NC} gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

echo -e "${GREEN}✓${NC} gcloud CLI found"
echo ""

# Check authentication
echo "Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}✗${NC} Not authenticated with GCP. Running 'gcloud auth login'..."
    gcloud auth login
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo -e "${GREEN}✓${NC} Authenticated as: $ACTIVE_ACCOUNT"
echo ""

# Set project for deployment
echo "Deployment project: $DEPLOY_PROJECT_ID"
echo "Secrets project: $SECRETS_PROJECT_ID"
gcloud config set project $SECRETS_PROJECT_ID
echo ""

# Prompt for secret values
echo "=========================================="
echo "Enter Secret Values"
echo "=========================================="
echo ""
echo -e "${YELLOW}Note: All secrets will be stored in project ${SECRETS_PROJECT_ID}${NC}"
echo ""

# Check if MANA_SERVICE_URL exists
echo "Checking for global MANA_SERVICE_URL secret..."
if gcloud secrets describe MANA_SERVICE_URL --project=$SECRETS_PROJECT_ID &> /dev/null; then
    echo -e "${GREEN}✓${NC} MANA_SERVICE_URL secret exists"
    MANA_URL=$(gcloud secrets versions access latest --secret=MANA_SERVICE_URL --project=$SECRETS_PROJECT_ID 2>/dev/null || echo "")
    if [ -n "$MANA_URL" ]; then
        echo "   Current value: $MANA_URL"
    else
        echo -e "${YELLOW}⚠${NC} Could not read value (may need permissions)"
    fi
else
    echo -e "${YELLOW}⚠${NC} MANA_SERVICE_URL secret not found!"
    read -p "Enter MANA_SERVICE_URL (e.g., https://mana-core.run.app): " MANA_URL

    if [ -n "$MANA_URL" ]; then
        echo "Creating MANA_SERVICE_URL secret..."
        echo "$MANA_URL" | gcloud secrets create MANA_SERVICE_URL \
            --data-file=- \
            --project=$SECRETS_PROJECT_ID \
            --labels=service=global
        echo -e "${GREEN}✓${NC} MANA_SERVICE_URL secret created"
    else
        echo -e "${RED}✗${NC} MANA_SERVICE_URL is required"
        exit 1
    fi
fi
echo ""

# Manadeck-specific secrets
echo "Enter Manadeck-specific secrets:"
echo ""

# APP_ID
read -p "MANADECK_APP_ID (your app ID from Mana Core): " APP_ID
if [ -z "$APP_ID" ]; then
    echo -e "${RED}✗${NC} APP_ID is required"
    exit 1
fi

# SERVICE_KEY
echo ""
echo "SERVICE_KEY (for service-to-service authentication)"
echo -e "${YELLOW}Press Enter to generate a random key, or paste your own:${NC}"
read -p "" SERVICE_KEY
if [ -z "$SERVICE_KEY" ]; then
    SERVICE_KEY=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated SERVICE_KEY:${NC} $SERVICE_KEY"
    echo -e "${YELLOW}⚠ IMPORTANT: Add this to APP_SERVICE_KEYS in mana-core-middleware:${NC}"
    echo -e "${YELLOW}   Format: ${APP_ID}:${SERVICE_KEY}${NC}"
fi

# SUPABASE_URL
echo ""
read -p "MANADECK_SUPABASE_URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}✗${NC} SUPABASE_URL is required"
    exit 1
fi

# SUPABASE_ANON_KEY
echo ""
read -p "MANADECK_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}✗${NC} SUPABASE_ANON_KEY is required"
    exit 1
fi

# SUPABASE_SERVICE_KEY
echo ""
read -p "MANADECK_SUPABASE_SERVICE_KEY (service role key): " SUPABASE_SERVICE_KEY
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}✗${NC} SUPABASE_SERVICE_KEY is required"
    exit 1
fi

# SIGNUP_REDIRECT_URL
echo ""
read -p "MANADECK_SIGNUP_REDIRECT_URL (e.g., https://yourapp.com/welcome): " SIGNUP_REDIRECT_URL
if [ -z "$SIGNUP_REDIRECT_URL" ]; then
    echo -e "${YELLOW}⚠${NC} SIGNUP_REDIRECT_URL is empty (optional)"
fi

echo ""
echo "=========================================="
echo "Creating Secrets"
echo "=========================================="
echo ""

# Function to create or update secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    if [ -z "$SECRET_VALUE" ]; then
        echo -e "${YELLOW}⚠${NC} Skipping $SECRET_NAME (empty value)"
        return
    fi

    if gcloud secrets describe $SECRET_NAME --project=$SECRETS_PROJECT_ID &> /dev/null; then
        echo -e "${YELLOW}⚠${NC} $SECRET_NAME already exists"
        read -p "   Update with new value? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME \
                --data-file=- \
                --project=$SECRETS_PROJECT_ID
            echo -e "${GREEN}✓${NC} $SECRET_NAME updated"
        else
            echo "   Skipped $SECRET_NAME"
        fi
    else
        echo "Creating $SECRET_NAME..."
        echo "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME \
            --data-file=- \
            --project=$SECRETS_PROJECT_ID \
            --labels=service=manadeck,environment=production
        echo -e "${GREEN}✓${NC} $SECRET_NAME created"
    fi
}

# Create all secrets
create_or_update_secret "MANADECK_APP_ID" "$APP_ID"
create_or_update_secret "MANADECK_SERVICE_KEY" "$SERVICE_KEY"
create_or_update_secret "MANADECK_SUPABASE_URL" "$SUPABASE_URL"
create_or_update_secret "MANADECK_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
create_or_update_secret "MANADECK_SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"
create_or_update_secret "MANADECK_SIGNUP_REDIRECT_URL" "$SIGNUP_REDIRECT_URL"

echo ""
echo "=========================================="
echo "Grant Service Account Access"
echo "=========================================="
echo ""

SERVICE_ACCOUNT="manadeck-backend-sa@${DEPLOY_PROJECT_ID}.iam.gserviceaccount.com"

echo "Checking if service account exists..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT --project=$DEPLOY_PROJECT_ID &> /dev/null; then
    echo -e "${GREEN}✓${NC} Service account exists: $SERVICE_ACCOUNT"
    echo ""

    read -p "Grant service account access to secrets? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "Granting access to all secrets in ${SECRETS_PROJECT_ID}..."

        # Grant access to all secrets
        for SECRET in MANA_SERVICE_URL MANADECK_APP_ID MANADECK_SERVICE_KEY MANADECK_SUPABASE_URL MANADECK_SUPABASE_ANON_KEY MANADECK_SUPABASE_SERVICE_KEY MANADECK_SIGNUP_REDIRECT_URL; do
            if gcloud secrets describe $SECRET --project=$SECRETS_PROJECT_ID &> /dev/null; then
                gcloud secrets add-iam-policy-binding $SECRET \
                    --member="serviceAccount:${SERVICE_ACCOUNT}" \
                    --role="roles/secretmanager.secretAccessor" \
                    --project=$SECRETS_PROJECT_ID \
                    --condition=None \
                    2>/dev/null || echo "   Access already granted for $SECRET"
                echo -e "${GREEN}✓${NC} $SECRET access granted"
            fi
        done
    fi
else
    echo -e "${YELLOW}⚠${NC} Service account not found: $SERVICE_ACCOUNT"
    echo "   Create it first with:"
    echo "   gcloud iam service-accounts create manadeck-backend-sa \\"
    echo "     --display-name=\"Manadeck Backend Service Account\" \\"
    echo "     --project=$DEPLOY_PROJECT_ID"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✓${NC} Secrets created/updated in project: $SECRETS_PROJECT_ID"
echo ""
echo "All secrets in mana-core-453821:"
echo "  - MANA_SERVICE_URL (global)"
echo "  - MANADECK_APP_ID"
echo "  - MANADECK_SERVICE_KEY"
echo "  - MANADECK_SUPABASE_URL"
echo "  - MANADECK_SUPABASE_ANON_KEY"
echo "  - MANADECK_SUPABASE_SERVICE_KEY"
echo "  - MANADECK_SIGNUP_REDIRECT_URL"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Add SERVICE_KEY to mana-core-middleware APP_SERVICE_KEYS:"
echo "   Format: ${APP_ID}:${SERVICE_KEY}"
echo ""
echo "2. Verify secrets:"
echo "   gcloud secrets list --project=$SECRETS_PROJECT_ID --filter=\"labels.service=manadeck\""
echo ""
echo "3. Deploy manadeck-backend:"
echo "   git add ."
echo "   git commit -m \"feat: configure secrets\""
echo "   git push origin main"
echo ""
echo "4. View secret values (if needed):"
echo "   gcloud secrets versions access latest --secret=MANADECK_APP_ID --project=$SECRETS_PROJECT_ID"
echo ""
echo -e "${GREEN}✓${NC} Setup complete!"
echo ""

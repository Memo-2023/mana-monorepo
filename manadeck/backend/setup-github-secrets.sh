#!/bin/bash
# Script to generate values for GitHub Secrets
# Run this script and copy the outputs to GitHub repository secrets

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "GitHub Secrets Setup for Manadeck Backend"
echo "=========================================="
echo ""

PROJECT_ID="memo-2c4c4"
SA_NAME="manadeck-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account exists
echo "Checking if service account exists..."
if gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &> /dev/null; then
    echo -e "${GREEN}✓${NC} Service account exists: $SA_EMAIL"
else
    echo -e "${YELLOW}⚠${NC} Service account not found. Creating..."

    # Create service account
    gcloud iam service-accounts create $SA_NAME \
      --display-name="Manadeck Backend Service Account" \
      --project=$PROJECT_ID

    echo -e "${GREEN}✓${NC} Service account created"

    # Grant required roles
    echo "Granting required roles..."

    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/run.admin" \
      --condition=None

    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/iam.serviceAccountUser" \
      --condition=None

    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/artifactregistry.writer" \
      --condition=None

    echo -e "${GREEN}✓${NC} Roles granted"
fi

echo ""
echo "=========================================="
echo "GitHub Secret #1: CLOUD_RUN_SERVICE_ACCOUNT"
echo "=========================================="
echo ""
echo -e "${BLUE}Copy this value:${NC}"
echo ""
echo "$SA_EMAIL"
echo ""
echo "Add to GitHub: Settings → Secrets → Actions → New repository secret"
echo "Name: CLOUD_RUN_SERVICE_ACCOUNT"
echo "Value: $SA_EMAIL"
echo ""
read -p "Press Enter when you've added CLOUD_RUN_SERVICE_ACCOUNT to GitHub..."

echo ""
echo "=========================================="
echo "GitHub Secret #2: GCP_SA_KEY_PROD"
echo "=========================================="
echo ""

# Check if key file already exists
KEY_FILE="manadeck-sa-key.json"
if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠${NC} Key file already exists: $KEY_FILE"
    read -p "Do you want to create a new key? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key file..."
    else
        rm "$KEY_FILE"
        echo "Creating new service account key..."
        gcloud iam service-accounts keys create $KEY_FILE \
          --iam-account=$SA_EMAIL \
          --project=$PROJECT_ID
        echo -e "${GREEN}✓${NC} New key created"
    fi
else
    echo "Creating service account key..."
    gcloud iam service-accounts keys create $KEY_FILE \
      --iam-account=$SA_EMAIL \
      --project=$PROJECT_ID
    echo -e "${GREEN}✓${NC} Key created"
fi

echo ""
echo -e "${BLUE}Copy the ENTIRE JSON content below:${NC}"
echo ""
echo "=========================================="
cat $KEY_FILE
echo "=========================================="
echo ""
echo "Add to GitHub: Settings → Secrets → Actions → New repository secret"
echo "Name: GCP_SA_KEY_PROD"
echo "Value: [paste the entire JSON above]"
echo ""
read -p "Press Enter when you've added GCP_SA_KEY_PROD to GitHub..."

echo ""
echo "=========================================="
echo "GitHub Secret #3: GH_PERSONAL_TOKEN"
echo "=========================================="
echo ""
echo -e "${YELLOW}This token is needed to access private GitHub packages${NC}"
echo ""
echo "Steps to create:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Name: 'Manadeck CI/CD'"
echo "4. Select scope: 'repo' (Full control of private repositories)"
echo "5. Click 'Generate token'"
echo "6. Copy the token"
echo ""
echo "Add to GitHub: Settings → Secrets → Actions → New repository secret"
echo "Name: GH_PERSONAL_TOKEN"
echo "Value: [paste your GitHub token]"
echo ""
read -p "Press Enter when you've added GH_PERSONAL_TOKEN to GitHub..."

# Cleanup
echo ""
echo "=========================================="
echo "Cleanup"
echo "=========================================="
echo ""
echo -e "${YELLOW}⚠${NC} Security best practice: Delete the local key file"
echo "The key file contains sensitive credentials and should not be kept locally."
echo ""
read -p "Delete $KEY_FILE now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    rm -f $KEY_FILE
    echo -e "${GREEN}✓${NC} Key file deleted"
else
    echo -e "${YELLOW}⚠${NC} Key file kept: $KEY_FILE"
    echo "   Remember to delete it manually when done!"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Summary of GitHub Secrets:"
echo "1. ✓ CLOUD_RUN_SERVICE_ACCOUNT = $SA_EMAIL"
echo "2. ✓ GCP_SA_KEY_PROD = [JSON key from service account]"
echo "3. ✓ GH_PERSONAL_TOKEN = [Your GitHub Personal Access Token]"
echo ""
echo "Next steps:"
echo "1. Verify all 3 secrets are in GitHub: https://github.com/Memo-2023/manadeck/settings/secrets/actions"
echo "2. Run: ./create-secrets.sh (to set up GCP secrets)"
echo "3. Push to main branch to trigger deployment"
echo ""
echo "Documentation:"
echo "- DEPLOYMENT_CHECKLIST.md - Complete setup guide"
echo "- DEPLOY_MANUAL.md - Detailed deployment docs"
echo ""

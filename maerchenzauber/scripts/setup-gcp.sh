#!/bin/bash

# Google Cloud Setup Script for Storyteller Backend
# This script sets up the necessary GCP resources for deploying the backend to Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-""}
REGION=${REGION:-"europe-west3"}
SERVICE_ACCOUNT_NAME="storyteller-backend"
GITHUB_SA_NAME="github-actions"
ARTIFACT_REPO_NAME="storyteller"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if project ID is provided
if [ -z "$PROJECT_ID" ]; then
    print_error "Please provide a GCP project ID as the first argument"
    echo "Usage: ./setup-gcp.sh YOUR_PROJECT_ID"
    exit 1
fi

print_info "Setting up GCP resources for project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
print_info "Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com \
    sts.googleapis.com \
    aiplatform.googleapis.com

print_info "APIs enabled successfully"

# Create Artifact Registry repository
print_info "Creating Artifact Registry repository..."
if gcloud artifacts repositories describe $ARTIFACT_REPO_NAME --location=$REGION &>/dev/null; then
    print_warning "Artifact Registry repository already exists"
else
    gcloud artifacts repositories create $ARTIFACT_REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker images for Storyteller backend"
    print_info "Artifact Registry repository created"
fi

# Create service account for Cloud Run
print_info "Creating service account for Cloud Run..."
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    print_warning "Service account ${SERVICE_ACCOUNT_NAME} already exists"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Storyteller Backend Service Account"
    print_info "Service account created"
fi

# Grant necessary roles to the service account
print_info "Granting roles to service account..."
ROLES=(
    "roles/secretmanager.secretAccessor"
    "roles/aiplatform.user"
    "roles/logging.logWriter"
    "roles/monitoring.metricWriter"
    "roles/cloudtrace.agent"
)

for ROLE in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="$ROLE" \
        --quiet
done

print_info "Roles granted successfully"

# Create service account for GitHub Actions
print_info "Creating service account for GitHub Actions..."
if gcloud iam service-accounts describe ${GITHUB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    print_warning "Service account ${GITHUB_SA_NAME} already exists"
else
    gcloud iam service-accounts create $GITHUB_SA_NAME \
        --display-name="GitHub Actions Service Account"
    print_info "GitHub Actions service account created"
fi

# Grant necessary roles to GitHub Actions service account
print_info "Granting roles to GitHub Actions service account..."
GITHUB_ROLES=(
    "roles/run.developer"
    "roles/artifactregistry.writer"
    "roles/iam.serviceAccountUser"
)

for ROLE in "${GITHUB_ROLES[@]}"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${GITHUB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="$ROLE" \
        --quiet
done

# Allow GitHub Actions to act as the Cloud Run service account
gcloud iam service-accounts add-iam-policy-binding \
    ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
    --member="serviceAccount:${GITHUB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

print_info "GitHub Actions roles granted successfully"

# Create service account key for GitHub Actions
print_info "Creating service account key for GitHub Actions..."
KEY_FILE="github-actions-key.json"

# Check if key file already exists
if [ -f "$KEY_FILE" ]; then
    print_warning "Service account key file already exists. Skipping key creation."
    print_warning "If you need a new key, please delete $KEY_FILE first."
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=${GITHUB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
    print_info "Service account key created: $KEY_FILE"
fi

print_warning "IMPORTANT: Keep this service account key secure!"
print_warning "Add the contents of $KEY_FILE to GitHub Secrets as GCP_SA_KEY_PROD"
print_warning "Do not commit this file to version control!"

# Add the key file to .gitignore if it's not already there
if ! grep -q "$KEY_FILE" .gitignore 2>/dev/null; then
    echo "$KEY_FILE" >> .gitignore
    print_info "Added $KEY_FILE to .gitignore"
fi

# Note: Images are stored in Supabase Storage, not GCS
print_info "Note: This project uses Supabase Storage for images, not Google Cloud Storage"

# Output configuration for GitHub Secrets
print_info "Setup complete! Add these secrets to your GitHub repository:"
echo ""
echo "GitHub Secrets to add:"
echo "----------------------"
echo "GCP_PROJECT_ID=${PROJECT_ID}"
echo "GCP_SA_KEY_PROD=<contents of ${KEY_FILE}>"
echo "CLOUD_RUN_SERVICE_ACCOUNT=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo ""
echo "Next steps:"
echo "1. Copy the contents of ${KEY_FILE} and add it as GCP_SA_KEY_PROD secret in GitHub"
echo "2. Run ./scripts/create-secrets.sh to create secrets in Secret Manager"
echo "3. Add the above values to your GitHub repository secrets"
echo "4. Update your frontend environment variables with the Cloud Run URL after first deployment"
echo ""
print_warning "Remember: Never commit ${KEY_FILE} to version control!"
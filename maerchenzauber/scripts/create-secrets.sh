#!/bin/bash

# Script to create secrets in Google Secret Manager
# Run this after setup-gcp.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_prompt() {
    echo -e "${BLUE}[INPUT]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    print_error "No GCP project set. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

print_info "Creating secrets for project: $PROJECT_ID"
echo ""

# Function to create or update a secret
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    # Check if secret exists
    if gcloud secrets describe $SECRET_NAME &>/dev/null; then
        print_warning "Secret $SECRET_NAME already exists. Updating..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=-
    else
        print_info "Creating secret $SECRET_NAME..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=-
    fi
}

# Function to read secret value with optional default
read_secret_value() {
    local PROMPT=$1
    local DEFAULT=$2
    local SECRET_VALUE
    
    if [ -n "$DEFAULT" ]; then
        echo -e "${BLUE}[INPUT]${NC} $PROMPT (default: $DEFAULT): " >&2
        read -r SECRET_VALUE
        SECRET_VALUE=${SECRET_VALUE:-$DEFAULT}
    else
        echo -e "${BLUE}[INPUT]${NC} $PROMPT: " >&2
        read -r SECRET_VALUE
    fi
    
    echo "$SECRET_VALUE"
}

# Function to read secret value (hidden input)
read_secret_value_hidden() {
    local PROMPT=$1
    local SECRET_VALUE
    
    echo -e "${BLUE}[INPUT]${NC} $PROMPT (input will be hidden): " >&2
    read -rs SECRET_VALUE
    echo "" >&2
    echo "$SECRET_VALUE"
}

# Shared secrets
print_info "Configuring shared secrets..."
echo ""

MAERCHENZAUBER_GOOGLE_GENAI_API_KEY=$(read_secret_value_hidden "Enter Google GenAI API Key")
create_secret "MAERCHENZAUBER_GOOGLE_GENAI_API_KEY" "$MAERCHENZAUBER_GOOGLE_GENAI_API_KEY"

MAERCHENZAUBER_REPLICATE_API_KEY=$(read_secret_value_hidden "Enter Replicate API Token (optional)")
if [ -n "$MAERCHENZAUBER_REPLICATE_API_KEY" ]; then
    create_secret "MAERCHENZAUBER_REPLICATE_API_KEY" "$MAERCHENZAUBER_REPLICATE_API_KEY"
fi

MAERCHENZAUBER_AZURE_OPENAI_KEY=$(read_secret_value_hidden "Enter Azure OpenAI Key")
create_secret "MAERCHENZAUBER_AZURE_OPENAI_KEY" "$MAERCHENZAUBER_AZURE_OPENAI_KEY"

MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT=$(read_secret_value "Enter Azure OpenAI Endpoint" "https://storyteller-openai-swedencentral.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview")
create_secret "MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT" "$MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT"

SENTRY_DSN=$(read_secret_value "Enter Sentry DSN for backend (optional)")
if [ -n "$SENTRY_DSN" ]; then
    create_secret "MAERCHENZAUBER_SENTRY_DSN_BACKEND" "$SENTRY_DSN"
fi

# Production secrets
echo ""
print_info "Configuring PRODUCTION secrets..."
DEFAULT_MANA_URL="https://mana-core-middleware-111768794939.europe-west3.run.app"
DEFAULT_APP_ID="8d2f5ddb-e251-4b3b-8802-84022a7ac77f"

echo ""

# Mana Service Configuration
MANA_SERVICE_URL=$(read_secret_value "Enter Mana Service URL" "$DEFAULT_MANA_URL")
create_secret "MANA_SERVICE_URL" "$MANA_SERVICE_URL"

APP_ID=$(read_secret_value "Enter App ID" "$DEFAULT_APP_ID")
create_secret "APP_ID" "$APP_ID"

# Supabase Configuration
echo ""
print_info "Supabase configuration:"
SUPABASE_URL=$(read_secret_value "Enter Supabase URL")
create_secret "MAERCHENZAUBER_SUPABASE_URL" "$SUPABASE_URL"

SUPABASE_ANON_KEY=$(read_secret_value_hidden "Enter Supabase Anon Key")
create_secret "MAERCHENZAUBER_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

JWT_SECRET=$(read_secret_value_hidden "Enter JWT Secret")
create_secret "MAERCHENZAUBER_JWT_SECRET" "$JWT_SECRET"

# Frontend URL for CORS
echo ""
print_info "Configuring frontend URL for CORS..."

FRONTEND_URL=$(read_secret_value "Enter frontend URL" "https://your-app.com")
echo "FRONTEND_URL=$FRONTEND_URL" >> github-secrets.txt

echo ""
print_info "All secrets created successfully!"
echo ""
print_info "Additional GitHub secrets saved to github-secrets.txt"
print_info "Add these to your GitHub repository secrets along with the values from setup-gcp.sh"
echo ""
print_info "To verify secrets, run:"
echo "gcloud secrets list"
#!/bin/bash

# Load environment variables from .env.deploy and deploy to Google Cloud Run

# Extract environment variables from .env.deploy (ignoring quotes and comments)
ENV_VARS=""
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key:value pairs, removing quotes and extra spaces
    if [[ "$line" =~ ^[[:space:]]*([^:]+):[[:space:]]*\"?([^\"]*)\"?[[:space:]]*$ ]]; then
        key="${BASH_REMATCH[1]// /}"
        value="${BASH_REMATCH[2]}"
        
        # Add to ENV_VARS string
        if [[ -n "$ENV_VARS" ]]; then
            ENV_VARS="$ENV_VARS,$key=$value"
        else
            ENV_VARS="$key=$value"
        fi
    fi
done < .env.deploy

# Add PORT if not present
if [[ ! "$ENV_VARS" =~ PORT= ]]; then
    ENV_VARS="$ENV_VARS"
fi

echo "Deploying with environment variables..."
echo "ENV_VARS: $ENV_VARS"

# Deploy to Google Cloud Run
gcloud run deploy audio-microservice \
  --source . \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --port 1337 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --set-env-vars "$ENV_VARS"
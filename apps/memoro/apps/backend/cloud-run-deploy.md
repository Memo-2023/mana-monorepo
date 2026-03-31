# Memoro Microservice Cloud Run Deployment Guide

## 1. Set up environment secrets

```bash
# Step 1: Authenticate with Google Cloud if needed
gcloud auth login

# Step 2: Set your project ID
gcloud config set project memo-2c4c4

# Step 3: Create or update GCP Secret Manager secrets for Memoro service
# If you're using existing secrets from the main service, you can reference those
# Otherwise, create new secrets for Memoro-specific configuration
gcloud secrets create MEMORO_SUPABASE_URL --data-file=/path/to/secret/value.txt
gcloud secrets create MEMORO_SUPABASE_ANON_KEY --data-file=/path/to/secret/value.txt
gcloud secrets create MANA_SERVICE_URL --data-file=/path/to/secret/value.txt
gcloud secrets create MEMORO_APP_ID --data-file=/path/to/secret/value.txt
```

## 2. Build and push Docker image

```bash
# Navigate to the Memoro service directory
cd memoro-service

gcloud builds submit --project=memo-2c4c4 --config=cloudbuild-memoro.yaml .

## 3. Deploy to Cloud Run

```bash
gcloud run deploy memoro-service \
  --image europe-west3-docker.pkg.dev/mana-core-453821/memoro-service/memoro-service:v1.0.0 \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-secrets=MEMORO_SUPABASE_URL=MEMORO_SUPABASE_URL:latest,MEMORO_SUPABASE_ANON_KEY=MEMORO_SUPABASE_ANON_KEY:latest,MANA_SERVICE_URL=MANA_SERVICE_URL:latest,MEMORO_APP_ID=MEMORO_APP_ID:latest
```
gcloud run deploy memoro-service \
  --source . \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-secrets=MEMORO_SUPABASE_URL=MEMORO_SUPABASE_URL:latest,MEMORO_SUPABASE_ANON_KEY=MEMORO_SUPABASE_ANON_KEY:latest,MANA_SERVICE_URL=MANA_SERVICE_URL:latest,MEMORO_APP_ID=MEMORO_APP_ID:latest


## 4. Update Main Middleware Environment Variables

After deploying the Memoro microservice, you need to update the main middleware service's environment to point to the new Memoro service URL.

```bash
# Get the Memoro service URL
MEMORO_SERVICE_URL=$(gcloud run services describe memoro-service --platform managed --region europe-west3 --format 'value(status.url)')

# Update the main middleware's MEMORO_SERVICE_URL environment variable
gcloud run services update mana-core-middleware-dev \
  --region europe-west3 \
  --platform managed \
  --set-env-vars=MEMORO_SERVICE_URL=$MEMORO_SERVICE_URL
```

## 5. Testing the deployment

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe memoro-service --platform managed --region europe-west3 --format 'value(status.url)')

# Test the API (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" $SERVICE_URL/memoro/spaces
```

## 6. Monitoring and Logging

After deployment, you can monitor your service through:

- **Cloud Run Dashboard**: For service health, traffic, and resource usage
- **Cloud Logging**: For application logs
- **Cloud Monitoring**: For setting up alerts and dashboards

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=memoro-service" --limit 10
```

## 7. Troubleshooting

If you encounter issues with your deployment:

1. Check application logs in Cloud Logging
2. Verify that all environment secrets are correctly set
3. Ensure that your service has sufficient memory and CPU
4. Check that the service account has the necessary permissions
5. Verify that the service can communicate with Auth and Spaces services
6. Check for CORS issues if calling from frontend applications

## 8. Continuous Deployment (optional)

You can set up continuous deployment using Cloud Build:

```bash
# Create a Cloud Build trigger
gcloud builds triggers create github \
  --repo-name=your-repo-name \
  --branch-pattern=main \
  --build-config=cloudbuild.yaml
```

Example `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'europe-west3-docker.pkg.dev/mana-core-453821/memoro-service/memoro-service:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'europe-west3-docker.pkg.dev/mana-core-453821/memoro-service/memoro-service:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'memoro-service'
      - '--image'
      - 'europe-west3-docker.pkg.dev/mana-core-453821/memoro-service/memoro-service:$COMMIT_SHA'
      - '--region'
      - 'europe-west3'
      - '--platform'
      - 'managed'
images:
  - 'europe-west3-docker.pkg.dev/mana-core-453821/memoro-service/memoro-service:$COMMIT_SHA'
```
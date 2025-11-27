# Manadeck Backend Deployment Manual

## Overview

This guide covers deploying the Manadeck backend service to Google Cloud Run. The service can be deployed either:

- **Automatically** via GitHub Actions (recommended)
- **Manually** via Cloud Build and gcloud CLI

## Prerequisites

1. **Google Cloud SDK** installed and authenticated:

   ```bash
   gcloud auth login
   gcloud config set project memo-2c4c4
   ```

2. **Docker** installed (for local testing)

3. **Access to `memo-2c4c4` project** with:
   - Cloud Build API enabled
   - Cloud Run API enabled
   - Artifact Registry API enabled
   - Secret Manager API enabled

4. **Required permissions**:
   - Cloud Run Admin
   - Service Account User
   - Artifact Registry Writer
   - Secret Manager Secret Accessor

## Initial Setup (One-Time)

### 1. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create manadeck-backend \
  --repository-format=docker \
  --location=europe-west3 \
  --project=memo-2c4c4 \
  --description="Docker images for Manadeck Backend"
```

### 2. Create Service Account

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create manadeck-backend-sa \
  --display-name="Manadeck Backend Service Account" \
  --project=memo-2c4c4

# Get service account email
SA_EMAIL="manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"
```

### 3. Create Secrets in Secret Manager

**IMPORTANT**: All secrets are stored in the `mana-core-453821` project (not `memo-2c4c4`).

```bash
# Verify MANA_SERVICE_URL exists (global secret)
gcloud secrets describe MANA_SERVICE_URL --project=mana-core-453821

# Create Manadeck-specific secrets in mana-core-453821
echo "your-app-id" | gcloud secrets create MANADECK_APP_ID --data-file=- --project=mana-core-453821
echo "your-service-key" | gcloud secrets create MANADECK_SERVICE_KEY --data-file=- --project=mana-core-453821
echo "https://your-project.supabase.co" | gcloud secrets create MANADECK_SUPABASE_URL --data-file=- --project=mana-core-453821
echo "your-supabase-anon-key" | gcloud secrets create MANADECK_SUPABASE_ANON_KEY --data-file=- --project=mana-core-453821
echo "your-supabase-service-key" | gcloud secrets create MANADECK_SUPABASE_SERVICE_KEY --data-file=- --project=mana-core-453821
echo "https://yourapp.com/welcome" | gcloud secrets create MANADECK_SIGNUP_REDIRECT_URL --data-file=- --project=mana-core-453821

# Grant service account (from memo-2c4c4) access to ALL secrets in mana-core-453821
for SECRET in MANA_SERVICE_URL MANADECK_APP_ID MANADECK_SERVICE_KEY MANADECK_SUPABASE_URL MANADECK_SUPABASE_ANON_KEY MANADECK_SUPABASE_SERVICE_KEY MANADECK_SIGNUP_REDIRECT_URL; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=mana-core-453821
done
```

**Why mana-core-453821?** All Mana-related secrets are centralized in this project for easier management across multiple services.

### 4. Setup GitHub Secrets (for Automated Deployment)

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

- **GCP_SA_KEY_PROD**: Create and download a service account key:

  ```bash
  gcloud iam service-accounts keys create key.json \
    --iam-account=manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com \
    --project=memo-2c4c4

  # Copy contents of key.json to GitHub secret
  cat key.json
  ```

- **CLOUD_RUN_SERVICE_ACCOUNT**: Set to `manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com`

## Automatic Deployment (GitHub Actions)

### Trigger Deployment

The GitHub Actions workflow automatically deploys when:

- Code is pushed to `main` branch
- Changes are made to `manadeck/backend/**` directory
- Workflow file is modified

**Manual trigger:**

1. Go to GitHub → Actions tab
2. Select "Deploy Manadeck Backend to Cloud Run"
3. Click "Run workflow"
4. Choose environment and click "Run workflow"

### Workflow Steps

1. ✅ **Test & Build Verification**
   - Runs linter
   - Type checks and builds
   - Runs tests

2. ✅ **Build & Deploy**
   - Builds Docker image
   - Pushes to Artifact Registry
   - Deploys to Cloud Run
   - Runs health checks

3. ✅ **Rollback** (if deployment fails)
   - Automatically rolls back to previous revision
   - Verifies rollback health

### Monitoring Deployment

- View progress in GitHub Actions tab
- Check deployment summary in workflow run
- View logs in Cloud Logging:
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
    --project=memo-2c4c4 \
    --limit=50
  ```

## Manual Deployment

### Option 1: Cloud Build (Build Only)

```bash
# Navigate to backend directory
cd manadeck/backend

# Submit build
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml .
```

This builds and pushes the Docker image to Artifact Registry but does NOT deploy to Cloud Run.

### Option 2: Full Manual Deployment

```bash
# 1. Navigate to backend directory
cd manadeck/backend

# 2. Update version in cloudbuild.yaml
# Edit line 12 and 26: change v1.0.0 to v1.0.1 (or next version)

# 3. Build and push image
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml .

# 4. Deploy to Cloud Run
gcloud run deploy manadeck-backend \
  --image=europe-west3-docker.pkg.dev/memo-2c4c4/manadeck-backend/manadeck-backend:v1.0.0 \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --port=8080 \
  --service-account=manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production" \
  --update-secrets="MANA_SERVICE_URL=projects/mana-core-453821/secrets/MANA_SERVICE_URL:latest,APP_ID=projects/mana-core-453821/secrets/MANADECK_APP_ID:latest,SERVICE_KEY=projects/mana-core-453821/secrets/MANADECK_SERVICE_KEY:latest,SUPABASE_URL=projects/mana-core-453821/secrets/MANADECK_SUPABASE_URL:latest,SUPABASE_ANON_KEY=projects/mana-core-453821/secrets/MANADECK_SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=projects/mana-core-453821/secrets/MANADECK_SUPABASE_SERVICE_KEY:latest,SIGNUP_REDIRECT_URL=projects/mana-core-453821/secrets/MANADECK_SIGNUP_REDIRECT_URL:latest"
```

## Testing Deployment

### Get Service URL

```bash
SERVICE_URL=$(gcloud run services describe manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
```

### Test Health Endpoints

```bash
# Basic health check
curl $SERVICE_URL/health

# Liveness check
curl $SERVICE_URL/health/live

# Readiness check
curl $SERVICE_URL/health/ready
```

### Test Authenticated Endpoints

```bash
# Example: Test with JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  $SERVICE_URL/api/your-endpoint
```

## Version Management

### Updating Version

To deploy a new version:

1. **Edit `cloudbuild.yaml`**:

   ```yaml
   # Change v1.0.0 to v1.1.0
   - 'europe-west3-docker.pkg.dev/memo-2c4c4/manadeck-backend/manadeck-backend:v1.1.0'
   ```

2. **Build and deploy**:

   ```bash
   gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml .

   gcloud run deploy manadeck-backend \
     --image=europe-west3-docker.pkg.dev/memo-2c4c4/manadeck-backend/manadeck-backend:v1.1.0 \
     --project=memo-2c4c4 \
     --region=europe-west3
   ```

### List Deployed Revisions

```bash
gcloud run revisions list \
  --service=manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3
```

## Rollback

### Manual Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list \
  --service=manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3

# Rollback to specific revision
gcloud run services update-traffic manadeck-backend \
  --to-revisions=manadeck-backend-00001-abc=100 \
  --project=memo-2c4c4 \
  --region=europe-west3
```

## Troubleshooting

### Build Fails

**Authentication errors:**

```bash
gcloud auth login
gcloud auth configure-docker europe-west3-docker.pkg.dev
```

**Permission denied:**

- Verify you have Cloud Build Editor role
- Check service account has Artifact Registry Writer role

### Deployment Fails

**Secret not found:**

```bash
# List secrets
gcloud secrets list --project=memo-2c4c4

# Create missing secret
echo "value" | gcloud secrets create SECRET_NAME --data-file=- --project=memo-2c4c4
```

**Service account permissions:**

```bash
# Check service account IAM policy
gcloud projects get-iam-policy memo-2c4c4 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com"
```

### Health Check Fails

**Check logs:**

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4 \
  --limit=50 \
  --format=json
```

**Common issues:**

- Port mismatch (must be 8080)
- Missing environment variables
- Database connection issues
- Mana Core service unreachable

**Test locally:**

```bash
cd manadeck/backend

# Build Docker image
docker build -t manadeck-backend:local .

# Run container
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e MANA_SERVICE_URL=your-mana-url \
  -e APP_ID=your-app-id \
  manadeck-backend:local

# Test health
curl http://localhost:8080/health
```

### Update Environment Variables

```bash
# Update a Manadeck-specific secret
echo "new-value" | gcloud secrets versions add MANADECK_APP_ID --data-file=- --project=memo-2c4c4

# Redeploy to pick up new secret version
gcloud run services update manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3

# Note: MANA_SERVICE_URL is a global secret - updating it affects all services
```

### View Service Configuration

```bash
gcloud run services describe manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format=yaml
```

## Monitoring and Logs

### View Logs

```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4 \
  --limit=50

# Tail logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4

# Filter error logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend AND severity>=ERROR" \
  --project=memo-2c4c4 \
  --limit=20
```

### Cloud Console Links

- **Service**: https://console.cloud.google.com/run/detail/europe-west3/manadeck-backend/metrics?project=memo-2c4c4
- **Logs**: https://console.cloud.google.com/logs/query?project=memo-2c4c4
- **Artifact Registry**: https://console.cloud.google.com/artifacts/docker/memo-2c4c4/europe-west3/manadeck-backend?project=memo-2c4c4

## Configuration Reference

### Environment Variables (via Secrets)

| Secret Name                   | Description                | Example                         | Note          |
| ----------------------------- | -------------------------- | ------------------------------- | ------------- |
| MANA_SERVICE_URL              | Mana Core service URL      | https://mana-core.example.com   | Global secret |
| MANADECK_APP_ID               | Application ID from Mana   | app-12345                       |               |
| MANADECK_SERVICE_KEY          | Service authentication key | sk*live*...                     |               |
| MANADECK_SUPABASE_URL         | Supabase project URL       | https://abc.supabase.co         |               |
| MANADECK_SUPABASE_ANON_KEY    | Supabase anonymous key     | eyJhb...                        |               |
| MANADECK_SUPABASE_SERVICE_KEY | Supabase service role key  | eyJhb...                        |               |
| MANADECK_SIGNUP_REDIRECT_URL  | Post-signup redirect URL   | https://app.example.com/welcome |               |

### Cloud Run Configuration

- **Project**: memo-2c4c4
- **Region**: europe-west3
- **Service Name**: manadeck-backend
- **Port**: 8080
- **Memory**: 512Mi
- **CPU**: 1
- **Timeout**: 300s
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Concurrency**: 80

### Docker Image

- **Registry**: europe-west3-docker.pkg.dev
- **Repository**: manadeck-backend
- **Image**: europe-west3-docker.pkg.dev/memo-2c4c4/manadeck-backend/manadeck-backend
- **Tags**: v1.0.0, latest

## Quick Reference Commands

```bash
# Build only
cd manadeck/backend
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml .

# Deploy latest version
gcloud run deploy manadeck-backend \
  --image=europe-west3-docker.pkg.dev/memo-2c4c4/manadeck-backend/manadeck-backend:latest \
  --project=memo-2c4c4 \
  --region=europe-west3

# Get service URL
gcloud run services describe manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format='value(status.url)'

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4 \
  --limit=20

# List revisions
gcloud run revisions list \
  --service=manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3

# Update secret (example with Manadeck-specific secret)
echo "new-value" | gcloud secrets versions add MANADECK_APP_ID \
  --data-file=- \
  --project=memo-2c4c4

# For global secrets like MANA_SERVICE_URL, update carefully as it affects all services
echo "new-value" | gcloud secrets versions add MANA_SERVICE_URL \
  --data-file=- \
  --project=memo-2c4c4
```

## Support

For issues or questions:

1. Check Cloud Run logs for error messages
2. Verify all secrets are configured correctly
3. Test health endpoints
4. Review GitHub Actions workflow logs (for automated deployments)
5. Consult the troubleshooting section above

---

**Last Updated**: 2025-09-30
**Current Version**: v1.0.0
**Deployment Region**: europe-west3
**Project**: memo-2c4c4

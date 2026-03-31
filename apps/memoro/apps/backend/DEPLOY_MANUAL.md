# Memoro Service Deployment Manual

## Prerequisites

1. **Google Cloud SDK** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project memo-2c4c4
   ```

2. **Docker** installed (for local testing)

3. **Access to** `memo-2c4c4` project with Cloud Build and Cloud Run permissions

## Step-by-Step Deployment Process

### Step 1: Prepare for Deployment

Navigate to the memoro-service directory:
```bash
cd memoro-service
```

Check current version in `cloudbuild-memoro.yaml`:
```bash
cat cloudbuild-memoro.yaml
```

### Step 2: Update Version (Optional)

If you want to increment the version, update the tag in `cloudbuild-memoro.yaml`:
```yaml
# Change v4.0.0 to v4.1.0 (or next version)
args: ['build', '-t', 'europe-west3-docker.pkg.dev/memo-2c4c4/memoro-service/memoro-service:v4.4.4', '.']
```

### Step 3: Build and Push Docker Image

Run the Cloud Build process:
```bash
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild-memoro.yaml .
```

**Expected output:**
- ✅ Source uploaded to Cloud Storage
- ✅ Docker build steps execute
- ✅ Image pushed to Artifact Registry
- ✅ Build completes with "SUCCESS" status

### Step 4: Deploy to Cloud Run

Use the image version from the build output:
```bash
gcloud run deploy memoro-service \
  --project=memo-2c4c4 \
  --image europe-west3-docker.pkg.dev/memo-2c4c4/memoro-service/memoro-service:v4.9.6 \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --memory 1Gi
```

**Deployment will prompt:**
- Service configuration questions (usually accept defaults)
- Traffic allocation (usually 100% to new revision)

### Step 5: Verify Deployment

1. **Get service URL:**
   ```bash
   SERVICE_URL=$(gcloud run services describe memoro-service --platform managed --region europe-west3 --format 'value(status.url)')
   echo "Service URL: $SERVICE_URL"
   ```

2. **Test health endpoint:**
   ```bash
   curl $SERVICE_URL/health
   ```

3. **Test with authentication (optional):**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" $SERVICE_URL/memoro/spaces
   ```

## Environment Variables & Secrets

The deployment preserves existing environment variables and secrets. Current secrets include:

- `MEMORO_SUPABASE_URL`
- `MEMORO_SUPABASE_ANON_KEY` 
- `MEMORO_SUPABASE_SERVICE_KEY`
- `MANA_SERVICE_URL`
- `BATCH_TRANSCRIPTION_SERVICE_URL`
- `MEMORO_APP_ID`

To update environment variables:
```bash
gcloud run services update memoro-service \
  --region europe-west3 \
  --set-env-vars="NEW_VAR=value"
```

## Troubleshooting

### Build Issues

1. **Authentication errors:**
   ```bash
   gcloud auth login
   gcloud auth configure-docker europe-west3-docker.pkg.dev
   ```

2. **Project access issues:**
   ```bash
   gcloud config set project memo-2c4c4
   gcloud projects get-iam-policy memo-2c4c4
   ```

### Deployment Issues

1. **Check service logs:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=memoro-service" --limit 10
   ```

2. **Check service status:**
   ```bash
   gcloud run services describe memoro-service --region europe-west3
   ```

3. **Memory issues (increase if needed):**
   ```bash
   gcloud run services update memoro-service \
     --region europe-west3 \
     --memory 1Gi
   ```

### Runtime Issues

1. **Test specific endpoints:**
   ```bash
   # Health check
   curl $SERVICE_URL/health
   
   # Batch upload (requires valid JWT and audio file)
   curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -F "file=@test-audio.mp3" \
     $SERVICE_URL/memoro/upload-audio
   ```

2. **Check environment variables:**
   ```bash
   gcloud run services describe memoro-service \
     --region europe-west3 \
     --format="export" | grep env
   ```

## Quick Reference Commands

```bash
# Build only
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild-memoro.yaml .

# Deploy latest version
gcloud run deploy memoro-service \
  --image europe-west3-docker.pkg.dev/memo-2c4c4/memoro-service/memoro-service:v4.4.0 \
  --region europe-west3

# Get service URL
gcloud run services describe memoro-service --region europe-west3 --format 'value(status.url)'

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=memoro-service" --limit 10

# Update environment variable
gcloud run services update memoro-service --region europe-west3 --set-env-vars="VAR=value"
```

## File Structure Reference

```
memoro-service/
├── cloudbuild-memoro.yaml     # Build configuration
├── Dockerfile                 # Container definition
├── package.json              # Dependencies
├── src/                      # Source code
│   ├── memoro/
│   │   ├── memoro.controller.ts  # Updated with batch jobId storage
│   │   └── memoro.service.ts     # Updated with batch logic
│   └── ...
└── DEPLOY_MANUAL.md          # This file
```

## Recent Updates

**v4.0.0 includes:**
- ✅ Fixed batch upload jobId storage in memo metadata
- ✅ Updated duration threshold to 1h55m for batch processing
- ✅ Added `updateMemoWithJobId` method for webhook callback support
- ✅ Improved error handling for batch transcription flow

---

**Last Updated:** $(date)  
**Current Version:** v4.0.0  
**Deployment Region:** europe-west3  
**Project:** memo-2c4c4
# Cards Backend Deployment Checklist

This checklist ensures you have everything configured for automated deployment.

## ✅ Prerequisites

### 1. GitHub Secrets (Required)

Go to `https://github.com/Memo-2023/cards` → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name                 | Description                                       | How to Get                                            |
| --------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `GCP_SA_KEY_PROD`           | Service account JSON key for Cloud Run deployment | See "Create Service Account" below                    |
| `CLOUD_RUN_SERVICE_ACCOUNT` | Service account email                             | `cards-backend-sa@memo-2c4c4.iam.gserviceaccount.com` |
| `GH_PERSONAL_TOKEN`         | GitHub Personal Access Token for private packages | See "Create GitHub PAT" below                         |

#### Create Service Account

```bash
# 1. Create service account
gcloud iam service-accounts create cards-backend-sa \
  --display-name="Cards Backend Service Account" \
  --project=memo-2c4c4

# 2. Grant permissions
SA_EMAIL="cards-backend-sa@memo-2c4c4.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding memo-2c4c4 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# 3. Create and download key
gcloud iam service-accounts keys create cards-sa-key.json \
  --iam-account=${SA_EMAIL} \
  --project=memo-2c4c4

# 4. Copy contents of cards-sa-key.json to GCP_SA_KEY_PROD secret
cat cards-sa-key.json

# 5. Delete local key file (security best practice)
rm cards-sa-key.json
```

#### Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Cards CI/CD`
4. Expiration: Choose appropriate timeframe
5. Scopes: Select `repo` (Full control of private repositories)
6. Click "Generate token"
7. Copy token and add to `GH_PERSONAL_TOKEN` secret

### 2. GCP Artifact Registry

```bash
# Create repository for Docker images
gcloud artifacts repositories create cards-backend \
  --repository-format=docker \
  --location=europe-west3 \
  --project=memo-2c4c4 \
  --description="Docker images for Cards Backend"
```

### 3. GCP Secrets (Required)

Run the interactive script:

```bash
cd backend
./create-secrets.sh
```

Or create manually:

```bash
# All secrets go to mana-core-453821 project
PROJECT_ID="mana-core-453821"

# Generate service key
SERVICE_KEY=$(openssl rand -base64 32)

# Create secrets
echo "your-app-id" | gcloud secrets create CARDS_APP_ID --data-file=- --project=$PROJECT_ID
echo "$SERVICE_KEY" | gcloud secrets create CARDS_SERVICE_KEY --data-file=- --project=$PROJECT_ID
echo "https://xxx.supabase.co" | gcloud secrets create CARDS_SUPABASE_URL --data-file=- --project=$PROJECT_ID
echo "your-anon-key" | gcloud secrets create CARDS_SUPABASE_ANON_KEY --data-file=- --project=$PROJECT_ID
echo "your-service-key" | gcloud secrets create CARDS_SUPABASE_SERVICE_KEY --data-file=- --project=$PROJECT_ID
echo "https://app.com/welcome" | gcloud secrets create CARDS_SIGNUP_REDIRECT_URL --data-file=- --project=$PROJECT_ID

# Grant access to service account
SA_EMAIL="cards-backend-sa@memo-2c4c4.iam.gserviceaccount.com"

for SECRET in MANA_SERVICE_URL CARDS_APP_ID CARDS_SERVICE_KEY CARDS_SUPABASE_URL CARDS_SUPABASE_ANON_KEY CARDS_SUPABASE_SERVICE_KEY CARDS_SIGNUP_REDIRECT_URL; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID
done
```

**IMPORTANT**: Add the generated `SERVICE_KEY` to mana-core-middleware's `APP_SERVICE_KEYS`:

```
APP_SERVICE_KEYS=existing-apps,YOUR_APP_ID:YOUR_SERVICE_KEY
```

## 🚀 Deployment Process

### Automatic Deployment (GitHub Actions)

1. Push to `main` branch:

   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. GitHub Actions will automatically:
   - ✅ Run tests and linting
   - ✅ Build Docker image
   - ✅ Push to Artifact Registry
   - ✅ Deploy to Cloud Run
   - ✅ Run health checks
   - ✅ Rollback on failure

3. Monitor deployment:
   - Go to https://github.com/Memo-2023/cards/actions
   - View workflow run progress

### Manual Deployment (Cloud Build)

```bash
cd backend

# Update version in cloudbuild.yaml (e.g., v1.0.0 → v1.0.1)

# Build and push
gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml .

# Deploy
gcloud run deploy cards-backend \
  --image=europe-west3-docker.pkg.dev/memo-2c4c4/cards-backend/cards-backend:v1.0.1 \
  --project=memo-2c4c4 \
  --region=europe-west3
```

## 🔍 Verification

### Check Deployment Status

```bash
# Get service URL
gcloud run services describe cards-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format='value(status.url)'

# Test health endpoint
curl https://cards-backend-xxx.run.app/health

# Test liveness
curl https://cards-backend-xxx.run.app/health/live
```

### View Logs

```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cards-backend" \
  --project=memo-2c4c4 \
  --limit=50

# Error logs only
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cards-backend AND severity>=ERROR" \
  --project=memo-2c4c4 \
  --limit=20
```

## 🔧 Troubleshooting

### GitHub Actions Fails with "npm ci" Error

**Problem**: Private package `@mana-core/nestjs-integration` can't be installed

**Solution**: Verify `GH_PERSONAL_TOKEN` secret is set with `repo` scope

### Deployment Fails with "Permission Denied" on Secrets

**Problem**: Service account can't access secrets in `mana-core-453821`

**Solution**: Grant cross-project secret access:

```bash
SA_EMAIL="cards-backend-sa@memo-2c4c4.iam.gserviceaccount.com"

gcloud secrets add-iam-policy-binding CARDS_APP_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=mana-core-453821
```

### Health Check Fails After Deployment

**Problem**: Service starts but health endpoint returns 500

**Possible causes**:

1. Missing environment variables/secrets
2. Can't connect to Supabase
3. Can't connect to Mana Core

**Debug**:

```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cards-backend" \
  --project=memo-2c4c4 \
  --limit=20

# Check secret values (if you have permissions)
gcloud secrets versions access latest --secret=CARDS_APP_ID --project=mana-core-453821
```

### Peer Dependency Warning

**Problem**: `@mana-core/nestjs-integration` has peer dependency on `@nestjs/common@^10.0.0` but project uses `^11.0.0`

**Solution**: Already handled with `--legacy-peer-deps` flag in workflow. If you see this locally:

```bash
npm install --legacy-peer-deps
```

## 📊 Project Structure

```
cards/
├── .github/
│   └── workflows/
│       └── deploy-backend.yml        # GitHub Actions workflow
├── backend/
│   ├── src/                          # Source code
│   ├── Dockerfile                    # Container definition
│   ├── cloudbuild.yaml              # Manual deployment config
│   ├── create-secrets.sh            # Interactive secrets setup
│   ├── verify-build.sh              # Local build verification
│   ├── DEPLOY_MANUAL.md             # Detailed deployment docs
│   └── package.json
├── apps/
│   ├── mobile/
│   ├── web/
│   └── landing/
└── DEPLOYMENT_CHECKLIST.md          # This file
```

## 📝 Configuration Summary

| Component              | Location          | Value                                                  |
| ---------------------- | ----------------- | ------------------------------------------------------ |
| **Deployment Project** | GCP               | `memo-2c4c4`                                           |
| **Secrets Project**    | GCP               | `mana-core-453821`                                     |
| **Region**             | GCP               | `europe-west3`                                         |
| **Service Name**       | Cloud Run         | `cards-backend`                                        |
| **Image Registry**     | Artifact Registry | `europe-west3-docker.pkg.dev/memo-2c4c4/cards-backend` |
| **Port**               | Container         | `8080`                                                 |
| **Repository**         | GitHub            | `Memo-2023/cards`                                      |

## 🎯 Quick Start

**First-time setup**:

```bash
# 1. Create GCP resources
./backend/create-secrets.sh

# 2. Add GitHub secrets (see "GitHub Secrets" section)

# 3. Push to trigger deployment
git push origin main
```

**After setup**:

```bash
# Just push to deploy
git add .
git commit -m "feat: your changes"
git push origin main
```

---

**Last Updated**: 2025-09-30
**Maintainer**: Development Team

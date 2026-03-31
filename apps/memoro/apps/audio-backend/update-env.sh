#!/bin/bash

# Update audio-microservice environment variables with correct Supabase credentials
echo "🔧 Updating audio-microservice environment variables..."

gcloud run services update audio-microservice \
  --region=europe-west3 \
  --set-env-vars=MEMORO_SUPABASE_URL=https://npgifbrwhftlbrbaglmi.supabase.co,MEMORO_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZ2lmYnJ3aGZ0bGJyYmFnbG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMxODA4MTcsImV4cCI6MjAyODc1NjgxN30.xfBwgNLkgwW0aJkUCIQM9FBwbqWE8K7ynI-zUY0oOr8,MEMORO_SERVICE_URL=https://memoro-service-111768794939.europe-west3.run.app

echo "✅ Environment variables updated!"
echo "🚀 Audio microservice should now be able to access Supabase Storage"
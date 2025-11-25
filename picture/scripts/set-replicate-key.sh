#!/bin/bash

# Script to set Replicate API Key in Supabase Edge Functions

echo "Setting Replicate API Key for Supabase Edge Functions..."
echo ""
echo "Please enter your Replicate API Key (starts with r8_):"
read -s REPLICATE_KEY
echo ""

if [[ ! $REPLICATE_KEY == r8_* ]]; then
    echo "Error: API Key should start with 'r8_'"
    exit 1
fi

echo "Setting the key in Supabase..."

# Set using Supabase CLI
npx supabase secrets set REPLICATE_API_KEY=$REPLICATE_KEY --project-ref mjuvnnjxwfwlmxjsgkqu

echo ""
echo "Waiting for secrets to sync (20 seconds)..."
sleep 20

echo ""
echo "Done! The key has been set. Please test the image generation now."
echo ""
echo "To verify, you can check in Supabase Dashboard:"
echo "1. Go to Edge Functions → Secrets"
echo "2. You should see REPLICATE_API_KEY listed there"
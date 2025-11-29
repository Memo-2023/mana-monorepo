#!/bin/bash

# This script runs before the EAS build process starts
# It copies the appropriate .env file based on the build profile

ENV_FILE_TO_USE="${EXPO_PUBLIC_USE_ENV_FILE:-.env}"
echo "Using environment file: $ENV_FILE_TO_USE"

if [ -f "$ENV_FILE_TO_USE" ]; then
  echo "Copying $ENV_FILE_TO_USE to .env"
  cp "$ENV_FILE_TO_USE" .env
else
  echo "Warning: $ENV_FILE_TO_USE not found!"
fi

# Display the environment variables that will be used (without values for security)
echo "Environment variables that will be used (names only):"
grep -v '^#' .env | cut -d '=' -f1 | grep -v '^$'

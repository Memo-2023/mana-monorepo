#!/bin/bash

# EAS Build Pre-Install Hook
# This script configures npm to use GitHub token for private packages

if [ -n "$GITHUB_TOKEN" ]; then
  echo "Configuring npm for private GitHub packages..."
  echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
  echo "@mana-core:registry=https://npm.pkg.github.com/" >> ~/.npmrc
  
  # Alternative: Use HTTPS URL with token
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "git@github.com:"
  git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
  
  echo "npm configuration complete"
else
  echo "Warning: GITHUB_TOKEN not set, private packages may fail to install"
fi
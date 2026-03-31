#!/bin/bash
# Script to verify the build and debug logging

echo "=== Build Verification Script ==="
echo "Current directory: $(pwd)"
echo ""

echo "1. Checking if dist directory exists..."
if [ -d "dist" ]; then
    echo "✓ dist directory exists"
    echo "   Last modified: $(stat -f "%Sm" dist 2>/dev/null || stat -c "%y" dist 2>/dev/null)"
else
    echo "✗ dist directory not found"
fi
echo ""

echo "2. Checking main.js in dist..."
if [ -f "dist/main.js" ]; then
    echo "✓ dist/main.js exists"
    echo "   Checking for debug logs..."
    grep -n "STARTUP DEBUG" dist/main.js | head -5
else
    echo "✗ dist/main.js not found"
fi
echo ""

echo "3. Checking controller debug logs..."
if [ -f "dist/memoro/memoro.controller.js" ]; then
    echo "✓ dist/memoro/memoro.controller.js exists"
    echo "   Checking for CRITICAL DEBUG logs..."
    grep -n "CRITICAL DEBUG" dist/memoro/memoro.controller.js | head -5
else
    echo "✗ dist/memoro/memoro.controller.js not found"
fi
echo ""

echo "4. Building the project..."
npm run build
echo ""

echo "5. Checking build output again..."
echo "   main.js debug logs:"
grep "STARTUP DEBUG" dist/main.js | head -3
echo ""

echo "6. Docker image info..."
echo "   Current cloudbuild tag: $(grep -o 'memoro-service:v[0-9.]*' cloudbuild-memoro.yaml | head -1)"
echo ""

echo "=== Recommendations ==="
echo "1. Increment the version in cloudbuild-memoro.yaml (currently v4.9.8)"
echo "2. Ensure Cloud Run environment variables are set correctly"
echo "3. Check Cloud Run logs filter - it might be filtering INFO level logs"
echo "4. Use console.error() instead of console.log() for critical debug messages"
#!/bin/bash

echo "🚀 Starting Storyteller Development Environment for iOS"
echo "================================================"

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes on ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null

# Start backend in background
echo "🔧 Starting backend server on port 3002..."
cd apps/backend
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3002/health > /dev/null; then
    echo "⚠️  Backend might not be ready yet, but continuing..."
fi

# Start mobile app for iOS
echo "📱 Starting iOS app with Expo..."
cd apps/mobile

# Clear Metro bundler cache
echo "🗑️  Clearing Metro bundler cache..."
npx expo start -c --ios &
MOBILE_PID=$!

echo ""
echo "✅ Development environment started!"
echo "=================================="
echo "📱 iOS app: Expo Dev Tools will open"
echo "🔧 Backend: http://localhost:3002"
echo "📚 API Docs: http://localhost:3002/api-docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $MOBILE_PID 2>/dev/null; exit" INT
wait
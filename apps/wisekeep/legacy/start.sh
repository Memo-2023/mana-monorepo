#!/bin/bash
# YouTube Transcriber - Start Script

echo "🎥 YouTube Transcriber System"
echo "============================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start services
echo "Starting services..."
echo ""

# Start FastAPI backend
echo "1️⃣ Starting API Server (Port 8000)..."
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

# Wait for API to start
sleep 3

# Start Astro frontend
echo "2️⃣ Starting Website (Port 4321)..."
cd website && npx astro dev &
WEB_PID=$!

echo ""
echo "✅ System started!"
echo ""
echo "📍 Access points:"
echo "   • Public Website: http://localhost:4321"
echo "   • Admin Panel:    http://localhost:4321/admin"
echo "   • API Docs:       http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $API_PID $WEB_PID; exit" INT
wait
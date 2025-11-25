#!/bin/bash

echo "🔍 Checking Redis Cache in Production"
echo "======================================"
echo ""

# Your production domain
DOMAIN="https://ulo.ad"

# Test link (create one if needed)
TEST_CODE="test-redis-$(date +%s)"
TEST_URL="https://example.com/redis-test"

echo "1. Creating a test link via API..."
# You would need to create a test link first via your admin panel or API

echo ""
echo "2. Testing redirect performance..."
echo ""

# First request (should be cache MISS)
echo "First request (expected: CACHE MISS):"
time curl -I -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\nRedirect: %{redirect_url}\n" "$DOMAIN/$TEST_CODE"

echo ""
echo "Waiting 1 second..."
sleep 1

# Second request (should be cache HIT)
echo ""
echo "Second request (expected: CACHE HIT):"
time curl -I -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\nRedirect: %{redirect_url}\n" "$DOMAIN/$TEST_CODE"

echo ""
echo "Third request (should be cache HIT):"
time curl -I -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\nRedirect: %{redirect_url}\n" "$DOMAIN/$TEST_CODE"

echo ""
echo "======================================"
echo "✅ If the 2nd and 3rd requests are faster, cache is working!"
echo ""
echo "Tips for verification:"
echo "- Check your server logs for 'Cache HIT!' messages"
echo "- First visit should show 'Cache MISS'"
echo "- Subsequent visits should show 'Cache HIT!'"
echo "- Cache TTL: 5 min (normal) or 24h (popular links)"
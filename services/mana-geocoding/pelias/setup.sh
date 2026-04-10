#!/bin/bash
# Initial Pelias data import for DACH region.
#
# Run this ONCE after first docker compose up.
# Takes 30-60 minutes depending on hardware.
#
# After import, the "import" profile containers can be stopped.

set -euo pipefail
cd "$(dirname "$0")"

echo "=== Step 1: Create Elasticsearch schema ==="
docker compose --profile import run --rm schema ./bin/create_index

echo "=== Step 2: Download DACH OSM data ==="
mkdir -p data/openstreetmap
docker compose --profile import run --rm openstreetmap ./bin/download

echo "=== Step 3: Import OpenStreetMap data ==="
docker compose --profile import run --rm openstreetmap ./bin/start

echo "=== Step 4: Import polylines (street data) ==="
docker compose --profile import run --rm polylines ./bin/download
docker compose --profile import run --rm polylines ./bin/start

echo ""
echo "=== Import complete! ==="
echo "Pelias API is available at http://localhost:4000/v1"
echo ""
echo "Test it:"
echo "  curl 'http://localhost:4000/v1/search?text=Münsterplatz+Konstanz'"
echo "  curl 'http://localhost:4000/v1/reverse?point.lat=47.663&point.lon=9.175'"
echo ""
echo "You can now stop the import containers:"
echo "  docker compose --profile import stop"

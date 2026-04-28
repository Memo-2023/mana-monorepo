#!/bin/bash
# Weekly Photon DB update.
# - Downloads the latest tarball from GraphHopper
# - Verifies size before swapping (don't replace good data with a partial)
# - Atomic swap via mv → restart container
# - Keeps one previous version as .old in case of bad index

set -euo pipefail

DATA_DIR=/opt/photon-data
URL=https://download1.graphhopper.com/public/europe/photon-db-europe-1.0-latest.tar.bz2
MIN_SIZE=$((25 * 1024 * 1024 * 1024))  # 25 GB minimum, real one is ~29 GB
LOG=/var/log/photon-update.log

exec >>"$LOG" 2>&1
echo "=== $(date -Iseconds) — photon-update starting ==="

cd "$DATA_DIR"

# Download to .new — don't touch the live tarball
curl --silent --show-error --output photon-db.tar.bz2.new "$URL"
ACTUAL=$(stat -c %s photon-db.tar.bz2.new)
if [ "$ACTUAL" -lt "$MIN_SIZE" ]; then
  echo "FAIL: downloaded tarball only $((ACTUAL / 1024 / 1024)) MB, expected ≥25 GB. Aborting."
  rm -f photon-db.tar.bz2.new
  exit 1
fi
echo "Downloaded $((ACTUAL / 1024 / 1024)) MB OK"

# Unpack to a fresh dir alongside the live one
rm -rf photon_data.new
mkdir photon_data.new
tar -xjf photon-db.tar.bz2.new -C photon_data.new --strip-components=1

# Stop the container, swap, restart
docker stop photon
mv photon_data photon_data.old || true
mv photon_data.new photon_data
mv photon-db.tar.bz2 photon-db.tar.bz2.old || true
mv photon-db.tar.bz2.new photon-db.tar.bz2
docker start photon

# Wait for it to come up + smoke
for i in $(seq 1 90); do
  if curl -fsS --max-time 2 http://localhost:2322/api?q=Konstanz >/dev/null 2>&1; then
    echo "OK — Photon ready after $i seconds with new index"
    # Cleanup old version on success
    rm -rf photon_data.old photon-db.tar.bz2.old
    echo "=== $(date -Iseconds) — photon-update complete ==="
    exit 0
  fi
  sleep 2
done

echo "FAIL — Photon did not become ready within 180 s after swap. Rolling back."
docker stop photon
mv photon_data photon_data.bad
mv photon_data.old photon_data
docker start photon
exit 1

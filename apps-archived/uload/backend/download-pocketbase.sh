#!/bin/bash

# Pocketbase Download Script für macOS (Darwin)

VERSION="0.26.2"
ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
    FILENAME="pocketbase_${VERSION}_darwin_arm64.zip"
else
    FILENAME="pocketbase_${VERSION}_darwin_amd64.zip"
fi

URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/${FILENAME}"

echo "Downloading Pocketbase ${VERSION} for Darwin ${ARCH}..."
curl -L -o pocketbase.zip "$URL"

echo "Extracting Pocketbase..."
unzip -o pocketbase.zip
rm pocketbase.zip

echo "Pocketbase downloaded successfully!"
echo "Run './pocketbase serve' to start the server"
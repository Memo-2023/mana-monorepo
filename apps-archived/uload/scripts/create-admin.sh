#!/bin/bash

echo "Creating PocketBase admin account..."

cd backend

# Use expect or echo to provide input
echo -e "till.schneider@memoro.ai\np0ck3t-RA1N\np0ck3t-RA1N" | ./pocketbase superuser create

echo "Admin account created!"
echo "Email: till.schneider@memoro.ai"
echo "Password: p0ck3t-RA1N"
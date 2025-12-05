#!/bin/bash

echo "Führe Datenbank-Migrationen aus..."

# Migration 004: Prompt System
echo "Migration 004: Prompt System..."
npx supabase db push --db-url "$DATABASE_URL" < supabase/migrations/004_prompt_system.sql

# Migration 005: Add image_url
echo "Migration 005: Add image_url column..."
npx supabase db push --db-url "$DATABASE_URL" < supabase/migrations/005_add_image_url.sql

echo "Migrationen abgeschlossen!"
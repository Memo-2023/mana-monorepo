um beides zu starten einfach das in zwei unterschiedliche terminals einfügen

TERMINAL 1
cd apps/backend
npm run dev

TERMINAL 2
cd apps/mobile
npx expo run:ios

falls envs nicht passen

in apps/backend/.env

NODE_ENV=development
PORT=3002

# Mana Core Middleware

MANA_SERVICE_URL=https://mana-core-middleware-dev-55965480161.europe-west3.run.app

# Service-to-service auth key for mana-core (replace with actual key from mana team)

MAERCHENZAUBER_MANA_SUPABASE_SECRET_KEY=your-mana-service-role-key-here

# Maerchenzauber (App-Specific)

MAERCHENZAUBER_SUPABASE_URL=https://dyywxrmonxoiojsjmymc.supabase.co
MAERCHENZAUBER_SUPABASE_ANON_KEY=sb_publishable_WW3dKMUE5mndplMKouc_AQ_ivCldqsr
MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eXd4cm1vbnhvaW9qc2pteW1jIiwicm9sZSI6InNlcnZpY2VfZm9sZSIsImlhdCI6MTcyMDUyOTM2NiwiZXhwIjoyMDM2MTA1MzY2fQ.T8QWBxk7JAL1VW6a2F64k9jy8ViN1fQY-Wc8lfhqAzs
MAERCHENZAUBER_JWT_SECRET=HSxC03e6rl1FeFba7HkbSnZ3IDeFwUDJgnS6Iqh/1XLDP6nz475H3imJAlh3RYucWp+b5+0DXZXg/SgUgs4vkA==

MAERCHENZAUBER_GOOGLE_GENAI_API_KEY=AIzaSyApsYQXxN6PuXpF8-7j6MonCACwS0ZxNRc
MAERCHENZAUBER_REPLICATE_API_KEY=r8_aK7LwfnAZNbVMvQ3UuqNwZJcx0ozw9x1k1AUM

# Application

APP_ID=6c12c767-1f96-461c-b2df-93d5f9c0f063

MAERCHENZAUBER_AZURE_OPENAI_KEY=EY3Mb9L6aGWG8hj4O4zE5r2w292Hkipvj5ZjLziDcKPEOB3KlNFJJQQJ99AJACfhMk5XJ3w3AAABACOG7HIv
MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT=https://storyteller-openai-swedencentral.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview

in apps/mobile/.env.local

# Local Development Backend

EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002

# Required for expo-router 3.5.x web bundling (can be removed in SDK 50+)

EXPO_ROUTER_APP_ROOT=app

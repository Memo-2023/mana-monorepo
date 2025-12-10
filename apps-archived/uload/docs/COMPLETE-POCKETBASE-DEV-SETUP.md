# Complete PocketBase Development Setup Guide

## 📋 Overview

This guide documents the complete setup for local PocketBase development environment, separating it from production database to ensure safe development.

## 🎯 Current Status

### ✅ What's Already Done

1. **PocketBase is running** locally on `http://localhost:8090`
   - Binary located at: `backend/pocketbase`
   - Admin UI: http://localhost:8090/_/
   - Process running on port 8090

2. **Admin Account Created**
   ```
   Email: till.schneider@memoro.ai
   Password: p0ck3t-RAJ
   ```

3. **Environment Variables Configured**
   - `.env.development` - Points to `http://localhost:8090`
   - `.env.production` - Points to `https://pb.ulo.ad`
   - Automatic environment detection implemented

4. **Code Changes Completed**
   All hardcoded production URLs have been removed and replaced with dynamic environment-based URLs:
   - `src/lib/pocketbase.ts` - Dynamic URL selection
   - `src/routes/p/[username]/+page.server.ts` - Environment-aware
   - `src/lib/scripts/update-links-collection.js` - Flexible URL
   - `src/routes/api/verify/+server.ts` - Dynamic redirect
   - `src/hooks.server.ts` - CSP headers for both environments

5. **Scripts Created**
   - `scripts/seed-local-db.js` - Creates test data
   - `scripts/create-collections.mjs` - API-based collection creation (optional)

## 🔴 What Still Needs to Be Done

### Collections Need to Be Created

The database schema needs to be set up. The original `backend/pb_schema.json` is in an outdated format and cannot be imported into PocketBase v0.26.2.

## 📦 Collections Schema

### 1. Links Collection

**Type:** Base Collection  
**Name:** `links`

**Fields:**
```javascript
{
  short_code: {
    type: 'text',
    required: true,
    unique: true,
    min: 3,
    max: 50,
    pattern: '^[a-zA-Z0-9_/-]+$'
  },
  custom_code: {
    type: 'text',
    required: false
  },
  original_url: {
    type: 'url',
    required: true
  },
  title: {
    type: 'text',
    required: false,
    max: 200
  },
  description: {
    type: 'text',
    required: false,
    max: 500
  },
  user_id: {
    type: 'relation',
    required: false,
    collection: 'users',
    cascadeDelete: true,
    maxSelect: 1
  },
  is_active: {
    type: 'bool',
    required: false,
    default: true
  },
  password: {
    type: 'text',
    required: false
  },
  max_clicks: {
    type: 'number',
    required: false,
    min: 0
  },
  expires_at: {
    type: 'date',
    required: false
  },
  click_count: {
    type: 'number',
    required: false,
    default: 0
  },
  qr_code: {
    type: 'file',
    required: false,
    maxSelect: 1,
    maxSize: 5242880
  },
  tags: {
    type: 'json',
    required: false
  },
  utm_source: {
    type: 'text',
    required: false
  },
  utm_medium: {
    type: 'text',
    required: false
  },
  utm_campaign: {
    type: 'text',
    required: false
  },
  account_owner: {
    type: 'relation',
    required: false,
    collection: 'accounts',
    maxSelect: 1
  }
}
```

**API Rules:**
- List/View: `` (empty = public)
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

**Indexes:**
- `CREATE UNIQUE INDEX idx_short_code ON links (short_code)`

### 2. Clicks Collection

**Type:** Base Collection  
**Name:** `clicks`

**Fields:**
```javascript
{
  link_id: {
    type: 'relation',
    required: true,
    collection: 'links',
    cascadeDelete: true,
    maxSelect: 1
  },
  ip_hash: {
    type: 'text',
    required: false
  },
  user_agent: {
    type: 'text',
    required: false
  },
  referer: {
    type: 'text',
    required: false
  },
  browser: {
    type: 'text',
    required: false
  },
  device_type: {
    type: 'text',
    required: false
  },
  os: {
    type: 'text',
    required: false
  },
  country: {
    type: 'text',
    required: false
  },
  city: {
    type: 'text',
    required: false
  },
  clicked_at: {
    type: 'date',
    required: false
  },
  utm_source: {
    type: 'text',
    required: false
  },
  utm_medium: {
    type: 'text',
    required: false
  },
  utm_campaign: {
    type: 'text',
    required: false
  }
}
```

**API Rules:**
- List/View: `` (empty = public for link tracking)
- Create: `` (empty = public for link tracking)
- Update: `null` (no updates allowed)
- Delete: `@request.auth.id = link_id.user_id`

### 3. Accounts Collection

**Type:** Base Collection  
**Name:** `accounts`

**Fields:**
```javascript
{
  name: {
    type: 'text',
    required: true
  },
  owner: {
    type: 'relation',
    required: true,
    collection: 'users',
    cascadeDelete: true,
    maxSelect: 1
  },
  members: {
    type: 'relation',
    required: false,
    collection: 'users',
    cascadeDelete: false,
    multiple: true
  },
  isActive: {
    type: 'bool',
    required: false,
    default: true
  },
  planType: {
    type: 'select',
    required: false,
    values: ['free', 'team', 'enterprise']
  },
  settings: {
    type: 'json',
    required: false
  }
}
```

**API Rules:**
- List/View: `@request.auth.id = owner || @request.auth.id ?~ members`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = owner`
- Delete: `@request.auth.id = owner`

### 4. Users Collection (Update Existing)

The users collection already exists (PocketBase auth collection). Add these custom fields:

**Additional Fields:**
```javascript
{
  bio: { type: 'text', required: false },
  website: { type: 'url', required: false },
  location: { type: 'text', required: false },
  github: { type: 'text', required: false },
  twitter: { type: 'text', required: false },
  linkedin: { type: 'text', required: false },
  instagram: { type: 'text', required: false },
  publicProfile: { type: 'bool', required: false, default: false },
  showClickStats: { type: 'bool', required: false, default: true },
  isPremium: { type: 'bool', required: false, default: false },
  stripeCustomerId: { type: 'text', required: false },
  stripeSubscriptionId: { type: 'text', required: false },
  subscriptionStatus: { type: 'text', required: false },
  planType: {
    type: 'select',
    required: false,
    values: ['free', 'monthly', 'yearly', 'lifetime']
  }
}
```

## 🚀 Setup Instructions for MCP Session

### Step 1: Verify PocketBase is Running

```bash
# Check if PocketBase is running
curl http://localhost:8090/api/health

# If not running, start it:
cd backend && ./pocketbase serve
```

### Step 2: Create Collections via MCP

When you connect the PocketBase MCP, use these commands:

1. **Authenticate as Admin:**
   ```
   Email: till.schneider@memoro.ai
   Password: p0ck3t-RAJ
   ```

2. **Create Links Collection:**
   Use `mcp__pocketbase-server__create_collection` with the schema above

3. **Create Clicks Collection:**
   Use `mcp__pocketbase-server__create_collection` with the schema above

4. **Create Accounts Collection:**
   Use `mcp__pocketbase-server__create_collection` with the schema above

5. **Update Users Collection:**
   Use `mcp__pocketbase-server__update_collection` to add custom fields

### Step 3: Load Test Data

After collections are created, run:

```bash
cd /Users/tillschneider/Documents/__00__Code/uload
node scripts/seed-local-db.js
```

This will create:
- 2 test users (test@localhost, demo@localhost)
- 4 test links (normal, protected, expired, limited)
- Sample click data

### Step 4: Start Application

```bash
npm run dev
```

The app will automatically use `http://localhost:8090` in development mode.

## 🧪 Test Data

### Test Users
```
Email: test@localhost
Password: test123456

Email: demo@localhost
Password: demo123456
```

### Test Links
- `http://localhost:5173/test1` - Normal link → https://example.com
- `http://localhost:5173/test2` - Link with 100 click limit → https://google.com
- `http://localhost:5173/protected` - Password protected (password: `secret123`) → https://github.com
- `http://localhost:5173/expired` - Expired link → https://stackoverflow.com

## 🔍 Verification Checklist

- [ ] PocketBase running on http://localhost:8090
- [ ] Admin can login at http://localhost:8090/_/
- [ ] All 3 collections created (links, clicks, accounts)
- [ ] Users collection updated with custom fields
- [ ] Test data loaded successfully
- [ ] App connects to local PocketBase (check console for "🔧 PocketBase URL: http://localhost:8090")
- [ ] Can create new links
- [ ] Link redirects work
- [ ] Click tracking works
- [ ] Password protection works
- [ ] User registration works

## 📝 Important Files

### Configuration Files
- `.env.development` - Local environment variables
- `.env.production` - Production environment variables
- `backend/pb_data/` - Local database files
- `backend/pb_migrations/` - Database migrations

### Scripts
- `scripts/seed-local-db.js` - Creates test data
- `scripts/create-collections.mjs` - API-based collection creation

### Modified Source Files
- `src/lib/pocketbase.ts` - Dynamic URL selection
- `src/routes/p/[username]/+page.server.ts` - Environment-aware routing
- `src/hooks.server.ts` - Dynamic CSP headers
- `src/routes/api/verify/+server.ts` - Dynamic verification URLs

## 🛠 Troubleshooting

### PocketBase Won't Start
```bash
# Kill existing process
pkill -f "pocketbase serve"

# Start fresh
cd backend && ./pocketbase serve
```

### Collections Not Found
- Ensure all collections are created with exact names (case-sensitive)
- Check API rules are set correctly
- Verify relations point to correct collections

### Environment Variables Not Loading
```bash
# Check current environment
echo $NODE_ENV

# Force development mode
NODE_ENV=development npm run dev
```

### Authentication Issues
- Admin email: `till.schneider@memoro.ai`
- Admin password: `p0ck3t-RAJ`
- If locked out, create new admin: `./pocketbase superuser create`

## 🔒 Security Notes

1. **Local Development Only** - Never use these credentials in production
2. **Git Ignored** - `backend/pb_data/` is gitignored (database files)
3. **No Production Data** - Never copy production data to local
4. **Separate Accounts** - Use different accounts for dev and prod

## 🎯 Next Steps After Collections Created

1. Run seed script for test data
2. Test all features locally
3. Make changes without fear of breaking production
4. Deploy when ready (automatic env detection)

## 📊 Environment Comparison

| Feature | Development | Production |
|---------|------------|------------|
| PocketBase URL | http://localhost:8090 | https://pb.ulo.ad |
| Database | Local SQLite | Cloud (Coolify) |
| Redis | localhost:6379 | Coolify Redis |
| Stripe | Test keys | Live keys |
| SSL | No (HTTP) | Yes (HTTPS) |
| Auth | Test accounts | Real users |
| Data | Test/mock data | Real data |

## 🚨 Critical Information for MCP Session

**Working Directory:** `/Users/tillschneider/Documents/__00__Code/uload`

**PocketBase Location:** `backend/pocketbase`

**Admin Credentials:**
- Email: `till.schneider@memoro.ai`
- Password: `p0ck3t-RAJ`

**Collections to Create (in order):**
1. accounts (optional, but create first if needed)
2. links
3. clicks

**After Creation:**
1. Run: `node scripts/seed-local-db.js`
2. Test at: http://localhost:5173

---

This documentation contains everything needed to complete the PocketBase setup in a new session with MCP tools. The environment is prepared and only needs the collections to be created.
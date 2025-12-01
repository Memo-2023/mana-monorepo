# Environment Audit - Quick Summary

## Issues Found: 8 Critical/Major Items

### BLOCKING (Fix immediately - prevent simultaneous backend execution)

**Port Conflicts:**
```
Port 3002: Chat (3002) ← → Nutriphi (3002)  [CONFLICT]
Port 3003: Picture (3003) ← → Maerchenzauber (3003)  [CONFLICT]
```

**Hardcoded Values:**
- Chat backend hardcodes DEV_USER_ID instead of reading from env

### MAJOR (Inconsistencies across codebase)

**Auth URL Variable Names (Choose One):**
- Chat: MANA_CORE_AUTH_URL ✓
- Picture: MANA_CORE_AUTH_URL ✓
- Zitare: MANA_CORE_AUTH_URL ✓
- Presi: MANA_CORE_AUTH_URL ✓
- **Manadeck: MANA_SERVICE_URL** ← Should standardize
- **Nutriphi: MANACORE_AUTH_URL** ← Should standardize

**CORS Origins:**
- Hardcoded in 4 backends (Chat, Picture, Zitare, Presi)
- Should use CORS_ORIGINS from environment

**Missing Documentation:**
- No .env.example for Zitare backend
- No .env.example for Presi backend

### MEDIUM (Code quality)

**Validation Schemas:**
- Chat: Missing
- Picture: Missing
- Zitare: Missing
- Presi: Missing
- Manadeck: ✓ Has validation schema
- Mana-Core-Auth: ✓ Has validation config

---

## Quick Fix Checklist

### Phase 1: Critical (1-2 hours)
- [ ] Reassign Picture from port 3003 → 3005
- [ ] Reassign Nutriphi from port 3002 → 3006
- [ ] Add DEV_USER_ID to .env.development
- [ ] Update Chat to load DEV_USER_ID from ConfigService

### Phase 2: Major (2-3 hours)
- [ ] Rename MANA_SERVICE_URL to MANA_CORE_AUTH_URL in Manadeck
- [ ] Rename MANACORE_AUTH_URL to MANA_CORE_AUTH_URL in Nutriphi
- [ ] Create .env.example for Zitare
- [ ] Create .env.example for Presi

### Phase 3: Quality (3-4 hours)
- [ ] Add validation schemas to Chat, Picture, Zitare, Presi
- [ ] Extract CORS origins to environment variables
- [ ] Update all backends to read CORS_ORIGINS from env

---

## Port Mapping (Current vs Recommended)

```
Current:                          Recommended:
3001 ← Mana Core Auth    →    3001 ← Mana Core Auth
3002 ← Chat              →    3002 ← Chat
3002 ← Nutriphi [X]      →    3006 ← Nutriphi [FIXED]
3003 ← Maerchenzauber    →    3003 ← Maerchenzauber
3003 ← Picture [X]       →    3005 ← Picture [FIXED]
3004 ← Manadeck          →    3004 ← Manadeck
3007 ← Zitare            →    3007 ← Zitare
3008 ← Presi             →    3008 ← Presi
3010 ← Voxel Lava        →    3010 ← Voxel Lava
3011 ← Mana Games        →    3011 ← Mana Games
```

---

## Environment Variables Status

### Well-Configured
- MANA_CORE_AUTH_URL (central + mapped)
- JWT keys (central)
- API keys (central)
- Database URLs (individual + mapped)

### Needs Work
- DEV_USER_ID (hardcoded, not in env)
- DEV_BYPASS_AUTH (partial, only Chat)
- CORS_ORIGINS (hardcoded, not used by all)
- Auth URL naming (3 different conventions)

---

## Files to Modify

### .env.development
- [ ] Add DEV_USER_ID line
- [ ] Fix PICTURE_BACKEND_PORT (3003 → 3005)
- [ ] Fix NUTRIPHI_BACKEND_PORT (3002 → 3006)

### scripts/generate-env.mjs
- [ ] Line 205: MANA_SERVICE_URL → MANA_CORE_AUTH_URL (Manadeck)
- [ ] Line 272: MANACORE_AUTH_URL → MANA_CORE_AUTH_URL (Nutriphi)

### Backend Apps (4 files each)
- [ ] apps/chat/apps/backend/src/config/validation.schema.ts (create)
- [ ] apps/picture/apps/backend/src/config/validation.schema.ts (create)
- [ ] apps/zitare/apps/backend/src/config/validation.schema.ts (create)
- [ ] apps/presi/apps/backend/src/config/validation.schema.ts (create)

### Backend Main Files (4 files)
- [ ] apps/chat/apps/backend/src/main.ts (extract CORS)
- [ ] apps/picture/apps/backend/src/main.ts (extract CORS)
- [ ] apps/zitare/apps/backend/src/main.ts (extract CORS)
- [ ] apps/presi/apps/backend/src/main.ts (extract CORS)

### Backend Examples (2 files)
- [ ] apps/zitare/apps/backend/.env.example (create)
- [ ] apps/presi/apps/backend/.env.example (create)

### Chat Guard
- [ ] apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts
  - Remove hardcoded DEV_USER_ID
  - Read from configService instead

---

## Testing After Fixes

```bash
# Test all 10 backends can start simultaneously
pnpm dev:auth &
pnpm dev:chat:backend &
pnpm dev:manadeck:backend &
pnpm dev:picture:backend &
pnpm dev:zitare:backend &
pnpm dev:presi:backend &

# Verify each responds
curl http://localhost:3001/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health  # Maerchenzauber
curl http://localhost:3004/v1/health   # Manadeck
curl http://localhost:3005/api/health  # Picture (new port)
curl http://localhost:3007/api/health  # Zitare
curl http://localhost:3008/api/health  # Presi
```

---

## Additional Docs

See full audit report: `/docs/ENV_CONFIGURATION_AUDIT.md`

Key sections:
- Environment Variable Mapping (section 3)
- Hardcoded Values & Security (section 4)
- Configuration Best Practices (section 5)
- Implementation Checklist (section 10)

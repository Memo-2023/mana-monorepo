# Environment Variable Configuration Matrix

## Backend Authentication & Port Status

```
╔══════════════════╦════════╦═══════════════════════╦═════════════════════╦═══════════════╗
║ Backend          ║ Port   ║ Auth URL Variable     ║ Dev Bypass          ║ Validation    ║
╠══════════════════╬════════╬═══════════════════════╬═════════════════════╬═══════════════╣
║ Mana Core Auth   ║ 3001   ║ N/A (Auth service)    ║ N/A                 ║ ✓ Config svc  ║
║ Chat             ║ 3002   ║ MANA_CORE_AUTH_URL    ║ ✓ Implemented       ║ ✗ Missing     ║
║ Maerchenzauber   ║ 3003   ║ MANA_SERVICE_URL      ║ ? Unknown           ║ ? Unknown     ║
║ Manadeck         ║ 3004   ║ MANA_SERVICE_URL      ║ ? Unknown           ║ ✓ Joi schema  ║
║ Picture          ║ 3003   ║ MANA_CORE_AUTH_URL    ║ ✗ Missing           ║ ✗ Missing     ║
║ Nutriphi         ║ 3002   ║ MANACORE_AUTH_URL     ║ ? Unknown           ║ ? Unknown     ║
║ Zitare           ║ 3007   ║ MANA_CORE_AUTH_URL    ║ ✗ Missing           ║ ✗ Missing     ║
║ Presi            ║ 3008   ║ MANA_CORE_AUTH_URL    ║ ✗ Missing           ║ ✗ Missing     ║
║ Voxel Lava       ║ 3010   ║ ? Not checked         ║ ? Unknown           ║ ? Unknown     ║
║ Mana Games       ║ 3011   ║ ? Not checked         ║ ? Unknown           ║ ? Unknown     ║
╚══════════════════╩════════╩═══════════════════════╩═════════════════════╩═══════════════╝
```

Legend:
- ✓ = Implemented/Present
- ✗ = Missing/Not implemented
- ? = Not analyzed in this audit
- Port conflicts highlighted in red

---

## Database URL Configuration

```
╔══════════════════╦════════════════════════════════════════════════╦════════════════╗
║ Backend          ║ Database URL Variable                          ║ Generated      ║
╠══════════════════╬════════════════════════════════════════════════╬════════════════╣
║ Mana Core Auth   ║ MANA_CORE_AUTH_DATABASE_URL                   ║ ✓ via gen-env  ║
║ Chat             ║ CHAT_DATABASE_URL                              ║ ✓ via gen-env  ║
║ Manadeck         ║ MANADECK_DATABASE_URL                          ║ ✓ via gen-env  ║
║ Picture          ║ PICTURE_DATABASE_URL                           ║ ✓ via gen-env  ║
║ Nutriphi         ║ NUTRIPHI_DATABASE_URL                          ║ ✓ via gen-env  ║
║ Zitare           ║ ZITARE_DATABASE_URL                            ║ ✓ via gen-env  ║
║ Presi            ║ PRESI_DATABASE_URL                             ║ ✓ via gen-env  ║
║ Voxel Lava       ║ VOXEL_LAVA_DATABASE_URL                        ║ ✓ via gen-env  ║
║ Mana Games       ║ None specified                                 ║ N/A            ║
╚══════════════════╩════════════════════════════════════════════════╩════════════════╝
```

---

## CORS Configuration Status

```
╔══════════════════╦═══════════════════════════════════╦═════════════════════════════════╗
║ Backend          ║ CORS Implementation               ║ Recommendation                  ║
╠══════════════════╬═══════════════════════════════════╬═════════════════════════════════╣
║ Chat             ║ Hardcoded array in main.ts        ║ Move to CORS_ORIGINS env var    ║
║ Picture          ║ Hardcoded array in main.ts        ║ Move to CORS_ORIGINS env var    ║
║ Zitare           ║ Hardcoded array in main.ts        ║ Move to CORS_ORIGINS env var    ║
║ Presi            ║ Hardcoded array in main.ts        ║ Move to CORS_ORIGINS env var    ║
║ Manadeck         ║ configService.get('FRONTEND_URL') ║ Already using env var (better)  ║
║ Mana Core Auth   ║ configService array               ║ Already using env var (good)    ║
╚══════════════════╩═══════════════════════════════════╩═════════════════════════════════╝
```

Current hardcoded CORS allowed origins (should be environment variable):
```javascript
// In 4 backends
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',    // Primary web dev port
  'http://localhost:5174',    // Secondary web port
  'http://localhost:5175',    // Tertiary web port
  'http://localhost:5177',    // Zitare web
  'http://localhost:5178',    // Chat web / Presi web
  'http://localhost:8081',    // Expo dev server
  'exp://localhost:8081',     // Expo protocol
  'http://localhost:3001',    // Mana Core Auth
]
```

---

## Port Availability & Conflicts

```
Port 3000 ━━━━━━━━ [FREE]
Port 3001 ━━━━━━━━ Mana Core Auth (ACTIVE)
Port 3002 ━━━━━━━━ Chat (ACTIVE) + Nutriphi (ACTIVE) ⚠ CONFLICT!
           ↓
         3002a Chat
         3002b Nutriphi (should be 3006)
Port 3003 ━━━━━━━━ Maerchenzauber (ACTIVE) + Picture (ACTIVE) ⚠ CONFLICT!
           ↓
         3003a Maerchenzauber
         3003b Picture (should be 3005)
Port 3004 ━━━━━━━━ Manadeck (ACTIVE)
Port 3005 ━━━━━━━━ [AVAILABLE] ← Assign to Picture
Port 3006 ━━━━━━━━ [AVAILABLE] ← Assign to Nutriphi
Port 3007 ━━━━━━━━ Zitare (ACTIVE)
Port 3008 ━━━━━━━━ Presi (ACTIVE)
Port 3009 ━━━━━━━━ [RESERVED - mentioned in CLAUDE.md]
Port 3010 ━━━━━━━━ Voxel Lava (ACTIVE)
Port 3011 ━━━━━━━━ Mana Games (ACTIVE)
```

---

## Environment Variable Generation Map

### From .env.development to Backend .env Files

```
MANA_CORE_AUTH_PORT (3001)
  ↓ (generate-env.mjs line 61)
  ├→ services/mana-core-auth/.env {PORT}
  
CHAT_BACKEND_PORT (3002)
  ↓ (generate-env.mjs line 89)
  ├→ apps/chat/apps/backend/.env {PORT}
  
MANA_CORE_AUTH_URL (http://localhost:3001)
  ↓ (generate-env.mjs multiple lines)
  ├→ apps/chat/apps/backend/.env {MANA_CORE_AUTH_URL}
  ├→ apps/picture/apps/backend/.env {MANA_CORE_AUTH_URL}
  ├→ apps/zitare/apps/backend/.env {MANA_CORE_AUTH_URL}
  ├→ apps/presi/apps/backend/.env {MANA_CORE_AUTH_URL}
  ├→ apps/manadeck/apps/backend/.env {MANA_SERVICE_URL} ← NAMING INCONSISTENCY
  └→ apps/nutriphi/apps/backend/.env {MANACORE_AUTH_URL} ← NAMING INCONSISTENCY

CORS_ORIGINS (http://localhost:3000,http://localhost:3002,...)
  ↓ (generate-env.mjs line 75, 136, 232, 301, 332, 372)
  ├→ services/mana-core-auth/.env {CORS_ORIGINS}
  ├→ apps/maerchenzauber/apps/backend/.env {CORS_ORIGINS}
  ├→ apps/picture/apps/backend/.env {CORS_ORIGINS}
  ├→ apps/zitare/apps/backend/.env {CORS_ORIGINS}
  ├→ apps/presi/apps/backend/.env {CORS_ORIGINS}
  └→ games/mana-games/apps/backend/.env {CORS_ORIGINS}
     [BUT NOT USED by Chat, Picture, Zitare, Presi - they hardcode instead!]
```

---

## Issues Severity Matrix

```
╔═══════════════╦════════════════════════════════════════════════╦══════════════════╗
║ Severity      ║ Count ║ Issue Description                       ║ Time to Fix      ║
╠═══════════════╬═══════╬═════════════════════════════════════════╬══════════════════╣
║ BLOCKING      ║ 2     ║ Port conflicts (3002, 3003)             ║ 15 minutes       ║
║               ║ 1     ║ Hardcoded DEV_USER_ID                   ║ 30 minutes       ║
╠═══════════════╬═══════╬═════════════════════════════════════════╬══════════════════╣
║ MAJOR         ║ 3     ║ Auth URL naming inconsistencies         ║ 30 minutes       ║
║               ║ 4     ║ Hardcoded CORS origins                  ║ 1-2 hours        ║
║               ║ 2     ║ Missing .env.example files              ║ 15 minutes       ║
╠═══════════════╬═══════╬═════════════════════════════════════════╬══════════════════╣
║ MEDIUM        ║ 4     ║ Missing validation schemas              ║ 2-3 hours        ║
║               ║ 1     ║ Dev bypass auth inconsistency           ║ 1-2 hours        ║
╠═══════════════╬═══════╬═════════════════════════════════════════╬══════════════════╣
║ TOTAL         ║ 17    ║ All issues identified                   ║ 6-8 hours total  ║
╚═══════════════╩═══════╩═════════════════════════════════════════╩══════════════════╝
```

---

## Configuration Best Practices Scorecard

```
╔════════════════════════════════════╦═════════════════════════════════════════╗
║ Criteria                           ║ Score (0-10)                            ║
╠════════════════════════════════════╬═════════════════════════════════════════╣
║ Port Assignment Uniqueness         ║ 4/10 (2 conflicts found)                ║
║ Environment Variable Standardization║ 6/10 (3 naming conventions)             ║
║ Configuration Documentation        ║ 5/10 (3 missing .env.example files)    ║
║ Centralized Environment Setup      ║ 8/10 (good but some backends override) ║
║ Configuration Validation           ║ 3/10 (only 2/8 backends have schemas)  ║
║ Hardcoded Values                   ║ 4/10 (CORS + DEV_USER_ID hardcoded)    ║
║ Auth Configuration Consistency     ║ 4/10 (4 different variable names)      ║
║ Security (no secrets in source)    ║ 7/10 (mostly good, except DEV_USER_ID) ║
╠════════════════════════════════════╬═════════════════════════════════════════╣
║ OVERALL SCORE                      ║ 5.1/10 (NEEDS IMPROVEMENT)              ║
╚════════════════════════════════════╩═════════════════════════════════════════╝
```

**To reach 8/10:** Fix blocking issues + add missing validation schemas
**To reach 9/10:** + Move all CORS to environment + Standardize auth URLs
**To reach 10/10:** + Complete documentation + Consistent dev bypass pattern across all

---

## Quick Reference: Variable Name Standardization

### Current (Inconsistent)

```
Chat:          MANA_CORE_AUTH_URL
Picture:       MANA_CORE_AUTH_URL
Zitare:        MANA_CORE_AUTH_URL
Presi:         MANA_CORE_AUTH_URL
Manadeck:      MANA_SERVICE_URL         ← Different!
Nutriphi:      MANACORE_AUTH_URL        ← Different!
```

### Recommended (Consistent)

```
All backends:  MANA_CORE_AUTH_URL       ← Standardized
```

### Migration Path

1. Add MANA_CORE_AUTH_URL to .env.development (already exists!)
2. Update generate-env.mjs:
   - Line 205: Change `MANA_SERVICE_URL` to `MANA_CORE_AUTH_URL` (Manadeck)
   - Line 272: Change `MANACORE_AUTH_URL` to `MANA_CORE_AUTH_URL` (Nutriphi)
3. Update app.module.ts files if they reference old variable name
4. Update config/validation.schema.ts files if applicable
5. Test `pnpm setup:env` generates correct variables
6. Verify all backends read MANA_CORE_AUTH_URL

---

## Next Steps

1. **Read the full audit:** `/docs/ENV_CONFIGURATION_AUDIT.md`
2. **Follow the checklist:** `/docs/ENV_AUDIT_SUMMARY.md`
3. **Review this matrix:** You are here!
4. **Implement fixes:** Start with Phase 1 (blocking issues)
5. **Test & verify:** Run all backends simultaneously
6. **Document results:** Update CLAUDE.md with final port assignments

---

Generated: December 1, 2025
Auditor: Environment Configuration Auditor Agent (Claude Flow Swarm)

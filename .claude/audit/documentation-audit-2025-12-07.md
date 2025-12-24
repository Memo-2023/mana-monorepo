# Documentation Audit Report
**Date:** 2025-12-07
**Auditor:** Claude Code (Swarm Research Agent)
**Scope:** Complete documentation review of manacore-monorepo

---

## Executive Summary

This audit reviewed all CLAUDE.md files, guideline documents, and cross-referenced them with actual codebase structure. The monorepo has **17 active projects** in `apps/`, **5 game projects** in `games/`, **16 archived projects** in `apps-archived/`, and **1 service** (`mana-core-auth`).

**Overall Documentation Quality:** 7/10
- ✅ Root CLAUDE.md is comprehensive and well-structured
- ✅ Most active projects have detailed CLAUDE.md files
- ⚠️ Several projects missing from root documentation
- ⚠️ Some inconsistencies between docs and actual structure
- ❌ Several projects completely undocumented

---

## Critical Findings (Priority: HIGH)

### 1. **Missing Project Documentation in Root CLAUDE.md**

The root `/CLAUDE.md` only documents 6 projects, but there are **17 active projects** in `apps/`:

**Documented (6):**
- manacore
- manadeck
- picture
- chat
- zitare
- contacts

**Missing from Documentation (11):**
- **calendar** - Full calendar app (backend, web, landing) - Port 3014
- **clock** - World clock/timer app (backend, web, landing) - Port 3017
- **context** - AI document management (mobile only)
- **todo** - Task management app (backend, web, landing) - Port 3018
- **maerchenzauber** - AI story generation (backend, mobile) - ACTIVE in `apps/` but also listed as archived
- **memoro** - Voice memo app (mobile only) - ACTIVE in `apps/` but also listed as archived
- **nutriphi** - Nutrition tracking (backend, mobile) - ACTIVE in `apps/` but also listed as archived
- **quote** - Quote app (backend, web, mobile)
- **reader** - Reading app (mobile only) - ACTIVE in `apps/` but also listed as archived
- **wisekeep** - AI wisdom extraction (backend, mobile) - ACTIVE in `apps/` but also listed as archived
- **finance** - Finance app (documented in archived but exists in apps-archived)
- **moodlit** - Mood tracking (documented in archived but exists in apps-archived)

**Impact:** Developers/AI working on these projects have no guidance in the main documentation.

**Recommendation:** Add a comprehensive project table to root CLAUDE.md that lists ALL active projects with their status, apps (backend/web/mobile/landing), and ports.

---

### 2. **Projects Listed as "Archived" But Actually Active**

**CRITICAL CONFUSION:** The root CLAUDE.md lists these as archived in `apps-archived/`:
- maerchenzauber
- memoro
- wisekeep
- reader
- nutriphi

**BUT:** These projects actually exist in `apps/` (active workspace):
- `/apps/maerchenzauber/` ✅ EXISTS (backend + mobile)
- `/apps/memoro/` ✅ EXISTS (mobile only)
- `/apps/wisekeep/` ✅ EXISTS (backend + mobile)
- `/apps/reader/` ✅ EXISTS (mobile only)
- `/apps/nutriphi/` ✅ EXISTS (backend + mobile)

**Also in apps-archived/:**
- `/apps-archived/maerchenzauber/` ✅ EXISTS
- `/apps-archived/memoro/` ✅ EXISTS
- `/apps-archived/wisekeep/` ✅ EXISTS
- `/apps-archived/reader/` ✅ EXISTS
- `/apps-archived/nutriphi/` ✅ EXISTS

**Impact:** This creates severe confusion. It appears these projects were copied to `apps/` from `apps-archived/` but the documentation was not updated. Developers don't know if these are active or archived.

**Recommendation:**
1. Determine which version is canonical (apps/ or apps-archived/)
2. Remove duplicates
3. Update documentation to reflect actual status
4. If both versions should exist, explain why in documentation

---

### 3. **Missing Project-Level CLAUDE.md Files**

**Projects WITH CLAUDE.md (11):**
- ✅ calendar (detailed, German)
- ✅ chat (comprehensive)
- ✅ clock (detailed, German)
- ✅ contacts (comprehensive)
- ✅ context (concise but complete)
- ✅ manacore (exists, need to verify)
- ✅ todo (detailed, German)
- ✅ zitare (comprehensive)
- ✅ mana-core-auth (service)
- ✅ Several archived projects (maerchenzauber, reader, uload)
- ✅ Game projects (figgos, mana-games, voxelava, worldream)

**Projects MISSING CLAUDE.md (6+):**
- ❌ **manadeck** - Major project with backend/web/mobile/landing
- ❌ **picture** - AI image generation project
- ❌ **quote** - Quote management app
- ❌ **maerchenzauber** (active version in apps/)
- ❌ **memoro** (active version in apps/)
- ❌ **nutriphi** (active version in apps/)
- ❌ **wisekeep** (active version in apps/)
- ❌ **reader** (active version in apps/)
- ❌ All projects in `apps-archived/` that don't have CLAUDE.md

**Impact:** No project-specific guidance for important projects like manadeck and picture, which are prominently featured in root docs.

**Recommendation:** Create CLAUDE.md files for all active projects, especially manadeck and picture.

---

## Medium Priority Findings

### 4. **Inconsistent Landing Page Documentation**

**Root CLAUDE.md** lists landing pages for:
- Chat ✅
- Picture ✅
- ManaCore ✅
- ManaDeck ✅
- Zitare ✅

**BUT actual landing pages exist for (7 total):**
- ✅ chat
- ✅ picture
- ✅ manacore
- ✅ manadeck
- ✅ zitare
- ✅ **calendar** (NOT documented in root)
- ✅ **clock** (NOT documented in root)

**Deploy scripts exist for (10):**
```json
"deploy:landing:chat"
"deploy:landing:picture"
"deploy:landing:manacore"
"deploy:landing:manadeck"
"deploy:landing:zitare"
"deploy:landing:presi"      // Landing doesn't exist
"deploy:landing:clock"
"deploy:landing:mail"       // Landing doesn't exist
"deploy:landing:moodlit"    // Landing doesn't exist
"deploy:landing:all"
```

**Impact:** Documentation doesn't reflect which projects actually have landing pages vs which have deploy scripts.

**Recommendation:**
1. Remove deploy scripts for non-existent landing pages (presi, mail, moodlit)
2. Document calendar and clock landing pages in root CLAUDE.md
3. Update "Landing Pages" section to be accurate

---

### 5. **Backend Port Documentation Inconsistencies**

**Root CLAUDE.md** documents these backend ports:
- Chat: 3002 ✅
- Picture: 3006 ✅
- Zitare: 3007 ✅
- Presi: 3008 (⚠️ presi backend doesn't exist in apps/)
- ManaDeck: 3009 ✅

**Missing from root docs:**
- **Calendar backend:** Port 3014 (from calendar/CLAUDE.md)
- **Contacts backend:** Port 3015 (from contacts/CLAUDE.md)
- **Clock backend:** Port 3017 (from clock/CLAUDE.md)
- **Todo backend:** Port 3018 (from todo/CLAUDE.md)
- **mana-core-auth:** Port 3001 (documented in auth section)

**Recommendation:** Create a complete backend port reference table in root CLAUDE.md.

---

### 6. **Games Projects Not Documented**

**Games directory exists with 5 projects:**
- figgos (with CLAUDE.md ✅)
- mana-games (with CLAUDE.md ✅)
- voxelava
- whopixels
- worldream (with CLAUDE.md ✅)

**Root CLAUDE.md mentions:**
```
├── games/                   # Game projects
│   └── {game-name}/         # Individual games
```

But provides NO details about which games exist or their status.

**Recommendation:** Add a "Game Projects" section listing all games with brief descriptions.

---

### 7. **Shared Packages Documentation Gaps**

**Root CLAUDE.md lists 10 shared packages:**
- @manacore/shared-nestjs-auth ✅
- @mana-core/nestjs-integration ✅
- @manacore/shared-auth ✅
- @manacore/shared-storage ✅
- @manacore/shared-supabase ✅
- @manacore/shared-types ✅
- @manacore/shared-utils ✅
- @manacore/shared-ui ✅
- @manacore/shared-theme ✅
- @manacore/shared-i18n ✅

**Actual packages/ directory has 34 packages:**
```
eslint-config
mana-core-nestjs-integration
manadeck-database
news-database
nutriphi-database
shared-api-client
shared-auth
shared-auth-stores
shared-auth-ui
shared-branding
shared-config
shared-credit-service
shared-errors
shared-feedback-service
shared-feedback-types
shared-feedback-ui
shared-i18n
shared-icons
shared-landing-ui
shared-nestjs-auth
shared-profile-ui
shared-storage
shared-stores
shared-subscription-types
shared-subscription-ui
shared-supabase
shared-tailwind
shared-theme
shared-theme-ui
shared-types
shared-ui
shared-utils
shared-vite-config
test-config
uload-database
```

**Missing from documentation:**
- @manacore/shared-errors
- @manacore/shared-api-client
- @manacore/shared-auth-stores
- @manacore/shared-auth-ui
- @manacore/shared-branding
- @manacore/shared-config
- @manacore/shared-credit-service
- @manacore/shared-feedback-service
- @manacore/shared-feedback-types
- @manacore/shared-feedback-ui
- @manacore/shared-icons
- @manacore/shared-landing-ui
- @manacore/shared-profile-ui
- @manacore/shared-stores
- @manacore/shared-subscription-types
- @manacore/shared-subscription-ui
- @manacore/shared-tailwind
- @manacore/shared-theme-ui
- @manacore/shared-vite-config
- @manacore/test-config
- @manacore/eslint-config
- Project-specific DB packages (manadeck-database, news-database, nutriphi-database, uload-database)

**Recommendation:** Add a complete packages reference or link to a dedicated packages documentation file.

---

## Low Priority Findings

### 8. **Development Commands Missing for Some Projects**

**Root CLAUDE.md** provides dev commands for:
- manacore:dev ✅
- manadeck:dev ✅
- picture:dev ✅
- chat:dev ✅
- zitare:dev ✅
- presi:dev ⚠️ (presi doesn't exist in apps/, only in apps-archived/)
- contacts:dev ✅
- mail:dev ⚠️ (mail exists in apps-archived/, not apps/)

**Missing commands for active projects:**
- calendar:dev (exists in package.json ✅)
- clock:dev (exists in package.json ✅)
- todo:dev (exists in package.json ✅)
- moodlit:dev (exists in package.json ✅)
- finance:dev (exists in package.json ✅)
- context:dev (exists in package.json ✅)
- worldream:dev (exists in package.json ✅)
- figgos:dev (exists in package.json ✅)
- mana-games:dev (exists in package.json ✅)
- voxel-lava:dev (exists in package.json ✅)

**Recommendation:** Update command examples to include all active projects or use a pattern like "pnpm {project}:dev".

---

### 9. **Environment Variables Documentation Inconsistencies**

**Root CLAUDE.md** references:
- `/docs/ENVIRONMENT_VARIABLES.md` ✅ (file exists and is comprehensive)

**But ENVIRONMENT_VARIABLES.md documents these projects:**
- Mana Core Auth ✅
- Chat ✅
- Maerchenzauber ✅
- Memoro ✅
- Manacore ✅
- Manadeck ✅

**Missing from ENVIRONMENT_VARIABLES.md:**
- calendar
- clock
- contacts
- todo
- zitare
- picture
- All games
- All other active projects

**Recommendation:** Update docs/ENVIRONMENT_VARIABLES.md to include all active projects or clearly state it's only for select projects.

---

### 10. **Archived Projects Documentation Confusion**

**Root CLAUDE.md** lists 12 archived projects:
- bauntown ✅ (in apps-archived/)
- maerchenzauber ⚠️ (in BOTH apps/ and apps-archived/)
- memoro ⚠️ (in BOTH apps/ and apps-archived/)
- news ✅ (in apps-archived/)
- nutriphi ⚠️ (in BOTH apps/ and apps-archived/)
- reader ⚠️ (in BOTH apps/ and apps-archived/)
- uload ✅ (in apps-archived/)
- wisekeep ⚠️ (in BOTH apps/ and apps-archived/)
- techbase ✅ (in apps-archived/)
- inventory ✅ (in apps-archived/)
- presi ✅ (in apps-archived/)
- storage ✅ (in apps-archived/)

**Actually in apps-archived/ (16):**
- bauntown ✅
- finance ❌ (not listed as archived)
- inventory ✅
- maerchenzauber ⚠️
- mail ❌ (not listed as archived)
- memoro ⚠️
- moodlit ❌ (not listed as archived)
- news ✅
- nutriphi ⚠️
- presi ✅
- reader ⚠️
- storage ✅
- techbase ✅
- uload ✅
- wisekeep ⚠️

**Missing from archived list:**
- finance
- mail
- moodlit

**Recommendation:** Create accurate archived projects list and remove duplicates between apps/ and apps-archived/.

---

### 11. **S3 Buckets Documentation**

**Root CLAUDE.md** lists these pre-configured buckets:
- picture-storage (Picture)
- chat-storage (Chat)
- manadeck-storage (ManaDeck)
- nutriphi-storage (NutriPhi)
- presi-storage (Presi)
- calendar-storage (Calendar)
- contacts-storage (Contacts)
- storage-storage (Storage)

**Issues:**
- "storage-storage" is confusing naming
- Missing buckets for: clock, todo, zitare, etc.
- NutriPhi, Presi, Storage are archived - should they have buckets?

**Recommendation:** Verify which buckets actually exist in MinIO/Hetzner and update docs accordingly.

---

### 12. **Technology Stack Version Ranges Too Wide**

Root CLAUDE.md states:
- "React Native 0.76-0.81 + Expo SDK 52-54"
- "NestJS 10-11"

**Issue:** Version ranges should be more specific. Different projects may use different versions, causing confusion.

**Recommendation:** Either:
1. Specify exact versions used across monorepo
2. Link to a version compatibility matrix
3. State "varies by project, see project CLAUDE.md"

---

## Positive Findings

### What's Working Well ✅

1. **Root CLAUDE.md Structure** - Very well organized with clear sections
2. **Authentication Documentation** - Excellent detail on mana-core-auth integration
3. **Turborepo Configuration** - Critical recursive call warning is prominently documented
4. **Environment Setup** - Centralized .env.development system is well explained
5. **Shared Packages Philosophy** - Good explanation of import patterns
6. **Code Quality Section** - Good forward-looking documentation of planned infrastructure
7. **Project-Level Docs** - Where they exist (calendar, clock, contacts, todo, zitare), they're comprehensive
8. **Svelte 5 Runes** - Clear examples of correct vs incorrect usage
9. **Guidelines Directory** - Excellent `.claude/GUIDELINES.md` with links to detailed guides
10. **Landing Page Deployment** - Clear Cloudflare Pages workflow documented

---

## Recommendations by Priority

### Immediate Actions (This Week)

1. **Resolve Active vs Archived Confusion**
   - Determine status of: maerchenzauber, memoro, wisekeep, reader, nutriphi
   - Remove duplicates
   - Update root CLAUDE.md

2. **Create Missing Project CLAUDE.md Files**
   - manadeck
   - picture
   - All active projects without docs

3. **Update Root Projects Table**
   - Add all 17 active projects
   - Include: name, description, apps (backend/web/mobile/landing), port numbers

4. **Fix Landing Pages Section**
   - Remove non-existent landing deploy scripts
   - Add calendar, clock to landing pages list

### Short-term Actions (This Month)

5. **Backend Ports Reference Table**
   - Complete table of all backends with ports in root CLAUDE.md

6. **Update Shared Packages List**
   - Document all 34 packages or create dedicated packages.md

7. **Environment Variables Audit**
   - Update docs/ENVIRONMENT_VARIABLES.md for all active projects

8. **Games Projects Section**
   - Add games overview to root CLAUDE.md

### Long-term Improvements

9. **Version Compatibility Matrix**
   - Document exact versions per project

10. **Automated Documentation Checks**
    - Script to verify CLAUDE.md exists for all projects
    - Script to check root docs match actual structure

11. **Documentation Generation**
    - Auto-generate project list from filesystem
    - Auto-generate port assignments from backend configs

---

## Statistics

| Metric | Count |
|--------|-------|
| **Active Projects (apps/)** | 17 |
| **Game Projects (games/)** | 5 |
| **Archived Projects (apps-archived/)** | 16 |
| **Services (services/)** | 1 (mana-core-auth) |
| **Projects with CLAUDE.md** | ~11 active + several archived |
| **Projects without CLAUDE.md** | ~6 major projects |
| **Backends in active apps/** | 12 |
| **Documented backends in root** | 5 |
| **Landing pages (actual)** | 7 |
| **Landing pages (documented)** | 5 |
| **Deploy scripts for landing** | 10 |
| **Shared packages (actual)** | 34 |
| **Shared packages (documented)** | 10 |

---

## Appendix A: Complete Active Projects List

| Project | Backend | Web | Mobile | Landing | Port | Status |
|---------|---------|-----|--------|---------|------|--------|
| calendar | ✅ | ✅ | ❌ | ✅ | 3014 | Active, documented |
| chat | ✅ | ✅ | ✅ | ✅ | 3002 | Active, documented |
| clock | ✅ | ✅ | ❌ | ✅ | 3017 | Active, documented |
| contacts | ✅ | ✅ | ❌ | ❌ | 3015 | Active, documented |
| context | ❌ | ❌ | ✅ | ❌ | - | Active, documented |
| maerchenzauber | ✅ | ❌ | ✅ | ❌ | ? | ⚠️ Duplicate in archived |
| manacore | ❌ | ✅ | ✅ | ✅ | - | Active, documented |
| manadeck | ✅ | ✅ | ✅ | ✅ | 3009 | Active, NO docs |
| memoro | ❌ | ❌ | ✅ | ❌ | - | ⚠️ Duplicate in archived |
| nutriphi | ✅ | ❌ | ✅ | ❌ | ? | ⚠️ Duplicate in archived |
| picture | ✅ | ✅ | ✅ | ✅ | 3006 | Active, NO docs |
| quote | ✅ | ✅ | ✅ | ❌ | ? | Active, NO docs |
| reader | ❌ | ❌ | ✅ | ❌ | - | ⚠️ Duplicate in archived |
| todo | ✅ | ✅ | ❌ | ❌ | 3018 | Active, documented |
| wisekeep | ✅ | ❌ | ✅ | ❌ | ? | ⚠️ Duplicate in archived |
| zitare | ✅ | ✅ | ✅ | ✅ | 3007 | Active, documented |

---

## Appendix B: Documentation Coverage Matrix

| Document | Exists | Accuracy | Completeness | Notes |
|----------|--------|----------|--------------|-------|
| `/CLAUDE.md` | ✅ | 7/10 | 6/10 | Missing many projects |
| `.claude/GUIDELINES.md` | ✅ | 9/10 | 9/10 | Excellent |
| `.claude/guidelines/*.md` | ✅ | 9/10 | 9/10 | Comprehensive |
| `docs/ENVIRONMENT_VARIABLES.md` | ✅ | 8/10 | 5/10 | Incomplete project coverage |
| `apps/calendar/CLAUDE.md` | ✅ | 10/10 | 10/10 | Excellent, German |
| `apps/chat/CLAUDE.md` | ✅ | 9/10 | 9/10 | Comprehensive |
| `apps/clock/CLAUDE.md` | ✅ | 10/10 | 10/10 | Excellent, German |
| `apps/contacts/CLAUDE.md` | ✅ | 9/10 | 9/10 | Comprehensive |
| `apps/context/CLAUDE.md` | ✅ | 8/10 | 8/10 | Concise but complete |
| `apps/manadeck/CLAUDE.md` | ❌ | - | - | **MISSING** |
| `apps/manacore/CLAUDE.md` | ✅ | ? | ? | Not reviewed in detail |
| `apps/picture/CLAUDE.md` | ❌ | - | - | **MISSING** |
| `apps/todo/CLAUDE.md` | ✅ | 10/10 | 10/10 | Excellent, German |
| `apps/zitare/CLAUDE.md` | ✅ | 9/10 | 9/10 | Comprehensive |
| `services/mana-core-auth/CLAUDE.md` | ✅ | ? | ? | Not reviewed in detail |

---

## Appendix C: Recommended Actions Checklist

### Critical (Do First)
- [ ] Resolve maerchenzauber, memoro, wisekeep, reader, nutriphi duplicate status
- [ ] Create manadeck/CLAUDE.md
- [ ] Create picture/CLAUDE.md
- [ ] Update root CLAUDE.md projects table with all 17 active projects
- [ ] Remove presi:dev and mail:dev from root commands (they're archived)
- [ ] Add calendar, clock, todo to root CLAUDE.md

### High Priority
- [ ] Create backend ports reference table in root CLAUDE.md
- [ ] Fix landing pages documentation (remove presi, mail, moodlit deploy scripts)
- [ ] Add games section to root CLAUDE.md
- [ ] Update archived projects list to match apps-archived/

### Medium Priority
- [ ] Expand shared packages documentation
- [ ] Update docs/ENVIRONMENT_VARIABLES.md for all active projects
- [ ] Add CLAUDE.md for quote, and other undocumented active projects
- [ ] Document S3 buckets accurately

### Low Priority
- [ ] Create version compatibility matrix
- [ ] Verify all commands in package.json match documentation
- [ ] Add automated documentation validation scripts
- [ ] Consider auto-generating parts of documentation from filesystem

---

**End of Report**

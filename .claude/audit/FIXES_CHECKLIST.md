# Documentation Fixes Checklist
**Generated:** 2025-12-07
**Status:** Ready for implementation

Use this checklist to systematically fix all documentation issues identified in the audit.

---

## Phase 1: Critical Fixes (Week 1)

### 🚨 Issue 1: Resolve Active/Archived Confusion

**5 projects in BOTH apps/ and apps-archived/:**

- [ ] **maerchenzauber** - Decide: Keep in apps/ OR apps-archived/
  - [ ] If keeping in apps/: Delete from apps-archived/
  - [ ] If archiving: Delete from apps/
  - [ ] Update root CLAUDE.md archived projects list
  - [ ] Update pnpm-workspace.yaml if needed

- [ ] **memoro** - Decide: Keep in apps/ OR apps-archived/
  - [ ] If keeping in apps/: Delete from apps-archived/
  - [ ] If archiving: Delete from apps/
  - [ ] Update root CLAUDE.md archived projects list

- [ ] **wisekeep** - Decide: Keep in apps/ OR apps-archived/
  - [ ] If keeping in apps/: Delete from apps-archived/
  - [ ] If archiving: Delete from apps/
  - [ ] Update root CLAUDE.md archived projects list

- [ ] **reader** - Decide: Keep in apps/ OR apps-archived/
  - [ ] If keeping in apps/: Delete from apps-archived/
  - [ ] If archiving: Delete from apps/
  - [ ] Update root CLAUDE.md archived projects list

- [ ] **nutriphi** - Decide: Keep in apps/ OR apps-archived/
  - [ ] If keeping in apps/: Delete from apps-archived/
  - [ ] If archiving: Delete from apps/
  - [ ] Update root CLAUDE.md archived projects list

### ❌ Issue 2: Create Missing Major Project Docs

- [ ] **Create `/apps/manadeck/CLAUDE.md`**
  - [ ] Document backend (port 3009)
  - [ ] Document web app
  - [ ] Document mobile app
  - [ ] Document landing page
  - [ ] Add API endpoints
  - [ ] Add database schema
  - [ ] Add development commands
  - [ ] Add environment variables

- [ ] **Create `/apps/picture/CLAUDE.md`**
  - [ ] Document backend (port 3006)
  - [ ] Document web app
  - [ ] Document mobile app
  - [ ] Document landing page
  - [ ] Add AI image generation details
  - [ ] Add API endpoints
  - [ ] Add development commands
  - [ ] Add environment variables

- [ ] **Create `/apps/quote/CLAUDE.md`**
  - [ ] Document backend
  - [ ] Document web app
  - [ ] Document mobile app
  - [ ] Add API endpoints
  - [ ] Add development commands

### 📝 Issue 3: Update Root CLAUDE.md

**File:** `/CLAUDE.md`

- [ ] **Update Projects Table (lines 31-40)**
  ```markdown
  | Project      | Description                  | Apps                                                      |
  | ------------ | ---------------------------- | --------------------------------------------------------- |
  | **manacore** | Multi-app ecosystem platform | Expo mobile, SvelteKit web, Astro landing                |
  | **manadeck** | Card/deck management         | NestJS backend, Expo mobile, SvelteKit web, Astro landing|
  | **picture**  | AI image generation          | NestJS backend, Expo mobile, SvelteKit web, Astro landing|
  | **chat**     | AI chat application          | NestJS backend, Expo mobile, SvelteKit web, Astro landing|
  | **zitare**   | Daily inspiration quotes     | NestJS backend, Expo mobile, SvelteKit web, Astro landing|
  | **contacts** | Contact management           | NestJS backend, SvelteKit web                            |
  | **calendar** | Calendar & scheduling        | NestJS backend, SvelteKit web, Astro landing             |
  | **clock**    | World clock & timers         | NestJS backend, SvelteKit web, Astro landing             |
  | **todo**     | Task management              | NestJS backend, SvelteKit web                            |
  | **context**  | AI document management       | Expo mobile                                              |
  | **quote**    | Quote management             | NestJS backend, SvelteKit web, Expo mobile               |
  ```

- [ ] **Add missing projects** to table (after resolving duplicates)

- [ ] **Update Development Commands (lines 61-76)**
  ```bash
  # Start specific project (runs all apps in project)
  pnpm run manacore:dev
  pnpm run manadeck:dev
  pnpm run picture:dev
  pnpm run chat:dev
  pnpm run zitare:dev
  pnpm run contacts:dev
  pnpm run calendar:dev    # ADD
  pnpm run clock:dev       # ADD
  pnpm run todo:dev        # ADD
  pnpm run context:dev     # ADD
  # REMOVE: pnpm run presi:dev
  # REMOVE: pnpm run mail:dev
  ```

- [ ] **Update Integrated Backends Table (lines 334-342)**
  ```markdown
  | Backend  | Package                         | Port |
  | -------- | ------------------------------- | ---- |
  | Chat     | `@mana-core/nestjs-integration` | 3002 |
  | Picture  | `@manacore/shared-nestjs-auth`  | 3006 |
  | Zitare   | `@manacore/shared-nestjs-auth`  | 3007 |
  | ManaDeck | `@mana-core/nestjs-integration` | 3009 |
  | Calendar | `@manacore/shared-nestjs-auth`  | 3014 |  # ADD
  | Contacts | `@manacore/shared-nestjs-auth`  | 3015 |  # ADD
  | Clock    | `@manacore/shared-nestjs-auth`  | 3017 |  # ADD
  | Todo     | `@manacore/shared-nestjs-auth`  | 3018 |  # ADD
  # REMOVE: | Presi    | Custom (same pattern)           | 3008 |
  ```

- [ ] **Update Landing Pages Table (lines 470-476)**
  ```markdown
  | Project | Package | Cloudflare Project | URL |
  |---------|---------|-------------------|-----|
  | Chat | `@chat/landing` | `chat-landing` | https://chat-landing.pages.dev |
  | Picture | `@picture/landing` | `picture-landing` | https://picture-landing.pages.dev |
  | ManaCore | `@manacore/landing` | `manacore-landing` | https://manacore-landing.pages.dev |
  | ManaDeck | `@manadeck/landing` | `manadeck-landing` | https://manadeck-landing.pages.dev |
  | Zitare | `@zitare/landing` | `zitare-landing` | https://zitare-landing.pages.dev |
  | Calendar | `@calendar/landing` | `calendar-landing` | https://calendar-landing.pages.dev |  # ADD
  | Clock | `@clock/landing` | `clock-landing` | https://clock-landing.pages.dev |     # ADD
  ```

- [ ] **Update Archived Projects List (lines 42-59)**
  - [ ] Add/remove based on Phase 1 duplicate resolution
  - [ ] Add missing: finance, mail, moodlit
  - [ ] Remove duplicates that were moved to active

- [ ] **Add Games Section** (new section after Projects)
  ```markdown
  ### Game Projects (`games/`)

  | Project      | Description              | Status |
  | ------------ | ------------------------ | ------ |
  | **figgos**   | [Description]            | Active |
  | **mana-games** | [Description]          | Active |
  | **voxelava** | [Description]            | Active |
  | **whopixels** | [Description]           | Active |
  | **worldream** | [Description]           | Active |
  ```

---

## Phase 2: High Priority Fixes (Week 2)

### Update Root CLAUDE.md (continued)

- [ ] **Expand Shared Packages Section (lines 361-381)**
  - [ ] Add missing packages (24 undocumented)
  - [ ] OR: Add note: "See `/packages/README.md` for complete list"
  - [ ] OR: Create table with all 34 packages

### Update Environment Variables Documentation

**File:** `/docs/ENVIRONMENT_VARIABLES.md`

- [ ] Add calendar environment variables
- [ ] Add clock environment variables
- [ ] Add contacts environment variables
- [ ] Add todo environment variables
- [ ] Add quote environment variables
- [ ] Add context environment variables
- [ ] Update table of contents
- [ ] Verify all variables match actual .env files

### Clean Up package.json

**File:** `/package.json`

- [ ] **Remove invalid deploy scripts (lines 154-157)**
  - [ ] Remove: `"deploy:landing:presi"` (landing doesn't exist)
  - [ ] Remove: `"deploy:landing:mail"` (landing doesn't exist)
  - [ ] Remove: `"deploy:landing:moodlit"` (landing doesn't exist)

- [ ] **Update deploy:landing:all script (line 158)**
  - [ ] Remove presi, mail, moodlit
  - [ ] Add calendar, clock if not present

---

## Phase 3: Medium Priority (Weeks 3-4)

### Create Additional Project Documentation

- [ ] **Create `/apps/context/README.md`** (expand beyond CLAUDE.md)
- [ ] **Review/update `/apps/manacore/CLAUDE.md`**
- [ ] **Review/update `/services/mana-core-auth/CLAUDE.md`**

### Create Shared Packages Documentation

- [ ] **Create `/packages/README.md`**
  - [ ] List all 34 packages
  - [ ] Describe purpose of each
  - [ ] Show import patterns
  - [ ] Document inter-package dependencies

### Update .claude Guidelines

**Files in `.claude/guidelines/`**

- [ ] Review authentication.md for accuracy
- [ ] Review database.md - add missing projects
- [ ] Review nestjs-backend.md - add all backends
- [ ] Review expo-mobile.md - add all mobile apps
- [ ] Review sveltekit-web.md - add all web apps

### Create Missing Documentation

- [ ] **Create `/docs/BACKENDS.md`**
  - [ ] Table of all backends
  - [ ] Ports, technologies, database
  - [ ] Dependencies

- [ ] **Create `/docs/LANDING_PAGES.md`**
  - [ ] Deployment workflow
  - [ ] Cloudflare setup
  - [ ] All landing pages

- [ ] **Update `/docs/PROJECT_OVERVIEW.md`**
  - [ ] Ensure all active projects listed
  - [ ] Update statistics

---

## Phase 4: Low Priority (Future)

### Automation & Validation

- [ ] **Create `/scripts/validate-docs.mjs`**
  - [ ] Check all apps/ have CLAUDE.md
  - [ ] Verify ports in docs match actual configs
  - [ ] Check package.json commands exist for all projects
  - [ ] Validate landing pages exist where documented

- [ ] **Create `/scripts/generate-project-list.mjs`**
  - [ ] Auto-generate projects table from filesystem
  - [ ] Output markdown table
  - [ ] Can be used to update root CLAUDE.md

### Version Documentation

- [ ] **Create `/docs/VERSIONS.md`**
  - [ ] React Native version per mobile app
  - [ ] Expo SDK version per mobile app
  - [ ] NestJS version per backend
  - [ ] SvelteKit version per web app
  - [ ] Node.js compatibility

### Testing Documentation

- [ ] Verify all curl examples in CLAUDE.md files work
- [ ] Test all pnpm commands documented
- [ ] Validate all environment variables exist

---

## Verification Checklist

After completing fixes, verify:

- [ ] All 17 active projects are in root CLAUDE.md
- [ ] All 17 active projects have CLAUDE.md files
- [ ] No projects exist in both apps/ and apps-archived/
- [ ] All backend ports are documented
- [ ] All landing pages are accurately documented
- [ ] All pnpm commands work
- [ ] Landing deploy scripts match actual landing pages
- [ ] Archived projects list matches apps-archived/
- [ ] Games section exists with all 5 games
- [ ] Environment variables docs cover all active projects

---

## Progress Tracking

**Started:** [DATE]
**Phase 1 Complete:** [DATE]
**Phase 2 Complete:** [DATE]
**Phase 3 Complete:** [DATE]
**Phase 4 Complete:** [DATE]

**Issues Resolved:** 0/12

### Phase Completion

- [ ] Phase 1: Critical Fixes (3 issues)
- [ ] Phase 2: High Priority (4 issues)
- [ ] Phase 3: Medium Priority (3 issues)
- [ ] Phase 4: Low Priority (2 issues)

---

## Notes

Add any notes about decisions made or blockers encountered:

-
-
-

---

**Tip:** Use this checklist with GitHub issues or a project management tool by converting each section to a separate issue/task.

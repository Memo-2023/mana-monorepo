# ⚡ WEEK 1 ACTION PLAN - CRITICAL FIXES
## ManaCore Monorepo Emergency Response

**Timeline:** Days 1-7
**Total Effort:** 17 hours
**Priority:** CRITICAL
**Owner:** DevOps + Backend Team

---

## 🎯 OBJECTIVE

Resolve the 5 most critical issues that pose immediate security, operational, or productivity risks to the monorepo.

**Success Criteria:**
- ✅ No API keys or secrets committed to git
- ✅ PR validation workflow active and blocking broken code
- ✅ Local development setup works for all projects
- ✅ Pre-commit hooks don't take 10+ minutes
- ✅ Database initialization complete and tested

---

## 📋 TASK BREAKDOWN

### TASK 1: REVOKE EXPOSED API KEYS (CRITICAL SECURITY)

**Priority:** 🔴 P0 (DO FIRST)
**Effort:** 2 hours
**Owner:** DevOps Lead
**Risk:** Active API keys exposed in `.env.development` commit history

#### Steps

1. **Immediately revoke these keys** (30 minutes):
   ```bash
   # Google Gemini API
   Key: AIzaSyApsYQXxN6PuXpF8-7j6MonCACwS0ZxNRc
   Action: Go to https://console.cloud.google.com/apis/credentials
   Revoke and generate new key

   # Azure OpenAI API
   Key: 3082103c9b0d4270a795686ccaa89921
   Action: Go to Azure Portal → Cognitive Services → Regenerate key

   # WorldDream OpenAI
   Key: sk-proj-qdYUVUqNv...
   Action: Go to OpenAI Platform → API Keys → Revoke

   # WorldDream Gemini
   Key: AIzaSyB74aUj1KmJlcjNyT5uUiyDODQ6iYoAOjQ
   Action: Revoke via Google Cloud Console

   # Replicate API
   Key: r8_QlvkstNhIc6NBX1ktpQ6ibvzOE2d2UQ1Emamd
   Action: Go to https://replicate.com/account → Revoke
   ```

2. **Audit API usage logs** (30 minutes):
   - Check for unauthorized usage in the last 30 days
   - Document any suspicious activity
   - Calculate potential exposure cost

3. **Generate new keys** (30 minutes):
   - Create new keys for all services
   - Store in password manager (1Password/LastPass)
   - Document key rotation process

4. **Update local environments** (30 minutes):
   - Create `.env.development.local` with new keys
   - Share securely with team (encrypted)
   - Test all services with new keys

#### Verification

```bash
# Ensure no secrets in tracked files
git grep "AIza" -- '*.env*' '!*.local'  # Should return nothing
git grep "sk-proj" -- '*.env*' '!*.local'  # Should return nothing

# Verify local setup works
pnpm docker:up
pnpm setup:env
pnpm run chat:dev  # Test with new keys
```

#### Files Changed
- `.env.development` - Remove all real keys, add placeholders
- `.env.development.local` - Create with new keys (gitignored)
- `.env.development.example` - Create template for onboarding

---

### TASK 2: IMPLEMENT SECRETS MANAGEMENT

**Priority:** 🔴 P0
**Effort:** 8 hours
**Owner:** DevOps Lead
**Goal:** Never commit secrets to git again

#### Steps

1. **Update `.gitignore`** (15 minutes):
   ```bash
   # Add to root .gitignore
   .env.development.local
   .env.production.local
   .env.staging.local
   .env*.local
   ```

2. **Update `scripts/generate-env.mjs`** (2 hours):
   ```javascript
   // Read from .local files if they exist, otherwise use .env.development
   import fs from 'fs';
   import path from 'path';

   function loadEnvFile(filename) {
     const localPath = filename.replace('.development', '.development.local');
     if (fs.existsSync(localPath)) {
       console.log(`Using ${localPath} (secrets file)`);
       return dotenv.parse(fs.readFileSync(localPath));
     }
     console.log(`Using ${filename} (template file)`);
     return dotenv.parse(fs.readFileSync(filename));
   }

   const sourceEnv = {
     ...loadEnvFile('.env.development'),
     ...loadEnvFile('.env.development.local'),  // Override with secrets
   };
   ```

3. **Add environment variable validation** (3 hours):
   ```bash
   pnpm add -D zod
   ```

   ```javascript
   // scripts/validate-env.mjs
   import { z } from 'zod';

   const envSchema = z.object({
     MANA_CORE_AUTH_URL: z.string().url(),
     POSTGRES_PASSWORD: z.string().min(8),
     GOOGLE_GENAI_API_KEY: z.string().startsWith('AIza').optional(),
     AZURE_OPENAI_API_KEY: z.string().min(20).optional(),
     // ... all required vars
   });

   export function validateEnv(env) {
     const result = envSchema.safeParse(env);
     if (!result.success) {
       console.error('❌ Invalid environment variables:');
       console.error(result.error.format());
       process.exit(1);
     }
     console.log('✅ Environment variables validated');
   }
   ```

4. **Create setup script** (1 hour):
   ```bash
   # scripts/setup-secrets.sh
   #!/bin/bash

   echo "🔐 Setting up secrets for manacore-monorepo"

   if [ ! -f .env.development.local ]; then
     echo "Creating .env.development.local from example..."
     cp .env.development.example .env.development.local
     echo "⚠️  Please fill in your API keys in .env.development.local"
     exit 1
   fi

   echo "✅ Secrets file exists"
   node scripts/generate-env.mjs
   ```

5. **Update documentation** (1 hour):
   ```markdown
   # docs/SECRETS_MANAGEMENT.md

   ## Never Commit Secrets

   1. All API keys go in `.env.development.local` (gitignored)
   2. Template values in `.env.development.example`
   3. Production secrets in GitHub Secrets or Vault

   ## First-Time Setup

   bash
   cp .env.development.example .env.development.local
   # Edit .env.development.local with your keys
   pnpm setup:env

   ```

6. **Test setup** (1 hour):
   ```bash
   # Fresh clone simulation
   rm -rf node_modules .env*
   cp .env.development.example .env.development.local
   # Add test keys
   pnpm install
   pnpm setup:env
   pnpm docker:up
   pnpm run chat:dev
   ```

#### Files Changed
- `.gitignore` - Add `.env*.local`
- `scripts/generate-env.mjs` - Support `.local` files
- `scripts/validate-env.mjs` - NEW (validation)
- `scripts/setup-secrets.sh` - NEW (onboarding)
- `.env.development.example` - NEW (template)
- `.env.development.local` - NEW (gitignored secrets)
- `docs/SECRETS_MANAGEMENT.md` - NEW (documentation)

---

### TASK 3: FIX DATABASE INITIALIZATION

**Priority:** 🔴 P0
**Effort:** 2 hours
**Owner:** Backend Lead
**Goal:** Complete local dev setup with one command

#### Steps

1. **Audit required databases** (30 minutes):
   ```bash
   # Extract all DATABASE_URL from .env.development
   grep "DATABASE_URL" .env.development | grep -o "localhost:5432/[^\"]*" | cut -d'/' -f2 | sort -u
   ```

2. **Update initialization script** (1 hour):
   ```sql
   -- docker/init-db/01-create-databases.sql

   -- Existing (keep these)
   CREATE DATABASE chat;
   CREATE DATABASE voxel_lava;
   CREATE DATABASE storage;
   CREATE DATABASE todo;

   -- Add missing databases
   CREATE DATABASE manacore;
   CREATE DATABASE zitare;
   CREATE DATABASE presi;
   CREATE DATABASE contacts;
   CREATE DATABASE calendar;
   CREATE DATABASE manadeck;
   CREATE DATABASE finance;
   CREATE DATABASE moodlit;
   CREATE DATABASE moods;
   CREATE DATABASE picture;
   CREATE DATABASE nutriphi;
   CREATE DATABASE quote;
   CREATE DATABASE clock;
   CREATE DATABASE context;

   -- Grant privileges to all databases
   DO $$
   DECLARE
     db_name TEXT;
   BEGIN
     FOR db_name IN
       SELECT datname FROM pg_database
       WHERE datname NOT IN ('postgres', 'template0', 'template1')
     LOOP
       EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO manacore', db_name);
     END LOOP;
   END $$;
   ```

3. **Test fresh setup** (30 minutes):
   ```bash
   # Teardown existing
   pnpm docker:down
   docker volume rm manacore-monorepo_postgres_data

   # Fresh start
   pnpm docker:up

   # Verify all databases exist
   docker exec -it manacore-postgres psql -U manacore -c "\l" | grep manacore

   # Should show all 17+ databases
   ```

#### Files Changed
- `docker/init-db/01-create-databases.sql` - Add all missing databases

#### Verification Checklist
- [ ] All databases from `.env.development` are created
- [ ] `manacore` user has access to all databases
- [ ] Fresh `pnpm docker:up` creates all databases
- [ ] `pnpm run chat:dev` connects successfully
- [ ] No manual database creation needed

---

### TASK 4: ENABLE CI PR VALIDATION

**Priority:** 🔴 P0
**Effort:** 4 hours
**Owner:** DevOps Lead
**Goal:** Block broken code from merging to main

#### Steps

1. **Restore PR workflow** (30 minutes):
   ```bash
   mv .github/workflows/ci-pull-request.yml.bak .github/workflows/ci-pull-request.yml
   ```

2. **Update workflow** (2 hours):
   ```yaml
   # .github/workflows/ci-pull-request.yml
   name: CI - Pull Request Validation

   on:
     pull_request:
       branches: [main, dev]

   jobs:
     validate:
       name: Code Quality Checks
       runs-on: ubuntu-latest
       timeout-minutes: 20

       steps:
         - name: Checkout code
           uses: actions/checkout@v4

         - name: Setup pnpm
           uses: pnpm/action-setup@v2
           with:
             version: 9.15.0

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install --frozen-lockfile

         - name: Format check
           run: pnpm format:check

         - name: Lint
           run: pnpm lint

         - name: Type check
           run: pnpm type-check
           timeout-minutes: 10

         # Uncomment when tests exist
         # - name: Test
         #   run: pnpm test
         #   timeout-minutes: 15

         # - name: Upload coverage
         #   uses: codecov/codecov-action@v3
         #   with:
         #     files: ./coverage/lcov.info

     security:
       name: Security Scan
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v4

         - name: Run npm audit
           run: |
             pnpm audit --prod --audit-level=high
             # Don't fail on audit issues yet (too many)
           continue-on-error: true
   ```

3. **Add branch protection rules** (1 hour):
   - Go to GitHub repo → Settings → Branches
   - Add rule for `main` and `dev`:
     - ✅ Require status checks to pass
     - ✅ Require `validate` job to pass
     - ✅ Require up-to-date branches
     - ✅ Include administrators

4. **Test workflow** (30 minutes):
   ```bash
   # Create test PR
   git checkout -b test/ci-validation
   echo "test" >> README.md
   git add README.md
   git commit -m "test: CI validation"
   git push origin test/ci-validation

   # Create PR on GitHub
   # Verify workflow runs
   # Verify PR blocked if checks fail
   ```

#### Files Changed
- `.github/workflows/ci-pull-request.yml` - Restored and updated
- GitHub branch protection rules (via UI)

#### Verification Checklist
- [ ] PR workflow runs on new PRs
- [ ] Format check fails on bad formatting
- [ ] Lint check fails on linting errors
- [ ] Type check completes in <10 minutes
- [ ] PR cannot be merged if checks fail

---

### TASK 5: FIX PRE-COMMIT HOOK PERFORMANCE

**Priority:** 🟡 P1
**Effort:** 1 hour
**Owner:** DevOps Lead
**Goal:** Pre-commit takes <30 seconds (not 10+ minutes)

#### Steps

1. **Update pre-commit hook** (30 minutes):
   ```bash
   # .husky/pre-commit
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   # Run lint-staged (only on changed files)
   pnpm exec lint-staged

   # REMOVED: pnpm run type-check (too slow, move to CI)
   ```

2. **Update lint-staged config** (30 minutes):
   ```json
   // package.json
   {
     "lint-staged": {
       "*.{ts,tsx,js,jsx}": [
         "eslint --fix --max-warnings=0",
         "prettier --write"
       ],
       "*.{json,md,yml,yaml}": [
         "prettier --write"
       ],
       "*.{svelte}": [
         "eslint --fix --max-warnings=0",
         "prettier --plugin prettier-plugin-svelte --write"
       ],
       "*.{astro}": [
         "prettier --plugin prettier-plugin-astro --write"
       ]
     }
   }
   ```

#### Files Changed
- `.husky/pre-commit` - Remove global type-check
- `package.json` - Update lint-staged config

#### Verification
```bash
# Make a small change
echo "// test" >> apps/chat/apps/backend/src/main.ts

# Stage and commit
git add apps/chat/apps/backend/src/main.ts
time git commit -m "test: pre-commit performance"

# Should complete in <30 seconds
```

---

## 📊 PROGRESS TRACKING

### Daily Standup Template

**Day 1 (Security Crisis Day):**
- [ ] TASK 1: Revoke exposed API keys (2h)
- [ ] TASK 2: Start secrets management (4h/8h)

**Day 2 (Security Completion):**
- [ ] TASK 2: Finish secrets management (4h/8h)
- [ ] TASK 3: Fix database initialization (2h)

**Day 3 (CI/CD Setup):**
- [ ] TASK 4: Enable CI PR validation (4h)
- [ ] TASK 5: Fix pre-commit performance (1h)

**Day 4 (Testing & Verification):**
- [ ] Test all fixes
- [ ] Update documentation
- [ ] Team demo

### Verification Commands

```bash
# Security verification
git log --all --full-history -- .env.development | grep -i "api.*key"  # Should be empty in new commits
grep -r "AIza\|sk-proj" .env* --exclude="*.local" --exclude="*.example"  # Should be empty

# Database verification
docker exec -it manacore-postgres psql -U manacore -c "\l" | wc -l  # Should show 17+ databases

# CI verification
gh pr checks <pr-number>  # All checks should pass

# Pre-commit verification
time git commit --allow-empty -m "test"  # Should be <30s
```

---

## 🎯 SUCCESS METRICS

### Week 1 Goals

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Secrets in git | ✅ Yes (CRITICAL) | ❌ No | ___ |
| PR validation | ❌ Disabled | ✅ Active | ___ |
| Database setup time | 2+ hours (manual) | 5 minutes (automated) | ___ |
| Pre-commit duration | 10+ minutes | <30 seconds | ___ |
| Local dev setup | Broken for new devs | One-command setup | ___ |

### Definition of Done

- [ ] ✅ All API keys revoked and rotated
- [ ] ✅ Secrets in `.env.development.local` (gitignored)
- [ ] ✅ Environment validation script works
- [ ] ✅ Fresh `git clone` + `pnpm install` sets up everything
- [ ] ✅ All 17+ databases created on `pnpm docker:up`
- [ ] ✅ PR workflow active and blocking broken code
- [ ] ✅ Pre-commit hook completes in <30s
- [ ] ✅ Documentation updated
- [ ] ✅ Team trained on new workflow

---

## 📚 DOCUMENTATION UPDATES

### Files to Update

1. **ROOT README.md:**
   ```markdown
   ## First-Time Setup

   1. Clone the repository
   2. Copy `.env.development.example` to `.env.development.local`
   3. Fill in your API keys in `.env.development.local`
   4. Run `pnpm install`
   5. Run `pnpm docker:up`
   6. Start developing: `pnpm run chat:dev`

   **IMPORTANT:** Never commit `.env.development.local` - it contains secrets!
   ```

2. **docs/ENVIRONMENT_VARIABLES.md:**
   - Add section on secrets management
   - Explain `.local` file pattern
   - Document validation process

3. **CLAUDE.md:**
   - Update environment variables section
   - Add security best practices
   - Document CI/CD workflow

---

## 🚨 ROLLBACK PLAN

If anything goes wrong:

1. **API Keys Broken:**
   ```bash
   # Restore from password manager
   # Update .env.development.local
   pnpm setup:env
   ```

2. **Database Init Broken:**
   ```bash
   # Restore old SQL file from git
   git checkout HEAD~1 docker/init-db/01-create-databases.sql
   pnpm docker:down
   pnpm docker:up
   ```

3. **CI Workflow Broken:**
   ```bash
   # Disable workflow temporarily
   mv .github/workflows/ci-pull-request.yml .github/workflows/ci-pull-request.yml.bak
   git add .github/workflows/ci-pull-request.yml.bak
   git commit -m "fix: disable CI temporarily"
   ```

---

## 🎓 POST-WEEK 1 RETROSPECTIVE

### Questions to Answer

1. What went well?
2. What took longer than expected?
3. What did we learn about our system?
4. What should we prioritize next?
5. How can we prevent similar issues?

### Next Steps Planning

- Review Week 2-4 action plan (testing foundation)
- Allocate resources for testing sprint
- Set up coverage tracking
- Schedule daily standups for testing work

---

**END OF WEEK 1 ACTION PLAN**

*Priority: CRITICAL*
*Total Effort: 17 hours*
*Timeline: Days 1-7*
*Success Criteria: All tasks completed and verified*

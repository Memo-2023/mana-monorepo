# Summary: Fixing npm ci SSH Authentication in GitHub Actions

## 🔴 What We Tried (That Didn't Work)

### Attempt 1: Git Config URL Rewriting
**What we did:**
```yaml
- name: Configure git for private packages
  run: |
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "git@github.com:"
```

**Why it failed:**
- npm ci reads URLs directly from `package-lock.json`
- npm's internal git client doesn't reliably honor git config `url.insteadOf` rules
- npm fell back to SSH when it couldn't authenticate via HTTPS

### Attempt 2: Invalid .npmrc Configuration
**What we did:**
```
# backend/.npmrc
git-ssh-url = https://github.com/
```

**Why it failed:**
- `git-ssh-url` is not a valid npm configuration option
- npm doesn't recognize this setting

### Attempt 3: Reordering Steps (Git Config Before Node Setup)
**What we did:**
- Moved git config step before `actions/setup-node`
- Added npm cache clearing

**Why it failed:**
- While this helped with caching issues, it didn't solve the root problem
- npm ci still ignored git config and used lockfile URLs directly

### Attempt 4: persist-credentials: false
**What we did:**
```yaml
- uses: actions/checkout@v4
  with:
    persist-credentials: false
```

**Why it failed (partially):**
- This fixed the token override issue (actions/checkout was setting default GITHUB_TOKEN)
- But npm ci still couldn't authenticate because the lockfile URL had no token

### Attempt 5: Local Git Config Override
**What we did:**
```bash
# Try to override global SSH rewrites with local HTTPS config
cd project-root
git config --local url."https://github.com/".insteadOf "git@github.com:"
git config --local url."https://github.com/".insteadOf "ssh://git@github.com/"
rm package-lock.json
npm install
```

**Why it failed:**
- npm's internal git client doesn't consistently honor local git config during package resolution
- Even with correct local config, npm still generated SSH URLs in `package-lock.json`
- The git config order of precedence (local > global > system) doesn't reliably apply to npm's git subprocess
- Testing with `git ls-remote` worked (used HTTPS), but `npm install` still wrote SSH URLs to lockfile
- **Key insight**: npm may use a different git execution context that bypasses local config

---

## ✅ What Finally Worked

### The Root Cause
**npm ci uses URLs from package-lock.json directly and ignores git config url.insteadOf**

Even though:
- ✅ package.json had `git+https://github.com/...`
- ✅ package-lock.json had `git+https://github.com/...` (no SSH)
- ✅ git config was properly set

npm would run:
```bash
git ls-remote https://github.com/Memo-2023/mana-core-nestjs-package.git
```

This failed with "Permission denied" because:
1. The URL had no authentication token
2. npm fell back to SSH (which wasn't configured)
3. Git config rewrites were ignored by npm's git subprocess

### The Solution: Runtime Token Injection

**Step 1: Prevent Token Override**
```yaml
- uses: actions/checkout@v4
  with:
    persist-credentials: false  # Don't let default GITHUB_TOKEN interfere
```

**Step 2a: If lockfile has HTTPS URLs - Verify and Inject Token**
```yaml
- name: Verify no SSH URLs in lockfile
  run: |
    if grep -q "git@github.com\|ssh://git@github.com" package-lock.json; then
      echo "❌ ERROR: SSH URLs found in package-lock.json"
      exit 1
    fi
    echo "✓ No SSH URLs found in package-lock.json"

- name: Inject token into package-lock.json
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    sed -i "s|https://github.com/Memo-2023/|https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
```

**Step 2b: If lockfile has SSH URLs - Patch to HTTPS with Token**
```yaml
- name: Patch SSH URLs to HTTPS with token
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    if grep -q "git+ssh://git@github.com" package-lock.json; then
      echo "⚠️  SSH URLs found - patching to HTTPS with token..."
      sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Lockfile patched successfully"
    else
      echo "⚠️  No SSH URLs found - patching HTTPS URLs with token..."
      sed -i "s|https://github.com/Memo-2023/|https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Token injected successfully"
    fi
```

> **Note**: Use Step 2a if you can generate HTTPS lockfiles locally. Use Step 2b if your local git config always generates SSH URLs (accepts either format).

**Step 4: Run npm ci**
```yaml
- name: Install dependencies
  run: npm ci
```

### Why This Works

1. **Direct URL Authentication**: Token is embedded in the URL that npm ci reads
2. **No Reliance on Git Config**: Doesn't depend on git config which npm ignores
3. **Just-in-Time**: Token is injected at runtime, never committed to repo
4. **Consistent Behavior**: Works across npm v7, v8, v9+ and all CI environments

### The Execution Order (Critical)
```
1. Checkout (persist-credentials: false)
2. Configure git (defense in depth, may help in edge cases)
3. Verify no SSH URLs (fail fast if lockfile is corrupted)
4. Setup Node.js (restore npm cache)
5. Inject token into package-lock.json ← THE KEY STEP
6. npm ci (now has authenticated URL from lockfile)
```

---

## 📊 Key Learnings

| Issue | What We Learned |
|-------|----------------|
| Git config ignored | npm ci reads package-lock.json directly, bypasses git config |
| persist-credentials | Default checkout token can override custom PAT config |
| npm v7+ behavior | Modern npm converts HTTPS to SSH for private repos if auth fails |
| Token placement | Must inject token into lockfile URL, not just configure git |
| sed is reliable | Runtime patching with sed is more reliable than git rewrites |
| Local git config fails | npm's git subprocess doesn't honor local config consistently - even `git ls-remote` works but `npm install` still writes SSH |
| Don't fight it locally | Stop trying to generate HTTPS lockfiles locally - accept SSH and patch in CI |

## 🎯 The One-Liner That Fixed It

**For HTTPS lockfiles:**
```bash
sed -i "s|https://github.com/Memo-2023/|https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
```

**For SSH lockfiles (if your local git config generates SSH URLs):**
```bash
sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
```

These commands ensure npm gets an authenticated HTTPS URL, preventing the SSH fallback entirely.

---

## 📝 Complete Working Workflow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Configure git for private packages
        env:
          GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
        run: |
          git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/
          git config --global url."https://${GH_TOKEN}@github.com/".insteadOf git@github.com:

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'

      - name: Patch package-lock.json with authenticated URLs
        env:
          GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
        run: |
          cd backend
          # Handle both SSH and HTTPS URLs
          if grep -q "git+ssh://git@github.com" package-lock.json; then
            echo "⚠️  SSH URLs found - patching to HTTPS with token..."
            sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
            echo "✓ Lockfile patched successfully"
          else
            echo "⚠️  HTTPS URLs found - injecting token..."
            sed -i "s|https://github.com/Memo-2023/|https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
            echo "✓ Token injected successfully"
          fi

      - name: Clear npm cache (if needed)
        run: npm cache clean --force || true

      - name: Install dependencies
        run: |
          cd backend
          npm ci --loglevel verbose
```

---

## 🔧 Required GitHub Secrets

Make sure you have set up in your repository:

- `GH_PERSONAL_TOKEN`: Personal Access Token with repo access
  - Scope: `repo` (Full control of private repositories)
  - Used for: Accessing private npm git dependencies

---

## 🎓 References

- [npm/cli Issue #2610](https://github.com/npm/cli/issues/2610) - NPM v7 uses SSH instead of explicit HTTPS
- [GitHub Community Discussion #25936](https://github.com/orgs/community/discussions/25936) - Installing private GitHub repos via npm in GitHub Actions
- [Stack Overflow: npm ignores git+https setting](https://stackoverflow.com/questions/69725809/npm-ignores-githttps-setting-and-uses-gitssh-in-package-lock-json)

---

---

## 🆕 Update: Handling SSH URLs in Lockfile (2025-09-30)

If your local git config **always** generates SSH URLs in `package-lock.json` (despite attempts to fix it locally), you have two options:

### Option 1: Accept SSH and Patch in CI (Recommended)
1. **Stop fighting with local git config** - it's unreliable
2. **Commit the lockfile with SSH URLs** as-is
3. **Use the flexible sed command** in CI that handles both SSH and HTTPS:

```yaml
- name: Patch package-lock.json with authenticated URLs
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    cd backend
    if grep -q "git+ssh://git@github.com" package-lock.json; then
      sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
    else
      sed -i "s|https://github.com/Memo-2023/|https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
    fi
```

### Option 2: Force HTTPS Locally (Fragile)
If you insist on HTTPS lockfiles, you must ensure NO global git config rewrites exist:

```bash
# Check for problematic rewrites
git config --global --get-regexp url

# Remove them
git config --global --unset-all url."git@github.com:".insteadOf
git config --global --unset-all url."ssh://git@github.com/".insteadOf

# Regenerate lockfile
rm package-lock.json
npm install
```

**Warning**: This changes your global git config and may break other workflows where you prefer SSH.

---

**Date Fixed:** 2025-09-29
**Commit:** `5cce473` - fix: inject PAT token into package-lock.json for npm ci

**Updated:** 2025-09-30 - Added SSH lockfile handling documentation
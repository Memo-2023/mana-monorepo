# SSH URLs in package-lock.json - The Complete Solution

## TL;DR

**Two-layer approach:**
1. **CI test stage**: Patch lockfile SSH → HTTPS for `npm ci` (for tests)
2. **Docker build**: Clone private repo, build tarball, replace with `file:` (for production image)

## The Problem

Your local machine converts HTTPS → SSH during `npm install`, baking SSH URLs into `package-lock.json`. CI/CD fails because it can't authenticate via SSH.

## Why Fighting It Locally Doesn't Work

❌ **Approach 1**: "Fix package.json to use HTTPS"
- Doesn't work if git config rewrites it during install

❌ **Approach 2**: "Remove SSH rewrites from git config"
- Inconvenient for developers
- Easy to forget
- Breaks other workflows

❌ **Approach 3**: "Temporarily disable git config during install"
- Doesn't persist
- Every developer needs to remember

## ✅ The Complete Solution (Two-Layer Approach)

**Accept that the lockfile has SSH URLs and handle them at two stages:**

### Layer 1: CI Test Stage (For Running Tests)

The GitHub Actions workflow uses the proven pattern to handle both SSH and HTTPS URLs:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    persist-credentials: false  # Don't let default GITHUB_TOKEN interfere

- name: Configure git for private packages
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf git@github.com:

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'

- name: Patch package-lock.json with authenticated URLs
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    # Handle both SSH and HTTPS URLs
    if grep -q "git+ssh://git@github.com" package-lock.json; then
      echo "⚠️  SSH URLs found - patching to HTTPS with token..."
      sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Lockfile patched successfully"
    else
      echo "⚠️  HTTPS URLs found - injecting token..."
      sed -i "s|git+https://github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Token injected successfully"
    fi

- name: Install dependencies
  run: npm ci --legacy-peer-deps
```

### Layer 2: Docker Build (For Production Image)

The Dockerfile clones the private repo, builds it as a tarball, and installs from `file:`:

```dockerfile
# Clone, build and package mana-core as a tarball
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
        export GITHUB_TOKEN=$(cat /run/secrets/github_token) && \
        git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    fi && \
    cd /tmp/mana-core && \
    npm install --force && \
    npm run build && \
    npm pack && \
    mv *.tgz /app/mana-core.tgz

# Copy package.json and replace GitHub URL with the tarball
COPY package.json ./
RUN sed -i 's|"git+https://github.com/Memo-2023/mana-core-nestjs-package.git"|"file:mana-core.tgz"|g' package.json

# Install dependencies from tarball
RUN npm install --legacy-peer-deps
```

The GitHub Actions workflow passes the token as a Docker secret:

```yaml
- name: Build and Push Docker Image
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    docker build \
      --secret id=github_token,env=GH_TOKEN \
      .
```

## Why This Works

1. **Developers**: Use SSH locally (convenient, no config changes needed)
2. **package-lock.json**: Contains SSH URLs (fine, we handle it in CI)
3. **CI Test Stage**: Patches SSH → HTTPS for `npm ci` to run tests
4. **Docker Build**: Clones repo, builds tarball, installs from `file:` (no git involved in final image)
5. **Production**: Docker image has mana-core built into it, no runtime git dependency
6. **Everyone's happy**: No git config changes, no local workflow disruption

## Key Implementation Details

### For CI Test Stage (sed patching)

```bash
sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
```

- Happens at runtime in CI (never committed)
- Allows `npm ci` to install dependencies for testing
- Works reliably every time

### For Docker Build (tarball approach)

```bash
# Docker secret gives access to GitHub token
--mount=type=secret,id=github_token

# Clone and build the private package
git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git
npm pack  # Creates .tgz file

# Replace git URL with local file reference
sed -i 's|"git+https://..."|"file:mana-core.tgz"|g' package.json
```

- Private package is baked into the Docker image
- No git dependency at runtime
- Production image is fully self-contained

## Why This is Better Than Alternatives

| Approach | Developer Impact | Reliability | Production Quality | Maintenance |
|----------|-----------------|-------------|-------------------|-------------|
| Fix git config locally | 😡 High | 🔴 Low | ⚠️ Medium | 😱 High |
| Require HTTPS in lockfile | 😡 High | 🔴 Low | ⚠️ Medium | 😱 High |
| **Two-layer (sed + tarball)** | 😊 None | 🟢 100% | ✅ Excellent | 😌 None |

## Lessons Learned

1. **npm ci reads package-lock.json directly** - It doesn't care about git config
2. **Fighting developer workflows is futile** - Accept SSH URLs locally
3. **Two layers solve different problems**:
   - CI test stage needs quick install for testing → sed patch
   - Production image needs reliability and security → tarball bake-in
4. **Docker secrets are the right tool** - Pass credentials without committing them
5. **Self-contained images are better** - No runtime git dependencies

## References

This solution combines proven approaches:
- **sed patching**: Used in `storyteller-project` for CI/CD
- **tarball approach**: Used in memoro-service for production Docker images
- Battle-tested across multiple projects

---

**Bottom line**: Commit the SSH lockfile, handle it in two layers (CI + Docker). Done. 🎯

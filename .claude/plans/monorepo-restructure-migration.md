# Monorepo Restructure Migration Plan

## Target Structure

```
manacore-monorepo/
├── apps/                              # All product applications
│   ├── chat/
│   │   ├── apps/
│   │   │   ├── backend/               # NestJS API (@chat/backend)
│   │   │   ├── mobile/                # Expo (@chat/mobile)
│   │   │   ├── web/                   # SvelteKit (@chat/web)
│   │   │   └── landing/               # Astro (@chat/landing)
│   │   ├── packages/
│   │   │   └── chat-types/            # Shared types (@chat/types)
│   │   ├── package.json
│   │   └── CLAUDE.md
│   │
│   ├── maerchenzauber/
│   │   ├── apps/
│   │   │   ├── backend/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   ├── cards/
│   │   ├── apps/
│   │   │   ├── backend/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   ├── memoro/
│   │   ├── apps/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   ├── picture/
│   │   ├── apps/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   ├── nutriphi/
│   │   ├── apps/
│   │   │   ├── backend/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   ├── uload/
│   │   ├── apps/
│   │   │   ├── backend/
│   │   │   └── web/
│   │   └── packages/
│   │
│   ├── news/
│   │   ├── apps/
│   │   │   ├── api/
│   │   │   ├── mobile/
│   │   │   ├── web/
│   │   │   └── landing/
│   │   └── packages/
│   │
│   └── manacore/
│       ├── apps/
│       │   ├── mobile/
│       │   ├── web/
│       │   └── landing/
│       └── packages/
│
├── services/                          # Standalone microservices
│   └── mana-core-auth/                # Central auth service
│       ├── src/
│       ├── postgres/
│       ├── Dockerfile
│       └── package.json
│
├── packages/                          # Monorepo-wide shared packages
│   ├── shared-auth/
│   ├── shared-types/
│   ├── shared-utils/
│   └── ... (24 packages)
│
├── docker/
│   ├── init-db/
│   ├── prometheus/
│   ├── grafana/
│   └── minio/
│
├── docker-compose.dev.yml
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Phase 1: Preparation (Pre-Migration)

### 1.1 Create backup branch

```bash
git checkout -b backup/pre-restructure
git push origin backup/pre-restructure
git checkout main
git checkout -b feat/monorepo-restructure
```

### 1.2 Create target directories

```bash
mkdir -p apps
mkdir -p services
```

---

## Phase 2: Move Product Applications

### 2.1 Move projects to apps/ folder

| Source            | Destination            |
| ----------------- | ---------------------- |
| `chat/`           | `apps/chat/`           |
| `maerchenzauber/` | `apps/maerchenzauber/` |
| `cards/`       | `apps/cards/`       |
| `memoro/`         | `apps/memoro/`         |
| `picture/`        | `apps/picture/`        |
| `nutriphi/`       | `apps/nutriphi/`       |
| `uload/`          | `apps/uload/`          |
| `news/`           | `apps/news/`           |
| `manacore/`       | `apps/manacore/`       |

```bash
# Move all products to apps/
git mv chat apps/chat
git mv maerchenzauber apps/maerchenzauber
git mv cards apps/cards
git mv memoro apps/memoro
git mv picture apps/picture
git mv nutriphi apps/nutriphi
git mv uload apps/uload
git mv news apps/news
git mv manacore apps/manacore
```

### 2.2 Restructure backends to apps/ subfolder

Projects with backends at root level need restructuring:

| Source                   | Destination                   |
| ------------------------ | ----------------------------- |
| `apps/chat/backend/`     | `apps/chat/apps/backend/`     |
| `apps/cards/backend/` | `apps/cards/apps/backend/` |
| `apps/nutriphi/backend/` | `apps/nutriphi/apps/backend/` |

```bash
# Chat: move backend into apps/
mkdir -p apps/chat/apps
git mv apps/chat/backend apps/chat/apps/backend

# Cards: move backend into apps/
mkdir -p apps/cards/apps
git mv apps/cards/backend apps/cards/apps/backend

# Nutriphi: move backend into apps/
mkdir -p apps/nutriphi/apps
git mv apps/nutriphi/backend apps/nutriphi/apps/backend
```

### 2.3 Move mana-core-auth to services/

```bash
git mv mana-core-auth services/mana-core-auth
```

---

## Phase 3: Update Configuration Files

### 3.1 Update pnpm-workspace.yaml

**New content:**

```yaml
packages:
  # Product applications
  - 'apps/*'
  - 'apps/*/apps/*'
  - 'apps/*/packages/*'

  # Standalone services
  - 'services/*'

  # Shared packages
  - 'packages/*'
```

### 3.2 Update turbo.json

No changes needed - turbo.json uses task definitions, not paths.

### 3.3 Update root package.json scripts

**Replace scripts section:**

```json
{
	"scripts": {
		"dev": "turbo run dev",
		"build": "turbo run build",
		"test": "turbo run test",
		"lint": "turbo run lint",
		"type-check": "turbo run type-check",
		"clean": "turbo run clean",
		"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,svelte,astro}\"",
		"format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,svelte,astro}\"",

		"maerchenzauber:dev": "turbo run dev --filter=@maerchenzauber/*...",
		"manacore:dev": "turbo run dev --filter=@manacore/*...",
		"cards:dev": "turbo run dev --filter=@cards/*...",
		"memoro:dev": "turbo run dev --filter=@memoro/*...",
		"picture:dev": "turbo run dev --filter=@picture/*...",
		"uload:dev": "turbo run dev --filter=@uload/*...",
		"chat:dev": "turbo run dev --filter=@chat/*...",
		"nutriphi:dev": "turbo run dev --filter=@nutriphi/*...",
		"news:dev": "turbo run dev --filter=@news/*...",

		"dev:maerchenzauber:web": "pnpm --filter @maerchenzauber/web dev",
		"dev:maerchenzauber:landing": "pnpm --filter @maerchenzauber/landing dev",
		"dev:maerchenzauber:backend": "pnpm --filter @maerchenzauber/backend dev",
		"dev:maerchenzauber:mobile": "pnpm --filter @maerchenzauber/mobile dev",
		"dev:maerchenzauber:app": "turbo run dev --filter=@maerchenzauber/web --filter=@maerchenzauber/backend",

		"dev:manacore:web": "pnpm --filter @manacore/web dev",
		"dev:manacore:landing": "pnpm --filter @manacore/landing dev",
		"dev:manacore:mobile": "pnpm --filter @manacore/mobile dev",

		"dev:cards:web": "pnpm --filter @cards/web dev",
		"dev:cards:landing": "pnpm --filter @cards/landing dev",
		"dev:cards:backend": "pnpm --filter @cards/backend dev",
		"dev:cards:mobile": "pnpm --filter @cards/mobile dev",
		"dev:cards:app": "turbo run dev --filter=@cards/web --filter=@cards/backend",

		"dev:memoro:web": "pnpm --filter @memoro/web dev",
		"dev:memoro:landing": "pnpm --filter @memoro/landing dev",
		"dev:memoro:mobile": "pnpm --filter @memoro/mobile dev",

		"dev:picture:web": "pnpm --filter @picture/web dev",
		"dev:picture:landing": "pnpm --filter @picture/landing dev",
		"dev:picture:mobile": "pnpm --filter @picture/mobile dev",

		"dev:uload:web": "pnpm --filter @uload/web dev",

		"dev:chat:mobile": "pnpm --filter @chat/mobile dev",
		"dev:chat:web": "pnpm --filter @chat/web dev",
		"dev:chat:landing": "pnpm --filter @chat/landing dev",
		"dev:chat:backend": "pnpm --filter @chat/backend start:dev",
		"dev:chat:app": "turbo run dev --filter=@chat/web --filter=@chat/backend",

		"dev:nutriphi:mobile": "pnpm --filter @nutriphi/mobile dev",
		"dev:nutriphi:web": "pnpm --filter @nutriphi/web dev",
		"dev:nutriphi:landing": "pnpm --filter @nutriphi/landing dev",
		"dev:nutriphi:backend": "pnpm --filter @nutriphi/backend start:dev",
		"dev:nutriphi:app": "turbo run dev --filter=@nutriphi/web --filter=@nutriphi/backend",

		"dev:news:mobile": "pnpm --filter @news/mobile dev",
		"dev:news:web": "pnpm --filter @news/web dev",
		"dev:news:landing": "pnpm --filter @news/landing dev",
		"dev:news:api": "pnpm --filter @news/api start:dev",
		"dev:news:app": "turbo run dev --filter=@news/web --filter=@news/api",
		"news:db:push": "pnpm --filter @manacore/news-database db:push",
		"news:db:studio": "pnpm --filter @manacore/news-database db:studio",

		"docker:up": "docker compose -f docker-compose.dev.yml up -d postgres redis",
		"docker:up:auth": "docker compose -f docker-compose.dev.yml --profile auth up -d",
		"docker:up:chat": "docker compose -f docker-compose.dev.yml --profile chat up -d",
		"docker:up:all": "docker compose -f docker-compose.dev.yml --profile all up -d",
		"docker:down": "docker compose -f docker-compose.dev.yml --profile all down",
		"docker:logs": "docker compose -f docker-compose.dev.yml logs -f",
		"docker:logs:auth": "docker compose -f docker-compose.dev.yml logs -f mana-core-auth",
		"docker:logs:chat": "docker compose -f docker-compose.dev.yml logs -f chat-backend",
		"docker:ps": "docker compose -f docker-compose.dev.yml ps -a",
		"docker:clean": "docker compose -f docker-compose.dev.yml --profile all down -v"
	}
}
```

---

## Phase 4: Update Docker Configuration

### 4.1 Update docker-compose.dev.yml

**Key changes:**

- mana-core-auth Dockerfile path: `./services/mana-core-auth/Dockerfile`
- chat-backend Dockerfile path: `./apps/chat/apps/backend/Dockerfile`

```yaml
services:
  # ... postgres and redis unchanged ...

  mana-core-auth:
    profiles: ['auth', 'all']
    build:
      context: .
      dockerfile: ./services/mana-core-auth/Dockerfile
    # ... rest unchanged ...

  chat-backend:
    profiles: ['chat', 'all']
    build:
      context: .
      dockerfile: ./apps/chat/apps/backend/Dockerfile
    # ... rest unchanged ...
```

### 4.2 Update individual Dockerfiles

Each Dockerfile needs path updates for COPY commands.

**services/mana-core-auth/Dockerfile:**

```dockerfile
# Update COPY paths
COPY services/mana-core-auth/package.json ./services/mana-core-auth/
COPY packages/ ./packages/
# etc.
```

**apps/chat/apps/backend/Dockerfile:**

```dockerfile
# Update COPY paths
COPY apps/chat/apps/backend/package.json ./apps/chat/apps/backend/
COPY apps/chat/packages/ ./apps/chat/packages/
COPY packages/ ./packages/
# etc.
```

---

## Phase 5: Update Internal References

### 5.1 Update CLAUDE.md files

Each project's CLAUDE.md needs path updates in documentation.

### 5.2 Update relative imports in code

Check for any hardcoded relative paths like:

- `../../packages/`
- `../../../shared/`

These may need adjustment.

### 5.3 Update .env files

Environment files should still work but verify paths for:

- File-based configs
- Volume mounts
- Any path references

---

## Phase 6: Validation & Testing

### 6.1 Reinstall dependencies

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### 6.2 Verify workspace packages

```bash
pnpm ls -r --depth 0
```

### 6.3 Test turbo commands

```bash
pnpm chat:dev        # Should start all chat apps
pnpm dev:chat:web    # Should start just web
pnpm type-check      # Should check all projects
```

### 6.4 Test Docker

```bash
pnpm docker:up:all
pnpm docker:ps
pnpm docker:logs
```

### 6.5 Build all projects

```bash
pnpm build
```

---

## Phase 7: Commit & Merge

### 7.1 Commit changes

```bash
git add .
git commit -m "refactor: restructure monorepo with apps/ and services/ directories

- Move all product applications under apps/
- Move standalone microservices under services/
- Standardize backend location to apps/{project}/apps/backend/
- Update pnpm-workspace.yaml for new structure
- Update docker-compose paths
- Update root package.json scripts"
```

### 7.2 Create PR

```bash
gh pr create --title "refactor: monorepo restructure" --body "..."
```

---

## Rollback Plan

If issues arise:

```bash
git checkout main
git branch -D feat/monorepo-restructure
```

---

## Migration Checklist

- [ ] Create backup branch
- [ ] Create apps/ and services/ directories
- [ ] Move 9 product projects to apps/
- [ ] Move backends into apps/{project}/apps/backend/
- [ ] Move mana-core-auth to services/
- [ ] Update pnpm-workspace.yaml
- [ ] Update root package.json scripts
- [ ] Update docker-compose.dev.yml paths
- [ ] Update docker-compose.yml paths (production)
- [ ] Update Dockerfiles COPY paths
- [ ] Update CLAUDE.md documentation
- [ ] Reinstall dependencies (pnpm install)
- [ ] Test turbo dev commands
- [ ] Test Docker builds
- [ ] Run type-check
- [ ] Run build
- [ ] Commit and create PR

---

## Estimated Impact

| Item                   | Count                |
| ---------------------- | -------------------- |
| Directories to move    | 10                   |
| Config files to update | 5-6                  |
| Dockerfiles to update  | ~6                   |
| package.json scripts   | ~40 (most unchanged) |
| CLAUDE.md files        | ~10                  |

**Risk Level:** Medium - Many file moves but package names unchanged
**Estimated Time:** 2-4 hours with testing

# Test Config Agent

## Module Information

**Package:** `@manacore/test-config`
**Type:** Test Configuration Package
**Version:** 0.1.0
**Location:** `/packages/test-config`

Provides centralized test configurations for all testing frameworks used in the ManaCore monorepo: Jest (backend + mobile), Vitest (shared packages + web), and Playwright (E2E testing). Ensures consistent test behavior, coverage thresholds, and best practices across all projects.

## Identity

I am the Test Configuration Specialist. I manage all testing configurations across the monorepo, ensuring consistent test setup, coverage standards, and best practices for Jest (NestJS backends, React Native mobile), Vitest (shared packages, SvelteKit web), and Playwright (E2E tests).

## Expertise

### Core Responsibilities
- Jest configuration for NestJS backends
- Jest configuration for React Native/Expo mobile apps
- Vitest configuration for shared TypeScript packages
- Vitest configuration for SvelteKit web apps (with jsdom)
- Playwright configuration for E2E browser tests
- Coverage threshold enforcement (80% across all metrics)
- Test environment setup and best practices

### Technical Knowledge
- **Jest:** 29.0+ for backend (Node) and mobile (jest-expo)
- **Vitest:** 3.0+ for shared packages and web apps
- **Playwright:** 1.40+ for E2E tests
- **Coverage:** V8 provider (Vitest), Istanbul (Jest)
- **Environments:** Node (backend), jsdom (web), jest-expo (mobile), Playwright (E2E)
- **Transformers:** ts-jest, jest-expo preset

### Integration Points
- NestJS backends in `apps/*/backend`
- React Native mobile apps in `apps/*/mobile`
- SvelteKit web apps in `apps/*/web`
- Shared packages in `packages/*`
- E2E tests in `apps/*/e2e` or `apps/*/web/e2e`

## Code Structure

### Files
```
jest.config.backend.js      # Jest config for NestJS backends
jest.config.mobile.js       # Jest config for React Native/Expo
vitest.config.base.ts       # Vitest config for shared packages
vitest.config.svelte.ts     # Vitest config for SvelteKit web
playwright.config.base.ts   # Playwright config for E2E tests
```

### Exports
```json
{
  "./jest-backend": "./jest.config.backend.js",
  "./jest-mobile": "./jest.config.mobile.js",
  "./vitest-base": "./vitest.config.base.ts",
  "./vitest-svelte": "./vitest.config.svelte.ts",
  "./playwright": "./playwright.config.base.ts"
}
```

## Key Patterns

### 1. Consistent Coverage Thresholds
All configs enforce 80% coverage across all metrics:
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

**Why:** Ensures high code quality and test coverage across the entire monorepo.

### 2. Environment-Specific Configuration
Each config targets the appropriate test environment:
- **Backend (Jest):** Node environment
- **Mobile (Jest):** Node environment with jest-expo preset
- **Shared Packages (Vitest):** Node environment
- **Web (Vitest):** jsdom for browser APIs
- **E2E (Playwright):** Real browsers (Chromium, Firefox, WebKit)

### 3. Path Alias Mapping
All configs include module name mappers for TypeScript path aliases:
- Backend: `@/*`, `@core/*`, `@modules/*`
- Mobile: `@/*`, `@components/*`, `@services/*`, etc.
- Web: `$lib`, `$app` (SvelteKit)

### 4. Smart Coverage Exclusions
All configs exclude non-testable files:
- Type definitions (`*.d.ts`)
- Config files (`*.config.*`)
- Test utilities and fixtures
- Generated files (`.svelte-kit`, `dist`, `build`)
- Entry points (`main.ts`)

### 5. CI/Local Behavior
Configs adapt to environment:
- **CI:** More verbose output, GitHub Actions reporter, stricter settings
- **Local:** Less verbose, faster feedback, HTML reports

## Configuration Details

### Jest Backend (NestJS)

**File:** `jest.config.backend.js`

**Key Features:**
- ts-jest transformer for TypeScript
- Node environment
- Coverage excludes: modules, DTOs, entities, interfaces
- Setup file: `test/setup.ts`
- Timeout: 10s
- Auto-reset/clear/restore mocks

**Usage:**
```json
// apps/chat/backend/package.json
{
  "jest": {
    "preset": "@manacore/test-config/jest-backend"
  }
}
```

**Or extend:**
```javascript
// apps/chat/backend/jest.config.js
const baseConfig = require('@manacore/test-config/jest-backend');
module.exports = {
  ...baseConfig,
  // Your overrides
};
```

### Jest Mobile (React Native/Expo)

**File:** `jest.config.mobile.js`

**Key Features:**
- jest-expo preset
- Transform ignore patterns for React Native modules
- Coverage excludes: styles, type-only files
- Module name mapper for common aliases
- Setup file: `jest.setup.js`
- CI-aware verbosity

**Usage:**
```json
// apps/chat/mobile/package.json
{
  "jest": {
    "preset": "@manacore/test-config/jest-mobile"
  }
}
```

**Critical Pattern:**
```javascript
transformIgnorePatterns: [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|...|@manacore/.*)'
]
```
Ensures React Native and Expo modules are transformed, not ignored.

### Vitest Base (Shared Packages)

**File:** `vitest.config.base.ts`

**Key Features:**
- Node environment
- V8 coverage provider
- Global test APIs (describe, it, expect)
- Setup file: `vitest.setup.ts`
- GitHub Actions reporter in CI
- Auto-reset/clear/restore mocks
- Console error detection

**Usage:**
```typescript
// packages/shared-errors/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@manacore/test-config/vitest-base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    // Your overrides
  })
);
```

### Vitest Svelte (SvelteKit Web)

**File:** `vitest.config.svelte.ts`

**Key Features:**
- jsdom environment for browser APIs
- V8 coverage provider
- Global test APIs
- Coverage excludes: SvelteKit route files (tested via E2E)
- Path aliases: `$lib`, `$app`
- Optional browser mode (commented out, enable when needed)

**Usage:**
```typescript
// apps/chat/web/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import svelteConfig from '@manacore/test-config/vitest-svelte';
import { sveltekit } from '@sveltejs/kit/vite';

export default mergeConfig(
  svelteConfig,
  defineConfig({
    plugins: [sveltekit()],
    // Your overrides
  })
);
```

**Coverage Exclusions:**
```typescript
'src/routes/**/+*.ts',        // Route files (E2E tested)
'src/routes/**/+*.server.ts', // Test these explicitly
```

### Playwright (E2E)

**File:** `playwright.config.base.ts`

**Key Features:**
- Parallel test execution
- Multiple browsers: Chromium, Firefox, WebKit
- Mobile viewports: Pixel 5, iPhone 12
- Retry on CI (2 retries)
- Trace on first retry
- Screenshot/video on failure
- Web server auto-start
- Timeout: 60s

**Usage:**
```typescript
// apps/chat/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import baseConfig from '@manacore/test-config/playwright';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:5174', // Your port
  },
  webServer: {
    ...baseConfig.webServer,
    command: 'pnpm run build && pnpm run preview',
    port: 5174,
  },
  // Your overrides
});
```

## Common Patterns by Project Type

### NestJS Backend
```bash
# Test structure
apps/chat/backend/
├── src/
│   ├── modules/
│   │   └── users/
│   │       ├── users.service.ts
│   │       └── users.service.spec.ts
│   └── core/
│       └── utils/
│           ├── validation.ts
│           └── validation.spec.ts
├── test/
│   └── setup.ts              # Setup file
└── jest.config.js            # Extends @manacore/test-config/jest-backend
```

### React Native Mobile
```bash
# Test structure
apps/chat/mobile/
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       └── Button.test.tsx
│   └── services/
│       ├── auth.ts
│       └── auth.test.ts
├── jest.setup.js             # Setup file
└── package.json              # preset: @manacore/test-config/jest-mobile
```

### SvelteKit Web
```bash
# Test structure
apps/chat/web/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       ├── format.ts
│   │       └── format.test.ts
│   └── routes/
│       └── chat/
│           └── +page.svelte  # E2E tested
├── e2e/
│   └── chat.spec.ts          # Playwright E2E
├── vitest.setup.ts           # Setup file
├── vitest.config.ts          # Merges @manacore/test-config/vitest-svelte
└── playwright.config.ts      # Extends @manacore/test-config/playwright
```

### Shared Package
```bash
# Test structure
packages/shared-errors/
├── src/
│   ├── result.ts
│   ├── result.test.ts
│   ├── error-codes.ts
│   └── error-codes.test.ts
├── vitest.setup.ts           # Setup file
└── vitest.config.ts          # Merges @manacore/test-config/vitest-base
```

## Coverage Reports

### Jest (Backend/Mobile)
Generates in `coverage/` directory:
- `text` - Console output
- `lcov` - For CI tools
- `html` - Interactive HTML report
- `json` - Programmatic access

### Vitest (Shared/Web)
Generates via V8 provider:
- `text` - Console output
- `lcov` - For CI tools
- `html` - Interactive HTML report
- `json` - Programmatic access

### Playwright (E2E)
Generates in `test-results/` directory:
- HTML report (open with `npx playwright show-report`)
- Traces (view with `npx playwright show-trace`)
- Screenshots/videos on failure

## Best Practices

### 1. Always Use Preset/Merge
Never write test configs from scratch - always extend base configs.

```typescript
// GOOD - Vitest
export default mergeConfig(baseConfig, defineConfig({ ... }));

// GOOD - Jest
module.exports = { ...baseConfig, ... };

// BAD - From scratch
export default defineConfig({ test: { ... } });
```

### 2. Keep Coverage at 80%
Don't lower coverage thresholds. If you can't reach 80%, consider:
- Is the code testable?
- Should it be refactored?
- Does it need to be excluded (like type files)?

### 3. Use Appropriate Test Types
- **Unit tests:** Jest/Vitest for individual functions/components
- **Integration tests:** Jest/Vitest for service/module integration
- **E2E tests:** Playwright for user workflows

### 4. Exclude Non-Testable Code
Add coverage exclusions for:
- Type definitions
- Config files
- Test utilities
- Generated code
- Entry points

### 5. Mock External Dependencies
Use setup files to mock:
- Database connections
- External APIs
- Environment variables
- File system

## Common Issues

### Issue 1: "Cannot find module '@manacore/test-config/jest-backend'"
**Cause:** Package not installed or exports not resolved
**Solution:** Run `pnpm install` from root

### Issue 2: "Transform failed" in React Native
**Cause:** Module not in transformIgnorePatterns
**Solution:** Add module pattern to jest-mobile config

### Issue 3: Coverage below threshold
**Cause:** Untested code or incorrect exclusions
**Solution:** Add tests or verify coverage exclusions

### Issue 4: Playwright can't connect to server
**Cause:** webServer config incorrect or port in use
**Solution:** Verify baseURL and port match app config

### Issue 5: Path aliases not resolved
**Cause:** Module name mapper missing or incorrect
**Solution:** Check tsconfig.json matches moduleNameMapper

## Troubleshooting

### Verify Test Discovery
```bash
# Jest
pnpm jest --listTests

# Vitest
pnpm vitest list

# Playwright
pnpm playwright test --list
```

### Debug Coverage
```bash
# Jest
pnpm jest --coverage --verbose

# Vitest
pnpm vitest run --coverage

# Check coverage report
open coverage/index.html  # Jest/Vitest
```

### Debug Playwright
```bash
# Run in headed mode
pnpm playwright test --headed

# Debug specific test
pnpm playwright test --debug chat.spec.ts

# Show trace
npx playwright show-trace test-results/trace.zip
```

### Check Transform Config
```bash
# Jest - verify transform is working
pnpm jest --showConfig

# Vitest - check config
pnpm vitest --config vitest.config.ts
```

## Integration Points

### CI/CD Pipeline
All configs are CI-aware:
- Jest: Verbose in CI
- Vitest: GitHub Actions reporter in CI
- Playwright: GitHub reporter, 2 retries, single worker

### Turborepo Integration
Test tasks in `turbo.json`:
```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

### Pre-commit Hooks
Tests run before commits:
```json
{
  "lint-staged": {
    "*.ts": ["vitest related --run", "eslint --fix"]
  }
}
```

## Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [.claude/guidelines/testing.md](../../.claude/guidelines/testing.md)

## How to Use This Agent

When working with testing in the monorepo:

1. **New Backend:** Use `@manacore/test-config/jest-backend` preset
2. **New Mobile App:** Use `@manacore/test-config/jest-mobile` preset
3. **New Shared Package:** Merge `@manacore/test-config/vitest-base`
4. **New Web App:** Merge `@manacore/test-config/vitest-svelte` for unit, extend `playwright` for E2E
5. **Coverage Issues:** Check exclusions and ensure 80% threshold is met
6. **CI Failures:** Verify configs are CI-aware and reporters are correct
7. **Path Aliases:** Update moduleNameMapper to match tsconfig.json

**Always maintain consistent test standards across all projects while allowing project-specific customization.**

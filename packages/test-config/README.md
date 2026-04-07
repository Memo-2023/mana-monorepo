# @mana/test-config

Shared test configurations for all projects in the Mana monorepo.

## Available Configurations

### Jest Configuration for NestJS Backends

```javascript
// jest.config.js
const baseConfig = require('@mana/test-config/jest-backend');

module.exports = {
	...baseConfig,
	// Your project-specific overrides
};
```

### Jest Configuration for React Native Mobile

```javascript
// jest.config.js
module.exports = {
	preset: '@mana/test-config/jest-mobile',
	// Your project-specific overrides
};
```

### Vitest Configuration for Shared Packages

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@mana/test-config/vitest-base';

export default mergeConfig(
	baseConfig,
	defineConfig({
		// Your project-specific overrides
	})
);
```

### Vitest Configuration for SvelteKit Web Apps

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import svelteConfig from '@mana/test-config/vitest-svelte';
import { sveltekit } from '@sveltejs/kit/vite';

export default mergeConfig(
	svelteConfig,
	defineConfig({
		plugins: [sveltekit()],
		// Your project-specific overrides
	})
);
```

### Playwright Configuration for E2E Tests

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import baseConfig from '@mana/test-config/playwright';

export default defineConfig({
	...baseConfig,
	use: {
		...baseConfig.use,
		baseURL: 'http://localhost:5173',
	},
	// Your project-specific overrides
});
```

## Features

### Common Settings Across All Configs

- **Coverage Thresholds**: 80% for lines, functions, branches, statements
- **Mock Management**: Auto-clear, restore, and reset mocks between tests
- **Timeout**: 10s default for tests
- **Verbose Output**: In CI environments
- **Error Handling**: Fail on deprecated APIs

### NestJS Backend Config

- TypeScript support via ts-jest
- Automatic exclusion of modules, DTOs, entities
- Module path aliases support
- Coverage collection from source files

### React Native Mobile Config

- jest-expo preset
- Transform ignore patterns for React Native modules
- Support for @mana packages
- Coverage from src/ and app/ directories

### Vitest Configs

- Modern, fast test runner
- Coverage via v8
- ESM support
- Global test APIs (describe, it, expect)

### Playwright Config

- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Built-in retry logic
- Video/screenshot on failure
- Auto-start web server

## Adding to Your Project

1. **Install peer dependencies**:

```bash
# For NestJS backend
pnpm add -D jest ts-jest @types/jest

# For React Native mobile
pnpm add -D jest jest-expo @testing-library/react-native

# For SvelteKit web
pnpm add -D vitest @vitest/coverage-v8 jsdom

# For E2E tests
pnpm add -D @playwright/test
```

2. **Create config file** in your project root (see examples above)

3. **Add test scripts** to package.json:

```json
{
	"scripts": {
		"test": "jest", // or "vitest run"
		"test:watch": "jest --watch", // or "vitest"
		"test:cov": "jest --coverage", // or "vitest run --coverage"
		"test:e2e": "playwright test"
	}
}
```

## Customization

Each config can be extended with project-specific settings:

```typescript
// Override coverage thresholds
export default mergeConfig(baseConfig, {
	test: {
		coverage: {
			thresholds: {
				lines: 90, // More strict for critical packages
			},
		},
	},
});
```

## Related Documentation

- [Testing Strategy](../../docs/TESTING.md)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

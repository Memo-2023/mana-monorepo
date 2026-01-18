# Testing Implementation Guide

**Quick Start Guide for Adding Tests to the Manacore Monorepo**

## Table of Contents

- [Quick Start](#quick-start)
- [Adding Tests to NestJS Backend](#adding-tests-to-nestjs-backend)
- [Adding Tests to React Native Mobile](#adding-tests-to-react-native-mobile)
- [Adding Tests to SvelteKit Web](#adding-tests-to-sveltekit-web)
- [Adding Tests to Shared Packages](#adding-tests-to-shared-packages)
- [Running Tests Locally](#running-tests-locally)
- [Coverage Reports](#coverage-reports)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

```bash
# Ensure you have the correct versions
node --version  # Should be 20+
pnpm --version  # Should be 9.15.0
```

### Install Dependencies

```bash
# From monorepo root
pnpm install
```

### Run All Tests

```bash
# Run tests for all projects
pnpm test

# Run tests for specific project
pnpm --filter @maerchenzauber/backend test
pnpm --filter @memoro/mobile test
pnpm --filter @uload/web test:unit
```

## Adding Tests to NestJS Backend

### 1. Install Testing Dependencies (if not already installed)

```bash
cd apps/YOUR_PROJECT/apps/backend

pnpm add -D @nestjs/testing jest ts-jest @types/jest supertest @types/supertest
```

### 2. Create Jest Configuration

Create `jest.config.js` in your backend directory:

```javascript
const baseConfig = require('@manacore/test-config/jest-backend');

module.exports = {
	...baseConfig,
	// Project-specific overrides if needed
};
```

Or inline in `package.json`:

```json
{
	"jest": {
		"preset": "@manacore/test-config/jest-backend"
	}
}
```

### 3. Add Test Scripts to package.json

```json
{
	"scripts": {
		"test": "jest",
		"test:watch": "jest --watch",
		"test:cov": "jest --coverage",
		"test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
	}
}
```

### 4. Create Your First Test

```typescript
// src/example/__tests__/example.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from '../example.service';

describe('ExampleService', () => {
	let service: ExampleService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ExampleService],
		}).compile();

		service = module.get<ExampleService>(ExampleService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
```

### 5. Run Tests

```bash
pnpm test
pnpm test:cov  # With coverage
```

## Adding Tests to React Native Mobile

### 1. Install Testing Dependencies

```bash
cd apps/YOUR_PROJECT/apps/mobile

pnpm add -D jest jest-expo @testing-library/react-native @testing-library/jest-native
```

### 2. Create Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
	preset: '@manacore/test-config/jest-mobile',
	// Project-specific overrides
};
```

### 3. Create Setup File

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
	loadAsync: jest.fn(),
	isLoaded: jest.fn(() => true),
}));

// Global test setup
global.fetch = jest.fn();
```

### 4. Add Test Scripts to package.json

```json
{
	"scripts": {
		"test": "jest --watchAll",
		"test:ci": "jest --ci --coverage --watchAll=false",
		"test:cov": "jest --coverage --watchAll=false"
	}
}
```

### 5. Create Your First Component Test

```typescript
// src/components/Button/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
	it('should render', () => {
		const { getByText } = render(<Button>Click Me</Button>);
		expect(getByText('Click Me')).toBeTruthy();
	});

	it('should call onPress', () => {
		const onPress = jest.fn();
		const { getByText } = render(<Button onPress={onPress}>Click</Button>);

		fireEvent.press(getByText('Click'));
		expect(onPress).toHaveBeenCalled();
	});
});
```

### 6. Run Tests

```bash
pnpm test
```

## Adding Tests to SvelteKit Web

### 1. Install Testing Dependencies

```bash
cd apps/YOUR_PROJECT/apps/web

pnpm add -D vitest @vitest/coverage-v8 @testing-library/svelte jsdom
pnpm add -D @playwright/test  # For E2E tests
```

### 2. Create Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config';
import svelteConfig from '@manacore/test-config/vitest-svelte';
import { sveltekit } from '@sveltejs/kit/vite';

export default mergeConfig(
	svelteConfig,
	defineConfig({
		plugins: [sveltekit()],
		test: {
			// Project-specific overrides
		},
	})
);
```

### 3. Create Vitest Setup File

Create `vitest.setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Cleanup after each test
afterEach(() => {
	cleanup();
});
```

### 4. Create Playwright Configuration (E2E)

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import baseConfig from '@manacore/test-config/playwright';

export default defineConfig({
	...baseConfig,
	use: {
		...baseConfig.use,
		baseURL: 'http://localhost:5173',
	},
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 5173,
	},
});
```

### 5. Add Test Scripts to package.json

```json
{
	"scripts": {
		"test": "pnpm run test:unit && pnpm run test:e2e",
		"test:unit": "vitest run",
		"test:unit:watch": "vitest",
		"test:unit:cov": "vitest run --coverage",
		"test:e2e": "playwright test",
		"test:e2e:ui": "playwright test --ui"
	}
}
```

### 6. Create Your First Component Test

```typescript
// src/lib/components/Button/__tests__/Button.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button.svelte';

describe('Button', () => {
	it('should render', () => {
		render(Button, { props: { children: 'Click Me' } });
		expect(screen.getByText('Click Me')).toBeTruthy();
	});

	it('should call onclick', async () => {
		const onclick = vi.fn();
		render(Button, { props: { onclick, children: 'Click' } });

		await screen.getByText('Click').click();
		expect(onclick).toHaveBeenCalled();
	});
});
```

### 7. Create Your First E2E Test

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});
```

### 8. Run Tests

```bash
pnpm test:unit           # Unit tests
pnpm test:e2e            # E2E tests
pnpm test:unit:cov       # With coverage
```

## Adding Tests to Shared Packages

### 1. Install Vitest

```bash
cd packages/YOUR_PACKAGE

pnpm add -D vitest @vitest/coverage-v8
```

### 2. Create Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@manacore/test-config/vitest-base';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			// Package-specific config
		},
	})
);
```

### 3. Add Test Scripts to package.json

```json
{
	"scripts": {
		"test": "vitest run",
		"test:watch": "vitest",
		"test:cov": "vitest run --coverage"
	}
}
```

### 4. Create Your First Utility Test

```typescript
// src/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, truncate } from '../format';

describe('formatDate', () => {
	it('should format date correctly', () => {
		const date = new Date('2024-01-15T12:00:00Z');
		expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
	});
});

describe('truncate', () => {
	it('should truncate long strings', () => {
		expect(truncate('Very long text', 10)).toBe('Very long…');
	});
});
```

### 5. Run Tests

```bash
pnpm test
pnpm test:cov
```

## Running Tests Locally

### Individual Project Tests

```bash
# Backend
pnpm --filter @maerchenzauber/backend test

# Mobile
pnpm --filter @memoro/mobile test

# Web (unit tests)
pnpm --filter @uload/web test:unit

# Web (E2E tests)
pnpm --filter @uload/web test:e2e

# Shared package
pnpm --filter @manacore/shared-utils test
```

### All Tests for a Project

```bash
# Run all tests for maerchenzauber
pnpm --filter maerchenzauber... test
```

### Watch Mode

```bash
# Backend (Jest)
pnpm --filter @maerchenzauber/backend test:watch

# Mobile (Jest)
pnpm --filter @memoro/mobile test

# Web (Vitest)
pnpm --filter @uload/web test:unit:watch
```

### With Coverage

```bash
# Backend
pnpm --filter @maerchenzauber/backend test:cov

# Mobile
pnpm --filter @memoro/mobile test:cov

# Web
pnpm --filter @uload/web test:unit:cov

# View HTML report
open apps/YOUR_PROJECT/apps/backend/coverage/index.html
```

## Coverage Reports

### View Coverage Locally

```bash
# Generate coverage
pnpm test:cov

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

All projects have these default thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

To override for your project:

**Jest (Backend/Mobile)**:
```javascript
module.exports = {
	preset: '@manacore/test-config/jest-backend',
	coverageThresholds: {
		global: {
			lines: 90, // Higher threshold
		},
	},
};
```

**Vitest (Web/Shared)**:
```typescript
export default defineConfig({
	test: {
		coverage: {
			thresholds: {
				lines: 90,
			},
		},
	},
});
```

### CI/CD Coverage

- Coverage reports are automatically uploaded to Codecov on PR/push to main
- Coverage badges available at `https://codecov.io/gh/YOUR_ORG/YOUR_REPO`
- PR comments show coverage diff

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

```bash
# Clear caches
pnpm store prune
pnpm install --force

# Backend: Clear Jest cache
pnpm --filter @YOUR_PROJECT/backend test --clearCache

# Mobile: Clear Metro cache
cd apps/YOUR_PROJECT/apps/mobile
rm -rf node_modules/.cache
```

#### Transform errors in React Native

Make sure `transformIgnorePatterns` in `jest.config.js` includes all necessary packages:

```javascript
transformIgnorePatterns: [
	'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@manacore/.*)',
];
```

#### Svelte component tests fail

Ensure you have the correct Vite plugin:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
});
```

#### Playwright browser not installed

```bash
pnpm --filter @YOUR_PROJECT/web exec playwright install chromium
```

#### Tests timeout

Increase timeout in config:

```typescript
// Vitest
export default defineConfig({
	test: {
		testTimeout: 30000, // 30 seconds
	},
});

// Jest
module.exports = {
	testTimeout: 30000,
};
```

#### Coverage not generating

```bash
# Jest: Ensure collectCoverageFrom is set
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!**/*.d.ts',
],

# Vitest: Ensure include is set
coverage: {
  include: ['src/**/*.{js,ts,svelte}'],
}
```

### Getting Help

1. Check existing tests in the project for patterns
2. Review [docs/TESTING.md](./TESTING.md) for detailed strategies
3. Check example tests in [docs/test-examples/](./test-examples/)
4. Review CI logs for failure details
5. Ask in team chat for project-specific guidance

## Next Steps

1. **Start with critical paths**: Auth, payments, data integrity
2. **Add tests incrementally**: Don't try to test everything at once
3. **Follow TDD when possible**: Write tests before code
4. **Review coverage**: Aim for 80% minimum, 100% for critical code
5. **Keep tests fast**: Unit tests < 100ms, integration < 1s
6. **Update this guide**: Add project-specific tips as you learn

## Resources

- [Full Testing Strategy](./TESTING.md)
- [Test Examples](./test-examples/)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Quick Reference Commands**

```bash
# Run all tests
pnpm test

# Run specific project tests
pnpm --filter @PROJECT/APP test

# Run with coverage
pnpm --filter @PROJECT/APP test:cov

# Run in watch mode
pnpm --filter @PROJECT/APP test:watch

# Run E2E tests
pnpm --filter @PROJECT/web test:e2e

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

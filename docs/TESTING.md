# Testing Strategy for Manacore Monorepo

## Table of Contents

- [Overview](#overview)
- [Current State Analysis](#current-state-analysis)
- [Testing Infrastructure by App Type](#testing-infrastructure-by-app-type)
- [Test Organization](#test-organization)
- [Coverage Strategy](#coverage-strategy)
- [Testing Scenarios](#testing-scenarios)
- [CI/CD Integration](#cicd-integration)
- [Implementation Roadmap](#implementation-roadmap)
- [Best Practices](#best-practices)

## Overview

This document outlines the comprehensive automated testing strategy for the Manacore monorepo. The goal is to achieve 80% test coverage for new code while maintaining quality and development velocity.

### Goals

- **80% coverage minimum** for new code
- **100% coverage** for critical paths (auth, payments, data integrity)
- **Fast feedback loops** (<5 minutes for unit tests)
- **Consistent patterns** across all projects
- **Automated testing** in CI/CD pipeline
- **Developer-friendly** test writing experience

## Current State Analysis

### Existing Test Files (25 total)

#### By Project

**Maerchenzauber (13 files, ~4,182 total lines)**:
- Mobile: 5 comprehensive auth flow tests (excellent pattern)
- Backend: 8 NestJS service/controller tests

**Memoro (3 files)**:
- Mobile: Video edge cases, UploadModal integration, media utils

**Uload (9 files)**:
- Web: Vitest unit tests + Playwright E2E (good foundation)

### Testing Infrastructure Currently in Use

| App Type | Framework | Config | Coverage Tool |
|----------|-----------|--------|---------------|
| NestJS Backend | Jest | Inline in package.json | Jest coverage |
| React Native Mobile | Jest + jest-expo | Inline in package.json | Not configured |
| SvelteKit Web | Vitest + Playwright | Separate configs | vitest coverage-v8 |
| Astro Landing | None | - | - |

### Key Findings

**Strengths**:
- Maerchenzauber mobile auth tests show excellent patterns (comprehensive, well-organized)
- Uload web demonstrates good Vitest + Playwright setup
- NestJS backends have Jest configured

**Gaps**:
- No shared test utilities across projects
- No coverage thresholds enforced
- No CI/CD test automation (only 2 backend deployment workflows)
- Sparse coverage in most projects
- No E2E testing for mobile apps
- No shared package tests
- No integration tests with real Supabase

## Testing Infrastructure by App Type

### 1. NestJS Backends

**Framework**: Jest (built-in with NestJS)

**Key Features**:
- Controller unit tests with mocked services
- Service tests with dependency injection
- Integration tests with TestingModule
- E2E tests with supertest
- Supabase client mocking

**Configuration**: `jest.config.js`

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Test Structure**:
```
src/
├── module-name/
│   ├── module-name.controller.ts
│   ├── module-name.service.ts
│   ├── __tests__/              # Preferred location
│   │   ├── module-name.controller.spec.ts
│   │   ├── module-name.service.spec.ts
│   │   └── module-name.integration.spec.ts
│   └── dto/
test/                            # E2E tests only
└── e2e/
    └── module-name.e2e-spec.ts
```

### 2. React Native Mobile (Expo)

**Framework**: Jest + React Native Testing Library

**Key Features**:
- Component rendering tests
- Navigation flow tests
- Zustand store tests
- API integration mocks (MSW)
- Platform-specific tests
- expo-secure-store mocking

**Configuration**: `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
    '/__tests__/fixtures/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@unimodules/.*|unimodules|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Test Structure**:
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── __tests__/
│   │       ├── Button.test.tsx
│   │       └── Button.integration.test.tsx
│   └── __tests__/              # Shared component tests
├── services/
│   ├── authService.ts
│   └── __tests__/
│       └── authService.test.ts
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
└── utils/
    └── __tests__/
        └── api.test.ts
app/
└── (tabs)/
    └── __tests__/
        └── navigation.test.tsx
```

### 3. SvelteKit Web Apps

**Framework**: Vitest (unit) + Playwright (E2E)

**Key Features**:
- Component unit tests (Svelte 5 runes)
- Page/route tests
- SSR behavior tests
- Form validation tests
- Store tests
- Accessibility tests

**Configuration**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,ts,svelte}'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

**Playwright Config**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm run build && pnpm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Test Structure**:
```
src/
├── lib/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.svelte
│   │       └── Button.test.ts
│   ├── stores/
│   │   ├── auth.svelte.ts
│   │   └── auth.test.ts
│   └── utils/
│       ├── cache.ts
│       └── cache.test.ts
├── routes/
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   ├── +page.svelte
│   │   │   ├── +page.server.ts
│   │   │   └── +page.server.test.ts
e2e/
├── auth.spec.ts
├── dashboard.spec.ts
└── helpers/
    └── test-utils.ts
```

### 4. Astro Landing Pages

**Framework**: Vitest

**Key Features**:
- Component tests
- Static content validation
- Link checking
- Build output validation

**Configuration**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

export default defineConfig(
  getViteConfig({
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'jsdom',
      globals: true,
    },
  })
);
```

### 5. Shared Packages

**Framework**: Vitest (lightweight, fast)

**Configuration**: Create `packages/vitest.config.base.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.d.ts', '**/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Test Organization

### Directory Structure Convention

**Preferred Pattern**: `__tests__/` directories co-located with source code

```
src/
├── feature/
│   ├── feature.ts
│   └── __tests__/
│       ├── feature.test.ts
│       ├── feature.integration.test.ts
│       └── fixtures/
│           └── mockData.ts
```

**Alternative**: Side-by-side (for simple files)

```
src/
├── utils/
│   ├── format.ts
│   └── format.test.ts
```

### File Naming Conventions

- **Unit tests**: `*.test.ts` or `*.spec.ts`
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `*.e2e.spec.ts` or `*.spec.ts` (in e2e/ directory)
- **Test utilities**: `test-utils.ts`, `*TestUtils.ts`
- **Fixtures**: `fixtures/` directory or `mockData.ts`

### Test Utilities

Create shared test utilities in `__tests__/utils/`:

```typescript
// Mobile: src/__tests__/utils/authTestUtils.ts
export const mockAuthService = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshToken: jest.fn(),
};

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides,
});

// Backend: src/__tests__/utils/testHelpers.ts
export const createTestingModule = async (providers = []) => {
  return Test.createTestingModule({
    providers: [
      ...providers,
      { provide: ConfigService, useValue: mockConfigService },
    ],
  }).compile();
};

// Web: src/lib/__tests__/utils/svelte-test-utils.ts
export const renderComponent = (Component, props = {}) => {
  const { container } = render(Component, { props });
  return { container, ...screen };
};
```

## Coverage Strategy

### Coverage Thresholds by Component Type

| Component Type | Threshold | Justification |
|----------------|-----------|---------------|
| **Critical Paths** | 100% | Auth, payments, data integrity |
| **Services/API Clients** | 90% | Core business logic |
| **Controllers/Routes** | 85% | Request handling |
| **Components** | 80% | UI layer |
| **Utilities** | 90% | Reusable functions |
| **Types/Interfaces** | Excluded | No runtime logic |

### Critical Paths Requiring 100% Coverage

1. **Authentication**:
   - `@manacore/shared-auth` package
   - `authService.ts` in all apps
   - `tokenManager.ts`
   - JWT verification logic

2. **Payment/Credit System**:
   - Credit consumption logic
   - Stripe integration
   - Credit balance checks
   - Transaction recording

3. **Data Integrity**:
   - Database migrations
   - RLS policy validation (via integration tests)
   - User data validation
   - File upload validation

### Coverage Reporting

**Local Development**:
```bash
# Generate coverage report
pnpm run test:cov

# View HTML report
open coverage/index.html
```

**CI/CD**: Coverage reports uploaded to Codecov or similar service

**Coverage Gates**:
- Pull requests must maintain or increase coverage
- New files must meet 80% threshold
- Critical paths must maintain 100%

## Testing Scenarios

### 1. NestJS Backend Tests

#### Controller Tests

```typescript
// src/story/__tests__/story.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StoryController } from '../story.controller';
import { StoryService } from '../story.service';
import { CreateStoryDto } from '../dto/create-story.dto';

describe('StoryController', () => {
  let controller: StoryController;
  let service: StoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryController],
      providers: [
        {
          provide: StoryService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StoryController>(StoryController);
    service = module.get<StoryService>(StoryService);
  });

  describe('create', () => {
    it('should create a story', async () => {
      const dto: CreateStoryDto = {
        description: 'A magical adventure',
        characterId: 'char-123',
      };
      const expectedResult = { id: 'story-123', ...dto };

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      const result = await controller.create(dto, { user: { sub: 'user-123' } });

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
    });

    it('should handle validation errors', async () => {
      const dto: CreateStoryDto = {
        description: '', // Invalid
        characterId: 'char-123',
      };

      await expect(controller.create(dto, { user: { sub: 'user-123' } }))
        .rejects
        .toThrow();
    });
  });

  describe('findAll', () => {
    it('should return user stories', async () => {
      const stories = [{ id: 'story-1' }, { id: 'story-2' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(stories);

      const result = await controller.findAll({ user: { sub: 'user-123' } });

      expect(result).toEqual(stories);
      expect(service.findAll).toHaveBeenCalledWith('user-123');
    });
  });
});
```

#### Service Tests with Mocked Dependencies

```typescript
// src/story/__tests__/story.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { StoryService } from '../story.service';
import { SupabaseDataService } from '../../core/services/supabase-data.service';
import { PromptingService } from '../../core/services/prompting.service';
import { IllustrationService } from '../illustration.service';

describe('StoryService', () => {
  let service: StoryService;
  let supabaseService: jest.Mocked<SupabaseDataService>;
  let promptingService: jest.Mocked<PromptingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        {
          provide: SupabaseDataService,
          useValue: {
            insertStory: jest.fn(),
            getStory: jest.fn(),
            updateStory: jest.fn(),
          },
        },
        {
          provide: PromptingService,
          useValue: {
            generateStoryText: jest.fn(),
            generateIllustrationPrompt: jest.fn(),
          },
        },
        {
          provide: IllustrationService,
          useValue: {
            generateImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
    supabaseService = module.get(SupabaseDataService);
    promptingService = module.get(PromptingService);
  });

  describe('create', () => {
    it('should generate and save a story', async () => {
      const dto = {
        description: 'A magical forest adventure',
        characterId: 'char-123',
      };
      const userId = 'user-123';

      promptingService.generateStoryText.mockResolvedValue({
        pages: [{ text: 'Once upon a time...', pageNumber: 1 }],
      });

      supabaseService.insertStory.mockResolvedValue({
        data: { id: 'story-123', ...dto },
        error: null,
      });

      const result = await service.create(dto, userId);

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('story-123');
      expect(promptingService.generateStoryText).toHaveBeenCalled();
      expect(supabaseService.insertStory).toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      promptingService.generateStoryText.mockRejectedValue(
        new Error('API error')
      );

      const result = await service.create(
        { description: 'Test', characterId: 'char-123' },
        'user-123'
      );

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
});
```

#### Integration Tests with Supabase

```typescript
// src/story/__tests__/story.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { StoryModule } from '../story.module';
import { SupabaseProvider } from '../../supabase/supabase.provider';

describe('StoryService Integration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test', // Use test environment
        }),
        StoryModule,
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create story in test database', async () => {
    // Integration test with real Supabase test project
    // Uses seeded test data
  });
});
```

#### E2E Tests with Supertest

```typescript
// test/e2e/story.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Story API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for tests
    const authResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'test@example.com', password: 'test123' });

    authToken = authResponse.body.appToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/story (POST)', () => {
    it('should create a story', () => {
      return request(app.getHttpServer())
        .post('/story')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'A magical adventure',
          characterId: 'char-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.description).toBe('A magical adventure');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/story')
        .send({ description: 'Test' })
        .expect(401);
    });
  });

  describe('/story (GET)', () => {
    it('should return user stories', () => {
      return request(app.getHttpServer())
        .get('/story')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
```

### 2. React Native Mobile Tests

#### Component Tests

```typescript
// src/components/Button/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Click Me</Button>
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} loading>Click Me</Button>
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading indicator', () => {
    const { getByTestId } = render(
      <Button loading testID="button">Click Me</Button>
    );

    expect(getByTestId('button-loading')).toBeTruthy();
  });
});
```

#### Navigation Tests

```typescript
// app/(tabs)/__tests__/navigation.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from '../_layout';

describe('Tab Navigation', () => {
  it('should render all tabs', () => {
    const { getByText } = render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Stories')).toBeTruthy();
    expect(getByText('Characters')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('should navigate between tabs', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );

    fireEvent.press(getByText('Characters'));

    await waitFor(() => {
      expect(getByTestId('characters-screen')).toBeTruthy();
    });
  });
});
```

#### Zustand Store Tests

```typescript
// src/stores/__tests__/authStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
  });

  it('should set user on sign in', () => {
    const { result } = renderHook(() => useAuthStore());
    const user = { id: 'user-123', email: 'test@example.com' };

    act(() => {
      result.current.setUser(user);
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear user on sign out', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setUser({ id: 'user-123', email: 'test@example.com' });
      result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

#### API Integration Tests with MSW

```typescript
// src/utils/__tests__/api.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { fetchWithAuth } from '../api';

const server = setupServer(
  rest.get('http://localhost:3000/api/stories', (req, res, ctx) => {
    return res(ctx.json({ stories: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchWithAuth', () => {
  it('should fetch with auth token', async () => {
    const response = await fetchWithAuth('/api/stories');
    const data = await response.json();

    expect(data).toEqual({ stories: [] });
  });

  it('should refresh token on 401', async () => {
    server.use(
      rest.get('http://localhost:3000/api/stories', (req, res, ctx) => {
        return res.once(ctx.status(401));
      }),
      rest.post('http://localhost:3000/auth/refresh', (req, res, ctx) => {
        return res(ctx.json({ token: 'new-token' }));
      })
    );

    const response = await fetchWithAuth('/api/stories');
    expect(response.ok).toBe(true);
  });
});
```

### 3. SvelteKit Web Tests

#### Component Tests (Svelte 5 Runes)

```typescript
// src/lib/components/Button/__tests__/Button.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button.svelte';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('should render with text', () => {
    render(Button, { props: { children: 'Click Me' } });
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('should call onclick when clicked', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();

    render(Button, { props: { onclick, children: 'Click Me' } });

    await user.click(screen.getByText('Click Me'));
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('should be disabled when loading', () => {
    render(Button, { props: { loading: true, children: 'Click Me' } });
    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);
  });
});
```

#### Store Tests (Svelte 5)

```typescript
// src/lib/stores/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from '../auth.svelte';

describe('authStore', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('should initialize with null user', () => {
    expect(authStore.user).toBeNull();
  });

  it('should set user', () => {
    const user = { id: '123', email: 'test@example.com' };
    authStore.setUser(user);

    expect(authStore.user).toEqual(user);
    expect(authStore.isAuthenticated).toBe(true);
  });

  it('should clear user', () => {
    authStore.setUser({ id: '123', email: 'test@example.com' });
    authStore.clear();

    expect(authStore.user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });
});
```

#### Server Load Function Tests

```typescript
// src/routes/(app)/dashboard/__tests__/+page.server.test.ts
import { describe, it, expect, vi } from 'vitest';
import { load } from '../+page.server';

describe('Dashboard Load Function', () => {
  it('should load user data', async () => {
    const locals = {
      pb: {
        collection: vi.fn(() => ({
          getList: vi.fn().mockResolvedValue({
            items: [{ id: '1', title: 'Test' }],
          }),
        })),
      },
    };

    const result = await load({ locals });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Test');
  });

  it('should handle errors', async () => {
    const locals = {
      pb: {
        collection: vi.fn(() => ({
          getList: vi.fn().mockRejectedValue(new Error('DB error')),
        })),
      },
    };

    await expect(load({ locals })).rejects.toThrow('DB error');
  });
});
```

#### E2E Tests with Playwright

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign in successfully', async ({ page }) => {
    await page.goto('/signin');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*signin/);
  });
});
```

### 4. Shared Package Tests

#### Utility Function Tests

```typescript
// packages/shared-utils/src/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, truncate, slugify } from '../format';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
  });

  it('should handle invalid dates', () => {
    expect(() => formatDate(null, 'yyyy-MM-dd')).toThrow();
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    const text = 'This is a very long string that should be truncated';
    expect(truncate(text, 20)).toBe('This is a very long...');
  });

  it('should not truncate short strings', () => {
    const text = 'Short';
    expect(truncate(text, 20)).toBe('Short');
  });

  it('should handle custom ellipsis', () => {
    const text = 'This is a very long string';
    expect(truncate(text, 10, '...')).toBe('This is...');
  });
});

describe('slugify', () => {
  it('should convert to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('React & TypeScript')).toBe('react-typescript');
  });
});
```

#### Auth Service Tests

```typescript
// packages/shared-auth/src/__tests__/authService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from '../authService';
import { TokenManager } from '../tokenManager';

describe('createAuthService', () => {
  let authService;
  let mockTokenManager;

  beforeEach(() => {
    mockTokenManager = {
      getValidToken: vi.fn(),
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
    };

    authService = createAuthService({
      apiUrl: 'http://localhost:3000',
      tokenManager: mockTokenManager,
    });
  });

  describe('signIn', () => {
    it('should sign in and store tokens', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          appToken: 'token-123',
          refreshToken: 'refresh-123',
        }),
      });

      const result = await authService.signIn('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(mockTokenManager.setTokens).toHaveBeenCalledWith({
        appToken: 'token-123',
        refreshToken: 'refresh-123',
      });
    });

    it('should handle sign in errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await authService.signIn('test@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test-backends:
    name: Test NestJS Backends
    runs-on: ubuntu-latest

    strategy:
      matrix:
        project: [maerchenzauber, manadeck, chat, nutriphi]

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm --filter @${{ matrix.project }}/backend test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/${{ matrix.project }}/apps/backend/coverage/lcov.info
          flags: backend-${{ matrix.project }}
          name: backend-${{ matrix.project }}

  test-mobile:
    name: Test React Native Mobile Apps
    runs-on: ubuntu-latest

    strategy:
      matrix:
        project: [maerchenzauber, memoro, picture, chat]

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm --filter @${{ matrix.project }}/mobile test -- --coverage --watchAll=false

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/${{ matrix.project }}/apps/mobile/coverage/lcov.info
          flags: mobile-${{ matrix.project }}
          name: mobile-${{ matrix.project }}

  test-web:
    name: Test SvelteKit Web Apps
    runs-on: ubuntu-latest

    strategy:
      matrix:
        project: [maerchenzauber, manacore, memoro, picture, uload, chat]

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm --filter @${{ matrix.project }}/web test:unit -- --coverage

      - name: Install Playwright browsers
        run: pnpm --filter @${{ matrix.project }}/web exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm --filter @${{ matrix.project }}/web test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/${{ matrix.project }}/apps/web/coverage/lcov.info
          flags: web-${{ matrix.project }}
          name: web-${{ matrix.project }}

  test-shared-packages:
    name: Test Shared Packages
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm --filter '@manacore/*' test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./packages/*/coverage/lcov.info
          flags: shared-packages
          name: shared-packages

  coverage-report:
    name: Aggregate Coverage Report
    needs: [test-backends, test-mobile, test-web, test-shared-packages]
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download all coverage reports
        uses: actions/download-artifact@v4

      - name: Generate combined coverage report
        run: |
          echo "## Test Coverage Summary" >> $GITHUB_STEP_SUMMARY
          echo "All tests passed with coverage thresholds met" >> $GITHUB_STEP_SUMMARY
```

### Test Performance Optimization

**Parallel Execution**:
```json
{
  "scripts": {
    "test": "jest --maxWorkers=50%",
    "test:ci": "jest --maxWorkers=2 --ci"
  }
}
```

**Test Sharding** (for large test suites):
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: pnpm test -- --shard=${{ matrix.shard }}/4
```

**Caching**:
```yaml
- name: Cache test results
  uses: actions/cache@v4
  with:
    path: |
      **/node_modules
      **/.next/cache
      **/coverage
    key: test-cache-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals**: Set up infrastructure and create shared utilities

- [ ] Create shared test configurations
  - [ ] `packages/test-config/jest.config.base.js`
  - [ ] `packages/test-config/vitest.config.base.ts`
  - [ ] `packages/test-config/playwright.config.base.ts`
- [ ] Install testing dependencies across all projects
- [ ] Create shared test utilities package
  - [ ] `packages/shared-test-utils/`
  - [ ] Mock factories
  - [ ] Test helpers
  - [ ] Supabase mocks
- [ ] Set up coverage reporting
  - [ ] Codecov integration
  - [ ] Coverage badges in README
- [ ] Document testing patterns in this file

### Phase 2: Critical Path Coverage (Week 3-4)

**Goals**: Achieve 100% coverage for critical paths

- [ ] **Authentication** (Priority 1)
  - [ ] `@manacore/shared-auth` package (100% coverage)
  - [ ] Token manager tests
  - [ ] JWT validation tests
  - [ ] Auth service tests per app
- [ ] **Payment/Credit System** (Priority 2)
  - [ ] Credit consumption logic
  - [ ] Stripe integration mocks
  - [ ] Credit balance validation
- [ ] **Data Integrity** (Priority 3)
  - [ ] RLS policy integration tests
  - [ ] Database migration tests
  - [ ] Data validation tests

### Phase 3: Backend Coverage (Week 5-6)

**Goals**: 80% coverage for all NestJS backends

- [ ] **Maerchenzauber Backend**
  - [ ] Story service tests (expand existing)
  - [ ] Character service tests (expand existing)
  - [ ] AI integration mocks
  - [ ] E2E API tests
- [ ] **Chat Backend**
  - [ ] Chat service tests
  - [ ] WebSocket tests
  - [ ] Message persistence tests
- [ ] **Manadeck Backend**
  - [ ] Deck service tests
  - [ ] Card service tests
- [ ] **Nutriphi Backend**
  - [ ] Recipe service tests
  - [ ] Nutrition calculation tests

### Phase 4: Mobile Coverage (Week 7-8)

**Goals**: 80% coverage for all mobile apps

- [ ] **Maerchenzauber Mobile** (expand from 5 tests)
  - [ ] Component tests
  - [ ] Navigation tests
  - [ ] Store tests
  - [ ] API integration tests
- [ ] **Memoro Mobile** (expand from 3 tests)
  - [ ] Audio recording tests
  - [ ] Upload flow tests
  - [ ] Playback tests
- [ ] **Picture Mobile**
  - [ ] Image generation flow
  - [ ] Gallery tests
  - [ ] Share functionality
- [ ] **Chat Mobile**
  - [ ] Message list tests
  - [ ] Chat input tests
  - [ ] Real-time updates

### Phase 5: Web Coverage (Week 9-10)

**Goals**: 80% coverage for all web apps

- [ ] **Uload Web** (expand from 9 tests)
  - [ ] Link management tests
  - [ ] QR code tests
  - [ ] Analytics tests
- [ ] **Manacore Web**
  - [ ] Dashboard tests
  - [ ] App switcher tests
  - [ ] Profile tests
- [ ] **SvelteKit Apps**
  - [ ] Component library tests
  - [ ] Form validation tests
  - [ ] SSR behavior tests

### Phase 6: Shared Packages (Week 11)

**Goals**: 90% coverage for all shared packages

- [ ] `@manacore/shared-auth` (100%)
- [ ] `@manacore/shared-utils` (90%)
- [ ] `@manacore/shared-types` (validation tests)
- [ ] `@manacore/shared-ui` (component tests)
- [ ] `@manacore/shared-supabase` (90%)

### Phase 7: CI/CD Integration (Week 12)

**Goals**: Automated testing pipeline

- [ ] Create GitHub Actions workflows
  - [ ] PR checks
  - [ ] Branch protection rules
  - [ ] Coverage gates
- [ ] Set up Codecov
  - [ ] Coverage badges
  - [ ] PR comments
  - [ ] Coverage diff reports
- [ ] Performance optimization
  - [ ] Test caching
  - [ ] Parallel execution
  - [ ] Selective test running

### Phase 8: E2E Testing (Week 13-14)

**Goals**: Critical user flows covered

- [ ] Playwright setup for all web apps
- [ ] Detox or Maestro for mobile apps
- [ ] Critical flows:
  - [ ] Authentication flow
  - [ ] Content creation flow
  - [ ] Payment flow
  - [ ] Share flow

## Best Practices

### General Testing Principles

1. **AAA Pattern**: Arrange, Act, Assert
2. **Single Responsibility**: One test, one assertion (ideally)
3. **Isolation**: Tests should not depend on each other
4. **Descriptive Names**: Test names explain what and why
5. **Fast Tests**: Unit tests < 100ms, integration tests < 1s
6. **Deterministic**: Same input = same output

### Test Naming Convention

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    });

    it('should handle error when invalid input', () => {
      // Error handling test
    });
  });
});
```

### Mock Best Practices

**DO**:
- Mock external dependencies (APIs, databases)
- Mock time-dependent functions (`Date.now()`)
- Use factories for test data
- Reset mocks between tests

**DON'T**:
- Mock internal implementation details
- Over-mock (keep some real implementations)
- Forget to restore mocks after tests

### Coverage Best Practices

**What to Cover**:
- Business logic
- Error handling paths
- Edge cases
- Boundary conditions

**What NOT to Cover**:
- Type definitions
- Simple getters/setters
- Framework boilerplate
- Third-party libraries

### Supabase Testing Strategy

**Unit Tests**: Mock Supabase client
```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })),
};
```

**Integration Tests**: Use Supabase local development
```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db reset

# Run integration tests
pnpm test:integration
```

**E2E Tests**: Use dedicated test project in Supabase with seeded data

### Continuous Improvement

- Review coverage reports weekly
- Add tests when bugs are found
- Refactor tests alongside code
- Share testing patterns across teams
- Update this document as patterns evolve

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library](https://testing-library.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Svelte Testing](https://svelte.dev/docs/testing)

## FAQ

**Q: Should I write tests before or after code?**
A: Ideally TDD (test-first), but pragmatically write tests as you develop features.

**Q: How do I test Supabase RLS policies?**
A: Use integration tests with different user contexts, or use Supabase's policy testing features.

**Q: What's the minimum coverage for a PR to be merged?**
A: 80% coverage for new code, no decrease in overall coverage.

**Q: Should I test private methods?**
A: No, test public API. Private methods are tested indirectly.

**Q: How do I mock Expo modules?**
A: Use `jest.mock()` or create manual mocks in `__mocks__/` directory.

**Q: What about snapshot tests?**
A: Use sparingly for UI components, not for data structures.

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0
**Maintainer**: Hive Mind - Tester Agent

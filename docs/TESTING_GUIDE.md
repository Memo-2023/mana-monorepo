# Testing Guide

Comprehensive guide for testing in the ManaCore monorepo, including local testing, CI/CD integration, and best practices.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests Locally](#running-tests-locally)
- [Automated Daily Tests](#automated-daily-tests)
- [Writing Tests](#writing-tests)
- [Test Data Management](#test-data-management)
- [Coverage Requirements](#coverage-requirements)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Overview

The ManaCore monorepo uses a comprehensive testing strategy:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between services
- **E2E Tests**: Test complete user flows (planned)
- **Coverage Tracking**: Monitor test coverage over time
- **Automated Daily Runs**: Ensure continuous quality

### Testing Stack

| Platform | Framework | Runner | Coverage |
|----------|-----------|--------|----------|
| Backend (NestJS) | Jest | Jest | Istanbul |
| Web (SvelteKit) | Vitest | Vitest | V8 |
| Mobile (React Native) | Jest | Jest | Istanbul |
| Shared Packages | Jest/Vitest | Depends | Istanbul/V8 |

## Test Types

### Unit Tests

Test individual functions, services, and components in isolation.

**Location**: `src/**/*.spec.ts` (backend), `src/**/*.test.ts` (web/mobile)

**Example (Backend)**:
```typescript
// src/auth/auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash passwords correctly', async () => {
    const password = 'TestPassword123!';
    const hashed = await service.hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(30);
  });
});
```

### Integration Tests

Test interactions between multiple services or components.

**Location**: `test/integration/*.spec.ts`

**Example**:
```typescript
// test/integration/auth-flow.integration.spec.ts
describe('Authentication Flow', () => {
  it('should complete registration -> login -> token validation', async () => {
    // Register
    const registerResult = await authService.register({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    });

    expect(registerResult.id).toBeDefined();

    // Login
    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(loginResult.accessToken).toBeDefined();

    // Validate token
    const validation = await authService.validateToken(loginResult.accessToken);
    expect(validation.valid).toBe(true);
  });
});
```

### E2E Tests (Planned)

End-to-end tests using Playwright to test complete user flows across frontend and backend.

## Running Tests Locally

### Prerequisites

1. **Docker**: Required for database tests
   ```bash
   pnpm docker:up
   ```

2. **Dependencies**: Install all packages
   ```bash
   pnpm install
   ```

### Run All Tests

```bash
# Run all tests in monorepo
pnpm test

# Run tests with coverage
./scripts/run-tests-with-coverage.sh
```

### Run Specific Tests

```bash
# Test specific service
./scripts/run-tests-with-coverage.sh mana-core-auth

# Test specific backend
./scripts/run-tests-with-coverage.sh chat-backend

# Test within a package
cd services/mana-core-auth
pnpm test

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Coverage report
pnpm test:cov
```

### Run Integration Tests

```bash
# Auth integration tests
cd services/mana-core-auth
pnpm test:e2e

# Or run specific integration test file
pnpm test test/integration/auth-flow.integration.spec.ts
```

## Automated Daily Tests

The daily test workflow runs automatically every day at 2 AM UTC and can be triggered manually.

### Workflow Features

- **Parallel Execution**: Tests run in parallel across multiple test suites
- **Database Setup**: Automatic PostgreSQL/Redis setup for each test suite
- **Coverage Enforcement**: Fails if coverage drops below 80%
- **Flaky Test Detection**: Identifies tests that fail intermittently
- **Performance Tracking**: Monitors test execution time trends
- **Failure Notifications**: Creates GitHub issues and sends Slack notifications

### Manual Trigger

1. Go to GitHub Actions
2. Select "Daily Tests" workflow
3. Click "Run workflow"
4. (Optional) Adjust coverage threshold
5. Click "Run workflow" button

### Viewing Results

Daily test results are available in:

- **GitHub Actions**: View workflow runs and logs
- **Artifacts**: Download coverage reports, metrics, and flaky test reports
- **GitHub Issues**: Automatically created for failures and flaky tests
- **Slack**: Notifications sent on failure (if configured)

## Writing Tests

### Best Practices

1. **Descriptive Names**: Use clear, descriptive test names
   ```typescript
   // ✅ Good
   it('should hash passwords using bcrypt with cost factor 10', () => {});

   // ❌ Bad
   it('should work', () => {});
   ```

2. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   it('should validate JWT tokens correctly', async () => {
     // Arrange
     const token = await generateToken({ userId: '123' });

     // Act
     const result = await validateToken(token);

     // Assert
     expect(result.valid).toBe(true);
     expect(result.payload.userId).toBe('123');
   });
   ```

3. **Isolation**: Tests should not depend on each other
   ```typescript
   // ✅ Good - Each test is independent
   beforeEach(async () => {
     await cleanupDatabase();
     await seedTestData();
   });

   // ❌ Bad - Tests depend on execution order
   let userId;
   it('should create user', () => {
     userId = createUser(); // Other tests depend on this
   });
   ```

4. **Mock External Services**: Don't make real API calls
   ```typescript
   // ✅ Good
   jest.mock('openai', () => ({
     OpenAI: jest.fn().mockImplementation(() => ({
       chat: {
         completions: {
           create: jest.fn().mockResolvedValue({ choices: [...] }),
         },
       },
     })),
   }));

   // ❌ Bad - Real API call
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   ```

5. **Use Test Factories**: Create test data consistently
   ```typescript
   // Create a test factory
   function createTestUser(overrides = {}) {
     return {
       id: uuid(),
       email: `test-${Date.now()}@example.com`,
       name: 'Test User',
       role: 'user',
       ...overrides,
     };
   }

   // Use in tests
   it('should create user', () => {
     const user = createTestUser({ email: 'specific@example.com' });
   });
   ```

### Testing Backend Services

```typescript
// services/mana-core-auth/src/credits/credits.service.spec.ts
import { Test } from '@nestjs/testing';
import { CreditsService } from './credits.service';

describe('CreditsService', () => {
  let service: CreditsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreditsService,
        // Mock dependencies
        {
          provide: 'DATABASE',
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
  });

  describe('deductCredits', () => {
    it('should deduct from balance if sufficient', async () => {
      const result = await service.deductCredits('user-id', 10);

      expect(result.isOk()).toBe(true);
      expect(result.value.balance).toBe(90); // Started with 100
    });

    it('should return error if insufficient balance', async () => {
      const result = await service.deductCredits('user-id', 200);

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('INSUFFICIENT_CREDITS');
    });
  });
});
```

### Testing Web Components (Svelte)

```typescript
// apps/chat/apps/web/src/lib/components/Button.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('should render with text', () => {
    render(Button, { props: { text: 'Click me' } });

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(Button, { props: { text: 'Click', onClick } });

    await fireEvent.click(screen.getByText('Click'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Mobile Components (React Native)

```typescript
// apps/chat/apps/mobile/src/components/MessageBubble.test.tsx
import { render, screen } from '@testing-library/react-native';
import MessageBubble from './MessageBubble';

describe('MessageBubble', () => {
  it('should render user message', () => {
    render(
      <MessageBubble
        message={{ role: 'user', content: 'Hello!' }}
      />
    );

    expect(screen.getByText('Hello!')).toBeTruthy();
  });

  it('should render assistant message', () => {
    render(
      <MessageBubble
        message={{ role: 'assistant', content: 'Hi there!' }}
      />
    );

    expect(screen.getByText('Hi there!')).toBeTruthy();
  });
});
```

## Test Data Management

### Seeding Test Data

Use deterministic test data for reproducible tests.

```bash
# Seed all services
./scripts/test-data/seed-test-data.sh

# Seed specific service
./scripts/test-data/seed-test-data.sh auth
./scripts/test-data/seed-test-data.sh chat
```

### Test User Accounts

Pre-seeded test users (password: `TestPassword123!`):

| Email | ID | Role |
|-------|-----|------|
| `test-user-1@example.com` | `00000000-0000-0000-0000-000000000001` | user |
| `test-user-2@example.com` | `00000000-0000-0000-0000-000000000002` | user |
| `admin@example.com` | `00000000-0000-0000-0000-000000000003` | admin |

### Cleanup After Tests

```bash
# Clean all databases
./scripts/test-data/cleanup-test-data.sh

# Clean specific database
./scripts/test-data/cleanup-test-data.sh auth
```

### Isolation Strategy

Each test suite should:

1. **Setup**: Create necessary test data
2. **Execute**: Run tests
3. **Teardown**: Clean up test data

```typescript
describe('User Management', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Setup: Create test user
    const user = await createTestUser();
    testUserId = user.id;
  });

  afterEach(async () => {
    // Teardown: Remove test user
    await deleteUser(testUserId);
  });

  it('should update user profile', async () => {
    // Test uses testUserId
  });
});
```

## Coverage Requirements

### Global Thresholds

All packages must maintain minimum coverage:

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Statements | 80% |
| Functions | 80% |
| Branches | 80% |

### Critical Path Requirements

Critical services require 100% coverage:

- **Auth Service**: `services/mana-core-auth/src/auth/auth.service.ts`
- **Credits Service**: `services/mana-core-auth/src/credits/credits.service.ts`
- **JWT Guards**: `services/mana-core-auth/src/common/guards/jwt-auth.guard.ts`

### Viewing Coverage Reports

```bash
# Generate coverage report
cd services/mana-core-auth
pnpm test:cov

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

Coverage is configured in `jest.config.js` or `vitest.config.ts`:

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific file requirements
    './src/auth/auth.service.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
  ],
};
```

## Troubleshooting

### Common Issues

#### Tests Fail with Database Connection Error

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Start Docker services
pnpm docker:up

# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -U manacore -h localhost -p 5432 -d manacore
```

#### Tests Pass Locally but Fail in CI

**Problem**: Tests work locally but fail in GitHub Actions

**Solution**:
1. Check environment variables in workflow
2. Ensure database setup steps run before tests
3. Verify Docker services are healthy
4. Check for hardcoded local paths

#### Coverage Drops Below Threshold

**Problem**: `Coverage 75% is below threshold 80%`

**Solution**:
1. Identify uncovered code: `open coverage/lcov-report/index.html`
2. Write tests for uncovered functions
3. Remove dead code that can't be tested
4. Adjust threshold if justified (requires team approval)

#### Flaky Tests

**Problem**: Test fails intermittently

**Solution**:
1. Check for timing issues (use `await` properly)
2. Ensure proper test isolation (no shared state)
3. Mock time-dependent functions
4. Add explicit waits for async operations

```typescript
// ❌ Bad - Race condition
it('should process async operation', () => {
  startAsyncOperation();
  expect(result).toBeDefined(); // Might not be ready
});

// ✅ Good - Properly awaited
it('should process async operation', async () => {
  await startAsyncOperation();
  expect(result).toBeDefined(); // Guaranteed ready
});
```

#### Mock Not Working

**Problem**: Mock doesn't override actual implementation

**Solution**:
```typescript
// ✅ Correct - Mock before import
jest.mock('./service');
import { MyService } from './service';

// ❌ Wrong - Import before mock
import { MyService } from './service';
jest.mock('./service'); // Too late!
```

### Getting Help

1. **Check existing tests**: Look at similar test files for patterns
2. **Read test documentation**: `docs/test-examples/`
3. **Ask in Slack**: `#testing` channel
4. **GitHub Issues**: Label with `testing` for visibility

## CI/CD Integration

### Workflow Triggers

| Event | Workflow | When |
|-------|----------|------|
| PR to main/dev | `ci.yml` | Validation only (type-check, lint) |
| Push to main/dev | `ci.yml` | Build Docker images |
| Daily at 2 AM UTC | `daily-tests.yml` | Full test suite + coverage |
| Manual trigger | `daily-tests.yml` | On-demand testing |

### Test Artifacts

Artifacts are stored for 30-90 days:

- **Coverage Reports**: `coverage-{service-name}` (30 days)
- **Aggregated Coverage**: `aggregated-coverage-report` (90 days)
- **Test Metrics**: `test-metrics` (365 days)
- **Flaky Test Reports**: `flaky-test-report` (90 days)

### Monitoring Dashboard

Track test trends over time:

1. **Coverage Trend**: View in aggregated coverage reports
2. **Flaky Tests**: Check `flaky-test-report` artifact
3. **Performance Metrics**: Review `test-metrics` artifact
4. **GitHub Issues**: Automatically created for failures

## Best Practices Summary

✅ **DO**:
- Write tests for all new features
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Use test factories for data creation
- Run tests locally before pushing
- Aim for high coverage (80%+)
- Use `beforeEach`/`afterEach` for setup/teardown

❌ **DON'T**:
- Skip tests for "simple" code
- Use vague test names like "should work"
- Create tests that depend on execution order
- Make real API calls in tests
- Hardcode IDs or timestamps
- Commit failing tests
- Ignore coverage drops
- Share state between tests

---

For more examples, see:
- [Backend Test Examples](test-examples/backend/)
- [Web Test Examples](test-examples/web/)
- [Mobile Test Examples](test-examples/mobile/)

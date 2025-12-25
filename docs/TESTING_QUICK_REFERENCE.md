# Testing Quick Reference

Fast reference guide for common testing tasks in the ManaCore monorepo.

## Quick Commands

### Run Tests

```bash
# All tests
pnpm test

# Specific service
cd services/mana-core-auth && pnpm test

# With coverage
pnpm test:cov

# Watch mode
pnpm test:watch

# Specific file
pnpm test src/auth/auth.service.spec.ts
```

### Run Tests with Script

```bash
# All packages
./scripts/run-tests-with-coverage.sh

# Specific package
./scripts/run-tests-with-coverage.sh mana-core-auth
./scripts/run-tests-with-coverage.sh chat-backend
```

### Setup/Cleanup

```bash
# Start Docker services
pnpm docker:up

# Seed test data
./scripts/test-data/seed-test-data.sh

# Clean test data
./scripts/test-data/cleanup-test-data.sh

# Stop Docker
pnpm docker:down
```

## Test Patterns

### Unit Test Template (Backend)

```typescript
import { Test } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
describe('Integration Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete flow', async () => {
    // Test full flow
  });
});
```

### Mock Template

```typescript
// Mock entire module
jest.mock('./external-service', () => ({
  ExternalService: jest.fn().mockImplementation(() => ({
    method: jest.fn().mockResolvedValue(mockData),
  })),
}));

// Mock specific function
jest.spyOn(service, 'method').mockResolvedValue(mockData);
```

## Coverage

### View Coverage

```bash
# Generate report
pnpm test:cov

# Open HTML report (macOS)
open coverage/lcov-report/index.html

# Open HTML report (Linux)
xdg-open coverage/lcov-report/index.html
```

### Coverage Thresholds

- **Global**: 80% minimum
- **Critical paths**: 100% required
- **Check in CI**: Automated daily tests

## Test Data

### Pre-seeded Users

| Email | Password | Role |
|-------|----------|------|
| `test-user-1@example.com` | `TestPassword123!` | user |
| `test-user-2@example.com` | `TestPassword123!` | user |
| `admin@example.com` | `AdminPassword123!` | admin |

### Create Test User

```typescript
const testUser = {
  id: uuid(),
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  role: 'user',
};
```

## Troubleshooting

### Database Connection Failed

```bash
# 1. Start Docker
pnpm docker:up

# 2. Verify running
docker ps | grep postgres

# 3. Test connection
psql -U manacore -h localhost -p 5432 -d manacore
```

### Tests Fail in CI but Pass Locally

1. Check environment variables
2. Verify database setup in workflow
3. Check for hardcoded paths
4. Review Docker service health checks

### Flaky Tests

1. Ensure proper `await` usage
2. Check test isolation
3. Mock time-dependent functions
4. Add explicit waits

```typescript
// ❌ Flaky
it('should complete', () => {
  asyncOperation();
  expect(result).toBeDefined();
});

// ✅ Stable
it('should complete', async () => {
  await asyncOperation();
  expect(result).toBeDefined();
});
```

## CI/CD

### Trigger Daily Tests Manually

1. Go to GitHub Actions
2. Select "Daily Tests" workflow
3. Click "Run workflow"
4. Set optional parameters
5. Run

### View Test Results

- **Workflow Runs**: GitHub Actions tab
- **Coverage**: Download artifacts from workflow
- **Metrics**: Check test-metrics artifact
- **Flaky Tests**: Check flaky-test-report artifact

## Best Practices

### DO ✅

- Write tests for new features
- Use descriptive names
- Keep tests isolated
- Mock external services
- Run locally before push
- Maintain 80%+ coverage

### DON'T ❌

- Skip tests
- Use vague names
- Depend on test order
- Make real API calls
- Hardcode values
- Commit failing tests

## Getting Help

- **Docs**: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/docs/TESTING_GUIDE.md`
- **Examples**: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/docs/test-examples/`
- **Issues**: Label with `testing` on GitHub
- **Team**: Ask in #testing Slack channel

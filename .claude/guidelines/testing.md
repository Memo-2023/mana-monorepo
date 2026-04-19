# Testing Guidelines

## Overview

| App Type | Framework | Config | File Pattern |
|----------|-----------|--------|--------------|
| **NestJS Backend** | Jest + ts-jest | `jest.config.js` | `*.spec.ts` |
| **Expo Mobile** | Jest + jest-expo | `jest.config.js` | `*.test.tsx` |
| **SvelteKit Web** | Vitest | `vitest.config.ts` | `*.test.ts` |
| **E2E** | Playwright | `playwright.config.ts` | `e2e/*.spec.ts` |

## Coverage

### Running coverage locally

```bash
# From any Vitest package with a test:coverage script
pnpm run test:coverage

# Across the whole monorepo (turbo orchestrates)
pnpm run test:coverage
```

Each package emits `coverage/` with:
- `lcov.info` — consumed by CI artifact upload and external tools
- `coverage-summary.json` — machine-readable totals
- `lcov-report/` — browsable HTML report

### Vitest config template

Packages that need coverage add this block to `vitest.config.ts` and declare `@vitest/coverage-v8` as a devDep:

```ts
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'json-summary'],
    reportsDirectory: './coverage',
    include: ['src/**/*.{ts,svelte}'],
    exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts', 'src/**/index.ts'],
  },
},
```

Add a script:

```json
"test:coverage": "vitest run --coverage"
```

### CI

`.github/workflows/ci.yml` runs `pnpm run test:coverage` and uploads `**/coverage/lcov.info` + `coverage-summary.json` as an artifact (14-day retention). The step is currently non-blocking via `continue-on-error: true` — we are establishing a baseline before flipping to a hard-fail gate. Remove that flag once the suite is green on main.

### Targets (aspirational, not yet enforced)

```ts
// Target once we flip coverage to blocking: 80% for all new code
coverage: {
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },
},
```

## Test File Organization

```
src/
├── __tests__/
│   ├── utils/
│   │   ├── mock-factories.ts    # Centralized factories
│   │   └── test-helpers.ts      # Shared utilities
│   └── fixtures/                # Test data files
├── feature/
│   ├── feature.service.ts
│   └── feature.service.spec.ts  # Colocated test
└── ...
```

## Mock Factories Pattern

Create reusable factories for test data:

```typescript
// src/__tests__/utils/mock-factories.ts
import { nanoid } from 'nanoid';

export const mockUserFactory = {
  create: (overrides: Partial<User> = {}): User => ({
    id: nanoid(),
    email: `test-${nanoid(6)}@example.com`,
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMany: (count: number, overrides: Partial<User> = {}): User[] => {
    return Array.from({ length: count }, () => mockUserFactory.create(overrides));
  },
};

export const mockFileFactory = {
  create: (overrides: Partial<File> = {}): File => ({
    id: nanoid(),
    userId: nanoid(),
    name: `file-${nanoid(6)}.txt`,
    mimeType: 'text/plain',
    size: 1024,
    storagePath: `/files/${nanoid()}`,
    storageKey: nanoid(),
    isDeleted: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMany: (count: number, overrides: Partial<File> = {}): File[] => {
    return Array.from({ length: count }, () => mockFileFactory.create(overrides));
  },
};

// Usage in tests:
const user = mockUserFactory.create({ role: 'admin' });
const files = mockFileFactory.createMany(5, { userId: user.id });
```

## Test Helpers

```typescript
// src/__tests__/utils/test-helpers.ts
import { ConfigService } from '@nestjs/config';

// Mock config service
export function createMockConfigService(overrides: Record<string, any> = {}) {
  const config: Record<string, any> = {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    MANA_CORE_AUTH_URL: 'http://localhost:3001',
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => config[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in config)) throw new Error(`Missing config: ${key}`);
      return config[key];
    }),
  } as unknown as ConfigService;
}

// Mock database with chainable methods
export function createMockDb() {
  const results: any[] = [];
  let resultIndex = 0;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    transaction: jest.fn(),

    // Thenable for await
    then: jest.fn((resolve) => resolve(results[resultIndex++] || [])),

    // Helper to set results
    mockResults: (...newResults: any[]) => {
      results.length = 0;
      results.push(...newResults);
      resultIndex = 0;
    },

    // Reset all mocks
    reset: () => {
      jest.clearAllMocks();
      results.length = 0;
      resultIndex = 0;
    },
  };

  return mockDb;
}

// Assertion helpers
export const assertHelpers = {
  assertIsUuid: (value: string) => {
    expect(value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  },

  assertIsRecent: (date: Date, toleranceMs = 5000) => {
    const now = Date.now();
    expect(date.getTime()).toBeGreaterThan(now - toleranceMs);
    expect(date.getTime()).toBeLessThanOrEqual(now);
  },

  assertResultOk: <T>(result: Result<T>): T => {
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok result');
    return result.data;
  },

  assertResultErr: (result: Result<any>, expectedCode?: ErrorCode) => {
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected error result');
    if (expectedCode) {
      expect(result.error.code).toBe(expectedCode);
    }
    return result.error;
  },
};
```

## NestJS Unit Tests

### Service Tests

```typescript
// src/files/file.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { mockFileFactory, createMockDb, assertHelpers } from '../__tests__/utils';
import { ErrorCode } from '@manacore/shared-errors';

describe('FileService', () => {
  let service: FileService;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterEach(() => {
    mockDb.reset();
  });

  describe('findById', () => {
    it('should return file when found', async () => {
      const mockFile = mockFileFactory.create();
      mockDb.mockResults([mockFile]);

      const result = await service.findById(mockFile.id, mockFile.userId);

      const file = assertHelpers.assertResultOk(result);
      expect(file.id).toBe(mockFile.id);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return NOT_FOUND error when file does not exist', async () => {
      mockDb.mockResults([]);

      const result = await service.findById('non-existent', 'user-123');

      const error = assertHelpers.assertResultErr(result, ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toContain('not found');
    });

    it('should not return files belonging to other users', async () => {
      mockDb.mockResults([]);  // Query returns empty due to userId filter

      const result = await service.findById('file-123', 'different-user');

      assertHelpers.assertResultErr(result, ErrorCode.FILE_NOT_FOUND);
    });
  });

  describe('create', () => {
    it('should create and return new file', async () => {
      const userId = 'user-123';
      const dto = {
        name: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        storagePath: '/files/test.txt',
        storageKey: 'key-123',
      };
      const createdFile = mockFileFactory.create({ ...dto, userId });
      mockDb.mockResults([createdFile]);

      const result = await service.create(userId, dto);

      const file = assertHelpers.assertResultOk(result);
      expect(file.name).toBe(dto.name);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should return validation error for empty name', async () => {
      const result = await service.create('user-123', {
        name: '',
        mimeType: 'text/plain',
        size: 100,
        storagePath: '/test',
        storageKey: 'key',
      });

      assertHelpers.assertResultErr(result, ErrorCode.MISSING_REQUIRED_FIELD);
    });
  });
});
```

### Controller Tests

```typescript
// src/files/file.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { mockFileFactory } from '../__tests__/utils';
import { ok, err, ErrorCode, AppException } from '@manacore/shared-errors';

describe('FileController', () => {
  let controller: FileController;
  let fileService: jest.Mocked<FileService>;

  const mockUser = { userId: 'user-123', email: 'test@example.com', role: 'user' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get(FileService) as jest.Mocked<FileService>;
  });

  describe('GET /files/:id', () => {
    it('should return file when found', async () => {
      const mockFile = mockFileFactory.create();
      fileService.findById.mockResolvedValue(ok(mockFile));

      const result = await controller.getFile(mockFile.id, mockUser);

      expect(result.file).toEqual(mockFile);
      expect(fileService.findById).toHaveBeenCalledWith(mockFile.id, mockUser.userId);
    });

    it('should throw AppException when file not found', async () => {
      fileService.findById.mockResolvedValue(
        err(ErrorCode.FILE_NOT_FOUND, 'File not found')
      );

      await expect(controller.getFile('non-existent', mockUser))
        .rejects
        .toThrow(AppException);
    });
  });

  describe('Guards', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', FileController);
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
```

## Vitest (SvelteKit) Tests

### Store Tests

```typescript
// src/lib/stores/files.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileStore } from './files.svelte';
import { api } from '$lib/api/client';

vi.mock('$lib/api/client', () => ({
  api: {
    files: {
      list: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('fileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileStore.reset();
  });

  it('should load files successfully', async () => {
    const mockFiles = [
      { id: '1', name: 'file1.txt' },
      { id: '2', name: 'file2.txt' },
    ];
    vi.mocked(api.files.list).mockResolvedValue({ ok: true, data: mockFiles });

    await fileStore.loadFiles();

    expect(fileStore.files).toEqual(mockFiles);
    expect(fileStore.loading).toBe(false);
    expect(fileStore.error).toBeNull();
  });

  it('should handle load error', async () => {
    vi.mocked(api.files.list).mockResolvedValue({
      ok: false,
      error: { code: 'ERR_7001', message: 'Database error' },
    });

    await fileStore.loadFiles();

    expect(fileStore.files).toEqual([]);
    expect(fileStore.error).toBe('Database error');
  });

  it('should remove file from list after delete', async () => {
    fileStore.files = [
      { id: '1', name: 'file1.txt' },
      { id: '2', name: 'file2.txt' },
    ];
    vi.mocked(api.files.delete).mockResolvedValue({ ok: true, data: undefined });

    await fileStore.deleteFile('1');

    expect(fileStore.files).toHaveLength(1);
    expect(fileStore.files[0].id).toBe('2');
  });
});
```

### Component Tests

```typescript
// src/lib/components/FileItem.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FileItem from './FileItem.svelte';

describe('FileItem', () => {
  const mockFile = {
    id: '1',
    name: 'document.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    createdAt: new Date('2024-01-01'),
  };

  it('should render file name', () => {
    render(FileItem, { props: { file: mockFile } });

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('should format file size', () => {
    render(FileItem, { props: { file: mockFile } });

    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(FileItem, { props: { file: mockFile, onDelete } });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockFile.id);
  });
});
```

## E2E Tests (Playwright)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'pnpm run build && pnpm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
// e2e/file-upload.spec.ts
import { test, expect } from '@playwright/test';

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/files');
  });

  test('should upload a file successfully', async ({ page }) => {
    // Open upload dialog
    await page.click('button:has-text("Upload")');

    // Select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/test-file.txt');

    // Wait for upload
    await expect(page.getByText('test-file.txt')).toBeVisible();
    await page.click('button:has-text("Upload")');

    // Verify file appears in list
    await expect(page.getByRole('listitem', { name: 'test-file.txt' })).toBeVisible();
  });

  test('should show error for oversized file', async ({ page }) => {
    await page.click('button:has-text("Upload")');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/large-file.zip');

    await expect(page.getByText(/file too large/i)).toBeVisible();
  });
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific project
pnpm --filter @storage/server test

# Run in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E in headed mode
pnpm test:e2e --headed
```

## Best Practices

### Do's

1. **Use factories** for consistent test data
2. **Test behavior, not implementation**
3. **One assertion per test** when possible
4. **Clean up** after each test (reset mocks, state)
5. **Use descriptive test names** that explain expected behavior

### Don'ts

1. **Don't test framework code** - trust NestJS, Svelte, etc.
2. **Don't mock everything** - integration tests are valuable
3. **Don't test private methods** - test through public API
4. **Don't share state between tests** - each test should be independent
5. **Don't write flaky tests** - fix or remove them

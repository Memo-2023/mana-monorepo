# Test Examples

This directory contains comprehensive example test files demonstrating best practices for testing different app types in the Mana monorepo.

## Directory Structure

```
test-examples/
├── backend/               # NestJS backend examples
│   ├── example.controller.spec.ts
│   └── example.service.spec.ts
├── mobile/                # React Native mobile examples
│   ├── ExampleComponent.test.tsx
│   └── authService.test.ts
├── web/                   # SvelteKit web examples
│   ├── Button.test.ts
│   └── page.server.test.ts
├── shared/                # Shared package examples
│   └── format.test.ts
└── README.md
```

## Example Files Overview

### Backend Tests (NestJS)

#### `example.controller.spec.ts`

Demonstrates:

- Controller unit testing with mocked services
- Request/response handling
- Authentication/authorization testing
- Input validation
- Error handling
- CRUD operations

**Key Patterns**:

- Use `@nestjs/testing` TestingModule
- Mock all service dependencies
- Test both success and error paths
- Verify service method calls

#### `example.service.spec.ts`

Demonstrates:

- Service business logic testing
- Database operation mocking
- External API mocking
- Result pattern for error handling
- Data validation and sanitization
- Authorization checks

**Key Patterns**:

- Mock database and external services
- Test error handling thoroughly
- Verify data transformations
- Test edge cases and boundary conditions

### Mobile Tests (React Native)

#### `ExampleComponent.test.tsx`

Demonstrates:

- Component rendering
- User interactions (press, long press)
- State management
- Props validation
- Accessibility testing
- Performance testing
- Snapshot testing

**Key Patterns**:

- Use `@testing-library/react-native`
- Test user behavior, not implementation
- Verify accessibility props
- Test loading and error states

#### `authService.test.ts`

Demonstrates:

- Async service testing
- API call mocking with fetch
- Storage operations (SecureStore)
- Error handling (network, storage)
- Token management
- Integration with other services

**Key Patterns**:

- Mock global fetch
- Mock Expo modules (SecureStore)
- Test timeout scenarios
- Verify storage operations

### Web Tests (SvelteKit)

#### `Button.test.ts`

Demonstrates:

- Svelte 5 component testing
- Reactive state with runes ($state, $derived)
- User events
- Accessibility
- Variants and sizes
- Custom events
- Debouncing

**Key Patterns**:

- Use `@testing-library/svelte`
- Test Svelte 5 reactivity
- Verify accessibility attributes
- Test custom event dispatch

#### `page.server.test.ts`

Demonstrates:

- Server load function testing
- Form action testing
- Database mocking (PocketBase)
- Authentication checks
- Input validation and sanitization
- Authorization enforcement
- File upload handling

**Key Patterns**:

- Mock `locals` object
- Mock database client
- Test redirect behavior
- Verify authorization logic
- Sanitize user input

### Shared Package Tests

#### `format.test.ts`

Demonstrates:

- Pure function testing
- Parameterized tests (it.each)
- Edge case testing
- Boundary testing
- Property-based testing
- Security testing (XSS, SQL injection)
- Unicode and emoji handling

**Key Patterns**:

- Test with multiple inputs using `it.each`
- Cover edge cases thoroughly
- Test security vulnerabilities
- Verify type safety

## How to Use These Examples

### 1. Copy and Adapt

Copy the relevant example to your project and adapt it:

```bash
# Copy backend controller test
cp docs/test-examples/backend/example.controller.spec.ts \
   apps/YOUR_PROJECT/apps/backend/src/your-module/__tests__/your.controller.spec.ts

# Update imports and names
```

### 2. Follow the Patterns

Each example demonstrates specific testing patterns:

- **AAA Pattern**: Arrange, Act, Assert
- **Descriptive Names**: Clear test descriptions
- **Mock Management**: Proper setup and cleanup
- **Error Testing**: Both happy and error paths
- **Edge Cases**: Boundary conditions and special cases

### 3. Customize for Your Needs

Adapt the examples to your specific requirements:

```typescript
// Example: Add project-specific mocks
jest.mock('@your-project/custom-service', () => ({
	CustomService: {
		doSomething: jest.fn(),
	},
}));
```

### 4. Reference Best Practices

Each file includes comments explaining:

- Why specific patterns are used
- What to test and what not to test
- Common pitfalls to avoid
- Performance considerations

## Testing Principles Demonstrated

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good - Testing behavior
it('should display error message when login fails', async () => {
	await userEvent.click(loginButton);
	expect(screen.getByText('Invalid credentials')).toBeVisible();
});

// ❌ Bad - Testing implementation
it('should set isLoading to false after login', async () => {
	await userEvent.click(loginButton);
	expect(component.state.isLoading).toBe(false);
});
```

### 2. Isolation

Each test should be independent:

```typescript
beforeEach(() => {
	jest.clearAllMocks(); // Clear mock call history
	// Reset any state
});
```

### 3. Comprehensive Coverage

Cover all code paths:

```typescript
describe('createItem', () => {
	it('should create successfully'); // Happy path
	it('should handle validation errors'); // Error path
	it('should handle database errors'); // Error path
	it('should handle edge cases'); // Edge cases
});
```

### 4. Readable Tests

Make tests self-documenting:

```typescript
describe('User Authentication', () => {
	describe('signIn', () => {
		it('should sign in successfully with valid credentials', () => {
			// Test implementation
		});

		it('should reject invalid email format', () => {
			// Test implementation
		});
	});
});
```

## Common Test Scenarios

### Authentication Testing

```typescript
it('should require authentication', async () => {
	mockEvent.locals = { user: null };
	await expect(load(mockEvent)).rejects.toThrow('Redirect');
});

it('should allow access with valid token', async () => {
	mockEvent.locals = { user: { id: '123' } };
	const result = await load(mockEvent);
	expect(result).toBeDefined();
});
```

### Form Validation

```typescript
it('should validate required fields', async () => {
	const formData = new FormData();
	formData.append('title', ''); // Invalid

	const result = await actions.create(mockEvent);

	expect(result.success).toBe(false);
	expect(result.error).toContain('required');
});
```

### Error Handling

```typescript
it('should handle network errors gracefully', async () => {
	(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

	const result = await authService.signIn('test@example.com', 'password');

	expect(result.success).toBe(false);
	expect(result.error).toContain('Network');
});
```

### Async Operations

```typescript
it('should wait for async operation to complete', async () => {
	const promise = service.fetchData();

	await waitFor(() => {
		expect(service.isLoading).toBe(false);
	});

	const result = await promise;
	expect(result).toBeDefined();
});
```

## Testing Checklist

When writing tests, ensure you cover:

- [ ] Happy path (successful execution)
- [ ] Error paths (validation errors, API errors)
- [ ] Edge cases (empty inputs, null values, boundaries)
- [ ] Authentication/authorization
- [ ] Input sanitization
- [ ] Accessibility (for components)
- [ ] Loading states
- [ ] Error states
- [ ] Network failures (for API calls)
- [ ] Storage failures (for persistence)

## Additional Resources

- [Full Testing Strategy](../TESTING.md)
- [Implementation Guide](../TESTING_IMPLEMENTATION_GUIDE.md)
- [Shared Test Configurations](../../packages/test-config/)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

## Contributing

When adding new examples:

1. Follow existing naming conventions
2. Add comprehensive comments
3. Demonstrate best practices
4. Cover edge cases
5. Update this README

## Questions?

- Check the [Testing Strategy](../TESTING.md) for overall approach
- Review [Implementation Guide](../TESTING_IMPLEMENTATION_GUIDE.md) for step-by-step instructions
- Look at existing tests in the project for patterns
- Ask in team chat for project-specific guidance

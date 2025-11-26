# Authentication Testing Guide

This guide provides comprehensive instructions for testing the authentication flow with token refresh system in the Storyteller mobile application.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Suite Structure](#test-suite-structure)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Test Scenarios](#test-scenarios)
- [Debugging Tools](#debugging-tools)
- [Common Issues](#common-issues)
- [Contributing](#contributing)

## 🎯 Overview

The authentication test suite is designed to thoroughly test all aspects of the authentication flow, including:

- **Sign-in flow**: Email/password authentication, OAuth flows, error handling
- **Token refresh system**: Automatic refresh, race condition prevention, queue management
- **Network error handling**: Offline states, recovery mechanisms, retry logic
- **State management**: TokenManager transitions, AuthContext updates, observer patterns
- **Supabase integration**: Token sync, RLS validation, storage operations

## 🗂️ Test Suite Structure

```
src/__tests__/
├── auth/                          # Main authentication tests
│   ├── signInFlow.test.ts         # Sign-in process tests
│   ├── tokenRefreshFlow.test.ts   # Token refresh system tests
│   ├── networkErrorHandling.test.ts # Network condition tests
│   ├── stateManagement.test.ts    # State transition tests
│   └── supabaseIntegration.test.ts # Supabase integration tests
├── utils/
│   └── authTestUtils.ts           # Test utilities and mocks
└── debugging/                     # Debug utilities
    ├── tokenStateInspector.ts     # Token state monitoring
    ├── requestQueueMonitor.ts     # Request queue analysis
    ├── networkConditionLogger.ts  # Network condition logging
    └── authFlowVisualizer.ts      # Flow visualization
```

## 🚀 Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Dependencies installed: `npm install`
3. React Native development environment set up

### Running All Tests

```bash
# Run all authentication tests
npm run test:auth

# Run with coverage report
npm run test:auth:coverage

# Run in watch mode
npm run test:auth:watch

# Run with debug output
npm run test:auth:debug
```

### Running Specific Test Suites

```bash
# Run sign-in tests only
npm run test:auth sign-in

# Run token refresh tests with debugging
npm run test:auth token-refresh --debug

# Run network error tests in watch mode
npm run test:auth network-errors --watch
```

## 🔧 Running Tests

### Available Test Suites

| Suite | Command | Description |
|-------|---------|-------------|
| `sign-in` | `npm run test:auth sign-in` | Authentication sign-in process |
| `token-refresh` | `npm run test:auth token-refresh` | Token refresh system |
| `network-errors` | `npm run test:auth network-errors` | Network error handling |
| `state-management` | `npm run test:auth state-management` | State transitions and management |
| `supabase-integration` | `npm run test:auth supabase-integration` | Supabase integration |
| `all` | `npm run test:auth` | All authentication tests |

### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `-h, --help` | Show help information | `npm run test:auth --help` |
| `-w, --watch` | Watch mode for development | `npm run test:auth sign-in --watch` |
| `-v, --verbose` | Verbose output | `npm run test:auth --verbose` |
| `-c, --coverage` | Generate coverage report | `npm run test:auth --coverage` |
| `-d, --debug` | Enable debug mode | `npm run test:auth --debug` |
| `-s, --silent` | Suppress console output | `npm run test:auth --silent` |
| `--max-workers N` | Set worker processes | `npm run test:auth --max-workers 4` |
| `--timeout N` | Set test timeout (ms) | `npm run test:auth --timeout 10000` |

### Examples

```bash
# Development workflow - watch sign-in tests
npm run test:auth sign-in --watch

# CI/CD - run all tests with coverage
npm run test:auth all --coverage --silent

# Debugging network issues
npm run test:auth network-errors --debug --verbose

# Quick smoke test
npm run test:auth sign-in --max-workers 1 --timeout 5000
```

## 🧪 Test Scenarios

### Sign In Flow Tests

**Location**: `src/__tests__/auth/signInFlow.test.ts`

Tests cover:
- ✅ Successful sign-in with valid credentials
- ❌ Failed sign-in with invalid credentials
- 📧 Email verification required scenarios
- 🔒 Firebase user password reset required
- 🌐 Network errors during sign-in
- 📱 Device binding validation
- 🏪 Storage error handling
- ⚡ Concurrent sign-in attempts

**Key Test Cases**:
```javascript
// Successful authentication
it('should sign in successfully with valid credentials')

// Error handling
it('should handle invalid credentials')
it('should handle email not verified error')

// Network conditions
it('should handle network errors during sign in')

// Edge cases
it('should handle concurrent sign in attempts')
```

### Token Refresh Flow Tests

**Location**: `src/__tests__/auth/tokenRefreshFlow.test.ts`

Tests cover:
- 🔄 Automatic token refresh on 401 responses
- 🚦 Request queuing during refresh
- ⏱️ Refresh token expiration handling
- 📱 Device ID change detection
- 🏃‍♂️ Race condition prevention
- 🔁 Retry logic with backoff
- 📊 Queue management and timeouts

**Key Test Cases**:
```javascript
// Automatic refresh
it('should refresh token automatically on 401 response')

// Concurrent handling
it('should queue concurrent requests during token refresh')

// Error scenarios
it('should handle refresh token expiration')
it('should detect device ID changes')

// Performance
it('should prevent multiple simultaneous refresh attempts')
```

### Network Error Handling Tests

**Location**: `src/__tests__/auth/networkErrorHandling.test.ts`

Tests cover:
- 🌐 Offline state detection and handling
- 📡 Network recovery with retry logic
- ⏰ Timeout scenarios
- 📊 Unstable connection handling
- 🔄 Progressive backoff retry
- 🎯 Fetch interceptor integration

**Key Test Cases**:
```javascript
// Offline handling
it('should handle offline state during sign in')
it('should detect network recovery and resume operations')

// Error recovery
it('should retry failed requests after network recovery')
it('should handle progressive backoff during retries')

// Connection quality
it('should handle intermittent connectivity issues')
```

### State Management Tests

**Location**: `src/__tests__/auth/stateManagement.test.ts`

Tests cover:
- ⚡ TokenManager state transitions
- 🔄 AuthContext state updates
- 👁️ Observer pattern implementation
- 🧹 Cleanup and memory management
- 🏃‍♂️ Race condition prevention
- 📊 State consistency during errors

**Key Test Cases**:
```javascript
// State transitions
it('should transition from IDLE to VALID on successful token retrieval')
it('should transition to REFRESHING during token refresh')

// Observer pattern
it('should properly unsubscribe observers')
it('should handle observer errors gracefully')

// Race conditions
it('should prevent race conditions in concurrent token requests')
```

### Supabase Integration Tests

**Location**: `src/__tests__/auth/supabaseIntegration.test.ts`

Tests cover:
- 🔄 Token sync with Supabase client
- 🛡️ RLS policy validation
- 📁 Storage operations with auth
- 🔐 Session management
- ❌ Integration error scenarios

**Key Test Cases**:
```javascript
// Token sync
it('should update Supabase auth when token becomes valid')
it('should handle Supabase auth update after token refresh')

// RLS validation
it('should validate RLS policies work with refreshed tokens')
it('should retry queries after token refresh on RLS failures')

// Storage operations
it('should perform storage operations with valid tokens')
```

## 🛠️ Debugging Tools

The test suite includes comprehensive debugging utilities:

### Token State Inspector

**Purpose**: Monitor token state transitions and collect metrics
**Usage**: Automatically enabled in debug mode
**Features**:
- Real-time state transition logging
- Token payload inspection
- Performance metrics collection
- State pattern analysis

```javascript
import { tokenStateInspector } from '../debugging/tokenStateInspector';

// Start monitoring
tokenStateInspector.start();

// Get current state
const state = tokenStateInspector.getCurrentState();

// Print detailed report
tokenStateInspector.printReport();
```

### Request Queue Monitor

**Purpose**: Track request queuing during token refresh
**Usage**: Monitor concurrent request handling
**Features**:
- Request lifecycle tracking
- Queue performance metrics
- Long-running request detection
- Throughput analysis

```javascript
import { requestQueueMonitor } from '../debugging/requestQueueMonitor';

// Start monitoring
requestQueueMonitor.start();

// Get queue status
const status = requestQueueMonitor.getCurrentStatus();

// Wait for queue to empty
await requestQueueMonitor.waitForEmptyQueue();
```

### Network Condition Logger

**Purpose**: Log and analyze network conditions
**Usage**: Debug network-related authentication issues
**Features**:
- Network quality assessment
- Latency and bandwidth monitoring
- Error pattern analysis
- Connection stability tracking

```javascript
import { networkConditionLogger } from '../debugging/networkConditionLogger';

// Start logging
networkConditionLogger.start();

// Get current network quality
const quality = networkConditionLogger.getCurrentNetworkQuality();

// Analyze performance
const analysis = networkConditionLogger.analyzePerformance();
```

### Auth Flow Visualizer

**Purpose**: Visualize complete authentication flows
**Usage**: Understand complex auth sequences
**Features**:
- Flow step tracking
- Visual flow representation
- Pattern analysis
- Success/failure metrics

```javascript
import { authFlowVisualizer } from '../debugging/authFlowVisualizer';

// Start tracking a flow
authFlowVisualizer.startFlow('Sign In Test');

// Record custom events
authFlowVisualizer.recordEvent('User clicked sign in');

// End flow and analyze
authFlowVisualizer.endFlow(true);
authFlowVisualizer.printAnalysis();
```

## 🐛 Common Issues

### Test Timeout Errors

**Symptom**: Tests fail with timeout errors
**Solution**: Increase timeout or check for infinite loops

```bash
# Increase timeout to 30 seconds
npm run test:auth token-refresh --timeout 30000
```

### Mock Configuration Issues

**Symptom**: Tests fail due to mock setup
**Solution**: Check mock implementations in `authTestUtils.ts`

```javascript
// Common mock setup
beforeEach(() => {
  mockStorage.clear();
  tokenManager.reset();
  jest.clearAllMocks();
});
```

### Network Simulation Problems

**Symptom**: Network condition tests fail unexpectedly
**Solution**: Ensure network simulator is reset between tests

```javascript
afterEach(() => {
  networkSimulator.reset();
});
```

### Race Condition Test Failures

**Symptom**: Intermittent failures in concurrent tests
**Solution**: Use proper synchronization utilities

```javascript
// Wait for specific conditions
await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

// Use deferred promises for coordination
const { promise, resolve } = testUtils.createDeferred();
```

### Coverage Issues

**Symptom**: Low code coverage despite comprehensive tests
**Solution**: Check coverage configuration and exclusions

```bash
# Generate detailed coverage report
npm run test:auth:coverage

# View coverage report
open coverage/auth/lcov-report/index.html
```

## 🧪 Writing Custom Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tokenManager, TokenState } from '../../services/tokenManager';
import { 
  mockStorage,
  TestScenarioBuilder,
  TokenStateObserver,
  testUtils,
} from '../utils/authTestUtils';

describe('My Custom Auth Test', () => {
  let tokenObserver: TokenStateObserver;

  beforeEach(() => {
    tokenObserver = new TokenStateObserver();
    tokenManager.reset();
    mockStorage.clear();
  });

  it('should handle my specific scenario', async () => {
    // Arrange
    const scenario = new TestScenarioBuilder()
      .withValidTokens()
      .withMockResponse('/api/test', mockResponse)
      .build();

    const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

    try {
      // Act
      const result = await tokenManager.getValidToken();

      // Assert
      expect(result).toBe(expectedToken);
      await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));
    } finally {
      unsubscribe();
      scenario.cleanup();
    }
  });
});
```

### Using Test Utilities

```javascript
import { 
  MOCK_TOKENS,
  MOCK_USER_DATA,
  mockFetchResponses,
  NetworkCondition,
  TestScenarioBuilder,
} from '../utils/authTestUtils';

// Set up test scenario
const scenario = new TestScenarioBuilder()
  .withExpiredTokens()
  .withNetworkCondition(NetworkCondition.SLOW)
  .withMockResponse('/auth/refresh', mockFetchResponses.refreshTokenSuccess())
  .build();

// Use mock data
expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
expect(user).toMatchObject(MOCK_USER_DATA);

// Clean up
scenario.cleanup();
```

## 🤝 Contributing

### Adding New Tests

1. **Create test file**: Follow naming convention `[feature].test.ts`
2. **Use test utilities**: Import from `authTestUtils.ts`
3. **Follow patterns**: Use existing tests as templates
4. **Add documentation**: Update this guide with new test scenarios

### Debugging Test Failures

1. **Enable debug mode**: Use `--debug` flag
2. **Use debugging utilities**: Leverage built-in monitoring tools
3. **Check console output**: Look for detailed error messages
4. **Verify mocks**: Ensure mock implementations are correct

### Performance Considerations

1. **Mock external dependencies**: Don't make real network calls
2. **Clean up after tests**: Reset state and clear mocks
3. **Use appropriate timeouts**: Balance thoroughness with speed
4. **Parallel execution**: Ensure tests can run concurrently

## 📈 Test Coverage

The test suite aims for comprehensive coverage of:

- **Token Management**: 95%+ coverage of TokenManager
- **Authentication Service**: 90%+ coverage of AuthService
- **Context Management**: 85%+ coverage of AuthContext
- **Fetch Interceptor**: 80%+ coverage of fetchInterceptor

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:auth:coverage

# Open detailed report
open coverage/auth/lcov-report/index.html
```

### Coverage Exclusions

The following are excluded from coverage requirements:
- Debug utilities
- Mock implementations
- Type definitions
- Platform-specific code

## 🔍 Monitoring and Metrics

### Test Execution Metrics

Tests automatically collect:
- Execution duration per suite
- Success/failure rates
- Performance bottlenecks
- Resource usage patterns

### Debug Output

When running with `--debug` flag, tests provide:
- Detailed step-by-step execution logs
- Token state transition history
- Network condition changes
- Request queue status updates

### Test Reports

Generated reports include:
- Test results summary
- Coverage metrics
- Performance analysis
- Error pattern identification

Reports are saved to `test-reports/auth-tests-[timestamp].json`

## 📚 Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **React Native Testing**: https://reactnative.dev/docs/testing-overview
- **Expo Testing**: https://docs.expo.dev/guides/testing-with-jest/
- **Authentication Best Practices**: Internal wiki (link when available)

---

For questions or issues with the test suite, please:
1. Check this guide first
2. Run tests with `--debug` flag for detailed output
3. Review existing test cases for patterns
4. Create an issue with detailed reproduction steps

**Happy Testing!** 🧪✨
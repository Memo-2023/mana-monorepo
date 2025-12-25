/**
 * Test Helper: silentError
 *
 * Suppresses console.error output for tests that intentionally trigger errors.
 * This keeps test output clean while still verifying error handling behavior.
 *
 * Usage:
 * ```typescript
 * it('should handle error gracefully', async () => {
 *   await silentError(async () => {
 *     // Test code that triggers console.error
 *     await service.methodThatLogsErrors();
 *   });
 * });
 * ```
 */
export async function silentError<T>(fn: () => T | Promise<T>): Promise<T> {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

	try {
		return await fn();
	} finally {
		consoleErrorSpy.mockRestore();
	}
}

/**
 * Test Helper: silentConsole
 *
 * Suppresses all console output (log, warn, error) for cleaner test output.
 *
 * Usage:
 * ```typescript
 * it('should work without console spam', async () => {
 *   await silentConsole(async () => {
 *     // Test code that logs to console
 *   });
 * });
 * ```
 */
export async function silentConsole<T>(fn: () => T | Promise<T>): Promise<T> {
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
	const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

	try {
		return await fn();
	} finally {
		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
		consoleWarnSpy.mockRestore();
	}
}

/**
 * Test Helper: suppressConsoleInTests
 *
 * Globally suppress console output for an entire test suite.
 * Use in beforeEach/afterEach for suite-wide suppression.
 *
 * Usage:
 * ```typescript
 * describe('MyService', () => {
 *   beforeEach(() => {
 *     suppressConsoleInTests();
 *   });
 *
 *   afterEach(() => {
 *     restoreConsoleInTests();
 *   });
 * });
 * ```
 */
let consoleSpies: jest.SpyInstance[] = [];

export function suppressConsoleInTests() {
	consoleSpies = [
		jest.spyOn(console, 'error').mockImplementation(() => {}),
		jest.spyOn(console, 'log').mockImplementation(() => {}),
		jest.spyOn(console, 'warn').mockImplementation(() => {}),
	];
}

export function restoreConsoleInTests() {
	consoleSpies.forEach((spy) => spy.mockRestore());
	consoleSpies = [];
}

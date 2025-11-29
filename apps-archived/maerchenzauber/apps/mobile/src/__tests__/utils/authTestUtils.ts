/**
 * Test utilities for authentication testing
 * Provides mock functions, helper functions, and network condition simulators
 */

import { jest } from '@jest/globals';
import { TokenState } from '../../services/tokenManager';
import type { User } from '../../context/AuthContext';

// Mock token data
export const MOCK_TOKENS = {
	VALID_APP_TOKEN:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJhcHBfaWQiOiJ0ZXN0LWFwcC1pZCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjEwMDAwMDAwfQ.fake-signature',
	EXPIRED_APP_TOKEN:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJhcHBfaWQiOiJ0ZXN0LWFwcC1pZCIsImV4cCI6MTYxMDAwMDAwMCwiaWF0IjoxNjEwMDAwMDAwfQ.fake-signature',
	VALID_REFRESH_TOKEN: 'refresh_token_12345',
	INVALID_REFRESH_TOKEN: 'invalid_refresh_token',
	DEVICE_ID_CHANGED_TOKEN: 'device_changed_token_12345',
};

// Mock user data
export const MOCK_USER_DATA: User = {
	sub: '1234567890',
	email: 'test@example.com',
	role: 'user',
	app_id: 'test-app-id',
	exp: 9999999999,
	iat: 1610000000,
};

// Mock device info
export const MOCK_DEVICE_INFO = {
	deviceId: 'test-device-id-12345',
	deviceName: 'Test Device',
	deviceType: 'ios' as const,
	userAgent: 'TestApp/1.0.0 iOS/15.0',
};

// Network condition types
export enum NetworkCondition {
	ONLINE = 'online',
	OFFLINE = 'offline',
	SLOW = 'slow',
	UNSTABLE = 'unstable',
	TIMEOUT = 'timeout',
}

// Mock response builders
export class MockResponseBuilder {
	private status: number = 200;
	private headers: Record<string, string> = {};
	private body: any = {};
	private delay: number = 0;
	private shouldFail: boolean = false;

	static success(data?: any) {
		return new MockResponseBuilder().withStatus(200).withBody(data);
	}

	static error(status: number, message?: string) {
		return new MockResponseBuilder()
			.withStatus(status)
			.withBody({ error: message || 'Error occurred' });
	}

	static unauthorized(message?: string) {
		return MockResponseBuilder.error(401, message || 'Unauthorized');
	}

	static networkError() {
		return new MockResponseBuilder().withNetworkError();
	}

	withStatus(status: number) {
		this.status = status;
		return this;
	}

	withHeader(key: string, value: string) {
		this.headers[key] = value;
		return this;
	}

	withBody(body: any) {
		this.body = body;
		return this;
	}

	withDelay(ms: number) {
		this.delay = ms;
		return this;
	}

	withNetworkError() {
		this.shouldFail = true;
		return this;
	}

	build(): Promise<Response> {
		if (this.shouldFail) {
			return Promise.reject(new Error('Network request failed'));
		}

		const response = {
			ok: this.status >= 200 && this.status < 300,
			status: this.status,
			statusText: this.getStatusText(this.status),
			headers: new Map(Object.entries(this.headers)),
			json: async () => this.body,
			text: async () => JSON.stringify(this.body),
			clone: () => response,
		} as Response;

		if (this.delay > 0) {
			return new Promise((resolve) => {
				setTimeout(() => resolve(response), this.delay);
			});
		}

		return Promise.resolve(response);
	}

	private getStatusText(status: number): string {
		const statusTexts: Record<number, string> = {
			200: 'OK',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			500: 'Internal Server Error',
		};
		return statusTexts[status] || 'Unknown';
	}
}

// Network condition simulator
export class NetworkSimulator {
	private condition: NetworkCondition = NetworkCondition.ONLINE;
	private originalFetch = globalThis.fetch;

	setCondition(condition: NetworkCondition) {
		this.condition = condition;
		this.setupMockFetch();
	}

	reset() {
		this.condition = NetworkCondition.ONLINE;
		globalThis.fetch = this.originalFetch;
	}

	private setupMockFetch() {
		globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			switch (this.condition) {
				case NetworkCondition.OFFLINE:
					throw new Error('Network request failed: Device offline');

				case NetworkCondition.SLOW:
					await new Promise((resolve) => setTimeout(resolve, 3000));
					return this.originalFetch(input, init);

				case NetworkCondition.UNSTABLE:
					if (Math.random() < 0.3) {
						throw new Error('Network request failed: Connection unstable');
					}
					await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
					return this.originalFetch(input, init);

				case NetworkCondition.TIMEOUT:
					throw new Error('Network request failed: Request timeout');

				default:
					return this.originalFetch(input, init);
			}
		});
	}
}

// Storage mock utilities
export class MockStorage {
	private storage: Map<string, string> = new Map();

	async getItem<T = any>(key: string): Promise<T | null> {
		const value = this.storage.get(key);
		if (value === undefined) return null;
		try {
			return JSON.parse(value);
		} catch {
			return value as T;
		}
	}

	async setItem(key: string, value: any): Promise<void> {
		this.storage.set(key, typeof value === 'string' ? value : JSON.stringify(value));
	}

	async removeItem(key: string): Promise<void> {
		this.storage.delete(key);
	}

	clear(): void {
		this.storage.clear();
	}

	size(): number {
		return this.storage.size;
	}

	keys(): string[] {
		return Array.from(this.storage.keys());
	}

	// Helper to set up common token scenarios
	setupValidTokens() {
		this.setItem('@auth/appToken', MOCK_TOKENS.VALID_APP_TOKEN);
		this.setItem('@auth/refreshToken', MOCK_TOKENS.VALID_REFRESH_TOKEN);
		this.setItem('@auth/userEmail', MOCK_USER_DATA.email);
	}

	setupExpiredTokens() {
		this.setItem('@auth/appToken', MOCK_TOKENS.EXPIRED_APP_TOKEN);
		this.setItem('@auth/refreshToken', MOCK_TOKENS.VALID_REFRESH_TOKEN);
		this.setItem('@auth/userEmail', MOCK_USER_DATA.email);
	}

	setupNoTokens() {
		this.clear();
	}
}

// Mock fetch responses for common scenarios
export const mockFetchResponses = {
	signInSuccess: () =>
		MockResponseBuilder.success({
			appToken: MOCK_TOKENS.VALID_APP_TOKEN,
			refreshToken: MOCK_TOKENS.VALID_REFRESH_TOKEN,
			appSupabaseToken: 'mock-supabase-token',
		}),

	signInInvalidCredentials: () => MockResponseBuilder.unauthorized('Invalid credentials'),

	signInEmailNotVerified: () => MockResponseBuilder.error(403, 'EMAIL_NOT_VERIFIED'),

	refreshTokenSuccess: () =>
		MockResponseBuilder.success({
			appToken: MOCK_TOKENS.VALID_APP_TOKEN,
			refreshToken: MOCK_TOKENS.VALID_REFRESH_TOKEN,
			userData: {
				id: MOCK_USER_DATA.sub,
				email: MOCK_USER_DATA.email,
				role: MOCK_USER_DATA.role,
			},
		}),

	refreshTokenExpired: () => MockResponseBuilder.unauthorized('Invalid refresh token'),

	refreshTokenDeviceChanged: () => MockResponseBuilder.unauthorized('Device ID has changed'),

	validateTokenSuccess: () => MockResponseBuilder.success({}),

	validateTokenExpired: () => MockResponseBuilder.unauthorized('JWT expired'),
};

// Token state observer for testing
export class TokenStateObserver {
	private states: Array<{ state: TokenState; token?: string; timestamp: number }> = [];
	private callback: (state: TokenState, token?: string) => void;

	constructor() {
		this.callback = (state: TokenState, token?: string) => {
			this.states.push({
				state,
				token,
				timestamp: Date.now(),
			});
		};
	}

	getCallback() {
		return this.callback;
	}

	getStates() {
		return [...this.states];
	}

	getLatestState() {
		return this.states[this.states.length - 1];
	}

	clear() {
		this.states = [];
	}

	// Helper methods for assertions
	hasState(state: TokenState): boolean {
		return this.states.some((s) => s.state === state);
	}

	getStateTransitions(): TokenState[] {
		return this.states.map((s) => s.state);
	}

	waitForState(state: TokenState, timeout: number = 5000): Promise<void> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(`Timeout waiting for state ${state}`));
			}, timeout);

			const checkState = () => {
				if (this.hasState(state)) {
					clearTimeout(timer);
					resolve();
				} else {
					setTimeout(checkState, 100);
				}
			};

			checkState();
		});
	}
}

// Test scenario builders
export class TestScenarioBuilder {
	private storage = new MockStorage();
	private networkSim = new NetworkSimulator();
	private fetchMocks: Array<{ url: string; response: () => Promise<Response> }> = [];

	withValidTokens() {
		this.storage.setupValidTokens();
		return this;
	}

	withExpiredTokens() {
		this.storage.setupExpiredTokens();
		return this;
	}

	withNoTokens() {
		this.storage.setupNoTokens();
		return this;
	}

	withNetworkCondition(condition: NetworkCondition) {
		this.networkSim.setCondition(condition);
		return this;
	}

	withMockResponse(urlPattern: string, responseBuilder: MockResponseBuilder) {
		this.fetchMocks.push({
			url: urlPattern,
			response: () => responseBuilder.build(),
		});
		return this;
	}

	build() {
		// Set up global fetch mock
		globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input.toString();

			// Find matching mock response
			const mockResponse = this.fetchMocks.find((mock) => url.includes(mock.url));
			if (mockResponse) {
				return mockResponse.response();
			}

			// Default to success response
			return MockResponseBuilder.success().build();
		});

		return {
			storage: this.storage,
			networkSim: this.networkSim,
			cleanup: () => {
				this.storage.clear();
				this.networkSim.reset();
			},
		};
	}
}

// Utility functions
export const testUtils = {
	// Wait for a condition to be true
	waitFor: async (
		condition: () => boolean,
		timeout: number = 5000,
		interval: number = 100
	): Promise<void> => {
		const start = Date.now();
		while (!condition()) {
			if (Date.now() - start > timeout) {
				throw new Error(`Timeout waiting for condition after ${timeout}ms`);
			}
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	},

	// Sleep utility
	sleep: (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),

	// Create a deferred promise
	createDeferred: <T>() => {
		let resolve: (value: T) => void;
		let reject: (reason?: any) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve: resolve!, reject: reject! };
	},

	// Mock console methods
	mockConsole: () => {
		const originalLog = console.log;
		const originalError = console.error;
		const originalDebug = console.debug;

		const logs: string[] = [];
		const errors: string[] = [];
		const debugs: string[] = [];

		console.log = jest.fn((...args) => logs.push(args.join(' ')));
		console.error = jest.fn((...args) => errors.push(args.join(' ')));
		console.debug = jest.fn((...args) => debugs.push(args.join(' ')));

		return {
			logs,
			errors,
			debugs,
			restore: () => {
				console.log = originalLog;
				console.error = originalError;
				console.debug = originalDebug;
			},
		};
	},

	// Decode mock JWT token
	decodeToken: (token: string) => {
		try {
			const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
			return payload;
		} catch {
			return null;
		}
	},

	// Create a mock JWT token
	createMockToken: (payload: any, expiresInSeconds: number = 3600) => {
		const header = { alg: 'HS256', typ: 'JWT' };
		const tokenPayload = {
			...payload,
			exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
			iat: Math.floor(Date.now() / 1000),
		};

		const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
		const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

		return `${encodedHeader}.${encodedPayload}.fake-signature`;
	},
};

// Export singleton instances for convenience
export const mockStorage = new MockStorage();
export const networkSimulator = new NetworkSimulator();
export const testScenarioBuilder = new TestScenarioBuilder();

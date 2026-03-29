// Global test setup für uLoad
import { vi } from 'vitest';
import type { Mock } from 'vitest';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: '1.0.0',
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(() => () => {}),
	},
	updated: {
		subscribe: vi.fn(() => () => {}),
	},
	navigating: {
		subscribe: vi.fn(() => () => {}),
	},
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn(),
}));

// Mock PocketBase für Tests
vi.mock('$lib/pocketbase', async () => {
	const actual = await vi.importActual('$lib/pocketbase');

	// Mock PocketBase-Instanz
	const mockPb = {
		authStore: {
			model: null,
			token: '',
			isValid: false,
			save: vi.fn(),
			clear: vi.fn(),
			onChange: vi.fn(() => () => {}),
		},
		collection: vi.fn(() => ({
			create: vi.fn(),
			getList: vi.fn(),
			getOne: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			authWithPassword: vi.fn(),
			authRefresh: vi.fn(),
			requestPasswordReset: vi.fn(),
			confirmPasswordReset: vi.fn(),
			requestVerification: vi.fn(),
			confirmVerification: vi.fn(),
		})),
		send: vi.fn(),
	};

	return {
		...actual,
		pb: mockPb,
	};
});

// Mock Toast Service
vi.mock('$lib/services/toast', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

// Mock Theme Store
vi.mock('$lib/theme.svelte', () => ({
	themeMode: { value: 'light' },
	themePreset: { value: 'minimal' },
	applyTheme: vi.fn(),
	initializeTheme: vi.fn(),
}));

// Global test utilities
export const createMockEvent = (data: any = {}) => ({
	request: {
		method: 'GET',
		url: new URL('http://localhost:5173'),
		formData: async () => new FormData(),
		json: async () => data,
		...data.request,
	},
	locals: {
		pb: {
			authStore: { model: null, isValid: false },
			collection: vi.fn(() => ({
				create: vi.fn(),
				getList: vi.fn(),
				getOne: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			})),
		},
		...data.locals,
	},
	cookies: {
		get: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
	},
	...data,
});

// Mock User für Tests
export const createMockUser = (overrides = {}) => ({
	id: 'test-user-id',
	email: 'test@example.com',
	username: 'testuser',
	name: 'Test User',
	verified: true,
	created: '2024-01-01T00:00:00Z',
	updated: '2024-01-01T00:00:00Z',
	...overrides,
});

// Mock Link für Tests
export const createMockLink = (overrides = {}) => ({
	id: 'test-link-id',
	user_id: 'test-user-id',
	original_url: 'https://example.com',
	short_code: 'test123',
	title: 'Test Link',
	is_active: true,
	click_count: 0,
	created: '2024-01-01T00:00:00Z',
	updated: '2024-01-01T00:00:00Z',
	...overrides,
});

// Mock Analytics für Tests
export const createMockAnalytics = (overrides = {}) => ({
	id: 'test-analytics-id',
	link_id: 'test-link-id',
	ip_address: '127.0.0.1',
	user_agent: 'Mozilla/5.0',
	country: 'Germany',
	device: 'desktop',
	created: '2024-01-01T00:00:00Z',
	...overrides,
});

// Test Environment Setup
beforeEach(() => {
	// Reset all mocks before each test
	vi.clearAllMocks();

	// Reset DOM (only in browser)
	if (isBrowser && typeof document !== 'undefined') {
		document.body.innerHTML = '';
	}

	// Reset localStorage/sessionStorage (only in browser)
	if (isBrowser && typeof localStorage !== 'undefined') {
		localStorage.clear();
		sessionStorage.clear();
	}
});

// Global error handler für Tests (only in Node)
if (isNode) {
	process.on('unhandledRejection', (error) => {
		console.error('Unhandled Promise Rejection in test:', error);
	});
}

// Extend expect with custom matchers
import { expect } from 'vitest';

expect.extend({
	toBeValidEmail(received: string) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const pass = emailRegex.test(received);

		return {
			pass,
			message: () =>
				pass
					? `Expected "${received}" not to be a valid email`
					: `Expected "${received}" to be a valid email`,
		};
	},

	toBeValidUsername(received: string) {
		const usernameRegex = /^[a-z0-9_-]+$/;
		const pass = usernameRegex.test(received) && received.length >= 3;

		return {
			pass,
			message: () =>
				pass
					? `Expected "${received}" not to be a valid username`
					: `Expected "${received}" to be a valid username (3+ chars, lowercase, numbers, - and _ only)`,
		};
	},

	toBeValidShortCode(received: string) {
		const codeRegex = /^[a-zA-Z0-9_-]+$/;
		const pass = codeRegex.test(received) && received.length >= 3;

		return {
			pass,
			message: () =>
				pass
					? `Expected "${received}" not to be a valid short code`
					: `Expected "${received}" to be a valid short code`,
		};
	},
});

// Type declarations für custom matchers
declare module 'vitest' {
	interface Assertion<T = any> {
		toBeValidEmail(): T;
		toBeValidUsername(): T;
		toBeValidShortCode(): T;
	}
	interface AsymmetricMatchersContaining {
		toBeValidEmail(): any;
		toBeValidUsername(): any;
		toBeValidShortCode(): any;
	}
}

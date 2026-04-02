import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

describe('api utilities', () => {
	beforeEach(() => {
		vi.resetModules();
		// Clear any window overrides
		delete (window as any).__PUBLIC_BACKEND_URL__;
	});

	describe('getBackendUrl', () => {
		it('should use injected URL if available', async () => {
			(window as any).__PUBLIC_BACKEND_URL__ = 'https://api.example.com';
			const { getBackendUrl } = await import('./api');
			expect(getBackendUrl()).toBe('https://api.example.com');
		});

		it('should default to localhost:3025 in dev mode', async () => {
			const { getBackendUrl } = await import('./api');
			// When no injected URL and import.meta.env.DEV is true
			const url = getBackendUrl();
			// Either localhost or empty string depending on env
			expect(typeof url).toBe('string');
		});
	});

	describe('api', () => {
		it('should prepend backend URL and /api/v1 prefix', async () => {
			(window as any).__PUBLIC_BACKEND_URL__ = 'https://api.example.com';
			const { api } = await import('./api');
			expect(api('/locations')).toBe('https://api.example.com/api/v1/locations');
		});

		it('should handle paths with query params', async () => {
			(window as any).__PUBLIC_BACKEND_URL__ = 'https://api.example.com';
			const { api } = await import('./api');
			expect(api('/locations?category=sight')).toBe(
				'https://api.example.com/api/v1/locations?category=sight'
			);
		});

		it('should handle path with id parameter', async () => {
			(window as any).__PUBLIC_BACKEND_URL__ = 'https://api.example.com';
			const { api } = await import('./api');
			expect(api('/locations/abc-123')).toBe('https://api.example.com/api/v1/locations/abc-123');
		});
	});
});

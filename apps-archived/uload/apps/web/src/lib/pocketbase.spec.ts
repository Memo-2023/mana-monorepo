import { describe, it, expect } from 'vitest';
import {
	generateShortCode,
	generateTagSlug,
	parseUserAgent,
	DEFAULT_TAG_COLORS,
} from './pocketbase';

describe('PocketBase Utilities', () => {
	describe('generateShortCode', () => {
		it('should generate code with default length of 6', () => {
			const code = generateShortCode();
			expect(code).toHaveLength(6);
			expect(code).toMatch(/^[a-zA-Z0-9]+$/);
		});

		it('should generate code with custom length', () => {
			const code = generateShortCode(10);
			expect(code).toHaveLength(10);
			expect(code).toMatch(/^[a-zA-Z0-9]+$/);
		});

		it('should generate unique codes', () => {
			const codes = new Set();
			for (let i = 0; i < 100; i++) {
				codes.add(generateShortCode());
			}
			// Very unlikely to have duplicates
			expect(codes.size).toBeGreaterThan(95);
		});

		it('should only contain alphanumeric characters', () => {
			for (let i = 0; i < 10; i++) {
				const code = generateShortCode(8);
				expect(code).toMatch(/^[a-zA-Z0-9]+$/);
			}
		});
	});

	describe('generateTagSlug', () => {
		it('should convert to lowercase', () => {
			expect(generateTagSlug('MyTag')).toBe('mytag');
			expect(generateTagSlug('UPPERCASE')).toBe('uppercase');
		});

		it('should replace spaces with hyphens', () => {
			expect(generateTagSlug('My Tag Name')).toBe('my-tag-name');
			expect(generateTagSlug('  Spaced  Out  ')).toBe('spaced-out');
		});

		it('should remove special characters', () => {
			expect(generateTagSlug('Tag!@#$%Name')).toBe('tag-name');
			expect(generateTagSlug('Tag.With.Dots')).toBe('tag-with-dots');
		});

		it('should handle unicode characters', () => {
			expect(generateTagSlug('Café')).toBe('caf');
			expect(generateTagSlug('München')).toBe('m-nchen');
		});

		it('should remove leading and trailing hyphens', () => {
			expect(generateTagSlug('---tag---')).toBe('tag');
			expect(generateTagSlug('!tag!')).toBe('tag');
		});

		it('should handle empty strings', () => {
			expect(generateTagSlug('')).toBe('');
		});

		it('should collapse multiple hyphens', () => {
			expect(generateTagSlug('tag   with   spaces')).toBe('tag-with-spaces');
		});
	});

	describe('parseUserAgent', () => {
		it('should detect Chrome browser', () => {
			const ua =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Chrome');
			expect(result.deviceType).toBe('desktop');
		});

		it('should detect Firefox browser', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Firefox');
			expect(result.deviceType).toBe('desktop');
		});

		it('should detect Safari browser', () => {
			const ua =
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Safari');
			expect(result.deviceType).toBe('desktop');
		});

		it('should detect mobile devices', () => {
			const ua =
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect tablet devices', () => {
			const ua =
				'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('tablet');
		});

		it('should handle unknown user agents', () => {
			const ua = 'Unknown/1.0';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Unknown');
			expect(result.deviceType).toBe('desktop');
		});

		it('should detect Android mobile', () => {
			const ua =
				'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Chrome');
			expect(result.deviceType).toBe('mobile');
		});
	});

	describe('DEFAULT_TAG_COLORS', () => {
		it('should have 10 default colors', () => {
			expect(DEFAULT_TAG_COLORS).toHaveLength(10);
		});

		it('should contain valid hex colors', () => {
			DEFAULT_TAG_COLORS.forEach((color) => {
				expect(color).toMatch(/^#[0-9A-F]{6}$/i);
			});
		});

		it('should have unique colors', () => {
			const uniqueColors = new Set(DEFAULT_TAG_COLORS);
			expect(uniqueColors.size).toBe(DEFAULT_TAG_COLORS.length);
		});
	});
});

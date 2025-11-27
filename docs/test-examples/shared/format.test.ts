/**
 * Example Shared Package Utility Test
 *
 * This demonstrates best practices for testing utility functions:
 * - Test pure functions
 * - Test edge cases
 * - Test error handling
 * - Parameterized tests
 * - Property-based testing (optional)
 */

import { describe, it, expect } from 'vitest';
import { formatDate, truncate, slugify, capitalize, debounce } from '../format';

describe('formatDate', () => {
	it('should format date with default format', () => {
		const date = new Date('2024-01-15T12:00:00Z');
		const result = formatDate(date);

		expect(result).toBe('2024-01-15');
	});

	it('should format date with custom format', () => {
		const date = new Date('2024-01-15T12:00:00Z');
		const result = formatDate(date, 'MM/dd/yyyy');

		expect(result).toBe('01/15/2024');
	});

	it('should handle different locales', () => {
		const date = new Date('2024-01-15T12:00:00Z');
		const result = formatDate(date, 'PPP', { locale: 'de' });

		expect(result).toContain('Januar');
	});

	it('should handle invalid dates', () => {
		expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date');
	});

	it('should handle null or undefined', () => {
		expect(() => formatDate(null as any)).toThrow('Invalid date');
		expect(() => formatDate(undefined as any)).toThrow('Invalid date');
	});

	it('should handle dates at boundaries', () => {
		// Min safe date
		const minDate = new Date(-8640000000000000);
		expect(() => formatDate(minDate)).not.toThrow();

		// Max safe date
		const maxDate = new Date(8640000000000000);
		expect(() => formatDate(maxDate)).not.toThrow();
	});

	it('should handle timezone differences', () => {
		const date = new Date('2024-01-15T00:00:00Z');
		const resultUTC = formatDate(date, 'yyyy-MM-dd HH:mm', { timeZone: 'UTC' });
		const resultEST = formatDate(date, 'yyyy-MM-dd HH:mm', { timeZone: 'America/New_York' });

		expect(resultUTC).not.toBe(resultEST);
	});
});

describe('truncate', () => {
	it('should truncate long strings', () => {
		const text = 'This is a very long string that should be truncated';
		const result = truncate(text, 20);

		expect(result).toBe('This is a very long…');
		expect(result.length).toBeLessThanOrEqual(21); // 20 chars + ellipsis
	});

	it('should not truncate short strings', () => {
		const text = 'Short';
		const result = truncate(text, 20);

		expect(result).toBe('Short');
	});

	it('should use custom ellipsis', () => {
		const text = 'This is a very long string';
		const result = truncate(text, 10, '...');

		expect(result).toBe('This is...');
	});

	it('should handle exact length match', () => {
		const text = 'Exactly20Characters!';
		const result = truncate(text, 20);

		expect(result).toBe('Exactly20Characters!');
	});

	it('should handle empty strings', () => {
		const result = truncate('', 10);

		expect(result).toBe('');
	});

	it('should handle length of 0', () => {
		const text = 'Some text';
		const result = truncate(text, 0);

		expect(result).toBe('…');
	});

	it('should handle negative length', () => {
		expect(() => truncate('text', -1)).toThrow('Length must be non-negative');
	});

	it('should preserve word boundaries (optional feature)', () => {
		const text = 'This is a very long string';
		const result = truncate(text, 15, '…', { preserveWords: true });

		expect(result).toBe('This is a very…');
		expect(result).not.toContain('very l'); // Should not break mid-word
	});
});

describe('slugify', () => {
	it('should convert to lowercase', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('should replace spaces with hyphens', () => {
		expect(slugify('multiple   spaces')).toBe('multiple-spaces');
	});

	it('should remove special characters', () => {
		expect(slugify('Hello & World!')).toBe('hello-world');
		expect(slugify('React@TypeScript#2024')).toBe('react-typescript-2024');
	});

	it('should handle unicode characters', () => {
		expect(slugify('Café résumé')).toBe('cafe-resume');
		expect(slugify('Zürich naïve')).toBe('zurich-naive');
	});

	it('should remove leading and trailing hyphens', () => {
		expect(slugify('  hello world  ')).toBe('hello-world');
		expect(slugify('!!!hello world!!!')).toBe('hello-world');
	});

	it('should handle already slugified strings', () => {
		expect(slugify('already-a-slug')).toBe('already-a-slug');
	});

	it('should handle empty strings', () => {
		expect(slugify('')).toBe('');
	});

	it('should handle strings with only special characters', () => {
		expect(slugify('!@#$%^&*()')).toBe('');
	});

	it('should handle very long strings', () => {
		const longString = 'a'.repeat(1000);
		const result = slugify(longString);

		expect(result.length).toBeLessThanOrEqual(200); // Max slug length
	});

	// Parameterized tests
	it.each([
		['Hello World', 'hello-world'],
		['React & TypeScript', 'react-typescript'],
		['2024 年', '2024'],
		['  Multiple   Spaces  ', 'multiple-spaces'],
		['CamelCaseText', 'camelcasetext'],
	])('slugify("%s") should return "%s"', (input, expected) => {
		expect(slugify(input)).toBe(expected);
	});
});

describe('capitalize', () => {
	it('should capitalize first letter', () => {
		expect(capitalize('hello')).toBe('Hello');
	});

	it('should handle already capitalized strings', () => {
		expect(capitalize('Hello')).toBe('Hello');
	});

	it('should handle single characters', () => {
		expect(capitalize('a')).toBe('A');
	});

	it('should handle empty strings', () => {
		expect(capitalize('')).toBe('');
	});

	it('should not affect rest of string', () => {
		expect(capitalize('hELLO wORLD')).toBe('HELLO wORLD');
	});

	it('should handle strings starting with numbers', () => {
		expect(capitalize('123abc')).toBe('123abc');
	});

	it('should handle strings with leading whitespace', () => {
		expect(capitalize('  hello')).toBe('  Hello');
	});
});

describe('debounce', () => {
	it('should delay function execution', async () => {
		vi.useFakeTimers();

		const mockFn = vi.fn();
		const debouncedFn = debounce(mockFn, 500);

		debouncedFn();
		expect(mockFn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(500);
		expect(mockFn).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});

	it('should cancel previous calls', async () => {
		vi.useFakeTimers();

		const mockFn = vi.fn();
		const debouncedFn = debounce(mockFn, 500);

		debouncedFn('call1');
		vi.advanceTimersByTime(200);

		debouncedFn('call2');
		vi.advanceTimersByTime(200);

		debouncedFn('call3');
		vi.advanceTimersByTime(500);

		// Should only call once with last argument
		expect(mockFn).toHaveBeenCalledOnce();
		expect(mockFn).toHaveBeenCalledWith('call3');

		vi.useRealTimers();
	});

	it('should preserve this context', async () => {
		vi.useFakeTimers();

		const obj = {
			value: 42,
			method: function () {
				return this.value;
			},
		};

		const debouncedMethod = debounce(obj.method, 100);
		const result = debouncedMethod.call(obj);

		vi.advanceTimersByTime(100);

		expect(result).toBe(42);

		vi.useRealTimers();
	});

	it('should handle immediate option', () => {
		vi.useFakeTimers();

		const mockFn = vi.fn();
		const debouncedFn = debounce(mockFn, 500, { immediate: true });

		debouncedFn();
		expect(mockFn).toHaveBeenCalledOnce(); // Called immediately

		debouncedFn();
		expect(mockFn).toHaveBeenCalledOnce(); // Still once (debounced)

		vi.advanceTimersByTime(500);

		debouncedFn();
		expect(mockFn).toHaveBeenCalledTimes(2); // Called again after wait

		vi.useRealTimers();
	});
});

// Property-based testing example (requires fast-check)
describe('Property-based tests', () => {
	it('slugify should always return lowercase', () => {
		// Using property-based testing to generate random inputs
		for (let i = 0; i < 100; i++) {
			const randomString = Math.random().toString(36) + Math.random().toString(36);
			const result = slugify(randomString);

			expect(result).toBe(result.toLowerCase());
		}
	});

	it('truncate should never exceed max length', () => {
		const testCases = [
			'short',
			'exactly twenty chars',
			'this is a very long string that needs truncation',
			'a'.repeat(1000),
		];

		testCases.forEach((text) => {
			const maxLength = 20;
			const result = truncate(text, maxLength);

			// Result should be <= maxLength + ellipsis length
			expect(result.length).toBeLessThanOrEqual(maxLength + 1);
		});
	});
});

// Edge cases and boundary testing
describe('Edge Cases', () => {
	describe('Unicode and Emoji handling', () => {
		it('should handle emoji in truncate', () => {
			const text = 'Hello 👋 World 🌍';
			const result = truncate(text, 10);

			expect(result.length).toBeLessThanOrEqual(11);
		});

		it('should handle emoji in slugify', () => {
			const result = slugify('Hello 👋 World');

			expect(result).toBe('hello-world');
			expect(result).not.toContain('👋');
		});
	});

	describe('Security considerations', () => {
		it('should sanitize XSS in slugify', () => {
			const malicious = '<script>alert("xss")</script>';
			const result = slugify(malicious);

			expect(result).not.toContain('<');
			expect(result).not.toContain('>');
			expect(result).not.toContain('script');
		});

		it('should handle SQL injection patterns', () => {
			const sqlInjection = "'; DROP TABLE users; --";
			const result = slugify(sqlInjection);

			expect(result).not.toContain("'");
			expect(result).not.toContain(';');
			expect(result).not.toContain('--');
		});
	});
});

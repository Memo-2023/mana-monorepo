import { describe, it, expect } from 'vitest';
import { parseUserAgent, getDeviceType, formatUserAgent } from './userAgent';

describe('parseUserAgent', () => {
	it('returns empty strings for null', () => {
		expect(parseUserAgent(null)).toEqual({ browser: '', os: '' });
	});

	it('returns empty strings for empty string', () => {
		expect(parseUserAgent('')).toEqual({ browser: '', os: '' });
	});

	it('detects Chrome on macOS', () => {
		const ua =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', os: 'macOS' });
	});

	it('detects Firefox on Windows', () => {
		const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Firefox', os: 'Windows' });
	});

	it('detects Safari on macOS', () => {
		const ua =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Safari', os: 'macOS' });
	});

	it('detects Edge on Windows', () => {
		const ua =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Edge', os: 'Windows' });
	});

	it('detects Chrome on Android', () => {
		const ua =
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', os: 'Android' });
	});

	it('detects Safari on iOS', () => {
		const ua =
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Safari', os: 'iOS' });
	});

	it('detects Chrome on Linux', () => {
		const ua =
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
		expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', os: 'Linux' });
	});
});

describe('getDeviceType', () => {
	it('returns desktop for null', () => {
		expect(getDeviceType(null)).toBe('desktop');
	});

	it('returns mobile for iPhone', () => {
		const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
		expect(getDeviceType(ua)).toBe('mobile');
	});

	it('returns mobile for Android phone', () => {
		const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36';
		expect(getDeviceType(ua)).toBe('mobile');
	});

	it('returns tablet for iPad', () => {
		const ua = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)';
		expect(getDeviceType(ua)).toBe('tablet');
	});

	it('returns desktop for macOS Chrome', () => {
		const ua =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0';
		expect(getDeviceType(ua)).toBe('desktop');
	});
});

describe('formatUserAgent', () => {
	it('returns empty string for null', () => {
		expect(formatUserAgent(null)).toBe('');
	});

	it('formats browser and OS with separator', () => {
		const ua =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
		expect(formatUserAgent(ua)).toBe('Chrome \u00b7 macOS');
	});

	it('formats browser only if OS unknown', () => {
		const ua = 'Mozilla/5.0 Chrome/120.0.0.0';
		expect(formatUserAgent(ua)).toBe('Chrome');
	});
});

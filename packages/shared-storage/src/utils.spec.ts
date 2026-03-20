import { describe, it, expect } from 'vitest';
import {
	generateFileKey,
	generateUserFileKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
} from './utils';

describe('generateFileKey', () => {
	it('generates a UUID-based key with extension', () => {
		const key = generateFileKey('photo.png');
		expect(key).toMatch(/^[0-9a-f-]{36}\.png$/);
	});

	it('includes folder path', () => {
		const key = generateFileKey('image.jpg', 'uploads', '2024');
		expect(key).toMatch(/^uploads\/2024\/[0-9a-f-]{36}\.jpg$/);
	});

	it('handles files without extension', () => {
		const key = generateFileKey('Dockerfile');
		expect(key).toMatch(/^[0-9a-f-]{36}$/);
	});
});

describe('generateUserFileKey', () => {
	it('generates a user-scoped key', () => {
		const key = generateUserFileKey('user-123', 'avatar.png');
		expect(key).toMatch(/^users\/user-123\/[0-9a-f-]{36}\.png$/);
	});

	it('includes subfolder when provided', () => {
		const key = generateUserFileKey('user-123', 'photo.jpg', 'avatars');
		expect(key).toMatch(/^users\/user-123\/avatars\/[0-9a-f-]{36}\.jpg$/);
	});
});

describe('getContentType', () => {
	it.each([
		['image.jpg', 'image/jpeg'],
		['image.jpeg', 'image/jpeg'],
		['image.png', 'image/png'],
		['image.gif', 'image/gif'],
		['image.webp', 'image/webp'],
		['image.svg', 'image/svg+xml'],
		['doc.pdf', 'application/pdf'],
		['song.mp3', 'audio/mpeg'],
		['video.mp4', 'video/mp4'],
		['data.json', 'application/json'],
		['archive.zip', 'application/zip'],
	])('returns correct type for %s', (filename, expected) => {
		expect(getContentType(filename)).toBe(expected);
	});

	it('returns octet-stream for unknown extensions', () => {
		expect(getContentType('file.xyz')).toBe('application/octet-stream');
	});

	it('is case-insensitive', () => {
		expect(getContentType('FILE.PNG')).toBe('image/png');
	});
});

describe('validateFileSize', () => {
	it('returns true when within limit', () => {
		expect(validateFileSize(5 * 1024 * 1024, 10)).toBe(true);
	});

	it('returns true at exact limit', () => {
		expect(validateFileSize(10 * 1024 * 1024, 10)).toBe(true);
	});

	it('returns false when over limit', () => {
		expect(validateFileSize(11 * 1024 * 1024, 10)).toBe(false);
	});
});

describe('validateFileExtension', () => {
	it('returns true for allowed extension', () => {
		expect(validateFileExtension('photo.png', ['.png', '.jpg'])).toBe(true);
	});

	it('returns false for disallowed extension', () => {
		expect(validateFileExtension('script.exe', ['.png', '.jpg'])).toBe(false);
	});

	it('is case-insensitive', () => {
		expect(validateFileExtension('photo.PNG', ['.png'])).toBe(true);
	});
});

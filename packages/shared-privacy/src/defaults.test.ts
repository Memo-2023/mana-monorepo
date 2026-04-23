import { describe, it, expect } from 'vitest';
import { defaultVisibilityFor } from './defaults';

describe('defaultVisibilityFor', () => {
	it('returns private for personal space', () => {
		expect(defaultVisibilityFor('personal')).toBe('private');
	});

	it('returns space for multi-member types', () => {
		expect(defaultVisibilityFor('team')).toBe('space');
		expect(defaultVisibilityFor('club')).toBe('space');
		expect(defaultVisibilityFor('firma')).toBe('space');
	});

	it('returns space for unknown multi-member types (safe assumption)', () => {
		expect(defaultVisibilityFor('band')).toBe('space');
	});

	it('falls back to private when space type is missing', () => {
		expect(defaultVisibilityFor(null)).toBe('private');
		expect(defaultVisibilityFor(undefined)).toBe('private');
		expect(defaultVisibilityFor('')).toBe('private');
	});
});

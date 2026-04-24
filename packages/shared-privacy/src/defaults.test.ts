import { describe, it, expect } from 'vitest';
import { defaultVisibilityFor } from './defaults';

describe('defaultVisibilityFor', () => {
	// 'space' everywhere so the default stays compatible with the
	// existing 2-tier `applyVisibility` filter in scope/visibility.ts.
	// See the function's doc comment for the full rationale.
	it('returns space for personal space', () => {
		expect(defaultVisibilityFor('personal')).toBe('space');
	});

	it('returns space for multi-member types', () => {
		expect(defaultVisibilityFor('team')).toBe('space');
		expect(defaultVisibilityFor('club')).toBe('space');
		expect(defaultVisibilityFor('firma')).toBe('space');
	});

	it('returns space for unknown types', () => {
		expect(defaultVisibilityFor('band')).toBe('space');
	});

	it('returns space when space type is missing', () => {
		expect(defaultVisibilityFor(null)).toBe('space');
		expect(defaultVisibilityFor(undefined)).toBe('space');
		expect(defaultVisibilityFor('')).toBe('space');
	});
});

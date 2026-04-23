import { describe, it, expect } from 'vitest';
import {
	canEmbedOnWebsite,
	isReachableByLink,
	isVisibleToSpaceMember,
	canAiAccessCrossUser,
} from './predicates';
import { VISIBILITY_LEVELS } from './types';

describe('canEmbedOnWebsite', () => {
	it('allows only public', () => {
		expect(canEmbedOnWebsite('public')).toBe(true);
		expect(canEmbedOnWebsite('unlisted')).toBe(false);
		expect(canEmbedOnWebsite('space')).toBe(false);
		expect(canEmbedOnWebsite('private')).toBe(false);
	});
});

describe('isReachableByLink', () => {
	it('allows public and unlisted', () => {
		expect(isReachableByLink('public')).toBe(true);
		expect(isReachableByLink('unlisted')).toBe(true);
	});
	it('rejects space and private', () => {
		expect(isReachableByLink('space')).toBe(false);
		expect(isReachableByLink('private')).toBe(false);
	});
});

describe('isVisibleToSpaceMember', () => {
	it('allows everything except private', () => {
		expect(isVisibleToSpaceMember('space')).toBe(true);
		expect(isVisibleToSpaceMember('unlisted')).toBe(true);
		expect(isVisibleToSpaceMember('public')).toBe(true);
		expect(isVisibleToSpaceMember('private')).toBe(false);
	});
});

describe('canAiAccessCrossUser', () => {
	it('denies for every level in Phase 1', () => {
		for (const lvl of VISIBILITY_LEVELS) {
			expect(canAiAccessCrossUser(lvl)).toBe(false);
		}
	});
});

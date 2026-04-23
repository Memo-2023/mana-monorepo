/**
 * Unit tests for the pure helpers in the scope layer. The Dexie- and
 * fetch-backed functions (`loadActiveSpace`, `reconcileSentinels`,
 * `scopedTable`) need integration harnesses and are covered separately.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyVisibility, isVisibleToCurrentUser } from './visibility';
import { personalSpaceSentinel } from './bootstrap';
import {
	assertModuleAllowed,
	getInScopeSpaceIds,
	ModuleNotInSpaceError,
	ScopeNotReadyError,
} from './scoped-db';
import { setActiveSpace } from './active-space.svelte';
import { setCurrentUserId } from '../current-user';
import * as currentUser from '../current-user';

describe('personalSpaceSentinel', () => {
	it('prefixes the user id with `_personal:`', () => {
		expect(personalSpaceSentinel('u1')).toBe('_personal:u1');
	});

	it('is consistent for the same user', () => {
		expect(personalSpaceSentinel('u1')).toBe(personalSpaceSentinel('u1'));
	});
});

describe('getInScopeSpaceIds', () => {
	// getInScopeSpaceIds reads `getEffectiveUserId()`, which closes over
	// the module-level `currentUserId` inside current-user.ts. Spying on
	// the exported `getCurrentUserId` doesn't intercept that closure —
	// we need the real setter to change the underlying state.
	beforeEach(() => {
		setActiveSpace(null);
		setCurrentUserId(null);
	});

	afterEach(() => {
		setActiveSpace(null);
		setCurrentUserId(null);
	});

	it('returns the guest sentinel when no one is signed in (guest-mode)', () => {
		// Regression guard: before the fix, this returned [] which
		// invisibly hid every guest-created row even though the write
		// path stamped them with `_personal:guest`. Result: empty scene,
		// "App hinzufügen" silently no-op'd because activeSceneIdState
		// resolved to null.
		expect(getInScopeSpaceIds()).toEqual(['_personal:guest']);
	});

	it("returns the user's sentinel when signed in without active space", () => {
		setCurrentUserId('user-abc');
		expect(getInScopeSpaceIds()).toEqual(['_personal:user-abc']);
	});

	it('returns [active, sentinel] when a non-personal Space is active', () => {
		setCurrentUserId('user-abc');
		setActiveSpace({
			id: 'space-xyz',
			slug: 'family',
			name: 'Family',
			type: 'family',
			tier: 'public',
			role: 'owner',
		});
		expect(getInScopeSpaceIds().sort()).toEqual(['_personal:user-abc', 'space-xyz'].sort());
	});

	it('collapses to [active] when active IS the personal sentinel', () => {
		setCurrentUserId('user-abc');
		setActiveSpace({
			id: '_personal:user-abc',
			slug: 'personal',
			name: 'Personal',
			type: 'personal',
			tier: 'public',
			role: 'owner',
		});
		expect(getInScopeSpaceIds()).toEqual(['_personal:user-abc']);
	});
});

describe('visibility', () => {
	beforeEach(() => {
		vi.spyOn(currentUser, 'getCurrentUserId').mockReturnValue('me');
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('passes space-visible records through unchanged', () => {
		const records = [
			{ id: 'a', visibility: 'space', authorId: 'me' },
			{ id: 'b', visibility: 'space', authorId: 'someone-else' },
		];
		expect(applyVisibility(records)).toEqual(records);
	});

	it('hides private records authored by someone else', () => {
		const records = [
			{ id: 'a', visibility: 'private', authorId: 'me' },
			{ id: 'b', visibility: 'private', authorId: 'someone-else' },
		];
		expect(applyVisibility(records)).toEqual([records[0]]);
	});

	it('treats missing visibility as space-visible (safe default)', () => {
		const records = [{ id: 'a', authorId: 'me' }];
		expect(applyVisibility(records)).toEqual(records);
	});

	it('isVisibleToCurrentUser matches applyVisibility for single records', () => {
		expect(isVisibleToCurrentUser({ visibility: 'space', authorId: 'x' })).toBe(true);
		expect(isVisibleToCurrentUser({ visibility: 'private', authorId: 'me' })).toBe(true);
		expect(isVisibleToCurrentUser({ visibility: 'private', authorId: 'x' })).toBe(false);
	});
});

describe('assertModuleAllowed', () => {
	afterEach(() => {
		setActiveSpace(null);
	});

	it('throws ScopeNotReady when no active space', () => {
		setActiveSpace(null);
		expect(() => assertModuleAllowed('todo')).toThrow(ScopeNotReadyError);
	});

	it('allows any module in a personal space', () => {
		setActiveSpace({
			id: 'x',
			slug: '@me',
			name: 'Me',
			type: 'personal',
			tier: 'founder',
			role: 'owner',
		});
		expect(() => assertModuleAllowed('todo')).not.toThrow();
		expect(() => assertModuleAllowed('mood')).not.toThrow();
		expect(() => assertModuleAllowed('club-finance')).not.toThrow();
	});

	it('rejects personal-only modules in a brand space', () => {
		setActiveSpace({
			id: 'y',
			slug: '@e',
			name: 'E',
			type: 'brand',
			tier: 'public',
			role: 'owner',
		});
		// mood is not in the brand allowlist
		expect(() => assertModuleAllowed('mood')).toThrow(ModuleNotInSpaceError);
	});

	it('allows whitelisted modules in a brand space', () => {
		setActiveSpace({
			id: 'y',
			slug: '@e',
			name: 'E',
			type: 'brand',
			tier: 'public',
			role: 'owner',
		});
		expect(() => assertModuleAllowed('social-relay')).not.toThrow();
		expect(() => assertModuleAllowed('mail')).not.toThrow();
	});
});

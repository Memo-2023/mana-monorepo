/**
 * Unit tests for the pure helpers in the workbench-scenes store.
 *
 * Covers the regressions fixed in a1baf1053 (toScene was silently
 * dropping viewingAsAgentId + scopeTagIds) and 4e5c3179f (pickActiveId
 * now consults the MRU stack instead of always returning scenes[0]).
 *
 * Only the pure exports are exercised — full integration tests against
 * fake-indexeddb would also need to drive Svelte 5's $state through
 * reactive updates, which isn't wired up for the store suite yet.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// The store reads localStorage through `$app/environment.browser`, which
// defaults to false under vitest/Node — that would short-circuit the MRU
// fallback path we want to exercise. Pretending we're in the browser and
// handing vi a minimal localStorage polyfill keeps the test environment
// agnostic (no jsdom dependency).
vi.mock('$app/environment', () => ({ browser: true }));

if (typeof globalThis.localStorage === 'undefined') {
	const backing = new Map<string, string>();
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: (k: string) => backing.get(k) ?? null,
			setItem: (k: string, v: string) => void backing.set(k, String(v)),
			removeItem: (k: string) => void backing.delete(k),
			clear: () => backing.clear(),
			key: (i: number) => Array.from(backing.keys())[i] ?? null,
			get length() {
				return backing.size;
			},
		},
	});
}

import { toScene, pickActiveId } from './workbench-scenes.svelte';
import type { LocalWorkbenchScene, WorkbenchScene } from '$lib/types/workbench-scenes';

const MRU_LS_KEY = 'mana:workbench:sceneMru';

function sceneFixture(overrides: Partial<WorkbenchScene> = {}): WorkbenchScene {
	return {
		id: 'scene-1',
		name: 'Home',
		description: null,
		openApps: [{ appId: 'todo' }],
		order: 0,
		...overrides,
	};
}

function localFixture(overrides: Partial<LocalWorkbenchScene> = {}): LocalWorkbenchScene {
	return {
		id: 'scene-1',
		name: 'Home',
		description: null,
		openApps: [{ appId: 'todo' }],
		order: 0,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	};
}

describe('toScene', () => {
	it('copies the core presentation fields', () => {
		const local = localFixture({
			name: 'Deep Work',
			description: 'Focus time',
			openApps: [{ appId: 'todo' }, { appId: 'notes', maximized: true }],
			order: 3,
		});
		const out = toScene(local);
		expect(out).toMatchObject({
			id: 'scene-1',
			name: 'Deep Work',
			description: 'Focus time',
			order: 3,
		});
		expect(out.openApps).toHaveLength(2);
		expect(out.openApps[1]).toEqual({ appId: 'notes', maximized: true });
	});

	it('preserves viewingAsAgentId and scopeTagIds', () => {
		// Regression: these two were silently dropped, which broke the
		// agent avatar pill in SceneAppBar and the auto-inferred scope
		// in SceneHeader.
		const local = localFixture({
			viewingAsAgentId: 'agent-42',
			scopeTagIds: ['tag-a', 'tag-b'],
		});
		const out = toScene(local);
		expect(out.viewingAsAgentId).toBe('agent-42');
		expect(out.scopeTagIds).toEqual(['tag-a', 'tag-b']);
	});

	it('tolerates absent optional fields', () => {
		const local = localFixture({ description: undefined, openApps: undefined });
		const out = toScene(local);
		expect(out.description).toBeNull();
		expect(out.openApps).toEqual([]);
	});
});

describe('pickActiveId', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns null when there are no scenes', () => {
		expect(pickActiveId([], null)).toBeNull();
		expect(pickActiveId([], 'missing')).toBeNull();
	});

	it('returns current when it is still in the list', () => {
		const scenes = [sceneFixture({ id: 'a' }), sceneFixture({ id: 'b', order: 1 })];
		expect(pickActiveId(scenes, 'b')).toBe('b');
	});

	it('falls back to scenes[0] when no current and no MRU', () => {
		const scenes = [sceneFixture({ id: 'a' }), sceneFixture({ id: 'b', order: 1 })];
		expect(pickActiveId(scenes, null)).toBe('a');
	});

	it('falls back to the newest MRU entry that still exists', () => {
		// MRU stack with the most recent scene first.
		localStorage.setItem(MRU_LS_KEY, JSON.stringify(['gone', 'b', 'a']));
		const scenes = [sceneFixture({ id: 'a' }), sceneFixture({ id: 'b', order: 1 })];
		// Current 'gone' is no longer available → skip; next MRU 'b' is available.
		expect(pickActiveId(scenes, 'gone')).toBe('b');
	});

	it('skips MRU ids that were deleted and uses the next live one', () => {
		localStorage.setItem(MRU_LS_KEY, JSON.stringify(['x', 'y', 'c']));
		const scenes = [
			sceneFixture({ id: 'a' }),
			sceneFixture({ id: 'c', order: 1 }),
			sceneFixture({ id: 'd', order: 2 }),
		];
		expect(pickActiveId(scenes, null)).toBe('c');
	});

	it('falls back to scenes[0] if MRU is corrupted', () => {
		localStorage.setItem(MRU_LS_KEY, '{not-json');
		const scenes = [sceneFixture({ id: 'a' }), sceneFixture({ id: 'b', order: 1 })];
		expect(pickActiveId(scenes, null)).toBe('a');
	});

	it('ignores non-string entries in the MRU payload', () => {
		// Simulate a future schema regression — any non-string entry
		// should be dropped silently, not crash the fallback.
		localStorage.setItem(MRU_LS_KEY, JSON.stringify(['a', 42, null, 'b']));
		const scenes = [sceneFixture({ id: 'b' }), sceneFixture({ id: 'c', order: 1 })];
		expect(pickActiveId(scenes, null)).toBe('b');
	});
});

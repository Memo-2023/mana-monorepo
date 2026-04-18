/**
 * Unit tests for the reactive scope-tag primitives backing the workbench
 * scene scope. These live in the module scope of scene-scope.svelte.ts
 * and are shared between AI scope-context, ListView empty states, and
 * module queries via filterBySceneScopeBatch.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
	setSceneScopeTagIds,
	getSceneScopeTagIds,
	hasActiveSceneScope,
} from './scene-scope.svelte';

afterEach(() => {
	setSceneScopeTagIds(undefined);
});

describe('scene scope state', () => {
	it('starts empty', () => {
		expect(getSceneScopeTagIds()).toBeUndefined();
		expect(hasActiveSceneScope()).toBe(false);
	});

	it('setSceneScopeTagIds populates the state', () => {
		setSceneScopeTagIds(['tag-1', 'tag-2']);
		expect(getSceneScopeTagIds()).toEqual(['tag-1', 'tag-2']);
		expect(hasActiveSceneScope()).toBe(true);
	});

	it('empty array is normalized to undefined', () => {
		setSceneScopeTagIds([]);
		expect(getSceneScopeTagIds()).toBeUndefined();
		expect(hasActiveSceneScope()).toBe(false);
	});

	it('explicit undefined clears any active scope', () => {
		setSceneScopeTagIds(['tag-1']);
		expect(hasActiveSceneScope()).toBe(true);
		setSceneScopeTagIds(undefined);
		expect(hasActiveSceneScope()).toBe(false);
		expect(getSceneScopeTagIds()).toBeUndefined();
	});
});

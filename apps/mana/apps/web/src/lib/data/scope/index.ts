/**
 * Spaces scope layer — barrel.
 *
 * Module code should import everything it needs from here rather than
 * reaching into the individual files, so future refactors of the
 * internals stay invisible to consumers.
 *
 * See docs/plans/spaces-foundation.md for the full RFC.
 */

export {
	getActiveSpace,
	getActiveSpaceId,
	getActiveSpaceStatus,
	getActiveSpaceError,
	setActiveSpace,
	loadActiveSpace,
	type ActiveSpace,
	type ActiveSpaceStatus,
} from './active-space.svelte';

export { reconcileSentinels, personalSpaceSentinel } from './bootstrap';

export {
	scopedTable,
	scopedForModule,
	scopedGet,
	assertModuleAllowed,
	getInScopeSpaceIds,
	ScopeNotReadyError,
	ModuleNotInSpaceError,
} from './scoped-db';

export { applyVisibility, isVisibleToCurrentUser, type Visibility } from './visibility';

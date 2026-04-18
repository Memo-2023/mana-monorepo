/**
 * Workbench Scenes Store — local-first, cross-device synced.
 *
 * Scenes (named workbench layouts) are persisted in the unified Mana Dexie
 * database under the `workbenchScenes` table and reach other devices via
 * the mana-sync engine (field-level LWW). The currently active scene id is
 * a per-device preference and lives in localStorage so device A doesn't
 * pull device B into a different scene.
 *
 * Reactive surface: `scenes`, `activeSceneId`, `activeScene`, `openApps`,
 * `initialized`. The store subscribes to a Dexie liveQuery on module init,
 * so writes from other tabs and remote sync pulls flow back into the UI
 * without a manual refresh.
 */

import { browser } from '$app/environment';
import { liveQuery, type Subscription } from 'dexie';
import { db } from '$lib/data/database';
import type {
	LocalWorkbenchScene,
	WorkbenchScene,
	WorkbenchSceneApp,
} from '$lib/types/workbench-scenes';
import { setSceneScopeTagIds } from './scene-scope.svelte';

const TABLE = 'workbenchScenes';
const ACTIVE_SCENE_LS_KEY = 'mana:workbench:activeSceneId';
const MRU_LS_KEY = 'mana:workbench:sceneMru';
const MRU_CAP = 5;

const DEFAULT_HOME_APPS: WorkbenchSceneApp[] = [
	{ appId: 'todo' },
	{ appId: 'calendar' },
	{ appId: 'notes' },
];

// ─── Reactive state ───────────────────────────────────────────

let scenesState = $state<WorkbenchScene[]>([]);
let activeSceneIdState = $state<string | null>(null);
let initializedState = $state(false);

let subscription: Subscription | null = null;
let subscribeRetryCount = 0;
const MAX_SUBSCRIBE_RETRIES = 3;

function readActiveIdFromStorage(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(ACTIVE_SCENE_LS_KEY);
	} catch {
		return null;
	}
}

function writeActiveIdToStorage(id: string | null) {
	if (!browser) return;
	try {
		if (id) localStorage.setItem(ACTIVE_SCENE_LS_KEY, id);
		else localStorage.removeItem(ACTIVE_SCENE_LS_KEY);
	} catch {
		/* storage quota / disabled — ignore */
	}
}

function readMruFromStorage(): string[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(MRU_LS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
	} catch {
		return [];
	}
}

/** Push `id` to the front of the MRU list, dedup, cap. Per-device only. */
function bumpMru(id: string) {
	if (!browser) return;
	try {
		const current = readMruFromStorage();
		const next = [id, ...current.filter((x) => x !== id)].slice(0, MRU_CAP);
		localStorage.setItem(MRU_LS_KEY, JSON.stringify(next));
	} catch {
		/* storage quota / disabled — ignore */
	}
}

/** Exported for unit tests — converts a Dexie row to the public shape.
 *  Regression guard: this previously dropped `viewingAsAgentId` and
 *  `scopeTagIds`, silently breaking SceneAppBar's agent badge. */
export function toScene(local: LocalWorkbenchScene): WorkbenchScene {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? null,
		openApps: local.openApps ?? [],
		order: local.order,
		wallpaper: local.wallpaper,
		viewingAsAgentId: local.viewingAsAgentId,
		scopeTagIds: local.scopeTagIds,
	};
}

function nowIso() {
	return new Date().toISOString();
}

async function ensureSeedScene(): Promise<string> {
	const id = crypto.randomUUID();
	const now = nowIso();
	const seed: LocalWorkbenchScene = {
		id,
		name: 'Home',
		openApps: DEFAULT_HOME_APPS,
		order: 0,
		createdAt: now,
		updatedAt: now,
	};
	await db.table<LocalWorkbenchScene>(TABLE).add(seed);
	return id;
}

/** Exported for unit tests — resolves the active scene id against the
 *  available list, falling back to per-device MRU and finally to the
 *  first sort-ordered scene. */
export function pickActiveId(scenes: WorkbenchScene[], current: string | null): string | null {
	if (scenes.length === 0) return null;
	const ids = new Set(scenes.map((s) => s.id));
	if (current && ids.has(current)) return current;
	// Fall back to the most recent scene (local per-device MRU) that still
	// exists, so deleting or sync-pulling away from the current scene
	// restores the user's last-used workbench rather than jumping them to
	// whatever happens to sort first.
	for (const id of readMruFromStorage()) {
		if (ids.has(id)) return id;
	}
	return scenes[0].id;
}

// ─── Mutations ────────────────────────────────────────────────

async function patchScene(
	id: string,
	patch: Partial<
		Pick<
			LocalWorkbenchScene,
			| 'name'
			| 'description'
			| 'openApps'
			| 'order'
			| 'wallpaper'
			| 'viewingAsAgentId'
			| 'scopeTagIds'
		>
	>
) {
	// Strip Svelte 5 $state proxies — IndexedDB's structured clone can't serialize them.
	const clean = $state.snapshot({ ...patch, updatedAt: nowIso() });
	await db.table<LocalWorkbenchScene>(TABLE).update(id, clean);
}

async function patchActiveScene(fn: (apps: WorkbenchSceneApp[]) => WorkbenchSceneApp[]) {
	const id = activeSceneIdState;
	if (!id) return;
	// Read fresh from Dexie inside a rw-transaction so two rapid writes (e.g.
	// user adds app A then app B before the liveQuery has echoed the first
	// change back into scenesState) can't clobber each other with a stale
	// [...oldApps, X] snapshot.
	await db.transaction('rw', TABLE, async () => {
		const row = await db.table<LocalWorkbenchScene>(TABLE).get(id);
		if (!row || row.deletedAt) return;
		const plainApps = (row.openApps ?? []) as WorkbenchSceneApp[];
		const next = fn(plainApps);
		if (next === plainApps) return;
		await db.table<LocalWorkbenchScene>(TABLE).update(id, {
			openApps: next,
			updatedAt: nowIso(),
		});
	});
}

/**
 * Subscribe to the workbenchScenes Dexie liveQuery. Wrapped so we can
 * re-invoke it on transient errors (e.g. DatabaseClosed during another
 * tab's schema upgrade) — otherwise the subscription dies silently and
 * local writes land in IndexedDB but never reach `scenesState`, leaving
 * the user with a "frozen" workbench that only a full reload fixes.
 *
 * The `next` handler is individually try/catched so a single malformed
 * row (bad enum, missing field) can't kill the whole reactive chain.
 */
function openSubscription(): void {
	subscription = liveQuery(() => db.table<LocalWorkbenchScene>(TABLE).toArray()).subscribe({
		next: (rows) => {
			try {
				const visible = rows
					.filter((r) => !r.deletedAt)
					.sort((a, b) => a.order - b.order)
					.map(toScene);
				scenesState = visible;

				const next = pickActiveId(visible, activeSceneIdState);
				if (next !== activeSceneIdState) {
					activeSceneIdState = next;
					writeActiveIdToStorage(next);
					if (next) bumpMru(next);
				}
				// Sync scope when scenes reload (init, sync pull, tab focus).
				const activeScope = visible.find((s) => s.id === (next ?? activeSceneIdState));
				try {
					setSceneScopeTagIds(activeScope?.scopeTagIds);
				} catch (scopeErr) {
					console.error('[workbench-scenes] setSceneScopeTagIds failed:', scopeErr);
				}
				initializedState = true;
				subscribeRetryCount = 0;
			} catch (err) {
				console.error('[workbench-scenes] error processing rows:', err);
				initializedState = true;
			}
		},
		error: (err) => {
			console.error('[workbench-scenes] liveQuery failed:', err);
			initializedState = true;
			subscription = null;
			if (subscribeRetryCount < MAX_SUBSCRIBE_RETRIES) {
				subscribeRetryCount++;
				const delay = 500 * subscribeRetryCount;
				setTimeout(() => {
					if (!subscription) openSubscription();
				}, delay);
			}
		},
	});
}

// ─── Public store ─────────────────────────────────────────────

export const workbenchScenesStore = {
	get scenes() {
		return scenesState;
	},
	get activeSceneId() {
		return activeSceneIdState;
	},
	get activeScene() {
		return scenesState.find((s) => s.id === activeSceneIdState) ?? null;
	},
	get openApps(): WorkbenchSceneApp[] {
		return this.activeScene?.openApps ?? [];
	},
	get initialized() {
		return initializedState;
	},

	async initialize() {
		if (!browser || initializedState) return;

		// Seed a Home scene on first run so the UI never has zero scenes.
		const count = await db.table(TABLE).count();
		if (count === 0) {
			await ensureSeedScene();
		}

		activeSceneIdState = readActiveIdFromStorage();
		openSubscription();
	},

	dispose() {
		subscription?.unsubscribe();
		subscription = null;
		subscribeRetryCount = 0;
		// Reset the init flag so a subsequent mount (navigate-away → back)
		// re-runs `initialize()` with a fresh subscription. Leave
		// `scenesState` / `activeSceneIdState` untouched — re-mount keeps
		// the in-memory snapshot so the UI doesn't flash empty while
		// Dexie's liveQuery re-emits.
		initializedState = false;
	},

	// ── Scene CRUD ───────────────────────────────────────────

	setActiveScene(id: string) {
		if (!scenesState.some((s) => s.id === id)) return;
		activeSceneIdState = id;
		writeActiveIdToStorage(id);
		bumpMru(id);
		// Sync scene scope for module queries
		const scene = scenesState.find((s) => s.id === id);
		setSceneScopeTagIds(scene?.scopeTagIds);
	},

	async createScene(opts: {
		name: string;
		description?: string | null;
		seedApps?: WorkbenchSceneApp[];
		setActive?: boolean;
	}): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		const maxOrder = scenesState.reduce((m, s) => Math.max(m, s.order), -1);
		const row: LocalWorkbenchScene = {
			id,
			name: opts.name.trim() || 'Neue Szene',
			description: opts.description ?? null,
			openApps: opts.seedApps ? ($state.snapshot(opts.seedApps) as WorkbenchSceneApp[]) : [],
			order: maxOrder + 1,
			createdAt: now,
			updatedAt: now,
		};
		await db.table<LocalWorkbenchScene>(TABLE).add(row);
		if (opts.setActive !== false) {
			activeSceneIdState = id;
			writeActiveIdToStorage(id);
			bumpMru(id);
		}
		return id;
	},

	async renameScene(id: string, name: string, description?: string | null) {
		const trimmed = name.trim();
		if (!trimmed) return;
		await patchScene(id, {
			name: trimmed,
			...(description !== undefined ? { description } : {}),
		});
	},

	async setSceneDescription(id: string, description: string | null) {
		await patchScene(id, { description });
	},

	/** Bind the scene to an Agent (or clear the binding). Purely a UI
	 *  lens — does not affect which data the open apps can see. */
	async setSceneAgent(id: string, agentId: string | undefined) {
		await patchScene(id, { viewingAsAgentId: agentId });
	},

	async setSceneScopeTags(id: string, scopeTagIds: string[] | undefined) {
		await patchScene(id, { scopeTagIds });
		// Sync reactive scope if this is the active scene
		if (id === activeSceneIdState) {
			setSceneScopeTagIds(scopeTagIds);
		}
	},

	async updateScene(id: string, patch: Partial<WorkbenchScene>) {
		await patchScene(id, patch);
		if (id === activeSceneIdState && patch.scopeTagIds !== undefined) {
			setSceneScopeTagIds(patch.scopeTagIds);
		}
	},

	async duplicateScene(id: string) {
		const src = scenesState.find((s) => s.id === id);
		if (!src) return;
		await this.createScene({
			name: `${src.name} Kopie`,
			description: src.description ?? null,
			seedApps: src.openApps,
			setActive: true,
		});
	},

	async deleteScene(id: string) {
		// Refuse to delete the very last scene — the workbench always needs one.
		if (scenesState.length <= 1) return;
		await db.table<LocalWorkbenchScene>(TABLE).update(id, {
			deletedAt: nowIso(),
			updatedAt: nowIso(),
		});
		// liveQuery will recompute scenesState; pickActiveId then advances
		// activeSceneId to the first remaining scene if needed.
	},

	async reorderScenes(fromId: string, toId: string) {
		if (fromId === toId) return;
		const ordered = [...scenesState];
		const fromIdx = ordered.findIndex((s) => s.id === fromId);
		const toIdx = ordered.findIndex((s) => s.id === toId);
		if (fromIdx === -1 || toIdx === -1) return;
		const [moved] = ordered.splice(fromIdx, 1);
		ordered.splice(toIdx, 0, moved);
		// Atomic renumber — one rw-transaction over all changed rows so a
		// partial failure can't leave the scene list with gapped or
		// duplicated orders visible to other tabs. Only writes rows whose
		// order actually changed.
		const now = nowIso();
		await db.transaction('rw', TABLE, async () => {
			const writes: Promise<unknown>[] = [];
			for (let i = 0; i < ordered.length; i++) {
				const s = ordered[i];
				if (s.order === i) continue;
				writes.push(
					db.table<LocalWorkbenchScene>(TABLE).update(s.id, { order: i, updatedAt: now })
				);
			}
			await Promise.all(writes);
		});
	},

	// ── Per-scene app mutations (operate on the active scene) ─

	async addApp(appId: string) {
		await patchActiveScene((apps) => {
			if (apps.some((a) => a.appId === appId)) return apps;
			return [...apps, { appId }];
		});
	},

	/**
	 * Insert `appId` directly after `anchorAppId` in the active scene.
	 * Used by cross-module actions like "Kontext → Als Notiz speichern",
	 * where the target widget should land next to the source rather than
	 * at the end of the carousel. If the app is already open, its
	 * position is left untouched (we don't want to yank a widget the
	 * user is already interacting with). If the anchor isn't in the
	 * scene, falls back to appending.
	 */
	async addAppAfter(appId: string, anchorAppId: string) {
		await patchActiveScene((apps) => {
			if (apps.some((a) => a.appId === appId)) return apps;
			const anchorIdx = apps.findIndex((a) => a.appId === anchorAppId);
			if (anchorIdx === -1) return [...apps, { appId }];
			const next = [...apps];
			next.splice(anchorIdx + 1, 0, { appId });
			return next;
		});
	},

	async removeApp(appId: string) {
		await patchActiveScene((apps) => apps.filter((a) => a.appId !== appId));
	},

	async toggleMaximizeApp(appId: string) {
		await patchActiveScene((apps) =>
			apps.map((a) => (a.appId === appId ? { ...a, maximized: !a.maximized } : a))
		);
	},

	async resizeApp(appId: string, widthPx: number) {
		await patchActiveScene((apps) => apps.map((a) => (a.appId === appId ? { ...a, widthPx } : a)));
	},

	async moveAppLeft(appId: string) {
		await patchActiveScene((apps) => {
			const idx = apps.findIndex((a) => a.appId === appId);
			if (idx <= 0) return apps;
			const next = [...apps];
			[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
			return next;
		});
	},

	async moveAppRight(appId: string) {
		await patchActiveScene((apps) => {
			const idx = apps.findIndex((a) => a.appId === appId);
			if (idx === -1 || idx >= apps.length - 1) return apps;
			const next = [...apps];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			return next;
		});
	},

	async reorderApps(fromId: string, toId: string) {
		if (fromId === toId) return;
		await patchActiveScene((apps) => {
			const fromIdx = apps.findIndex((a) => a.appId === fromId);
			const toIdx = apps.findIndex((a) => a.appId === toId);
			if (fromIdx === -1 || toIdx === -1) return apps;
			const next = [...apps];
			const [moved] = next.splice(fromIdx, 1);
			next.splice(toIdx, 0, moved);
			return next;
		});
	},
};

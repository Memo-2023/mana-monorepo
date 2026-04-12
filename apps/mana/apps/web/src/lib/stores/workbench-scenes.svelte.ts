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

const TABLE = 'workbenchScenes';
const ACTIVE_SCENE_LS_KEY = 'mana:workbench:activeSceneId';

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

function toScene(local: LocalWorkbenchScene): WorkbenchScene {
	return {
		id: local.id,
		name: local.name,
		icon: local.icon,
		openApps: local.openApps ?? [],
		order: local.order,
		wallpaper: local.wallpaper,
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

function pickActiveId(scenes: WorkbenchScene[], current: string | null): string | null {
	if (scenes.length === 0) return null;
	if (current && scenes.some((s) => s.id === current)) return current;
	return scenes[0].id;
}

// ─── Mutations ────────────────────────────────────────────────

async function patchScene(
	id: string,
	patch: Partial<Pick<LocalWorkbenchScene, 'name' | 'icon' | 'openApps' | 'order' | 'wallpaper'>>
) {
	// Strip Svelte 5 $state proxies — IndexedDB's structured clone can't serialize them.
	const clean = $state.snapshot({ ...patch, updatedAt: nowIso() });
	await db.table<LocalWorkbenchScene>(TABLE).update(id, clean);
}

async function patchActiveScene(fn: (apps: WorkbenchSceneApp[]) => WorkbenchSceneApp[]) {
	const id = activeSceneIdState;
	if (!id) return;
	const current = scenesState.find((s) => s.id === id);
	if (!current) return;
	// Snapshot before handing to the mutator so callers operate on plain objects.
	const plainApps = $state.snapshot(current.openApps) as WorkbenchSceneApp[];
	await patchScene(id, { openApps: fn(plainApps) });
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

		subscription = liveQuery(() => db.table<LocalWorkbenchScene>(TABLE).toArray()).subscribe({
			next: (rows) => {
				const visible = rows
					.filter((r) => !r.deletedAt)
					.sort((a, b) => a.order - b.order)
					.map(toScene);
				scenesState = visible;

				const next = pickActiveId(visible, activeSceneIdState);
				if (next !== activeSceneIdState) {
					activeSceneIdState = next;
					writeActiveIdToStorage(next);
				}
				initializedState = true;
			},
			error: (err) => {
				console.error('[workbench-scenes] liveQuery failed:', err);
				initializedState = true;
			},
		});
	},

	dispose() {
		subscription?.unsubscribe();
		subscription = null;
	},

	// ── Scene CRUD ───────────────────────────────────────────

	setActiveScene(id: string) {
		if (!scenesState.some((s) => s.id === id)) return;
		activeSceneIdState = id;
		writeActiveIdToStorage(id);
	},

	async createScene(opts: {
		name: string;
		icon?: string;
		seedApps?: WorkbenchSceneApp[];
		setActive?: boolean;
	}): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		const maxOrder = scenesState.reduce((m, s) => Math.max(m, s.order), -1);
		const row: LocalWorkbenchScene = {
			id,
			name: opts.name.trim() || 'Neue Szene',
			icon: opts.icon,
			openApps: opts.seedApps ? ($state.snapshot(opts.seedApps) as WorkbenchSceneApp[]) : [],
			order: maxOrder + 1,
			createdAt: now,
			updatedAt: now,
		};
		await db.table<LocalWorkbenchScene>(TABLE).add(row);
		if (opts.setActive !== false) {
			activeSceneIdState = id;
			writeActiveIdToStorage(id);
		}
		return id;
	},

	async renameScene(id: string, name: string, icon?: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		await patchScene(id, { name: trimmed, ...(icon !== undefined ? { icon } : {}) });
	},

	async duplicateScene(id: string) {
		const src = scenesState.find((s) => s.id === id);
		if (!src) return;
		await this.createScene({
			name: `${src.name} Kopie`,
			icon: src.icon,
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
		// Renumber and persist only the rows whose order actually changed.
		await Promise.all(
			ordered.map((s, i) => (s.order === i ? null : patchScene(s.id, { order: i })))
		);
	},

	// ── Per-scene app mutations (operate on the active scene) ─

	async addApp(appId: string) {
		await patchActiveScene((apps) => {
			if (apps.some((a) => a.appId === appId)) return apps;
			return [...apps, { appId }];
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

	async resizeApp(appId: string, widthPx: number, heightPx?: number) {
		await patchActiveScene((apps) =>
			apps.map((a) =>
				a.appId === appId ? { ...a, widthPx, ...(heightPx !== undefined ? { heightPx } : {}) } : a
			)
		);
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

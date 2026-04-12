/**
 * Wallpaper Store — reactive wallpaper resolution and mutations.
 *
 * Uses a local $state for immediate UI feedback. Persists to userSettings
 * (global) and Dexie (per-scene) in the background.
 *
 * Resolution order:
 *   1. Preview (transient hover state, not persisted)
 *   2. Active scene's wallpaper (per-scene override)
 *   3. Local global state (synced to userSettings)
 *   4. Default: { source: { type: 'none' } }
 */

import { browser } from '$app/environment';
import type { WallpaperConfig } from '@mana/shared-theme';
import { userSettings } from './user-settings.svelte';
import { workbenchScenesStore } from './workbench-scenes.svelte';
import { DEFAULT_WALLPAPER_CONFIG } from '$lib/types/wallpaper';

const LS_KEY = 'mana:wallpaper:global';

// ─── Local state (immediate, survives page nav) ──────────────

function loadFromStorage(): WallpaperConfig {
	if (!browser) return DEFAULT_WALLPAPER_CONFIG;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (raw) return JSON.parse(raw) as WallpaperConfig;
	} catch {
		/* ignore */
	}
	return DEFAULT_WALLPAPER_CONFIG;
}

function saveToStorage(config: WallpaperConfig) {
	if (!browser) return;
	try {
		if (config.source.type === 'none') {
			localStorage.removeItem(LS_KEY);
		} else {
			localStorage.setItem(LS_KEY, JSON.stringify(config));
		}
	} catch {
		/* ignore */
	}
}

let localGlobal = $state<WallpaperConfig>(loadFromStorage());

// ─── Preview state (transient, not persisted) ────────────────

let previewConfig = $state<WallpaperConfig | null>(null);

// ─── Reactive derivation ─────────────────────────────────────

/** The persisted effective wallpaper (without preview). */
let persistedEffective = $derived.by((): WallpaperConfig => {
	const scene = workbenchScenesStore.activeScene;
	if (scene?.wallpaper && scene.wallpaper.source.type !== 'none') {
		return scene.wallpaper;
	}
	if (localGlobal.source.type !== 'none') {
		return localGlobal;
	}
	return DEFAULT_WALLPAPER_CONFIG;
});

/** What the WallpaperLayer actually renders: preview > persisted. */
let displayState = $derived.by((): WallpaperConfig => {
	if (previewConfig && previewConfig.source.type !== 'none') {
		return previewConfig;
	}
	return persistedEffective;
});

// ─── Public store ────────────────────────────────────────────

export const wallpaperStore = {
	/** What should be rendered (preview if active, otherwise persisted). */
	get effective(): WallpaperConfig {
		return displayState;
	},

	/** The persisted wallpaper (ignoring any hover preview). */
	get persisted(): WallpaperConfig {
		return persistedEffective;
	},

	/** Whether a wallpaper (not 'none') is currently displayed. */
	get hasWallpaper(): boolean {
		return displayState.source.type !== 'none';
	},

	/** Whether a hover preview is currently active. */
	get isPreviewing(): boolean {
		return previewConfig !== null;
	},

	/** The global wallpaper config. */
	get global(): WallpaperConfig {
		return localGlobal;
	},

	/** The active scene's wallpaper override (may be undefined). */
	get sceneOverride(): WallpaperConfig | undefined {
		return workbenchScenesStore.activeScene?.wallpaper;
	},

	// ── Preview (hover) ───────────────────────────────────────

	/** Show a transient preview (e.g. on hover). Not persisted. */
	preview(config: WallpaperConfig) {
		previewConfig = config;
	},

	/** Clear the transient preview (e.g. on mouse leave). */
	clearPreview() {
		previewConfig = null;
	},

	// ── Mutations (persisted) ─────────────────────────────────

	/** Set the global wallpaper (applies to all scenes without an override). */
	async setGlobal(config: WallpaperConfig) {
		previewConfig = null;
		localGlobal = config;
		saveToStorage(config);
		userSettings.updateGlobal({ wallpaper: config }).catch(() => {});
	},

	/** Clear the global wallpaper (revert to theme default). */
	async clearGlobal() {
		previewConfig = null;
		localGlobal = DEFAULT_WALLPAPER_CONFIG;
		saveToStorage(DEFAULT_WALLPAPER_CONFIG);
		userSettings.updateGlobal({ wallpaper: DEFAULT_WALLPAPER_CONFIG }).catch(() => {});
	},

	/** Set a wallpaper override for the currently active scene. */
	async setSceneWallpaper(config: WallpaperConfig) {
		previewConfig = null;
		const sceneId = workbenchScenesStore.activeSceneId;
		if (!sceneId) return;
		await patchSceneWallpaper(sceneId, config);
	},

	/** Clear the active scene's wallpaper override (fall back to global). */
	async clearSceneWallpaper() {
		previewConfig = null;
		const sceneId = workbenchScenesStore.activeSceneId;
		if (!sceneId) return;
		await patchSceneWallpaper(sceneId, undefined);
	},
};

// ─── Internal: patch scene wallpaper via Dexie ───────────────

async function patchSceneWallpaper(sceneId: string, wallpaper: WallpaperConfig | undefined) {
	const { db } = await import('$lib/data/database');
	const clean = wallpaper ? structuredClone(wallpaper) : undefined;
	await db.table('workbenchScenes').update(sceneId, {
		wallpaper: clean,
		updatedAt: new Date().toISOString(),
	});
}

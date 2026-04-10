/**
 * Workbench Scenes — user-defined named layouts of the workbench (homepage).
 *
 * Each scene is a named bundle of "open apps" with their window state
 * (maximized / size). Users can switch between scenes to
 * quickly change context (e.g. "Home", "Deep Work", "Travel").
 *
 * Scenes are persisted in the unified Mana Dexie database under the
 * `workbenchScenes` table and sync cross-device via mana-sync. The
 * currently active scene id is stored per-device in localStorage so
 * device A doesn't yank device B into a different scene.
 */

import type { BaseRecord } from '@mana/local-store';

export interface WorkbenchSceneApp {
	appId: string;
	maximized?: boolean;
	widthPx?: number;
	heightPx?: number;
}

/** A user-defined named layout of the workbench. */
export interface WorkbenchScene {
	id: string;
	name: string;
	/** Optional emoji shown in the scene tab. */
	icon?: string;
	openApps: WorkbenchSceneApp[];
	/** Sort order in the scene tab bar. */
	order: number;
}

/** Dexie row shape (adds the BaseRecord audit fields stamped by hooks). */
export interface LocalWorkbenchScene extends BaseRecord, WorkbenchScene {}

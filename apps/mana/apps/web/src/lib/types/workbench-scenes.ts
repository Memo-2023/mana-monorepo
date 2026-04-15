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
import type { WallpaperConfig } from '@mana/shared-theme';

export interface WorkbenchSceneApp {
	appId: string;
	maximized?: boolean;
	/** Width preset in pixels. See PAGE_WIDTH_PRESETS for allowed values. */
	widthPx?: number;
}

/** A user-defined named layout of the workbench. */
export interface WorkbenchScene {
	id: string;
	name: string;
	/** Short free-text description shown under the name in the scene header. */
	description?: string | null;
	openApps: WorkbenchSceneApp[];
	/** Sort order in the scene tab bar. */
	order: number;
	/** Per-scene wallpaper override. When set, takes priority over globalSettings.wallpaper. */
	wallpaper?: WallpaperConfig;
	/**
	 * Optional Agent this scene is "viewed as" (Multi-Agent Workbench
	 * Phase 5). Pure UI lens — does NOT restrict which data the open
	 * apps see. When set, the scene tab shows the agent's avatar, the
	 * Workbench timeline defaults to this agent's filter, and the
	 * mission-create flow pre-selects it. Undefined = neutral scene
	 * (no agent binding); user can pick one explicitly in scene
	 * settings. See docs/plans/multi-agent-workbench.md §Phase 5d.
	 */
	viewingAsAgentId?: string;
}

/** Dexie row shape (adds the BaseRecord audit fields stamped by hooks). */
export interface LocalWorkbenchScene extends BaseRecord, WorkbenchScene {}

/**
 * Tiling Store — Manages the tiling layout tree
 *
 * Persists to IndexedDB via dashboardCollection. All tree mutations
 * are immutable (return new tree) to trigger Svelte 5 reactivity.
 */

import { browser } from '$app/environment';
import type { TileNode, TileLeaf } from '$lib/types/tiling';
import type { WidgetType } from '$lib/types/dashboard';
import { DEFAULT_TILING_ROOT } from '$lib/config/default-tiling';
import { dashboardCollection, type LocalDashboardConfig } from '$lib/data/local-store';
import * as tree from '$lib/utils/tiling-tree';

let root = $state<TileNode>(structuredClone(DEFAULT_TILING_ROOT));
let isEditing = $state(false);
let initialized = $state(false);

let persistTimeout: ReturnType<typeof setTimeout> | undefined;

function schedulePersist() {
	clearTimeout(persistTimeout);
	persistTimeout = setTimeout(doPersist, 300);
}

async function doPersist() {
	if (!browser) return;
	try {
		const existing = await dashboardCollection.get('dashboard-default');
		const update: Partial<LocalDashboardConfig> = {
			tiling: root,
			lastModified: new Date().toISOString(),
		};
		if (existing) {
			await dashboardCollection.update('dashboard-default', update);
		} else {
			await dashboardCollection.insert({
				id: 'dashboard-default',
				widgets: [],
				gridColumns: 12,
				tiling: root,
				lastModified: new Date().toISOString(),
			} as LocalDashboardConfig);
		}
	} catch (e) {
		console.error('Failed to persist tiling layout:', e);
	}
}

export const tilingStore = {
	get root() {
		return root;
	},
	get isEditing() {
		return isEditing;
	},
	get initialized() {
		return initialized;
	},
	get leaves(): TileLeaf[] {
		return tree.collectLeaves(root);
	},

	async initialize() {
		if (!browser || initialized) return;

		try {
			const stored = await dashboardCollection.get('dashboard-default');
			if (stored?.tiling) {
				root = stored.tiling as TileNode;
			}
		} catch (e) {
			console.error('Failed to load tiling layout:', e);
		}

		initialized = true;
	},

	startEditing() {
		isEditing = true;
	},

	stopEditing() {
		isEditing = false;
		doPersist();
	},

	toggleEditing() {
		if (isEditing) {
			this.stopEditing();
		} else {
			this.startEditing();
		}
	},

	splitPanel(leafId: string, direction: 'horizontal' | 'vertical', widgetType: WidgetType) {
		root = tree.splitLeaf(root, leafId, direction, widgetType);
		schedulePersist();
	},

	removePanel(leafId: string) {
		const result = tree.removeLeaf(root, leafId);
		if (result) {
			root = result;
			schedulePersist();
		}
	},

	swapPanels(leafIdA: string, leafIdB: string) {
		root = tree.swapLeaves(root, leafIdA, leafIdB);
		schedulePersist();
	},

	resizePanel(splitId: string, ratio: number) {
		root = tree.updateRatio(root, splitId, ratio);
		schedulePersist();
	},

	setWidget(leafId: string, widgetType: WidgetType) {
		root = tree.setLeafWidget(root, leafId, widgetType);
		schedulePersist();
	},

	resetToDefault() {
		root = structuredClone(DEFAULT_TILING_ROOT);
		doPersist();
	},
};

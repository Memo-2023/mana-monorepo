/**
 * Default Tiling Layout — 3 panels: Clock | Tasks | Calendar
 */

import type { TileNode, TilingConfig } from '$lib/types/tiling';

export const DEFAULT_TILING_ROOT: TileNode = {
	type: 'split',
	id: 'root',
	direction: 'horizontal',
	ratio: 0.33,
	first: {
		type: 'leaf',
		id: 'leaf-clock',
		widgetType: 'clock-timers',
	},
	second: {
		type: 'split',
		id: 'split-right',
		direction: 'horizontal',
		ratio: 0.5,
		first: {
			type: 'leaf',
			id: 'leaf-tasks',
			widgetType: 'tasks-today',
		},
		second: {
			type: 'leaf',
			id: 'leaf-calendar',
			widgetType: 'calendar-events',
		},
	},
};

export const DEFAULT_TILING_CONFIG: TilingConfig = {
	root: DEFAULT_TILING_ROOT,
	lastModified: new Date().toISOString(),
};

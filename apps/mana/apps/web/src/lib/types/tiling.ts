/**
 * Tiling Layout Types
 *
 * Binary tree structure for resizable, splittable dashboard panels.
 */

import type { WidgetType } from './dashboard';

/** A node in the tiling layout tree. */
export type TileNode = TileLeaf | TileSplit;

/** A leaf node containing a single widget. */
export interface TileLeaf {
	type: 'leaf';
	id: string;
	widgetType: WidgetType;
}

/** A split node with two children separated by a resize handle. */
export interface TileSplit {
	type: 'split';
	id: string;
	/** 'horizontal' = side by side (left|right), 'vertical' = stacked (top/bottom). */
	direction: 'horizontal' | 'vertical';
	/** Position of divider, 0.0 to 1.0. */
	ratio: number;
	first: TileNode;
	second: TileNode;
}

/** Serializable tiling configuration. */
export interface TilingConfig {
	root: TileNode;
	lastModified: string;
}

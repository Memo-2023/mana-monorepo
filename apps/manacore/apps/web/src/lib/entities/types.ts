/**
 * Entity Descriptor System — Types
 *
 * Each module declares an EntityDescriptor that describes how its items
 * can be displayed, dragged, dropped, and created from other modules.
 */

import type { DragType } from '@manacore/shared-ui/dnd';

export interface EntityDisplayData {
	title: string;
	subtitle?: string;
}

export interface EntityDescriptor {
	appId: string;
	collection: string;

	/** How to display an item in link previews and drag ghosts. */
	getDisplayData: (item: Record<string, unknown>) => EntityDisplayData;

	/** DragType used when dragging items from this module. */
	dragType: DragType;

	/** Which DragTypes this module accepts as drop targets. */
	acceptsDropFrom?: DragType[];

	/** Transform incoming items from other modules into this module's create shape. */
	transformIncoming?: Partial<
		Record<DragType, (sourceItem: Record<string, unknown>) => Record<string, unknown>>
	>;

	/** Create a new item in this module. Returns the new item's ID. */
	createItem?: (data: Record<string, unknown>) => Promise<string>;
}

export interface DropResult {
	newItemId: string;
	linkPairId: string;
}

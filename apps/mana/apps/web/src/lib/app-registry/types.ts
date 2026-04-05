/**
 * Unified App Registry — Types
 *
 * Each app declares an AppDescriptor that describes identity, views,
 * and optional entity capabilities (DnD, linking, cross-module drops).
 */

import type { DragType } from '@mana/shared-ui/dnd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = import('svelte').Component<any, any>;

export type ContextMenuLocation = 'card' | 'tab' | 'nav' | 'page';

export interface AppContextMenuAction {
	id: string;
	label: string;
	icon?: AnyComponent;
	shortcut?: string;
	/** Only show in certain contexts (default: all) */
	showIn?: ContextMenuLocation[];
	action: () => void;
}

export interface ViewLoader {
	load: () => Promise<{ default: AnyComponent }>;
}

export interface EntityDisplayData {
	title: string;
	subtitle?: string;
}

export interface AppDescriptor {
	// -- Identity --
	id: string;
	name: string;
	color: string;

	// -- Views --
	views: {
		list: ViewLoader;
		detail?: ViewLoader;
	};

	// -- Entity (optional -- for DnD + linking) --
	collection?: string;
	paramKey?: string;
	dragType?: DragType;
	acceptsDropFrom?: DragType[];
	transformIncoming?: Partial<
		Record<DragType, (sourceItem: Record<string, unknown>) => Record<string, unknown>>
	>;
	createItem?: (data: Record<string, unknown>) => Promise<string>;
	getDisplayData?: (item: Record<string, unknown>) => EntityDisplayData;

	// -- Context Menu (optional) --
	contextMenuActions?: AppContextMenuAction[];
}

export interface DropResult {
	newItemId: string;
	linkPairId: string;
}

export interface ViewProps {
	navigate: (viewName: string, params?: Record<string, unknown>) => void;
	goBack: () => void;
	params: Record<string, unknown>;
}

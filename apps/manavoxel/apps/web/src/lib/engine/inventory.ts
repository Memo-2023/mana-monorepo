import type { SpriteData } from '$lib/editor/sprite-editor.svelte';
import type { ItemProperties, Rarity, ElementType } from '@manavoxel/shared';

export interface GameItem {
	id: string;
	name: string;
	sprite: SpriteData;
	properties: ItemProperties;
	rarity: Rarity;
}

const defaultProperties: ItemProperties = {
	damage: 0,
	range: 1,
	speed: 1,
	durabilityMax: 100,
	durabilityCurrent: 100,
	element: 'neutral',
	rarity: 'common',
	sound: 'hit_default',
	particle: 'none',
};

let nextItemId = 1;

/** Create a new item from sprite data */
export function createItem(
	name: string,
	sprite: SpriteData,
	partialProps?: Partial<ItemProperties>
): GameItem {
	return {
		id: `item_${nextItemId++}`,
		name,
		sprite,
		properties: { ...defaultProperties, ...partialProps },
		rarity: partialProps?.rarity ?? 'common',
	};
}

export const MAX_INVENTORY_SLOTS = 8;
export const MAX_EQUIPMENT_SLOTS = 1; // Held item

export class Inventory {
	slots: (GameItem | null)[] = $state(Array(MAX_INVENTORY_SLOTS).fill(null));
	heldSlot: number = $state(-1); // -1 = nothing held

	get heldItem(): GameItem | null {
		if (this.heldSlot < 0 || this.heldSlot >= this.slots.length) return null;
		return this.slots[this.heldSlot];
	}

	/** Add item to first empty slot. Returns slot index or -1 if full. */
	addItem(item: GameItem): number {
		const emptySlot = this.slots.findIndex((s) => s === null);
		if (emptySlot === -1) return -1;
		this.slots[emptySlot] = item;
		return emptySlot;
	}

	/** Remove item from a slot */
	removeItem(slot: number): GameItem | null {
		if (slot < 0 || slot >= this.slots.length) return null;
		const item = this.slots[slot];
		this.slots[slot] = null;
		if (this.heldSlot === slot) this.heldSlot = -1;
		return item;
	}

	/** Select a slot to hold */
	selectSlot(slot: number) {
		if (slot < 0 || slot >= this.slots.length) return;
		this.heldSlot = this.heldSlot === slot ? -1 : slot;
	}

	/** Check if inventory is full */
	get isFull(): boolean {
		return this.slots.every((s) => s !== null);
	}

	/** Count of items */
	get count(): number {
		return this.slots.filter((s) => s !== null).length;
	}
}

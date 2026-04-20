/**
 * ManaVoxel — Local-First Data Layer
 *
 * All world data lives in IndexedDB via Dexie.js.
 * Worlds, areas, items persist across browser sessions.
 * Syncs to server via mana-sync when authenticated.
 */

import { createLocalStore, type BaseRecord } from '@mana/local-store';
import { generateGuestWorld } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalWorld extends BaseRecord {
	name: string;
	description: string;
	creatorId: string;
	isPublished: boolean;
	playCount: number;
	startAreaId: string;
	template: string;
	settings: Record<string, unknown>;
}

export interface LocalArea extends BaseRecord {
	worldId: string;
	name: string;
	type: 'street' | 'interior';
	resolution: number;
	width: number;
	height: number;
	floors: number;
	pixelData: string; // Base64-encoded Uint8Array (Dexie can't store Uint8Array in indexes)
	palette: string; // JSON stringified Material[]
	entities: string; // JSON stringified EntityDef[]
	portals: string; // JSON stringified PortalDef[]
	spawnX: number;
	spawnY: number;
	spawnFloor: number;
}

export interface LocalItem extends BaseRecord {
	creatorId: string;
	name: string;
	description: string;
	spriteData: string; // Base64-encoded RGBA Uint8Array
	spriteWidth: number;
	spriteHeight: number;
	animationFrames: number;
	resolution: number;
	properties: string; // JSON stringified ItemProperties
	behavior: string; // JSON stringified TriggerAction[]
	rarity: string;
	isPublished: boolean;
}

export interface LocalInventorySlot extends BaseRecord {
	playerId: string;
	itemId: string;
	slot: number;
	quantity: number;
	instanceData: string; // JSON stringified
}

// ─── Encoding Helpers ───────────────────────────────────────

export function encodeBytes(data: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < data.length; i++) {
		binary += String.fromCharCode(data[i]);
	}
	return btoa(binary);
}

export function decodeBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

// @mana/local-store's CollectionDef.guestSeed expects `T[]` (the seed
// array itself), not a lazy producer. The previous three arrow-wrappers
// looked lazy but the framework never awaited them — it iterated them
// as `seed.length`, which against a function silently yielded 0 (dead
// seed). Evaluate once and share.
const guestSeed = generateGuestWorld();

export const gameStore = createLocalStore({
	appId: 'manavoxel',
	collections: [
		{
			name: 'worlds',
			indexes: ['creatorId', 'isPublished', 'name', 'template'],
			guestSeed: guestSeed.worlds,
		},
		{
			name: 'areas',
			indexes: ['worldId', 'type', '[worldId+name]'],
			guestSeed: guestSeed.areas,
		},
		{
			name: 'items',
			indexes: ['creatorId', 'rarity', 'isPublished', 'name'],
			guestSeed: guestSeed.items,
		},
		{
			name: 'inventories',
			indexes: ['playerId', '[playerId+slot]', 'itemId'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const worldCollection = gameStore.collection<LocalWorld>('worlds');
export const areaCollection = gameStore.collection<LocalArea>('areas');
export const itemCollection = gameStore.collection<LocalItem>('items');
export const inventoryCollection = gameStore.collection<LocalInventorySlot>('inventories');

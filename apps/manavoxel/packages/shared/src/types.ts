// ─── Materials ───────────────────────────────────────────────

export interface Material {
	id: number;
	name: string;
	color: string; // Hex
	solid: boolean;
	transparent: boolean;
	emissive: boolean;
}

export const MATERIAL_AIR = 0;

export const DEFAULT_MATERIALS: Material[] = [
	{ id: 0, name: 'Air', color: '#000000', solid: false, transparent: true, emissive: false },
	{ id: 1, name: 'Stone', color: '#808080', solid: true, transparent: false, emissive: false },
	{ id: 2, name: 'Dirt', color: '#8B6914', solid: true, transparent: false, emissive: false },
	{ id: 3, name: 'Grass', color: '#4CAF50', solid: true, transparent: false, emissive: false },
	{ id: 4, name: 'Wood', color: '#A0522D', solid: true, transparent: false, emissive: false },
	{ id: 5, name: 'Plank', color: '#DEB887', solid: true, transparent: false, emissive: false },
	{ id: 6, name: 'Sand', color: '#F4E3B2', solid: true, transparent: false, emissive: false },
	{ id: 7, name: 'Water', color: '#4FC3F7', solid: false, transparent: true, emissive: false },
	{ id: 8, name: 'Brick', color: '#B71C1C', solid: true, transparent: false, emissive: false },
	{ id: 9, name: 'Glass', color: '#E0F7FA', solid: true, transparent: true, emissive: false },
	{ id: 10, name: 'Torch', color: '#FFD54F', solid: false, transparent: true, emissive: true },
	{ id: 11, name: 'Metal', color: '#B0BEC5', solid: true, transparent: false, emissive: false },
	{ id: 12, name: 'Cobble', color: '#9E9E9E', solid: true, transparent: false, emissive: false },
	{ id: 13, name: 'Leaf', color: '#2E7D32', solid: true, transparent: false, emissive: false },
	{ id: 14, name: 'Roof', color: '#5D4037', solid: true, transparent: false, emissive: false },
	{ id: 15, name: 'Snow', color: '#FAFAFA', solid: true, transparent: false, emissive: false },
];

// ─── Pixel Grid (per chunk) ─────────────────────────────────

export const CHUNK_SIZE = 32;

// ─── Areas ──────────────────────────────────────────────────

export type AreaType = 'street' | 'interior';

export interface PortalDef {
	id: string;
	x: number;
	y: number;
	floor: number;
	targetAreaId: string;
	targetX: number;
	targetY: number;
	targetFloor: number;
	requiresKey?: string; // Item ID
}

export interface EntityDef {
	id: string;
	type: 'npc' | 'item' | 'light' | 'spawn';
	x: number;
	y: number;
	floor: number;
	spriteId?: string;
	properties?: Record<string, unknown>;
}

export interface Area {
	id: string;
	worldId: string;
	name: string;
	type: AreaType;
	resolution: number; // 0.10 (street) or 0.05 (interior)
	width: number; // in pixels
	height: number;
	floors: number;
	pixelData: Uint8Array; // RLE compressed: floors × height × width
	palette: Material[];
	entities: EntityDef[];
	portals: PortalDef[];
	spawnPoint: { x: number; y: number; floor: number };
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
}

// ─── Worlds ─────────────────────────────────────────────────

export interface World {
	id: string;
	creatorId: string;
	name: string;
	description: string;
	isPublished: boolean;
	playCount: number;
	startAreaId: string;
	settings: Record<string, unknown>;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
}

// ─── Items ──────────────────────────────────────────────────

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ElementType = 'neutral' | 'fire' | 'ice' | 'poison' | 'lightning';

export interface ItemProperties {
	damage: number;
	range: number;
	speed: number;
	durabilityMax: number;
	durabilityCurrent: number;
	element: ElementType;
	rarity: Rarity;
	sound: string;
	particle: string;
}

export interface TriggerAction {
	trigger: { type: string; params: Record<string, unknown> };
	conditions?: { type: string; params: Record<string, unknown> }[];
	actions: { type: string; params: Record<string, unknown> }[];
}

export interface Item {
	id: string;
	creatorId: string;
	name: string;
	description: string;
	spriteData: Uint8Array; // Raw pixel data (RGBA or indexed)
	spriteWidth: number;
	spriteHeight: number;
	animationFrames: number;
	resolution: number; // 0.01 for detail items
	properties: ItemProperties;
	behavior: TriggerAction[];
	script?: string;
	wasmBinary?: Uint8Array;
	rarity: Rarity;
	capabilities: string[];
	isPublished: boolean;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
}

// ─── Inventory ──────────────────────────────────────────────

export interface InventorySlot {
	id: string;
	playerId: string;
	itemId: string;
	slot: number;
	quantity: number;
	instanceData: Record<string, unknown>; // durability state etc.
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
}

// ─── Network Protocol ───────────────────────────────────────

export type ClientMessage =
	| { type: 'join'; worldId: string; areaId: string }
	| { type: 'move'; x: number; y: number; direction: number }
	| { type: 'setPixel'; x: number; y: number; floor: number; material: number }
	| { type: 'useItem'; itemId: string; targetX: number; targetY: number }
	| { type: 'enterPortal'; portalId: string }
	| { type: 'chat'; message: string }
	| { type: 'ping' };

export type ServerMessage =
	| { type: 'welcome'; playerId: string; areaState: Area; players: PlayerState[] }
	| { type: 'playerJoin'; player: PlayerState }
	| { type: 'playerLeave'; playerId: string }
	| { type: 'playerMove'; playerId: string; x: number; y: number; direction: number }
	| {
			type: 'pixelChanged';
			x: number;
			y: number;
			floor: number;
			material: number;
			playerId: string;
	  }
	| { type: 'itemUsed'; playerId: string; itemId: string; effects: Effect[] }
	| { type: 'areaTransition'; areaId: string; areaState: Area; players: PlayerState[] }
	| { type: 'chat'; playerId: string; name: string; message: string }
	| { type: 'error'; message: string }
	| { type: 'pong' };

export interface PlayerState {
	id: string;
	name: string;
	x: number;
	y: number;
	floor: number;
	direction: number; // 0=up, 1=right, 2=down, 3=left
	heldItemId?: string;
	hp: number;
	maxHp: number;
}

export interface Effect {
	type: 'damage' | 'heal' | 'particle' | 'sound' | 'pixelDestroy';
	x: number;
	y: number;
	params: Record<string, unknown>;
}

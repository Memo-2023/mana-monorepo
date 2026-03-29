/**
 * Bridge between Dexie.js local-store and the PixiJS game engine.
 * Loads/saves world data from IndexedDB, converts between DB format and engine format.
 */

import {
	worldCollection,
	areaCollection,
	itemCollection,
	decodeBytes,
	encodeBytes,
	type LocalWorld,
	type LocalArea,
} from './local-store';
import type { Area, PortalDef, EntityDef, Material } from '@manavoxel/shared';
import { DEFAULT_MATERIALS } from '@manavoxel/shared';

/** Load a world and all its areas from IndexedDB */
export async function loadWorld(worldId: string): Promise<{
	world: LocalWorld;
	areas: Area[];
} | null> {
	const world = await worldCollection.get(worldId);
	if (!world) return null;

	const dbAreas = await areaCollection.getAll({ worldId });
	const areas = dbAreas.map(dbAreaToEngineArea);

	return { world, areas };
}

/** Get all worlds from IndexedDB */
export async function getAllWorlds(): Promise<LocalWorld[]> {
	return worldCollection.getAll();
}

/** Save an area's pixel data back to IndexedDB */
export async function saveAreaPixels(areaId: string, pixelData: Uint8Array) {
	await areaCollection.update(areaId, {
		pixelData: encodeBytes(pixelData),
		updatedAt: new Date().toISOString(),
	});
}

/** Create a new world with areas in IndexedDB */
export async function createWorld(
	name: string,
	template: string,
	areas: { area: Omit<LocalArea, 'id' | 'createdAt' | 'updatedAt'>; id: string }[]
): Promise<string> {
	const worldId = crypto.randomUUID();
	const startAreaId = areas[0]?.id ?? '';

	await worldCollection.insert({
		id: worldId,
		name,
		description: '',
		creatorId: 'local',
		isPublished: false,
		playCount: 0,
		startAreaId,
		template,
		settings: {},
	});

	for (const { area, id } of areas) {
		await areaCollection.insert({
			...area,
			id,
			worldId,
		});
	}

	return worldId;
}

/** Delete a world and all its areas */
export async function deleteWorld(worldId: string) {
	const areas = await areaCollection.getAll({ worldId });
	for (const area of areas) {
		await areaCollection.delete(area.id);
	}
	await worldCollection.delete(worldId);
}

// ─── Converters ─────────────────────────────────────────────

function dbAreaToEngineArea(dbArea: LocalArea): Area {
	return {
		id: dbArea.id,
		worldId: dbArea.worldId,
		name: dbArea.name,
		type: dbArea.type,
		resolution: dbArea.resolution,
		width: dbArea.width,
		height: dbArea.height,
		floors: dbArea.floors,
		pixelData: decodeBytes(dbArea.pixelData),
		palette: safeJsonParse<Material[]>(dbArea.palette, DEFAULT_MATERIALS),
		entities: safeJsonParse<EntityDef[]>(dbArea.entities, []),
		portals: safeJsonParse<PortalDef[]>(dbArea.portals, []),
		spawnPoint: { x: dbArea.spawnX, y: dbArea.spawnY, floor: dbArea.spawnFloor },
	};
}

function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return fallback;
	}
}

/**
 * Guest seed data: A small demo village that appears on first visit.
 * Generates worlds, areas, and starter items for the guest experience.
 */

import { DEFAULT_MATERIALS, MATERIAL_AIR } from '@manavoxel/shared';
import { encodeBytes, type LocalWorld, type LocalArea, type LocalItem } from './local-store';

// Cached result so guest seed is only generated once
let cached: { worlds: LocalWorld[]; areas: LocalArea[]; items: LocalItem[] } | null = null;

export function generateGuestWorld() {
	if (cached) return cached;

	const worldId = 'guest-world-001';
	const streetId = 'guest-street-001';
	const houseId = 'guest-house-001';

	// ─── Street (50m × 30m at 10cm) ─────────────────────────

	const streetW = 500;
	const streetH = 300;
	const streetPixels = new Uint8Array(streetW * streetH * 2);
	const streetView = new DataView(streetPixels.buffer);

	for (let y = 0; y < streetH; y++) {
		for (let x = 0; x < streetW; x++) {
			let mat = MATERIAL_AIR;

			// Border
			if (x === 0 || x === streetW - 1 || y === 0 || y === streetH - 1) mat = 1;
			// Road
			else if (y >= 130 && y <= 170) mat = 12;
			// Grass patches
			else if ((y > 170 || y < 130) && Math.random() < 0.25) mat = 3;
			// House 1 (brick)
			else if (x >= 40 && x <= 80 && y >= 40 && y <= 80) {
				if (x === 40 || x === 80 || y === 40 || y === 80) mat = 8;
				else if (y === 80 && x >= 56 && x <= 64)
					mat = 0; // door
				else if (y === 45 && (x === 50 || x === 55 || x === 65 || x === 70)) mat = 9;
			}
			// House 2 (wood)
			else if (x >= 120 && x <= 180 && y >= 30 && y <= 90) {
				if (x === 120 || x === 180 || y === 30 || y === 90) mat = 4;
				else if (y === 90 && x >= 145 && x <= 155) mat = 0;
				else if (y === 40 && (x === 135 || x === 150 || x === 165)) mat = 9;
			}
			// House 3 (stone)
			else if (x >= 250 && x <= 310 && y >= 50 && y <= 100) {
				if (x === 250 || x === 310 || y === 50 || y === 100) mat = 1;
				else if (y === 100 && x >= 275 && x <= 285) mat = 0;
			}
			// Well (center of village)
			else if (Math.abs(x - 150) <= 4 && Math.abs(y - 150) <= 4) {
				if (Math.abs(x - 150) === 4 || Math.abs(y - 150) === 4) mat = 12;
				else mat = 7; // water
			}
			// Trees
			else if (x === 350 && y >= 80 && y <= 95) mat = 4;
			else if (Math.abs(x - 350) + Math.abs(y - 75) <= 7 && y < 82) mat = 13;
			else if (x === 400 && y >= 100 && y <= 115) mat = 4;
			else if (Math.abs(x - 400) + Math.abs(y - 95) <= 6 && y < 102) mat = 13;
			// Torches
			else if (y === 128 && x % 30 === 15) mat = 10;
			else if (y === 172 && x % 30 === 15) mat = 10;

			if (mat !== 0) streetView.setUint16((y * streetW + x) * 2, mat, true);
		}
	}

	// ─── House Interior (12m × 8m at 5cm = 240 × 160, 2 floors) ─

	const houseW = 240;
	const houseH = 160;
	const houseFloors = 2;
	const housePixels = new Uint8Array(houseW * houseH * houseFloors * 2);
	const houseView = new DataView(housePixels.buffer);

	function setHousePixel(floor: number, x: number, y: number, mat: number) {
		const offset = floor * houseW * houseH;
		const idx = (offset + y * houseW + x) * 2;
		if (idx + 1 < housePixels.length) houseView.setUint16(idx, mat, true);
	}

	// Ground floor
	for (let y = 0; y < houseH; y++) {
		for (let x = 0; x < houseW; x++) {
			if (x === 0 || x === houseW - 1 || y === 0 || y === houseH - 1) setHousePixel(0, x, y, 1);
			else if (x > 2 && x < houseW - 3 && y > 2 && y < houseH - 3) setHousePixel(0, x, y, 5);
			if (y === houseH - 1 && x >= 55 && x <= 65) setHousePixel(0, x, y, 0); // door
			if (y === 0 && (x === 40 || x === 80 || x === 120 || x === 160 || x === 200))
				setHousePixel(0, x, y, 9);
		}
	}
	// Table
	for (let y = 50; y <= 75; y++)
		for (let x = 80; x <= 130; x++)
			if (y === 50 || y === 75 || x === 80 || x === 130) setHousePixel(0, x, y, 4);
	// Fireplace
	for (let y = 20; y <= 50; y++)
		for (let x = 190; x <= 225; x++) {
			if (y === 20 || x === 190 || x === 225) setHousePixel(0, x, y, 8);
			else if (y >= 38 && y <= 45 && x >= 200 && x <= 215) setHousePixel(0, x, y, 10);
		}
	// Stairs
	for (let y = 120; y <= 140; y++) for (let x = 190; x <= 210; x++) setHousePixel(0, x, y, 14);

	// Upper floor
	for (let y = 0; y < houseH; y++) {
		for (let x = 0; x < houseW; x++) {
			if (x === 0 || x === houseW - 1 || y === 0 || y === houseH - 1) setHousePixel(1, x, y, 1);
			else if (x > 2 && x < houseW - 3 && y > 2 && y < houseH - 3) setHousePixel(1, x, y, 5);
		}
	}
	// Bed
	for (let y = 25; y <= 65; y++)
		for (let x = 20; x <= 60; x++) {
			if (y === 25 || y === 65 || x === 20 || x === 60) setHousePixel(1, x, y, 4);
			else setHousePixel(1, x, y, 15);
		}
	// Stairs back
	for (let y = 120; y <= 140; y++) for (let x = 190; x <= 210; x++) setHousePixel(1, x, y, 14);

	// ─── Assemble Data ──────────────────────────────────────

	const worlds: LocalWorld[] = [
		{
			id: worldId,
			name: 'Demo Village',
			description: 'A small village to explore and build in',
			creatorId: 'guest',
			isPublished: false,
			playCount: 0,
			startAreaId: streetId,
			template: 'village',
			settings: {},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	];

	const paletteJson = JSON.stringify(DEFAULT_MATERIALS);

	const areas: LocalArea[] = [
		{
			id: streetId,
			worldId,
			name: 'Marktplatz',
			type: 'street',
			resolution: 0.1,
			width: streetW,
			height: streetH,
			floors: 1,
			pixelData: encodeBytes(streetPixels),
			palette: paletteJson,
			entities: '[]',
			portals: JSON.stringify([
				{
					id: 'portal-to-house',
					x: 60,
					y: 80,
					floor: 0,
					targetAreaId: houseId,
					targetX: 60,
					targetY: 150,
					targetFloor: 0,
				},
			]),
			spawnX: 60,
			spawnY: 150,
			spawnFloor: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: houseId,
			worldId,
			name: 'Haus am Marktplatz',
			type: 'interior',
			resolution: 0.05,
			width: houseW,
			height: houseH,
			floors: houseFloors,
			pixelData: encodeBytes(housePixels),
			palette: paletteJson,
			entities: '[]',
			portals: JSON.stringify([
				{
					id: 'portal-to-street',
					x: 60,
					y: houseH - 1,
					floor: 0,
					targetAreaId: streetId,
					targetX: 60,
					targetY: 82,
					targetFloor: 0,
				},
			]),
			spawnX: 60,
			spawnY: houseH - 10,
			spawnFloor: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	];

	const items: LocalItem[] = [];

	cached = { worlds, areas, items };
	return cached;
}

/**
 * BlockTypes.ts
 *
 * Diese Datei enthält Definitionen und Funktionalitäten für das Blocksystem des Voxel-Spiels.
 * Sie definiert die verschiedenen Blocktypen, Hilfsfunktionen zur Texturerstellung und
 * den BlockManager, der die zentrale Verwaltung aller Blöcke übernimmt.
 */

import * as THREE from 'three';

/**
 * BlockType Interface
 * Definiert die Eigenschaften, die ein Blocktyp haben kann:
 * - name: Anzeigename des Blocks
 * - color: Hauptfarbe des Blocks (hexadezimal)
 * - emissive: Leuchtfarbe für Blöcke, die Licht emittieren sollen
 * - topColor/sideColor/bottomColor: Spezifische Farben für verschiedene Seiten (z.B. bei Gras)
 * - opacity: Transparenz des Blocks (1 = undurchsichtig, <1 = durchsichtig)
 * - solid: Ob der Block fest ist und Kollisionen verursacht
 * - isDeadly: Ob der Block tödlich ist (z.B. Lava)
 * - frictionFactor: Reibungsfaktor für die Spielerphysik
 * - isGoal: Ob der Block ein Zielblock ist
 */
export type BlockType = {
	name: string;
	color?: number;
	emissive?: number;
	topColor?: number;
	sideColor?: number;
	bottomColor?: number;
	opacity?: number;
	solid: boolean;
	isDeadly: boolean;
	frictionFactor: number;
	isGoal: boolean;
	isFragile?: boolean;
	breakTimer?: number;
	isTrampoline?: boolean;
	trampolineForce?: number;
};

/**
 * BlockTypes Interface
 * Ein Dictionary/Map von Blocktypen, indiziert durch ihren String-Schlüssel
 */
export type BlockTypes = {
	[key: string]: BlockType;
};

/**
 * BLOCK_TYPES Konstante
 * Definiert alle verfügbaren Blocktypen im Spiel mit ihren Eigenschaften:
 * - lava: Tödlicher Block mit rötlicher Farbe und Leuchteffekt
 * - grass: Block mit grüner Oberseite und braunen Seiten
 * - ice: Transparenter, rutschiger Block
 * - goal: Zielblock mit gelber Farbe und Leuchteffekt
 * - spawn: Spawn-Punkt mit grüner Farbe und Leuchteffekt
 * - fragile: Zerbrechlicher Block, der nach einer Sekunde zerbricht, wenn der Spieler darauf steht
 * - trampoline: Trampolinblock, der den Spieler in die Höhe schießt
 */
export const BLOCK_TYPES: BlockTypes = {
	lava: {
		name: 'Lava',
		color: 0xcf1020,
		topColor: 0xcf1020,
		sideColor: 0xaa0000,
		bottomColor: 0x990000,
		emissive: 0xff4500,
		solid: true,
		isDeadly: true,
		frictionFactor: 0.8,
		isGoal: false,
	},
	grass: {
		name: 'Gras',
		color: 0x8b4513,
		topColor: 0x559944,
		sideColor: 0x8b4513,
		bottomColor: 0x8b4513,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.7,
		isGoal: false,
	},
	ice: {
		name: 'Eis',
		color: 0xadd8e6,
		topColor: 0xadd8e6,
		sideColor: 0x89cff0,
		bottomColor: 0x77a7c5,
		opacity: 0.85,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.98,
		isGoal: false,
	},
	goal: {
		name: 'Ziel',
		color: 0xffff00,
		topColor: 0xffff00,
		sideColor: 0xffd700,
		bottomColor: 0xdaa520,
		emissive: 0xcccc00,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.8,
		isGoal: true,
	},
	spawn: {
		name: 'Spawn',
		color: 0x00ff00,
		topColor: 0x00ff00,
		sideColor: 0x00cc00,
		bottomColor: 0x009900,
		emissive: 0x00aa00,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.7,
		isGoal: false,
	},
	fragile: {
		name: 'Zerbrechlich',
		color: 0xa0522d,
		topColor: 0xa0522d,
		sideColor: 0x8b4513,
		bottomColor: 0x654321,
		emissive: 0x8b4513,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.7,
		isGoal: false,
		isFragile: true,
		breakTimer: 1.0,
	},
	trampoline: {
		name: 'Trampolin',
		color: 0x0000ff,
		topColor: 0x0000ff,
		sideColor: 0x0000cc,
		bottomColor: 0x000099,
		emissive: 0x0000aa,
		solid: true,
		isDeadly: false,
		frictionFactor: 0.7,
		isGoal: false,
		isTrampoline: true,
		trampolineForce: 20.0,
	},
};

/**
 * Textur-Erstellungsfunktionen
 * Diese Funktionen erzeugen dynamisch Texturen für die verschiedenen Blockseiten,
 * indem sie Canvas-Elemente erstellen und mit den entsprechenden Farben füllen.
 */

/**
 * createSideTexture
 * Erstellt eine Textur für die Seitenflächen eines Blocks.
 *
 * @param color - Die Farbe der Textur als Hexadezimalwert
 * @returns Eine THREE.CanvasTexture mit der erstellten Textur
 */
export function createSideTexture(color: number): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 16;
	canvas.height = 16;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		// Fülle den Hintergrund mit der angegebenen Farbe
		// Stelle sicher, dass die Farbe korrekt formatiert ist (6 Stellen Hex)
		const colorHex = color.toString(16).padStart(6, '0');
		ctx.fillStyle = `#${colorHex}`;
		ctx.fillRect(0, 0, 16, 16);
		// Füge einen leicht transparenten schwarzen Rahmen hinzu
		ctx.strokeStyle = '#00000033';
		ctx.strokeRect(0, 0, 16, 16);
		console.log(`Seitentextur erstellt mit Farbe: #${colorHex}`);
	}
	return new THREE.CanvasTexture(canvas);
}

/**
 * createTopTexture
 * Erstellt eine Textur für die Oberseite eines Blocks.
 * Diese Textur hat einen weißen Rahmen, um sie von den Seitenflächen zu unterscheiden.
 *
 * @param color - Die Farbe der Textur als Hexadezimalwert
 * @returns Eine THREE.CanvasTexture mit der erstellten Textur
 */
export function createTopTexture(color: number): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 16;
	canvas.height = 16;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		// Fülle den Hintergrund mit der angegebenen Farbe
		// Stelle sicher, dass die Farbe korrekt formatiert ist (6 Stellen Hex)
		const colorHex = color.toString(16).padStart(6, '0');
		ctx.fillStyle = `#${colorHex}`;
		ctx.fillRect(0, 0, 16, 16);
		// Füge einen leicht transparenten weißen Rahmen hinzu
		ctx.strokeStyle = '#FFFFFF33';
		ctx.strokeRect(0, 0, 16, 16);
		console.log(`Oberseitentextur erstellt mit Farbe: #${colorHex}`);
	}
	return new THREE.CanvasTexture(canvas);
}

/**
 * createBottomTexture
 * Erstellt eine Textur für die Unterseite eines Blocks.
 * Diese Textur hat keinen Rahmen, da die Unterseite meist nicht sichtbar ist.
 *
 * @param color - Die Farbe der Textur als Hexadezimalwert
 * @returns Eine THREE.CanvasTexture mit der erstellten Textur
 */
export function createBottomTexture(color: number): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 16;
	canvas.height = 16;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		// Fülle den Hintergrund mit der angegebenen Farbe
		// Stelle sicher, dass die Farbe korrekt formatiert ist (6 Stellen Hex)
		const colorHex = color.toString(16).padStart(6, '0');
		ctx.fillStyle = `#${colorHex}`;
		ctx.fillRect(0, 0, 16, 16);
		// Kein Rahmen für die Unterseite
		console.log(`Unterseitentextur erstellt mit Farbe: #${colorHex}`);
	}
	return new THREE.CanvasTexture(canvas);
}

/**
 * getVoxelKey
 * Erzeugt einen eindeutigen Schlüssel für einen Voxel basierend auf seinen Koordinaten.
 * Dieser Schlüssel wird verwendet, um Voxel in einer Map zu speichern und abzurufen.
 *
 * @param x - X-Koordinate des Voxels
 * @param y - Y-Koordinate des Voxels
 * @param z - Z-Koordinate des Voxels
 * @returns Ein String im Format "x,y,z", der als eindeutiger Schlüssel dient
 */
export function getVoxelKey(x: number, y: number, z: number): string {
	return `${x},${y},${z}`;
}

/**
 * BlockManager Klasse
 *
 * Diese Klasse ist verantwortlich für die zentrale Verwaltung aller Blöcke im Spiel.
 * Sie kapselt die Logik zum Hinzufügen, Entfernen und Abfragen von Blöcken sowie
 * die Verwaltung von Zielblöcken und deren Erreichungsstatus.
 */
export class BlockManager {
	/** Die THREE.js-Szene, in der die Blöcke gerendert werden */
	private scene: THREE.Scene;
	/** Map, die alle Voxel-Meshes anhand ihrer Koordinaten speichert */
	private voxels: Map<string, THREE.Mesh>;
	/** Größe eines einzelnen Voxels */
	private voxelSize: number;
	/** Liste aller Zielblöcke im Spiel */
	private goalBlocks: { x: number; y: number; z: number }[] = [];
	/** Liste der bereits erreichten Zielblöcke */
	private reachedGoals: { x: number; y: number; z: number }[] = [];
	/** Callback-Funktion, um die Zielanzeige im UI zu aktualisieren */
	private updateGoalDisplayCallback: () => void;
	/** Aktuell ausgewählter Blocktyp für das Platzieren neuer Blöcke */
	private currentBlockType: string = 'grass';

	/**
	 * Konstruktor für den BlockManager
	 *
	 * @param scene - Die THREE.js-Szene, in der die Blöcke gerendert werden
	 * @param voxels - Map, die alle Voxel-Meshes anhand ihrer Koordinaten speichert
	 * @param voxelSize - Größe eines einzelnen Voxels
	 * @param goalBlocks - Liste aller Zielblöcke im Spiel
	 * @param reachedGoals - Liste der bereits erreichten Zielblöcke
	 * @param updateGoalDisplayCallback - Callback-Funktion, um die Zielanzeige im UI zu aktualisieren
	 */
	constructor(
		scene: THREE.Scene,
		voxels: Map<string, THREE.Mesh>,
		voxelSize: number,
		goalBlocks: { x: number; y: number; z: number }[],
		reachedGoals: { x: number; y: number; z: number }[],
		updateGoalDisplayCallback: () => void
	) {
		this.scene = scene;
		this.voxels = voxels;
		this.voxelSize = voxelSize;
		this.goalBlocks = goalBlocks;
		this.reachedGoals = reachedGoals;
		this.updateGoalDisplayCallback = updateGoalDisplayCallback;
	}

	/**
	 * Setzt den aktuell ausgewählten Blocktyp für das Platzieren neuer Blöcke
	 *
	 * @param type - Der Typ des Blocks (z.B. 'grass', 'lava', 'ice')
	 */
	setCurrentBlockType(type: string): void {
		this.currentBlockType = type;
	}

	/**
	 * Gibt den aktuell ausgewählten Blocktyp zurück
	 *
	 * @returns Der aktuelle Blocktyp als String
	 */
	getCurrentBlockType(): string {
		return this.currentBlockType;
	}

	/**
	 * Findet das Mesh eines Voxels anhand seiner Koordinaten
	 *
	 * @param x - X-Koordinate des Voxels
	 * @param y - Y-Koordinate des Voxels
	 * @param z - Z-Koordinate des Voxels
	 * @returns Das THREE.Mesh des Voxels oder undefined, wenn kein Voxel an dieser Position existiert
	 */
	getVoxelMesh(x: number, y: number, z: number): THREE.Mesh | undefined {
		return this.voxels.get(getVoxelKey(x, y, z));
	}

	/**
	 * Ermittelt den Blocktyp eines Voxels anhand seiner Koordinaten
	 *
	 * @param x - X-Koordinate des Voxels
	 * @param y - Y-Koordinate des Voxels
	 * @param z - Z-Koordinate des Voxels
	 * @returns Das BlockType-Objekt des Voxels oder null, wenn kein Voxel an dieser Position existiert
	 */
	getVoxelBlockType(x: number, y: number, z: number): BlockType | null {
		const mesh = this.getVoxelMesh(x, y, z);
		return mesh && mesh.userData.type ? BLOCK_TYPES[mesh.userData.type as string] : null;
	}

	/**
	 * Fügt einen neuen Voxel-Block an der angegebenen Position hinzu
	 *
	 * @param x - X-Koordinate des Voxels
	 * @param y - Y-Koordinate des Voxels
	 * @param z - Z-Koordinate des Voxels
	 * @param type - Typ des Blocks (Standard: der aktuell ausgewählte Blocktyp)
	 */
	addVoxel(x: number, y: number, z: number, type: string = this.currentBlockType): void {
		// Erstelle einen eindeutigen Schlüssel für den Voxel
		const key = getVoxelKey(x, y, z);
		// Wenn an dieser Position bereits ein Block existiert, breche ab
		if (this.voxels.has(key)) return;

		// Hole die Block-Definition für den angegebenen Typ
		const blockDef = BLOCK_TYPES[type];
		if (!blockDef) {
			console.warn(`Unbekannter Blocktyp: ${type}`);
			return;
		}

		// Erstelle die Geometrie für den Voxel
		const voxelGeometry = new THREE.BoxGeometry(this.voxelSize, this.voxelSize, this.voxelSize);
		let voxelMaterial;

		// Verwende verschiedene Texturen für Ober-, Unter- und Seitenflächen für alle Blöcke
		if (
			blockDef.topColor !== undefined &&
			blockDef.sideColor !== undefined &&
			blockDef.bottomColor !== undefined
		) {
			// Erstelle separate Materialien für jede Seite des Blocks
			// Die Reihenfolge ist wichtig: [rechts, links, oben, unten, vorne, hinten]
			const rightMaterial = new THREE.MeshStandardMaterial({
				map: createSideTexture(blockDef.sideColor),
			});
			const leftMaterial = new THREE.MeshStandardMaterial({
				map: createSideTexture(blockDef.sideColor),
			});
			const topMaterial = new THREE.MeshStandardMaterial({
				map: createTopTexture(blockDef.topColor),
			});
			const bottomMaterial = new THREE.MeshStandardMaterial({
				map: createBottomTexture(blockDef.bottomColor),
			});
			const frontMaterial = new THREE.MeshStandardMaterial({
				map: createSideTexture(blockDef.sideColor),
			});
			const backMaterial = new THREE.MeshStandardMaterial({
				map: createSideTexture(blockDef.sideColor),
			});

			// Setze die Materialien in der richtigen Reihenfolge
			voxelMaterial = [
				rightMaterial, // rechts (+x)
				leftMaterial, // links (-x)
				topMaterial, // oben (+y)
				bottomMaterial, // unten (-y)
				frontMaterial, // vorne (+z)
				backMaterial, // hinten (-z)
			];

			// Füge Leuchteffekte hinzu, falls definiert
			if (blockDef.emissive) {
				voxelMaterial.forEach((material) => {
					material.emissive = new THREE.Color(blockDef.emissive);
					material.emissiveIntensity = 0.9;
				});
			}

			// Füge Transparenz hinzu, falls definiert
			if (blockDef.opacity !== undefined && blockDef.opacity < 1) {
				voxelMaterial.forEach((material) => {
					material.transparent = true;
					material.opacity = blockDef.opacity || 1;
				});
			}
		} else {
			// Fallback für Blöcke ohne definierte Seitenfarben
			const materialProperties: THREE.MeshStandardMaterialParameters = {
				color: new THREE.Color(blockDef.color || 0xffffff),
				transparent: blockDef.opacity !== undefined && blockDef.opacity < 1,
				opacity: blockDef.opacity !== undefined ? blockDef.opacity : 1,
			};
			// Füge Leuchteffekte hinzu, falls definiert
			if (blockDef.emissive) {
				materialProperties.emissive = new THREE.Color(blockDef.emissive);
				materialProperties.emissiveIntensity = 0.9;
			}
			voxelMaterial = new THREE.MeshStandardMaterial(materialProperties);
		}

		// Erstelle das Mesh und positioniere es
		const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMaterial);
		voxelMesh.position.set(
			x * this.voxelSize + this.voxelSize / 2, // Zentriere den Block an der X-Position
			y * this.voxelSize + this.voxelSize / 2, // Zentriere den Block an der Y-Position
			z * this.voxelSize + this.voxelSize / 2 // Zentriere den Block an der Z-Position
		);
		voxelMesh.castShadow = true;
		voxelMesh.receiveShadow = true;
		// Speichere Metadaten im userData-Objekt
		voxelMesh.userData = { x, y, z, type, isSpawnPoint: false };

		// Wenn es ein Zielblock ist, füge ihn zur Zielliste hinzu
		if (blockDef.isGoal) {
			console.log(`Zielblock hinzugefügt an Position (${x}, ${y}, ${z})`);
			this.goalBlocks.push({ x, y, z });
			// Aktualisiere die Zielanzeige
			this.updateGoalDisplayCallback();
		}

		// Füge das Mesh zur Szene hinzu und speichere es in der Voxel-Map
		this.scene.add(voxelMesh);
		this.voxels.set(key, voxelMesh);
	}

	/**
	 * Entfernt einen Voxel-Block an der angegebenen Position
	 *
	 * @param x - X-Koordinate des Voxels
	 * @param y - Y-Koordinate des Voxels
	 * @param z - Z-Koordinate des Voxels
	 * @param forceRemove - Wenn true, werden auch Spawn-Blöcke entfernt, die normalerweise geschützt sind
	 */
	removeVoxel(x: number, y: number, z: number, forceRemove: boolean = false): void {
		// Erstelle einen eindeutigen Schlüssel für den Voxel
		const key = getVoxelKey(x, y, z);
		if (this.voxels.has(key)) {
			const voxelMesh = this.voxels.get(key);
			if (!voxelMesh) return;

			// Prüfe, ob es sich um einen Spawn-Block handelt
			// Spawn-Blöcke sind normalerweise geschützt, um versehentliches Entfernen zu verhindern
			if (voxelMesh.userData.isSpawnPoint && !forceRemove) {
				// Wenn der Spawn-Block durch einen Rechtsklick entfernt werden soll, verhindern wir das
				if (voxelMesh.userData.type === 'spawn') {
					console.log(
						'Spawn-Block kann nicht direkt entfernt werden. Setze einen neuen Spawn-Block, um diesen zu ersetzen.'
					);
					return;
				} else {
					console.log('Spawn-Punkt kann nicht entfernt werden.');
					return;
				}
			}

			// Wenn es ein Zielblock ist, entferne ihn aus der Zielliste
			const blockDef = BLOCK_TYPES[voxelMesh.userData.type];
			if (blockDef && blockDef.isGoal) {
				const pos = { x, y, z };
				// Entferne aus der goalBlocks-Liste
				this.goalBlocks = this.goalBlocks.filter(
					(goal) => !(goal.x === pos.x && goal.y === pos.y && goal.z === pos.z)
				);
				// Entferne auch aus der reachedGoals-Liste, falls vorhanden
				this.reachedGoals = this.reachedGoals.filter(
					(goal) => !(goal.x === pos.x && goal.y === pos.y && goal.z === pos.z)
				);
				console.log(`Zielblock entfernt an Position (${x}, ${y}, ${z})`);
				// Aktualisiere die Zielanzeige
				this.updateGoalDisplayCallback();
			}

			// Entferne den Block aus der Szene und bereinige Ressourcen
			this.scene.remove(voxelMesh);

			// Bereinige die Materialien, um Speicherlecks zu vermeiden
			if (Array.isArray(voxelMesh.material)) {
				// Bei mehreren Materialien (z.B. Gras-Block) jeden einzeln bereinigen
				voxelMesh.material.forEach((m: THREE.Material) => {
					if ((m as THREE.MeshStandardMaterial).map)
						(m as THREE.MeshStandardMaterial).map?.dispose();
					m.dispose();
				});
			} else {
				// Bei einem einzelnen Material
				const mat = voxelMesh.material as THREE.MeshStandardMaterial;
				if (mat.map) mat.map.dispose();
				mat.dispose();
			}

			// Bereinige die Geometrie
			voxelMesh.geometry.dispose();

			// Entferne den Voxel aus der Map
			this.voxels.delete(key);
		}
	}

	/**
	 * Entfernt alle Blöcke eines bestimmten Typs aus der Welt
	 *
	 * @param types - Array mit Blocktypen, die entfernt werden sollen (z.B. ['fragile', 'ice'])
	 */
	removeBlocksByType(types: string[]): void {
		// Sammle zuerst alle zu entfernenden Blöcke
		const blocksToRemove: { x: number; y: number; z: number }[] = [];

		// Durchlaufe alle Voxel und prüfe, ob ihr Typ entfernt werden soll
		this.voxels.forEach((voxelMesh, key) => {
			if (types.includes(voxelMesh.userData.type)) {
				blocksToRemove.push({
					x: voxelMesh.userData.x,
					y: voxelMesh.userData.y,
					z: voxelMesh.userData.z,
				});
			}
		});

		// Entferne alle identifizierten Blöcke
		console.log(`Entferne ${blocksToRemove.length} Blöcke vom Typ: ${types.join(', ')}`);
		blocksToRemove.forEach((block) => {
			this.removeVoxel(block.x, block.y, block.z);
		});
	}

	/**
	 * Getter und Setter für Zielblöcke und erreichte Ziele
	 */

	/**
	 * Gibt die Liste aller Zielblöcke zurück
	 *
	 * @returns Array mit den Koordinaten aller Zielblöcke
	 */
	getGoalBlocks(): { x: number; y: number; z: number }[] {
		return this.goalBlocks;
	}

	/**
	 * Gibt die Liste aller erreichten Zielblöcke zurück
	 *
	 * @returns Array mit den Koordinaten aller erreichten Zielblöcke
	 */
	getReachedGoals(): { x: number; y: number; z: number }[] {
		return this.reachedGoals;
	}

	/**
	 * Setzt die Liste der erreichten Zielblöcke und aktualisiert die Zielanzeige
	 *
	 * @param goals - Array mit den Koordinaten der erreichten Zielblöcke
	 */
	setReachedGoals(goals: { x: number; y: number; z: number }[]): void {
		this.reachedGoals = goals;
		this.updateGoalDisplayCallback();
	}

	/**
	 * Fügt einen erreichten Zielblock zur Liste hinzu und aktualisiert die Zielanzeige
	 *
	 * @param goal - Koordinaten des erreichten Zielblocks
	 */
	addReachedGoal(goal: { x: number; y: number; z: number }): void {
		this.reachedGoals.push(goal);
		this.updateGoalDisplayCallback();
	}

	/**
	 * Überprüft, ob ein bestimmter Zielblock bereits erreicht wurde
	 *
	 * @param x - X-Koordinate des zu prüfenden Zielblocks
	 * @param y - Y-Koordinate des zu prüfenden Zielblocks
	 * @param z - Z-Koordinate des zu prüfenden Zielblocks
	 * @returns true, wenn der Zielblock bereits erreicht wurde, sonst false
	 */
	isGoalReached(x: number, y: number, z: number): boolean {
		return this.reachedGoals.some((goal) => goal.x === x && goal.y === y && goal.z === z);
	}

	/**
	 * Überprüft, ob alle Zielblöcke im Spiel erreicht wurden
	 *
	 * @returns true, wenn alle Zielblöcke erreicht wurden, sonst false.
	 *          Gibt false zurück, wenn keine Zielblöcke vorhanden sind.
	 */
	areAllGoalsReached(): boolean {
		// Wenn keine Zielblöcke vorhanden sind, gib false zurück
		if (this.goalBlocks.length === 0) return false;

		// Überprüfe, ob die Anzahl der erreichten Ziele gleich der Anzahl aller Ziele ist
		return this.reachedGoals.length === this.goalBlocks.length;
	}

	/**
	 * Gibt alle Blöcke in einem serialisierbaren Format zurück
	 *
	 * @returns Array mit allen Blöcken in einem serialisierbaren Format
	 */
	getSerializableBlocks(): {
		x: number;
		y: number;
		z: number;
		type: string;
		isSpawnPoint: boolean;
		isGoal: boolean;
	}[] {
		const blocks: {
			x: number;
			y: number;
			z: number;
			type: string;
			isSpawnPoint: boolean;
			isGoal: boolean;
		}[] = [];

		// Gib die Größe der voxels-Map aus
		console.log('Anzahl der Blöcke in voxels Map:', this.voxels.size);

		// Iteriere über alle Blöcke in der voxels-Map
		this.voxels.forEach((mesh, key) => {
			if (mesh && mesh.userData) {
				const block = {
					x: mesh.userData.x,
					y: mesh.userData.y,
					z: mesh.userData.z,
					type: mesh.userData.type,
					isSpawnPoint: mesh.userData.isSpawnPoint || false,
					isGoal: mesh.userData.type === 'goal',
				};

				// Überprüfe, ob alle erforderlichen Felder vorhanden sind
				if (
					typeof block.x === 'number' &&
					typeof block.y === 'number' &&
					typeof block.z === 'number' &&
					block.type
				) {
					blocks.push(block);
				} else {
					console.warn('Ungültiger Block gefunden:', mesh.userData);
				}
			}
		});

		console.log('Anzahl der serialisierbaren Blöcke:', blocks.length);
		if (blocks.length > 0) {
			console.log('Erster serialisierbarer Block:', blocks[0]);
		}

		return blocks;
	}

	/**
	 * Entfernt alle Blöcke aus der Welt, mit Ausnahme von geschützten Blöcken
	 *
	 * @param preserveSpawnPoints - Wenn true, werden Spawn-Punkte nicht entfernt (Standard: true)
	 */
	removeAllBlocks(preserveSpawnPoints: boolean = true): void {
		console.log(
			`Entferne alle Blöcke (Spawn-Punkte ${preserveSpawnPoints ? 'werden beibehalten' : 'werden auch entfernt'})`
		);

		// Sammle zuerst alle zu entfernenden Blöcke
		const blocksToRemove: { x: number; y: number; z: number }[] = [];

		// Durchlaufe alle Voxel
		this.voxels.forEach((voxelMesh, key) => {
			// Wenn preserveSpawnPoints true ist, überspringe Spawn-Blöcke
			if (preserveSpawnPoints && voxelMesh.userData.isSpawnPoint) {
				return;
			}

			blocksToRemove.push({
				x: voxelMesh.userData.x,
				y: voxelMesh.userData.y,
				z: voxelMesh.userData.z,
			});
		});

		// Entferne alle identifizierten Blöcke
		console.log(`Entferne ${blocksToRemove.length} Blöcke`);
		blocksToRemove.forEach((block) => {
			this.removeVoxel(block.x, block.y, block.z, !preserveSpawnPoints); // Wenn preserveSpawnPoints false ist, setze forceRemove auf true
		});

		// Setze die Ziellisten zurück, wenn alle Blöcke entfernt werden
		if (!preserveSpawnPoints) {
			this.goalBlocks = [];
			this.reachedGoals = [];
			this.updateGoalDisplayCallback();
		}
	}
}

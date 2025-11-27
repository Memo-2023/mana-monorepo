/**
 * PlayerController.ts
 *
 * Diese Klasse ist verantwortlich für die Verwaltung der Spielerphysik, Bewegung und Kollisionserkennung.
 * Sie kapselt die gesamte Spielerlogik und macht den GameCanvas-Code übersichtlicher.
 */

import * as THREE from 'three';
import { BlockManager } from './BlockTypes';
import type { BlockType } from './BlockTypes';

export interface PlayerConfig {
	height: number;
	radius: number;
	speed: number;
	jumpVelocity: number;
	gravity: number;
}

export interface PlayerPosition {
	x: number;
	y: number;
	z: number;
}

export class PlayerController {
	// Spieler-Eigenschaften
	private height: number;
	private radius: number;
	private speed: number;
	private jumpVelocity: number;
	private gravity: number;

	// Spieler-Zustand
	private cameraObject: THREE.PerspectiveCamera;
	private blockManager: BlockManager;
	private voxelSize: number;
	private keyboardState: { [key: string]: boolean } = {};
	private input: THREE.Vector3 = new THREE.Vector3();
	private velocity: THREE.Vector3 = new THREE.Vector3();
	private onGround: boolean = false;
	private simulatedJump: boolean = false;
	private isDying: boolean = false;
	private deathTimer: number = 0;
	private hasMovedSinceSpawn: boolean = false; // Flag, um zu verfolgen, ob der Spieler sich seit dem Spawn bewegt hat
	private fragileTouchedBlocks: Map<string, { x: number; y: number; z: number; timer: number }> =
		new Map();

	// Callback-Funktionen
	private onRespawn: (isInitialSpawn: boolean) => void;
	private onGoalReached: (position: PlayerPosition) => void;
	private onFirstMovement?: () => void; // Neue Callback-Funktion für die erste Bewegung (optional)

	/**
	 * Konstruktor für den PlayerController
	 *
	 * @param config - Konfiguration für den Spieler (Höhe, Radius, Geschwindigkeit, etc.)
	 * @param camera - Die Kamera, die als Spielerobjekt dient
	 * @param blockManager - Der BlockManager für Kollisionsabfragen
	 * @param voxelSize - Die Größe eines Voxels in der Welt
	 * @param keyboardState - Der aktuelle Zustand der Tastatur
	 * @param onRespawn - Callback-Funktion, die beim Respawn aufgerufen wird
	 * @param onGoalReached - Callback-Funktion, die beim Erreichen eines Ziels aufgerufen wird
	 */
	constructor(
		config: PlayerConfig,
		camera: THREE.PerspectiveCamera,
		blockManager: BlockManager,
		voxelSize: number,
		keyboardState: { [key: string]: boolean },
		onRespawn: (isInitialSpawn?: boolean) => void,
		onGoalReached: (position: PlayerPosition) => void,
		onFirstMovement?: () => void // Neuer optionaler Parameter für die erste Bewegung
	) {
		this.height = config.height;
		this.radius = config.radius;
		this.speed = config.speed;
		this.jumpVelocity = config.jumpVelocity;
		this.gravity = config.gravity;

		this.velocity = new THREE.Vector3();
		this.input = new THREE.Vector3();
		this.onGround = false;
		this.cameraObject = camera;

		this.blockManager = blockManager;
		this.voxelSize = voxelSize;
		this.keyboardState = keyboardState;

		this.onRespawn = onRespawn;
		this.onGoalReached = onGoalReached;
		this.onFirstMovement = onFirstMovement; // Speichere den neuen Callback
	}

	/**
	 * Aktualisiert den Spieler für den aktuellen Frame
	 *
	 * @param deltaTime - Die Zeit seit dem letzten Frame in Sekunden
	 * @param isLocked - Ob die Maussteuerung aktiv ist
	 * @param gameWon - Ob das Spiel gewonnen wurde
	 */
	public update(deltaTime: number, isLocked: boolean, gameWon: boolean): void {
		if (gameWon) return;

		// Wenn der Spieler stirbt (in Lava versinkt)
		if (this.isDying) {
			this.deathTimer += deltaTime;

			// Schnell in die Lava sinken, direkt auf den Boden
			// Beschleunigung des Sinkens mit der Zeit
			const sinkSpeed = 2.0 * (1 + this.deathTimer * 2.0); // Schnellere Beschleunigung

			// Berechne die aktuelle Y-Position des Blocks, in dem der Spieler sich befindet
			const playerBlockY = Math.floor(this.cameraObject.position.y / this.voxelSize);

			// Berechne die Position des Bodens des Lava-Blocks
			const floorY = playerBlockY * this.voxelSize;

			// Sinke zum Boden des Blocks
			const newY = this.cameraObject.position.y - sinkSpeed * deltaTime;
			this.cameraObject.position.y = Math.max(newY, floorY);

			// Nach einer bestimmten Zeit respawnen (Respawn-Funktion kümmert sich um den Rest)
			if (this.deathTimer >= 0.4) {
				// Sehr kurze Zeit zum Respawnen (400ms)
				this.isDying = false;
				this.deathTimer = 0;
				this.onRespawn(false); // Rufe den Respawn-Callback auf
				return;
			}

			// Während des Sterbens keine weitere Bewegung
			return;
		}

		this.handleKeyboardInput();

		// Simulierten Sprung verarbeiten
		if (this.simulatedJump) {
			this.simulateJump();
			this.simulatedJump = false;
		}

		// Schwerkraft anwenden
		this.velocity.y -= this.gravity * deltaTime;

		// Bewegung anwenden
		this.applyMovement(deltaTime);

		// Zerbrechliche Blöcke aktualisieren
		this.updateFragileBlocks(deltaTime);

		const playerWorldPos = this.cameraObject.position;
		let newPos = playerWorldPos.clone().add(this.velocity.clone().multiplyScalar(deltaTime));

		// Verfolge, welche zerbrechlichen Blöcke wir in diesem Frame berühren
		const touchedBlocksInThisFrame = new Set<string>();

		this.handleVerticalCollisions(newPos, playerWorldPos, touchedBlocksInThisFrame);
		this.handleHorizontalCollisions(newPos, playerWorldPos);

		// Aktualisiere die Liste der berührten Blöcke
		this.updateTouchedBlocks(touchedBlocksInThisFrame);

		// Aktualisiere die zerbrechlichen Blöcke
		this.updateFragileBlocks(deltaTime);
	}

	/**
	 * Verarbeitet die Tastatureingaben und setzt den Eingabevektor
	 */
	private handleKeyboardInput(): void {
		this.input.set(0, 0, 0);
		if (this.keyboardState['KeyW'] || this.keyboardState['ArrowUp']) this.input.z = -1; // Vorwärts
		if (this.keyboardState['KeyS'] || this.keyboardState['ArrowDown']) this.input.z = 1; // Rückwärts
		if (this.keyboardState['KeyA'] || this.keyboardState['ArrowLeft']) this.input.x = -1; // Links
		if (this.keyboardState['KeyD'] || this.keyboardState['ArrowRight']) this.input.x = 1; // Rechts

		// Prüfe, ob der Spieler sich zum ersten Mal bewegt
		if (!this.hasMovedSinceSpawn && (this.input.x !== 0 || this.input.z !== 0)) {
			this.hasMovedSinceSpawn = true;

			// Rufe den onFirstMovement-Callback auf, wenn er definiert ist
			if (this.onFirstMovement) {
				console.log('Erste Spielerbewegung erkannt, starte Timer...');
				this.onFirstMovement();
			}
		}
	}

	/**
	 * Wendet die Bewegung basierend auf dem Eingabevektor an
	 *
	 * @param deltaTime - Die Zeit seit dem letzten Frame in Sekunden
	 */
	private applyMovement(deltaTime: number): void {
		const forward = new THREE.Vector3();
		this.cameraObject.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();

		const right = new THREE.Vector3();
		right.crossVectors(this.cameraObject.up, forward).normalize();

		// Ermittle den Block unter dem Spieler für die Reibung
		const blockBelow = this.blockManager.getVoxelBlockType(
			Math.floor(this.cameraObject.position.x / this.voxelSize),
			Math.floor((this.cameraObject.position.y - this.height / 2 - 0.01) / this.voxelSize),
			Math.floor(this.cameraObject.position.z / this.voxelSize)
		);

		// Standardreibung für Gras verwenden, wenn kein Block gefunden wurde
		const friction = blockBelow ? blockBelow.frictionFactor : 0.7;
		const isIceBlock = blockBelow && blockBelow.frictionFactor > 0.9; // Erkennen von Eis-Blöcken

		// Wenn der Spieler auf Eis steht, behalte die Geschwindigkeit bei und wende nur leichte Reibung an
		if (this.onGround && isIceBlock) {
			// Wenn der Spieler aktiv Eingaben macht, setze die Zielgeschwindigkeit
			if (this.input.z !== 0 || this.input.x !== 0) {
				let targetVelocityX = 0;
				let targetVelocityZ = 0;

				// Vorwärts/Rückwärts Bewegung
				if (this.input.z !== 0) {
					targetVelocityX -= forward.x * this.input.z * this.speed;
					targetVelocityZ -= forward.z * this.input.z * this.speed;
				}

				// Seitwärts Bewegung (Strafe)
				if (this.input.x !== 0) {
					targetVelocityX -= right.x * this.input.x * this.speed;
					targetVelocityZ -= right.z * this.input.x * this.speed;
				}

				// Mische aktuelle Geschwindigkeit mit Zielgeschwindigkeit für Rutscheffekt
				this.velocity.x = this.velocity.x * 0.8 + targetVelocityX * 0.2;
				this.velocity.z = this.velocity.z * 0.8 + targetVelocityZ * 0.2;
			} else {
				// Wenn keine Eingabe, wende nur sehr geringe Reibung an (Gleiten)
				this.velocity.x *= 0.99;
				this.velocity.z *= 0.99;
			}
		} else {
			// Normales Verhalten für andere Blöcke
			let targetVelocityX = 0;
			let targetVelocityZ = 0;

			// Vorwärts/Rückwärts Bewegung
			if (this.input.z !== 0) {
				targetVelocityX -= forward.x * this.input.z * this.speed;
				targetVelocityZ -= forward.z * this.input.z * this.speed;
			}

			// Seitwärts Bewegung (Strafe)
			if (this.input.x !== 0) {
				targetVelocityX -= right.x * this.input.x * this.speed;
				targetVelocityZ -= right.z * this.input.x * this.speed;
			}

			this.velocity.x = targetVelocityX;
			this.velocity.z = targetVelocityZ;

			// Reibung anwenden, wenn der Spieler auf dem Boden steht und sich nicht bewegt
			if (this.onGround && this.input.x === 0 && this.input.z === 0) {
				this.velocity.x *= 1 - (1 - friction) * 15 * deltaTime;
				this.velocity.z *= 1 - (1 - friction) * 15 * deltaTime;
			}
		}

		// Kleine Werte auf 0 setzen, um Zittern zu vermeiden
		if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
		if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

		// Schwerkraft anwenden
		this.velocity.y -= this.gravity * deltaTime;

		// Springen
		if ((this.keyboardState['Space'] || this.simulatedJump) && this.onGround) {
			this.velocity.y = this.jumpVelocity;
			this.onGround = false;
			if (this.simulatedJump) this.simulatedJump = false;
		}
	}

	/**
	 * Prüft auf Kollisionen mit einem Voxel
	 *
	 * @param playerBox - Die Bounding Box des Spielers
	 * @param voxelX - X-Koordinate des Voxels
	 * @param voxelY - Y-Koordinate des Voxels
	 * @param voxelZ - Z-Koordinate des Voxels
	 * @returns Der Blocktyp, wenn eine Kollision vorliegt, sonst null
	 */
	private checkCollisionWithVoxel(
		playerBox: THREE.Box3,
		voxelX: number,
		voxelY: number,
		voxelZ: number
	): BlockType | null {
		const blockType = this.blockManager.getVoxelBlockType(voxelX, voxelY, voxelZ);
		if (blockType && blockType.solid) {
			const voxelBox = new THREE.Box3(
				new THREE.Vector3(
					voxelX * this.voxelSize,
					voxelY * this.voxelSize,
					voxelZ * this.voxelSize
				),
				new THREE.Vector3(
					(voxelX + 1) * this.voxelSize,
					(voxelY + 1) * this.voxelSize,
					(voxelZ + 1) * this.voxelSize
				)
			);
			if (playerBox.intersectsBox(voxelBox)) {
				return blockType;
			}
		}
		return null;
	}

	/**
	 * Behandelt vertikale Kollisionen (Boden und Decke)
	 *
	 * @param newPos - Die neue Position des Spielers
	 * @param playerWorldPos - Die aktuelle Position des Spielers
	 * @param touchedBlocksInThisFrame - Set mit Schlüsseln der Blöcke, die in diesem Frame berührt wurden
	 * @returns true, wenn eine Kollision stattgefunden hat
	 */
	private handleVerticalCollisions(
		newPos: THREE.Vector3,
		playerWorldPos: THREE.Vector3,
		touchedBlocksInThisFrame: Set<string>
	): boolean {
		this.onGround = false;
		const playerFeetY = newPos.y - this.height / 2;
		const playerHeadY = newPos.y + this.height / 2;

		const checkMinX = Math.floor((newPos.x - this.radius) / this.voxelSize);
		const checkMaxX = Math.floor((newPos.x + this.radius) / this.voxelSize);
		const checkMinZ = Math.floor((newPos.z - this.radius) / this.voxelSize);
		const checkMaxZ = Math.floor((newPos.z + this.radius) / this.voxelSize);

		// Kollision mit dem Boden prüfen
		if (this.velocity.y <= 0) {
			const groundCheckY = Math.floor(playerFeetY / this.voxelSize);
			for (let x = checkMinX; x <= checkMaxX; x++) {
				for (let z = checkMinZ; z <= checkMaxZ; z++) {
					const blockAtFeet = this.blockManager.getVoxelBlockType(x, groundCheckY, z);
					if (blockAtFeet) {
						if (blockAtFeet.isDeadly) {
							// Starte den Sterbevorgang (in Lava versinken)
							if (!this.isDying) {
								this.isDying = true;
								this.deathTimer = 0;
								this.velocity.set(0, 0, 0); // Stoppe alle Bewegungen
							}
							return true;
						}

						if (blockAtFeet.isGoal) {
							// Rufe den Callback auf, aber erlaube dem Spieler, auf dem Ziel-Block zu stehen
							this.onGoalReached({ x, y: groundCheckY, z });

							// Setze die Spielerposition auf die Oberkante des Blocks
							playerWorldPos.y = (groundCheckY + 1) * this.voxelSize + this.height / 2;
							this.velocity.y = 0;
							this.onGround = true;
							return true;
						}

						if (blockAtFeet.solid) {
							// Prüfe, ob wir auf einem zerbrechlichen Block stehen
							if (blockAtFeet.isFragile) {
								// Erzeuge einen eindeutigen Schlüssel für diesen Block
								const blockKey = `${x}_${groundCheckY}_${z}`;
								touchedBlocksInThisFrame.add(blockKey);

								// Wenn wir diesen Block noch nicht verfolgen, füge ihn hinzu
								if (!this.fragileTouchedBlocks.has(blockKey)) {
									this.fragileTouchedBlocks.set(blockKey, {
										x,
										y: groundCheckY,
										z,
										timer: blockAtFeet.breakTimer || 1.0,
									});
								}
							}

							// Prüfe, ob wir auf einem Trampolinblock stehen
							if (blockAtFeet.isTrampoline) {
								// Setze die Spielerposition auf die Oberkante des Blocks
								playerWorldPos.y = (groundCheckY + 1) * this.voxelSize + this.height / 2;
								// Gib dem Spieler einen kräftigen Impuls nach oben
								const trampolineForce = blockAtFeet.trampolineForce || 20.0;
								this.velocity.y = trampolineForce;
								this.onGround = false;
								return true;
							}

							playerWorldPos.y = (groundCheckY + 1) * this.voxelSize + this.height / 2;
							this.velocity.y = 0;
							this.onGround = true;
							return true;
						}
					}
				}
			}
		}

		// Kollision mit der Decke prüfen
		if (this.velocity.y > 0) {
			const headCheckY = Math.floor(playerHeadY / this.voxelSize);
			for (let x = checkMinX; x <= checkMaxX; x++) {
				for (let z = checkMinZ; z <= checkMaxZ; z++) {
					const blockAtHead = this.blockManager.getVoxelBlockType(x, headCheckY, z);
					if (blockAtHead && blockAtHead.solid) {
						playerWorldPos.y = headCheckY * this.voxelSize - this.height / 2 - 0.01;
						this.velocity.y = 0;
						return true;
					}
				}
			}
		}

		playerWorldPos.y = newPos.y;
		return false;
	}

	/**
	 * Behandelt horizontale Kollisionen (Wände)
	 *
	 * @param newPos - Die neue Position des Spielers
	 * @param playerWorldPos - Die aktuelle Position des Spielers
	 */
	private handleHorizontalCollisions(newPos: THREE.Vector3, playerWorldPos: THREE.Vector3): void {
		const R = this.radius;
		const H_half = this.height / 2;

		// X-Achsen-Kollision
		let proposedXPos = newPos.x;
		const playerBoxX = new THREE.Box3(
			new THREE.Vector3(proposedXPos - R, playerWorldPos.y - H_half, playerWorldPos.z - R),
			new THREE.Vector3(proposedXPos + R, playerWorldPos.y + H_half, playerWorldPos.z + R)
		);

		const minX_col = Math.floor(playerBoxX.min.x / this.voxelSize);
		const maxX_col = Math.floor(playerBoxX.max.x / this.voxelSize);
		const minY_col = Math.floor(playerBoxX.min.y / this.voxelSize);
		const maxY_col = Math.floor(playerBoxX.max.y / this.voxelSize);
		const minZ_col = Math.floor(playerBoxX.min.z / this.voxelSize);
		const maxZ_col = Math.floor(playerBoxX.max.z / this.voxelSize);

		let collisionX = false;
		for (let ix = minX_col; ix <= maxX_col; ix++) {
			for (let iy = minY_col; iy <= maxY_col; iy++) {
				for (let iz = minZ_col; iz <= maxZ_col; iz++) {
					const blockType = this.checkCollisionWithVoxel(playerBoxX, ix, iy, iz);
					if (blockType) {
						if (blockType.isDeadly) {
							this.onRespawn(false);
							return;
						}

						if (blockType.isGoal) {
							this.onGoalReached({ x: ix, y: iy, z: iz });
							return;
						}

						collisionX = true;
						this.velocity.x = 0;
						break;
					}
				}
				if (collisionX) break;
			}
			if (collisionX) break;
		}

		if (!collisionX) {
			playerWorldPos.x = proposedXPos;
		}

		// Z-Achsen-Kollision
		let proposedZPos = newPos.z;
		const playerBoxZ = new THREE.Box3(
			new THREE.Vector3(playerWorldPos.x - R, playerWorldPos.y - H_half, proposedZPos - R),
			new THREE.Vector3(playerWorldPos.x + R, playerWorldPos.y + H_half, proposedZPos + R)
		);

		const minX_colZ = Math.floor(playerBoxZ.min.x / this.voxelSize);
		const maxX_colZ = Math.floor(playerBoxZ.max.x / this.voxelSize);
		const minY_colZ = Math.floor(playerBoxZ.min.y / this.voxelSize);
		const maxY_colZ = Math.floor(playerBoxZ.max.y / this.voxelSize);
		const minZ_colZ = Math.floor(playerBoxZ.min.z / this.voxelSize);
		const maxZ_colZ = Math.floor(playerBoxZ.max.z / this.voxelSize);

		let collisionZ = false;
		for (let ix = minX_colZ; ix <= maxX_colZ; ix++) {
			for (let iy = minY_colZ; iy <= maxY_colZ; iy++) {
				for (let iz = minZ_colZ; iz <= maxZ_colZ; iz++) {
					const blockType = this.checkCollisionWithVoxel(playerBoxZ, ix, iy, iz);
					if (blockType) {
						if (blockType.isDeadly) {
							this.onRespawn(false);
							return;
						}

						if (blockType.isGoal) {
							this.onGoalReached({ x: ix, y: iy, z: iz });
							return;
						}

						collisionZ = true;
						this.velocity.z = 0;
						break;
					}
				}
				if (collisionZ) break;
			}
			if (collisionZ) break;
		}

		if (!collisionZ) {
			playerWorldPos.z = proposedZPos;
		}
	}

	/**
	 * Aktualisiert die Timer für zerbrechliche Blöcke und zerstört sie, wenn der Timer abläuft
	 * oder wenn der Spieler den Block verlassen hat
	 *
	 * @param deltaTime - Die Zeit seit dem letzten Frame in Sekunden
	 */
	private updateFragileBlocks(deltaTime: number): void {
		// Iteriere über alle verfolgten zerbrechlichen Blöcke
		for (const [blockKey, blockInfo] of this.fragileTouchedBlocks.entries()) {
			// Reduziere den Timer
			blockInfo.timer -= deltaTime;

			// Wenn der Timer abgelaufen ist, zerstöre den Block
			if (blockInfo.timer <= 0) {
				// Entferne den Block aus der Welt
				this.blockManager.removeVoxel(blockInfo.x, blockInfo.y, blockInfo.z, true);

				// Entferne den Block aus der Map
				this.fragileTouchedBlocks.delete(blockKey);
			}
		}
	}

	/**
	 * Aktualisiert die Liste der berührten zerbrechlichen Blöcke
	 * Blöcke, die nicht mehr berührt werden, werden markiert, um später zerstört zu werden
	 *
	 * @param touchedBlocksInThisFrame - Set mit Schlüsseln der Blöcke, die in diesem Frame berührt wurden
	 */
	private updateTouchedBlocks(touchedBlocksInThisFrame: Set<string>): void {
		// Finde Blöcke, die nicht mehr berührt werden
		for (const [blockKey, blockInfo] of this.fragileTouchedBlocks.entries()) {
			if (!touchedBlocksInThisFrame.has(blockKey)) {
				// Setze den Timer auf 0, damit der Block im nächsten Frame zerstört wird
				blockInfo.timer = 0;
			}
		}
	}

	/**
	 * Gibt die aktuelle Geschwindigkeit des Spielers zurück
	 */
	public getVelocity(): THREE.Vector3 {
		return this.velocity.clone();
	}

	/**
	 * Gibt die aktuelle Position des Spielers zurück
	 */
	public getPosition(): THREE.Vector3 {
		return this.cameraObject.position.clone();
	}

	/**
	 * Setzt die Position des Spielers
	 *
	 * @param position - Die neue Position des Spielers
	 */
	public setPosition(position: PlayerPosition): void {
		this.cameraObject.position.set(position.x, position.y, position.z);

		// Setze das Flag zurück, damit der Timer erst wieder startet, wenn der Spieler sich bewegt
		this.hasMovedSinceSpawn = false;
	}

	/**
	 * Setzt die Geschwindigkeit des Spielers
	 *
	 * @param velocity - Die neue Geschwindigkeit des Spielers
	 */
	public setVelocity(velocity: THREE.Vector3): void {
		this.velocity.copy(velocity);
	}

	/**
	 * Simuliert einen Sprung des Spielers
	 */
	public simulateJump(): void {
		this.simulatedJump = true;
	}
}

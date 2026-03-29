import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './camera';
import { InputManager } from './input';
import { TilemapRenderer } from './tilemap';
import { Player } from './player';
import { ParticleSystem } from './particles';
import { AreaManager, generateDemoStreet, generateDemoInterior } from './area-manager';
import { UndoStack, brushStroke, floodFill, pipette, type ToolType } from '$lib/editor/tools';
import { DEFAULT_MATERIALS, MATERIAL_AIR, type Material } from '@manavoxel/shared';
import type { Inventory } from './inventory';

export class GameEngine {
	app: Application;
	camera: Camera;
	input: InputManager;
	tilemap!: TilemapRenderer;
	player: Player | null = null;
	undo: UndoStack;
	areaManager: AreaManager;
	particles: ParticleSystem;
	inventory: Inventory | null = null;

	private _container: HTMLDivElement;
	private _worldContainer: Container;
	private _fadeOverlay: Graphics;
	private _initialized = false;
	private _useItemCooldown = 0;

	// Editor state
	private _editing = false;
	private _selectedMaterial = 1;
	private _activeTool: ToolType = 'brush';
	private _brushSize = 1;
	private _palette: Material[] = DEFAULT_MATERIALS;
	private _painting = false;

	// Area state
	private _currentFloor = 0;
	private _areaName = '';

	// Callbacks for UI reactivity
	onStateChange: (() => void) | null = null;

	get isEditing() {
		return this._editing;
	}
	get selectedMaterial() {
		return this._selectedMaterial;
	}
	get activeTool() {
		return this._activeTool;
	}
	get brushSize() {
		return this._brushSize;
	}
	get palette() {
		return this._palette;
	}
	get currentFloor() {
		return this._currentFloor;
	}
	get totalFloors() {
		return this.areaManager.currentArea?.data.floors ?? 1;
	}
	get areaName() {
		return this._areaName;
	}

	constructor(container: HTMLDivElement) {
		this._container = container;
		this.app = new Application();
		this._worldContainer = new Container();
		this._fadeOverlay = new Graphics();
		this.undo = new UndoStack();

		this.camera = new Camera(this._worldContainer);
		this.input = new InputManager(container);
		this.areaManager = new AreaManager(this._worldContainer);
		this.particles = new ParticleSystem(this._worldContainer);

		this._init();
	}

	private async _init() {
		await this.app.init({
			resizeTo: this._container,
			background: '#1a1a2e',
			antialias: false,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		});

		this._container.appendChild(this.app.canvas);
		this.app.stage.addChild(this._worldContainer);

		// Fade overlay (on top of world, for transitions)
		this._fadeOverlay.rect(0, 0, 1, 1);
		this._fadeOverlay.fill('#000000');
		this.app.stage.addChild(this._fadeOverlay);
		this._fadeOverlay.visible = false;

		// Generate demo areas
		const street = generateDemoStreet();
		const interiorId = street.portals[0]?.targetAreaId;
		const interior = generateDemoInterior(interiorId!, street.id);

		this.areaManager.registerArea(street);
		this.areaManager.registerArea(interior);

		// Area change callback
		this.areaManager.onAreaChanged = (loaded) => {
			this.tilemap = loaded.tilemap;
			this._currentFloor = loaded.currentFloor;
			this._areaName = loaded.data.name;

			// Recreate player in new area
			this.player?.destroy();
			this.player = new Player(
				this._worldContainer,
				this.tilemap,
				loaded.data.spawnPoint.x,
				loaded.data.spawnPoint.y
			);

			this.onStateChange?.();
		};

		// Load starting area
		const loaded = this.areaManager.loadArea(street.id);
		if (loaded) {
			this.tilemap = loaded.tilemap;
			this._areaName = loaded.data.name;
			this.player = new Player(
				this._worldContainer,
				this.tilemap,
				street.spawnPoint.x,
				street.spawnPoint.y
			);
			this.camera.setPosition(this.player.worldX, this.player.worldY);
		}

		// Game loop
		this.app.ticker.add((ticker) => this._update(ticker.deltaTime));

		this._initialized = true;
		this.onStateChange?.();
	}

	private _update(_dt: number) {
		if (!this._initialized) return;

		if (this._editing) {
			this._updateEditor();
		} else {
			this._updateGame();
		}

		// Zoom
		const scrollDelta = this.input.consumeScroll();
		if (scrollDelta !== 0) {
			this.camera.zoom(scrollDelta > 0 ? 0.9 : 1.1);
		}

		// Undo/Redo (Ctrl+Z / Ctrl+Y)
		if (this.input.isKeyDown('KeyZ') && this.input.isKeyDown('ControlLeft')) {
			if (this.input.isKeyDown('ShiftLeft')) {
				this.undo.redo(this.tilemap);
			} else {
				this.undo.undo(this.tilemap);
			}
		}
		if (this.input.isKeyDown('KeyY') && this.input.isKeyDown('ControlLeft')) {
			this.undo.redo(this.tilemap);
		}

		// Update particles
		this.particles.update();

		// Cooldown tick
		if (this._useItemCooldown > 0) this._useItemCooldown--;

		this.camera.update(this.app.screen.width, this.app.screen.height);
	}

	private _updateGame() {
		// Don't process input during transitions
		if (this.areaManager.isTransitioning) {
			this.areaManager.update(1);
			this._updateFadeOverlay();
			return;
		}

		// Player movement
		let dx = 0;
		let dy = 0;
		if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) dy = -1;
		if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) dy = 1;
		if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) dx = -1;
		if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) dx = 1;

		if (this.player) {
			this.player.move(dx, dy);

			// Check for portal collision
			const portal = this.areaManager.checkPortals(
				this.player.x,
				this.player.y,
				this._currentFloor
			);
			if (portal && this.input.isKeyDown('KeyE')) {
				this.areaManager.enterPortal(portal, this.player);
			}

			// Check for stairs (floor switch via E key on stair tiles)
			if (this.input.isKeyDown('KeyF') && this.totalFloors > 1) {
				const nextFloor = (this._currentFloor + 1) % this.totalFloors;
				this.areaManager.switchFloor(nextFloor);
				this._currentFloor = nextFloor;
				this.onStateChange?.();
			}

			// Use held item (Space key)
			if (this.input.isKeyDown('Space') && this._useItemCooldown <= 0 && this.inventory) {
				const heldItem = this.inventory.heldItem;
				if (heldItem && heldItem.properties.damage > 0) {
					this._useItemCooldown = 15; // ~0.25s cooldown

					// Spawn particle effect at player facing direction
					const dirOffsets = [
						{ dx: 0, dy: -20 }, // up
						{ dx: 20, dy: 0 }, // right
						{ dx: 0, dy: 20 }, // down
						{ dx: -20, dy: 0 }, // left
					];
					const off = dirOffsets[this.player.direction] ?? dirOffsets[2];
					const effectX = this.player.worldX + off.dx;
					const effectY = this.player.worldY + off.dy;

					// Spawn particles based on item properties
					const particleType = heldItem.properties.particle;
					if (particleType && particleType !== 'none') {
						this.particles.spawn(particleType, effectX, effectY);
					} else {
						this.particles.spawn('sparks', effectX, effectY);
					}

					// Pixel destruction in facing direction
					if (heldItem.properties.damage >= 20) {
						const worldTileX = Math.floor(effectX / this.tilemap.tileSize);
						const worldTileY = Math.floor(effectY / this.tilemap.tileSize);
						const radius = Math.min(3, Math.floor(heldItem.properties.damage / 30));
						for (let dy = -radius; dy <= radius; dy++) {
							for (let dxx = -radius; dxx <= radius; dxx++) {
								if (Math.abs(dxx) + Math.abs(dy) <= radius) {
									this.tilemap.setPixel(worldTileX + dxx, worldTileY + dy, MATERIAL_AIR);
								}
							}
						}
					}
				}
			}

			// Camera follows player smoothly
			const lerpSpeed = 0.1;
			const cx = this.camera.x + (this.player.worldX - this.camera.x) * lerpSpeed;
			const cy = this.camera.y + (this.player.worldY - this.camera.y) * lerpSpeed;
			this.camera.setPosition(cx, cy);
		}
	}

	private _updateFadeOverlay() {
		if (this.areaManager.isTransitioning) {
			this._fadeOverlay.visible = true;
			this._fadeOverlay.alpha = 1 - this.areaManager.transitionAlpha;
			this._fadeOverlay.clear();
			this._fadeOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
			this._fadeOverlay.fill('#000000');
		} else {
			this._fadeOverlay.visible = false;
		}
	}

	private _updateEditor() {
		// Camera pan with WASD in editor mode
		const moveSpeed = 4;
		if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp'))
			this.camera.move(0, -moveSpeed);
		if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown'))
			this.camera.move(0, moveSpeed);
		if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft'))
			this.camera.move(-moveSpeed, 0);
		if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight'))
			this.camera.move(moveSpeed, 0);

		// Get world position under cursor
		const worldPos = this.camera.screenToWorld(
			this.input.mouseX,
			this.input.mouseY,
			this.app.screen.width,
			this.app.screen.height
		);
		const tileX = Math.floor(worldPos.x / this.tilemap.tileSize);
		const tileY = Math.floor(worldPos.y / this.tilemap.tileSize);

		// Handle mouse actions
		if (this.input.isMouseDown) {
			const material =
				this.input.mouseButton === 2 || this._activeTool === 'eraser'
					? MATERIAL_AIR
					: this._selectedMaterial;

			if (!this._painting) {
				// Start a new paint stroke
				this._painting = true;
				this.undo.beginBatch();
			}

			switch (this._activeTool) {
				case 'brush':
				case 'eraser':
					brushStroke(this.tilemap, this.undo, tileX, tileY, material, this._brushSize);
					break;
				case 'fill':
					// Fill only on initial click (not drag)
					if (this.input.justPressed) {
						floodFill(this.tilemap, this.undo, tileX, tileY, material);
					}
					break;
				case 'pipette':
					if (this.input.justPressed) {
						const picked = pipette(this.tilemap, tileX, tileY);
						if (picked !== MATERIAL_AIR) {
							this._selectedMaterial = picked;
							this._activeTool = 'brush'; // Switch back to brush after pick
							this.onStateChange?.();
						}
					}
					break;
			}
		} else if (this._painting) {
			// Mouse released: commit the undo batch
			this._painting = false;
			this.undo.commitBatch();
		}
	}

	// ─── Public API for UI ──────────────────────────────────

	toggleEditor() {
		this._editing = !this._editing;
		this.onStateChange?.();
	}

	setMaterial(materialId: number) {
		this._selectedMaterial = materialId;
		this.onStateChange?.();
	}

	setTool(tool: ToolType) {
		this._activeTool = tool;
		this.onStateChange?.();
	}

	setBrushSize(size: number) {
		this._brushSize = Math.max(1, Math.min(9, size));
		this.onStateChange?.();
	}

	destroy() {
		this.player?.destroy();
		this.input.destroy();
		this.app.destroy(true);
	}
}

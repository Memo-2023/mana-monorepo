import { Application, Container } from 'pixi.js';
import { Camera } from './camera';
import { InputManager } from './input';
import { TilemapRenderer } from './tilemap';
import { Player } from './player';
import { UndoStack, brushStroke, floodFill, pipette, type ToolType } from '$lib/editor/tools';
import { DEFAULT_MATERIALS, MATERIAL_AIR, type Material } from '@manavoxel/shared';

export class GameEngine {
	app: Application;
	camera: Camera;
	input: InputManager;
	tilemap: TilemapRenderer;
	player: Player | null = null;
	undo: UndoStack;

	private _container: HTMLDivElement;
	private _worldContainer: Container;
	private _initialized = false;

	// Editor state
	private _editing = false;
	private _selectedMaterial = 1;
	private _activeTool: ToolType = 'brush';
	private _brushSize = 1;
	private _palette: Material[] = DEFAULT_MATERIALS;
	private _painting = false; // tracks whether we're in a continuous paint stroke

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

	constructor(container: HTMLDivElement) {
		this._container = container;
		this.app = new Application();
		this._worldContainer = new Container();
		this.undo = new UndoStack();

		this.camera = new Camera(this._worldContainer);
		this.input = new InputManager(container);
		this.tilemap = new TilemapRenderer(this._worldContainer, this._palette);

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

		// Generate demo world
		this.tilemap.generateFlatWorld(500, 300);

		// Spawn player in an open area
		this.player = new Player(this._worldContainer, this.tilemap, 60, 160);

		// Center camera on player
		this.camera.setPosition(this.player.worldX, this.player.worldY);

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

		this.camera.update(this.app.screen.width, this.app.screen.height);
	}

	private _updateGame() {
		// Player movement
		let dx = 0;
		let dy = 0;
		if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) dy = -1;
		if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) dy = 1;
		if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) dx = -1;
		if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) dx = 1;

		if (this.player) {
			this.player.move(dx, dy);
			// Camera follows player smoothly
			const lerpSpeed = 0.1;
			const cx = this.camera.x + (this.player.worldX - this.camera.x) * lerpSpeed;
			const cy = this.camera.y + (this.player.worldY - this.camera.y) * lerpSpeed;
			this.camera.setPosition(cx, cy);
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

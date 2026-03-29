import { Container, Graphics } from 'pixi.js';
import type { TilemapRenderer } from './tilemap';

const PLAYER_WIDTH = 6; // pixels (60cm at 10cm/pixel)
const PLAYER_HEIGHT = 8; // pixels (80cm)
const PLAYER_SPEED = 1.5; // pixels per frame
const PLAYER_COLOR = '#4FC3F7';

export class Player {
	x: number;
	y: number;
	direction = 2; // 0=up, 1=right, 2=down, 3=left
	hp = 100;
	maxHp = 100;

	private _sprite: Container;
	private _body: Graphics;
	private _dirIndicator: Graphics;
	private _tilemap: TilemapRenderer;

	get worldX() {
		return this.x * this._tilemap.tileSize;
	}
	get worldY() {
		return this.y * this._tilemap.tileSize;
	}

	constructor(worldContainer: Container, tilemap: TilemapRenderer, startX: number, startY: number) {
		this._tilemap = tilemap;
		this.x = startX;
		this.y = startY;

		this._sprite = new Container();
		worldContainer.addChild(this._sprite);

		// Body rectangle
		this._body = new Graphics();
		this._body.roundRect(
			0,
			0,
			PLAYER_WIDTH * tilemap.tileSize,
			PLAYER_HEIGHT * tilemap.tileSize,
			2
		);
		this._body.fill(PLAYER_COLOR);
		this._sprite.addChild(this._body);

		// Direction indicator (small triangle)
		this._dirIndicator = new Graphics();
		this._sprite.addChild(this._dirIndicator);

		this._updateSpritePosition();
		this._updateDirectionIndicator();
	}

	/**
	 * Move the player by input direction with collision detection.
	 * Returns true if the player actually moved.
	 */
	move(dx: number, dy: number): boolean {
		if (dx === 0 && dy === 0) return false;

		// Normalize diagonal movement
		if (dx !== 0 && dy !== 0) {
			const len = Math.sqrt(dx * dx + dy * dy);
			dx = (dx / len) * PLAYER_SPEED;
			dy = (dy / len) * PLAYER_SPEED;
		} else {
			dx *= PLAYER_SPEED;
			dy *= PLAYER_SPEED;
		}

		// Update direction
		if (Math.abs(dx) > Math.abs(dy)) {
			this.direction = dx > 0 ? 1 : 3;
		} else if (dy !== 0) {
			this.direction = dy > 0 ? 2 : 0;
		}

		// Try X movement
		const newX = this.x + dx;
		if (!this._collides(newX, this.y)) {
			this.x = newX;
		}

		// Try Y movement
		const newY = this.y + dy;
		if (!this._collides(this.x, newY)) {
			this.y = newY;
		}

		this._updateSpritePosition();
		this._updateDirectionIndicator();
		return true;
	}

	/** Check if the player hitbox collides with solid tiles at position (px, py) */
	private _collides(px: number, py: number): boolean {
		// Check corners and midpoints of the player hitbox
		const margin = 0.1; // Small margin to avoid getting stuck
		const left = px + margin;
		const right = px + PLAYER_WIDTH - margin;
		const top = py + margin;
		const bottom = py + PLAYER_HEIGHT - margin;
		const midX = px + PLAYER_WIDTH / 2;
		const midY = py + PLAYER_HEIGHT / 2;

		// Check 8 points around the hitbox
		return (
			this._tilemap.isSolid(Math.floor(left), Math.floor(top)) ||
			this._tilemap.isSolid(Math.floor(right), Math.floor(top)) ||
			this._tilemap.isSolid(Math.floor(left), Math.floor(bottom)) ||
			this._tilemap.isSolid(Math.floor(right), Math.floor(bottom)) ||
			this._tilemap.isSolid(Math.floor(midX), Math.floor(top)) ||
			this._tilemap.isSolid(Math.floor(midX), Math.floor(bottom)) ||
			this._tilemap.isSolid(Math.floor(left), Math.floor(midY)) ||
			this._tilemap.isSolid(Math.floor(right), Math.floor(midY))
		);
	}

	private _updateSpritePosition() {
		this._sprite.x = this.x * this._tilemap.tileSize;
		this._sprite.y = this.y * this._tilemap.tileSize;
	}

	private _updateDirectionIndicator() {
		const g = this._dirIndicator;
		const ts = this._tilemap.tileSize;
		const w = PLAYER_WIDTH * ts;
		const h = PLAYER_HEIGHT * ts;
		const s = 4; // triangle size

		g.clear();

		switch (this.direction) {
			case 0: // up
				g.moveTo(w / 2, -s);
				g.lineTo(w / 2 - s, 0);
				g.lineTo(w / 2 + s, 0);
				break;
			case 1: // right
				g.moveTo(w + s, h / 2);
				g.lineTo(w, h / 2 - s);
				g.lineTo(w, h / 2 + s);
				break;
			case 2: // down
				g.moveTo(w / 2, h + s);
				g.lineTo(w / 2 - s, h);
				g.lineTo(w / 2 + s, h);
				break;
			case 3: // left
				g.moveTo(-s, h / 2);
				g.lineTo(0, h / 2 - s);
				g.lineTo(0, h / 2 + s);
				break;
		}
		g.closePath();
		g.fill('#ffffff');
	}

	destroy() {
		this._sprite.destroy({ children: true });
	}
}

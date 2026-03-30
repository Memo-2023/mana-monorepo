import type { Container } from 'pixi.js';

export class Camera {
	private _container: Container;
	private _x = 0;
	private _y = 0;
	private _scale = 1.5; // Start zoomed out more to see the village
	private _minScale = 0.3;
	private _maxScale = 6;
	private _shakeIntensity = 0;
	private _shakeDuration = 0;

	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	get scale() {
		return this._scale;
	}

	constructor(container: Container) {
		this._container = container;
	}

	setPosition(x: number, y: number) {
		this._x = x;
		this._y = y;
	}

	move(dx: number, dy: number) {
		this._x += dx / this._scale;
		this._y += dy / this._scale;
	}

	zoom(factor: number) {
		const newScale = this._scale * factor;
		this._scale = Math.max(this._minScale, Math.min(this._maxScale, newScale));
	}

	setScale(scale: number) {
		this._scale = Math.max(this._minScale, Math.min(this._maxScale, scale));
	}

	/** Convert screen coordinates to world coordinates */
	screenToWorld(
		screenX: number,
		screenY: number,
		screenWidth: number,
		screenHeight: number
	): { x: number; y: number } {
		return {
			x: (screenX - screenWidth / 2) / this._scale + this._x,
			y: (screenY - screenHeight / 2) / this._scale + this._y,
		};
	}

	/** Start a camera shake effect */
	shake(intensity: number, durationFrames: number) {
		this._shakeIntensity = intensity;
		this._shakeDuration = durationFrames;
	}

	/** Apply camera transform to the world container */
	update(screenWidth: number, screenHeight: number) {
		let offsetX = 0;
		let offsetY = 0;

		if (this._shakeDuration > 0) {
			offsetX = (Math.random() - 0.5) * this._shakeIntensity * 2;
			offsetY = (Math.random() - 0.5) * this._shakeIntensity * 2;
			this._shakeDuration--;
			if (this._shakeDuration <= 0) this._shakeIntensity = 0;
		}

		this._container.x = screenWidth / 2 - this._x * this._scale + offsetX;
		this._container.y = screenHeight / 2 - this._y * this._scale + offsetY;
		this._container.scale.set(this._scale);
	}
}

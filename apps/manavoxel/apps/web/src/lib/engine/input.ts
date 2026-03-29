export class InputManager {
	private _keys = new Set<string>();
	private _mouseDown = false;
	private _mouseButton = 0;
	private _mouseX = 0;
	private _mouseY = 0;
	private _scrollAccumulator = 0;
	private _justPressed = false;
	private _element: HTMLElement;

	private _onKeyDown: (e: KeyboardEvent) => void;
	private _onKeyUp: (e: KeyboardEvent) => void;
	private _onMouseDown: (e: MouseEvent) => void;
	private _onMouseUp: (e: MouseEvent) => void;
	private _onMouseMove: (e: MouseEvent) => void;
	private _onWheel: (e: WheelEvent) => void;
	private _onContextMenu: (e: Event) => void;

	get isMouseDown() {
		return this._mouseDown;
	}
	get mouseButton() {
		return this._mouseButton;
	}
	get mouseX() {
		return this._mouseX;
	}
	get mouseY() {
		return this._mouseY;
	}
	/** True only on the first frame the mouse is pressed */
	get justPressed() {
		const val = this._justPressed;
		this._justPressed = false;
		return val;
	}

	constructor(element: HTMLElement) {
		this._element = element;

		this._onKeyDown = (e) => {
			this._keys.add(e.code);
		};
		this._onKeyUp = (e) => {
			this._keys.delete(e.code);
		};
		this._onMouseDown = (e) => {
			this._mouseDown = true;
			this._mouseButton = e.button;
			this._justPressed = true;
		};
		this._onMouseUp = () => {
			this._mouseDown = false;
		};
		this._onMouseMove = (e) => {
			this._mouseX = e.clientX;
			this._mouseY = e.clientY;
		};
		this._onWheel = (e) => {
			e.preventDefault();
			this._scrollAccumulator += e.deltaY;
		};
		this._onContextMenu = (e) => {
			e.preventDefault(); // Disable right-click menu
		};

		window.addEventListener('keydown', this._onKeyDown);
		window.addEventListener('keyup', this._onKeyUp);
		element.addEventListener('mousedown', this._onMouseDown);
		window.addEventListener('mouseup', this._onMouseUp);
		window.addEventListener('mousemove', this._onMouseMove);
		element.addEventListener('wheel', this._onWheel, { passive: false });
		element.addEventListener('contextmenu', this._onContextMenu);
	}

	isKeyDown(code: string): boolean {
		return this._keys.has(code);
	}

	consumeScroll(): number {
		const val = this._scrollAccumulator;
		this._scrollAccumulator = 0;
		return val;
	}

	destroy() {
		window.removeEventListener('keydown', this._onKeyDown);
		window.removeEventListener('keyup', this._onKeyUp);
		this._element.removeEventListener('mousedown', this._onMouseDown);
		window.removeEventListener('mouseup', this._onMouseUp);
		window.removeEventListener('mousemove', this._onMouseMove);
		this._element.removeEventListener('wheel', this._onWheel);
		this._element.removeEventListener('contextmenu', this._onContextMenu);
	}
}

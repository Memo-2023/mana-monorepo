/**
 * Touch-Controls für Mobile-Unterstützung.
 * Zeigt einen virtuellen Joystick und einen Interaktions-Button.
 */
class TouchControls {
	/** @param {Phaser.Scene} scene */
	constructor(scene) {
		this.scene = scene;
		this.isActive = false;
		this.direction = { x: 0, y: 0 };
		this.interactPressed = false;

		// Joystick-Elemente
		this.joystickBase = null;
		this.joystickThumb = null;
		this.interactButton = null;

		// Joystick-State
		this.joystickPointer = null;
		this.joystickCenter = { x: 0, y: 0 };
	}

	create() {
		// Nur auf Touch-Geräten aktivieren
		if (!this.scene.sys.game.device.input.touch) return;

		this.isActive = true;
		const width = this.scene.cameras.main.width;
		const height = this.scene.cameras.main.height;

		// Joystick-Base (links unten)
		const joyX = 100;
		const joyY = height - 100;
		this.joystickCenter = { x: joyX, y: joyY };

		this.joystickBase = this.scene.add.graphics();
		this.joystickBase.fillStyle(0xffffff, 0.2);
		this.joystickBase.fillCircle(joyX, joyY, 60);
		this.joystickBase.lineStyle(2, 0xffffff, 0.4);
		this.joystickBase.strokeCircle(joyX, joyY, 60);
		this.joystickBase.setScrollFactor(0);
		this.joystickBase.setDepth(1000);

		this.joystickThumb = this.scene.add.graphics();
		this._drawThumb(joyX, joyY);
		this.joystickThumb.setScrollFactor(0);
		this.joystickThumb.setDepth(1001);

		// Interaktions-Button (rechts unten)
		const btnX = width - 80;
		const btnY = height - 100;

		this.interactButton = this.scene.add.graphics();
		this.interactButton.fillStyle(GAME_CONFIG.COLORS.CHAT_BORDER, 0.6);
		this.interactButton.fillCircle(btnX, btnY, 35);
		this.interactButton.setScrollFactor(0);
		this.interactButton.setDepth(1000);

		const btnLabel = this.scene.add.text(btnX, btnY, 'E', {
			fontSize: '28px',
			fontFamily: 'Arial',
			fontStyle: 'bold',
			fill: GAME_CONFIG.COLORS.TEXT_WHITE,
		});
		btnLabel.setOrigin(0.5);
		btnLabel.setScrollFactor(0);
		btnLabel.setDepth(1001);

		// Interaktiver Bereich für den Button
		const btnHit = this.scene.add.circle(btnX, btnY, 40);
		btnHit.setScrollFactor(0);
		btnHit.setInteractive();
		btnHit.setAlpha(0.001);
		btnHit.setDepth(1002);

		btnHit.on('pointerdown', () => {
			this.interactPressed = true;
			this.interactButton.clear();
			this.interactButton.fillStyle(GAME_CONFIG.COLORS.SEND_BUTTON_HOVER, 0.8);
			this.interactButton.fillCircle(btnX, btnY, 35);
		});

		btnHit.on('pointerup', () => {
			this.interactButton.clear();
			this.interactButton.fillStyle(GAME_CONFIG.COLORS.CHAT_BORDER, 0.6);
			this.interactButton.fillCircle(btnX, btnY, 35);
		});

		// Joystick Touch-Handling
		this.scene.input.on('pointerdown', (pointer) => this._onPointerDown(pointer));
		this.scene.input.on('pointermove', (pointer) => this._onPointerMove(pointer));
		this.scene.input.on('pointerup', (pointer) => this._onPointerUp(pointer));
	}

	/** @param {number} x @param {number} y */
	_drawThumb(x, y) {
		this.joystickThumb.clear();
		this.joystickThumb.fillStyle(0xffffff, 0.5);
		this.joystickThumb.fillCircle(x, y, 25);
	}

	/** @param {Phaser.Input.Pointer} pointer */
	_onPointerDown(pointer) {
		if (!this.isActive) return;

		// Nur linke Hälfte des Bildschirms für Joystick
		if (pointer.x < this.scene.cameras.main.width / 2) {
			const dist = Phaser.Math.Distance.Between(
				pointer.x,
				pointer.y,
				this.joystickCenter.x,
				this.joystickCenter.y
			);
			if (dist < 80) {
				this.joystickPointer = pointer;
			}
		}
	}

	/** @param {Phaser.Input.Pointer} pointer */
	_onPointerMove(pointer) {
		if (!this.isActive || !this.joystickPointer || pointer.id !== this.joystickPointer.id) return;

		const maxDist = 50;
		const dx = pointer.x - this.joystickCenter.x;
		const dy = pointer.y - this.joystickCenter.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		let thumbX, thumbY;
		if (dist > maxDist) {
			thumbX = this.joystickCenter.x + (dx / dist) * maxDist;
			thumbY = this.joystickCenter.y + (dy / dist) * maxDist;
		} else {
			thumbX = pointer.x;
			thumbY = pointer.y;
		}

		this._drawThumb(thumbX, thumbY);

		// Richtung normalisieren
		const normDist = Math.min(dist, maxDist) / maxDist;
		this.direction.x = (dx / (dist || 1)) * normDist;
		this.direction.y = (dy / (dist || 1)) * normDist;
	}

	/** @param {Phaser.Input.Pointer} pointer */
	_onPointerUp(pointer) {
		if (!this.isActive) return;

		if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
			this.joystickPointer = null;
			this.direction = { x: 0, y: 0 };
			this._drawThumb(this.joystickCenter.x, this.joystickCenter.y);
		}
	}

	/** @returns {boolean} Ob der Interact-Button gedrückt wurde (einmalig) */
	consumeInteract() {
		if (this.interactPressed) {
			this.interactPressed = false;
			return true;
		}
		return false;
	}
}

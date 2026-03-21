class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
	}

	create() {
		const { COLORS } = GAME_CONFIG;

		this.add.image(400, 300, 'background');

		// Grid erstellen (16x16 Grid mit 32x32 Pixel Tiles)
		this.grid = [];
		this.tileSize = 32;
		this.gridWidth = 16;
		this.gridHeight = 16;
		this.gridStartX = (800 - this.gridWidth * this.tileSize) / 2;
		this.gridStartY = (600 - this.gridHeight * this.tileSize) / 2;

		// Grid-Farben als 2D-Array speichern
		this.gridColors = [];

		for (let y = 0; y < this.gridHeight; y++) {
			this.grid[y] = [];
			this.gridColors[y] = [];
			for (let x = 0; x < this.gridWidth; x++) {
				const tile = this.add.image(
					this.gridStartX + x * this.tileSize + this.tileSize / 2,
					this.gridStartY + y * this.tileSize + this.tileSize / 2,
					'tile'
				);
				tile.setTint(0xffffff);
				tile.setInteractive();
				tile.on('pointerdown', () => this.paintTile(x, y));
				tile.on('pointerover', (pointer) => {
					if (pointer.isDown) this.paintTile(x, y);
				});
				this.grid[y][x] = tile;
				this.gridColors[y][x] = 0xffffff;
			}
		}

		this.currentColor = 0x000000;

		// Farbpalette
		this.createColorPalette();

		// Titel
		this.add
			.text(400, 30, I18N.t('editorTitle'), { fontSize: '32px', fill: COLORS.TEXT_WHITE })
			.setOrigin(0.5);

		// Buttons
		this._createButton(80, 560, I18N.t('back'), () => this.scene.start('MainMenuScene'));
		this._createButton(250, 560, I18N.t('clear'), () => this.clearGrid());
		this._createButton(420, 560, I18N.t('saveAsAvatar'), () => this.saveAsAvatar());
		this._createButton(600, 560, I18N.t('load'), () => this.loadAvatar());

		// Status-Text
		this.statusText = this.add
			.text(400, 30 + 30, '', {
				fontSize: '14px',
				fontFamily: 'Arial',
				fill: COLORS.TEXT_REVEALED,
				align: 'center',
			})
			.setOrigin(0.5);
	}

	createColorPalette() {
		const colors = [
			0x000000, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800,
			0x8800ff, 0x88ff00, 0x0088ff, 0xff4444, 0x44ff44, 0x4444ff, 0x888888, 0xffcc99, 0x663300,
			0x339933, 0x333366,
		];

		const paletteX = 720;
		const paletteStartY = 120;
		const size = 25;
		const gap = 5;
		const cols = 2;

		this.add
			.text(paletteX, paletteStartY - 25, 'Farben', {
				fontSize: '14px',
				fill: GAME_CONFIG.COLORS.TEXT_WHITE,
			})
			.setOrigin(0.5);

		colors.forEach((color, index) => {
			const col = index % cols;
			const row = Math.floor(index / cols);
			const x = paletteX - (cols * (size + gap)) / 2 + col * (size + gap) + size / 2;
			const y = paletteStartY + row * (size + gap);

			const btn = this.add.rectangle(x, y, size, size, color);
			btn.setInteractive({ useHandCursor: true });
			btn.setStrokeStyle(2, 0xffffff);
			btn.on('pointerdown', () => {
				this.currentColor = color;
				// Highlight aktive Farbe
				colors.forEach((_, i) => {
					const el = this.children.list.find(
						(c) =>
							c.type === 'Rectangle' &&
							c.x === paletteX - (cols * (size + gap)) / 2 + (i % cols) * (size + gap) + size / 2 &&
							c.fillColor === colors[i]
					);
					if (el) el.setStrokeStyle(2, 0xffffff);
				});
				btn.setStrokeStyle(3, GAME_CONFIG.COLORS.REVEAL_FLASH);
			});
		});
	}

	paintTile(x, y) {
		this.grid[y][x].setTint(this.currentColor);
		this.gridColors[y][x] = this.currentColor;
	}

	clearGrid() {
		for (let y = 0; y < this.gridHeight; y++) {
			for (let x = 0; x < this.gridWidth; x++) {
				this.grid[y][x].setTint(0xffffff);
				this.gridColors[y][x] = 0xffffff;
			}
		}
		this._showStatus(I18N.t('gridCleared'));
	}

	/** Speichert das aktuelle Pixel-Art als Avatar-Textur */
	saveAsAvatar() {
		// Pixel-Daten speichern
		const avatarData = {
			width: this.gridWidth,
			height: this.gridHeight,
			pixels: this.gridColors,
		};

		try {
			localStorage.setItem('whopixels_avatar', JSON.stringify(avatarData));

			// Textur generieren (32x32 skaliert auf Spieler-Größe)
			this._generateAvatarTexture(avatarData);

			this._showStatus(I18N.t('avatarSaved'));
		} catch (error) {
			console.error('Fehler beim Speichern des Avatars:', error);
			this._showStatus(I18N.t('saveError'));
		}
	}

	/** Lädt einen gespeicherten Avatar in den Editor */
	loadAvatar() {
		try {
			const saved = localStorage.getItem('whopixels_avatar');
			if (!saved) {
				this._showStatus(I18N.t('noAvatarFound'));
				return;
			}

			const avatarData = JSON.parse(saved);
			for (let y = 0; y < Math.min(avatarData.height, this.gridHeight); y++) {
				for (let x = 0; x < Math.min(avatarData.width, this.gridWidth); x++) {
					const color = avatarData.pixels[y][x];
					this.grid[y][x].setTint(color);
					this.gridColors[y][x] = color;
				}
			}
			this._showStatus(I18N.t('avatarLoaded'));
		} catch (error) {
			console.error('Fehler beim Laden:', error);
			this._showStatus(I18N.t('loadError'));
		}
	}

	_generateAvatarTexture(avatarData) {
		const frameSize = 32;
		const pixelSize = frameSize / avatarData.width; // 2px pro Pixel bei 16x16

		const graphics = this.make.graphics({ x: 0, y: 0 });

		for (let y = 0; y < avatarData.height; y++) {
			for (let x = 0; x < avatarData.width; x++) {
				const color = avatarData.pixels[y][x];
				if (color !== 0xffffff) {
					// Weiß = transparent
					graphics.fillStyle(color);
					graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}

		// Generiere Texturen für alle Richtungen
		// (einfache Version: gleiche Textur für alle Richtungen)
		if (this.textures.exists('custom_avatar_down')) {
			this.textures.remove('custom_avatar_down');
			this.textures.remove('custom_avatar_up');
			this.textures.remove('custom_avatar_left');
			this.textures.remove('custom_avatar_right');
		}

		graphics.generateTexture('custom_avatar_down', frameSize, frameSize);
		graphics.generateTexture('custom_avatar_up', frameSize, frameSize);
		graphics.generateTexture('custom_avatar_left', frameSize, frameSize);
		graphics.generateTexture('custom_avatar_right', frameSize, frameSize);
		graphics.destroy();
	}

	/** @param {string} msg */
	_showStatus(msg) {
		this.statusText.setText(msg);
		this.tweens.add({
			targets: this.statusText,
			alpha: 0,
			duration: 1000,
			delay: 2000,
			onComplete: () => {
				this.statusText.setAlpha(1);
				this.statusText.setText('');
			},
		});
	}

	_createButton(x, y, label, onClick) {
		const { COLORS } = GAME_CONFIG;
		const btn = this.add
			.text(x, y, label, {
				fontSize: '20px',
				fill: COLORS.TEXT_WHITE,
				backgroundColor: COLORS.BACK_BUTTON_BG,
				padding: { x: 12, y: 6 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		btn.on('pointerover', () => btn.setStyle({ fill: COLORS.BACK_BUTTON_HOVER }));
		btn.on('pointerout', () => btn.setStyle({ fill: COLORS.TEXT_WHITE }));
		btn.on('pointerdown', onClick);
		return btn;
	}
}

class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
	}

	create() {
		// Add background
		this.add.image(400, 300, 'background');

		// Create grid for pixel art (16x16 grid of 32x32 pixel tiles)
		this.grid = [];
		this.tileSize = 32;
		this.gridWidth = 16;
		this.gridHeight = 16;
		this.gridStartX = (800 - this.gridWidth * this.tileSize) / 2;
		this.gridStartY = (600 - this.gridHeight * this.tileSize) / 2;

		// Create grid of tiles
		for (let y = 0; y < this.gridHeight; y++) {
			this.grid[y] = [];
			for (let x = 0; x < this.gridWidth; x++) {
				const tile = this.add.image(
					this.gridStartX + x * this.tileSize + this.tileSize / 2,
					this.gridStartY + y * this.tileSize + this.tileSize / 2,
					'tile'
				);
				tile.setTint(0xffffff); // Default white color
				tile.setInteractive();
				tile.on('pointerdown', () => {
					this.paintTile(x, y);
				});
				this.grid[y][x] = tile;
			}
		}

		// Current selected color (default: black)
		this.currentColor = 0x000000;

		// Create color palette
		this.createColorPalette();

		// Add UI text
		this.add
			.text(400, 50, 'Pixel Editor', {
				fontSize: '32px',
				fill: '#fff',
			})
			.setOrigin(0.5);

		// Add back button
		const backButton = this.add
			.text(100, 50, 'Zurück', {
				fontSize: '24px',
				fill: '#fff',
				backgroundColor: '#4a4a4a',
				padding: { x: 10, y: 5 },
			})
			.setOrigin(0.5)
			.setInteractive();

		backButton.on('pointerover', () => {
			backButton.setStyle({ fill: '#ff0' });
		});

		backButton.on('pointerout', () => {
			backButton.setStyle({ fill: '#fff' });
		});

		backButton.on('pointerdown', () => {
			this.scene.start('MainMenuScene');
		});
	}

	createColorPalette() {
		const colors = [
			0x000000, // Black
			0xffffff, // White
			0xff0000, // Red
			0x00ff00, // Green
			0x0000ff, // Blue
			0xffff00, // Yellow
			0xff00ff, // Magenta
			0x00ffff, // Cyan
		];

		const paletteX = 700;
		const paletteY = 150;
		const paletteSize = 30;
		const paletteGap = 10;

		colors.forEach((color, index) => {
			const colorButton = this.add.rectangle(
				paletteX,
				paletteY + index * (paletteSize + paletteGap),
				paletteSize,
				paletteSize,
				color
			);

			colorButton.setInteractive();
			colorButton.on('pointerdown', () => {
				this.currentColor = color;
			});

			// Add stroke around the button
			colorButton.setStrokeStyle(2, 0xffffff);
		});
	}

	paintTile(x, y) {
		this.grid[y][x].setTint(this.currentColor);
	}
}

class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: 'BootScene' });
	}

	preload() {
		// Loading screen
		this.graphics = this.add.graphics();
		this.newGraphics = this.add.graphics();
		const progressBar = new Phaser.Geom.Rectangle(200, 300, 400, 50);
		const progressBarFill = new Phaser.Geom.Rectangle(205, 305, 290, 40);

		this.graphics.fillStyle(0xffffff, 1);
		this.graphics.fillRectShape(progressBar);

		this.newGraphics.fillStyle(0x3587e2, 1);
		this.newGraphics.fillRectShape(progressBarFill);

		const loadingText = this.add.text(250, 260, 'Loading: ', { fontSize: '32px', fill: '#FFF' });

		// Update as load progresses
		this.load.on('progress', (percent) => {
			loadingText.setText('Loading: ' + parseInt(percent * 100) + '%');
			progressBarFill.width = 390 * percent;
			this.newGraphics.clear();
			this.newGraphics.fillStyle(0x3587e2, 1);
			this.newGraphics.fillRectShape(progressBarFill);
		});

		this.load.on('complete', () => {
			loadingText.destroy();
			this.graphics.destroy();
			this.newGraphics.destroy();
		});

		// We'll create graphics objects instead of loading images
	}

	create() {
		// Create a texture for background
		const bgGraphics = this.make.graphics({ x: 0, y: 0 });
		bgGraphics.fillStyle(0x222233);
		bgGraphics.fillRect(0, 0, 800, 600);

		// Add some pattern to background
		bgGraphics.fillStyle(0x1a1a2a);
		for (let i = 0; i < 100; i++) {
			const x = Math.random() * 800;
			const y = Math.random() * 600;
			const size = Math.random() * 5 + 2;
			bgGraphics.fillRect(x, y, size, size);
		}

		// Erstelle ein Partikel-Sprite für Spezialeffekte
		const particleGraphics = this.make.graphics({ x: 0, y: 0 });
		particleGraphics.fillStyle(0xffffff);
		particleGraphics.fillCircle(4, 4, 4);
		particleGraphics.generateTexture('particle', 8, 8);

		bgGraphics.generateTexture('background', 800, 600);

		// Create a texture for player (pixel editor)
		const playerGraphics = this.make.graphics({ x: 0, y: 0 });
		playerGraphics.fillStyle(0xff0000);
		playerGraphics.fillRect(0, 0, 32, 32);
		playerGraphics.fillStyle(0xff5555);
		playerGraphics.fillRect(8, 8, 16, 16);
		playerGraphics.generateTexture('player', 32, 32);

		// Erstelle Texturen für verschiedene Tile-Typen (8x8 Pixel Tiles, skaliert auf 32x32)
		this.createTileTextures();

		// Erstelle NPC-Texturen
		this.createNPCTextures();

		// Create a texture for basic tile
		const tileGraphics = this.make.graphics({ x: 0, y: 0 });
		tileGraphics.fillStyle(0xffffff);
		tileGraphics.fillRect(0, 0, 32, 32);
		tileGraphics.lineStyle(1, 0xcccccc);
		tileGraphics.strokeRect(0, 0, 32, 32);
		tileGraphics.generateTexture('tile', 32, 32);

		// Create player walk animation frames (4 directions)
		this.createPlayerWalkAnimations();

		this.scene.start('MainMenuScene');
	}

	createPlayerWalkAnimations() {
		// Erstelle eine Spritesheet-Textur für den Spieler im RPG
		const frameWidth = 32;
		const frameHeight = 32;

		// Farbpalette für den Spieler
		const colors = {
			body: 0x3366cc, // Blauer Körper
			face: 0xffcc99, // Hautfarbe für Gesicht
			hair: 0x663300, // Braune Haare
			shirt: 0x339933, // Grünes Hemd
			pants: 0x333366, // Dunkelblaue Hose
			shoes: 0x663300, // Braune Schuhe
			outline: 0x000000, // Schwarze Umrisse
		};

		// Gemeinsame Funktion zum Zeichnen der Grundform des Spielers
		const drawPlayerBase = (graphics) => {
			// Umriss
			graphics.lineStyle(1, colors.outline);

			// Körper (Torso)
			graphics.fillStyle(colors.shirt);
			graphics.fillRect(10, 12, 12, 10);
			graphics.strokeRect(10, 12, 12, 10);

			// Kopf
			graphics.fillStyle(colors.face);
			graphics.fillRect(10, 4, 12, 8);
			graphics.strokeRect(10, 4, 12, 8);

			// Haare
			graphics.fillStyle(colors.hair);
			graphics.fillRect(10, 4, 12, 3);
			graphics.strokeRect(10, 4, 12, 3);

			// Hose
			graphics.fillStyle(colors.pants);
			graphics.fillRect(10, 22, 12, 6);
			graphics.strokeRect(10, 22, 12, 6);
		};

		// Nach unten (0)
		const downGraphics = this.make.graphics({ x: 0, y: 0 });
		drawPlayerBase(downGraphics);

		// Gesicht nach unten
		downGraphics.fillStyle(colors.outline);
		downGraphics.fillRect(14, 8, 1, 1); // Linkes Auge
		downGraphics.fillRect(17, 8, 1, 1); // Rechtes Auge
		downGraphics.fillRect(15, 10, 2, 1); // Mund

		// Beine und Schuhe nach unten
		downGraphics.fillStyle(colors.pants);
		downGraphics.fillRect(12, 28, 3, 2); // Linkes Bein
		downGraphics.fillRect(17, 28, 3, 2); // Rechtes Bein
		downGraphics.fillStyle(colors.shoes);
		downGraphics.fillRect(12, 30, 3, 2); // Linker Schuh
		downGraphics.fillRect(17, 30, 3, 2); // Rechter Schuh
		downGraphics.lineStyle(1, colors.outline);
		downGraphics.strokeRect(12, 28, 3, 4); // Linkes Bein Umriss
		downGraphics.strokeRect(17, 28, 3, 4); // Rechtes Bein Umriss

		downGraphics.generateTexture('player_down', frameWidth, frameHeight);

		// Nach oben (1)
		const upGraphics = this.make.graphics({ x: 0, y: 0 });
		drawPlayerBase(upGraphics);

		// Rücken der Haare
		upGraphics.fillStyle(colors.hair);
		upGraphics.fillRect(10, 2, 12, 2);
		upGraphics.lineStyle(1, colors.outline);
		upGraphics.strokeRect(10, 2, 12, 2);

		// Beine und Schuhe nach oben
		upGraphics.fillStyle(colors.pants);
		upGraphics.fillRect(12, 28, 3, 2); // Linkes Bein
		upGraphics.fillRect(17, 28, 3, 2); // Rechtes Bein
		upGraphics.fillStyle(colors.shoes);
		upGraphics.fillRect(12, 30, 3, 2); // Linker Schuh
		upGraphics.fillRect(17, 30, 3, 2); // Rechter Schuh
		upGraphics.lineStyle(1, colors.outline);
		upGraphics.strokeRect(12, 28, 3, 4); // Linkes Bein Umriss
		upGraphics.strokeRect(17, 28, 3, 4); // Rechtes Bein Umriss

		upGraphics.generateTexture('player_up', frameWidth, frameHeight);

		// Nach links (2)
		const leftGraphics = this.make.graphics({ x: 0, y: 0 });
		drawPlayerBase(leftGraphics);

		// Gesicht nach links
		leftGraphics.fillStyle(colors.outline);
		leftGraphics.fillRect(12, 8, 1, 1); // Auge
		leftGraphics.fillRect(11, 10, 2, 1); // Mund

		// Arm nach links
		leftGraphics.fillStyle(colors.shirt);
		leftGraphics.fillRect(6, 14, 4, 3);
		leftGraphics.lineStyle(1, colors.outline);
		leftGraphics.strokeRect(6, 14, 4, 3);

		// Beine und Schuhe nach links
		leftGraphics.fillStyle(colors.pants);
		leftGraphics.fillRect(12, 28, 3, 2); // Linkes Bein
		leftGraphics.fillRect(15, 28, 3, 2); // Rechtes Bein
		leftGraphics.fillStyle(colors.shoes);
		leftGraphics.fillRect(9, 30, 6, 2); // Schuhe
		leftGraphics.lineStyle(1, colors.outline);
		leftGraphics.strokeRect(9, 28, 9, 4); // Beine Umriss

		leftGraphics.generateTexture('player_left', frameWidth, frameHeight);

		// Nach rechts (3)
		const rightGraphics = this.make.graphics({ x: 0, y: 0 });
		drawPlayerBase(rightGraphics);

		// Gesicht nach rechts
		rightGraphics.fillStyle(colors.outline);
		rightGraphics.fillRect(19, 8, 1, 1); // Auge
		rightGraphics.fillRect(19, 10, 2, 1); // Mund

		// Arm nach rechts
		rightGraphics.fillStyle(colors.shirt);
		rightGraphics.fillRect(22, 14, 4, 3);
		rightGraphics.lineStyle(1, colors.outline);
		rightGraphics.strokeRect(22, 14, 4, 3);

		// Beine und Schuhe nach rechts
		rightGraphics.fillStyle(colors.pants);
		rightGraphics.fillRect(14, 28, 3, 2); // Linkes Bein
		rightGraphics.fillRect(17, 28, 3, 2); // Rechtes Bein
		rightGraphics.fillStyle(colors.shoes);
		rightGraphics.fillRect(17, 30, 6, 2); // Schuhe
		rightGraphics.lineStyle(1, colors.outline);
		rightGraphics.strokeRect(14, 28, 9, 4); // Beine Umriss

		rightGraphics.generateTexture('player_right', frameWidth, frameHeight);
	}

	createTileTextures() {
		const tileSize = 32; // Größe jedes Tiles

		// 1. Gras
		const grassGraphics = this.make.graphics({ x: 0, y: 0 });
		grassGraphics.fillStyle(0x88aa44); // Grün für Gras
		grassGraphics.fillRect(0, 0, tileSize, tileSize);
		// Kleine Texturen für Gras
		grassGraphics.fillStyle(0x779933);
		for (let i = 0; i < 8; i++) {
			const x = Math.random() * tileSize;
			const y = Math.random() * tileSize;
			grassGraphics.fillRect(x, y, 2, 2);
		}
		grassGraphics.generateTexture('tile_grass', tileSize, tileSize);

		// 2. Gras mit Blumen
		const grassFlowerGraphics = this.make.graphics({ x: 0, y: 0 });
		grassFlowerGraphics.fillStyle(0x88aa44); // Grün für Gras
		grassFlowerGraphics.fillRect(0, 0, tileSize, tileSize);
		// Kleine Texturen für Gras
		grassFlowerGraphics.fillStyle(0x779933);
		for (let i = 0; i < 5; i++) {
			const x = Math.random() * tileSize;
			const y = Math.random() * tileSize;
			grassFlowerGraphics.fillRect(x, y, 2, 2);
		}
		// Blumen hinzufügen
		grassFlowerGraphics.fillStyle(0xffff00); // Gelb für Blumen
		for (let i = 0; i < 3; i++) {
			const x = 5 + Math.random() * (tileSize - 10);
			const y = 5 + Math.random() * (tileSize - 10);
			grassFlowerGraphics.fillRect(x, y, 3, 3);
		}
		grassFlowerGraphics.fillStyle(0xff5555); // Rot für Blumen
		for (let i = 0; i < 2; i++) {
			const x = 5 + Math.random() * (tileSize - 10);
			const y = 5 + Math.random() * (tileSize - 10);
			grassFlowerGraphics.fillRect(x, y, 3, 3);
		}
		grassFlowerGraphics.generateTexture('tile_grass_flower', tileSize, tileSize);

		// 3. Erde
		const dirtGraphics = this.make.graphics({ x: 0, y: 0 });
		dirtGraphics.fillStyle(0x8b4513); // Braun für Erde
		dirtGraphics.fillRect(0, 0, tileSize, tileSize);
		// Kleine Texturen für Erde
		dirtGraphics.fillStyle(0x6b3304);
		for (let i = 0; i < 10; i++) {
			const x = Math.random() * tileSize;
			const y = Math.random() * tileSize;
			dirtGraphics.fillRect(x, y, 2, 2);
		}
		dirtGraphics.generateTexture('tile_dirt', tileSize, tileSize);

		// 4. Erde mit Steinen
		const dirtStoneGraphics = this.make.graphics({ x: 0, y: 0 });
		dirtStoneGraphics.fillStyle(0x8b4513); // Braun für Erde
		dirtStoneGraphics.fillRect(0, 0, tileSize, tileSize);
		// Kleine Texturen für Erde
		dirtStoneGraphics.fillStyle(0x6b3304);
		for (let i = 0; i < 6; i++) {
			const x = Math.random() * tileSize;
			const y = Math.random() * tileSize;
			dirtStoneGraphics.fillRect(x, y, 2, 2);
		}
		// Steine hinzufügen
		dirtStoneGraphics.fillStyle(0x888888); // Grau für Steine
		for (let i = 0; i < 4; i++) {
			const size = 3 + Math.random() * 4;
			const x = Math.random() * (tileSize - size);
			const y = Math.random() * (tileSize - size);
			dirtStoneGraphics.fillRect(x, y, size, size);
		}
		dirtStoneGraphics.generateTexture('tile_dirt_stone', tileSize, tileSize);

		// 5. Steinwand
		const stoneWallGraphics = this.make.graphics({ x: 0, y: 0 });
		stoneWallGraphics.fillStyle(0x777777); // Grau für Steinwand
		stoneWallGraphics.fillRect(0, 0, tileSize, tileSize);

		// Steinmuster für die Wand
		stoneWallGraphics.fillStyle(0x555555);
		const brickHeight = 8;
		const brickWidth = 16;

		for (let y = 0; y < tileSize; y += brickHeight) {
			const offset = y % (brickHeight * 2) === 0 ? 0 : brickWidth / 2;
			for (let x = offset; x < tileSize; x += brickWidth) {
				stoneWallGraphics.fillRect(x, y, brickWidth - 1, brickHeight - 1);
			}
		}
		stoneWallGraphics.generateTexture('tile_stone_wall', tileSize, tileSize);

		// 6. Steinwand mit Blumen/Moos
		const stoneWallFlowerGraphics = this.make.graphics({ x: 0, y: 0 });
		stoneWallFlowerGraphics.fillStyle(0x777777); // Grau für Steinwand
		stoneWallFlowerGraphics.fillRect(0, 0, tileSize, tileSize);

		// Steinmuster für die Wand
		stoneWallFlowerGraphics.fillStyle(0x555555);
		for (let y = 0; y < tileSize; y += brickHeight) {
			const offset = y % (brickHeight * 2) === 0 ? 0 : brickWidth / 2;
			for (let x = offset; x < tileSize; x += brickWidth) {
				stoneWallFlowerGraphics.fillRect(x, y, brickWidth - 1, brickHeight - 1);
			}
		}

		// Moos/Blumen an der Wand
		stoneWallFlowerGraphics.fillStyle(0x55aa55); // Grün für Moos
		for (let i = 0; i < 6; i++) {
			const x = Math.random() * tileSize;
			const y = Math.random() * tileSize;
			const size = 2 + Math.random() * 3;
			stoneWallFlowerGraphics.fillRect(x, y, size, size);
		}

		stoneWallFlowerGraphics.fillStyle(0xffff00); // Gelb für Blumen
		for (let i = 0; i < 2; i++) {
			const x = 5 + Math.random() * (tileSize - 10);
			const y = 5 + Math.random() * (tileSize - 10);
			stoneWallFlowerGraphics.fillRect(x, y, 3, 3);
		}

		stoneWallFlowerGraphics.generateTexture('tile_stone_wall_flower', tileSize, tileSize);
	}

	createNPCTextures() {
		const frameWidth = 32;
		const frameHeight = 32;

		// Farbpalette für den NPC
		const colors = {
			body: 0xcc6633, // Bräunlicher Körper
			face: 0xffcc99, // Hautfarbe für Gesicht
			hair: 0x996600, // Blonde Haare
			shirt: 0xcc3333, // Rotes Hemd
			pants: 0x333333, // Schwarze Hose
			shoes: 0x663300, // Braune Schuhe
			outline: 0x000000, // Schwarze Umrisse
		};

		// Gemeinsame Funktion zum Zeichnen der Grundform des NPCs
		const drawNPCBase = (graphics) => {
			// Umriss
			graphics.lineStyle(1, colors.outline);

			// Körper (Torso)
			graphics.fillStyle(colors.shirt);
			graphics.fillRect(10, 12, 12, 10);
			graphics.strokeRect(10, 12, 12, 10);

			// Kopf
			graphics.fillStyle(colors.face);
			graphics.fillRect(10, 4, 12, 8);
			graphics.strokeRect(10, 4, 12, 8);

			// Haare
			graphics.fillStyle(colors.hair);
			graphics.fillRect(10, 4, 12, 3);
			graphics.strokeRect(10, 4, 12, 3);

			// Hose
			graphics.fillStyle(colors.pants);
			graphics.fillRect(10, 22, 12, 6);
			graphics.strokeRect(10, 22, 12, 6);
		};

		// NPC nach unten schauend
		const npcDownGraphics = this.make.graphics({ x: 0, y: 0 });
		drawNPCBase(npcDownGraphics);

		// Gesicht nach unten
		npcDownGraphics.fillStyle(colors.outline);
		npcDownGraphics.fillRect(14, 8, 1, 1); // Linkes Auge
		npcDownGraphics.fillRect(17, 8, 1, 1); // Rechtes Auge
		npcDownGraphics.fillRect(15, 10, 2, 1); // Mund

		// Beine und Schuhe nach unten
		npcDownGraphics.fillStyle(colors.pants);
		npcDownGraphics.fillRect(12, 28, 3, 2); // Linkes Bein
		npcDownGraphics.fillRect(17, 28, 3, 2); // Rechtes Bein
		npcDownGraphics.fillStyle(colors.shoes);
		npcDownGraphics.fillRect(12, 30, 3, 2); // Linker Schuh
		npcDownGraphics.fillRect(17, 30, 3, 2); // Rechter Schuh
		npcDownGraphics.lineStyle(1, colors.outline);
		npcDownGraphics.strokeRect(12, 28, 3, 4); // Linkes Bein Umriss
		npcDownGraphics.strokeRect(17, 28, 3, 4); // Rechtes Bein Umriss

		npcDownGraphics.generateTexture('npc_down', frameWidth, frameHeight);

		// NPC nach oben schauend
		const npcUpGraphics = this.make.graphics({ x: 0, y: 0 });
		drawNPCBase(npcUpGraphics);

		// Rücken der Haare
		npcUpGraphics.fillStyle(colors.hair);
		npcUpGraphics.fillRect(10, 2, 12, 2);
		npcUpGraphics.lineStyle(1, colors.outline);
		npcUpGraphics.strokeRect(10, 2, 12, 2);

		// Beine und Schuhe nach oben
		npcUpGraphics.fillStyle(colors.pants);
		npcUpGraphics.fillRect(12, 28, 3, 2); // Linkes Bein
		npcUpGraphics.fillRect(17, 28, 3, 2); // Rechtes Bein
		npcUpGraphics.fillStyle(colors.shoes);
		npcUpGraphics.fillRect(12, 30, 3, 2); // Linker Schuh
		npcUpGraphics.fillRect(17, 30, 3, 2); // Rechter Schuh
		npcUpGraphics.lineStyle(1, colors.outline);
		npcUpGraphics.strokeRect(12, 28, 3, 4); // Linkes Bein Umriss
		npcUpGraphics.strokeRect(17, 28, 3, 4); // Rechtes Bein Umriss

		npcUpGraphics.generateTexture('npc_up', frameWidth, frameHeight);
	}
}

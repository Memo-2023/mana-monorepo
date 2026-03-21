class WorldManager {
	/** @param {Phaser.Scene} scene */
	constructor(scene) {
		this.scene = scene;
		/** @type {MapConfig} */
		this.map = null;
		/** @type {Phaser.Physics.Arcade.StaticGroup} */
		this.obstacles = null;
	}

	create() {
		const { GRID_SIZE, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILE_SCALE, TERRAIN } = GAME_CONFIG;

		this.map = {
			widthInPixels: MAP_WIDTH,
			heightInPixels: MAP_HEIGHT,
			tileWidth: TILE_SIZE,
			tileHeight: TILE_SIZE,
		};

		// Hintergrund
		this.scene.add
			.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, 'background')
			.setOrigin(0, 0)
			.setScale(1.0);

		// Hindernisse
		this.obstacles = this.scene.physics.add.staticGroup();

		const tileTypes = [
			{ key: 'tile_grass', isObstacle: false },
			{ key: 'tile_grass_flower', isObstacle: false },
			{ key: 'tile_dirt', isObstacle: false },
			{ key: 'tile_dirt_stone', isObstacle: false },
			{ key: 'tile_stone_wall', isObstacle: true },
			{ key: 'tile_stone_wall_flower', isObstacle: true },
		];

		for (let y = 0; y < GRID_SIZE; y++) {
			for (let x = 0; x < GRID_SIZE; x++) {
				let tileType;

				if (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) {
					if (y === 0 && x === Math.floor(GRID_SIZE / 2)) {
						tileType = tileTypes[2]; // Tür
					} else {
						tileType = Math.random() < TERRAIN.WALL_MOSS_CHANCE ? tileTypes[5] : tileTypes[4];
					}
				} else {
					const rand = Math.random();
					if (rand < TERRAIN.GRASS_CHANCE) {
						tileType = tileTypes[0];
					} else if (rand < TERRAIN.GRASS_FLOWER_CHANCE) {
						tileType = tileTypes[1];
					} else if (rand < TERRAIN.DIRT_CHANCE) {
						tileType = tileTypes[2];
					} else {
						tileType = tileTypes[3];
					}
				}

				const tile = this.scene.add.image(
					x * TILE_SIZE + TILE_SIZE / 2,
					y * TILE_SIZE + TILE_SIZE / 2,
					tileType.key
				);
				tile.setScale(TILE_SCALE);

				if (tileType.isObstacle) {
					const obstacle = this.scene.add.rectangle(
						x * TILE_SIZE + TILE_SIZE / 2,
						y * TILE_SIZE + TILE_SIZE / 2,
						TILE_SIZE * TILE_SCALE,
						TILE_SIZE * TILE_SCALE
					);
					this.obstacles.add(obstacle);
				}
			}
		}
	}
}

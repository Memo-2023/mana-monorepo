// Game configuration
const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	pixelArt: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: false,
		},
	},
	scene: [BootScene, MainMenuScene, GameScene, RPGScene],
};

// Create and start the game
const game = new Phaser.Game(config);

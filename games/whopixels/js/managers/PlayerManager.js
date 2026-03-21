class PlayerManager {
	/** @param {Phaser.Scene} scene */
	constructor(scene) {
		this.scene = scene;
		/** @type {Phaser.Physics.Arcade.Sprite} */
		this.player = null;
		/** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
		this.cursors = null;
	}

	/**
	 * @param {MapConfig} map
	 * @param {Phaser.Physics.Arcade.StaticGroup} obstacles
	 */
	create(map, obstacles) {
		const { PLAYER_SCALE } = GAME_CONFIG;

		// Custom-Avatar verwenden, falls vorhanden
		this.useCustomAvatar = this.scene.textures.exists('custom_avatar_down');
		const initialTexture = this.useCustomAvatar ? 'custom_avatar_down' : 'player_down';

		this.player = this.scene.physics.add.sprite(
			map.widthInPixels / 2,
			map.heightInPixels / 2,
			initialTexture
		);
		this.player.setScale(PLAYER_SCALE);
		this.scene.physics.add.collider(this.player, obstacles);
		this.player.setCollideWorldBounds(true);

		// Kamera einrichten
		this.scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.scene.cameras.main.startFollow(this.player, true);

		// Steuerung
		this.cursors = this.scene.input.keyboard.createCursorKeys();
	}

	/** @param {TouchControls} [touchControls] */
	handleMovement(touchControls) {
		if (!this.player) return;

		const { PLAYER_SPEED } = GAME_CONFIG;

		// Touch-Input hat Priorität, dann Keyboard
		const touchActive = touchControls && touchControls.isActive;
		const touchDir = touchActive ? touchControls.direction : { x: 0, y: 0 };

		const moveLeft = this.cursors.left.isDown || touchDir.x < -0.3;
		const moveRight = this.cursors.right.isDown || touchDir.x > 0.3;
		const moveUp = this.cursors.up.isDown || touchDir.y < -0.3;
		const moveDown = this.cursors.down.isDown || touchDir.y > 0.3;

		const prefix = this.useCustomAvatar ? 'custom_avatar' : 'player';

		// Horizontal
		if (moveLeft) {
			this.player.setVelocityX(-PLAYER_SPEED);
			this.player.setTexture(`${prefix}_left`);
		} else if (moveRight) {
			this.player.setVelocityX(PLAYER_SPEED);
			this.player.setTexture(`${prefix}_right`);
		} else {
			this.player.setVelocityX(0);
		}

		// Vertikal
		if (moveUp) {
			this.player.setVelocityY(-PLAYER_SPEED);
			if (!moveLeft && !moveRight) {
				this.player.setTexture(`${prefix}_up`);
			}
		} else if (moveDown) {
			this.player.setVelocityY(PLAYER_SPEED);
			if (!moveLeft && !moveRight) {
				this.player.setTexture(`${prefix}_down`);
			}
		} else {
			this.player.setVelocityY(0);
		}
	}
}

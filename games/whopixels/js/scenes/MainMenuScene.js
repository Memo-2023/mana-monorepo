class MainMenuScene extends Phaser.Scene {
	constructor() {
		super({ key: 'MainMenuScene' });
	}

	create() {
		const { COLORS } = GAME_CONFIG;
		const centerX = this.cameras.main.width / 2;

		this.add.image(centerX, 300, 'background');

		// Titel
		this.add
			.text(centerX, 100, I18N.t('title'), {
				fontSize: '64px',
				fill: COLORS.TEXT_WHITE,
				fontStyle: 'bold',
			})
			.setOrigin(0.5);

		this.add
			.text(centerX, 160, I18N.t('subtitle'), {
				fontSize: '32px',
				fill: COLORS.TEXT_WHITE,
			})
			.setOrigin(0.5);

		// Statistiken
		this._showStats(centerX);

		// Buttons
		this._createButton(centerX, 300, I18N.t('startGame'), () => {
			this.scene.start('RPGScene');
		});

		this._createButton(centerX, 370, I18N.t('pixelEditor'), () => {
			this.scene.start('GameScene');
		});

		this._createButton(centerX, 440, I18N.t('resetProgress'), () => {
			new StorageManager().reset();
			this._showStats(centerX);

			const confirmText = this.add
				.text(centerX, 500, I18N.t('progressReset'), {
					fontSize: '18px',
					fill: COLORS.TEXT_REVEALED,
					fontFamily: 'Arial',
				})
				.setOrigin(0.5);

			this.tweens.add({
				targets: confirmText,
				alpha: 0,
				duration: 1500,
				delay: 1500,
				onComplete: () => confirmText.destroy(),
			});
		});

		// Sprach-Umschalter (rechts oben)
		const langBtn = this.add
			.text(this.cameras.main.width - 20, 20, I18N.getLanguage().toUpperCase(), {
				fontSize: '20px',
				fontFamily: 'Arial',
				fontStyle: 'bold',
				fill: COLORS.TEXT_WHITE,
				backgroundColor: COLORS.BACK_BUTTON_BG,
				padding: { x: 10, y: 5 },
			})
			.setOrigin(1, 0)
			.setInteractive({ useHandCursor: true });

		langBtn.on('pointerover', () => langBtn.setStyle({ fill: COLORS.BACK_BUTTON_HOVER }));
		langBtn.on('pointerout', () => langBtn.setStyle({ fill: COLORS.TEXT_WHITE }));
		langBtn.on('pointerdown', () => {
			const newLang = I18N.toggle();
			// Scene neu laden, um Texte zu aktualisieren
			this.scene.restart();
		});
	}

	_showStats(centerX) {
		const { COLORS } = GAME_CONFIG;
		const storage = new StorageManager();
		const stats = storage.getStats();

		if (this.statsText) this.statsText.destroy();

		if (stats.totalRevealed > 0) {
			this.statsText = this.add
				.text(
					centerX,
					220,
					[
						`${I18N.t('statsRevealed')}: ${stats.totalRevealed}`,
						`${I18N.t('statsAvgGuesses')}: ${stats.averageGuesses}`,
						`${I18N.t('statsBestStreak')}: ${stats.bestStreak}`,
					].join('  |  '),
					{
						fontSize: '16px',
						fontFamily: 'Arial',
						fill: COLORS.TEXT_NPC_RESPONSE,
						align: 'center',
					}
				)
				.setOrigin(0.5);
		}
	}

	_createButton(x, y, label, onClick) {
		const { COLORS } = GAME_CONFIG;

		const button = this.add
			.text(x, y, label, {
				fontSize: '28px',
				fill: COLORS.TEXT_WHITE,
				backgroundColor: COLORS.BACK_BUTTON_BG,
				padding: { x: 20, y: 10 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		button.on('pointerover', () => button.setStyle({ fill: COLORS.BACK_BUTTON_HOVER }));
		button.on('pointerout', () => button.setStyle({ fill: COLORS.TEXT_WHITE }));
		button.on('pointerdown', onClick);

		return button;
	}
}

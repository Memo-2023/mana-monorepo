class RPGScene extends Phaser.Scene {
	constructor() {
		super({ key: 'RPGScene' });
	}

	preload() {
		// Wir verwenden die in BootScene erstellten Texturen
	}

	create() {
		// Manager erstellen
		this.storage = new StorageManager();
		this.sound_mgr = new SoundManager();
		this.worldManager = new WorldManager(this);
		this.playerManager = new PlayerManager(this);
		this.npcManager = new NPCManager(this);
		this.chatUI = new ChatUI(this);

		// Gespeicherten Fortschritt laden
		const saveData = this.storage.load();
		if (saveData.discoveredNPCs.length > 0) {
			console.log(I18N.t('saveLoaded', { count: String(saveData.discoveredNPCs.length) }));
		}

		// Spielwelt erstellen
		this.worldManager.create();

		// Spieler erstellen
		this.playerManager.create(this.worldManager.map, this.worldManager.obstacles);

		// NPCs erstellen (mit gespeichertem Fortschritt)
		this.npcManager.create(this.playerManager.player, this.worldManager.obstacles);
		this.npcManager.state.discoveredNPCs = saveData.discoveredNPCs;

		// Touch-Controls (Mobile)
		this.touchControls = new TouchControls(this);
		this.touchControls.create();

		// UI erstellen
		this._createSceneUI();
		this.chatUI.create();

		// Interaktions-Taste (E)
		this.interactKey = this.input.keyboard.addKey('E');

		// NPC-Bewegung
		this.time.addEvent({
			delay: GAME_CONFIG.NPC_MOVE_INTERVAL,
			callback: () => this.npcManager.moveRandomly(),
			callbackScope: this,
			loop: true,
		});

		// Tutorial beim ersten Spielstart
		if (saveData.totalRevealed === 0) {
			this._showTutorial();
		}
	}

	_showTutorial() {
		const { COLORS } = GAME_CONFIG;
		const w = this.cameras.main.width;
		const h = this.cameras.main.height;

		const overlay = this.add.graphics();
		overlay.fillStyle(0x000000, 0.7);
		overlay.fillRect(0, 0, w, h);
		overlay.setScrollFactor(0);
		overlay.setDepth(2000);

		const isMobile = this.sys.game.device.input.touch;
		const controlsText = isMobile
			? I18N.t('tutorialControlsMobile')
			: I18N.t('tutorialControlsDesktop');

		const tutorialText = this.add.text(
			w / 2,
			h / 2 - 40,
			[
				I18N.t('tutorialWelcome'),
				'',
				I18N.t('tutorialDesc'),
				'',
				controlsText,
				'',
				I18N.t('tutorialStart'),
			].join('\n'),
			{
				fontSize: '18px',
				fontFamily: 'Arial',
				fill: COLORS.TEXT_WHITE,
				align: 'center',
				lineSpacing: 6,
			}
		);
		tutorialText.setOrigin(0.5);
		tutorialText.setScrollFactor(0);
		tutorialText.setDepth(2001);

		const closeTutorial = () => {
			overlay.destroy();
			tutorialText.destroy();
		};

		this.input.once('pointerdown', closeTutorial);
		this.input.keyboard.once('keydown', closeTutorial);
	}

	_createSceneUI() {
		const { COLORS, FONTS } = GAME_CONFIG;

		const backButton = this.add
			.text(10, 10, I18N.t('backToMenu'), {
				fontSize: FONTS.BACK_BUTTON,
				fill: COLORS.TEXT_WHITE,
				backgroundColor: COLORS.BACK_BUTTON_BG,
				padding: { x: 10, y: 5 },
			})
			.setScrollFactor(0)
			.setInteractive();

		backButton.on('pointerover', () => backButton.setStyle({ fill: COLORS.BACK_BUTTON_HOVER }));
		backButton.on('pointerout', () => backButton.setStyle({ fill: COLORS.TEXT_WHITE }));
		backButton.on('pointerdown', () => this.scene.start('MainMenuScene'));

		this.add
			.text(10, 50, I18N.t('arrowKeysToMove'), {
				fontSize: FONTS.INSTRUCTIONS,
				fill: COLORS.TEXT_WHITE,
				backgroundColor: 'rgba(0,0,0,0.5)',
				padding: { x: 5, y: 2 },
			})
			.setScrollFactor(0);
	}

	update() {
		this.playerManager.handleMovement(this.touchControls);

		const touchInteract = this.touchControls.isActive && this.touchControls.consumeInteract();
		if (this.npcManager.checkInteraction(this.interactKey, touchInteract)) {
			this.chatUI.lastNpcResponse = I18N.t('riddleIntro');
			this.chatUI.conversationHistory = [];
			this.chatUI.open();
			this.sound_mgr.playConversationStart();
		}

		this.npcManager.update();
	}
}

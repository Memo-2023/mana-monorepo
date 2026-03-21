class ChatUI {
	/** @param {RPGScene} scene */
	constructor(scene) {
		this.scene = scene;
		/** @type {string} */
		this.userInput = '';
		/** @type {string} */
		this.lastNpcResponse = '';
		/** @type {ConversationEntry[]} */
		this.conversationHistory = [];

		/** @type {Record<string, Phaser.GameObjects.GameObject>} */
		this.elements = {};
	}

	create() {
		const { CHAT_HEIGHT, CHAT_PADDING, CHAT_SEND_BUTTON_WIDTH, CHAT_INPUT_HEIGHT, COLORS, FONTS } =
			GAME_CONFIG;
		const width = this.scene.cameras.main.width;
		const height = this.scene.cameras.main.height;
		const chatWidth = width - CHAT_PADDING * 2;
		const chatTop = height - CHAT_HEIGHT - CHAT_PADDING;

		// Chat-Hintergrund
		this.elements.background = this.scene.add.graphics();
		this.elements.background.fillStyle(COLORS.CHAT_BG, COLORS.CHAT_BG_ALPHA);
		this.elements.background.fillRoundedRect(CHAT_PADDING, chatTop, chatWidth, CHAT_HEIGHT, 10);
		this.elements.background.lineStyle(2, COLORS.CHAT_BORDER, 1);
		this.elements.background.strokeRoundedRect(CHAT_PADDING, chatTop, chatWidth, CHAT_HEIGHT, 10);
		this.elements.background.setScrollFactor(0);
		this.elements.background.setVisible(false);

		// Titel
		this.elements.title = this.scene.add.text(width / 2, chatTop + 20, I18N.t('chatTitle'), {
			fontSize: FONTS.CHAT_TITLE,
			fontFamily: 'Arial',
			fontStyle: 'bold',
			fill: COLORS.TEXT_WHITE,
			align: 'center',
		});
		this.elements.title.setOrigin(0.5, 0.5);
		this.elements.title.setScrollFactor(0);
		this.elements.title.setVisible(false);

		// NPC-Antwortbereich
		this.elements.response = this.scene.add.text(CHAT_PADDING + 15, chatTop + 50, '', {
			fontSize: FONTS.CHAT_RESPONSE,
			fontFamily: 'Arial',
			fill: COLORS.TEXT_NPC_RESPONSE,
			padding: { x: 10, y: 10 },
			wordWrap: { width: chatWidth - 50 },
			lineSpacing: 6,
		});
		this.elements.response.setScrollFactor(0);
		this.elements.response.setVisible(false);

		// Trennlinie
		this.elements.divider = this.scene.add.graphics();
		this.elements.divider.lineStyle(1, COLORS.CHAT_BORDER, 0.8);
		this.elements.divider.lineBetween(
			CHAT_PADDING + 15,
			height - 90,
			width - CHAT_PADDING - 15,
			height - 90
		);
		this.elements.divider.setScrollFactor(0);
		this.elements.divider.setVisible(false);

		// Eingabefeld-Hintergrund
		this.elements.inputBg = this.scene.add.graphics();
		this.elements.inputBg.fillStyle(COLORS.INPUT_BG, 1);
		this.elements.inputBg.fillRoundedRect(
			CHAT_PADDING + 15,
			height - 70,
			chatWidth - 230,
			CHAT_INPUT_HEIGHT,
			5
		);
		this.elements.inputBg.setScrollFactor(0);
		this.elements.inputBg.setVisible(false);

		// Eingabefeld-Text
		this.elements.input = this.scene.add.text(
			CHAT_PADDING + 25,
			height - 65,
			I18N.t('typePlaceholder'),
			{
				fontSize: FONTS.CHAT_INPUT,
				fontFamily: 'Arial',
				fill: COLORS.TEXT_PLACEHOLDER,
				padding: { x: 5, y: 5 },
			}
		);
		this.elements.input.setScrollFactor(0);
		this.elements.input.setVisible(false);

		// Senden-Button
		this._createSendButton(width, height, chatWidth);

		// Schließen-Button
		this._createCloseButton(width, height, chatTop);

		// Tastatureingabe
		this.scene.input.keyboard.on('keydown', (event) => this._handleKeyInput(event), this);
	}

	_createSendButton(width, height, chatWidth) {
		const { CHAT_PADDING, CHAT_SEND_BUTTON_WIDTH, CHAT_INPUT_HEIGHT, COLORS, FONTS } = GAME_CONFIG;
		const btnX = width - CHAT_PADDING - CHAT_SEND_BUTTON_WIDTH - 15;

		this.elements.sendBg = this.scene.add.graphics();
		this.elements.sendBg.fillStyle(COLORS.SEND_BUTTON, 1);
		this.elements.sendBg.fillRoundedRect(
			btnX,
			height - 70,
			CHAT_SEND_BUTTON_WIDTH,
			CHAT_INPUT_HEIGHT,
			5
		);
		this.elements.sendBg.setScrollFactor(0);
		this.elements.sendBg.setVisible(false);

		this.elements.sendBtn = this.scene.add.text(
			btnX + CHAT_SEND_BUTTON_WIDTH / 2,
			height - 50,
			I18N.t('send'),
			{
				fontSize: FONTS.CHAT_INPUT,
				fontFamily: 'Arial',
				fontStyle: 'bold',
				fill: COLORS.TEXT_WHITE,
			}
		);
		this.elements.sendBtn.setOrigin(0.5, 0.5);
		this.elements.sendBtn.setScrollFactor(0);
		this.elements.sendBtn.setVisible(false);
		this.elements.sendBtn.setInteractive({ useHandCursor: true });
		this.elements.sendBtn.on('pointerdown', () => this.sendMessage());

		this.elements.sendBtn.on('pointerover', () => {
			this.elements.sendBg.clear();
			this.elements.sendBg.fillStyle(COLORS.SEND_BUTTON_HOVER, 1);
			this.elements.sendBg.fillRoundedRect(
				btnX,
				height - 70,
				CHAT_SEND_BUTTON_WIDTH,
				CHAT_INPUT_HEIGHT,
				5
			);
		});
		this.elements.sendBtn.on('pointerout', () => {
			this.elements.sendBg.clear();
			this.elements.sendBg.fillStyle(COLORS.SEND_BUTTON, 1);
			this.elements.sendBg.fillRoundedRect(
				btnX,
				height - 70,
				CHAT_SEND_BUTTON_WIDTH,
				CHAT_INPUT_HEIGHT,
				5
			);
		});
	}

	_createCloseButton(width, height, chatTop) {
		const { CHAT_PADDING, COLORS } = GAME_CONFIG;
		const size = 24;
		const pad = 10;
		const cx = width - CHAT_PADDING - pad;
		const cy = chatTop + pad + size / 2;

		this.elements.closeBg = this.scene.add.graphics();
		this.elements.closeBg.fillStyle(COLORS.CLOSE_BUTTON, 0.7);
		this.elements.closeBg.fillCircle(cx, cy, size / 2);
		this.elements.closeBg.setScrollFactor(0);
		this.elements.closeBg.setVisible(false);

		this.elements.closeIcon = this.scene.add.graphics();
		this.elements.closeIcon.lineStyle(3, 0xffffff, 1);
		this.elements.closeIcon.lineBetween(cx - size / 3, cy - size / 6, cx + size / 3, cy + size / 6);
		this.elements.closeIcon.lineBetween(cx + size / 3, cy - size / 6, cx - size / 3, cy + size / 6);
		this.elements.closeIcon.setScrollFactor(0);
		this.elements.closeIcon.setVisible(false);

		this.elements.closeHit = this.scene.add.rectangle(cx, cy, size * 1.5, size * 1.5);
		this.elements.closeHit.setScrollFactor(0);
		this.elements.closeHit.setVisible(false);
		this.elements.closeHit.setInteractive({ useHandCursor: true });
		this.elements.closeHit.on('pointerdown', () => this.close());

		this.elements.closeHit.on('pointerover', () => {
			this.elements.closeBg.clear();
			this.elements.closeBg.fillStyle(COLORS.CLOSE_BUTTON_HOVER, 0.9);
			this.elements.closeBg.fillCircle(cx, cy, (size / 2) * 1.1);
		});
		this.elements.closeHit.on('pointerout', () => {
			this.elements.closeBg.clear();
			this.elements.closeBg.fillStyle(COLORS.CLOSE_BUTTON, 0.7);
			this.elements.closeBg.fillCircle(cx, cy, size / 2);
		});
	}

	open() {
		Object.values(this.elements).forEach((el) => el.setVisible(true));

		this.userInput = '';
		this.elements.input.setText(I18N.t('typePlaceholder'));
		this.elements.input.setStyle({ fill: GAME_CONFIG.COLORS.TEXT_PLACEHOLDER });
		this.elements.response.setText(this.lastNpcResponse || I18N.t('talkToNpc'));
		this.elements.title.setText(I18N.t('chatWithUnknown'));
	}

	close() {
		Object.values(this.elements).forEach((el) => el.setVisible(false));

		const npcManager = this.scene.npcManager;
		npcManager.state.isInConversation = false;
		npcManager.npcDialog.setVisible(false);
	}

	_handleKeyInput(event) {
		if (!this.elements.input.visible) return;

		if (event.keyCode === 13) {
			this.sendMessage();
			return;
		}

		if (event.keyCode === 27) {
			this.close();
			return;
		}

		if (event.keyCode === 8 && this.userInput.length > 0) {
			this.userInput = this.userInput.slice(0, -1);
		} else if (event.keyCode >= 32 && event.keyCode <= 126) {
			this.userInput += event.key;
		}

		const { COLORS } = GAME_CONFIG;

		if (this.userInput.length === 0) {
			this.elements.input.setText(I18N.t('typePlaceholder'));
			this.elements.input.setStyle({ fill: COLORS.TEXT_PLACEHOLDER });
		} else {
			this.elements.input.setText(this.userInput);
			this.elements.input.setStyle({ fill: COLORS.TEXT_WHITE });

			this.scene.tweens.add({
				targets: this.elements.inputBg,
				alpha: 0.7,
				duration: 50,
				yoyo: true,
				ease: 'Power1',
			});
		}
	}

	async sendMessage() {
		const npcManager = this.scene.npcManager;
		if (this.userInput.length === 0 || npcManager.state.isWaitingForResponse) return;

		const message = this.userInput;
		this.userInput = '';

		this.conversationHistory.push({ type: 'user', message });
		npcManager.currentGuessCount++;
		this.elements.input.setText('');
		npcManager.state.isWaitingForResponse = true;

		if (this.scene.sound_mgr) this.scene.sound_mgr.playMessageSend();

		// Typing-Indicator anzeigen
		this._updateChatDisplay(`${I18N.t('you')}: ${message}\n\n...`);
		this._startTypingAnimation();

		try {
			const npc = npcManager.currentNpc;
			const response = await fetch(GAME_CONFIG.API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message,
					conversationHistory: this.conversationHistory,
					characterName: npc ? npc.characterName : null,
					characterPersonality: npc ? npc.characterPersonality : null,
				}),
			});

			const data = await response.json();
			let npcResponse = I18N.t('errorNoResponse');

			if (data.response) {
				npcResponse = data.response;
				this.conversationHistory.push({ type: 'npc', message: npcResponse });

				if (this.scene.sound_mgr) this.scene.sound_mgr.playMessageReceive();

				if (data.identityRevealed) {
					console.log('Identität aufgedeckt!');
					npcManager.revealIdentity();

					if (this.elements.title && this.elements.title.visible) {
						this.elements.title.setText(`${I18N.t('chatWith')} ${npc.characterName}`);
					}
				}
			}

			this.lastNpcResponse = npcResponse;
			this._stopTypingAnimation();
			this._updateChatDisplay();
		} catch (error) {
			console.error('Fehler beim Senden der Nachricht:', error);
			const errorMsg = I18N.t('errorCantRespond');
			this.lastNpcResponse = errorMsg;
			this.conversationHistory.push({ type: 'npc', message: errorMsg });
			this._stopTypingAnimation();
			this._updateChatDisplay();
		}

		npcManager.state.isWaitingForResponse = false;
		this.elements.input.setText(I18N.t('typePlaceholder'));
		this.elements.input.setStyle({ fill: GAME_CONFIG.COLORS.TEXT_PLACEHOLDER });
	}

	/** Zeigt die letzten Nachrichten der Konversation im Chat-Bereich */
	_updateChatDisplay(customText) {
		if (!this.elements.response || !this.elements.response.visible) return;

		if (customText) {
			this.elements.response.setText(customText);
			return;
		}

		// Zeige die letzten 3 Nachrichten
		const recent = this.conversationHistory.slice(-4);
		const lines = recent.map((entry) => {
			const prefix = entry.type === 'user' ? I18N.t('you') : I18N.t('unknown');
			return `${prefix}: ${entry.message}`;
		});

		this.elements.response.setText(lines.join('\n\n'));
	}

	_startTypingAnimation() {
		this._typingDots = 0;
		this._typingTimer = this.scene.time.addEvent({
			delay: 400,
			callback: () => {
				this._typingDots = (this._typingDots + 1) % 4;
				const dots = '.'.repeat(this._typingDots || 1);
				const lastUserMsg = this.conversationHistory.filter((e) => e.type === 'user').pop();
				if (lastUserMsg && this.elements.response.visible) {
					this.elements.response.setText(`${I18N.t('you')}: ${lastUserMsg.message}\n\n${dots}`);
				}
			},
			loop: true,
		});
	}

	_stopTypingAnimation() {
		if (this._typingTimer) {
			this._typingTimer.destroy();
			this._typingTimer = null;
		}
	}
}

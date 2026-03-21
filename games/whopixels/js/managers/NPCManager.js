class NPCManager {
	/** @param {RPGScene} scene */
	constructor(scene) {
		this.scene = scene;
		/** @type {Phaser.Physics.Arcade.Sprite[]} */
		this.npcs = [];
		/** @type {Phaser.Physics.Arcade.Sprite & {characterId: number, characterName: string, characterPersonality: string, debugText: Phaser.GameObjects.Text}} */
		this.currentNpc = null;
		/** @type {NPCCharacter[]} */
		this.npcCharacters = [];
		/** @type {NPCState} */
		this.state = {
			isInConversation: false,
			isWaitingForResponse: false,
			identityRevealed: false,
			discoveredNPCs: [],
			currentNpcIndex: -1,
		};
		/** @type {number} Anzahl gesendeter Nachrichten für den aktuellen NPC */
		this.currentGuessCount = 0;
		this.npcDialog = null;
		this.interactionPrompt = null;

		// Partikel-Pool (wiederverwendbar)
		/** @type {Phaser.GameObjects.Particles.ParticleEmitterManager|null} */
		this._particlePool = null;
		/** @type {Phaser.GameObjects.Particles.ParticleEmitter|null} */
		this._emitter = null;
	}

	/**
	 * @param {Phaser.Physics.Arcade.Sprite} player
	 * @param {Phaser.Physics.Arcade.StaticGroup} obstacles
	 */
	create(player, obstacles) {
		this.player = player;
		this.obstacles = obstacles;

		// Lade NPC-Charaktere
		this.npcCharacters = window.npcCharacters || [];
		if (!this.npcCharacters || this.npcCharacters.length === 0) {
			console.error('Keine NPC-Charaktere gefunden!');
			this.npcCharacters = [
				{
					id: 1,
					name: 'Leonardo da Vinci',
					personality: 'Ein vielseitiger Universalgelehrter der Renaissance.',
					hint: 'Meine Skizzenbücher enthalten Flugmaschinen und anatomische Studien.',
				},
				{
					id: 2,
					name: 'Nikola Tesla',
					personality: 'Ein exzentrischer Elektroingenieur mit visionären Ideen.',
					hint: 'Meine Arbeiten mit Wechselstrom revolutionierten die Energienutzung.',
				},
			];
		}

		console.log('NPC-Charaktere geladen:', this.npcCharacters.length);

		// Dialog-Box
		this.npcDialog = this.scene.add.text(0, 0, I18N.t('pressEToTalk'), {
			fontSize: '12px',
			fill: GAME_CONFIG.COLORS.TEXT_WHITE,
			backgroundColor: '#000',
			padding: { x: 5, y: 5 },
			wordWrap: { width: 200 },
		});
		this.npcDialog.setVisible(false);

		// Interaktions-Prompt
		this.interactionPrompt = this.scene.add.text(0, 0, I18N.t('pressEToTalk'), {
			fontSize: GAME_CONFIG.FONTS.NPC_LABEL,
			fill: GAME_CONFIG.COLORS.TEXT_WHITE,
			backgroundColor: '#000',
			padding: { x: 3, y: 3 },
		});
		this.interactionPrompt.setVisible(false);

		// Partikel-Pool erstellen (einmalig)
		this._initParticlePool();

		this.spawnNewNPC();
	}

	_initParticlePool() {
		this._particlePool = this.scene.add.particles('particle');
		if (this._particlePool.createEmitter) {
			this._emitter = this._particlePool.createEmitter({
				speed: { min: 50, max: 100 },
				angle: { min: 0, max: 360 },
				scale: { start: 0.5, end: 0 },
				blendMode: 'ADD',
				lifespan: GAME_CONFIG.ANIMATIONS.PARTICLE_LIFETIME,
				gravityY: 0,
				on: false, // Startet deaktiviert
			});
		}
	}

	spawnNewNPC() {
		const { NPC_SCALE, TILE_SIZE, COLORS, FONTS, ANIMATIONS } = GAME_CONFIG;

		// Verfügbare Charaktere filtern
		let availableCharacters = this.npcCharacters.filter(
			(char) => !this.state.discoveredNPCs.includes(char.id)
		);

		if (this.currentNpc && this.currentNpc.characterId) {
			availableCharacters = availableCharacters.filter(
				(char) => char.id !== this.currentNpc.characterId
			);
		}

		// Fallback
		if (availableCharacters.length === 0) {
			availableCharacters = this.npcCharacters.filter((char) => {
				return !(this.currentNpc && this.currentNpc.characterId === char.id);
			});
			if (availableCharacters.length === 0) return null;
		}

		const selectedCharacter =
			availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
		console.log('Ausgewählter Charakter:', selectedCharacter.name);

		const map = this.scene.worldManager.map;
		const doorX = Math.floor(map.widthInPixels / 2);
		const doorY = TILE_SIZE;

		// NPC erstellen
		const newNpc = this.scene.physics.add.sprite(doorX, doorY, 'npc_down');
		newNpc.setScale(NPC_SCALE);
		newNpc.setTint(COLORS.NPC_ANONYMOUS_TINT);

		newNpc.characterId = selectedCharacter.id;
		newNpc.characterName = selectedCharacter.name;
		newNpc.characterPersonality = selectedCharacter.personality;

		// Einlauf-Animation
		this.scene.tweens.add({
			targets: newNpc,
			y: map.heightInPixels / 2,
			duration: GAME_CONFIG.NPC_WALK_DURATION,
			ease: 'Linear',
			onUpdate: () => {
				if (newNpc.debugText) {
					newNpc.debugText.x = newNpc.x;
					newNpc.debugText.y = newNpc.y + 20;
				}
				if (Math.floor(Date.now() / 150) % 2 === 0) {
					newNpc.setTexture('npc_down');
				} else if (this.scene.textures.exists('npc_down_walk')) {
					newNpc.setTexture('npc_down_walk');
				}
			},
		});

		// Name-Label
		const debugText = this.scene.add.text(doorX, doorY + 20, I18N.t('anonymous'), {
			fontSize: FONTS.NPC_LABEL,
			fontFamily: 'Arial',
			fill: COLORS.TEXT_WHITE,
			stroke: '#000000',
			strokeThickness: 2,
			align: 'center',
		});
		debugText.setOrigin(0.5, 0);
		newNpc.debugText = debugText;

		// Kollisionen
		if (this.obstacles) {
			this.scene.physics.add.collider(newNpc, this.obstacles);
		}
		if (this.player) {
			this.scene.physics.add.collider(
				newNpc,
				this.player,
				() => this.showInteractionPrompt(),
				null,
				this
			);
		}

		this.npcs.push(newNpc);
		this.currentNpc = newNpc;
		this.state.currentNpcIndex = this.npcs.length - 1;
		this.currentGuessCount = 0;

		return newNpc;
	}

	showInteractionPrompt() {
		if (!this.currentNpc || !this.player) return;

		this.interactionPrompt.setPosition(
			this.currentNpc.x - this.interactionPrompt.width / 2,
			this.currentNpc.y - 40
		);
		this.interactionPrompt.setVisible(true);

		this.scene.time.delayedCall(GAME_CONFIG.ANIMATIONS.INTERACTION_PROMPT_DURATION, () => {
			this.interactionPrompt.setVisible(false);
		});
	}

	startConversation() {
		if (!this.currentNpc || !this.player || this.state.isInConversation) return;

		this.player.setVelocity(0);
		this.currentNpc.setVelocity(0);

		if (this.player.x < this.currentNpc.x) {
			this.currentNpc.setTexture('npc_up');
		} else {
			this.currentNpc.setTexture('npc_down');
		}

		this.state.isInConversation = true;
		return true;
	}

	moveRandomly() {
		if (!this.currentNpc) return;

		this.currentNpc.setVelocity(0);

		if (Math.random() < GAME_CONFIG.NPC_MOVE_CHANCE) {
			const speed = GAME_CONFIG.NPC_SPEED;
			const direction = Math.floor(Math.random() * 4);

			switch (direction) {
				case 0:
					this.currentNpc.setVelocityY(-speed);
					this.currentNpc.setTexture('npc_up');
					break;
				case 1:
					this.currentNpc.setVelocityX(speed);
					this.currentNpc.setTexture('npc_down');
					break;
				case 2:
					this.currentNpc.setVelocityY(speed);
					this.currentNpc.setTexture('npc_down');
					break;
				case 3:
					this.currentNpc.setVelocityX(-speed);
					this.currentNpc.setTexture('npc_up');
					break;
			}

			this.scene.time.delayedCall(1000 + Math.random() * 1000, () => {
				if (this.currentNpc) this.currentNpc.setVelocity(0);
			});
		}
	}

	revealIdentity() {
		const { COLORS, FONTS, ANIMATIONS } = GAME_CONFIG;

		this.state.identityRevealed = true;

		if (this.currentNpc && this.currentNpc.characterId) {
			if (!this.state.discoveredNPCs.includes(this.currentNpc.characterId)) {
				this.state.discoveredNPCs.push(this.currentNpc.characterId);
				console.log(`NPC ${this.currentNpc.characterName} wurde entdeckt!`);
			}

			// Fortschritt speichern
			if (this.scene.storage) {
				this.scene.storage.recordDiscovery(this.currentNpc.characterId, this.currentGuessCount);
			}
		}

		this.currentNpc.clearTint();

		// Reveal-Sound abspielen
		if (this.scene.sound_mgr) this.scene.sound_mgr.playReveal();

		// Name-Label aktualisieren
		if (this.currentNpc.debugText) {
			this.currentNpc.debugText.setText(this.currentNpc.characterName);
			this.currentNpc.debugText.setStyle({
				fontSize: FONTS.NPC_LABEL_REVEALED,
				fontFamily: 'Arial',
				fontStyle: 'bold',
				fill: COLORS.TEXT_REVEALED,
				stroke: '#000000',
				strokeThickness: 3,
				align: 'center',
			});
		}

		// Gelber Blitz
		this.currentNpc.setTint(COLORS.REVEAL_FLASH);
		this.scene.time.delayedCall(ANIMATIONS.REVEAL_FLASH_DURATION, () => {
			if (this.state.identityRevealed) {
				this.currentNpc.clearTint();
			}
		});

		// Partikeleffekt (wiederverwendbarer Pool)
		if (this._emitter) {
			this._emitter.setPosition(this.currentNpc.x, this.currentNpc.y);
			this._emitter.start();
			this.scene.time.delayedCall(ANIMATIONS.PARTICLE_STOP_DELAY, () => {
				if (this._emitter) this._emitter.stop();
			});
		}

		// Enthüllungs-Text
		const revealText = this.scene.add.text(
			this.scene.cameras.main.width / 2,
			this.scene.cameras.main.height / 3,
			I18N.t('youRevealed', { name: this.currentNpc.characterName }),
			{
				fontSize: FONTS.REVEAL_TEXT,
				fontFamily: 'Arial',
				fontStyle: 'bold',
				fill: COLORS.TEXT_REVEALED,
				stroke: '#000000',
				strokeThickness: 4,
				align: 'center',
			}
		);
		revealText.setOrigin(0.5);
		revealText.setScrollFactor(0);

		this.scene.tweens.add({
			targets: revealText,
			alpha: 0,
			duration: ANIMATIONS.REVEAL_TEXT_FADE_DURATION,
			delay: ANIMATIONS.REVEAL_TEXT_DELAY,
			onComplete: () => {
				revealText.destroy();

				this.scene.time.delayedCall(ANIMATIONS.NEW_NPC_SPAWN_DELAY, () => {
					const newNpc = this.spawnNewNPC();
					if (newNpc) {
						const newNpcText = this.scene.add.text(
							this.scene.cameras.main.width / 2,
							this.scene.cameras.main.height / 3,
							I18N.t('newNpcAppeared'),
							{
								fontSize: FONTS.NEW_NPC_TEXT,
								fontFamily: 'Arial',
								fontStyle: 'bold',
								fill: COLORS.TEXT_WHITE,
								stroke: '#000000',
								strokeThickness: 3,
								align: 'center',
							}
						);
						newNpcText.setOrigin(0.5);
						newNpcText.setScrollFactor(0);

						this.scene.tweens.add({
							targets: newNpcText,
							alpha: 0,
							duration: ANIMATIONS.NEW_NPC_TEXT_FADE_DURATION,
							delay: ANIMATIONS.NEW_NPC_TEXT_DELAY,
							onComplete: () => newNpcText.destroy(),
						});
					}
				});
			},
		});
	}

	/**
	 * @param {Phaser.Input.Keyboard.Key} interactKey
	 * @param {boolean} [touchInteract=false]
	 */
	checkInteraction(interactKey, touchInteract = false) {
		const keyPressed = interactKey && Phaser.Input.Keyboard.JustDown(interactKey);
		if ((keyPressed || touchInteract) && this.npcs.length > 0) {
			let closestNPC = null;
			let closestDistance = GAME_CONFIG.NPC_INTERACTION_DISTANCE;

			for (let i = 0; i < this.npcs.length; i++) {
				const npc = this.npcs[i];
				const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestNPC = npc;
					this.state.currentNpcIndex = i;
				}
			}

			if (closestNPC) {
				this.currentNpc = closestNPC;
				return this.startConversation();
			}
		}
		return false;
	}

	update() {
		if (this.npcDialog && this.npcDialog.visible && this.currentNpc) {
			this.npcDialog.setPosition(this.currentNpc.x - 100, this.currentNpc.y - 50);
		}

		if (this.interactionPrompt && this.interactionPrompt.visible && this.currentNpc) {
			this.interactionPrompt.setPosition(this.currentNpc.x - 50, this.currentNpc.y - 30);
		}

		// Fragezeichen-Icon über NPCs in Reichweite
		this.npcs.forEach((npc) => {
			if (npc.debugText) {
				npc.debugText.setPosition(npc.x, npc.y + 20);
			}

			if (this.player && !this.state.isInConversation) {
				const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

				if (distance < GAME_CONFIG.NPC_INTERACTION_DISTANCE) {
					if (!npc.questionMark) {
						npc.questionMark = this.scene.add.text(npc.x, npc.y - 35, '?', {
							fontSize: '24px',
							fontFamily: 'Arial',
							fontStyle: 'bold',
							fill: GAME_CONFIG.COLORS.TEXT_REVEALED,
							stroke: '#000000',
							strokeThickness: 3,
						});
						npc.questionMark.setOrigin(0.5);

						// Schwebe-Animation
						this.scene.tweens.add({
							targets: npc.questionMark,
							y: npc.y - 45,
							duration: 800,
							yoyo: true,
							repeat: -1,
							ease: 'Sine.easeInOut',
						});
					}
					npc.questionMark.setPosition(npc.x, npc.questionMark.y);
				} else if (npc.questionMark) {
					npc.questionMark.destroy();
					npc.questionMark = null;
				}
			}
		});
	}
}

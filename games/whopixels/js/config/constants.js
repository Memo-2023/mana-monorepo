/**
 * @typedef {Object} NPCCharacter
 * @property {number} id
 * @property {string} name
 * @property {string} personality
 * @property {string} hint
 */

/**
 * @typedef {Object} NPCState
 * @property {boolean} isInConversation
 * @property {boolean} isWaitingForResponse
 * @property {boolean} identityRevealed
 * @property {number[]} discoveredNPCs
 * @property {number} currentNpcIndex
 */

/**
 * @typedef {Object} ConversationEntry
 * @property {'user'|'npc'} type
 * @property {string} message
 */

/**
 * @typedef {Object} MapConfig
 * @property {number} widthInPixels
 * @property {number} heightInPixels
 * @property {number} tileWidth
 * @property {number} tileHeight
 */

/** @type {Readonly<typeof GAME_CONFIG>} */
const GAME_CONFIG = {
	// Spielfeld
	GRID_SIZE: 11,
	TILE_SIZE: 40,
	get MAP_WIDTH() {
		return this.GRID_SIZE * this.TILE_SIZE;
	},
	get MAP_HEIGHT() {
		return this.GRID_SIZE * this.TILE_SIZE;
	},

	// Spieler
	PLAYER_SCALE: 2.4,
	PLAYER_SPEED: 160,

	// NPC
	NPC_SCALE: 2.4,
	NPC_SPEED: 50,
	NPC_MOVE_INTERVAL: 3000,
	NPC_MOVE_CHANCE: 0.3,
	NPC_INTERACTION_DISTANCE: 100,
	NPC_WALK_DURATION: 2000,

	// Tiles
	TILE_SCALE: 2.0,

	// Chat-UI
	CHAT_HEIGHT: 250,
	CHAT_PADDING: 20,
	CHAT_INPUT_HEIGHT: 40,
	CHAT_SEND_BUTTON_WIDTH: 85,

	// Farben
	COLORS: {
		CHAT_BG: 0x1a1a2a,
		CHAT_BG_ALPHA: 0.9,
		CHAT_BORDER: 0x4a6fa5,
		INPUT_BG: 0x2a2a3a,
		SEND_BUTTON: 0x4a6fa5,
		SEND_BUTTON_HOVER: 0x5a7fb5,
		CLOSE_BUTTON: 0x8a4a4a,
		CLOSE_BUTTON_HOVER: 0x9a5a5a,
		NPC_ANONYMOUS_TINT: 0x000000,
		REVEAL_FLASH: 0xffff00,
		TEXT_WHITE: '#ffffff',
		TEXT_PLACEHOLDER: '#bbbbbb',
		TEXT_NPC_RESPONSE: '#e0e0ff',
		TEXT_REVEALED: '#ffff00',
		BACK_BUTTON_BG: '#4a4a4a',
		BACK_BUTTON_HOVER: '#ff0',
	},

	// Schriftgrößen
	FONTS: {
		CHAT_TITLE: '18px',
		CHAT_INPUT: '16px',
		CHAT_RESPONSE: '16px',
		NPC_LABEL: '10px',
		NPC_LABEL_REVEALED: '12px',
		BACK_BUTTON: '18px',
		INSTRUCTIONS: '16px',
		REVEAL_TEXT: '24px',
		NEW_NPC_TEXT: '20px',
	},

	// Animationen
	ANIMATIONS: {
		REVEAL_FLASH_DURATION: 300,
		REVEAL_TEXT_FADE_DURATION: 2000,
		REVEAL_TEXT_DELAY: 3000,
		NEW_NPC_SPAWN_DELAY: 1000,
		NEW_NPC_TEXT_FADE_DURATION: 1500,
		NEW_NPC_TEXT_DELAY: 2500,
		PARTICLE_LIFETIME: 1000,
		PARTICLE_STOP_DELAY: 2000,
		INTERACTION_PROMPT_DURATION: 2000,
	},

	// Terrain-Verteilung
	TERRAIN: {
		WALL_MOSS_CHANCE: 0.3,
		GRASS_CHANCE: 0.4,
		GRASS_FLOWER_CHANCE: 0.7,
		DIRT_CHANCE: 0.9,
	},

	// API
	API_URL: 'http://localhost:3000/api/chat',
};

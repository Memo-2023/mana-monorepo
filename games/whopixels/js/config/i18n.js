/**
 * Einfaches i18n-System für WhoPixels.
 * Unterstützt Deutsch und Englisch.
 */
const I18N = {
	_currentLang: 'de',

	translations: {
		de: {
			// Hauptmenü
			title: 'WhoPixels',
			subtitle: 'Ein Pixel-Abenteuer',
			startGame: 'RPG Spiel starten',
			pixelEditor: 'Pixel Editor',
			resetProgress: 'Fortschritt zurücksetzen',
			progressReset: 'Fortschritt zurückgesetzt!',
			statsRevealed: 'Entlarvt',
			statsAvgGuesses: 'Durchschn. Fragen',
			statsBestStreak: 'Beste Serie',

			// RPG Scene
			backToMenu: 'Zurück zum Menü',
			arrowKeysToMove: 'Pfeiltasten zum Bewegen',
			pressEToTalk: 'Drücke E zum Sprechen',

			// Chat
			chatTitle: 'Gespräch mit NPC',
			chatWithUnknown: 'Gespräch mit Unbekanntem',
			chatWith: 'Gespräch mit',
			typePlaceholder: 'Tippe deine Nachricht hier ein...',
			sending: 'Nachricht wird gesendet...',
			send: 'Senden',
			talkToNpc: 'Sprich mit dem NPC...',
			riddleIntro: 'Verhüllt von Zeit,\nwer könnt es sein?',
			errorNoResponse: 'Entschuldigung, ich habe dich nicht verstanden.',
			errorCantRespond: 'Entschuldigung, ich kann gerade nicht antworten.',
			you: 'Du',
			unknown: '???',

			// NPC
			anonymous: 'Anonym',
			revealed: 'entlarvt',
			youRevealed: 'Du hast {name} entlarvt!',
			newNpcAppeared: 'Ein neuer geheimnisvoller NPC ist erschienen!',
			saveLoaded: 'Spielstand geladen: {count} NPCs bereits entdeckt',

			// Tutorial
			tutorialWelcome: 'Willkommen bei WhoPixels!',
			tutorialDesc:
				'Geheimnisvolle Figuren betreten die Arena.\nFinde durch Fragen heraus, wer sie sind!',
			tutorialControlsDesktop: 'Pfeiltasten = Bewegen\nE = Mit NPC sprechen',
			tutorialControlsMobile: 'Joystick links = Bewegen\nButton rechts = Interagieren',
			tutorialStart: 'Tippe oder drücke eine Taste zum Starten',

			// Pixel Editor
			editorTitle: 'Pixel Editor',
			back: 'Zurück',
			clear: 'Löschen',
			saveAsAvatar: 'Als Avatar',
			load: 'Laden',
			colors: 'Farben',
			gridCleared: 'Grid gelöscht',
			avatarSaved: 'Avatar gespeichert! Wird im RPG-Spiel verwendet.',
			avatarLoaded: 'Avatar geladen!',
			noAvatarFound: 'Kein gespeicherter Avatar gefunden',
			saveError: 'Fehler beim Speichern!',
			loadError: 'Fehler beim Laden!',
		},

		en: {
			// Main Menu
			title: 'WhoPixels',
			subtitle: 'A Pixel Adventure',
			startGame: 'Start RPG Game',
			pixelEditor: 'Pixel Editor',
			resetProgress: 'Reset Progress',
			progressReset: 'Progress reset!',
			statsRevealed: 'Revealed',
			statsAvgGuesses: 'Avg. Questions',
			statsBestStreak: 'Best Streak',

			// RPG Scene
			backToMenu: 'Back to Menu',
			arrowKeysToMove: 'Arrow keys to move',
			pressEToTalk: 'Press E to talk',

			// Chat
			chatTitle: 'Chat with NPC',
			chatWithUnknown: 'Chat with Unknown',
			chatWith: 'Chat with',
			typePlaceholder: 'Type your message here...',
			sending: 'Sending message...',
			send: 'Send',
			talkToNpc: 'Talk to the NPC...',
			riddleIntro: 'Veiled by time,\nwho could it be?',
			errorNoResponse: "Sorry, I didn't understand you.",
			errorCantRespond: "Sorry, I can't respond right now.",
			you: 'You',
			unknown: '???',

			// NPC
			anonymous: 'Anonymous',
			revealed: 'revealed',
			youRevealed: 'You revealed {name}!',
			newNpcAppeared: 'A new mysterious NPC has appeared!',
			saveLoaded: 'Save loaded: {count} NPCs already discovered',

			// Tutorial
			tutorialWelcome: 'Welcome to WhoPixels!',
			tutorialDesc: 'Mysterious figures enter the arena.\nAsk questions to find out who they are!',
			tutorialControlsDesktop: 'Arrow keys = Move\nE = Talk to NPC',
			tutorialControlsMobile: 'Left joystick = Move\nRight button = Interact',
			tutorialStart: 'Tap or press any key to start',

			// Pixel Editor
			editorTitle: 'Pixel Editor',
			back: 'Back',
			clear: 'Clear',
			saveAsAvatar: 'Save Avatar',
			load: 'Load',
			colors: 'Colors',
			gridCleared: 'Grid cleared',
			avatarSaved: 'Avatar saved! Will be used in RPG game.',
			avatarLoaded: 'Avatar loaded!',
			noAvatarFound: 'No saved avatar found',
			saveError: 'Error saving!',
			loadError: 'Error loading!',
		},
	},

	/**
	 * Sprache wechseln
	 * @param {'de'|'en'} lang
	 */
	setLanguage(lang) {
		if (this.translations[lang]) {
			this._currentLang = lang;
			localStorage.setItem('whopixels_lang', lang);
		}
	},

	/** @returns {'de'|'en'} */
	getLanguage() {
		return this._currentLang;
	},

	/** Sprache aus LocalStorage laden */
	init() {
		const saved = localStorage.getItem('whopixels_lang');
		if (saved && this.translations[saved]) {
			this._currentLang = saved;
		}
	},

	/**
	 * Übersetzung abrufen
	 * @param {string} key
	 * @param {Record<string, string>} [params] - Platzhalter ersetzen, z.B. {name: 'Tesla'}
	 * @returns {string}
	 */
	t(key, params) {
		const lang = this.translations[this._currentLang];
		let text = lang[key] || this.translations.de[key] || key;

		if (params) {
			Object.entries(params).forEach(([k, v]) => {
				text = text.replace(`{${k}}`, v);
			});
		}

		return text;
	},

	/** Sprache umschalten */
	toggle() {
		const next = this._currentLang === 'de' ? 'en' : 'de';
		this.setLanguage(next);
		return next;
	},
};

// Beim Laden initialisieren
I18N.init();

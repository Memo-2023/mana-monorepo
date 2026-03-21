/**
 * Sound-Manager mit programmatisch generierten Sounds (keine externen Dateien nötig).
 * Verwendet die Web Audio API für einfache Synthesizer-Sounds.
 */
class SoundManager {
	constructor() {
		/** @type {AudioContext|null} */
		this.ctx = null;
		this.enabled = true;
		this.volume = 0.3;
	}

	/** AudioContext erst bei erster Nutzer-Interaktion erstellen (Browser-Policy) */
	_ensureContext() {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		}
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
	}

	/**
	 * Spielt einen Ton mit gegebener Frequenz und Dauer
	 * @param {number} frequency - Hz
	 * @param {number} duration - Sekunden
	 * @param {'sine'|'square'|'triangle'|'sawtooth'} type
	 * @param {number} [vol] - Lautstärke 0-1
	 */
	_playTone(frequency, duration, type = 'sine', vol = this.volume) {
		if (!this.enabled) return;
		this._ensureContext();

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

		gain.gain.setValueAtTime(vol, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

		osc.connect(gain);
		gain.connect(this.ctx.destination);

		osc.start(this.ctx.currentTime);
		osc.stop(this.ctx.currentTime + duration);
	}

	/** Gespräch starten */
	playConversationStart() {
		this._playTone(440, 0.15, 'triangle', 0.2);
		setTimeout(() => this._playTone(554, 0.15, 'triangle', 0.2), 100);
	}

	/** Nachricht gesendet */
	playMessageSend() {
		this._playTone(600, 0.08, 'sine', 0.15);
	}

	/** NPC antwortet */
	playMessageReceive() {
		this._playTone(400, 0.1, 'triangle', 0.15);
		setTimeout(() => this._playTone(500, 0.1, 'triangle', 0.15), 80);
	}

	/** Identität aufgedeckt — Fanfare */
	playReveal() {
		const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
		notes.forEach((freq, i) => {
			setTimeout(() => this._playTone(freq, 0.3, 'triangle', 0.25), i * 150);
		});
	}

	/** Neuer NPC erscheint */
	playNewNPC() {
		this._playTone(330, 0.2, 'sine', 0.15);
		setTimeout(() => this._playTone(392, 0.3, 'sine', 0.15), 150);
	}

	/** Spieler bewegt sich (dezent) */
	playStep() {
		this._playTone(100 + Math.random() * 50, 0.05, 'square', 0.05);
	}

	/** Fehler/kann nicht interagieren */
	playError() {
		this._playTone(200, 0.15, 'sawtooth', 0.1);
		setTimeout(() => this._playTone(150, 0.2, 'sawtooth', 0.1), 100);
	}

	toggle() {
		this.enabled = !this.enabled;
		return this.enabled;
	}

	/** @param {number} vol 0-1 */
	setVolume(vol) {
		this.volume = Math.max(0, Math.min(1, vol));
	}
}

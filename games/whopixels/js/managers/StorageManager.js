/**
 * @typedef {Object} GameSaveData
 * @property {number[]} discoveredNPCs - IDs der entdeckten NPCs
 * @property {number} totalGuesses - Gesamtanzahl der Rateversuche
 * @property {number} totalRevealed - Gesamtanzahl aufgedeckter NPCs
 * @property {number} bestStreak - Beste Serie korrekt erratener NPCs
 * @property {number} currentStreak - Aktuelle Serie
 * @property {Record<number, number>} guessesPerNPC - Anzahl Versuche pro NPC (ID -> Anzahl)
 * @property {number} lastPlayed - Timestamp des letzten Spiels
 */

class StorageManager {
	constructor() {
		this.STORAGE_KEY = 'whopixels_save';
	}

	/** @returns {GameSaveData} */
	load() {
		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.error('Fehler beim Laden des Spielstands:', error);
		}
		return this._createDefault();
	}

	/** @param {GameSaveData} data */
	save(data) {
		try {
			data.lastPlayed = Date.now();
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error('Fehler beim Speichern:', error);
		}
	}

	/**
	 * NPC als entdeckt markieren und Statistiken aktualisieren
	 * @param {number} npcId
	 * @param {number} guessCount - Anzahl der Fragen bis zur Enthüllung
	 */
	recordDiscovery(npcId, guessCount) {
		const data = this.load();

		if (!data.discoveredNPCs.includes(npcId)) {
			data.discoveredNPCs.push(npcId);
		}

		data.totalRevealed++;
		data.totalGuesses += guessCount;
		data.currentStreak++;
		data.guessesPerNPC[npcId] = guessCount;

		if (data.currentStreak > data.bestStreak) {
			data.bestStreak = data.currentStreak;
		}

		this.save(data);
		return data;
	}

	/** @returns {GameSaveData} */
	_createDefault() {
		return {
			discoveredNPCs: [],
			totalGuesses: 0,
			totalRevealed: 0,
			bestStreak: 0,
			currentStreak: 0,
			guessesPerNPC: {},
			lastPlayed: 0,
		};
	}

	reset() {
		localStorage.removeItem(this.STORAGE_KEY);
	}

	/** @returns {{averageGuesses: number, totalRevealed: number, bestStreak: number}} */
	getStats() {
		const data = this.load();
		return {
			averageGuesses:
				data.totalRevealed > 0 ? Math.round((data.totalGuesses / data.totalRevealed) * 10) / 10 : 0,
			totalRevealed: data.totalRevealed,
			bestStreak: data.bestStreak,
		};
	}
}

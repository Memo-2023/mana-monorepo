import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
} from 'matrix-bot-sdk';
import { PlantaService, Plant } from '../planta/planta.service';
import { SessionService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

@Injectable()
export class MatrixService implements OnModuleInit {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private allowedRooms: string[];

	// Store last shown plants per user for reference by number
	private lastPlantsList: Map<string, Plant[]> = new Map();

	// Field mappings for edit command
	private readonly fieldMappings: Record<string, string> = {
		name: 'name',
		art: 'scientificName',
		wissenschaftlich: 'scientificName',
		scientific: 'scientificName',
		licht: 'lightRequirements',
		light: 'lightRequirements',
		wasser: 'wateringFrequencyDays',
		water: 'wateringFrequencyDays',
		feuchtigkeit: 'humidity',
		humidity: 'humidity',
		temperatur: 'temperature',
		temperature: 'temperature',
		erde: 'soilType',
		soil: 'soilType',
		notizen: 'careNotes',
		notes: 'careNotes',
	};

	constructor(
		private configService: ConfigService,
		private plantaService: PlantaService,
		private sessionService: SessionService
	) {}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms') || [];

		if (!accessToken) {
			this.logger.warn('No Matrix access token configured, bot disabled');
			return;
		}

		const storage = new SimpleFsStorageProvider(storagePath || './data/bot-storage.json');
		this.client = new MatrixClient(homeserverUrl || 'http://localhost:8008', accessToken, storage);

		AutojoinRoomsMixin.setupOnClient(this.client);

		this.client.on('room.message', this.handleMessage.bind(this));

		await this.client.start();
		this.logger.log('Matrix Planta Bot started');
	}

	private async handleMessage(roomId: string, event: any) {
		if (event.sender === (await this.client.getUserId())) return;
		if (event.content?.msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body?.startsWith('!')) return;

		// Check allowed rooms
		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const sender = event.sender;
		const parts = body.slice(1).split(/\s+/);
		const command = parts[0].toLowerCase();
		const args = parts.slice(1);
		const argString = args.join(' ');

		try {
			switch (command) {
				case 'help':
				case 'hilfe':
					await this.sendHtml(roomId, HELP_MESSAGE);
					break;

				case 'login':
					await this.handleLogin(roomId, sender, args);
					break;

				case 'logout':
					this.sessionService.logout(sender);
					await this.sendHtml(roomId, '<p>Erfolgreich abgemeldet.</p>');
					break;

				case 'status':
					await this.handleStatus(roomId, sender);
					break;

				case 'pflanzen':
				case 'plants':
				case 'liste':
					await this.handleListPlants(roomId, sender);
					break;

				case 'pflanze':
				case 'plant':
				case 'details':
					await this.handlePlantDetails(roomId, sender, args[0]);
					break;

				case 'neu':
				case 'new':
				case 'add':
					await this.handleAddPlant(roomId, sender, argString);
					break;

				case 'loeschen':
				case 'delete':
				case 'entfernen':
					await this.handleDeletePlant(roomId, sender, args[0]);
					break;

				case 'edit':
				case 'bearbeiten':
					await this.handleEditPlant(roomId, sender, args);
					break;

				case 'giessen':
				case 'water':
					await this.handleWaterPlant(roomId, sender, args[0], args.slice(1).join(' '));
					break;

				case 'faellig':
				case 'due':
				case 'upcoming':
					await this.handleUpcomingWaterings(roomId, sender);
					break;

				case 'historie':
				case 'history':
				case 'verlauf':
					await this.handleWateringHistory(roomId, sender, args[0]);
					break;

				case 'intervall':
				case 'interval':
				case 'frequenz':
					await this.handleSetInterval(roomId, sender, args[0], args[1]);
					break;

				default:
					await this.sendHtml(
						roomId,
						`<p>Unbekannter Befehl: <code>${command}</code>. Nutze <code>!help</code> fuer Hilfe.</p>`
					);
			}
		} catch (error) {
			this.logger.error(`Error handling command ${command}:`, error);
			await this.sendHtml(roomId, `<p>Fehler: ${error.message}</p>`);
		}
	}

	private async sendHtml(roomId: string, html: string) {
		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: html.replace(/<[^>]*>/g, ''),
			format: 'org.matrix.custom.html',
			formatted_body: html,
		});
	}

	private requireAuth(sender: string): string {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			throw new Error('Nicht angemeldet. Nutze <code>!login email passwort</code>');
		}
		return token;
	}

	// Auth handlers
	private async handleLogin(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!login email passwort</code></p>');
			return;
		}

		const [email, password] = args;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			await this.sendHtml(roomId, `<p>Erfolgreich angemeldet als <strong>${email}</strong></p>`);
		} else {
			await this.sendHtml(roomId, `<p>Login fehlgeschlagen: ${result.error}</p>`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendOk = await this.plantaService.checkHealth();
		const loggedIn = this.sessionService.isLoggedIn(sender);
		const sessions = this.sessionService.getSessionCount();

		await this.sendHtml(
			roomId,
			`<h3>Planta Bot Status</h3>
<ul>
<li>Backend: ${backendOk ? 'Online' : 'Offline'}</li>
<li>Angemeldet: ${loggedIn ? 'Ja' : 'Nein'}</li>
<li>Aktive Sessions: ${sessions}</li>
</ul>`
		);
	}

	// Plant handlers
	private async handleListPlants(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.plantaService.getPlants(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const plants = result.data || [];
		this.lastPlantsList.set(sender, plants);

		if (plants.length === 0) {
			await this.sendHtml(
				roomId,
				'<p>Keine Pflanzen vorhanden. Fuege eine mit <code>!neu Name</code> hinzu.</p>'
			);
			return;
		}

		let html = '<h3>Deine Pflanzen</h3><ol>';
		for (const plant of plants) {
			const scientific = plant.scientificName ? ` <em>(${plant.scientificName})</em>` : '';
			const health = this.getHealthEmoji(plant.healthStatus);
			html += `<li>${health} <strong>${plant.name}</strong>${scientific}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!pflanze [nr]</code> fuer Details oder <code>!faellig</code> fuer Giess-Status</em></p>';

		await this.sendHtml(roomId, html);
	}

	private async handlePlantDetails(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, numberStr);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const result = await this.plantaService.getPlant(token, plant.id);
		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const p = result.data!;
		const health = this.getHealthEmoji(p.healthStatus);
		let html = `<h3>${health} ${p.name}</h3>`;

		if (p.scientificName) html += `<p><em>${p.scientificName}</em></p>`;

		html += '<ul>';
		if (p.lightRequirements) html += `<li>Licht: ${this.translateLight(p.lightRequirements)}</li>`;
		if (p.wateringFrequencyDays) html += `<li>Giessen: alle ${p.wateringFrequencyDays} Tage</li>`;
		if (p.humidity) html += `<li>Feuchtigkeit: ${this.translateHumidity(p.humidity)}</li>`;
		if (p.temperature) html += `<li>Temperatur: ${p.temperature}</li>`;
		if (p.soilType) html += `<li>Erde: ${p.soilType}</li>`;
		if (p.healthStatus) html += `<li>Gesundheit: ${this.translateHealth(p.healthStatus)}</li>`;
		if (p.acquiredAt) html += `<li>Erworben: ${new Date(p.acquiredAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';

		if (p.careNotes) {
			html += `<p><strong>Notizen:</strong> ${p.careNotes}</p>`;
		}

		await this.sendHtml(roomId, html);
	}

	private async handleAddPlant(roomId: string, sender: string, name: string) {
		if (!name) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!neu Pflanzenname</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const result = await this.plantaService.createPlant(token, name);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		// Clear cached list
		this.lastPlantsList.delete(sender);
		await this.sendHtml(
			roomId,
			`<p>Pflanze <strong>${result.data!.name}</strong> hinzugefuegt!</p>
<p><em>Nutze <code>!edit</code> um Details wie Licht, Wasser etc. zu setzen.</em></p>`
		);
	}

	private async handleDeletePlant(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, numberStr);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const result = await this.plantaService.deletePlant(token, plant.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		// Clear cached list
		this.lastPlantsList.delete(sender);
		await this.sendHtml(roomId, `<p>Pflanze <strong>${plant.name}</strong> entfernt.</p>`);
	}

	private async handleEditPlant(roomId: string, sender: string, args: string[]) {
		if (args.length < 3) {
			await this.sendHtml(
				roomId,
				'<p>Verwendung: <code>!edit [nr] [feld] [wert]</code></p><p>Felder: name, art, licht, wasser, notizen</p>'
			);
			return;
		}

		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, args[0]);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const fieldInput = args[1].toLowerCase();
		const field = this.fieldMappings[fieldInput];
		const value = args.slice(2).join(' ');

		if (!field) {
			await this.sendHtml(
				roomId,
				`<p>Unbekanntes Feld: <code>${fieldInput}</code></p><p>Verfuegbar: name, art, licht, wasser, notizen</p>`
			);
			return;
		}

		// Validate and convert values
		let updateValue: any = value;
		if (field === 'wateringFrequencyDays') {
			updateValue = parseInt(value, 10);
			if (isNaN(updateValue) || updateValue < 1) {
				await this.sendHtml(roomId, '<p>Wasser-Intervall muss eine positive Zahl sein.</p>');
				return;
			}
		} else if (field === 'lightRequirements') {
			const lightMap: Record<string, string> = {
				wenig: 'low', low: 'low', gering: 'low',
				mittel: 'medium', medium: 'medium',
				hell: 'bright', bright: 'bright', viel: 'bright',
				direkt: 'direct', direct: 'direct', sonne: 'direct',
			};
			updateValue = lightMap[value.toLowerCase()];
			if (!updateValue) {
				await this.sendHtml(
					roomId,
					'<p>Licht-Werte: wenig/low, mittel/medium, hell/bright, direkt/direct</p>'
				);
				return;
			}
		} else if (field === 'humidity') {
			const humidityMap: Record<string, string> = {
				niedrig: 'low', low: 'low', gering: 'low', trocken: 'low',
				mittel: 'medium', medium: 'medium', normal: 'medium',
				hoch: 'high', high: 'high', feucht: 'high',
			};
			updateValue = humidityMap[value.toLowerCase()];
			if (!updateValue) {
				await this.sendHtml(
					roomId,
					'<p>Feuchtigkeits-Werte: niedrig/low, mittel/medium, hoch/high</p>'
				);
				return;
			}
		}

		const result = await this.plantaService.updatePlant(token, plant.id, {
			[field]: updateValue,
		});

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p><strong>${plant.name}</strong>: ${fieldInput} aktualisiert.</p>`
		);
	}

	// Watering handlers
	private async handleWaterPlant(roomId: string, sender: string, numberStr: string, notes?: string) {
		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, numberStr);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const result = await this.plantaService.waterPlant(token, plant.id, notes || undefined);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		let html = `<p><strong>${plant.name}</strong> gegossen!</p>`;
		if (notes) {
			html += `<p><em>Notiz: ${notes}</em></p>`;
		}

		await this.sendHtml(roomId, html);
	}

	private async handleUpcomingWaterings(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.plantaService.getUpcomingWaterings(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const upcoming = result.data || [];

		if (upcoming.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Pflanzen muessen in den naechsten Tagen gegossen werden.</p>');
			return;
		}

		let html = '<h3>Giess-Status</h3><ul>';
		for (const item of upcoming) {
			const status = item.isOverdue
				? `<strong style="color: red;">Ueberfaellig (${Math.abs(item.daysUntilWatering)} Tage)</strong>`
				: item.daysUntilWatering === 0
					? '<strong style="color: orange;">Heute</strong>'
					: `in ${item.daysUntilWatering} Tag${item.daysUntilWatering > 1 ? 'en' : ''}`;
			html += `<li><strong>${item.plant.name}</strong>: ${status}</li>`;
		}
		html += '</ul>';

		// Store plants for reference
		this.lastPlantsList.set(sender, upcoming.map(u => u.plant));

		await this.sendHtml(roomId, html);
	}

	private async handleWateringHistory(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, numberStr);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const result = await this.plantaService.getWateringHistory(token, plant.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const logs = result.data || [];

		if (logs.length === 0) {
			await this.sendHtml(
				roomId,
				`<p><strong>${plant.name}</strong> wurde noch nie gegossen.</p>`
			);
			return;
		}

		let html = `<h3>Giess-Historie: ${plant.name}</h3><ul>`;
		for (const log of logs.slice(0, 10)) {
			const date = new Date(log.wateredAt).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			const notes = log.notes ? ` - ${log.notes}` : '';
			html += `<li>${date}${notes}</li>`;
		}
		html += '</ul>';

		if (logs.length > 10) {
			html += `<p><em>...und ${logs.length - 10} weitere Eintraege</em></p>`;
		}

		await this.sendHtml(roomId, html);
	}

	private async handleSetInterval(roomId: string, sender: string, numberStr: string, daysStr: string) {
		if (!numberStr || !daysStr) {
			await this.sendHtml(
				roomId,
				'<p>Verwendung: <code>!intervall [nr] [tage]</code></p>'
			);
			return;
		}

		const token = this.requireAuth(sender);
		const plant = this.getPlantByNumber(sender, numberStr);

		if (!plant) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!pflanzen</code></p>'
			);
			return;
		}

		const days = parseInt(daysStr, 10);
		if (isNaN(days) || days < 1) {
			await this.sendHtml(roomId, '<p>Tage muss eine positive Zahl sein.</p>');
			return;
		}

		const result = await this.plantaService.updateWateringSchedule(token, plant.id, days);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p>Giess-Intervall fuer <strong>${plant.name}</strong> auf ${days} Tage gesetzt.</p>`
		);
	}

	// Helper methods
	private getPlantByNumber(sender: string, numberStr: string): Plant | null {
		const plants = this.lastPlantsList.get(sender);
		if (!plants) return null;

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= plants.length) return null;

		return plants[index];
	}

	private getHealthEmoji(status?: string): string {
		switch (status) {
			case 'healthy': return '&#127793;'; // Seedling
			case 'needs_attention': return '&#9888;&#65039;'; // Warning
			case 'sick': return '&#129314;'; // Wilted
			default: return '&#127793;';
		}
	}

	private translateLight(light: string): string {
		const map: Record<string, string> = {
			low: 'Wenig Licht',
			medium: 'Mittleres Licht',
			bright: 'Helles Licht',
			direct: 'Direktes Sonnenlicht',
		};
		return map[light] || light;
	}

	private translateHumidity(humidity: string): string {
		const map: Record<string, string> = {
			low: 'Niedrig',
			medium: 'Mittel',
			high: 'Hoch',
		};
		return map[humidity] || humidity;
	}

	private translateHealth(health: string): string {
		const map: Record<string, string> = {
			healthy: 'Gesund',
			needs_attention: 'Braucht Aufmerksamkeit',
			sick: 'Krank',
		};
		return map[health] || health;
	}
}

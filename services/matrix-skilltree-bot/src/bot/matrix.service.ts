import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	UserListMapper,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { SkilltreeService, Skill, SkillBranch } from '../skilltree/skilltree.service';
import {
	SessionService,
	TranscriptionService,
	CreditService,
	LOGIN_MESSAGES,
} from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	// User list mapper for number-based reference
	private skillsMapper = new UserListMapper<Skill>();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['skills', 'faehigkeiten', 'meine skills', 'liste'], command: 'skills' },
		{ keywords: ['xp', 'punkte', 'erfahrung', 'erfahrungspunkte'], command: 'xp' },
		{ keywords: ['stats', 'statistik', 'statistiken', 'fortschritt'], command: 'stats' },
		{ keywords: ['aktivitaeten', 'activities', 'verlauf', 'historie'], command: 'aktivitaeten' },
		{ keywords: ['neu', 'new', 'neuer skill', 'skill erstellen'], command: 'neu' },
	]);

	// Branch name mappings (German/English)
	private readonly branchMappings: Record<string, SkillBranch> = {
		intellect: 'intellect',
		wissen: 'intellect',
		gehirn: 'intellect',
		body: 'body',
		koerper: 'body',
		fitness: 'body',
		sport: 'body',
		creativity: 'creativity',
		kreativ: 'creativity',
		kreativitaet: 'creativity',
		kunst: 'creativity',
		social: 'social',
		sozial: 'social',
		practical: 'practical',
		praktisch: 'practical',
		handwerk: 'practical',
		mindset: 'mindset',
		achtsamkeit: 'mindset',
		mental: 'mindset',
		custom: 'custom',
		eigene: 'custom',
	};

	constructor(
		configService: ConfigService,
		private skilltreeService: SkilltreeService,
		private sessionService: SessionService,
		private readonly transcriptionService: TranscriptionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		body: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(body);
		if (keywordCommand) {
			body = `!${keywordCommand}`;
		}

		if (!body.startsWith('!')) return;

		const sender = event.sender;
		const parts = body.slice(1).split(/\s+/);
		const command = parts[0].toLowerCase();
		const args = parts.slice(1);
		const argString = args.join(' ');

		try {
			switch (command) {
				case 'help':
				case 'hilfe':
					await this.sendMessage(roomId, HELP_MESSAGE);
					break;

				case 'status':
					await this.handleStatus(roomId, sender);
					break;

				// Skill commands
				case 'skills':
				case 'liste':
				case 'faehigkeiten':
					await this.handleListSkills(roomId, sender, args[0]);
					break;

				case 'skill':
				case 'details':
					await this.handleSkillDetails(roomId, sender, args[0]);
					break;

				case 'neu':
				case 'new':
				case 'create':
					await this.handleCreateSkill(roomId, sender, argString);
					break;

				case 'loeschen':
				case 'delete':
					await this.handleDeleteSkill(roomId, sender, args[0]);
					break;

				// XP commands
				case 'xp':
				case 'punkte':
					await this.handleAddXp(roomId, sender, argString);
					break;

				// Stats commands
				case 'stats':
				case 'statistik':
					await this.handleStats(roomId, sender);
					break;

				// Activity commands
				case 'aktivitaeten':
				case 'activities':
				case 'verlauf':
					await this.handleActivities(roomId, sender, args[0]);
					break;

				default:
					await this.sendMessage(
						roomId,
						`<p>Unbekannter Befehl: <code>${command}</code>. Nutze <code>!help</code> fuer Hilfe.</p>`
					);
			}
		} catch (error) {
			this.logger.error(`Error handling command ${command}:`, error);
			await this.sendMessage(roomId, `<p>Fehler: ${(error as Error).message}</p>`);
		}
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		_sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendReply(roomId, event, '<p>Sprachnachricht konnte nicht erkannt werden.</p>');
				return;
			}

			await this.sendMessage(roomId, `<p><em>"${text}"</em></p>`);
			await this.handleTextMessage(roomId, event, text);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, '<p>Fehler bei der Spracherkennung.</p>');
		}
	}

	private async requireAuth(sender: string): Promise<string> {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			throw new Error(LOGIN_MESSAGES.skilltree);
		}
		return token;
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendOk = await this.skilltreeService.checkHealth();
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const sessions = await this.sessionService.getSessionCount();
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusHtml = '<h3>Skilltree Bot Status</h3><ul>';
		statusHtml += `<li>Backend: ${backendOk ? 'Online' : 'Offline'}</li>`;
		statusHtml += `<li>Angemeldet: ${loggedIn ? 'Ja' : 'Nein'}</li>`;

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			statusHtml += `<li>👤 Angemeldet als: ${session.email}</li>`;
			statusHtml += `<li>⚡ Credits: ${balance.balance.toFixed(2)}</li>`;
		}

		statusHtml += `<li>Aktive Sessions: ${sessions}</li>`;
		statusHtml += '</ul>';

		await this.sendMessage(roomId, statusHtml);
	}

	// Skill handlers
	private async handleListSkills(roomId: string, sender: string, branchFilter?: string) {
		const token = await this.requireAuth(sender);

		let branch: string | undefined;
		if (branchFilter) {
			branch = this.branchMappings[branchFilter.toLowerCase()];
			if (!branch) {
				await this.sendMessage(
					roomId,
					'<p>Unbekannter Branch. Verfuegbar: intellect, body, creativity, social, practical, mindset, custom</p>'
				);
				return;
			}
		}

		const result = await this.skilltreeService.getSkills(token, branch);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const skills = result.data?.skills || [];
		this.skillsMapper.setList(sender, skills);

		if (skills.length === 0) {
			await this.sendMessage(
				roomId,
				'<p>Keine Skills vorhanden. Erstelle einen mit <code>!neu Name | Branch</code></p>'
			);
			return;
		}

		let html = '<h3>Deine Skills</h3><ol>';
		for (const skill of skills) {
			const levelName = this.getLevelName(skill.level);
			const branchIcon = this.getBranchIcon(skill.branch);
			const progress = this.getProgressBar(skill.totalXp, skill.level);
			html += `<li>${branchIcon} <strong>${skill.name}</strong> - Lvl ${skill.level} (${levelName}) ${progress}</li>`;
		}
		html += '</ol>';
		html +=
			'<p><em>Nutze <code>!skill [nr]</code> fuer Details oder <code>!xp [nr] 50 Aktivitaet</code></em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleSkillDetails(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const number = parseInt(numberStr, 10);
		const skill = this.skillsMapper.getByNumber(sender, number);

		if (!skill) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!skills</code></p>');
			return;
		}

		const result = await this.skilltreeService.getSkill(token, skill.id);
		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const s = result.data!.skill;
		const levelName = this.getLevelName(s.level);
		const nextLevelXp = this.getNextLevelXp(s.level);
		const branchIcon = this.getBranchIcon(s.branch);

		let html = `<h3>${branchIcon} ${s.name}</h3>`;
		if (s.description) html += `<p><em>${s.description}</em></p>`;

		html += '<ul>';
		html += `<li>Branch: ${this.translateBranch(s.branch)}</li>`;
		html += `<li>Level: ${s.level} (${levelName})</li>`;
		html += `<li>XP: ${s.totalXp.toLocaleString('de-DE')}`;
		if (nextLevelXp) html += ` / ${nextLevelXp.toLocaleString('de-DE')} (naechstes Level)`;
		html += '</li>';
		html += `<li>Erstellt: ${new Date(s.createdAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';

		html += `<p><em>Nutze <code>!xp ${numberStr} [xp] [aktivitaet]</code> um XP hinzuzufuegen</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleCreateSkill(roomId: string, sender: string, input: string) {
		if (!input) {
			await this.sendMessage(
				roomId,
				'<p>Verwendung: <code>!neu Name | Branch</code></p><p>Branches: intellect, body, creativity, social, practical, mindset, custom</p>'
			);
			return;
		}

		const token = await this.requireAuth(sender);
		const parts = input.split('|').map((s) => s.trim());
		const name = parts[0];
		const branchInput = parts[1]?.toLowerCase() || 'custom';

		const branch = this.branchMappings[branchInput];
		if (!branch) {
			await this.sendMessage(
				roomId,
				'<p>Unbekannter Branch. Verfuegbar: intellect, body, creativity, social, practical, mindset, custom</p>'
			);
			return;
		}

		const description = parts[2];

		const result = await this.skilltreeService.createSkill(token, name, branch, description);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.skillsMapper.clearList(sender);
		const branchIcon = this.getBranchIcon(branch);
		await this.sendMessage(
			roomId,
			`<p>${branchIcon} Skill <strong>${result.data!.skill.name}</strong> erstellt!</p>
<p><em>Nutze <code>!skills</code> und dann <code>!xp [nr] [xp] [aktivitaet]</code></em></p>`
		);
	}

	private async handleDeleteSkill(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const number = parseInt(numberStr, 10);
		const skill = this.skillsMapper.getByNumber(sender, number);

		if (!skill) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!skills</code></p>');
			return;
		}

		const result = await this.skilltreeService.deleteSkill(token, skill.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.skillsMapper.clearList(sender);
		await this.sendMessage(roomId, `<p>Skill <strong>${skill.name}</strong> geloescht.</p>`);
	}

	// XP handler
	private async handleAddXp(roomId: string, sender: string, argString: string) {
		const args = argString.split(/\s+/);

		if (args.length < 3) {
			await this.sendMessage(
				roomId,
				'<p>Verwendung: <code>!xp [nr] [xp] [aktivitaet]</code></p><p>Optional: <code>--min 60</code> fuer Dauer</p>'
			);
			return;
		}

		const token = await this.requireAuth(sender);
		const number = parseInt(args[0], 10);
		const skill = this.skillsMapper.getByNumber(sender, number);

		if (!skill) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!skills</code></p>');
			return;
		}

		const xp = parseInt(args[1], 10);
		if (isNaN(xp) || xp < 1 || xp > 10000) {
			await this.sendMessage(roomId, '<p>XP muss zwischen 1 und 10000 liegen.</p>');
			return;
		}

		// Parse duration (--min N)
		let duration: number | undefined;
		const minMatch = argString.match(/--min\s+(\d+)/i);
		if (minMatch) {
			duration = parseInt(minMatch[1], 10);
		}

		// Get description (everything after xp number, minus --min part)
		let description = args.slice(2).join(' ');
		description = description.replace(/--min\s+\d+/i, '').trim();

		if (!description) {
			description = 'Aktivitaet';
		}

		const result = await this.skilltreeService.addXp(token, skill.id, xp, description, duration);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { leveledUp, newLevel } = result.data!;
		let html = `<p><strong>+${xp} XP</strong> fuer <strong>${skill.name}</strong>!</p>`;
		html += `<p><em>${description}</em></p>`;

		if (leveledUp) {
			const levelName = this.getLevelName(newLevel);
			html += `<p>&#127881; <strong>LEVEL UP!</strong> Du bist jetzt Level ${newLevel} (${levelName})!</p>`;
		}

		await this.sendMessage(roomId, html);
	}

	// Stats handler
	private async handleStats(roomId: string, sender: string) {
		const token = await this.requireAuth(sender);
		const result = await this.skilltreeService.getStats(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const stats = result.data!.stats;
		let html = '<h3>Deine Statistiken</h3><ul>';
		html += `<li>Gesamt-XP: ${stats.totalXp.toLocaleString('de-DE')}</li>`;
		html += `<li>Skills: ${stats.totalSkills}</li>`;
		html += `<li>Hoechstes Level: ${stats.highestLevel}</li>`;
		html += `<li>Streak: ${stats.streakDays} Tage &#128293;</li>`;
		if (stats.lastActivityDate) {
			html += `<li>Letzte Aktivitaet: ${stats.lastActivityDate}</li>`;
		}
		html += '</ul>';

		await this.sendMessage(roomId, html);
	}

	// Activities handler
	private async handleActivities(roomId: string, sender: string, numberStr?: string) {
		const token = await this.requireAuth(sender);

		let result;
		let skillName = '';

		if (numberStr) {
			const number = parseInt(numberStr, 10);
			const skill = this.skillsMapper.getByNumber(sender, number);
			if (!skill) {
				await this.sendMessage(
					roomId,
					'<p>Ungueltige Nummer. Nutze zuerst <code>!skills</code></p>'
				);
				return;
			}
			result = await this.skilltreeService.getSkillActivities(token, skill.id);
			skillName = skill.name;
		} else {
			result = await this.skilltreeService.getRecentActivities(token, 10);
		}

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const activities = result.data?.activities || [];

		if (activities.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Aktivitaeten vorhanden.</p>');
			return;
		}

		const title = skillName ? `Aktivitaeten: ${skillName}` : 'Letzte Aktivitaeten';
		let html = `<h3>${title}</h3><ol>`;

		for (const activity of activities) {
			const date = new Date(activity.timestamp).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			});
			const duration = activity.duration ? ` (${activity.duration} min)` : '';
			html += `<li><strong>+${activity.xpEarned} XP</strong> - ${activity.description}${duration}<br/><em>${date}</em></li>`;
		}
		html += '</ol>';

		await this.sendMessage(roomId, html);
	}

	// Helper methods
	private getLevelName(level: number): string {
		const names: Record<number, string> = {
			0: 'Unbekannt',
			1: 'Anfaenger',
			2: 'Fortgeschritten',
			3: 'Kompetent',
			4: 'Experte',
			5: 'Meister',
		};
		return names[level] || `Level ${level}`;
	}

	private getNextLevelXp(level: number): number | null {
		const thresholds: Record<number, number> = {
			0: 100,
			1: 500,
			2: 1500,
			3: 4000,
			4: 10000,
		};
		return thresholds[level] || null;
	}

	private getBranchIcon(branch: string): string {
		const icons: Record<string, string> = {
			intellect: '&#129504;', // Brain
			body: '&#128170;', // Flexed biceps
			creativity: '&#127912;', // Artist palette
			social: '&#128101;', // Busts in silhouette
			practical: '&#128295;', // Wrench
			mindset: '&#128150;', // Heart
			custom: '&#11088;', // Star
		};
		return icons[branch] || '&#11088;';
	}

	private translateBranch(branch: string): string {
		const translations: Record<string, string> = {
			intellect: 'Wissen',
			body: 'Koerper',
			creativity: 'Kreativitaet',
			social: 'Sozial',
			practical: 'Praktisch',
			mindset: 'Achtsamkeit',
			custom: 'Eigene',
		};
		return translations[branch] || branch;
	}

	private getProgressBar(totalXp: number, level: number): string {
		const nextXp = this.getNextLevelXp(level);
		if (!nextXp) return '';

		const prevXp = level > 0 ? this.getNextLevelXp(level - 1) || 0 : 0;
		const progress = Math.min(100, Math.round(((totalXp - prevXp) / (nextXp - prevXp)) * 100));
		return `[${progress}%]`;
	}
}

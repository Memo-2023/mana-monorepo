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
import { QuestionsService, Question, Collection, Answer } from '../questions/questions.service';
import { SessionService, TranscriptionService, CreditService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

const QUESTION_CREATE_CREDITS = 0.02;
const QUICK_RESEARCH_CREDITS = 5;
const STANDARD_RESEARCH_CREDITS = 10;
const DEEP_RESEARCH_CREDITS = 25;

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Store last shown items per user for reference by number
	private questionsMapper = new UserListMapper<Question>();
	private collectionsMapper = new UserListMapper<Collection>();
	private answersMapper = new UserListMapper<Answer>();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['fragen', 'questions', 'meine fragen', 'liste'], command: 'fragen' },
		{ keywords: ['recherche', 'research', 'suchen', 'untersuchen'], command: 'recherche' },
		{ keywords: ['antwort', 'answer', 'antworten', 'ergebnis'], command: 'antwort' },
		{ keywords: ['quellen', 'sources', 'referenzen', 'links'], command: 'quellen' },
		{ keywords: ['sammlungen', 'collections', 'ordner', 'kategorien'], command: 'sammlungen' },
		{ keywords: ['suche', 'search', 'finde', 'durchsuchen'], command: 'suche' },
		{ keywords: ['neu', 'new', 'neue frage', 'frage stellen'], command: 'neu' },
	]);

	constructor(
		configService: ConfigService,
		private questionsService: QuestionsService,
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

				case 'login':
					await this.handleLogin(roomId, sender, args);
					break;

				case 'logout':
					this.sessionService.logout(sender);
					await this.sendMessage(roomId, '<p>Erfolgreich abgemeldet.</p>');
					break;

				case 'status':
					await this.handleStatus(roomId, sender);
					break;

				// Question commands
				case 'fragen':
				case 'questions':
				case 'liste':
					await this.handleListQuestions(roomId, sender, args[0]);
					break;

				case 'frage':
				case 'question':
				case 'details':
					await this.handleQuestionDetails(roomId, sender, args[0]);
					break;

				case 'neu':
				case 'new':
				case 'ask':
					await this.handleCreateQuestion(roomId, sender, argString);
					break;

				case 'loeschen':
				case 'delete':
					await this.handleDeleteQuestion(roomId, sender, args[0]);
					break;

				case 'archivieren':
				case 'archive':
					await this.handleArchiveQuestion(roomId, sender, args[0]);
					break;

				// Research commands
				case 'recherche':
				case 'research':
					await this.handleStartResearch(roomId, sender, args[0], args[1]);
					break;

				case 'ergebnis':
				case 'result':
					await this.handleResearchResult(roomId, sender, args[0]);
					break;

				case 'quellen':
				case 'sources':
					await this.handleSources(roomId, sender, args[0]);
					break;

				// Answer commands
				case 'antwort':
				case 'answer':
					await this.handleAnswer(roomId, sender, args[0]);
					break;

				case 'bewerten':
				case 'rate':
					await this.handleRateAnswer(roomId, sender, args[0], args[1]);
					break;

				case 'akzeptieren':
				case 'accept':
					await this.handleAcceptAnswer(roomId, sender, args[0]);
					break;

				// Collection commands
				case 'sammlungen':
				case 'collections':
					await this.handleListCollections(roomId, sender);
					break;

				case 'sammlung':
				case 'collection':
					await this.handleCreateCollection(roomId, sender, argString);
					break;

				// Search
				case 'suche':
				case 'search':
					await this.handleSearch(roomId, sender, argString);
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
			throw new Error('Nicht angemeldet. Nutze <code>!login email passwort</code>');
		}
		return token;
	}

	// Auth handlers
	private async handleLogin(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!login email passwort</code></p>');
			return;
		}

		const [email, password] = args;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(sender);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendMessage(
					roomId,
					`<p>✅ Erfolgreich angemeldet als <strong>${email}</strong><br/>⚡ Credits: ${balance.balance.toFixed(2)}</p>`
				);
			} else {
				await this.sendMessage(
					roomId,
					`<p>✅ Erfolgreich angemeldet als <strong>${email}</strong></p>`
				);
			}
		} else {
			await this.sendMessage(roomId, `<p>❌ Login fehlgeschlagen: ${result.error}</p>`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendOk = await this.questionsService.checkHealth();
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const sessions = await this.sessionService.getSessionCount();
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusHtml = `<h3>Questions Bot Status</h3><ul>`;
		statusHtml += `<li>Backend: ${backendOk ? '✅ Online' : '❌ Offline'}</li>`;
		statusHtml += `<li>Aktive Sessions: ${sessions}</li>`;

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			statusHtml += `<li>👤 Angemeldet als: ${session.email}</li>`;
			statusHtml += `<li>⚡ Credits: ${balance.balance.toFixed(2)}</li>`;
		} else {
			statusHtml += `<li>👤 Nicht angemeldet</li>`;
			statusHtml += `<li>💡 Login: <code>!login email passwort</code></li>`;
		}
		statusHtml += `</ul>`;

		await this.sendMessage(roomId, statusHtml);
	}

	// Question handlers
	private async handleListQuestions(roomId: string, sender: string, statusFilter?: string) {
		const token = await this.requireAuth(sender);

		const options: Record<string, string> = {};
		if (statusFilter) {
			const statusMap: Record<string, string> = {
				offen: 'open',
				open: 'open',
				recherche: 'researching',
				researching: 'researching',
				beantwortet: 'answered',
				answered: 'answered',
				archiviert: 'archived',
				archived: 'archived',
			};
			options.status = statusMap[statusFilter.toLowerCase()] || statusFilter;
		}

		const result = await this.questionsService.getQuestions(token, options);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const questions = result.data || [];
		this.questionsMapper.setList(sender, questions);

		if (questions.length === 0) {
			await this.sendMessage(
				roomId,
				'<p>Keine Fragen vorhanden. Stelle eine mit <code>!neu Frage?</code></p>'
			);
			return;
		}

		let html = '<h3>Deine Fragen</h3><ol>';
		for (const q of questions) {
			const status = this.getStatusEmoji(q.status);
			const priority = this.getPriorityIndicator(q.priority);
			html += `<li>${status} ${priority}<strong>${q.title}</strong></li>`;
		}
		html += '</ol>';
		html +=
			'<p><em>Nutze <code>!frage [nr]</code> fuer Details oder <code>!recherche [nr]</code></em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleQuestionDetails(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.getQuestion(token, question.id);
		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const q = result.data!;
		const status = this.getStatusEmoji(q.status);
		let html = `<h3>${status} ${q.title}</h3>`;

		if (q.description) html += `<p>${q.description}</p>`;

		html += '<ul>';
		html += `<li>Status: ${this.translateStatus(q.status)}</li>`;
		html += `<li>Prioritaet: ${this.translatePriority(q.priority)}</li>`;
		html += `<li>Recherche-Tiefe: ${q.researchDepth}</li>`;
		if (q.tags?.length) html += `<li>Tags: ${q.tags.join(', ')}</li>`;
		if (q.category) html += `<li>Kategorie: ${q.category}</li>`;
		html += `<li>Erstellt: ${new Date(q.createdAt).toLocaleDateString('de-DE')}</li>`;
		if (q.answeredAt)
			html += `<li>Beantwortet: ${new Date(q.answeredAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';

		html += `<p><em>Nutze <code>!recherche ${numberStr}</code> um eine Recherche zu starten</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleCreateQuestion(roomId: string, sender: string, title: string) {
		if (!title) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!neu Deine Frage?</code></p>');
			return;
		}

		const token = await this.requireAuth(sender);
		const result = await this.questionsService.createQuestion(token, title);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.questionsMapper.clearList(sender);
		await this.sendMessage(
			roomId,
			`<p>Frage erstellt: <strong>${result.data!.title}</strong></p>
<p><em>Nutze <code>!fragen</code> und dann <code>!recherche [nr]</code> um zu recherchieren.</em></p>`
		);
	}

	private async handleDeleteQuestion(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.deleteQuestion(token, question.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.questionsMapper.clearList(sender);
		await this.sendMessage(roomId, `<p>Frage geloescht: <strong>${question.title}</strong></p>`);
	}

	private async handleArchiveQuestion(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.updateQuestionStatus(token, question.id, 'archived');

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(roomId, `<p>Frage archiviert: <strong>${question.title}</strong></p>`);
	}

	// Research handlers
	private async handleStartResearch(
		roomId: string,
		sender: string,
		numberStr: string,
		depthStr?: string
	) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const depthMap: Record<string, 'quick' | 'standard' | 'deep'> = {
			schnell: 'quick',
			quick: 'quick',
			standard: 'standard',
			normal: 'standard',
			tief: 'deep',
			deep: 'deep',
		};
		const depth = depthMap[depthStr?.toLowerCase() || ''] || 'quick';

		await this.sendMessage(
			roomId,
			`<p>Starte ${depth}-Recherche fuer: <strong>${question.title}</strong>...</p>`
		);

		const result = await this.questionsService.startResearch(token, question.id, depth);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const research = result.data!;
		let html = `<h3>Recherche abgeschlossen</h3>`;

		if (research.summary) {
			html += `<p><strong>Zusammenfassung:</strong></p><p>${research.summary}</p>`;
		}

		if (research.keyPoints?.length) {
			html += '<p><strong>Wichtige Punkte:</strong></p><ul>';
			for (const point of research.keyPoints.slice(0, 5)) {
				html += `<li>${point}</li>`;
			}
			html += '</ul>';
		}

		if (research.followUpQuestions?.length) {
			html += '<p><strong>Folge-Fragen:</strong></p><ul>';
			for (const fq of research.followUpQuestions.slice(0, 3)) {
				html += `<li>${fq}</li>`;
			}
			html += '</ul>';
		}

		html += `<p><em>Nutze <code>!quellen ${numberStr}</code> fuer die Quellen</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleResearchResult(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.getResearchResults(token, question.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const results = result.data || [];

		if (results.length === 0) {
			await this.sendMessage(
				roomId,
				`<p>Keine Recherche-Ergebnisse. Nutze <code>!recherche ${numberStr}</code></p>`
			);
			return;
		}

		const latest = results[0];
		let html = `<h3>Recherche-Ergebnis</h3>`;
		html += `<p><em>Tiefe: ${latest.researchDepth}</em></p>`;

		if (latest.summary) {
			html += `<p>${latest.summary}</p>`;
		}

		if (latest.keyPoints?.length) {
			html += '<p><strong>Wichtige Punkte:</strong></p><ul>';
			for (const point of latest.keyPoints) {
				html += `<li>${point}</li>`;
			}
			html += '</ul>';
		}

		await this.sendMessage(roomId, html);
	}

	private async handleSources(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.getSources(token, question.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const sources = result.data || [];

		if (sources.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Quellen vorhanden.</p>');
			return;
		}

		let html = `<h3>Quellen fuer: ${question.title}</h3><ol>`;
		for (const source of sources.slice(0, 10)) {
			const relevance = source.relevanceScore
				? ` (${Math.round(source.relevanceScore * 100)}%)`
				: '';
			html += `<li><a href="${source.url}">${source.title}</a>${relevance}<br/><em>${source.domain}</em></li>`;
		}
		html += '</ol>';

		if (sources.length > 10) {
			html += `<p><em>...und ${sources.length - 10} weitere Quellen</em></p>`;
		}

		await this.sendMessage(roomId, html);
	}

	// Answer handlers
	private async handleAnswer(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);
		const question = this.getQuestionByNumber(sender, numberStr);

		if (!question) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!fragen</code></p>');
			return;
		}

		const result = await this.questionsService.getAnswers(token, question.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const answers = result.data || [];
		this.answersMapper.setList(sender, answers);

		if (answers.length === 0) {
			await this.sendMessage(
				roomId,
				`<p>Keine Antworten. Starte zuerst eine Recherche mit <code>!recherche ${numberStr}</code></p>`
			);
			return;
		}

		// Show the first (most recent) answer
		const answer = answers[0];
		const accepted = answer.isAccepted ? ' &#9989;' : '';
		const rating = answer.rating ? ` (${answer.rating}/5 Sterne)` : '';
		const confidence = answer.confidence
			? ` [${Math.round(answer.confidence * 100)}% Konfidenz]`
			: '';

		let html = `<h3>Antwort${accepted}${rating}</h3>`;
		html += `<p><em>Model: ${answer.modelId}${confidence}</em></p>`;

		if (answer.summary) {
			html += `<p><strong>Zusammenfassung:</strong> ${answer.summary}</p>`;
		}

		html += `<p>${answer.contentMarkdown || answer.content}</p>`;

		if (answer.sourceCount) {
			html += `<p><em>Basierend auf ${answer.sourceCount} Quellen</em></p>`;
		}

		html += `<p><em>Nutze <code>!bewerten ${numberStr} 1-5</code> zum Bewerten</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleRateAnswer(
		roomId: string,
		sender: string,
		numberStr: string,
		ratingStr: string
	) {
		const token = await this.requireAuth(sender);

		if (!this.answersMapper.hasList(sender)) {
			await this.sendMessage(
				roomId,
				'<p>Zeige zuerst eine Antwort mit <code>!antwort [nr]</code></p>'
			);
			return;
		}

		const rating = parseInt(ratingStr, 10);
		if (isNaN(rating) || rating < 1 || rating > 5) {
			await this.sendMessage(roomId, '<p>Bewertung muss zwischen 1 und 5 sein.</p>');
			return;
		}

		// Get first answer (most recent)
		const answer = this.answersMapper.getByNumber(sender, 1);
		if (!answer) {
			await this.sendMessage(roomId, '<p>Keine Antwort gefunden.</p>');
			return;
		}
		const result = await this.questionsService.rateAnswer(token, answer.id, rating);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(roomId, `<p>Antwort mit ${rating} Sternen bewertet.</p>`);
	}

	private async handleAcceptAnswer(roomId: string, sender: string, numberStr: string) {
		const token = await this.requireAuth(sender);

		if (!this.answersMapper.hasList(sender)) {
			await this.sendMessage(
				roomId,
				'<p>Zeige zuerst eine Antwort mit <code>!antwort [nr]</code></p>'
			);
			return;
		}

		// Get first answer (most recent)
		const answer = this.answersMapper.getByNumber(sender, 1);
		if (!answer) {
			await this.sendMessage(roomId, '<p>Keine Antwort gefunden.</p>');
			return;
		}
		const result = await this.questionsService.acceptAnswer(token, answer.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(roomId, '<p>Antwort als Loesung akzeptiert. &#9989;</p>');
	}

	// Collection handlers
	private async handleListCollections(roomId: string, sender: string) {
		const token = await this.requireAuth(sender);
		const result = await this.questionsService.getCollections(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const collections = result.data || [];
		this.collectionsMapper.setList(sender, collections);

		if (collections.length === 0) {
			await this.sendMessage(
				roomId,
				'<p>Keine Sammlungen. Erstelle eine mit <code>!sammlung Name</code></p>'
			);
			return;
		}

		let html = '<h3>Sammlungen</h3><ol>';
		for (const c of collections) {
			const defaultMark = c.isDefault ? ' (Standard)' : '';
			const count = c.questionCount !== undefined ? ` [${c.questionCount} Fragen]` : '';
			html += `<li><strong>${c.name}</strong>${defaultMark}${count}</li>`;
		}
		html += '</ol>';

		await this.sendMessage(roomId, html);
	}

	private async handleCreateCollection(roomId: string, sender: string, name: string) {
		if (!name) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!sammlung Name</code></p>');
			return;
		}

		const token = await this.requireAuth(sender);
		const result = await this.questionsService.createCollection(token, name);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.collectionsMapper.clearList(sender);
		await this.sendMessage(
			roomId,
			`<p>Sammlung <strong>${result.data!.name}</strong> erstellt.</p>`
		);
	}

	// Search handler
	private async handleSearch(roomId: string, sender: string, query: string) {
		if (!query) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!suche Begriff</code></p>');
			return;
		}

		const token = await this.requireAuth(sender);
		const result = await this.questionsService.getQuestions(token, { search: query });

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const questions = result.data || [];
		this.questionsMapper.setList(sender, questions);

		if (questions.length === 0) {
			await this.sendMessage(roomId, `<p>Keine Fragen gefunden fuer "${query}"</p>`);
			return;
		}

		let html = `<h3>Suchergebnisse: "${query}"</h3><ol>`;
		for (const q of questions) {
			const status = this.getStatusEmoji(q.status);
			html += `<li>${status} <strong>${q.title}</strong></li>`;
		}
		html += '</ol>';

		await this.sendMessage(roomId, html);
	}

	// Helper methods
	private getQuestionByNumber(sender: string, numberStr: string): Question | null {
		const num = parseInt(numberStr, 10);
		if (isNaN(num)) return null;
		return this.questionsMapper.getByNumber(sender, num);
	}

	private getStatusEmoji(status: string): string {
		const map: Record<string, string> = {
			open: '&#10067;', // Question mark
			researching: '&#128269;', // Magnifying glass
			answered: '&#9989;', // Check mark
			archived: '&#128230;', // Package
		};
		return map[status] || '&#10067;';
	}

	private translateStatus(status: string): string {
		const map: Record<string, string> = {
			open: 'Offen',
			researching: 'In Recherche',
			answered: 'Beantwortet',
			archived: 'Archiviert',
		};
		return map[status] || status;
	}

	private getPriorityIndicator(priority: string): string {
		const map: Record<string, string> = {
			urgent: '&#128308; ', // Red circle
			high: '&#128992; ', // Orange circle
			normal: '',
			low: '',
		};
		return map[priority] || '';
	}

	private translatePriority(priority: string): string {
		const map: Record<string, string> = {
			low: 'Niedrig',
			normal: 'Normal',
			high: 'Hoch',
			urgent: 'Dringend',
		};
		return map[priority] || priority;
	}
}

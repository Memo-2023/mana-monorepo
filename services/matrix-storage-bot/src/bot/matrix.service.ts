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
import { StorageService, StorageFile, Folder, ShareLink, TrashItem } from '../storage/storage.service';
import { SessionService, TranscriptionService, CreditService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Store last shown items per user for reference by number
	private filesMapper = new UserListMapper<StorageFile>();
	private foldersMapper = new UserListMapper<Folder>();
	private sharesMapper = new UserListMapper<ShareLink>();
	private trashMapper = new UserListMapper<TrashItem>();
	private currentFolder: Map<string, string | null> = new Map();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['dateien', 'files', 'meine dateien', 'liste'], command: 'dateien' },
		{ keywords: ['ordner', 'folders', 'verzeichnisse', 'dirs'], command: 'ordner' },
		{ keywords: ['teilen', 'share', 'freigeben', 'link erstellen'], command: 'teilen' },
		{ keywords: ['suche', 'search', 'finde', 'durchsuchen'], command: 'suche' },
		{ keywords: ['favoriten', 'favorites', 'favs', 'gemerkte'], command: 'favoriten' },
		{ keywords: ['papierkorb', 'trash', 'geloeschte', 'muell'], command: 'papierkorb' },
		{ keywords: ['links', 'shares', 'freigaben', 'geteilte'], command: 'links' },
	]);

	constructor(
		configService: ConfigService,
		private storageService: StorageService,
		private sessionService: SessionService,
		private readonly transcriptionService: TranscriptionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath: this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
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

				// File commands
				case 'dateien':
				case 'files':
				case 'ls':
					await this.handleListFiles(roomId, sender, args[0]);
					break;

				case 'datei':
				case 'file':
				case 'info':
					await this.handleFileDetails(roomId, sender, args[0]);
					break;

				case 'download':
				case 'dl':
					await this.handleDownload(roomId, sender, args[0]);
					break;

				case 'loeschen':
				case 'delete':
				case 'rm':
					await this.handleDeleteFile(roomId, sender, args[0]);
					break;

				case 'umbenennen':
				case 'rename':
				case 'mv':
					await this.handleRenameFile(roomId, sender, args[0], args.slice(1).join(' '));
					break;

				case 'verschieben':
				case 'move':
					await this.handleMoveFile(roomId, sender, args[0], args[1]);
					break;

				// Folder commands
				case 'ordner':
				case 'folders':
				case 'dir':
					await this.handleListFolders(roomId, sender, args[0]);
					break;

				case 'neuordner':
				case 'mkdir':
				case 'newfolder':
					await this.handleCreateFolder(roomId, sender, args);
					break;

				case 'ordnerloeschen':
				case 'rmdir':
					await this.handleDeleteFolder(roomId, sender, args[0]);
					break;

				// Share commands
				case 'teilen':
				case 'share':
					await this.handleShareFile(roomId, sender, argString);
					break;

				case 'links':
				case 'shares':
					await this.handleListShares(roomId, sender);
					break;

				case 'linkloeschen':
				case 'unshare':
					await this.handleDeleteShare(roomId, sender, args[0]);
					break;

				// Organization
				case 'suche':
				case 'search':
				case 'find':
					await this.handleSearch(roomId, sender, argString);
					break;

				case 'favoriten':
				case 'favorites':
				case 'favs':
					await this.handleFavorites(roomId, sender);
					break;

				case 'fav':
				case 'favorit':
					await this.handleToggleFavorite(roomId, sender, args[0]);
					break;

				// Trash
				case 'papierkorb':
				case 'trash':
					await this.handleTrash(roomId, sender);
					break;

				case 'wiederherstellen':
				case 'restore':
					await this.handleRestore(roomId, sender, args[0]);
					break;

				case 'leeren':
				case 'emptytrash':
					await this.handleEmptyTrash(roomId, sender);
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
			await this.sendMessage(roomId, '<p>Verwendung: <code>!login email passwort</code></p>');
			return;
		}

		const [email, password] = args;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			const token = this.sessionService.getToken(sender);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendMessage(roomId, `<p>✅ Erfolgreich angemeldet als <strong>${email}</strong><br/>⚡ Credits: ${balance.balance.toFixed(2)}</p>`);
			} else {
				await this.sendMessage(roomId, `<p>✅ Erfolgreich angemeldet als <strong>${email}</strong></p>`);
			}
		} else {
			await this.sendMessage(roomId, `<p>Login fehlgeschlagen: ${result.error}</p>`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendOk = await this.storageService.checkHealth();
		const loggedIn = this.sessionService.isLoggedIn(sender);
		const sessions = this.sessionService.getSessionCount();
		const session = this.sessionService.getSession(sender);
		const token = this.sessionService.getToken(sender);

		let statusHtml = '<h3>Storage Bot Status</h3><ul>';
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

	// File handlers
	private async handleListFiles(roomId: string, sender: string, folderNumStr?: string) {
		const token = this.requireAuth(sender);

		let parentFolderId: string | undefined;
		if (folderNumStr) {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendMessage(roomId, '<p>Ungueltige Ordner-Nummer.</p>');
				return;
			}
			parentFolderId = folder.id;
			this.currentFolder.set(sender, folder.id);
		} else {
			this.currentFolder.set(sender, null);
		}

		const result = await this.storageService.getFiles(token, parentFolderId);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const files = result.data || [];
		this.filesMapper.setList(sender, files);

		if (files.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Dateien vorhanden.</p>');
			return;
		}

		let html = '<h3>Dateien</h3><ol>';
		for (const file of files) {
			const size = this.formatSize(file.size);
			const fav = file.isFavorite ? ' &#11088;' : '';
			html += `<li><strong>${file.name}</strong> (${size})${fav}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!datei [nr]</code> fuer Details oder <code>!download [nr]</code></em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleFileDetails(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.getFile(token, file.id);
		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const f = result.data!;
		const fav = f.isFavorite ? ' &#11088;' : '';
		let html = `<h3>${f.name}${fav}</h3>`;
		html += '<ul>';
		html += `<li>Typ: ${f.mimeType}</li>`;
		html += `<li>Groesse: ${this.formatSize(f.size)}</li>`;
		html += `<li>Erstellt: ${new Date(f.createdAt).toLocaleDateString('de-DE')}</li>`;
		html += `<li>Aktualisiert: ${new Date(f.updatedAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';
		html += `<p><em>Nutze <code>!download ${numberStr}</code> fuer Download-Link</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleDownload(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.getDownloadUrl(token, file.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(
			roomId,
			`<p><strong>${file.name}</strong></p><p>Download: <a href="${result.data!.url}">${result.data!.url}</a></p>`
		);
	}

	private async handleDeleteFile(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.deleteFile(token, file.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.filesMapper.clearList(sender);
		await this.sendMessage(roomId, `<p><strong>${file.name}</strong> in Papierkorb verschoben.</p>`);
	}

	private async handleRenameFile(roomId: string, sender: string, numberStr: string, newName: string) {
		if (!newName) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!umbenennen [nr] neuer name</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.renameFile(token, file.id, newName);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(roomId, `<p><strong>${file.name}</strong> umbenannt zu <strong>${newName}</strong></p>`);
	}

	private async handleMoveFile(roomId: string, sender: string, fileNumStr: string, folderNumStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, fileNumStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Datei-Nummer.</p>');
			return;
		}

		let parentFolderId: string | null = null;
		let folderName = 'Root';

		if (folderNumStr && folderNumStr !== '0' && folderNumStr.toLowerCase() !== 'root') {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendMessage(roomId, '<p>Ungueltige Ordner-Nummer. Nutze 0 oder root fuer Root.</p>');
				return;
			}
			parentFolderId = folder.id;
			folderName = folder.name;
		}

		const result = await this.storageService.moveFile(token, file.id, parentFolderId);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendMessage(roomId, `<p><strong>${file.name}</strong> nach <strong>${folderName}</strong> verschoben.</p>`);
	}

	// Folder handlers
	private async handleListFolders(roomId: string, sender: string, folderNumStr?: string) {
		const token = this.requireAuth(sender);

		let parentFolderId: string | undefined;
		if (folderNumStr) {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendMessage(roomId, '<p>Ungueltige Ordner-Nummer.</p>');
				return;
			}
			parentFolderId = folder.id;
		}

		const result = await this.storageService.getFolders(token, parentFolderId);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const folders = result.data || [];
		this.foldersMapper.setList(sender, folders);

		if (folders.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Ordner vorhanden.</p>');
			return;
		}

		let html = '<h3>Ordner</h3><ol>';
		for (const folder of folders) {
			const fav = folder.isFavorite ? ' &#11088;' : '';
			const color = folder.color ? ` [${folder.color}]` : '';
			html += `<li><strong>${folder.name}</strong>${color}${fav}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!dateien [nr]</code> um Dateien im Ordner zu sehen</em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleCreateFolder(roomId: string, sender: string, args: string[]) {
		if (args.length === 0) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!neuordner Name [in-ordner-nr]</code></p>');
			return;
		}

		const token = this.requireAuth(sender);

		// Check if last arg is a number (parent folder)
		let parentFolderId: string | undefined;
		let name = args.join(' ');

		const lastArg = args[args.length - 1];
		if (/^\d+$/.test(lastArg) && args.length > 1) {
			const folder = this.getFolderByNumber(sender, lastArg);
			if (folder) {
				parentFolderId = folder.id;
				name = args.slice(0, -1).join(' ');
			}
		}

		const result = await this.storageService.createFolder(token, name, parentFolderId);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.foldersMapper.clearList(sender);
		await this.sendMessage(roomId, `<p>Ordner <strong>${result.data!.name}</strong> erstellt.</p>`);
	}

	private async handleDeleteFolder(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const folder = this.getFolderByNumber(sender, numberStr);

		if (!folder) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!ordner</code></p>');
			return;
		}

		const result = await this.storageService.deleteFolder(token, folder.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.foldersMapper.clearList(sender);
		await this.sendMessage(roomId, `<p>Ordner <strong>${folder.name}</strong> in Papierkorb verschoben.</p>`);
	}

	// Share handlers
	private async handleShareFile(roomId: string, sender: string, argString: string) {
		const token = this.requireAuth(sender);

		// Parse arguments
		const args = argString.split(/\s+/);
		const numberStr = args[0];
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const options: { expiresInDays?: number; password?: string; maxDownloads?: number } = {};

		// Parse --tage N
		const daysMatch = argString.match(/--tage\s+(\d+)/i);
		if (daysMatch) {
			options.expiresInDays = parseInt(daysMatch[1], 10);
		}

		// Parse --passwort XXX
		const passMatch = argString.match(/--passwort\s+(\S+)/i);
		if (passMatch) {
			options.password = passMatch[1];
		}

		// Parse --downloads N
		const dlMatch = argString.match(/--downloads\s+(\d+)/i);
		if (dlMatch) {
			options.maxDownloads = parseInt(dlMatch[1], 10);
		}

		const result = await this.storageService.createShare(token, file.id, options);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const share = result.data!;
		const shareUrl = `${this.configService.get('storage.backendUrl')}/public/shares/${share.shareToken}`;

		let html = `<p><strong>${file.name}</strong> wird geteilt:</p>`;
		html += `<p><a href="${shareUrl}">${shareUrl}</a></p>`;
		if (options.expiresInDays) html += `<p><em>Gueltig: ${options.expiresInDays} Tage</em></p>`;
		if (options.password) html += `<p><em>Passwort geschuetzt</em></p>`;
		if (options.maxDownloads) html += `<p><em>Max Downloads: ${options.maxDownloads}</em></p>`;

		await this.sendMessage(roomId, html);
	}

	private async handleListShares(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getShares(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const shares = result.data || [];
		this.sharesMapper.setList(sender, shares);

		if (shares.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Share-Links vorhanden.</p>');
			return;
		}

		let html = '<h3>Share-Links</h3><ol>';
		for (const share of shares) {
			const expires = share.expiresAt ? ` (bis ${new Date(share.expiresAt).toLocaleDateString('de-DE')})` : '';
			const downloads = share.maxDownloads ? ` [${share.downloadCount}/${share.maxDownloads}]` : ` [${share.downloadCount} DL]`;
			html += `<li>${share.shareType}${expires}${downloads}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!linkloeschen [nr]</code> zum Loeschen</em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleDeleteShare(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);

		if (!this.sharesMapper.hasList(sender)) {
			await this.sendMessage(roomId, '<p>Nutze zuerst <code>!links</code></p>');
			return;
		}

		const num = parseInt(numberStr, 10);
		const share = isNaN(num) ? null : this.sharesMapper.getByNumber(sender, num);
		if (!share) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer.</p>');
			return;
		}
		const result = await this.storageService.deleteShare(token, share.id);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.sharesMapper.clearList(sender);
		await this.sendMessage(roomId, '<p>Share-Link geloescht.</p>');
	}

	// Search & Favorites
	private async handleSearch(roomId: string, sender: string, query: string) {
		if (!query) {
			await this.sendMessage(roomId, '<p>Verwendung: <code>!suche Begriff</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const result = await this.storageService.search(token, query);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { files, folders } = result.data!;
		this.filesMapper.setList(sender, files);
		this.foldersMapper.setList(sender, folders);

		if (files.length === 0 && folders.length === 0) {
			await this.sendMessage(roomId, `<p>Keine Ergebnisse fuer "${query}"</p>`);
			return;
		}

		let html = `<h3>Suchergebnisse: "${query}"</h3>`;

		if (folders.length > 0) {
			html += '<p><strong>Ordner:</strong></p><ol>';
			for (const folder of folders) {
				html += `<li>${folder.name}</li>`;
			}
			html += '</ol>';
		}

		if (files.length > 0) {
			html += '<p><strong>Dateien:</strong></p><ol>';
			for (const file of files) {
				html += `<li>${file.name} (${this.formatSize(file.size)})</li>`;
			}
			html += '</ol>';
		}

		await this.sendMessage(roomId, html);
	}

	private async handleFavorites(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getFavorites(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { files, folders } = result.data!;
		this.filesMapper.setList(sender, files);
		this.foldersMapper.setList(sender, folders);

		if (files.length === 0 && folders.length === 0) {
			await this.sendMessage(roomId, '<p>Keine Favoriten vorhanden.</p>');
			return;
		}

		let html = '<h3>Favoriten &#11088;</h3>';

		if (folders.length > 0) {
			html += '<p><strong>Ordner:</strong></p><ol>';
			for (const folder of folders) {
				html += `<li>${folder.name}</li>`;
			}
			html += '</ol>';
		}

		if (files.length > 0) {
			html += '<p><strong>Dateien:</strong></p><ol>';
			for (const file of files) {
				html += `<li>${file.name}</li>`;
			}
			html += '</ol>';
		}

		await this.sendMessage(roomId, html);
	}

	private async handleToggleFavorite(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);

		// Try file first
		const file = this.getFileByNumber(sender, numberStr);
		if (file) {
			const result = await this.storageService.toggleFileFavorite(token, file.id);
			if (result.error) {
				await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
				return;
			}
			const status = result.data!.isFavorite ? 'hinzugefuegt' : 'entfernt';
			await this.sendMessage(roomId, `<p><strong>${file.name}</strong>: Favorit ${status}</p>`);
			return;
		}

		// Try folder
		const folder = this.getFolderByNumber(sender, numberStr);
		if (folder) {
			const result = await this.storageService.toggleFolderFavorite(token, folder.id);
			if (result.error) {
				await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
				return;
			}
			const status = result.data!.isFavorite ? 'hinzugefuegt' : 'entfernt';
			await this.sendMessage(roomId, `<p><strong>${folder.name}</strong>: Favorit ${status}</p>`);
			return;
		}

		await this.sendMessage(roomId, '<p>Ungueltige Nummer.</p>');
	}

	// Trash handlers
	private async handleTrash(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getTrash(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const items = result.data || [];
		this.trashMapper.setList(sender, items);

		if (items.length === 0) {
			await this.sendMessage(roomId, '<p>Papierkorb ist leer.</p>');
			return;
		}

		let html = '<h3>Papierkorb</h3><ol>';
		for (const item of items) {
			const type = item.type === 'folder' ? '&#128193;' : '&#128196;';
			const deleted = new Date(item.deletedAt).toLocaleDateString('de-DE');
			html += `<li>${type} <strong>${item.name}</strong> (geloescht: ${deleted})</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!wiederherstellen [nr]</code> oder <code>!leeren</code></em></p>';

		await this.sendMessage(roomId, html);
	}

	private async handleRestore(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);

		if (!this.trashMapper.hasList(sender)) {
			await this.sendMessage(roomId, '<p>Nutze zuerst <code>!papierkorb</code></p>');
			return;
		}

		const num = parseInt(numberStr, 10);
		const item = isNaN(num) ? null : this.trashMapper.getByNumber(sender, num);
		if (!item) {
			await this.sendMessage(roomId, '<p>Ungueltige Nummer.</p>');
			return;
		}
		const result = await this.storageService.restoreFromTrash(token, item.id, item.type);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.trashMapper.clearList(sender);
		await this.sendMessage(roomId, `<p><strong>${item.name}</strong> wiederhergestellt.</p>`);
	}

	private async handleEmptyTrash(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.emptyTrash(token);

		if (result.error) {
			await this.sendMessage(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.trashMapper.clearList(sender);
		await this.sendMessage(roomId, '<p>Papierkorb geleert.</p>');
	}

	// Helper methods
	private getFileByNumber(sender: string, numberStr: string): StorageFile | null {
		const num = parseInt(numberStr, 10);
		if (isNaN(num)) return null;
		return this.filesMapper.getByNumber(sender, num);
	}

	private getFolderByNumber(sender: string, numberStr: string): Folder | null {
		const num = parseInt(numberStr, 10);
		if (isNaN(num)) return null;
		return this.foldersMapper.getByNumber(sender, num);
	}

	private formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
}

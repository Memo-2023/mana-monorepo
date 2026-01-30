import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
} from 'matrix-bot-sdk';
import { StorageService, StorageFile, Folder, ShareLink, TrashItem } from '../storage/storage.service';
import { SessionService } from '../session/session.service';
import { HELP_MESSAGE } from '../config/configuration';

type ListItem = StorageFile | Folder;

@Injectable()
export class MatrixService implements OnModuleInit {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private allowedRooms: string[];

	// Store last shown items per user for reference by number
	private lastFilesList: Map<string, StorageFile[]> = new Map();
	private lastFoldersList: Map<string, Folder[]> = new Map();
	private lastSharesList: Map<string, ShareLink[]> = new Map();
	private lastTrashList: Map<string, TrashItem[]> = new Map();
	private currentFolder: Map<string, string | null> = new Map();

	constructor(
		private configService: ConfigService,
		private storageService: StorageService,
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
		this.logger.log('Matrix Storage Bot started');
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
		const backendOk = await this.storageService.checkHealth();
		const loggedIn = this.sessionService.isLoggedIn(sender);
		const sessions = this.sessionService.getSessionCount();

		await this.sendHtml(
			roomId,
			`<h3>Storage Bot Status</h3>
<ul>
<li>Backend: ${backendOk ? 'Online' : 'Offline'}</li>
<li>Angemeldet: ${loggedIn ? 'Ja' : 'Nein'}</li>
<li>Aktive Sessions: ${sessions}</li>
</ul>`
		);
	}

	// File handlers
	private async handleListFiles(roomId: string, sender: string, folderNumStr?: string) {
		const token = this.requireAuth(sender);

		let parentFolderId: string | undefined;
		if (folderNumStr) {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendHtml(roomId, '<p>Ungueltige Ordner-Nummer.</p>');
				return;
			}
			parentFolderId = folder.id;
			this.currentFolder.set(sender, folder.id);
		} else {
			this.currentFolder.set(sender, null);
		}

		const result = await this.storageService.getFiles(token, parentFolderId);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const files = result.data || [];
		this.lastFilesList.set(sender, files);

		if (files.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Dateien vorhanden.</p>');
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

		await this.sendHtml(roomId, html);
	}

	private async handleFileDetails(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.getFile(token, file.id);
		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
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

		await this.sendHtml(roomId, html);
	}

	private async handleDownload(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.getDownloadUrl(token, file.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p><strong>${file.name}</strong></p><p>Download: <a href="${result.data!.url}">${result.data!.url}</a></p>`
		);
	}

	private async handleDeleteFile(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.deleteFile(token, file.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastFilesList.delete(sender);
		await this.sendHtml(roomId, `<p><strong>${file.name}</strong> in Papierkorb verschoben.</p>`);
	}

	private async handleRenameFile(roomId: string, sender: string, numberStr: string, newName: string) {
		if (!newName) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!umbenennen [nr] neuer name</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const result = await this.storageService.renameFile(token, file.id, newName);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(roomId, `<p><strong>${file.name}</strong> umbenannt zu <strong>${newName}</strong></p>`);
	}

	private async handleMoveFile(roomId: string, sender: string, fileNumStr: string, folderNumStr: string) {
		const token = this.requireAuth(sender);
		const file = this.getFileByNumber(sender, fileNumStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Datei-Nummer.</p>');
			return;
		}

		let parentFolderId: string | null = null;
		let folderName = 'Root';

		if (folderNumStr && folderNumStr !== '0' && folderNumStr.toLowerCase() !== 'root') {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendHtml(roomId, '<p>Ungueltige Ordner-Nummer. Nutze 0 oder root fuer Root.</p>');
				return;
			}
			parentFolderId = folder.id;
			folderName = folder.name;
		}

		const result = await this.storageService.moveFile(token, file.id, parentFolderId);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(roomId, `<p><strong>${file.name}</strong> nach <strong>${folderName}</strong> verschoben.</p>`);
	}

	// Folder handlers
	private async handleListFolders(roomId: string, sender: string, folderNumStr?: string) {
		const token = this.requireAuth(sender);

		let parentFolderId: string | undefined;
		if (folderNumStr) {
			const folder = this.getFolderByNumber(sender, folderNumStr);
			if (!folder) {
				await this.sendHtml(roomId, '<p>Ungueltige Ordner-Nummer.</p>');
				return;
			}
			parentFolderId = folder.id;
		}

		const result = await this.storageService.getFolders(token, parentFolderId);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const folders = result.data || [];
		this.lastFoldersList.set(sender, folders);

		if (folders.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Ordner vorhanden.</p>');
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

		await this.sendHtml(roomId, html);
	}

	private async handleCreateFolder(roomId: string, sender: string, args: string[]) {
		if (args.length === 0) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!neuordner Name [in-ordner-nr]</code></p>');
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
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastFoldersList.delete(sender);
		await this.sendHtml(roomId, `<p>Ordner <strong>${result.data!.name}</strong> erstellt.</p>`);
	}

	private async handleDeleteFolder(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const folder = this.getFolderByNumber(sender, numberStr);

		if (!folder) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!ordner</code></p>');
			return;
		}

		const result = await this.storageService.deleteFolder(token, folder.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastFoldersList.delete(sender);
		await this.sendHtml(roomId, `<p>Ordner <strong>${folder.name}</strong> in Papierkorb verschoben.</p>`);
	}

	// Share handlers
	private async handleShareFile(roomId: string, sender: string, argString: string) {
		const token = this.requireAuth(sender);

		// Parse arguments
		const args = argString.split(/\s+/);
		const numberStr = args[0];
		const file = this.getFileByNumber(sender, numberStr);

		if (!file) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!dateien</code></p>');
			return;
		}

		const options: any = {};

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
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const share = result.data!;
		const shareUrl = `${this.configService.get('storage.backendUrl')}/public/shares/${share.shareToken}`;

		let html = `<p><strong>${file.name}</strong> wird geteilt:</p>`;
		html += `<p><a href="${shareUrl}">${shareUrl}</a></p>`;
		if (options.expiresInDays) html += `<p><em>Gueltig: ${options.expiresInDays} Tage</em></p>`;
		if (options.password) html += `<p><em>Passwort geschuetzt</em></p>`;
		if (options.maxDownloads) html += `<p><em>Max Downloads: ${options.maxDownloads}</em></p>`;

		await this.sendHtml(roomId, html);
	}

	private async handleListShares(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getShares(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const shares = result.data || [];
		this.lastSharesList.set(sender, shares);

		if (shares.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Share-Links vorhanden.</p>');
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

		await this.sendHtml(roomId, html);
	}

	private async handleDeleteShare(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const shares = this.lastSharesList.get(sender);

		if (!shares) {
			await this.sendHtml(roomId, '<p>Nutze zuerst <code>!links</code></p>');
			return;
		}

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= shares.length) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer.</p>');
			return;
		}

		const share = shares[index];
		const result = await this.storageService.deleteShare(token, share.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastSharesList.delete(sender);
		await this.sendHtml(roomId, '<p>Share-Link geloescht.</p>');
	}

	// Search & Favorites
	private async handleSearch(roomId: string, sender: string, query: string) {
		if (!query) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!suche Begriff</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const result = await this.storageService.search(token, query);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { files, folders } = result.data!;
		this.lastFilesList.set(sender, files);
		this.lastFoldersList.set(sender, folders);

		if (files.length === 0 && folders.length === 0) {
			await this.sendHtml(roomId, `<p>Keine Ergebnisse fuer "${query}"</p>`);
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

		await this.sendHtml(roomId, html);
	}

	private async handleFavorites(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getFavorites(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { files, folders } = result.data!;
		this.lastFilesList.set(sender, files);
		this.lastFoldersList.set(sender, folders);

		if (files.length === 0 && folders.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Favoriten vorhanden.</p>');
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

		await this.sendHtml(roomId, html);
	}

	private async handleToggleFavorite(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);

		// Try file first
		const file = this.getFileByNumber(sender, numberStr);
		if (file) {
			const result = await this.storageService.toggleFileFavorite(token, file.id);
			if (result.error) {
				await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
				return;
			}
			const status = result.data!.isFavorite ? 'hinzugefuegt' : 'entfernt';
			await this.sendHtml(roomId, `<p><strong>${file.name}</strong>: Favorit ${status}</p>`);
			return;
		}

		// Try folder
		const folder = this.getFolderByNumber(sender, numberStr);
		if (folder) {
			const result = await this.storageService.toggleFolderFavorite(token, folder.id);
			if (result.error) {
				await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
				return;
			}
			const status = result.data!.isFavorite ? 'hinzugefuegt' : 'entfernt';
			await this.sendHtml(roomId, `<p><strong>${folder.name}</strong>: Favorit ${status}</p>`);
			return;
		}

		await this.sendHtml(roomId, '<p>Ungueltige Nummer.</p>');
	}

	// Trash handlers
	private async handleTrash(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.getTrash(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const items = result.data || [];
		this.lastTrashList.set(sender, items);

		if (items.length === 0) {
			await this.sendHtml(roomId, '<p>Papierkorb ist leer.</p>');
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

		await this.sendHtml(roomId, html);
	}

	private async handleRestore(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const items = this.lastTrashList.get(sender);

		if (!items) {
			await this.sendHtml(roomId, '<p>Nutze zuerst <code>!papierkorb</code></p>');
			return;
		}

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= items.length) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer.</p>');
			return;
		}

		const item = items[index];
		const result = await this.storageService.restoreFromTrash(token, item.id, item.type);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastTrashList.delete(sender);
		await this.sendHtml(roomId, `<p><strong>${item.name}</strong> wiederhergestellt.</p>`);
	}

	private async handleEmptyTrash(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.storageService.emptyTrash(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastTrashList.delete(sender);
		await this.sendHtml(roomId, '<p>Papierkorb geleert.</p>');
	}

	// Helper methods
	private getFileByNumber(sender: string, numberStr: string): StorageFile | null {
		const files = this.lastFilesList.get(sender);
		if (!files) return null;

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= files.length) return null;

		return files[index];
	}

	private getFolderByNumber(sender: string, numberStr: string): Folder | null {
		const folders = this.lastFoldersList.get(sender);
		if (!folders) return null;

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= folders.length) return null;

		return folders[index];
	}

	private formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
}

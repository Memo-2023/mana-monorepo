import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UserSession {
	token: string;
	email: string;
	expiresAt: Date;
	currentConversationId?: string;
	selectedModelId?: string;
}

@Injectable()
export class SessionService {
	private readonly logger = new Logger(SessionService.name);
	private sessions: Map<string, UserSession> = new Map();
	private authUrl: string;

	// Store conversation list mappings per user
	private conversationMappings: Map<string, string[]> = new Map();
	private modelMappings: Map<string, string[]> = new Map();

	constructor(private configService: ConfigService) {
		this.authUrl = this.configService.get<string>('auth.url') || 'http://localhost:3001';
	}

	async login(
		matrixUserId: string,
		email: string,
		password: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: errorData.message || 'Authentifizierung fehlgeschlagen',
				};
			}

			const data = await response.json();
			const token = data.accessToken || data.token;

			if (!token) {
				return { success: false, error: 'Kein Token erhalten' };
			}

			this.sessions.set(matrixUserId, {
				token,
				email,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			});

			this.logger.log(`User ${matrixUserId} logged in as ${email}`);
			return { success: true };
		} catch (error) {
			this.logger.error(`Login failed for ${matrixUserId}:`, error);
			return {
				success: false,
				error: 'Verbindung zum Auth-Server fehlgeschlagen',
			};
		}
	}

	logout(matrixUserId: string): void {
		this.sessions.delete(matrixUserId);
		this.conversationMappings.delete(matrixUserId);
		this.modelMappings.delete(matrixUserId);
		this.logger.log(`User ${matrixUserId} logged out`);
	}

	getToken(matrixUserId: string): string | null {
		const session = this.sessions.get(matrixUserId);
		if (!session) return null;
		if (session.expiresAt < new Date()) {
			this.sessions.delete(matrixUserId);
			return null;
		}
		return session.token;
	}

	isLoggedIn(matrixUserId: string): boolean {
		return this.getToken(matrixUserId) !== null;
	}

	getSessionCount(): number {
		return this.sessions.size;
	}

	// Current conversation management
	setCurrentConversation(matrixUserId: string, conversationId: string | null): void {
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.currentConversationId = conversationId || undefined;
		}
	}

	getCurrentConversation(matrixUserId: string): string | null {
		const session = this.sessions.get(matrixUserId);
		return session?.currentConversationId || null;
	}

	// Selected model management
	setSelectedModel(matrixUserId: string, modelId: string): void {
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.selectedModelId = modelId;
		}
	}

	getSelectedModel(matrixUserId: string): string | null {
		const session = this.sessions.get(matrixUserId);
		return session?.selectedModelId || null;
	}

	// Conversation number mapping
	setConversationMapping(matrixUserId: string, ids: string[]): void {
		this.conversationMappings.set(matrixUserId, ids);
	}

	getConversationId(matrixUserId: string, number: number): string | null {
		const ids = this.conversationMappings.get(matrixUserId);
		if (!ids || number < 1 || number > ids.length) return null;
		return ids[number - 1];
	}

	// Model number mapping
	setModelMapping(matrixUserId: string, ids: string[]): void {
		this.modelMappings.set(matrixUserId, ids);
	}

	getModelId(matrixUserId: string, number: number): string | null {
		const ids = this.modelMappings.get(matrixUserId);
		if (!ids || number < 1 || number > ids.length) return null;
		return ids[number - 1];
	}
}

/**
 * API Keys Service — Generate, validate, revoke service API keys
 */

import { eq, and, isNull, sql } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';
import type { Database } from '../db/connection';
import { NotFoundError } from '../lib/errors';

// Schema imported inline to avoid circular deps
import { apiKeys } from '../db/schema/api-keys';

export class ApiKeysService {
	constructor(private db: Database) {}

	private generateKey(): string {
		return `sk_live_${randomBytes(32).toString('hex')}`;
	}

	private hashKey(key: string): string {
		return createHash('sha256').update(key).digest('hex');
	}

	private getKeyPrefix(key: string): string {
		return key.replace('sk_live_', '').slice(0, 8);
	}

	async listUserApiKeys(userId: string) {
		return this.db
			.select({
				id: apiKeys.id,
				name: apiKeys.name,
				keyPrefix: apiKeys.keyPrefix,
				scopes: apiKeys.scopes,
				createdAt: apiKeys.createdAt,
				lastUsedAt: apiKeys.lastUsedAt,
				revokedAt: apiKeys.revokedAt,
			})
			.from(apiKeys)
			.where(eq(apiKeys.userId, userId));
	}

	async createApiKey(userId: string, data: { name: string; scopes?: string[] }) {
		const key = this.generateKey();
		const hash = this.hashKey(key);
		const prefix = this.getKeyPrefix(key);

		const [created] = await this.db
			.insert(apiKeys)
			.values({
				userId,
				name: data.name,
				keyHash: hash,
				keyPrefix: prefix,
				scopes: data.scopes || ['stt', 'tts'],
			})
			.returning();

		return { ...created, key }; // Full key returned ONLY on creation
	}

	async revokeApiKey(userId: string, keyId: string) {
		const [revoked] = await this.db
			.update(apiKeys)
			.set({ revokedAt: new Date() })
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
			.returning();

		if (!revoked) throw new NotFoundError('API key not found');
		return { success: true };
	}

	async validateApiKey(apiKey: string, scope?: string) {
		const hash = this.hashKey(apiKey);

		const [key] = await this.db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
			.limit(1);

		if (!key) return { valid: false };

		// Check scope if provided
		if (scope && key.scopes && !(key.scopes as string[]).includes(scope)) {
			return { valid: false, reason: 'scope_denied' };
		}

		// Update lastUsedAt (fire-and-forget)
		this.db
			.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKeys.id, key.id))
			.catch(() => {});

		return {
			valid: true,
			userId: key.userId,
			scopes: key.scopes,
			rateLimit: { requests: 60, window: 60 },
		};
	}
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, isNull } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';
import { getDb } from '../db/connection';
import { apiKeys } from '../db/schema';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import type { ValidateApiKeyResponseDto } from './dto/validate-api-key.dto';

const DEFAULT_SCOPES = ['stt', 'tts'];
const KEY_PREFIX = 'sk_live_';

@Injectable()
export class ApiKeysService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Generate a new API key
	 * Format: sk_live_<32 random hex chars>
	 */
	private generateKey(): string {
		const randomPart = randomBytes(16).toString('hex');
		return `${KEY_PREFIX}${randomPart}`;
	}

	/**
	 * Hash an API key using SHA-256
	 */
	private hashKey(key: string): string {
		return createHash('sha256').update(key).digest('hex');
	}

	/**
	 * Extract prefix for display (first 12 characters after sk_live_)
	 */
	private getKeyPrefix(key: string): string {
		return key.substring(0, KEY_PREFIX.length + 8) + '...';
	}

	/**
	 * List all API keys for a user (without exposing the full key)
	 */
	async listUserApiKeys(userId: string) {
		const db = this.getDb();
		const keys = await db
			.select({
				id: apiKeys.id,
				name: apiKeys.name,
				keyPrefix: apiKeys.keyPrefix,
				scopes: apiKeys.scopes,
				rateLimitRequests: apiKeys.rateLimitRequests,
				rateLimitWindow: apiKeys.rateLimitWindow,
				createdAt: apiKeys.createdAt,
				lastUsedAt: apiKeys.lastUsedAt,
				revokedAt: apiKeys.revokedAt,
			})
			.from(apiKeys)
			.where(eq(apiKeys.userId, userId));

		return keys;
	}

	/**
	 * Create a new API key
	 * Returns the full key only once - it cannot be retrieved later
	 */
	async createApiKey(userId: string, dto: CreateApiKeyDto) {
		const db = this.getDb();

		const key = this.generateKey();
		const keyHash = this.hashKey(key);
		const keyPrefix = this.getKeyPrefix(key);

		const [apiKey] = await db
			.insert(apiKeys)
			.values({
				id: nanoid(),
				userId,
				name: dto.name,
				keyPrefix,
				keyHash,
				scopes: dto.scopes || DEFAULT_SCOPES,
				rateLimitRequests: dto.rateLimitRequests || 60,
				rateLimitWindow: dto.rateLimitWindow || 60,
			})
			.returning();

		// Return the full key only on creation
		return {
			id: apiKey.id,
			name: apiKey.name,
			key, // Full key - shown only once
			keyPrefix: apiKey.keyPrefix,
			scopes: apiKey.scopes,
			rateLimitRequests: apiKey.rateLimitRequests,
			rateLimitWindow: apiKey.rateLimitWindow,
			createdAt: apiKey.createdAt,
		};
	}

	/**
	 * Revoke an API key (soft delete)
	 */
	async revokeApiKey(userId: string, keyId: string) {
		const db = this.getDb();

		// Verify key exists and belongs to user
		const [existing] = await db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException('API key not found');
		}

		await db
			.update(apiKeys)
			.set({ revokedAt: new Date() })
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
	}

	/**
	 * Validate an API key (for STT/TTS services to call)
	 * This endpoint does NOT require authentication
	 */
	async validateApiKey(apiKey: string, scope?: string): Promise<ValidateApiKeyResponseDto> {
		const db = this.getDb();

		// Hash the incoming key to compare
		const keyHash = this.hashKey(apiKey);

		// Find the key
		const [key] = await db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
			.limit(1);

		if (!key) {
			return { valid: false, error: 'Invalid or revoked API key' };
		}

		// Check scope if provided
		if (scope && key.scopes && !key.scopes.includes(scope)) {
			return { valid: false, error: `API key does not have scope: ${scope}` };
		}

		// Update last used timestamp (fire-and-forget)
		db.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKeys.id, key.id))
			.then(() => {})
			.catch(() => {});

		return {
			valid: true,
			userId: key.userId,
			scopes: key.scopes || [],
			rateLimit: {
				requests: key.rateLimitRequests,
				window: key.rateLimitWindow,
			},
		};
	}
}

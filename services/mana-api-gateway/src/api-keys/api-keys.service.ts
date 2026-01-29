import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../db/database.module';
import { apiKeys, ApiKey, NewApiKey } from '../db/schema';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto';
import { PRICING_TIERS, PricingTier } from '../config/pricing';

export interface ApiKeyData {
	id: string;
	userId: string | null;
	organizationId: string | null;
	name: string;
	tier: string;
	rateLimit: number;
	monthlyCredits: number;
	creditsUsed: number;
	allowedEndpoints: string | null;
	allowedIps: string | null;
	active: boolean;
	expiresAt: Date | null;
	lastUsedAt: Date | null;
}

@Injectable()
export class ApiKeysService {
	private readonly keyPrefixLive: string;
	private readonly keyPrefixTest: string;

	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: ReturnType<typeof import('../db/connection').getDb>,
		private readonly configService: ConfigService
	) {
		this.keyPrefixLive = this.configService.get('apiKey.prefixLive') || 'sk_live_';
		this.keyPrefixTest = this.configService.get('apiKey.prefixTest') || 'sk_test_';
	}

	/**
	 * Generate a new API key
	 */
	private generateKey(isTest: boolean = false): { key: string; hash: string; prefix: string } {
		const prefix = isTest ? this.keyPrefixTest : this.keyPrefixLive;
		const randomPart = crypto.randomBytes(24).toString('base64url');
		const key = `${prefix}${randomPart}`;
		const hash = crypto.createHash('sha256').update(key).digest('hex');
		return { key, hash, prefix };
	}

	/**
	 * Create a new API key for a user
	 */
	async create(userId: string, dto: CreateApiKeyDto): Promise<{ key: string; apiKey: ApiKey }> {
		const { key, hash, prefix } = this.generateKey(dto.isTest);
		const tier = (dto.tier || 'free') as PricingTier;
		const tierConfig = PRICING_TIERS[tier];

		const newKey: NewApiKey = {
			key: key,
			keyHash: hash,
			keyPrefix: prefix,
			userId,
			name: dto.name,
			description: dto.description,
			tier,
			rateLimit: tierConfig.rateLimit,
			monthlyCredits: tierConfig.monthlyCredits,
			creditsUsed: 0,
			creditsResetAt: this.getNextMonthReset(),
			allowedEndpoints: dto.allowedEndpoints
				? JSON.stringify(dto.allowedEndpoints)
				: JSON.stringify(tierConfig.endpoints),
			allowedIps: dto.allowedIps ? JSON.stringify(dto.allowedIps) : null,
			active: true,
			expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
		};

		const [created] = await this.db.insert(apiKeys).values(newKey).returning();

		// Return the full key only on creation (it's not stored)
		return {
			key,
			apiKey: { ...created, key: this.maskKey(key) },
		};
	}

	/**
	 * List all API keys for a user (keys are masked)
	 */
	async listByUser(userId: string): Promise<ApiKey[]> {
		const keys = await this.db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

		return keys.map((k) => ({
			...k,
			key: this.maskKey(k.key),
		}));
	}

	/**
	 * Get a single API key by ID (verified for user ownership)
	 */
	async getByIdAndUser(id: string, userId: string): Promise<ApiKey> {
		const [key] = await this.db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

		if (!key) {
			throw new NotFoundException('API key not found');
		}

		return { ...key, key: this.maskKey(key.key) };
	}

	/**
	 * Validate an API key and return its data
	 */
	async validateKey(rawKey: string): Promise<ApiKeyData | null> {
		const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

		const [key] = await this.db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash));

		if (!key) {
			return null;
		}

		// Update last used timestamp
		await this.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));

		return {
			id: key.id,
			userId: key.userId,
			organizationId: key.organizationId,
			name: key.name,
			tier: key.tier,
			rateLimit: key.rateLimit,
			monthlyCredits: key.monthlyCredits,
			creditsUsed: key.creditsUsed,
			allowedEndpoints: key.allowedEndpoints,
			allowedIps: key.allowedIps,
			active: key.active,
			expiresAt: key.expiresAt,
			lastUsedAt: key.lastUsedAt,
		};
	}

	/**
	 * Update an API key
	 */
	async update(id: string, userId: string, dto: UpdateApiKeyDto): Promise<ApiKey> {
		// Verify ownership
		await this.getByIdAndUser(id, userId);

		const updates: Partial<NewApiKey> = {
			updatedAt: new Date(),
		};

		if (dto.name !== undefined) updates.name = dto.name;
		if (dto.description !== undefined) updates.description = dto.description;
		if (dto.allowedEndpoints !== undefined) {
			updates.allowedEndpoints = JSON.stringify(dto.allowedEndpoints);
		}
		if (dto.allowedIps !== undefined) {
			updates.allowedIps = JSON.stringify(dto.allowedIps);
		}
		if (dto.active !== undefined) updates.active = dto.active;
		if (dto.expiresAt !== undefined) {
			updates.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
		}

		const [updated] = await this.db
			.update(apiKeys)
			.set(updates)
			.where(eq(apiKeys.id, id))
			.returning();

		return { ...updated, key: this.maskKey(updated.key) };
	}

	/**
	 * Delete an API key
	 */
	async delete(id: string, userId: string): Promise<void> {
		// Verify ownership
		await this.getByIdAndUser(id, userId);

		await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
	}

	/**
	 * Regenerate an API key
	 */
	async regenerate(id: string, userId: string): Promise<{ key: string; apiKey: ApiKey }> {
		// Verify ownership
		const existing = await this.getByIdAndUser(id, userId);
		const isTest = existing.keyPrefix === this.keyPrefixTest;

		const { key, hash, prefix } = this.generateKey(isTest);

		const [updated] = await this.db
			.update(apiKeys)
			.set({
				key,
				keyHash: hash,
				keyPrefix: prefix,
				updatedAt: new Date(),
			})
			.where(eq(apiKeys.id, id))
			.returning();

		return {
			key,
			apiKey: { ...updated, key: this.maskKey(key) },
		};
	}

	/**
	 * Increment credits used for an API key
	 */
	async incrementCreditsUsed(id: string, amount: number): Promise<void> {
		const [key] = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id));

		if (key) {
			// Check if we need to reset credits
			if (key.creditsResetAt && new Date() > key.creditsResetAt) {
				await this.db
					.update(apiKeys)
					.set({
						creditsUsed: amount,
						creditsResetAt: this.getNextMonthReset(),
					})
					.where(eq(apiKeys.id, id));
			} else {
				await this.db
					.update(apiKeys)
					.set({
						creditsUsed: key.creditsUsed + amount,
					})
					.where(eq(apiKeys.id, id));
			}
		}
	}

	/**
	 * Check if API key has enough credits
	 */
	async hasEnoughCredits(id: string, requiredCredits: number): Promise<boolean> {
		const [key] = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id));

		if (!key) return false;

		// Check if we need to reset credits
		if (key.creditsResetAt && new Date() > key.creditsResetAt) {
			return true; // Credits will be reset
		}

		return key.creditsUsed + requiredCredits <= key.monthlyCredits;
	}

	/**
	 * Mask an API key for display (show only prefix and last 4 chars)
	 */
	private maskKey(key: string): string {
		if (key.length <= 12) return key;
		const prefix = key.startsWith(this.keyPrefixTest) ? this.keyPrefixTest : this.keyPrefixLive;
		return `${prefix}...${key.slice(-4)}`;
	}

	/**
	 * Get the next month reset date
	 */
	private getNextMonthReset(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + 1, 1);
	}
}

/**
 * Access to research.provider_configs — per-user BYO-key + budget storage.
 *
 * Phase 1: plaintext storage with a TODO for encryption in Phase 4 when the
 * Settings UI ships. Column name is still `apiKeyEncrypted` so the schema
 * doesn't need a rename later.
 */

import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { providerConfigs } from '../db/schema/research';
import type { ProviderConfig } from '../db/schema/research';

export class ConfigStorage {
	constructor(private db: Database) {}

	async getForUser(userId: string, providerId: string): Promise<ProviderConfig | null> {
		const [row] = await this.db
			.select()
			.from(providerConfigs)
			.where(and(eq(providerConfigs.userId, userId), eq(providerConfigs.providerId, providerId)))
			.limit(1);
		return row ?? null;
	}

	async decryptKey(config: ProviderConfig): Promise<string | null> {
		// TODO (Phase 4): AES-GCM-256 decryption via MANA_RESEARCH_KEK or mana-auth KEK wrapping.
		// Phase 1: plaintext passthrough — BYO-key UX isn't built yet, so this path stays unused.
		return config.apiKeyEncrypted ?? null;
	}
}

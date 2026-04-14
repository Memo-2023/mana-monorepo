/**
 * BYOK Key Vault — encrypted CRUD for user-provided API keys.
 *
 * Keys are encrypted with the user's master key (same vault as the
 * rest of Mana's encrypted tables). Without an unlocked vault, keys
 * cannot be read — even if someone exfiltrates IndexedDB, the keys
 * stay ciphertext.
 *
 * NOT synced: keys live device-local. Users must add them on each
 * device. This is deliberate — a compromised server shouldn't be
 * able to redistribute users' API keys.
 */

import { db } from '$lib/data/database';
import { wrapValue, unwrapValue } from '$lib/data/crypto/aes';
import { getActiveKey } from '$lib/data/crypto/key-provider';
import type { ByokProviderId } from '@mana/shared-llm';
import type { ByokKeyRecord, ByokKeyPlain } from './types';

const TABLE = '_byokKeys';

function requireKey(): CryptoKey {
	const key = getActiveKey();
	if (!key) {
		throw new Error('Vault ist nicht entsperrt — bitte zuerst anmelden.');
	}
	return key;
}

async function encryptApiKey(apiKey: string): Promise<unknown> {
	return wrapValue(apiKey, requireKey());
}

async function decryptApiKey(encrypted: unknown): Promise<string> {
	const decrypted = await unwrapValue(encrypted, requireKey());
	if (typeof decrypted !== 'string') {
		throw new Error('Decrypted API key is not a string');
	}
	return decrypted;
}

async function recordToPlain(rec: ByokKeyRecord): Promise<ByokKeyPlain> {
	return {
		id: rec.id,
		provider: rec.provider,
		label: rec.label,
		apiKey: await decryptApiKey(rec.apiKeyEncrypted),
		model: rec.model,
		isDefault: rec.isDefault,
		createdAt: rec.createdAt,
		updatedAt: rec.updatedAt,
		lastUsedAt: rec.lastUsedAt,
		usageCount: rec.usageCount,
		totalTokens: rec.totalTokens,
		totalCostUsd: rec.totalCostUsd,
	};
}

export const byokVault = {
	/** List all active (non-deleted) keys, decrypted. */
	async listAll(): Promise<ByokKeyPlain[]> {
		const all = await db.table<ByokKeyRecord>(TABLE).toArray();
		const active = all.filter((k) => !k.deletedAt);
		return Promise.all(active.map(recordToPlain));
	},

	/** List keys metadata without decrypting (for UI display of label/usage only) */
	async listMeta(): Promise<Omit<ByokKeyPlain, 'apiKey'>[]> {
		const all = await db.table<ByokKeyRecord>(TABLE).toArray();
		const active = all.filter((k) => !k.deletedAt);
		return active.map((r) => ({
			id: r.id,
			provider: r.provider,
			label: r.label,
			model: r.model,
			isDefault: r.isDefault,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			lastUsedAt: r.lastUsedAt,
			usageCount: r.usageCount,
			totalTokens: r.totalTokens,
			totalCostUsd: r.totalCostUsd,
		}));
	},

	/** Get the default key for a provider, or first available if no default. */
	async getForProvider(provider: ByokProviderId): Promise<ByokKeyPlain | null> {
		const all = await db.table<ByokKeyRecord>(TABLE).toArray();
		const forProvider = all.filter((k) => !k.deletedAt && k.provider === provider);
		if (forProvider.length === 0) return null;
		const preferred = forProvider.find((k) => k.isDefault) ?? forProvider[0];
		return recordToPlain(preferred);
	},

	/** Create a new key (encrypted before write). */
	async create(input: {
		provider: ByokProviderId;
		label: string;
		apiKey: string;
		model?: string;
		isDefault?: boolean;
	}): Promise<ByokKeyPlain> {
		const now = new Date().toISOString();
		const existing = await db.table<ByokKeyRecord>(TABLE).toArray();
		const forProvider = existing.filter((k) => !k.deletedAt && k.provider === input.provider);

		// First key for this provider is default automatically
		const isDefault = input.isDefault ?? forProvider.length === 0;

		// If setting as default, clear other defaults for this provider
		if (isDefault && forProvider.length > 0) {
			for (const other of forProvider.filter((k) => k.isDefault)) {
				await db.table(TABLE).update(other.id, { isDefault: false, updatedAt: now });
			}
		}

		const rec: ByokKeyRecord = {
			id: crypto.randomUUID(),
			provider: input.provider,
			label: input.label,
			apiKeyEncrypted: await encryptApiKey(input.apiKey),
			model: input.model,
			isDefault,
			createdAt: now,
			updatedAt: now,
			usageCount: 0,
			totalTokens: 0,
			totalCostUsd: 0,
		};
		await db.table(TABLE).add(rec);
		return recordToPlain(rec);
	},

	/** Update label/model/isDefault (not the key itself — remove+recreate for that). */
	async update(
		id: string,
		patch: { label?: string; model?: string; isDefault?: boolean }
	): Promise<void> {
		const now = new Date().toISOString();
		const existing = await db.table<ByokKeyRecord>(TABLE).get(id);
		if (!existing) return;

		// If promoting to default, demote others of same provider
		if (patch.isDefault === true) {
			const all = await db.table<ByokKeyRecord>(TABLE).toArray();
			const siblings = all.filter(
				(k) => !k.deletedAt && k.provider === existing.provider && k.id !== id
			);
			for (const s of siblings.filter((k) => k.isDefault)) {
				await db.table(TABLE).update(s.id, { isDefault: false, updatedAt: now });
			}
		}

		await db.table(TABLE).update(id, {
			...(patch.label !== undefined && { label: patch.label }),
			...(patch.model !== undefined && { model: patch.model }),
			...(patch.isDefault !== undefined && { isDefault: patch.isDefault }),
			updatedAt: now,
		});
	},

	/** Soft-delete. */
	async delete(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Increment usage counters after a successful call. */
	async recordUsage(id: string, tokens: number, costUsd: number): Promise<void> {
		const existing = await db.table<ByokKeyRecord>(TABLE).get(id);
		if (!existing) return;
		const now = new Date().toISOString();
		await db.table(TABLE).update(id, {
			usageCount: existing.usageCount + 1,
			totalTokens: existing.totalTokens + tokens,
			totalCostUsd: existing.totalCostUsd + costUsd,
			lastUsedAt: now,
			updatedAt: now,
		});
	},
};

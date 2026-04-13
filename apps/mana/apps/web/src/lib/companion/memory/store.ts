/**
 * Memory Store — CRUD + confidence lifecycle for semantic memory facts.
 */

import { db } from '$lib/data/database';
import type { MemoryFact, MemoryCategory } from './types';

const TABLE = '_memory';

const INITIAL_CONFIDENCE = 0.3;
const CONFIRM_BOOST = 0.15;
const CONTRADICT_PENALTY = 0.15;
const DECAY_PER_WEEK = 0.05;
const MIN_CONFIDENCE = 0.1;
const MAX_CONFIDENCE = 0.95;

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

export const memoryStore = {
	/**
	 * Record or confirm a fact. If a fact with the same factKey exists,
	 * its confidence is boosted. Otherwise a new fact is created.
	 */
	async recordFact(input: {
		factKey: string;
		category: MemoryCategory;
		content: string;
		sourceModules: string[];
	}): Promise<MemoryFact> {
		const now = new Date().toISOString();
		const existing = await db
			.table<MemoryFact>(TABLE)
			.where('id')
			.above('')
			.filter((f) => f.factKey === input.factKey && !f.deletedAt)
			.first();

		if (existing) {
			const newConf = clamp(existing.confidence + CONFIRM_BOOST, 0, MAX_CONFIDENCE);
			const modules = [...new Set([...existing.sourceModules, ...input.sourceModules])];
			await db.table(TABLE).update(existing.id, {
				confidence: newConf,
				confirmations: existing.confirmations + 1,
				lastConfirmed: now,
				sourceModules: modules,
				content: input.content, // Update with latest wording
				updatedAt: now,
			});
			return {
				...existing,
				confidence: newConf,
				confirmations: existing.confirmations + 1,
				lastConfirmed: now,
			};
		}

		const fact: MemoryFact = {
			id: crypto.randomUUID(),
			category: input.category,
			content: input.content,
			confidence: INITIAL_CONFIDENCE,
			confirmations: 1,
			contradictions: 0,
			sourceModules: input.sourceModules,
			factKey: input.factKey,
			firstSeen: now,
			lastConfirmed: now,
			createdAt: now,
			updatedAt: now,
		};
		await db.table(TABLE).add(fact);
		return fact;
	},

	/** Record a contradiction — lowers confidence. */
	async contradictFact(factKey: string): Promise<void> {
		const fact = await db
			.table<MemoryFact>(TABLE)
			.where('id')
			.above('')
			.filter((f) => f.factKey === factKey && !f.deletedAt)
			.first();
		if (!fact) return;

		const newConf = clamp(fact.confidence - CONTRADICT_PENALTY, 0, MAX_CONFIDENCE);
		await db.table(TABLE).update(fact.id, {
			confidence: newConf,
			contradictions: fact.contradictions + 1,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Apply time decay to all facts. Call periodically (e.g. daily). */
	async applyDecay(): Promise<number> {
		const now = Date.now();
		const all = await db.table<MemoryFact>(TABLE).toArray();
		let cleaned = 0;

		for (const fact of all) {
			if (fact.deletedAt) continue;
			const lastMs = new Date(fact.lastConfirmed).getTime();
			const weeksSince = (now - lastMs) / (7 * 86400000);
			if (weeksSince < 4) continue; // No decay within first month

			const decay = Math.floor(weeksSince - 4) * DECAY_PER_WEEK;
			const newConf = clamp(fact.confidence - decay, 0, MAX_CONFIDENCE);

			if (newConf < MIN_CONFIDENCE) {
				await db.table(TABLE).update(fact.id, {
					deletedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
				cleaned++;
			} else if (newConf !== fact.confidence) {
				await db.table(TABLE).update(fact.id, {
					confidence: newConf,
					updatedAt: new Date().toISOString(),
				});
			}
		}

		return cleaned;
	},

	/** Get all active facts above a confidence threshold. */
	async getFacts(minConfidence = 0.3): Promise<MemoryFact[]> {
		const all = await db.table<MemoryFact>(TABLE).toArray();
		return all
			.filter((f) => !f.deletedAt && f.confidence >= minConfidence)
			.sort((a, b) => b.confidence - a.confidence);
	},

	/** Get facts for a specific category. */
	async getFactsByCategory(category: MemoryCategory, minConfidence = 0.3): Promise<MemoryFact[]> {
		const all = await this.getFacts(minConfidence);
		return all.filter((f) => f.category === category);
	},

	/** Delete a specific fact. */
	async deleteFact(id: string): Promise<void> {
		await db.table(TABLE).update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};

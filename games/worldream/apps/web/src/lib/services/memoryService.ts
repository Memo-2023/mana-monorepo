import type {
	CharacterMemory,
	ShortTermMemory,
	MediumTermMemory,
	LongTermMemory,
	MemoryEvent,
} from '$lib/types/content';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export class MemoryService {
	/**
	 * Get node memory
	 */
	static async getMemory(nodeId: string): Promise<CharacterMemory | null> {
		const { data, error } = await supabase
			.from('content_nodes')
			.select('memory')
			.eq('id', nodeId)
			.maybeSingle(); // Use maybeSingle to handle 0 or 1 rows

		if (error) {
			console.error('Error fetching memory:', error);
			return this.getDefaultMemory();
		}

		// If no data or no memory field, return default memory
		if (!data || !data.memory) {
			return this.getDefaultMemory();
		}

		return data.memory;
	}

	/**
	 * Update node memory
	 */
	static async updateMemory(nodeId: string, memory: CharacterMemory): Promise<boolean> {
		const { error } = await supabase
			.from('content_nodes')
			.update({
				memory,
				updated_at: new Date().toISOString(),
			})
			.eq('id', nodeId);

		if (error) {
			console.error('Error updating memory:', error);
			return false;
		}

		return true;
	}

	/**
	 * Add a new memory to a node
	 */
	static async addMemory(
		nodeId: string,
		content: string,
		tier: 'short' | 'medium' | 'long' = 'short',
		options: {
			importance?: number;
			tags?: string[];
			involved?: string[];
			location?: string;
			emotional_weight?: number;
		} = {}
	): Promise<boolean> {
		let memory = await this.getMemory(nodeId);
		// Always ensure we have a memory object
		if (!memory) {
			memory = this.getDefaultMemory();
		}

		const newMemoryId = crypto.randomUUID();
		const timestamp = new Date().toISOString();

		if (tier === 'short') {
			const shortMemory: ShortTermMemory = {
				id: newMemoryId,
				timestamp,
				content,
				importance: options.importance || 5,
				tags: options.tags || [],
				involved: options.involved || [],
				location: options.location,
				decay_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
			};
			memory.short_term_memory.unshift(shortMemory);

			// Keep only last 50 short-term memories
			if (memory.short_term_memory.length > 50) {
				memory.short_term_memory = memory.short_term_memory.slice(0, 50);
			}
		} else if (tier === 'medium') {
			const mediumMemory: MediumTermMemory = {
				id: newMemoryId,
				timestamp,
				content,
				context: 'Manually added',
				importance: options.importance || 5,
				tags: options.tags || [],
				involved: options.involved || [],
				location: options.location,
				decay_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
			};
			memory.medium_term_memory.unshift(mediumMemory);

			// Keep only last 100 medium-term memories
			if (memory.medium_term_memory.length > 100) {
				memory.medium_term_memory = memory.medium_term_memory.slice(0, 100);
			}
		} else if (tier === 'long') {
			const longMemory: LongTermMemory = {
				id: newMemoryId,
				timestamp,
				content,
				emotional_weight: options.emotional_weight || options.importance || 7,
				category: 'manual',
				triggers: options.tags,
				involved: options.involved || [],
				immutable: true,
			};
			memory.long_term_memory.unshift(longMemory);

			// Keep only last 200 long-term memories
			if (memory.long_term_memory.length > 200) {
				memory.long_term_memory = memory.long_term_memory.slice(0, 200);
			}
		}

		return await this.updateMemory(nodeId, memory);
	}

	/**
	 * Process and age memories
	 */
	static async processMemories(
		nodeId: string,
		currentDate?: Date
	): Promise<CharacterMemory | null> {
		const memory = await this.getMemory(nodeId);
		if (!memory) return null;

		const now = currentDate || new Date();
		const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
		const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

		// Process short-term memories
		const agedShortTerm = memory.short_term_memory.filter(
			(m) => new Date(m.timestamp) < threeDaysAgo
		);

		// Move important short-term to medium-term
		for (const mem of agedShortTerm) {
			if (mem.importance >= 3) {
				const mediumMemory: MediumTermMemory = {
					id: mem.id,
					timestamp: mem.timestamp,
					content: this.compressMemory(mem.content),
					original_details: mem.content,
					context: 'Aged from short-term memory',
					location: mem.location,
					involved: mem.involved,
					tags: mem.tags,
					importance: mem.importance,
					decay_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
					linked_memories: [],
				};
				memory.medium_term_memory.push(mediumMemory);
			}
		}

		// Remove aged memories from short-term
		memory.short_term_memory = memory.short_term_memory.filter(
			(m) => new Date(m.timestamp) >= threeDaysAgo
		);

		// Process medium-term memories
		const agedMediumTerm = memory.medium_term_memory.filter(
			(m) => new Date(m.timestamp) < threeMonthsAgo
		);

		// Move very important medium-term to long-term
		for (const mem of agedMediumTerm) {
			if (mem.importance >= 7 || mem.tags?.includes('#trauma') || mem.tags?.includes('#triumph')) {
				const longMemory: LongTermMemory = {
					id: mem.id,
					timestamp: mem.timestamp,
					content: this.extractCore(mem.content),
					emotional_weight: mem.importance,
					category: this.categorizeMemory(mem),
					triggers: mem.tags,
					effects: `Based on: ${mem.context}`,
					involved: mem.involved,
					immutable: true,
				};
				memory.long_term_memory.push(longMemory);
			}
		}

		// Remove aged memories from medium-term
		memory.medium_term_memory = memory.medium_term_memory.filter(
			(m) => new Date(m.timestamp) >= threeMonthsAgo
		);

		// Update last processed time
		memory.last_processed = now.toISOString();

		// Save processed memory
		await this.updateMemory(nodeId, memory);
		return memory;
	}

	/**
	 * Delete a specific memory
	 */
	static async deleteMemory(nodeId: string, memoryId: string): Promise<boolean> {
		const memory = await this.getMemory(nodeId);
		if (!memory) return false;

		// Check and remove from each tier
		memory.short_term_memory = memory.short_term_memory.filter((m) => m.id !== memoryId);
		memory.medium_term_memory = memory.medium_term_memory.filter((m) => m.id !== memoryId);
		memory.long_term_memory = memory.long_term_memory.filter((m) => m.id !== memoryId);

		return await this.updateMemory(nodeId, memory);
	}

	/**
	 * Search memories for specific content
	 */
	static async searchMemories(
		nodeId: string,
		query: string
	): Promise<Array<ShortTermMemory | MediumTermMemory | LongTermMemory>> {
		const memory = await this.getMemory(nodeId);
		if (!memory) return [];

		const results: Array<ShortTermMemory | MediumTermMemory | LongTermMemory> = [];
		const searchLower = query.toLowerCase();

		// Search in all tiers
		for (const mem of memory.short_term_memory) {
			if (
				mem.content.toLowerCase().includes(searchLower) ||
				mem.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
				mem.involved?.some((inv) => inv.toLowerCase().includes(searchLower))
			) {
				results.push(mem);
			}
		}

		for (const mem of memory.medium_term_memory) {
			if (
				mem.content.toLowerCase().includes(searchLower) ||
				mem.original_details?.toLowerCase().includes(searchLower) ||
				mem.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
				mem.involved?.some((inv) => inv.toLowerCase().includes(searchLower))
			) {
				results.push(mem);
			}
		}

		for (const mem of memory.long_term_memory) {
			if (
				mem.content.toLowerCase().includes(searchLower) ||
				mem.triggers?.some((trigger) => trigger.toLowerCase().includes(searchLower)) ||
				mem.involved?.some((inv) => inv.toLowerCase().includes(searchLower))
			) {
				results.push(mem);
			}
		}

		return results;
	}

	/**
	 * Get memory events for a node
	 */
	static async getMemoryEvents(nodeId: string): Promise<MemoryEvent[]> {
		const { data, error } = await supabase
			.from('memory_events')
			.select('*')
			.eq('node_id', nodeId)
			.order('event_timestamp', { ascending: false })
			.limit(50);

		if (error) {
			console.error('Error fetching memory events:', error);
			return [];
		}

		return data || [];
	}

	/**
	 * Create a memory event
	 */
	static async createMemoryEvent(event: Omit<MemoryEvent, 'id' | 'created_at'>): Promise<boolean> {
		const { error } = await supabase.from('memory_events').insert(event);

		if (error) {
			console.error('Error creating memory event:', error);
			return false;
		}

		return true;
	}

	// Helper methods
	private static getDefaultMemory(): CharacterMemory {
		return {
			short_term_memory: [],
			medium_term_memory: [],
			long_term_memory: [],
			memory_traits: {
				memory_quality: 'average',
			},
		};
	}

	private static compressMemory(content: string): string {
		// Simple compression - take first 200 chars
		// In production, this could use AI to summarize
		return content.length > 200 ? content.substring(0, 197) + '...' : content;
	}

	private static extractCore(content: string): string {
		// Extract the most important part
		// In production, this could use AI to extract key points
		return content.length > 150 ? content.substring(0, 147) + '...' : content;
	}

	private static categorizeMemory(
		memory: MediumTermMemory
	): 'trauma' | 'triumph' | 'relationship' | 'skill' | 'secret' | 'manual' {
		// Simple categorization based on tags
		if (memory.tags?.includes('#trauma')) return 'trauma';
		if (memory.tags?.includes('#triumph') || memory.tags?.includes('#success')) return 'triumph';
		if (memory.tags?.includes('#relationship') || memory.involved?.length) return 'relationship';
		if (memory.tags?.includes('#skill') || memory.tags?.includes('#learned')) return 'skill';
		if (memory.tags?.includes('#secret')) return 'secret';
		return 'manual';
	}
}

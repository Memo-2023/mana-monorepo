import { pb } from '$lib/pocketbase';
import type {
	Card,
	CardConfig,
	CardMetadata,
	RenderMode,
	DBCard,
} from '$lib/components/cards/types';
import { cardConverter } from './cardConverter';
import { cardValidator } from './cardValidator';

export class CardService {
	/**
	 * Convert card between different modes
	 */
	async convertCard(card: Card, targetMode: RenderMode): Promise<Card> {
		let newConfig: CardConfig;

		switch (targetMode) {
			case 'beginner':
				newConfig = await cardConverter.toModular(card.config);
				break;
			case 'advanced':
				newConfig = await cardConverter.toTemplate(card.config);
				break;
			case 'expert':
				newConfig = await cardConverter.toCustom(card.config);
				break;
			default:
				throw new Error(`Unknown target mode: ${targetMode}`);
		}

		return {
			...card,
			config: newConfig,
		};
	}

	/**
	 * Save card to database
	 */
	async saveCard(card: Card): Promise<string> {
		const userId = pb.authStore.model?.id;
		if (!userId) throw new Error('User not authenticated');

		// Validate card
		const validation = cardValidator.validate(card);
		if (!validation.valid) {
			throw new Error(`Invalid card: ${validation.errors?.map((e) => e.message).join(', ')}`);
		}

		const dbCard: Partial<DBCard> = {
			user_id: userId,
			config: JSON.stringify(card.config),
			metadata: JSON.stringify(card.metadata),
			constraints: JSON.stringify(card.constraints),
			variant: card.variant,
		};

		let result;
		if (card.id && card.id !== 'new') {
			// Update existing
			result = await pb.collection('cards').update(card.id, dbCard);
		} else {
			// Create new
			result = await pb.collection('cards').create(dbCard);
		}

		return result.id;
	}

	/**
	 * Load card from database
	 */
	async loadCard(id: string): Promise<Card | null> {
		try {
			const dbCard = await pb.collection('cards').getOne<DBCard>(id);
			return this.dbCardToCard(dbCard);
		} catch (error) {
			console.error('Error loading card:', error);
			return null;
		}
	}

	/**
	 * Load user's cards
	 */
	async loadUserCards(filters?: { page?: string; limit?: number }): Promise<Card[]> {
		const userId = pb.authStore.model?.id;
		if (!userId) return [];

		let filter = `user_id = "${userId}"`;
		if (filters?.page) {
			filter += ` && metadata.page = "${filters.page}"`;
		}

		const records = await pb.collection('cards').getList<DBCard>(1, filters?.limit || 100, {
			filter,
			sort: 'metadata.position,created',
		});

		return records.items.map((item) => this.dbCardToCard(item));
	}

	/**
	 * Delete card
	 */
	async deleteCard(id: string): Promise<boolean> {
		try {
			await pb.collection('cards').delete(id);
			return true;
		} catch (error) {
			console.error('Error deleting card:', error);
			return false;
		}
	}

	/**
	 * Duplicate card
	 */
	async duplicateCard(card: Card): Promise<Card> {
		const newCard: Card = {
			...card,
			id: 'new',
			metadata: {
				...card.metadata,
				name: `${card.metadata?.name || 'Card'} (Copy)`,
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
			},
		};

		const newId = await this.saveCard(newCard);
		newCard.id = newId;
		return newCard;
	}

	/**
	 * Convert database card to Card type
	 */
	private dbCardToCard(dbCard: DBCard): Card {
		return {
			id: dbCard.id,
			config: JSON.parse(dbCard.config),
			metadata: JSON.parse(dbCard.metadata),
			constraints: JSON.parse(dbCard.constraints || '{}'),
			variant: dbCard.variant as any,
		};
	}
}

// Export singleton instance
export const cardService = new CardService();

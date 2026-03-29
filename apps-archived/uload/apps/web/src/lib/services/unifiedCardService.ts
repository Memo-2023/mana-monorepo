import { pb } from '$lib/pocketbase';
import type { Card, CardConfig, CardMetadata, CardConstraints } from '$lib/components/cards/types';
import { cardValidator } from './cardValidator';
import { cardSanitizer } from './cardSanitizer';

// Use Card interface from types.ts instead of UnifiedCard
type UnifiedCard = Card;

class UnifiedCardService {
	private readonly COLLECTION = 'cards';

	// Get user's cards
	async getUserCards(page?: string): Promise<UnifiedCard[]> {
		console.log('🔵 getUserCards called with page:', page);
		try {
			const userId = pb.authStore.model?.id;
			console.log('👤 Current user ID:', userId);
			if (!userId) {
				console.warn('⚠️ No user ID found in authStore');
				return [];
			}

			// Try with double quotes instead of single quotes
			let filterString = `user_id="${userId}" && type="user"`;

			if (page) {
				filterString += ` && page="${page}"`;
			}

			console.log('🔍 Query filter:', filterString);

			const records = await pb.collection(this.COLLECTION).getList(1, 100, {
				filter: filterString,
				sort: 'position,created',
			});

			console.log('📊 Found records:', records.totalItems);
			console.log('📦 Records:', records.items);

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('❌ Failed to fetch user cards:', error);
			return [];
		}
	}

	// Get single card
	async getCard(id: string): Promise<UnifiedCard | null> {
		try {
			const record = await pb.collection(this.COLLECTION).getOne(id);
			return record as unknown as Card;
		} catch (error) {
			console.error('Failed to fetch card:', error);
			return null;
		}
	}

	// Create card
	async createCard(card: Partial<UnifiedCard>): Promise<UnifiedCard | null> {
		try {
			// Validate config if provided
			if (card.config) {
				const validation = cardValidator.validate({
					id: 'temp', // Temporary ID for validation
					config: card.config,
					metadata: card.metadata || {},
					constraints: card.constraints || {},
				});
				if (!validation.valid) {
					console.error('Card config validation failed:', validation.errors);
					return null;
				}
				// Sanitize based on mode
				if ('mode' in card.config) {
					if (card.config.mode === 'advanced' && card.config.template) {
						card.config.template = cardSanitizer.sanitizeHTML(card.config.template);
						if (card.config.css) {
							card.config.css = cardSanitizer.sanitizeCSS(card.config.css);
						}
					} else if (card.config.mode === 'expert') {
						card.config.html = cardSanitizer.sanitizeHTML(card.config.html);
						card.config.css = cardSanitizer.sanitizeCSS(card.config.css);
					}
				}
			}

			// Set defaults and ensure all required fields are present
			const data = {
				user_id: pb.authStore.model?.id,
				type: card.type || 'user',
				visibility: card.visibility || 'private',
				source: card.source || 'created',
				config: card.config || { mode: 'beginner', modules: [] },
				page: card.page || 'profile',
				position: card.position || 0,
				usage_count: 0,
				likes_count: 0,
				...card,
			};

			console.log('Creating card with data:', data);
			const record = await pb.collection(this.COLLECTION).create(data);
			console.log('Card created successfully:', record);
			return record as unknown as Card;
		} catch (error) {
			console.error('❌ Failed to create card:', {
				error,
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				errorResponse: (error as any)?.response,
				errorData: (error as any)?.data,
				errorStatus: (error as any)?.status,
			});

			// Check for specific error types
			if ((error as any)?.status === 403) {
				console.error('🚫 Authentication/Authorization error - check user permissions');
			}
			if ((error as any)?.status === 400) {
				console.error('📝 Validation error from server - check data format');
			}
			if ((error as any)?.status === 404) {
				console.error('🔍 Collection not found - check PocketBase setup');
			}

			return null;
		}
	}

	// Update card
	async updateCard(id: string, updates: Partial<UnifiedCard>): Promise<UnifiedCard | null> {
		console.log('🔵 UnifiedCardService.updateCard() called:', { id, updates });

		try {
			// Validate config if provided
			if (updates.config) {
				console.log('🔍 Validating updated config...');
				const validation = cardValidator.validate({
					id: 'temp',
					config: updates.config,
					metadata: {},
					constraints: {},
				});
				if (!validation.valid) {
					console.error('❌ Update validation failed:', validation.errors);
					return null;
				}
				// Sanitize based on mode
				if ('mode' in updates.config) {
					if (updates.config.mode === 'advanced' && updates.config.template) {
						updates.config.template = cardSanitizer.sanitizeHTML(updates.config.template);
						if (updates.config.css) {
							updates.config.css = cardSanitizer.sanitizeCSS(updates.config.css);
						}
					} else if (updates.config.mode === 'expert') {
						updates.config.html = cardSanitizer.sanitizeHTML(updates.config.html);
						updates.config.css = cardSanitizer.sanitizeCSS(updates.config.css);
					}
				}
			}

			console.log('🎯 Updating card in PocketBase...');
			const record = await pb.collection(this.COLLECTION).update(id, updates);
			console.log('✅ Card updated successfully:', record);
			return record as unknown as Card;
		} catch (error) {
			console.error('❌ Failed to update card:', {
				error,
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}

	// Delete card
	async deleteCard(id: string): Promise<boolean> {
		try {
			await pb.collection(this.COLLECTION).delete(id);
			return true;
		} catch (error) {
			console.error('Failed to delete card:', error);
			return false;
		}
	}

	// Get public templates
	async getTemplates(category?: string): Promise<UnifiedCard[]> {
		try {
			const filters = [`type = 'template'`, `visibility = 'public'`];
			if (category) filters.push(`category = '${category}'`);

			const records = await pb.collection(this.COLLECTION).getList(1, 100, {
				filter: filters.join(' && '),
				sort: '-likes_count,-usage_count,created',
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to fetch templates:', error);
			return [];
		}
	}

	// Get featured templates
	async getFeaturedTemplates(): Promise<UnifiedCard[]> {
		try {
			const records = await pb.collection(this.COLLECTION).getList(1, 20, {
				filter: `type = 'template' && visibility = 'public' && is_featured = true`,
				sort: '-likes_count,-usage_count,created',
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to fetch featured templates:', error);
			return [];
		}
	}

	// Create card from template
	async createFromTemplate(templateId: string, page?: string): Promise<UnifiedCard | null> {
		try {
			const template = await this.getCard(templateId);
			if (!template) return null;

			const newCard: Partial<UnifiedCard> = {
				user_id: pb.authStore.model?.id,
				type: 'user',
				template_id: templateId,
				source: 'duplicated',
				config: template.config,
				metadata: {
					...template.metadata,
					name: `${template.metadata?.name || 'Card'} (Copy)`,
				},
				constraints: template.constraints,
				page: page || 'home',
				visibility: 'private',
				variant: template.variant,
			};

			// Increment usage count
			await this.updateCard(templateId, {
				usage_count: (template.usage_count || 0) + 1,
			});

			return this.createCard(newCard);
		} catch (error) {
			console.error('Failed to create from template:', error);
			return null;
		}
	}

	// Duplicate a card
	async duplicateCard(id: string): Promise<UnifiedCard | null> {
		try {
			const original = await this.getCard(id);
			if (!original) return null;

			const duplicate: Partial<UnifiedCard> = {
				...original,
				id: undefined,
				template_id: original.type === 'template' ? original.id : original.template_id,
				source: 'duplicated',
				metadata: {
					...original.metadata,
					name: `${original.metadata?.name || 'Card'} (Copy)`,
				},
				created: undefined,
				updated: undefined,
			};

			return this.createCard(duplicate);
		} catch (error) {
			console.error('Failed to duplicate card:', error);
			return null;
		}
	}

	// Move card to different page
	async moveCard(id: string, page: string, position?: number): Promise<UnifiedCard | null> {
		try {
			const card = await this.getCard(id);
			if (!card) return null;

			return this.updateCard(id, {
				page,
				position,
			});
		} catch (error) {
			console.error('Failed to move card:', error);
			return null;
		}
	}

	// Search cards
	async searchCards(query: string): Promise<UnifiedCard[]> {
		try {
			const userId = pb.authStore.model?.id;
			if (!userId) return [];

			const records = await pb.collection(this.COLLECTION).getList(1, 50, {
				filter: `(user_id = '${userId}' || visibility = 'public') && (metadata.name ~ '${query}' || metadata.description ~ '${query}' || tags ~ '${query}')`,
				sort: '-updated',
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to search cards:', error);
			return [];
		}
	}

	// Like/unlike a card
	async toggleLike(id: string): Promise<boolean> {
		try {
			const card = await this.getCard(id);
			if (!card) return false;

			// In a real app, you'd track likes per user
			// For now, just increment/decrement the count
			await this.updateCard(id, {
				likes_count: (card.likes_count || 0) + 1,
			});

			return true;
		} catch (error) {
			console.error('Failed to toggle like:', error);
			return false;
		}
	}

	// Batch operations
	async batchUpdatePositions(updates: Array<{ id: string; position: number }>): Promise<boolean> {
		try {
			const promises = updates.map(({ id, position }) =>
				pb.collection(this.COLLECTION).update(id, { position })
			);
			await Promise.all(promises);
			return true;
		} catch (error) {
			console.error('Failed to batch update positions:', error);
			return false;
		}
	}

	// Get system templates
	async getSystemTemplates(): Promise<UnifiedCard[]> {
		try {
			const records = await pb.collection(this.COLLECTION).getList(1, 100, {
				filter: `type = 'system'`,
				sort: 'position,created',
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to fetch system templates:', error);
			return [];
		}
	}

	// Import card
	async importCard(
		cardData: any,
		source: 'imported' | 'migrated' = 'imported'
	): Promise<UnifiedCard | null> {
		try {
			const newCard: Partial<UnifiedCard> = {
				user_id: pb.authStore.model?.id,
				type: 'user',
				source,
				config: cardData.config,
				metadata: cardData.metadata,
				constraints: cardData.constraints,
				visibility: 'private',
				page: cardData.page || 'home',
			};

			return this.createCard(newCard);
		} catch (error) {
			console.error('Failed to import card:', error);
			return null;
		}
	}

	// Create template from user card
	async createTemplate(
		cardId: string,
		templateData: {
			name: string;
			description?: string;
			category?: string;
			tags?: string[];
			visibility?: 'public' | 'unlisted';
			allow_duplication?: boolean;
		}
	): Promise<UnifiedCard | null> {
		try {
			const card = await this.getCard(cardId);
			if (!card) return null;

			// Check if user owns the card
			const userId = pb.authStore.model?.id;
			if (!userId || card.user_id !== userId) {
				console.error('User does not own this card');
				return null;
			}

			const template: Partial<UnifiedCard> = {
				user_id: userId,
				type: 'template',
				template_id: cardId, // Reference to original card
				source: 'created',
				config: card.config,
				metadata: {
					...card.metadata,
					name: templateData.name,
					description: templateData.description,
				},
				constraints: card.constraints,
				visibility: templateData.visibility || 'public',
				variant: card.variant,
				tags: templateData.tags || [],
				category: templateData.category,
				usage_count: 0,
				likes_count: 0,
				is_featured: false,
				allow_duplication: templateData.allow_duplication !== false,
			};

			return this.createCard(template);
		} catch (error) {
			console.error('Failed to create template:', error);
			return null;
		}
	}

	// Update template metadata
	async updateTemplate(
		templateId: string,
		updates: {
			name?: string;
			description?: string;
			category?: string;
			tags?: string[];
			visibility?: 'public' | 'unlisted' | 'private';
			is_featured?: boolean;
			allow_duplication?: boolean;
		}
	): Promise<UnifiedCard | null> {
		try {
			const template = await this.getCard(templateId);
			if (!template || template.type !== 'template') return null;

			// Check if user owns the template
			const userId = pb.authStore.model?.id;
			if (!userId || template.user_id !== userId) {
				console.error('User does not own this template');
				return null;
			}

			const templateUpdates: Partial<UnifiedCard> = {
				metadata: {
					...template.metadata,
					...(updates.name && { name: updates.name }),
					...(updates.description && { description: updates.description }),
				},
				...(updates.category && { category: updates.category }),
				...(updates.tags && { tags: updates.tags }),
				...(updates.visibility && { visibility: updates.visibility }),
				...(updates.is_featured !== undefined && { is_featured: updates.is_featured }),
				...(updates.allow_duplication !== undefined && {
					allow_duplication: updates.allow_duplication,
				}),
			};

			return this.updateCard(templateId, templateUpdates);
		} catch (error) {
			console.error('Failed to update template:', error);
			return null;
		}
	}

	// Delete template
	async deleteTemplate(templateId: string): Promise<boolean> {
		try {
			const template = await this.getCard(templateId);
			if (!template || template.type !== 'template') return false;

			// Check if user owns the template
			const userId = pb.authStore.model?.id;
			if (!userId || template.user_id !== userId) {
				console.error('User does not own this template');
				return false;
			}

			return this.deleteCard(templateId);
		} catch (error) {
			console.error('Failed to delete template:', error);
			return false;
		}
	}

	// Get user's templates
	async getUserTemplates(): Promise<UnifiedCard[]> {
		try {
			const userId = pb.authStore.model?.id;
			if (!userId) return [];

			const records = await pb.collection(this.COLLECTION).getList(1, 100, {
				filter: `user_id = '${userId}' && type = 'template'`,
				sort: '-created',
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to fetch user templates:', error);
			return [];
		}
	}

	// Search templates with advanced filters
	async searchTemplates(
		options: {
			query?: string;
			category?: string;
			tags?: string[];
			featured?: boolean;
			sortBy?: 'popular' | 'recent' | 'rating';
			limit?: number;
		} = {}
	): Promise<UnifiedCard[]> {
		try {
			const filters = [`type = 'template'`, `visibility = 'public'`];

			if (options.query) {
				filters.push(
					`(metadata.name~"${options.query}" || metadata.description~"${options.query}")`
				);
			}

			if (options.category) {
				filters.push(`category="${options.category}"`);
			}

			if (options.featured) {
				filters.push(`is_featured=true`);
			}

			if (options.tags && options.tags.length > 0) {
				const tagFilters = options.tags.map((tag) => `tags~"${tag}"`);
				filters.push(`(${tagFilters.join(' || ')})`);
			}

			let sort = '-created';
			switch (options.sortBy) {
				case 'popular':
					sort = '-usage_count,-likes_count,-created';
					break;
				case 'recent':
					sort = '-created';
					break;
				case 'rating':
					sort = '-likes_count,-usage_count,-created';
					break;
			}

			const records = await pb.collection(this.COLLECTION).getList(1, options.limit || 50, {
				filter: filters.join(' && '),
				sort,
			});

			return records.items as unknown as Card[];
		} catch (error) {
			console.error('Failed to search templates:', error);
			return [];
		}
	}

	// Feature/unfeature template (admin only)
	async toggleFeatureTemplate(templateId: string): Promise<boolean> {
		try {
			const template = await this.getCard(templateId);
			if (!template || template.type !== 'template') return false;

			// Check if user is admin
			if (!pb.authStore.model?.admin) {
				console.error('Only admins can feature templates');
				return false;
			}

			await this.updateCard(templateId, {
				is_featured: !template.is_featured,
			});

			return true;
		} catch (error) {
			console.error('Failed to toggle feature template:', error);
			return false;
		}
	}

	// Export card
	async exportCard(id: string): Promise<any> {
		try {
			const card = await this.getCard(id);
			if (!card) return null;

			// Remove sensitive/system fields
			const { id: _, user_id, created, updated, ...exportData } = card;
			return exportData;
		} catch (error) {
			console.error('Failed to export card:', error);
			return null;
		}
	}
}

export const unifiedCardService = new UnifiedCardService();

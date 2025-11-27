/**
 * Data Service for Märchenzauber Web App
 *
 * Centralized API methods for stories, characters, and settings.
 */

import { fetchWithAuth } from './client';
import type { Story, StoryPage, PublicStoriesResponse, CreateStoryRequest } from '$lib/types/story';
import type {
	Character,
	PublicCharactersResponse,
	CharacterCollection,
} from '$lib/types/character';
import type { Creator, UserSettings, CreditBalance } from '$lib/types/api';

/**
 * Transform backend story data to frontend format
 */
function transformStory(raw: Record<string, unknown>): Story {
	// Extract character image from characters_data
	let characterImageUrl: string | undefined;
	const charactersData = raw.characters_data as Array<Record<string, unknown>> | undefined;
	if (charactersData && Array.isArray(charactersData) && charactersData.length > 0) {
		characterImageUrl =
			(charactersData[0].image_url as string) || (charactersData[0].imageUrl as string);
	}

	// Transform pages_data to pages
	const pagesData = raw.pages_data as Array<Record<string, unknown>> | undefined;
	const pages: StoryPage[] = pagesData
		? pagesData.map((page) => ({
				image: page.image_url as string,
				pageNumber: page.page_number as number,
				story: page.story_text as string,
				blur_hash: page.blur_hash as string | undefined,
			}))
		: [];

	return {
		id: raw.id as string,
		characterId: raw.character_id as string,
		characterName: raw.character_name as string,
		characterImageUrl,
		createdAt: raw.created_at as string,
		prompt: raw.prompt as string,
		pages,
		text: raw.text as string,
		user_id: raw.user_id as string,
		title: raw.title as string,
		archived: raw.archived as boolean,
		is_favorite: raw.is_favorite as boolean,
		visibility: raw.visibility as Story['visibility'],
		is_published: raw.is_published as boolean,
		published_at: raw.published_at as string,
		is_central: raw.is_central as boolean,
		vote_count: raw.vote_count as number,
		user_vote: raw.user_vote as Story['user_vote'],
		metadata: raw.metadata as Story['metadata'],
	};
}

/**
 * Transform backend character data to frontend format
 */
function transformCharacter(raw: Record<string, unknown>): Character {
	return {
		id: raw.id as string,
		uid: raw.uid as string,
		name: raw.name as string,
		originalDescription: raw.original_description as string,
		characterDescriptionPrompt: raw.character_description_prompt as string,
		images: (raw.images as Character['images']) || [],
		imageUrl: (raw.image_url as string) || (raw.imageUrl as string),
		image_url: raw.image_url as string,
		createdAt: raw.created_at as string,
		user_id: raw.user_id as string,
		archived: raw.archived as boolean,
		animalType: raw.animal_type as string,
		isAnimal: raw.is_animal as boolean,
		blur_hash: raw.blur_hash as string,
		share_code: raw.share_code as string,
		isFeatured: raw.is_featured as boolean,
		vote_count: raw.vote_count as number,
		user_vote: raw.user_vote as Character['user_vote'],
	};
}

export const dataService = {
	// ============ STORIES ============

	async getStories(includeArchived = false): Promise<Story[]> {
		const url = includeArchived ? '/story?includeArchived=true' : '/story';
		const response = await fetchWithAuth(url, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		const stories = result.data || [];
		return stories.map(transformStory);
	},

	async getStoryById(id: string): Promise<Story> {
		const response = await fetchWithAuth(`/story/${id}`, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		const story = result.data || result;
		return transformStory(story);
	},

	async createStory(request: CreateStoryRequest): Promise<{ storyId: string }> {
		const response = await fetchWithAuth('/story/animal', {
			method: 'POST',
			body: JSON.stringify(request),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return { storyId: result.storyId || result.id };
	},

	async updateStory(id: string, data: Partial<Story>): Promise<void> {
		const response = await fetchWithAuth(`/story/${id}`, {
			method: 'PUT',
			body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async deleteStory(id: string): Promise<void> {
		const response = await fetchWithAuth(`/story/${id}`, { method: 'DELETE' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async toggleFavorite(storyId: string, isFavorite: boolean): Promise<void> {
		const response = await fetchWithAuth(`/story/${storyId}/favorite`, {
			method: 'POST',
			body: JSON.stringify({ isFavorite }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async publishStory(
		storyId: string,
		sharingPreference: 'private' | 'link_only' | 'public'
	): Promise<void> {
		const response = await fetchWithAuth('/story/publish', {
			method: 'POST',
			body: JSON.stringify({ storyId, sharingPreference }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async unpublishStory(storyId: string): Promise<void> {
		const response = await fetchWithAuth(`/story/unpublish/${storyId}`, {
			method: 'POST',
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	// ============ PUBLIC STORIES ============

	async getPublicStories(
		filter: 'popular' | 'new' | 'featured' = 'popular',
		page = 1,
		limit = 20
	): Promise<PublicStoriesResponse> {
		const params = new URLSearchParams({
			filter,
			page: page.toString(),
			limit: limit.toString(),
		});

		const response = await fetchWithAuth(`/story/public?${params}`, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return {
			stories: (result.data || []).map(transformStory),
			hasMore: result.hasMore || false,
			total: result.total || 0,
		};
	},

	async getCentralStories(): Promise<Story[]> {
		const response = await fetchWithAuth('/story/central', { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return (result.data || []).map(transformStory);
	},

	async voteForStory(storyId: string, voteType: 'like' | 'love' | 'star' = 'like'): Promise<void> {
		const response = await fetchWithAuth(`/story/${storyId}/vote`, {
			method: 'POST',
			body: JSON.stringify({ voteType }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async unvoteStory(storyId: string): Promise<void> {
		const response = await fetchWithAuth(`/story/${storyId}/vote`, { method: 'DELETE' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	// ============ CHARACTERS ============

	async getCharacters(includeArchived = false): Promise<Character[]> {
		const url = includeArchived ? '/character?includeArchived=true' : '/character';
		const response = await fetchWithAuth(url, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		// Backend returns array directly (includes system characters)
		const characters = Array.isArray(result) ? result : result.data || [];
		return characters.map(transformCharacter);
	},

	async getCharacterById(id: string): Promise<Character> {
		const response = await fetchWithAuth(`/character/${id}`, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		const data = result.data || result;
		return transformCharacter(data);
	},

	async updateCharacter(id: string, data: Partial<Character>): Promise<void> {
		const response = await fetchWithAuth(`/character/${id}`, {
			method: 'PUT',
			body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async deleteCharacter(id: string): Promise<void> {
		const response = await fetchWithAuth(`/character/${id}`, { method: 'DELETE' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async generateCharacterImages(
		name: string,
		description: string,
		options?: { isAnimal?: boolean; animalType?: string; photo?: File }
	): Promise<{ characterId: string; images: string[] }> {
		let response: Response;

		if (options?.photo) {
			// FormData for photo upload
			const formData = new FormData();
			formData.append('name', name);
			formData.append('description', description);
			formData.append('photo', options.photo);
			if (options.isAnimal) formData.append('isAnimal', 'true');
			if (options.animalType) formData.append('animalType', options.animalType);

			response = await fetchWithAuth('/character/generate-images', {
				method: 'POST',
				body: formData,
			});
		} else {
			// JSON for description-only
			response = await fetchWithAuth('/character/generate-images', {
				method: 'POST',
				body: JSON.stringify({
					name,
					description,
					isAnimal: options?.isAnimal,
					animalType: options?.animalType,
				}),
			});
		}

		const result = await response.json();
		if (result.error) throw new Error(result.error);

		return {
			characterId: result.characterId || result.id,
			images: result.images || [],
		};
	},

	// ============ PUBLIC CHARACTERS ============

	async getPublicCharacters(
		filter: 'popular' | 'new' | 'featured' = 'popular',
		limit = 20,
		offset = 0,
		collectionId?: string
	): Promise<PublicCharactersResponse> {
		const params = new URLSearchParams({
			filter,
			limit: limit.toString(),
			offset: offset.toString(),
		});
		if (collectionId) params.append('collection', collectionId);

		const response = await fetchWithAuth(`/characters/public?${params}`, { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return {
			characters: (result.characters || []).map(transformCharacter),
			hasMore: result.hasMore || false,
			total: result.total || 0,
		};
	},

	async getCharacterCollections(): Promise<CharacterCollection[]> {
		const response = await fetchWithAuth('/characters/public/collections', { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return Array.isArray(result) ? result : [];
	},

	async voteForCharacter(characterId: string, voteType: 'like' | 'love' | 'star'): Promise<void> {
		const response = await fetchWithAuth('/characters/public/vote', {
			method: 'POST',
			body: JSON.stringify({ characterId, voteType }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async removeCharacterVote(characterId: string): Promise<void> {
		const response = await fetchWithAuth(`/characters/public/vote/${characterId}`, {
			method: 'DELETE',
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	async cloneCharacter(characterId: string): Promise<Character> {
		const response = await fetchWithAuth(`/characters/public/clone/${characterId}`, {
			method: 'POST',
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return transformCharacter(result);
	},

	async getCharacterByShareCode(shareCode: string): Promise<Character> {
		const response = await fetchWithAuth(`/characters/public/share/${shareCode}`, {
			method: 'GET',
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return transformCharacter(result.character);
	},

	// ============ CREATORS ============

	async getCreators(): Promise<Creator[]> {
		const response = await fetchWithAuth('/creator', { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return result.data || [];
	},

	// ============ SETTINGS ============

	async getUserSettings(): Promise<UserSettings> {
		const response = await fetchWithAuth('/settings/user', { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return result.data || result;
	},

	async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
		const response = await fetchWithAuth('/settings/user', {
			method: 'PUT',
			body: JSON.stringify(settings),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);
	},

	// ============ CREDITS ============

	async getCreditBalance(): Promise<CreditBalance> {
		const response = await fetchWithAuth('/credits/balance', { method: 'GET' });
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return {
			balance: result.balance || result.credits || 0,
			maxLimit: result.maxLimit || result.max_limit || 100000,
		};
	},

	async checkCredits(requiredCredits: number): Promise<boolean> {
		const response = await fetchWithAuth('/credits/check', {
			method: 'POST',
			body: JSON.stringify({ requiredCredits }),
		});
		const result = await response.json();

		if (result.error) throw new Error(result.error);

		return result.hasEnough || false;
	},
};

import { Character } from '../../types/character';
import { fetchWithAuth } from './api';
import { error as logError } from './logger';

export const dataService = {
	// Characters
	async getCharacters(includeArchived: boolean = false): Promise<(Character & { id: string })[]> {
		try {
			const url = includeArchived ? `/character?includeArchived=true` : `/character`;
			const response = await fetchWithAuth(url, {
				method: 'GET',
			});

			if (!response.ok) {
				const errorText = await response.text();
				logError('DataService: HTTP error response:', errorText);
				throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
			}

			const result = await response.json();

			if (result.error) {
				logError('DataService: API returned error:', result.error);
				throw new Error(result.error);
			}

			// Backend now returns array directly (without data wrapper)
			// This includes system characters (like Finnia) which are visible to all users
			const characters = Array.isArray(result) ? result : result.data || [];
			return characters;
		} catch (err) {
			logError('Error in getCharacters:', err);
			throw err;
		}
	},

	async getCharacterById(id: string): Promise<Character & { id: string }> {
		try {
			const response = await fetchWithAuth(`/character/${id}`, {
				method: 'GET',
			});

			if (!response.ok) {
				const errorText = await response.text();
				logError('DataService: getCharacterById HTTP error:', errorText);
				throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
			}

			const result = await response.json();

			if (result.error) {
				logError('DataService: getCharacterById API returned error:', result.error);
				throw new Error(result.error);
			}

			// Handle both cases: result.data (wrapped) and result (direct object)
			const data = result.data || result;
			return data;
		} catch (err) {
			logError('Error in getCharacterById:', err);
			throw err;
		}
	},

	async updateCharacter(id: string, character: Partial<Character>): Promise<void> {
		try {
			const response = await fetchWithAuth(`/character/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ...character, updated_at: new Date().toISOString() }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}
		} catch (err) {
			logError('Error in updateCharacter:', err);
			throw err;
		}
	},

	async deleteCharacter(id: string): Promise<void> {
		try {
			const response = await fetchWithAuth(`/character/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}
		} catch (err) {
			logError('Error in deleteCharacter:', err);
			throw err;
		}
	},

	// Stories
	async getStories(includeArchived: boolean = false): Promise<any[]> {
		try {
			const url = includeArchived ? `/story?includeArchived=true` : `/story`;
			const response = await fetchWithAuth(url, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			// Transform backend data to match frontend Story interface
			const transformedStories = (result.data || []).map((story: any) => {
				// Extract character image URL from characters_data if available
				let characterImageUrl = null;
				if (
					story.characters_data &&
					Array.isArray(story.characters_data) &&
					story.characters_data.length > 0
				) {
					// Get the first character's image URL
					characterImageUrl =
						story.characters_data[0].image_url || story.characters_data[0].imageUrl;
				}

				return {
					...story,
					characterImageUrl,
					character_image_url: characterImageUrl, // Support both naming conventions
					pages: story.pages_data
						? story.pages_data.map((page: any) => ({
								image: page.image_url,
								pageNumber: page.page_number,
								story: page.story_text,
								blur_hash: page.blur_hash,
							}))
						: [],
				};
			});

			return transformedStories;
		} catch (err) {
			logError('Error in getStories:', err);
			throw err;
		}
	},

	// Public Stories & Collections
	async getPublicStories(
		filter?: 'popular' | 'new' | 'featured',
		page: number = 1,
		limit: number = 20
	): Promise<any> {
		try {
			const params = new URLSearchParams({
				filter: filter || 'popular',
				page: page.toString(),
				limit: limit.toString(),
			});

			const response = await fetchWithAuth(`/story/public?${params}`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				logError('DataService: getPublicStories backend error:', result.error);
				throw new Error(result.error);
			}

			return {
				stories: (result.data || []).map((story: any) => {
					// Extract character image URL from characters_data if available
					let characterImageUrl = null;
					if (
						story.characters_data &&
						Array.isArray(story.characters_data) &&
						story.characters_data.length > 0
					) {
						characterImageUrl =
							story.characters_data[0].image_url || story.characters_data[0].imageUrl;
					}

					return {
						...story,
						characterImageUrl,
						character_image_url: characterImageUrl,
						pages: story.pages_data
							? story.pages_data.map((page: any) => ({
									image: page.image_url,
									pageNumber: page.page_number,
									story: page.story_text,
									blur_hash: page.blur_hash,
								}))
							: [],
					};
				}),
				hasMore: result.hasMore || false,
				total: result.total || 0,
			};
		} catch (err) {
			logError('Error in getPublicStories:', err);
			throw err;
		}
	},

	async getCentralStories(): Promise<any[]> {
		try {
			const response = await fetchWithAuth(`/story/central`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return (result.data || []).map((story: any) => {
				// Extract character image URL from characters_data if available
				let characterImageUrl = null;
				if (
					story.characters_data &&
					Array.isArray(story.characters_data) &&
					story.characters_data.length > 0
				) {
					characterImageUrl =
						story.characters_data[0].image_url || story.characters_data[0].imageUrl;
				}

				return {
					...story,
					characterImageUrl,
					character_image_url: characterImageUrl,
					pages: story.pages_data
						? story.pages_data.map((page: any) => ({
								image: page.image_url,
								pageNumber: page.page_number,
								story: page.story_text,
								blur_hash: page.blur_hash,
							}))
						: [],
				};
			});
		} catch (err) {
			logError('Error in getCentralStories:', err);
			throw err;
		}
	},

	async getCollections(): Promise<any[]> {
		try {
			const response = await fetchWithAuth(`/story/collections`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.data || [];
		} catch (err) {
			logError('Error in getCollections:', err);
			throw err;
		}
	},

	async getCollectionStories(collectionId: string): Promise<any[]> {
		try {
			const response = await fetchWithAuth(`/story/collections/${collectionId}/stories`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return (result.data || []).map((story: any) => {
				// Extract character image URL from characters_data if available
				let characterImageUrl = null;
				if (
					story.characters_data &&
					Array.isArray(story.characters_data) &&
					story.characters_data.length > 0
				) {
					characterImageUrl =
						story.characters_data[0].image_url || story.characters_data[0].imageUrl;
				}

				return {
					...story,
					characterImageUrl,
					character_image_url: characterImageUrl,
					pages: story.pages_data
						? story.pages_data.map((page: any) => ({
								image: page.image_url,
								pageNumber: page.page_number,
								story: page.story_text,
								blur_hash: page.blur_hash,
							}))
						: [],
				};
			});
		} catch (err) {
			logError('Error in getCollectionStories:', err);
			throw err;
		}
	},

	// Voting
	async voteForStory(storyId: string, voteType: 'like' | 'love' | 'star' = 'like'): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/${storyId}/vote`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ voteType }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.data;
		} catch (err) {
			logError('Error in voteForStory:', err);
			throw err;
		}
	},

	async unvoteStory(storyId: string): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/${storyId}/vote`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.data;
		} catch (err) {
			logError('Error in unvoteStory:', err);
			throw err;
		}
	},

	// Favorite toggle for own stories
	async toggleFavorite(storyId: string, isFavorite: boolean): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/${storyId}/favorite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ isFavorite }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.data;
		} catch (err) {
			logError('Error in toggleFavorite:', err);
			throw err;
		}
	},

	async getStoryById(id: string): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/${id}`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			// Transform backend data to match frontend Story interface
			const story = result.data;
			if (story) {
				// Extract character image URL from characters_data if available
				let characterImageUrl = null;
				if (
					story.characters_data &&
					Array.isArray(story.characters_data) &&
					story.characters_data.length > 0
				) {
					characterImageUrl =
						story.characters_data[0].image_url || story.characters_data[0].imageUrl;
				}
				story.characterImageUrl = characterImageUrl;
				story.character_image_url = characterImageUrl;

				if (story.pages_data) {
					story.pages = story.pages_data.map((page: any) => ({
						image: page.image_url,
						pageNumber: page.page_number,
						story: page.story_text,
						blur_hash: page.blur_hash,
					}));
				}
			}

			return story;
		} catch (err) {
			logError('Error in getStoryById:', err);
			throw err;
		}
	},

	async updateStory(id: string, storyData: any): Promise<void> {
		try {
			const response = await fetchWithAuth(`/story/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ...storyData, updated_at: new Date().toISOString() }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}
		} catch (err) {
			logError('Error in updateStory:', err);
			throw err;
		}
	},

	async deleteStory(id: string): Promise<void> {
		try {
			const response = await fetchWithAuth(`/story/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}
		} catch (err) {
			logError('Error in deleteStory:', err);
			throw err;
		}
	},

	async publishStory(
		storyId: string,
		sharingPreference: 'private' | 'link_only' | 'public'
	): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/publish`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ storyId, sharingPreference }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result;
		} catch (err) {
			logError('Error in publishStory:', err);
			throw err;
		}
	},

	async unpublishStory(storyId: string): Promise<any> {
		try {
			const response = await fetchWithAuth(`/story/unpublish/${storyId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result;
		} catch (err) {
			logError('Error in unpublishStory:', err);
			throw err;
		}
	},

	// Creators
	async getCreators(): Promise<any[]> {
		try {
			const response = await fetchWithAuth(`/creator`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.data || [];
		} catch (err) {
			logError('Error in getCreators:', err);
			throw err;
		}
	},

	// Public Characters
	async getPublicCharacters(
		filter: 'popular' | 'new' | 'featured' = 'popular',
		limit: number = 20,
		offset: number = 0,
		collectionId?: string
	): Promise<{ characters: any[]; hasMore: boolean; total: number }> {
		try {
			const params = new URLSearchParams({
				filter,
				limit: limit.toString(),
				offset: offset.toString(),
			});

			if (collectionId) {
				params.append('collection', collectionId);
			}

			const response = await fetchWithAuth(`/characters/public?${params}`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return {
				characters: result.characters || [],
				hasMore: result.hasMore || false,
				total: result.total || 0,
			};
		} catch (err) {
			logError('Error in getPublicCharacters:', err);
			throw err;
		}
	},

	async getCharacterCollections(): Promise<any[]> {
		try {
			const response = await fetchWithAuth(`/characters/public/collections`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return Array.isArray(result) ? result : [];
		} catch (err) {
			logError('Error in getCharacterCollections:', err);
			throw err;
		}
	},

	async voteForCharacter(
		characterId: string,
		voteType: 'like' | 'love' | 'star'
	): Promise<boolean> {
		try {
			const response = await fetchWithAuth(`/characters/public/vote`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ characterId, voteType }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.success || false;
		} catch (err) {
			logError('Error in voteForCharacter:', err);
			throw err;
		}
	},

	async removeCharacterVote(characterId: string): Promise<boolean> {
		try {
			const response = await fetchWithAuth(`/characters/public/vote/${characterId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.success || false;
		} catch (err) {
			logError('Error in removeCharacterVote:', err);
			throw err;
		}
	},

	async cloneCharacter(characterId: string): Promise<any> {
		try {
			const response = await fetchWithAuth(`/characters/public/clone/${characterId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result;
		} catch (err) {
			logError('Error in cloneCharacter:', err);
			throw err;
		}
	},

	async getCharacterByShareCode(shareCode: string): Promise<any> {
		try {
			const response = await fetchWithAuth(`/characters/public/share/${shareCode}`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			return result.character;
		} catch (err) {
			logError('Error in getCharacterByShareCode:', err);
			throw err;
		}
	},
};

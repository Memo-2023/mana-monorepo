import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import tagEvents from '~/features/tags/tagEvents';

// Database table names
export const DB_TABLES = {
	TAGS: 'tags',
	MEMO_TAGS: 'memo_tags',
	MEMO_SPACES: 'memo_spaces',
	SPACES: 'spaces',
};

// RPC function names
export const RPC_FUNCTIONS = {
	ADD_TAG_TO_MEMO: 'add_tag_to_memo',
};

export interface Tag {
	id: string;
	name: string;
	style: { color?: string; [key: string]: any };
	description?: { [key: string]: any };
	user_id: string;
	created_at: string;
	updated_at: string;
	is_pinned?: boolean;
	sort_order?: number;
}

export interface TagItem {
	id: string;
	text: string;
	color: string;
}

export interface Space {
	id: string;
	name: string;
	color?: string;
}

export interface MemoWithTagsAndSpace {
	id: string;
	tags?: TagItem[];
	space?: Space;
}

interface UseMemoTagsAndSpaceProps {
	memo: MemoWithTagsAndSpace;
	spaces: Space[];
	userId: string;
}

/**
 * Convert a Tag database object to a simplified TagItem
 */
export const convertTagToTagItem = (tag: Tag): TagItem => {
	const tagColor = tag.style?.color || '#cccccc';

	return {
		id: tag.id,
		text: tag.name,
		color: tagColor,
	};
};

/**
 * Custom hook to manage memo tags and space data
 */
export function useMemoTagsAndSpace({ memo, spaces, userId }: UseMemoTagsAndSpaceProps) {
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [tagItems, setTagItems] = useState<TagItem[]>([]);
	const [memoSpace, setMemoSpace] = useState<Space | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Load all available tags from the database
	 */
	const loadAllTags = useCallback(async () => {
		try {
			setIsLoading(true);
			const supabase = await getAuthenticatedClient();
			if (!supabase) {
				console.error('Failed to get authenticated client');
				return;
			}

			const { data, error } = await supabase
				.from(DB_TABLES.TAGS)
				.select('*')
				.order('is_pinned', { ascending: false })
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (error) {
				throw error;
			}

			if (data) {
				setAllTags(data);
				setTagItems(data.map(convertTagToTagItem));
			}

			// Load tags specific to this memo
			await loadMemoTags();
		} catch (error) {
			console.error('Error loading tags:', error);
		} finally {
			setIsLoading(false);
		}
	}, [memo.id]);

	/**
	 * Load tags associated with this specific memo
	 */
	const loadMemoTags = useCallback(async () => {
		if (!memo.id || memo.id === 'recording-temp') return [];

		try {
			const supabase = await getAuthenticatedClient();
			if (!supabase) {
				console.error('Failed to get authenticated client');
				return [];
			}

			// First, get the tag_ids from memo_tags table
			const { data: memoTagsData, error: memoTagsError } = await supabase
				.from(DB_TABLES.MEMO_TAGS)
				.select('tag_id')
				.eq('memo_id', memo.id);

			if (memoTagsError) {
				console.error('Error fetching memo tag relations:', memoTagsError);
				return [];
			}

			if (!memoTagsData || memoTagsData.length === 0) {
				setSelectedTagIds([]);
				return [];
			}

			// Extract tag IDs
			const tagIds = memoTagsData.map((item) => item.tag_id);
			setSelectedTagIds(tagIds);

			// Then fetch the full tag data for these IDs
			const { data: tagsData, error: tagsError } = await supabase
				.from(DB_TABLES.TAGS)
				.select('*')
				.in('id', tagIds);

			if (tagsError) {
				console.error('Error fetching tags by IDs:', tagsError);
				return [];
			}

			if (!tagsData || tagsData.length === 0) {
				return [];
			}

			// Convert to TagItems
			const memoTagItems = tagsData.map(convertTagToTagItem);

			// Return the tag items for the parent to handle
			return memoTagItems;
		} catch (error) {
			console.error('Error loading memo tags:', error);
			return [];
		}
	}, [memo.id]);

	/**
	 * Load space information for this memo
	 * TEMPORARILY DISABLED - Spaces feature not yet implemented
	 */
	const loadMemoSpace = useCallback(async () => {
		// Spaces feature is not yet implemented - skip loading
		setMemoSpace(null);
		return null;
	}, [memo.id, spaces]);

	/**
	 * Handle tag selection (add/remove tag from memo)
	 */
	const handleTagSelect = useCallback(
		async (tagId: string) => {
			if (!memo.id || memo.id === 'recording-temp') return;

			try {
				const isSelected = selectedTagIds.includes(tagId);
				const supabase = await getAuthenticatedClient();
				if (!supabase) {
					console.error('Failed to get authenticated client');
					return;
				}

				// Optimistic update
				if (isSelected) {
					// Remove tag locally first
					setSelectedTagIds((prevIds) => prevIds.filter((id) => id !== tagId));

					// Then remove from database
					const { error } = await supabase
						.from(DB_TABLES.MEMO_TAGS)
						.delete()
						.eq('memo_id', memo.id)
						.eq('tag_id', tagId);

					if (error) {
						console.error(`Error removing tag ${tagId} from memo ${memo.id}:`, error);
						// Revert optimistic update on error
						setSelectedTagIds((prevIds) => [...prevIds, tagId]);
					}
				} else {
					// Add tag locally first
					setSelectedTagIds((prevIds) => [...prevIds, tagId]);

					// Then add to database using RPC function
					const { error } = await supabase.rpc(RPC_FUNCTIONS.ADD_TAG_TO_MEMO, {
						p_memo_id: memo.id,
						p_tag_id: tagId,
					});

					if (error) {
						console.error(`Error adding tag ${tagId} to memo ${memo.id}:`, error);
						// Revert optimistic update on error
						setSelectedTagIds((prevIds) => prevIds.filter((id) => id !== tagId));
					}
				}
			} catch (error) {
				console.error('Error in tag selection:', error);
			}
		},
		[memo.id, selectedTagIds]
	);

	/**
	 * Handle creation of a new tag
	 */
	const handleCreateTag = useCallback(
		async (name: string, color: string) => {
			try {
				if (!userId) {
					console.error('Error: User not authenticated');
					return null;
				}

				const supabase = await getAuthenticatedClient();
				if (!supabase) {
					console.error('Failed to get authenticated client');
					return null;
				}

				// Create new tag in database
				const { data, error } = await supabase
					.from(DB_TABLES.TAGS)
					.insert({
						name: name,
						style: { color },
						user_id: userId,
					})
					.select()
					.single();

				if (error) {
					console.error('Error creating tag:', error);
					return null;
				}

				// Reload all tags
				await loadAllTags();

				// Emit event für andere Komponenten
				tagEvents.emitTagCreated(data.id, data);

				return data;
			} catch (error) {
				console.error('Error in tag creation:', error);
				return null;
			}
		},
		[userId, loadAllTags]
	);

	// Set up event listeners for tag changes
	useEffect(() => {
		// Load initial data
		loadAllTags();
		// loadMemoSpace(); // TEMPORARILY DISABLED - Spaces feature not yet implemented

		// Register event listeners for tag changes
		const tagAddedUnsubscribe = tagEvents.onTagAdded(({ memoId, tagId }) => {
			if (memoId === memo.id) {
				loadAllTags();
			}
		});

		const tagRemovedUnsubscribe = tagEvents.onTagRemoved(({ memoId, tagId }) => {
			if (memoId === memo.id) {
				loadAllTags();
			}
		});

		const batchUpdatedUnsubscribe = tagEvents.onTagsBatchUpdated(({ memoIds, tagIds }) => {
			if (memoIds.includes(memo.id)) {
				loadAllTags();
			}
		});

		// Weitere Event-Listener für Tag-Pinning und Tag-Order-Änderungen
		const tagPinnedUnsubscribe = tagEvents.onTagPinned(({ tagId, isPinned }) => {
			// Wenn ein Tag angepinnt/entfernt wird, Tags neu laden für aktualisierte Reihenfolge
			loadAllTags();
		});

		const tagOrderChangedUnsubscribe = tagEvents.onTagOrderChanged(({ reorderedTagIds }) => {
			// Wenn Tag-Reihenfolge geändert wird, Tags neu laden
			loadAllTags();
		});

		// Listener für neu erstellte Tags
		const tagCreatedUnsubscribe = tagEvents.onTagCreated(({ tagId, tag }) => {
			// Tags neu laden wenn ein neuer Tag erstellt wurde
			loadAllTags();
		});

		// Cleanup on unmount
		return () => {
			tagAddedUnsubscribe();
			tagRemovedUnsubscribe();
			batchUpdatedUnsubscribe();
			tagPinnedUnsubscribe();
			tagOrderChangedUnsubscribe();
			tagCreatedUnsubscribe();
		};
	}, [memo.id, loadAllTags]);

	return {
		// Tag data
		selectedTagIds,
		allTags,
		tagItems,

		// Space data
		memoSpace,

		// Loading state
		isLoading,

		// Actions
		onSelectTag: handleTagSelect,
		onCreateTag: handleCreateTag,

		// Loaders (exposed for manual refresh if needed)
		loadAllTags,
		loadMemoTags,
		loadMemoSpace,
	};
}

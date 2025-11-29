import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Story } from '../types/story';
import { useAuth } from '../src/contexts/AuthContext';
import { dataService } from '../src/utils/dataService';

export function useStories() {
	const [allStories, setAllStories] = useState<(Story & { id: string })[]>([]);
	const [archivedStories, setArchivedStories] = useState<(Story & { id: string })[]>([]);
	const [loading, setLoading] = useState(true);
	const { user, isAuthenticated } = useAuth();

	// Use useFocusEffect instead of useEffect to reload stories when screen comes into focus
	// This ensures the list refreshes after archiving/unarchiving a story
	// Same pattern as CharacterList component which works correctly
	useFocusEffect(
		useCallback(() => {
			const loadStories = async () => {
				try {
					if (!isAuthenticated || !user) {
						console.error('[useStories] User not authenticated');
						setLoading(false);
						return;
					}

					setLoading(true);
					const stories = await dataService.getStories(true); // Include archived stories

					// Filter archived and non-archived stories
					const nonArchivedStories = stories.filter((story) => story.archived !== true);
					const archivedStoriesList = stories.filter((story) => story.archived === true);

					setAllStories(nonArchivedStories);
					setArchivedStories(archivedStoriesList);
				} catch (error) {
					console.error('[useStories] Error loading stories:', error);
					setAllStories([]); // Set empty array on error
				} finally {
					setLoading(false);
				}
			};

			loadStories();
		}, [isAuthenticated, user])
	);

	const getStoryById = (id: string) => {
		// Search first in active stories
		const activeStory = allStories.find((story) => story.id === id);
		if (activeStory) return activeStory;

		// If not found, search in archived stories
		return archivedStories.find((story) => story.id === id);
	};

	const refreshStories = async () => {
		setLoading(true);
		try {
			if (!isAuthenticated || !user) {
				console.error('User not authenticated');
				setLoading(false);
				return;
			}

			const stories = await dataService.getStories(true); // Include archived stories

			// Filter archived and non-archived stories
			const nonArchivedStories = stories.filter((story) => story.archived !== true);
			const archivedStoriesList = stories.filter((story) => story.archived === true);

			setAllStories(nonArchivedStories);
			setArchivedStories(archivedStoriesList);
		} catch (error) {
			console.error('Error refreshing stories:', error);
		} finally {
			setLoading(false);
		}
	};

	return { allStories, loading, getStoryById, refreshStories };
}

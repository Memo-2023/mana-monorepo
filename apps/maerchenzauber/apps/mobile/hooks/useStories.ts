import { useState, useEffect, useCallback } from 'react';
import { Story } from '../types/Story';
import { useAuth } from '../src/contexts/AuthContext';
import { dataService } from '../src/utils/dataService';

export function useStories() {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isAuthenticated || !user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    try {
      const stories = await dataService.getStories(true); // Include archived stories
      setAllStories(stories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const getStoryById = (id: string) => allStories.find(story => story.id === id);

  const refreshStories = useCallback(async () => {
    await fetchStories();
  }, [fetchStories]);

  return { allStories, getStoryById, loading, error, refreshStories };
}
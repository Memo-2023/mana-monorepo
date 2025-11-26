import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from '../src/utils/dataService';
import { useAuth } from '../src/contexts/AuthContext';

type FilterTab = 'popular' | 'new' | 'featured';

interface PublicStoriesResult {
  stories: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  refreshing: boolean;
  voteForStory: (storyId: string) => Promise<void>;
  unvoteStory: (storyId: string) => Promise<void>;
}

export function usePublicStories(filter: FilterTab = 'popular'): PublicStoriesResult {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();
  
  // Track loading state to prevent duplicate requests
  const isLoadingMore = useRef(false);
  const previousFilter = useRef(filter);

  // Fetch stories based on filter
  const fetchStories = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      // Fetch public stories with filter
      const result = await dataService.getPublicStories(
        filter,
        pageNum,
        20
      );
      
      if (isRefresh || pageNum === 1) {
        setStories(result.stories);
      } else {
        setStories(prev => [...prev, ...result.stories]);
      }
      
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      console.error('Error fetching public stories:', err);
      
      // Handle different error types
      let errorMessage = 'Failed to fetch public stories';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingMore.current = false;
    }
  }, [filter, isAuthenticated]);

  // Initial load and filter change
  useEffect(() => {
    // Reset when filter changes
    if (previousFilter.current !== filter) {
      setStories([]);
      setPage(1);
      setHasMore(true);
      setLoading(true);
      previousFilter.current = filter;
    }
    
    fetchStories(1);
  }, [filter, fetchStories]);

  // Load more stories (pagination)
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore.current || loading) {
      return;
    }
    
    isLoadingMore.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStories(nextPage);
  }, [hasMore, loading, page, filter, fetchStories]);

  // Pull to refresh
  const refresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchStories(1, true);
  }, [fetchStories]);

  // Vote for a story (optimistic update)
  const voteForStory = useCallback(async (storyId: string) => {
    // Optimistic update
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, vote_count: (story.vote_count || 0) + 1, user_voted: true }
        : story
    ));

    try {
      await dataService.voteForStory(storyId);
    } catch (err) {
      // Revert on error
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, vote_count: Math.max(0, (story.vote_count || 0) - 1), user_voted: false }
          : story
      ));
      console.error('Error voting for story:', err);
      throw err;
    }
  }, []);

  // Remove vote from story (optimistic update)
  const unvoteStory = useCallback(async (storyId: string) => {
    // Optimistic update
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, vote_count: Math.max(0, (story.vote_count || 0) - 1), user_voted: false }
        : story
    ));

    try {
      await dataService.unvoteStory(storyId);
    } catch (err) {
      // Revert on error
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, vote_count: (story.vote_count || 0) + 1, user_voted: true }
          : story
      ));
      console.error('Error removing vote from story:', err);
      throw err;
    }
  }, []);

  return {
    stories,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    refreshing,
    voteForStory,
    unvoteStory,
  };
}
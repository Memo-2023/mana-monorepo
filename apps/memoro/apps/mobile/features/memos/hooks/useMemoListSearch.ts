import { useState, useCallback, useEffect, useMemo } from 'react';
import { getTranscriptText } from '../utils/transcriptUtils';
import type { Memo } from '../types/Memo';

interface MemoSearchOptions {
  searchFields?: ('title' | 'intro' | 'transcript' | 'tags')[];
  caseSensitive?: boolean;
  minSearchLength?: number;
  includeArchived?: boolean;
}

interface MemoListSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMemos: Memo[];
  searchCount: number;
  isSearching: boolean;
  clearSearch: () => void;
  highlightMatches?: (text: string) => { text: string; isMatch: boolean }[];
}

export function useMemoListSearch(
  memos: Memo[],
  options: MemoSearchOptions = {}
): MemoListSearchResult {
  const {
    searchFields = ['title', 'intro', 'transcript'],
    caseSensitive = false,
    minSearchLength = 2,
    includeArchived = false,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');

  // Filter memos based on search query
  const filteredMemos = useMemo(() => {
    // If no search query, return original memos (filtered by archive status)
    if (!searchQuery.trim() || searchQuery.length < minSearchLength) {
      return includeArchived ? memos : memos.filter((m) => !m.is_archived);
    }

    const searchTerm = caseSensitive ? searchQuery : searchQuery.toLowerCase();

    return memos.filter((memo) => {
      // Skip archived memos if not included
      if (!includeArchived && memo.is_archived) {
        return false;
      }

      // Search in title
      if (searchFields.includes('title') && memo.title) {
        const title = caseSensitive ? memo.title : memo.title.toLowerCase();
        if (title.includes(searchTerm)) return true;
      }

      // Search in intro
      if (searchFields.includes('intro') && memo.intro) {
        const intro = caseSensitive ? memo.intro : memo.intro.toLowerCase();
        if (intro.includes(searchTerm)) return true;
      }

      // Search in transcript (with fallback to utterances)
      if (searchFields.includes('transcript')) {
        const transcript = getTranscriptText(memo);
        if (transcript) {
          const searchText = caseSensitive ? transcript : transcript.toLowerCase();
          if (searchText.includes(searchTerm)) return true;
        }
      }

      // Search in tags
      if (searchFields.includes('tags') && memo.tags && memo.tags.length > 0) {
        const tagMatch = memo.tags.some((tag) => {
          const tagName = caseSensitive ? tag.name : tag.name.toLowerCase();
          return tagName.includes(searchTerm);
        });
        if (tagMatch) return true;
      }

      return false;
    });
  }, [memos, searchQuery, searchFields, caseSensitive, minSearchLength, includeArchived]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Optional: Helper to highlight matches in text
  const highlightMatches = useCallback(
    (text: string) => {
      if (!searchQuery.trim() || searchQuery.length < minSearchLength) {
        return [{ text, isMatch: false }];
      }

      const searchTerm = caseSensitive ? searchQuery : searchQuery.toLowerCase();
      const compareText = caseSensitive ? text : text.toLowerCase();

      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      let index = compareText.indexOf(searchTerm);

      while (index !== -1) {
        // Add non-matching part
        if (index > lastIndex) {
          parts.push({
            text: text.substring(lastIndex, index),
            isMatch: false,
          });
        }

        // Add matching part
        parts.push({
          text: text.substring(index, index + searchQuery.length),
          isMatch: true,
        });

        lastIndex = index + searchQuery.length;
        index = compareText.indexOf(searchTerm, lastIndex);
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push({
          text: text.substring(lastIndex),
          isMatch: false,
        });
      }

      return parts;
    },
    [searchQuery, caseSensitive, minSearchLength]
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredMemos,
    searchCount: filteredMemos.length,
    isSearching: searchQuery.trim().length >= minSearchLength,
    clearSearch,
    highlightMatches,
  };
}

// Helper hook for debounced search (optional)
export function useDebouncedMemoSearch(
  memos: Memo[],
  options: MemoSearchOptions = {},
  debounceMs: number = 300
): MemoListSearchResult & { debouncedQuery: string } {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchResult = useMemoListSearch(memos, options);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchResult.searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchResult.searchQuery, debounceMs]);

  // Use debounced query for actual filtering
  const filteredResult = useMemoListSearch(memos, {
    ...options,
    // Override with debounced query
  });

  return {
    ...searchResult,
    debouncedQuery,
    filteredMemos: debouncedQuery === searchResult.searchQuery ? searchResult.filteredMemos : memos,
  };
}

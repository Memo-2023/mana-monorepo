import { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { getTranscriptText } from '../utils/transcriptUtils';

// Type definitions
interface SearchResult {
  id: string;
  type: string;
  text: string;
  index: number;
  matchIndex: number;
}

interface MemoData {
  title?: string;
  intro?: string;
  source?: {
    content?: string;
    transcript?: string;
  };
}

interface MemoryData {
  id: string;
  title: string;
  content: string;
}

interface SearchState {
  isSearchMode: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  scrollViewRef: React.RefObject<ScrollView>;
}

interface SearchActions {
  setIsSearchMode: (mode: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setCurrentSearchIndex: (index: number) => void;
  handleSearchPress: () => void;
  performSearch: (query: string) => void;
  navigateToNextSearchResult: () => void;
  navigateToPreviousSearchResult: () => void;
  closeSearch: () => void;
  scrollToCurrentResult: () => void;
}

export function useMemoSearch(memo: MemoData | null, memories: MemoryData[]): SearchState & SearchActions {
  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Search handlers
  const handleSearchPress = useCallback(() => {
    console.debug('Opening search for memo');
    setIsSearchMode(true);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, []);

  const performSearch = useCallback((query: string) => {
    if (!query.trim() || !memo) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();
    
    // Helper function to find all matches in a text
    const findAllMatches = (text: string, searchTerm: string): number[] => {
      const matches: number[] = [];
      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(searchTerm);
      
      while (index !== -1) {
        matches.push(index);
        index = lowerText.indexOf(searchTerm, index + 1);
      }
      
      return matches;
    };
    
    let resultCounter = 0;
    
    // Search in title
    if (memo.title) {
      const matches = findAllMatches(memo.title, searchTerm);
      matches.forEach((matchIndex, i) => {
        results.push({
          id: `title-${i}`,
          type: 'title',
          text: memo.title!,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
    }
    
    // Search in intro
    if (memo.intro) {
      const matches = findAllMatches(memo.intro, searchTerm);
      matches.forEach((matchIndex, i) => {
        results.push({
          id: `intro-${i}`,
          type: 'intro',
          text: memo.intro!,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
    }
    
    // Search in transcript
    if (memo.source?.content) {
      const matches = findAllMatches(memo.source.content, searchTerm);
      matches.forEach((matchIndex, i) => {
        results.push({
          id: `transcript-content-${i}`,
          type: 'transcript',
          text: memo.source!.content!,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
    }
    
    // Get transcript text (from utterances or legacy fields)
    const transcript = getTranscriptText(memo);
    if (transcript && transcript !== memo.source?.content) {
      const matches = findAllMatches(transcript, searchTerm);
      matches.forEach((matchIndex, i) => {
        results.push({
          id: `transcript-${i}`,
          type: 'transcript',
          text: transcript,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
    }
    
    // Search in memories
    memories.forEach((memory) => {
      const titleMatches = findAllMatches(memory.title, searchTerm);
      titleMatches.forEach((matchIndex, i) => {
        results.push({
          id: `memory-title-${memory.id}-${i}`,
          type: 'memory-title',
          text: memory.title,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
      
      const contentMatches = findAllMatches(memory.content, searchTerm);
      contentMatches.forEach((matchIndex, i) => {
        results.push({
          id: `memory-content-${memory.id}-${i}`,
          type: 'memory-content',
          text: memory.content,
          index: matchIndex,
          matchIndex: resultCounter++
        });
      });
    });
    
    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [memo, memories]);

  const scrollToCurrentResult = useCallback(() => {
    if (scrollViewRef.current && searchResults.length > 0) {
      const currentResult = searchResults[currentSearchIndex];
      if (currentResult) {
        // Improved scroll positioning with header offset
        const headerHeight = 120; // Header + navigation height
        const screenCenterOffset = 100; // Additional offset to center content nicely
        
        // More accurate position calculation
        let estimatedPosition = 0;
        
        if (currentResult.type === 'title') {
          estimatedPosition = 50; // Title is near the top
        } else if (currentResult.type === 'intro') {
          estimatedPosition = 200; // Intro follows title
        } else if (currentResult.type === 'transcript') {
          estimatedPosition = 400; // Transcript section
        } else if (currentResult.type.startsWith('memory-')) {
          // For memory results, try to scroll to memories section
          estimatedPosition = 800; // Memories are typically lower
        }
        
        // Account for header and add center offset
        const scrollPosition = Math.max(0, estimatedPosition - headerHeight - screenCenterOffset);
        
        scrollViewRef.current.scrollTo({
          y: scrollPosition,
          animated: true
        });
        
        console.debug('Scrolling to search result:', {
          resultType: currentResult.type,
          estimatedPosition,
          finalScrollPosition: scrollPosition,
          currentIndex: currentSearchIndex,
          totalResults: searchResults.length
        });
      }
    }
  }, [searchResults, currentSearchIndex]);

  const navigateToNextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const newIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(newIndex);
    }
  }, [searchResults.length, currentSearchIndex]);
  
  const navigateToPreviousSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentSearchIndex(newIndex);
    }
  }, [searchResults.length, currentSearchIndex]);

  // Auto-scroll when search index changes
  useEffect(() => {
    if (isSearchMode && searchResults.length > 0) {
      scrollToCurrentResult();
    }
  }, [currentSearchIndex, isSearchMode, scrollToCurrentResult]);
  
  const closeSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, []);

  return {
    // State
    isSearchMode,
    searchQuery,
    searchResults,
    currentSearchIndex,
    scrollViewRef,
    
    // Actions
    setIsSearchMode,
    setSearchQuery,
    setSearchResults,
    setCurrentSearchIndex,
    handleSearchPress,
    performSearch,
    navigateToNextSearchResult,
    navigateToPreviousSearchResult,
    closeSearch,
    scrollToCurrentResult,
  };
}
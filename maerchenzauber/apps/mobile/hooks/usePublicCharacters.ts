import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../src/utils/api';
import { Alert } from 'react-native';

export interface PublicCharacter {
  id: string;
  name: string;
  original_description: string;
  character_description_prompt: string;
  image_url?: string;
  images_data?: any[];
  is_published: boolean;
  published_at?: string;
  share_code?: string;
  total_vote_score: number;
  stories_count: number;
  sharing_preference: 'private' | 'link_only' | 'public' | 'commons';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterCollection {
  id: string;
  name: string;
  description: string;
  type: 'official' | 'community' | 'seasonal' | 'contest';
  is_official: boolean;
  is_active: boolean;
  sort_order: number;
  icon_url?: string;
  banner_url?: string;
  character_count?: number;
}

type FilterType = 'popular' | 'new' | 'featured' | 'collections';

export function usePublicCharacters(filter: FilterType = 'popular', collectionId?: string | null) {
  const [characters, setCharacters] = useState<PublicCharacter[]>([]);
  const [collections, setCollections] = useState<CharacterCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Load collections
  const loadCollections = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/characters/public/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      setCollections(data);
    } catch (err) {
      console.error('Error loading collections:', err);
    }
  }, []);

  // Load characters
  const loadCharacters = useCallback(async (reset: boolean = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      let url = `/characters/public?filter=${filter}&limit=${limit}&offset=${currentOffset}`;
      
      if (collectionId) {
        url += `&collection=${collectionId}`;
      }

      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('404: Endpoint not found');
        }
        throw new Error('Failed to fetch characters');
      }

      const data = await response.json();
      
      if (reset) {
        setCharacters(data.characters);
      } else {
        setCharacters(prev => [...prev, ...data.characters]);
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + limit);
      setError(null);
    } catch (err: any) {
      console.error('Error loading public characters:', err);
      if (err.message?.includes('404')) {
        setError('404: Backend endpoints not yet available');
      } else {
        setError('Fehler beim Laden der Charaktere');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, collectionId, offset, limit]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    setCharacters([]);
    loadCollections();
    loadCharacters(true);
  }, [filter, collectionId]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    loadCharacters(true);
  }, [loadCharacters]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      loadCharacters(false);
    }
  }, [loading, refreshing, hasMore, loadCharacters]);

  // Vote for character
  const voteForCharacter = useCallback(async (characterId: string, voteType: 'like' | 'love' | 'star') => {
    try {
      const response = await fetchWithAuth('/characters/public/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId,
          voteType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // Update local state
      setCharacters(prev => prev.map(char => {
        if (char.id === characterId) {
          const voteWeight = voteType === 'star' ? 3 : voteType === 'love' ? 2 : 1;
          return {
            ...char,
            total_vote_score: char.total_vote_score + voteWeight,
          };
        }
        return char;
      }));

      return true;
    } catch (err) {
      console.error('Error voting for character:', err);
      Alert.alert('Fehler', 'Konnte nicht abstimmen\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
      return false;
    }
  }, []);

  // Remove vote
  const removeVote = useCallback(async (characterId: string) => {
    try {
      const response = await fetchWithAuth(`/characters/public/vote/${characterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove vote');
      }

      // Update local state (rough estimate, actual weight unknown)
      setCharacters(prev => prev.map(char => {
        if (char.id === characterId) {
          return {
            ...char,
            total_vote_score: Math.max(0, char.total_vote_score - 1),
          };
        }
        return char;
      }));

      return true;
    } catch (err) {
      console.error('Error removing vote:', err);
      Alert.alert('Fehler', 'Konnte Abstimmung nicht entfernen\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
      return false;
    }
  }, []);

  // Clone character
  const cloneCharacter = useCallback(async (characterId: string) => {
    try {
      const response = await fetchWithAuth(`/characters/public/clone/${characterId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clone character');
      }

      const data = await response.json();
      Alert.alert('Erfolg', 'Charakter wurde erfolgreich kopiert!');
      return data;
    } catch (err) {
      console.error('Error cloning character:', err);
      Alert.alert('Fehler', 'Konnte Charakter nicht kopieren\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
      return null;
    }
  }, []);

  // Publish character
  const publishCharacter = useCallback(async (characterId: string, sharingPreference: 'private' | 'link_only' | 'public' | 'commons') => {
    try {
      const response = await fetchWithAuth('/character/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId,
          sharingPreference,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish character');
      }

      const data = await response.json();
      Alert.alert('Erfolg', 'Charakter wurde veröffentlicht!');
      return data;
    } catch (err) {
      console.error('Error publishing character:', err);
      Alert.alert('Fehler', 'Konnte Charakter nicht veröffentlichen\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
      return null;
    }
  }, []);

  // Unpublish character
  const unpublishCharacter = useCallback(async (characterId: string) => {
    try {
      const response = await fetchWithAuth(`/character/unpublish/${characterId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish character');
      }

      const data = await response.json();
      Alert.alert('Erfolg', 'Charakter wurde zurückgezogen!');
      return data;
    } catch (err) {
      console.error('Error unpublishing character:', err);
      Alert.alert('Fehler', 'Konnte Charakter nicht zurückziehen\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
      return null;
    }
  }, []);

  return {
    characters,
    collections,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    voteForCharacter,
    removeVote,
    cloneCharacter,
    publishCharacter,
    unpublishCharacter,
  };
}
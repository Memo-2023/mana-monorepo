import { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { dataService } from '../src/utils/dataService';

export interface MostUsedCharacter {
  name: string;
  usageCount: number;
}

export function useCharacterStats() {
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [mostUsedCharacter, setMostUsedCharacter] = useState<MostUsedCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadCharacterStats = async () => {
      try {
        if (!isAuthenticated || !user) {
          // Not an error - expected during sign-out or initial load
          console.debug('User not authenticated, skipping character stats load');
          setCharacterCount(0);
          setMostUsedCharacter(null);
          setLoading(false);
          return;
        }

        const [characters, stories] = await Promise.all([
          dataService.getCharacters(),
          dataService.getStories(),
        ]);

        setCharacterCount(characters.length);

        // Count character usage in stories
        const characterUsage = new Map<string, { name: string; count: number }>();

        stories.forEach(story => {
          if (story.character_id && story.character_name) {
            const existing = characterUsage.get(story.character_id);
            if (existing) {
              existing.count++;
            } else {
              characterUsage.set(story.character_id, {
                name: story.character_name,
                count: 1,
              });
            }
          }
        });

        // Find most used character
        let maxUsage = { name: '', count: 0 };
        characterUsage.forEach(usage => {
          if (usage.count > maxUsage.count) {
            maxUsage = usage;
          }
        });

        if (maxUsage.count > 0) {
          setMostUsedCharacter({ name: maxUsage.name, usageCount: maxUsage.count });
        } else {
          setMostUsedCharacter(null);
        }

      } catch (error) {
        console.error('Error loading character stats:', error);
        setCharacterCount(0);
        setMostUsedCharacter(null);
      } finally {
        setLoading(false);
      }
    };

    loadCharacterStats();
  }, [isAuthenticated, user]);

  return { characterCount, mostUsedCharacter, loading };
}

import { useState, useEffect } from 'react';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

interface MigrationStats {
  memoCount: number;
  memoryCount: number;
  imageCount: number;
  tagCount: number;
}

export const useMigrationStats = (isVisible: boolean) => {
  const [stats, setStats] = useState<MigrationStats>({
    memoCount: 0,
    memoryCount: 0,
    imageCount: 0,
    tagCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = await getAuthenticatedClient();
        
        // Fetch all counts in parallel
        const [memosResult, memoriesResult, tagsResult] = await Promise.all([
          supabase.from('memos').select('id', { count: 'exact', head: true }),
          supabase.from('memories').select('id', { count: 'exact', head: true }),
          supabase.from('tags').select('id', { count: 'exact', head: true }),
        ]);

        if (memosResult.error || memoriesResult.error || tagsResult.error) {
          throw new Error('Failed to load migration statistics');
        }

        // Count images by checking memos with images in metadata
        const memosWithImagesResult = await supabase
          .from('memos')
          .select('metadata')
          .not('metadata->images', 'is', null);

        // Count total images across all memos
        let totalImageCount = 0;
        if (memosWithImagesResult.data) {
          memosWithImagesResult.data.forEach(memo => {
            if (memo.metadata?.images && Array.isArray(memo.metadata.images)) {
              totalImageCount += memo.metadata.images.length;
            }
          });
        }

        setStats({
          memoCount: memosResult.count || 0,
          memoryCount: memoriesResult.count || 0,
          imageCount: totalImageCount,
          tagCount: tagsResult.count || 0,
        });
      } catch (err) {
        console.error('Error loading migration stats:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [isVisible]);

  return { stats, isLoading, error };
};
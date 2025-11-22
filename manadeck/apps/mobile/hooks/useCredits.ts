import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

interface UseCreditsResult {
  credits: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage user credit balance from Mana Core
 */
export function useCredits(): UseCreditsResult {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const creditBalance = await authService.getCredits();

      if (creditBalance !== null) {
        setCredits(creditBalance);
      } else {
        setError('Failed to fetch credits');
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    loading,
    error,
    refetch: fetchCredits,
  };
}

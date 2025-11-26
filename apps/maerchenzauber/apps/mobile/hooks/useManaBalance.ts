import { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { fetchWithAuth } from '../src/utils/api';

interface ManaUser {
  id: string;
  email: string;
  credits: number;
  max_credit_limit: number;
  subscription_plan_id: string;
  subscription_status: string;
  daily_mana_amount: number;
  max_mana_limit: number;
  last_daily_credit_allocation: string;
}

export function useManaBalance() {
  const [manaBalance, setManaBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<ManaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchManaBalance = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch credits from backend using built-in Mana Core package endpoint
      const response = await fetchWithAuth('/auth/credits');
      const data = await response.json();
      console.log('Credits response:', data); // Debug log

      // Mana Core returns { userId, credits }
      if (data && data.credits !== undefined) {
        setManaBalance(data.credits);
        // Store the full user data structure for display
        setUserData({
          id: data.userId || user.id,
          email: user.email,
          credits: data.credits,
          max_credit_limit: 100000, // Default value
          daily_mana_amount: 5, // Default values
          max_mana_limit: 150, // Default values
          subscription_plan_id: 'free',
          subscription_status: 'active',
          last_daily_credit_allocation: new Date().toISOString()
        } as ManaUser);
      }
    } catch (err) {
      console.error('Error fetching Mana balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Mana balance');
      // Set a default value on error
      setManaBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure token is saved
    const timer = setTimeout(() => {
      fetchManaBalance();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user?.email]);

  return {
    manaBalance,
    userData,
    loading,
    error,
    refetch: fetchManaBalance,
  };
}
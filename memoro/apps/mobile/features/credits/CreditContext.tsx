import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { creditService } from './creditService';

interface CreditContextType {
  credits: number | null;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  setCredits: (credits: number) => void;
  updateCreditsAfterOperation: (creditsConsumed: number) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children }) => {
  const [credits, setCreditsState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCredits = useCallback(async () => {
    try {
      console.log('[CreditContext] Starting credit refresh...');
      setIsLoading(true);
      const creditsData = await creditService.getUserCredits();
      
      console.log('[CreditContext] Credits data from service:', creditsData);
      
      if (creditsData && typeof creditsData.credits === 'number') {
        console.log('[CreditContext] Setting credits to:', creditsData.credits);
        setCreditsState(creditsData.credits);
      } else {
        console.warn('[CreditContext] Invalid credits data structure:', creditsData);
      }
    } catch (error) {
      console.error('[CreditContext] Error refreshing credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCredits = useCallback((newCredits: number) => {
    setCreditsState(newCredits);
  }, []);

  const updateCreditsAfterOperation = useCallback((creditsConsumed: number) => {
    setCreditsState(prevCredits => {
      if (prevCredits === null) return null;
      return Math.max(0, prevCredits - creditsConsumed);
    });
  }, []);

  // Register with credit service to receive notifications
  useEffect(() => {
    const unsubscribe = creditService.onCreditUpdate((creditsConsumed: number) => {
      console.log(`Credits consumed: ${creditsConsumed}, updating ManaCounter`);
      if (creditsConsumed === 0) {
        // If creditsConsumed is 0, it's a signal to refresh from server
        refreshCredits();
      } else {
        // Otherwise, update local state
        updateCreditsAfterOperation(creditsConsumed);
      }
    });

    return unsubscribe;
  }, [updateCreditsAfterOperation, refreshCredits]);

  const value: CreditContextType = {
    credits,
    isLoading,
    refreshCredits,
    setCredits,
    updateCreditsAfterOperation,
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = (): CreditContextType => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
};

// Hook for triggering credit refresh from anywhere in the app
export const useCreditRefresh = () => {
  const { refreshCredits, updateCreditsAfterOperation } = useCredits();
  
  return {
    refreshCredits,
    updateCreditsAfterOperation,
    // Helper function to call after any credit-consuming operation
    notifyCreditConsumption: (creditsConsumed: number) => {
      updateCreditsAfterOperation(creditsConsumed);
      // Optionally refresh from server after a delay to ensure accuracy
      setTimeout(() => {
        refreshCredits();
      }, 1000);
    }
  };
};
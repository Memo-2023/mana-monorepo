import { useEffect, useState } from 'react';
import { parseInsufficientCreditsError } from '../utils/insufficient-credits-handler';
import { useInsufficientCreditsStore } from '../store/insufficientCreditsStore';

interface InsufficientCreditsState {
  isVisible: boolean;
  requiredCredits?: number;
  availableCredits?: number;
  operation?: string;
}

/**
 * Hook that intercepts HTTP 402 errors and manages the insufficient credits modal state
 */
export function useInsufficientCreditsInterceptor() {
  const [modalState, setModalState] = useState<InsufficientCreditsState>({
    isVisible: false
  });
  const setGlobalModalVisible = useInsufficientCreditsStore((state) => state.setModalVisible);

  useEffect(() => {
    // Store the original fetch
    const originalFetch = global.fetch;

    // Override global fetch to intercept responses
    global.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for 402 Payment Required status
        if (response.status === 402) {
          try {
            // Clone response to read body without consuming it
            const clonedResponse = response.clone();
            const errorData = await clonedResponse.json();
            
            console.debug('[InsufficientCreditsInterceptor] 402 error detected:', errorData);
            
            // Parse the error to extract credit information
            const creditInfo = parseInsufficientCreditsError(errorData);
            
            // Show the modal with parsed information
            // Add small delay to ensure this modal shows first
            setTimeout(() => {
              setModalState({
                isVisible: true,
                requiredCredits: creditInfo.requiredCredits,
                availableCredits: creditInfo.availableCredits,
                operation: creditInfo.operation
              });
              setGlobalModalVisible(true);
            }, 100);
          } catch (parseError) {
            console.error('[InsufficientCreditsInterceptor] Error parsing 402 response:', parseError);
            // Show modal with default message if parsing fails
            setTimeout(() => {
              setModalState({ isVisible: true });
              setGlobalModalVisible(true);
            }, 100);
          }
        }
        
        return response;
      } catch (error) {
        // Network errors, etc.
        throw error;
      }
    };

    // Cleanup on unmount
    return () => {
      global.fetch = originalFetch;
    };
  }, []);

  const closeModal = () => {
    setModalState({ isVisible: false });
    setGlobalModalVisible(false);
  };

  return {
    modalVisible: modalState.isVisible,
    requiredCredits: modalState.requiredCredits,
    availableCredits: modalState.availableCredits,
    operation: modalState.operation,
    closeModal
  };
}
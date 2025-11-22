import { useEffect } from 'react';
import { parseInsufficientCreditsError, isInsufficientCreditsError } from '../utils/insufficientCreditsHandler';
import { useInsufficientCreditsStore } from '../stores/insufficientCreditsStore';

/**
 * Hook that intercepts HTTP 402 errors and manages the insufficient credits modal state
 * This should be used at the root level of the app (in _layout.tsx)
 */
export function useInsufficientCreditsInterceptor() {
  const setModalVisible = useInsufficientCreditsStore((state) => state.setModalVisible);

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

            console.log('[InsufficientCreditsInterceptor] 402 error detected:', errorData);

            // Check if it's an insufficient credits error
            if (isInsufficientCreditsError(errorData)) {
              // Parse the error to extract credit information
              const creditInfo = parseInsufficientCreditsError(errorData);

              // Show the modal with parsed information
              setTimeout(() => {
                setModalVisible(true, {
                  requiredCredits: creditInfo.requiredCredits,
                  availableCredits: creditInfo.availableCredits,
                  operation: creditInfo.operation,
                });
              }, 100);
            }
          } catch (parseError) {
            console.error('[InsufficientCreditsInterceptor] Error parsing 402 response:', parseError);
            // Show modal with default message if parsing fails
            setTimeout(() => {
              setModalVisible(true, {});
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
  }, [setModalVisible]);
}

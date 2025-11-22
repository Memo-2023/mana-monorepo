import React from 'react';
import { useInsufficientCreditsInterceptor } from '../../src/hooks/useInsufficientCreditsInterceptor';
import { useInsufficientCreditsStore } from '../../src/stores/insufficientCreditsStore';
import InsufficientCreditsModal from './InsufficientCreditsModal';

/**
 * Global handler for insufficient credits errors.
 * This component should be mounted at the root level of the app.
 * It intercepts 402 errors and displays the insufficient credits modal.
 */
export default function GlobalInsufficientCreditsHandler() {
  // Set up the global fetch interceptor
  useInsufficientCreditsInterceptor();

  // Get modal state from the store
  const { isModalVisible, requiredCredits, availableCredits, operation, closeModal } =
    useInsufficientCreditsStore();

  return (
    <InsufficientCreditsModal
      visible={isModalVisible}
      requiredCredits={requiredCredits || 0}
      availableCredits={availableCredits || 0}
      operationType={operation === 'story_creation' ? 'story' : 'character'}
      onClose={closeModal}
      onGetCredits={() => {
        // TODO: Navigate to credits purchase page
        console.log('Navigate to credits purchase page');
        closeModal();
      }}
    />
  );
}

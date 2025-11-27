/**
 * List Creation Hook
 * Handles list creation with premium validation
 * Separates business logic from store
 */

import { useListStore } from '~/store/listStore';
import usePremiumStore from '~/store/premiumStore';

interface ListCreationResult {
  success: boolean;
  id?: string;
  error?: 'limit_reached' | 'creation_failed';
}

export function useListCreation() {
  const { createList: createListInStore, lists } = useListStore();
  const { isPremium, canCreateCollection, createCollection } = usePremiumStore();

  /**
   * Create list with premium validation
   */
  const createList = (
    name: string,
    description?: string,
    color?: string
  ): ListCreationResult => {
    // Count user-created lists (exclude default ones)
    const userLists = lists.filter(p => !p.isDefault);

    // Free users get:
    // - Default list (📚 Eigene Liste) for free
    // - First user-created list for free (userLists.length === 0)
    // - Additional lists require premium or use weekly quota (1 per week)
    if (!isPremium && userLists.length >= 1) {
      // Check if user can create another collection (using weekly quota)
      if (!canCreateCollection()) {
        return {
          success: false,
          error: 'limit_reached'
        };
      }

      // Track collection creation (only for 2nd+ user-created list)
      createCollection();
    }

    // Create list in store
    const id = createListInStore(name, description, color);

    if (!id) {
      return {
        success: false,
        error: 'creation_failed'
      };
    }

    return {
      success: true,
      id
    };
  };

  /**
   * Check if user can create a list
   */
  const canCreateList = (): boolean => {
    if (isPremium) return true;

    const userLists = lists.filter(p => !p.isDefault);

    // First user-created list is always free
    if (userLists.length === 0) return true;

    // Additional lists require quota
    return canCreateCollection();
  };

  /**
   * Get remaining lists user can create
   */
  const getRemainingLists = (): number => {
    if (isPremium) return Infinity;

    const userLists = lists.filter(p => !p.isDefault);

    // First list is always available
    if (userLists.length === 0) return 1;

    // Check weekly quota
    const remainingCollections = usePremiumStore.getState().getRemainingCollections();
    return Math.max(0, remainingCollections);
  };

  return {
    createList,
    canCreateList,
    getRemainingLists
  };
}

import { create } from 'zustand';

interface InsufficientCreditsStore {
  isModalVisible: boolean;
  requiredCredits?: number;
  availableCredits?: number;
  operation?: string;
  setModalVisible: (
    visible: boolean,
    details?: {
      requiredCredits?: number;
      availableCredits?: number;
      operation?: string;
    }
  ) => void;
  closeModal: () => void;
}

export const useInsufficientCreditsStore = create<InsufficientCreditsStore>((set) => ({
  isModalVisible: false,
  requiredCredits: undefined,
  availableCredits: undefined,
  operation: undefined,
  setModalVisible: (visible, details) =>
    set({
      isModalVisible: visible,
      requiredCredits: details?.requiredCredits,
      availableCredits: details?.availableCredits,
      operation: details?.operation,
    }),
  closeModal: () =>
    set({
      isModalVisible: false,
      requiredCredits: undefined,
      availableCredits: undefined,
      operation: undefined,
    }),
}));

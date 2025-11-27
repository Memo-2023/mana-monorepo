import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RevenueCat from '~/services/RevenueCat';
import { STORAGE_KEYS } from '~/constants/storageKeys';

interface PremiumState {
  // Premium Status
  isPremium: boolean;
  premiumType: 'monthly' | 'yearly' | 'lifetime' | null;
  expiryDate: string | null;
  
  // Daily Limits (for free users)
  dailyFavorites: number;
  dailySearches: number;
  weeklyCollections: number;
  lastResetDate: string;
  
  // Limits Constants
  MAX_DAILY_FAVORITES: number;
  MAX_DAILY_SEARCHES: number;
  MAX_WEEKLY_COLLECTIONS: number;
  
  // Actions
  checkPremiumStatus: () => Promise<void>;
  setPremium: (isPremium: boolean, type?: 'monthly' | 'yearly' | 'lifetime', expiry?: string) => void;
  
  // Limit Management
  canAddFavorite: () => boolean;
  addFavorite: () => boolean;
  canSearch: () => boolean;
  useSearch: () => boolean;
  canCreateCollection: () => boolean;
  createCollection: () => boolean;
  resetDailyLimits: () => void;
  checkAndResetLimits: () => void;
  
  // Helper Functions
  getRemainingFavorites: () => number;
  getRemainingSearches: () => number;
  getRemainingCollections: () => number;
}

const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial State
      isPremium: false,
      premiumType: null,
      expiryDate: null,
      
      // Daily Limits
      dailyFavorites: 0,
      dailySearches: 0,
      weeklyCollections: 0,
      lastResetDate: new Date().toDateString(),
      
      // Limits Constants
      MAX_DAILY_FAVORITES: 3,
      MAX_DAILY_SEARCHES: 3,
      MAX_WEEKLY_COLLECTIONS: 1,
      
      // Check Premium Status from RevenueCat
      checkPremiumStatus: async () => {
        try {
          const isPremium = await RevenueCat.checkPremiumStatus();
          const customerInfo = await RevenueCat.getCustomerInfo();
          
          if (isPremium && customerInfo) {
            // Determine premium type based on active subscriptions
            let premiumType: 'monthly' | 'yearly' | 'lifetime' = 'monthly';
            let expiryDate: string | null = null;
            
            const entitlement = customerInfo.entitlements.active['premium'];
            if (entitlement) {
              // Check if it's lifetime (doesn't expire)
              if (!entitlement.expirationDate) {
                premiumType = 'lifetime';
              } else {
                // Check product identifier for monthly/yearly
                if (entitlement.productIdentifier.includes('yearly')) {
                  premiumType = 'yearly';
                } else {
                  premiumType = 'monthly';
                }
                expiryDate = entitlement.expirationDate;
              }
            }
            
            set({ isPremium, premiumType, expiryDate });
          } else {
            set({ isPremium: false, premiumType: null, expiryDate: null });
          }
        } catch (error) {
          console.error('Error checking premium status:', error);
        }
      },
      
      // Set Premium Status
      setPremium: (isPremium, type, expiry) => {
        set({ isPremium, premiumType: type || null, expiryDate: expiry || null });
      },
      
      // Check and Reset Daily/Weekly Limits
      checkAndResetLimits: () => {
        const state = get();
        const today = new Date().toDateString();
        const lastReset = new Date(state.lastResetDate);
        const todayDate = new Date(today);

        let needsUpdate = false;
        const updates: Partial<PremiumState> = {};

        // Reset daily limits if it's a new day
        if (today !== state.lastResetDate) {
          needsUpdate = true;
          updates.dailyFavorites = 0;
          updates.dailySearches = 0;
          updates.lastResetDate = today;
        }

        // Reset weekly collections if it's been a week
        const daysDiff = Math.floor((todayDate.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
          needsUpdate = true;
          updates.weeklyCollections = 0;
        }

        // Only update state if needed, and schedule it for next tick
        if (needsUpdate) {
          setTimeout(() => set(updates), 0);
        }
      },
      
      // Reset Daily Limits
      resetDailyLimits: () => {
        set({
          dailyFavorites: 0,
          dailySearches: 0,
          lastResetDate: new Date().toDateString(),
        });
      },
      
      // Favorite Management
      canAddFavorite: () => {
        const state = get();
        state.checkAndResetLimits();
        return state.isPremium || state.dailyFavorites < state.MAX_DAILY_FAVORITES;
      },
      
      addFavorite: () => {
        const state = get();
        if (state.isPremium) return true;
        
        state.checkAndResetLimits();
        if (state.dailyFavorites < state.MAX_DAILY_FAVORITES) {
          set({ dailyFavorites: state.dailyFavorites + 1 });
          return true;
        }
        return false;
      },
      
      // Search Management
      canSearch: () => {
        const state = get();
        state.checkAndResetLimits();
        return state.isPremium || state.dailySearches < state.MAX_DAILY_SEARCHES;
      },
      
      useSearch: () => {
        const state = get();
        if (state.isPremium) return true;
        
        state.checkAndResetLimits();
        if (state.dailySearches < state.MAX_DAILY_SEARCHES) {
          set({ dailySearches: state.dailySearches + 1 });
          return true;
        }
        return false;
      },
      
      // Collection Management
      canCreateCollection: () => {
        const state = get();
        state.checkAndResetLimits();
        return state.isPremium || state.weeklyCollections < state.MAX_WEEKLY_COLLECTIONS;
      },
      
      createCollection: () => {
        const state = get();
        if (state.isPremium) return true;
        
        state.checkAndResetLimits();
        if (state.weeklyCollections < state.MAX_WEEKLY_COLLECTIONS) {
          set({ weeklyCollections: state.weeklyCollections + 1 });
          return true;
        }
        return false;
      },
      
      // Helper Functions
      getRemainingFavorites: () => {
        const state = get();
        if (state.isPremium) return -1; // Unlimited
        state.checkAndResetLimits();
        return Math.max(0, state.MAX_DAILY_FAVORITES - state.dailyFavorites);
      },
      
      getRemainingSearches: () => {
        const state = get();
        if (state.isPremium) return -1; // Unlimited
        state.checkAndResetLimits();
        return Math.max(0, state.MAX_DAILY_SEARCHES - state.dailySearches);
      },
      
      getRemainingCollections: () => {
        const state = get();
        if (state.isPremium) return -1; // Unlimited
        state.checkAndResetLimits();
        return Math.max(0, state.MAX_WEEKLY_COLLECTIONS - state.weeklyCollections);
      },
    }),
    {
      name: STORAGE_KEYS.PREMIUM,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        premiumType: state.premiumType,
        expiryDate: state.expiryDate,
        dailyFavorites: state.dailyFavorites,
        dailySearches: state.dailySearches,
        weeklyCollections: state.weeklyCollections,
        lastResetDate: state.lastResetDate,
      }),
    }
  )
);

export default usePremiumStore;
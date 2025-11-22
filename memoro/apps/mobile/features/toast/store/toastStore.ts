import { create } from 'zustand';
import { Toast, ToastState } from '../types';

let toastCounter = 0;

const generateToastId = (): string => {
  toastCounter += 1;
  return `toast_${Date.now()}_${toastCounter}`;
};

// Rate limiting system to prevent toast spam
const lastToastTimes = new Map<string, number>();

// Configurable rate limits by toast type (in milliseconds)
const RATE_LIMITS = {
  'info': 1500,     // 1.5 second cooldown for instruction toasts (like recording hints)
  'error': 1000,    // 1 second for errors
  'success': 800,   // 0.8 second for success messages
  'warning': 1200,  // 1.2 second for warnings
  'loading': 500,   // 0.5 second for loading states
} as const;

// Generate a unique key for rate limiting based on toast content
const generateRateLimitKey = (toast: Omit<Toast, 'id'>): string => {
  return `${toast.type}:${toast.title}`;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    // Rate limiting check (unless bypassed)
    if (!toast.bypassRateLimit) {
      const rateLimitKey = generateRateLimitKey(toast);
      const now = Date.now();
      const lastTime = lastToastTimes.get(rateLimitKey) || 0;
      const cooldown = RATE_LIMITS[toast.type] || 1000; // Default 1 second cooldown
      
      if (now - lastTime < cooldown) {
        console.debug('Toast rate limited, skipping:', { 
          title: toast.title, 
          type: toast.type, 
          timeSinceLastToast: now - lastTime,
          cooldownPeriod: cooldown 
        });
        return ''; // Return empty ID to indicate toast was skipped
      }
      
      // Update last toast time for this type/title combination
      lastToastTimes.set(rateLimitKey, now);
    } else {
      console.debug('Toast bypassing rate limit:', { title: toast.title, type: toast.type });
    }
    
    const id = generateToastId();
    
    // Debugging: Log the incoming toast
    console.debug('Adding toast:', { toast, type: typeof toast });
    
    const newToast: Toast = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      features: toast.features, // Copy features from incoming toast
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : 4000),
      position: toast.position, // Copy position from incoming toast
      action: toast.action,
      onDismiss: toast.onDismiss,
      bypassRateLimit: toast.bypassRateLimit, // Copy bypass flag
      metadata: toast.metadata && typeof toast.metadata === 'object' ? toast.metadata : {},
    };

    console.debug('Created newToast:', newToast);

    set((state) => {
      // If adding the same message, remove existing ones with same title
      const filteredToasts = state.toasts.filter(
        existingToast => existingToast.title !== toast.title
      );
      
      return {
        toasts: [...filteredToasts, newToast]
      };
    });

    // Auto-remove toast after duration (if not persistent)
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((toast) => 
        toast.id === id ? { 
          ...toast, 
          ...updates,
          metadata: { 
            ...(toast.metadata ?? {}), 
            ...(updates.metadata ?? {}) 
          }
        } : toast
      ),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Convenience hooks for common toast types
export const useToastActions = () => {
  const { addToast, removeToast, updateToast } = useToastStore();

  return {
    showToast: addToast,
    hideToast: removeToast,
    updateToast,
    
    showSuccess: (title: string, message?: string, duration = 4000) => 
      addToast({ type: 'success', title, message, duration }),
    
    showError: (title: string, message?: string, duration = 6000) => 
      addToast({ type: 'error', title, message, duration }),
    
    showWarning: (title: string, message?: string, duration = 5000) => 
      addToast({ type: 'warning', title, message, duration }),
    
    showInfo: (title: string, message?: string, duration = 4000) => 
      addToast({ type: 'info', title, message, duration }),
    
    showLoading: (title: string, message?: string) => 
      addToast({ type: 'loading', title, message, duration: 0 }),
      
    clearAllToasts: () => get().clearAll(),
  };
};
/**
 * Toast Store - Svelte 5 Runes Version
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toasts = $state<Toast[]>([]);
let toastId = 0;

export const toastStore = {
  get toasts() {
    return toasts;
  },

  show(message: string, type: ToastType = 'info', duration = 5000): string {
    const id = `toast-${toastId++}`;
    const toast: Toast = { id, message, type, duration };

    toasts = [...toasts, toast];

    if (duration > 0) {
      setTimeout(() => {
        toastStore.dismiss(id);
      }, duration);
    }

    return id;
  },

  dismiss(id: string) {
    toasts = toasts.filter((toast) => toast.id !== id);
  },

  clear() {
    toasts = [];
  },

  success(message: string, duration = 5000) {
    return toastStore.show(message, 'success', duration);
  },

  error(message: string, duration = 5000) {
    return toastStore.show(message, 'error', duration);
  },

  warning(message: string, duration = 5000) {
    return toastStore.show(message, 'warning', duration);
  },

  info(message: string, duration = 5000) {
    return toastStore.show(message, 'info', duration);
  },
};

// Export for backwards compatibility
export function showToast(message: string, type: ToastType = 'info', duration = 5000) {
  return toastStore.show(message, type, duration);
}

export function dismissToast(id: string) {
  toastStore.dismiss(id);
}

export function clearToasts() {
  toastStore.clear();
}

export function getToasts() {
  return toasts;
}

// Re-export for compatibility
export { toasts };

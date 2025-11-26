/**
 * useAuth Hook
 * 
 * A custom React hook that provides authentication functionality
 * and state management for React Native components.
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { tokenManager, TokenState } from '../services/tokenManager';
import { authService } from '../services/authService';

// Extended auth hook with additional utilities
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook for monitoring token state
export function useTokenState() {
  const [tokenState, setTokenState] = useState<TokenState>(tokenManager.getState());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((state) => {
      setTokenState(state);
      setIsRefreshing(state === TokenState.REFRESHING);
    });
    
    return unsubscribe;
  }, []);
  
  return { tokenState, isRefreshing };
}

// Hook for checking B2B status
export function useB2BStatus() {
  const { user } = useAuth();
  const [isB2B, setIsB2B] = useState(false);
  const [b2bInfo, setB2BInfo] = useState(null);
  
  useEffect(() => {
    if (user) {
      const b2bStatus = authService.shouldDisableRevenueCat();
      setIsB2B(b2bStatus);
      
      if (b2bStatus) {
        const info = authService.getB2BInfo();
        setB2BInfo(info);
      }
    }
  }, [user]);
  
  return { isB2B, b2bInfo };
}

// Hook for managing user credits
export function useUserCredits() {
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits || 0);
      } else {
        throw new Error('Failed to fetch credits');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);
  
  const consumeCredits = useCallback(async (amount: number) => {
    try {
      const response = await fetch('/api/auth/credits/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.remainingCredits);
        return { success: true, remaining: data.remainingCredits };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error('Error consuming credits:', err);
      return { success: false, error: err.message };
    }
  }, []);
  
  return {
    credits,
    loading,
    error,
    refetch: fetchCredits,
    consumeCredits,
  };
}

// Hook for device management
export function useDeviceManagement() {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        
        // Identify current device
        const deviceId = await authService.getDeviceId();
        const current = data.devices?.find(d => d.deviceId === deviceId);
        setCurrentDevice(current);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);
  
  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      const response = await fetch(`/api/auth/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchDevices();
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error('Error removing device:', err);
      return { success: false, error: err.message };
    }
  }, [fetchDevices]);
  
  return {
    devices,
    currentDevice,
    loading,
    refetch: fetchDevices,
    removeDevice,
  };
}

// Hook for handling authentication errors
export function useAuthError() {
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((state) => {
      if (state === TokenState.EXPIRED) {
        setAuthError('Your session has expired. Please sign in again.');
      } else {
        setAuthError(null);
      }
    });
    
    return unsubscribe;
  }, []);
  
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);
  
  return { authError, clearError };
}

// Hook for protected API calls with automatic retry
export function useAuthenticatedRequest() {
  const { isAuthenticated } = useAuth();
  
  const makeRequest = useCallback(async (
    url: string,
    options?: RequestInit
  ) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    // The fetch interceptor handles token addition and refresh
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  }, [isAuthenticated]);
  
  return { makeRequest };
}

// Composite hook for complete auth state
export function useAuthState() {
  const auth = useAuth();
  const { tokenState, isRefreshing } = useTokenState();
  const { isB2B, b2bInfo } = useB2BStatus();
  const { credits } = useUserCredits();
  const { devices, currentDevice } = useDeviceManagement();
  const { authError } = useAuthError();
  
  return {
    ...auth,
    tokenState,
    isRefreshing,
    isB2B,
    b2bInfo,
    credits,
    devices,
    currentDevice,
    authError,
  };
}
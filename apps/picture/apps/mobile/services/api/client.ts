/**
 * API Client for Picture Backend
 * Used by Mobile App to communicate with NestJS backend
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3003';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

/**
 * Get auth token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('appToken');
  } catch {
    return null;
  }
}

/**
 * Generic API fetch function
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ data: T | null; error: Error | null }> {
  const { method = 'GET', body, token } = options;

  let authToken = token;
  if (!authToken) {
    authToken = await getAuthToken() || undefined;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: new Error(errorData.message || `API error: ${response.status}`),
      };
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

export { API_BASE };

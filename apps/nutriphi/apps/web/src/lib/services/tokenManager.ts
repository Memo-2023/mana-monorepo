/**
 * Token Manager for Nutriphi Web
 * Handles JWT token lifecycle, refresh logic, and request queueing
 */

import { authService, type UserData } from './authService';
import { browser } from '$app/environment';

export enum TokenState {
  IDLE = 'idle',
  REFRESHING = 'refreshing',
  EXPIRED = 'expired',
  VALID = 'valid'
}

interface QueuedRequest {
  id: string;
  input: RequestInfo | URL;
  init?: RequestInit;
  resolve: (value: Response) => void;
  reject: (reason?: unknown) => void;
  timestamp: number;
}

interface TokenRefreshResult {
  success: boolean;
  token?: string;
  error?: string;
}

type TokenStateObserver = (state: TokenState, token?: string) => void;

const STORAGE_KEYS = {
  APP_TOKEN: 'nutriphi_app_token',
  REFRESH_TOKEN: 'nutriphi_refresh_token',
  USER_EMAIL: 'nutriphi_user_email'
};

class TokenManager {
  private state: TokenState = TokenState.IDLE;
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private observers: Set<TokenStateObserver> = new Set();

  private readonly MAX_QUEUE_SIZE = 50;
  private readonly QUEUE_TIMEOUT_MS = 30000;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private refreshAttempts = 0;
  private lastRefreshTime = 0;
  private readonly REFRESH_COOLDOWN_MS = 5000;

  private static instance: TokenManager;

  private constructor() {
    if (browser) {
      this.checkInitialState();
    }
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  subscribe(observer: TokenStateObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(state: TokenState, token?: string): void {
    this.observers.forEach((observer) => {
      try {
        observer(state, token);
      } catch (error) {
        console.debug('Error in token state observer:', error);
      }
    });
  }

  private setState(newState: TokenState, token?: string): void {
    if (this.state !== newState) {
      this.state = newState;
      this.notifyObservers(newState, token);
    }
  }

  getState(): TokenState {
    return this.state;
  }

  private async checkInitialState(): Promise<void> {
    if (!browser) return;

    try {
      const token = this.getStoredToken();
      if (!token) {
        this.setState(TokenState.EXPIRED);
        return;
      }

      if (authService.isTokenValidLocally(token)) {
        this.setState(TokenState.VALID, token);
      } else {
        this.setState(TokenState.EXPIRED);
      }
    } catch {
      this.setState(TokenState.EXPIRED);
    }
  }

  private getStoredToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem(STORAGE_KEYS.APP_TOKEN);
  }

  private getStoredRefreshToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  private storeTokens(appToken: string, refreshToken: string, email?: string): void {
    if (!browser) return;

    localStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (email) {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    }
  }

  private clearStoredTokens(): void {
    if (!browser) return;

    localStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  }

  async getValidToken(): Promise<string | null> {
    const currentToken = this.getStoredToken();

    if (currentToken && authService.isTokenValidLocally(currentToken)) {
      this.setState(TokenState.VALID, currentToken);
      return currentToken;
    }

    if (!currentToken) {
      this.setState(TokenState.EXPIRED);
      return null;
    }

    const refreshResult = await this.refreshToken();

    if (refreshResult.success && refreshResult.token) {
      return refreshResult.token;
    }
    return null;
  }

  async handle401Response(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (this.state === TokenState.REFRESHING && this.refreshPromise) {
      return this.queueRequest(input, init);
    }

    const refreshResult = await this.refreshToken();

    if (refreshResult.success && refreshResult.token) {
      return this.retryRequestWithToken(input, init, refreshResult.token);
    }
    throw new Error(refreshResult.error || 'Token refresh failed');
  }

  private async queueRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
        reject(new Error('Request queue full'));
        return;
      }

      const queueItem: QueuedRequest = {
        id: Math.random().toString(36).substring(2, 11),
        input,
        init,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.requestQueue.push(queueItem);

      setTimeout(() => {
        this.removeFromQueue(queueItem.id);
        reject(new Error('Queued request timeout'));
      }, this.QUEUE_TIMEOUT_MS);
    });
  }

  private removeFromQueue(requestId: string): void {
    const index = this.requestQueue.findIndex((item) => item.id === requestId);
    if (index !== -1) {
      this.requestQueue.splice(index, 1);
    }
  }

  private async refreshToken(): Promise<TokenRefreshResult> {
    const now = Date.now();
    if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN_MS) {
      return { success: false, error: 'Refresh cooldown active' };
    }

    if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      await this.handleRefreshFailure();
      return { success: false, error: 'Max refresh attempts reached' };
    }

    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.setState(TokenState.REFRESHING);
    this.lastRefreshTime = now;

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;

      if (result.success) {
        this.refreshAttempts = 0;
        this.setState(TokenState.VALID, result.token);
        await this.processQueuedRequests(result.token!);
      } else {
        this.refreshAttempts++;
        this.setState(TokenState.EXPIRED);
        await this.rejectQueuedRequests(result.error || 'Token refresh failed');
      }

      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<TokenRefreshResult> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResult = await authService.refreshTokens(refreshToken);
      const { appToken, refreshToken: newRefreshToken, userData } = refreshResult;

      if (!appToken || !newRefreshToken) {
        throw new Error('Invalid tokens received from refresh');
      }

      this.storeTokens(appToken, newRefreshToken, userData?.email);

      return { success: true, token: appToken };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown refresh error'
      };
    }
  }

  private async handleRefreshFailure(): Promise<void> {
    try {
      this.clearStoredTokens();
      this.setState(TokenState.EXPIRED);
    } catch (error) {
      console.debug('Error in handleRefreshFailure:', error);
    }
  }

  private async processQueuedRequests(token: string): Promise<void> {
    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        const response = await this.retryRequestWithToken(request.input, request.init, token);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  private async rejectQueuedRequests(error: string): Promise<void> {
    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      request.reject(new Error(error));
    }
  }

  private async retryRequestWithToken(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    token: string
  ): Promise<Response> {
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers
    });
  }

  reset(): void {
    this.state = TokenState.IDLE;
    this.refreshPromise = null;
    this.refreshAttempts = 0;
    this.lastRefreshTime = 0;

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      request.reject(new Error('Token manager reset'));
    }
  }

  async clearTokens(): Promise<void> {
    try {
      this.clearStoredTokens();
      this.reset();
    } catch {
      this.reset();
    }
  }
}

export const tokenManager = TokenManager.getInstance();
export default tokenManager;

import { authService } from './authService';

// Token state management
export enum TokenState {
  IDLE = 'idle',
  REFRESHING = 'refreshing',
  EXPIRED = 'expired',
  EXPIRED_OFFLINE = 'expired_offline', // Token expired while offline - preserve auth
  VALID = 'valid',
}

// Request queue item
interface QueuedRequest {
  id: string;
  input: RequestInfo | URL;
  init?: RequestInit;
  resolve: (value: Response) => void;
  reject: (reason?: unknown) => void;
  timestamp: number;
}

// Token refresh result
interface TokenRefreshResult {
  success: boolean;
  token?: string;
  error?: string;
  shouldPreserveAuth?: boolean; // Don't clear auth on offline errors
  shouldRetry?: boolean; // Retry with longer delay
}

// Observer for token state changes
type TokenStateObserver = (state: TokenState, token?: string) => void;

/**
 * Centralized token manager to handle all authentication token operations
 * and eliminate race conditions in token refresh
 */
class TokenManager {
  private state: TokenState = TokenState.IDLE;
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private observers: Set<TokenStateObserver> = new Set();
  
  // Configuration
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly QUEUE_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private refreshAttempts = 0;
  private lastRefreshTime = 0;
  private readonly REFRESH_COOLDOWN_MS = 5000; // 5 second cooldown

  private static instance: TokenManager;

  private constructor() {
    // Start with initial state check
    this.checkInitialState();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Subscribe to token state changes
   */
  subscribe(observer: TokenStateObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Notify all observers of state changes
   */
  private notifyObservers(state: TokenState, token?: string): void {
    this.observers.forEach(observer => {
      try {
        observer(state, token);
      } catch (error) {
        console.debug('Error in token state observer:', error);
      }
    });
  }

  /**
   * Set the current token state
   */
  private setState(newState: TokenState, token?: string): void {
    if (this.state !== newState) {
      console.debug(`TokenManager: State transition ${this.state} -> ${newState}`);
      this.state = newState;
      this.notifyObservers(newState, token);
    }
  }

  /**
   * Get current token state
   */
  getState(): TokenState {
    return this.state;
  }

  /**
   * Check initial token state on startup
   */
  private async checkInitialState(): Promise<void> {
    try {
      const token = await authService.getAppToken();
      if (!token) {
        this.setState(TokenState.EXPIRED);
        return;
      }

      if (authService.isTokenValidLocally(token)) {
        this.setState(TokenState.VALID, token);
      } else {
        this.setState(TokenState.EXPIRED);
      }
    } catch (error) {
      console.debug('Error checking initial token state:', error);
      this.setState(TokenState.EXPIRED);
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    const currentToken = await authService.getAppToken();

    if (currentToken && authService.isTokenValidLocally(currentToken)) {
      this.setState(TokenState.VALID, currentToken);
      return currentToken;
    }

    // If there's no token at all (fresh install), don't attempt refresh
    if (!currentToken) {
      console.debug('TokenManager: No token available, skipping refresh (fresh install)');
      this.setState(TokenState.EXPIRED);
      return null;
    }

    // Token is expired - check network status before attempting refresh
    const { isDeviceConnected } = await import('~/features/errorHandling/utils/networkErrorUtils');
    const isOnline = await isDeviceConnected();

    if (!isOnline) {
      console.debug('TokenManager: Token expired while offline, preserving auth state');
      this.setState(TokenState.EXPIRED_OFFLINE, currentToken);
      return currentToken; // Return expired token for offline use
    }

    // Online and expired - attempt refresh
    console.debug('TokenManager: Current token invalid, attempting refresh...');
    const refreshResult = await this.refreshToken();

    if (refreshResult.success && refreshResult.token) {
      console.debug('TokenManager: Token refresh successful in getValidToken');
      return refreshResult.token;
    } else {
      console.debug('TokenManager: Token refresh failed in getValidToken:', refreshResult.error);

      // Check if failure was due to going offline during refresh
      if (refreshResult.shouldPreserveAuth) {
        this.setState(TokenState.EXPIRED_OFFLINE, currentToken);
        return currentToken;
      }

      return null;
    }
  }

  /**
   * Handle 401 response by either refreshing token or queueing request
   */
  async handle401Response(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Check if we're already refreshing
    if (this.state === TokenState.REFRESHING && this.refreshPromise) {
      return this.queueRequest(input, init);
    }

    // Start token refresh
    const refreshResult = await this.refreshToken();
    
    if (refreshResult.success && refreshResult.token) {
      // Retry the request with new token
      return this.retryRequestWithToken(input, init, refreshResult.token);
    } else {
      // Check if we're offline before throwing error
      if (refreshResult.error === 'offline') {
        console.debug('TokenManager: Offline during 401 handling, throwing network error');
        throw new Error('Network request failed: Device offline');
      }
      // Refresh failed, propagate error
      throw new Error(refreshResult.error || 'Token refresh failed');
    }
  }

  /**
   * Queue a request during token refresh
   */
  private async queueRequest(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
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
        timestamp: Date.now(),
      };

      this.requestQueue.push(queueItem);
      
      // Set timeout for queued request
      setTimeout(() => {
        this.removeFromQueue(queueItem.id);
        reject(new Error('Queued request timeout'));
      }, this.QUEUE_TIMEOUT_MS);

      console.debug(`TokenManager: Queued request ${queueItem.id}, queue size: ${this.requestQueue.length}`);
    });
  }

  /**
   * Remove request from queue by ID
   */
  private removeFromQueue(requestId: string): void {
    const index = this.requestQueue.findIndex(item => item.id === requestId);
    if (index !== -1) {
      this.requestQueue.splice(index, 1);
    }
  }

  /**
   * Refresh the authentication token with progressive backoff retry logic
   */
  private async refreshToken(): Promise<TokenRefreshResult> {
    // Check cooldown to prevent rapid successive refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN_MS) {
      console.debug('TokenManager: Refresh cooldown active, skipping refresh');
      return { success: false, error: 'Refresh cooldown active' };
    }

    // Check max attempts
    if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      console.debug('TokenManager: Max refresh attempts reached');
      await this.handleRefreshFailure();
      return { success: false, error: 'Max refresh attempts reached' };
    }

    // If already refreshing, wait for existing promise
    if (this.refreshPromise) {
      console.debug('TokenManager: Waiting for existing refresh to complete');
      return await this.refreshPromise;
    }

    this.setState(TokenState.REFRESHING);
    this.lastRefreshTime = now;

    // Use enhanced refresh with retry logic
    this.refreshPromise = this.performTokenRefreshWithRetry();
    
    try {
      const result = await this.refreshPromise;
      
      if (result.success) {
        this.refreshAttempts = 0; // Reset on success
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

  /**
   * Enhanced token refresh with progressive backoff for network issues
   */
  private async performTokenRefreshWithRetry(): Promise<TokenRefreshResult> {
    const retryDelays = [0, 1000, 2000, 5000]; // Progressive backoff: 0ms, 1s, 2s, 5s
    let lastError: unknown = null;

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      try {
        // Wait for retry delay (except first attempt)
        if (retryDelays[attempt] > 0) {
          console.debug(`TokenManager: Retrying token refresh in ${retryDelays[attempt]}ms (attempt ${attempt + 1}/${retryDelays.length})`);
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
        }

        const result = await this.performTokenRefresh();
        
        if (result.success) {
          if (attempt > 0) {
            console.debug(`TokenManager: Token refresh succeeded on attempt ${attempt + 1}`);
          }
          return result;
        }

        // Handle specific server-side errors that shouldn't be retried
        if (result.error === 'invalid_token' || 
            result.error === 'token_expired' || 
            result.error === 'invalid_token_state' ||
            result.error === 'token_collision' ||
            result.error?.includes('Device ID has changed')) {
          console.debug('TokenManager: Non-retryable error:', result.error);
          return result; // Don't retry permanent auth errors
        }
        
        // Handle offline state - don't count as failure
        if (result.error === 'offline') {
          console.debug('TokenManager: Device offline, preserving auth state');
          return { success: false, error: 'offline', shouldPreserveAuth: true }; // Return without clearing tokens
        }
        
        // Handle unstable connection - should retry with longer delay
        if (result.error === 'unstable_connection') {
          console.debug('TokenManager: Connection unstable, will retry with longer delay');
          // Use a longer delay for unstable connections
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Continue to next retry attempt
        }

        // Handle refresh_in_progress or rotation_in_progress with shorter delay
        if (result.error === 'refresh_in_progress' || result.error === 'rotation_in_progress') {
          console.debug('TokenManager: Token rotation in progress, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s for other refresh
          // Try one more time after waiting
          const retryResult = await this.performTokenRefresh();
          if (retryResult.success) {
            return retryResult;
          }
        }

        lastError = new Error(result.error || 'Token refresh failed');
        
        // If this is the last attempt, return the error
        if (attempt === retryDelays.length - 1) {
          break;
        }

      } catch (error) {
        lastError = error;
        
        // Check if this is a recoverable network error
        const isRecoverable = this.isRecoverableError(error);
        
        if (!isRecoverable) {
          console.debug('TokenManager: Non-recoverable error, stopping retries:', error);
          break; // Don't retry non-network errors
        }
        
        console.debug(`TokenManager: Network error on attempt ${attempt + 1}, will retry:`, error);
        
        // If this is the last attempt, break out
        if (attempt === retryDelays.length - 1) {
          break;
        }
      }
    }

    // All retries failed
    console.debug('TokenManager: All retry attempts failed');
    return { 
      success: false, 
      error: lastError instanceof Error ? lastError.message : 'All retry attempts failed' 
    };
  }

  /**
   * Perform the actual token refresh operation
   */
  private async performTokenRefresh(): Promise<TokenRefreshResult> {
    try {
      console.debug('TokenManager: Starting token refresh');
      
      // Check network status first - use stable connection check for critical operations
      const { hasStableConnection, isDeviceConnected } = await import('~/features/errorHandling/utils/networkErrorUtils');
      
      // First check basic connectivity
      const isOnline = await isDeviceConnected();
      
      if (!isOnline) {
        console.debug('TokenManager: Device offline, skipping refresh');
        // Preserve current token and mark as offline
        const currentToken = await authService.getAppToken();
        if (currentToken) {
          // Update state to EXPIRED_OFFLINE to preserve auth
          this.setState(TokenState.EXPIRED_OFFLINE, currentToken);
        }
        return { success: false, error: 'offline', shouldPreserveAuth: true };
      }
      
      // For token refresh, ensure we have a stable connection
      const isStable = await hasStableConnection();
      if (!isStable) {
        console.debug('TokenManager: Connection not stable yet, will retry');
        // Return a specific error that indicates we should retry
        return { success: false, error: 'unstable_connection' };
      }
      
      const refreshToken = await authService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResult = await authService.refreshTokens(refreshToken);
      const { appToken, refreshToken: newRefreshToken, userData } = refreshResult;

      if (!appToken || !newRefreshToken) {
        throw new Error('Invalid tokens received from refresh');
      }

      // Note: authService.refreshTokens() already saves tokens to storage
      // No need to call updateTokens() again - this was causing race conditions
      
      // If we have user data from the refresh, notify via the callback
      if (userData && authService.onTokenRefresh) {
        console.debug('TokenManager: Notifying auth context with fresh user data');
        authService.onTokenRefresh(userData);
      }
      
      console.debug('TokenManager: Token refresh successful');
      return { success: true, token: appToken };
      
    } catch (error) {
      console.debug('TokenManager: Token refresh failed:', error);
      
      // Determine if this is a recoverable error
      const isRecoverable = this.isRecoverableError(error);
      
      if (!isRecoverable) {
        await this.handleRefreshFailure();
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown refresh error' 
      };
    }
  }

  /**
   * Retry token refresh after coming back online
   * Call this when network connection is restored
   */
  async retryRefreshIfNeeded(): Promise<boolean> {
    const currentState = this.state;

    if (currentState !== TokenState.EXPIRED_OFFLINE) {
      console.debug('[TokenManager] No offline refresh needed, state:', currentState);
      return false;
    }

    console.debug('[TokenManager] Retrying token refresh after reconnection');

    const { isDeviceConnected } = await import('~/features/errorHandling/utils/networkErrorUtils');
    const isOnline = await isDeviceConnected();

    if (!isOnline) {
      console.debug('[TokenManager] Still offline, cannot refresh');
      return false;
    }

    const refreshResult = await this.refreshToken();

    if (refreshResult.success && refreshResult.token) {
      console.debug('[TokenManager] Token refresh successful after reconnection');
      return true;
    } else {
      console.warn('[TokenManager] Token refresh failed after reconnection:', refreshResult.error);
      return false;
    }
  }

  /**
   * Check if an error is recoverable (network issues vs auth failures)
   */
  private isRecoverableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const networkErrors = [
      'network', 'Network', 'fetch', 'connection', 'timeout',
      'Failed to fetch', 'NetworkError', 'TypeError', 'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED', 'ECONNREFUSED', 'ENOTFOUND',
      'ETIMEDOUT', 'Unable to resolve host', 'Request failed'
    ];
    
    const authErrors = [
      '401', '403', 'Unauthorized', 'Forbidden', 'Invalid token', 
      'Token expired', 'jwt expired', 'jwt malformed'
    ];
    
    const errorString = `${error.message} ${error.name}`.toLowerCase();
    
    const isNetworkError = networkErrors.some(keyword => 
      errorString.includes(keyword.toLowerCase())
    );
    
    const isAuthError = authErrors.some(keyword => 
      errorString.includes(keyword.toLowerCase())
    );
    
    // Network errors are recoverable unless they also contain auth errors
    return isNetworkError && !isAuthError;
  }

  /**
   * Handle permanent refresh failure
   */
  private async handleRefreshFailure(): Promise<void> {
    console.debug('TokenManager: Handling permanent refresh failure');
    
    try {
      await authService.clearAuthStorage();
      this.setState(TokenState.EXPIRED);
      
      // Don't automatically redirect here - let the AuthContext handle logout
      // The AuthContext will handle the logout flow properly
    } catch (error) {
      console.debug('Error in handleRefreshFailure:', error);
    }
  }

  /**
   * Check if we should attempt token refresh (has valid refresh token)
   */
  async canAttemptRefresh(): Promise<boolean> {
    try {
      const refreshToken = await authService.getRefreshToken();
      return !!refreshToken;
    } catch (error) {
      console.debug('Error checking refresh token availability:', error);
      return false;
    }
  }

  /**
   * Process all queued requests with the new token
   */
  private async processQueuedRequests(token: string): Promise<void> {
    console.debug(`TokenManager: Processing ${this.requestQueue.length} queued requests`);
    
    const requests = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of requests) {
      try {
        const response = await this.retryRequestWithToken(
          request.input, 
          request.init, 
          token
        );
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Reject all queued requests with error
   */
  private async rejectQueuedRequests(error: string): Promise<void> {
    console.debug(`TokenManager: Rejecting ${this.requestQueue.length} queued requests`);
    
    const requests = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of requests) {
      request.reject(new Error(error));
    }
  }

  /**
   * Retry a request with a new token
   */
  private async retryRequestWithToken(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    token: string
  ): Promise<Response> {
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    
    return fetch(input, {
      ...init,
      headers,
    });
  }

  /**
   * Reset the token manager state (for testing or logout)
   */
  reset(): void {
    this.state = TokenState.IDLE;
    this.refreshPromise = null;
    this.refreshAttempts = 0;
    this.lastRefreshTime = 0;
    
    // Reject all queued requests
    const requests = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of requests) {
      request.reject(new Error('Token manager reset'));
    }
    
    console.debug('TokenManager: Reset completed');
  }

  /**
   * Clear tokens and reset state (for logout)
   */
  async clearTokens(): Promise<void> {
    try {
      await authService.clearAuthStorage();
      // Skip EXPIRED state transition during logout to prevent observer loops
      // Go directly to reset which sets IDLE state
      this.reset();
    } catch (error) {
      console.debug('Error clearing tokens:', error);
      // On error, still reset to ensure clean state
      this.reset();
    }
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): { size: number; state: TokenState; refreshAttempts: number } {
    return {
      size: this.requestQueue.length,
      state: this.state,
      refreshAttempts: this.refreshAttempts,
    };
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;
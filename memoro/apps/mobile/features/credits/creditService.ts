
/**
 * Service for handling credit operations from the frontend
 */

export interface CreditCheckResponse {
  hasEnoughCredits: boolean;
  currentCredits: number;
  requiredCredits: number;
  creditType: 'user' | 'space';
  durationMinutes?: number;
  estimatedCostPerHour?: number;
}

export interface CreditConsumptionResponse {
  success: boolean;
  message: string;
  creditsConsumed: number;
  creditType: 'user' | 'space';
  durationMinutes?: number;
}

export interface OperationCreditResponse {
  success: boolean;
  message: string;
  creditsConsumed: number;
  creditType: 'user' | 'space';
  operation: string;
}

export interface PricingResponse {
  operationCosts: {
    TRANSCRIPTION_PER_HOUR: number;
    HEADLINE_GENERATION: number;
    MEMORY_CREATION: number;
    BLUEPRINT_PROCESSING: number;
    QUESTION_MEMO: number;
    NEW_MEMORY: number;
    MEMO_COMBINE: number;
    MEMO_SHARING: number;
    SPACE_OPERATION: number;
  };
  transcriptionPerHour: number;
  lastUpdated: string;
}

class CreditService {
  private readonly memoroServiceUrl: string;
  private readonly manaServiceUrl: string;
  private creditUpdateCallbacks: ((creditsConsumed: number) => void)[] = [];
  private cachedPricing: PricingResponse | null = null;
  private pricingLastFetched: number = 0;
  private readonly PRICING_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Use memoro service URL for all endpoints (including auth proxy)
    this.memoroServiceUrl =
      process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001';
    this.memoroServiceUrl = this.memoroServiceUrl.replace(/\/$/, '');

    // manaServiceUrl now points to memoro service (auth proxy handles routing)
    this.manaServiceUrl = this.memoroServiceUrl;
  }

  /**
   * Initialize the credit service by preloading pricing
   * Call this during app startup
   */
  async initialize(): Promise<void> {
    try {
      await this.getPricing();
      console.log('CreditService initialized with backend pricing');
    } catch (error) {
      console.warn('CreditService initialization failed, using fallback pricing:', error);
    }
  }

  /**
   * Register a callback to be notified when credits are consumed
   */
  onCreditUpdate(callback: (creditsConsumed: number) => void) {
    this.creditUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.creditUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.creditUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered callbacks about credit consumption
   */
  private notifyCreditUpdate(creditsConsumed: number) {
    this.creditUpdateCallbacks.forEach((callback) => {
      try {
        callback(creditsConsumed);
      } catch (error) {
        console.error('Error in credit update callback:', error);
      }
    });
  }

  /**
   * Public method to manually trigger credit update notifications
   * Use this when credits are consumed outside of the creditService methods
   */
  triggerCreditUpdate(creditsConsumed: number) {
    this.notifyCreditUpdate(creditsConsumed);
  }

  /**
   * Fetch pricing information from backend with caching
   */
  async getPricing(): Promise<PricingResponse> {
    const now = Date.now();

    // Return cached pricing if still valid
    if (this.cachedPricing && now - this.pricingLastFetched < this.PRICING_CACHE_DURATION) {
      return this.cachedPricing;
    }

    try {
      const response = await fetch(`${this.memoroServiceUrl}/memoro/credits/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const pricing = await response.json();
      this.cachedPricing = pricing;
      this.pricingLastFetched = now;

      return pricing;
    } catch (error) {
      console.error('Error fetching pricing:', error);

      // Fallback to hardcoded pricing if backend fails
      if (this.cachedPricing) {
        return this.cachedPricing;
      }

      // Ultimate fallback
      return {
        operationCosts: {
          TRANSCRIPTION_PER_HOUR: 120,
          HEADLINE_GENERATION: 10,
          MEMORY_CREATION: 10,
          BLUEPRINT_PROCESSING: 5,
          QUESTION_MEMO: 5,
          NEW_MEMORY: 5,
          MEMO_COMBINE: 5,
          MEMO_SHARING: 1,
          SPACE_OPERATION: 2,
        },
        transcriptionPerHour: 120,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get user credits directly from mana-core-middleware
   */
  async getUserCredits(): Promise<{ credits: number } | null> {
    try {
      console.log('[CreditService] Fetching user credits from:', `${this.manaServiceUrl}/auth/credits`);
      const { tokenManager } = await import('~/features/auth/services/tokenManager');
      const appToken = await tokenManager.getValidToken();
      if (!appToken) {
        console.error('[CreditService] No authentication token available for credits fetch');
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.manaServiceUrl}/auth/credits`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${appToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[CreditService] Credits response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CreditService] Credits fetch error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CreditService] Credits data received:', data);
      
      // Handle wrapped response structure from backend
      if (data.data && typeof data.data.credits === 'number') {
        return { credits: data.data.credits };
      }
      
      // Fallback to direct structure if already in correct format
      return data;
    } catch (error) {
      console.error('[CreditService] Error fetching user credits:', error);
      return null;
    }
  }

  /**
   * Get estimated cost for operations using backend pricing
   */
  async getOperationCost(
    operation:
      | 'HEADLINE_GENERATION'
      | 'MEMORY_CREATION'
      | 'BLUEPRINT_PROCESSING'
      | 'MEMO_SHARING'
      | 'SPACE_OPERATION'
      | 'QUESTION_MEMO'
      | 'NEW_MEMORY'
      | 'MEMO_COMBINE'
  ): Promise<number> {
    try {
      const pricing = await this.getPricing();
      return pricing.operationCosts[operation];
    } catch (error) {
      console.error('Error getting operation cost:', error);
      // Fallback to hardcoded costs
      const fallbackCosts = {
        HEADLINE_GENERATION: 10,
        MEMORY_CREATION: 10,
        BLUEPRINT_PROCESSING: 5,
        MEMO_SHARING: 1,
        SPACE_OPERATION: 2,
        QUESTION_MEMO: 5,
        NEW_MEMORY: 5,
        MEMO_COMBINE: 5,
      };
      return fallbackCosts[operation];
    }
  }

  /**
   * Calculate cost for memo combination based on number of memos
   */
  async calculateMemoCombineCost(memoCount: number): Promise<number> {
    const costPerMemo = await this.getOperationCost('MEMO_COMBINE');
    return memoCount * costPerMemo;
  }

  /**
   * Synchronous versions for immediate UI display (uses cached values)
   */
  getOperationCostSync(
    operation:
      | 'HEADLINE_GENERATION'
      | 'MEMORY_CREATION'
      | 'BLUEPRINT_PROCESSING'
      | 'MEMO_SHARING'
      | 'SPACE_OPERATION'
      | 'QUESTION_MEMO'
      | 'NEW_MEMORY'
      | 'MEMO_COMBINE'
  ): number {
    if (this.cachedPricing) {
      return this.cachedPricing.operationCosts[operation];
    }

    // Fallback to hardcoded costs if no cache
    const fallbackCosts = {
      HEADLINE_GENERATION: 10,
      MEMORY_CREATION: 10,
      BLUEPRINT_PROCESSING: 5,
      MEMO_SHARING: 1,
      SPACE_OPERATION: 2,
      QUESTION_MEMO: 5,
      NEW_MEMORY: 5,
      MEMO_COMBINE: 5,
    };
    return fallbackCosts[operation];
  }

  calculateMemoCombineCostSync(memoCount: number): number {
    return memoCount * this.getOperationCostSync('MEMO_COMBINE');
  }

  /**
   * Retry transcription for a failed memo using the reprocess-memo endpoint
   */
  async retryTranscription(memoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { tokenManager } = await import('~/features/auth/services/tokenManager');
      const appToken = await tokenManager.getValidToken();
      if (!appToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.memoroServiceUrl}/memoro/reprocess-memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          memoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: result.message || 'Memo reprocessing started successfully',
      };
    } catch (error) {
      console.error('Error reprocessing memo:', error);
      throw error;
    }
  }

  /**
   * Retry headline generation for a failed memo
   */
  async retryHeadline(memoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { tokenManager } = await import('~/features/auth/services/tokenManager');
      const appToken = await tokenManager.getValidToken();
      if (!appToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.memoroServiceUrl}/memoro/retry-headline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify({
          memoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: result.message || 'Headline generation retry initiated successfully',
      };
    } catch (error) {
      console.error('Error retrying headline generation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const creditService = new CreditService();

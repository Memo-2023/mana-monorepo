/**
 * Usage and cost tracking types
 */

/**
 * Usage data for displaying user's mana consumption
 */
export interface UsageData {
  /** Total mana consumed all time */
  total: number;
  /** Mana consumed last week */
  lastWeek: number;
  /** Mana consumed last month */
  lastMonth: number;
  /** Current mana balance */
  currentMana: number;
  /** Maximum mana capacity */
  maxMana: number;
  /** Usage history */
  history?: UsageHistoryEntry[];
}

/**
 * Single usage history entry
 */
export interface UsageHistoryEntry {
  /** Date of usage (ISO string) */
  date: string;
  /** Amount consumed */
  amount: number;
  /** Action type (optional) */
  action?: string;
}

/**
 * Cost item for displaying operation costs
 */
export interface CostItem {
  /** Action description */
  action: string;
  /** Translation key for action */
  actionKey?: string;
  /** Mana cost */
  cost: number;
  /** Icon name */
  icon: string;
}

/**
 * User's credit/mana balance
 */
export interface ManaBalance {
  /** Current mana amount */
  current: number;
  /** Maximum capacity */
  max: number;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  /** Transaction ID */
  id: string;
  /** User ID */
  userId: string;
  /** Amount (positive = credit, negative = debit) */
  amount: number;
  /** Transaction type */
  type: 'purchase' | 'subscription' | 'usage' | 'gift' | 'refund' | 'bonus';
  /** Description */
  description: string;
  /** Timestamp */
  createdAt: string;
  /** Related operation ID (if applicable) */
  operationId?: string;
}

/**
 * Pricing information for operations
 */
export interface OperationPricing {
  /** Operation key */
  operation: string;
  /** Base cost in mana */
  baseCost: number;
  /** Per-unit cost (e.g., per minute, per token) */
  perUnitCost?: number;
  /** Unit type */
  unitType?: 'minute' | 'token' | 'request';
}

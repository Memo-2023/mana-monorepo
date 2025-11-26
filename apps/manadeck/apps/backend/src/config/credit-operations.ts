/**
 * Credit Operation Types and Costs for Manadeck
 *
 * Define all billable operations and their credit costs here.
 * This ensures consistent pricing across the application.
 */

export enum CreditOperationType {
  DECK_CREATION = 'deck_creation',
  CARD_CREATION = 'card_creation',
  AI_CARD_GENERATION = 'ai_card_generation',
  AI_DECK_GENERATION = 'ai_deck_generation',
  DECK_EXPORT = 'deck_export',
  // Add more operation types as needed
}

/**
 * Credit costs for each operation type
 */
export const CREDIT_COSTS: Record<CreditOperationType, number> = {
  [CreditOperationType.DECK_CREATION]: 10,       // 10 mana to create a deck
  [CreditOperationType.CARD_CREATION]: 2,        // 2 mana to create a card
  [CreditOperationType.AI_CARD_GENERATION]: 5,   // 5 mana for AI-generated card
  [CreditOperationType.AI_DECK_GENERATION]: 30,  // 30 mana for AI-generated deck
  [CreditOperationType.DECK_EXPORT]: 3,          // 3 mana to export deck
};

/**
 * Operation descriptions for user-facing messages
 */
export const OPERATION_DESCRIPTIONS: Record<CreditOperationType, string> = {
  [CreditOperationType.DECK_CREATION]: 'Create a new deck',
  [CreditOperationType.CARD_CREATION]: 'Add a card to your deck',
  [CreditOperationType.AI_CARD_GENERATION]: 'Generate card with AI',
  [CreditOperationType.AI_DECK_GENERATION]: 'Generate deck with AI',
  [CreditOperationType.DECK_EXPORT]: 'Export deck',
};

/**
 * Get credit cost for an operation
 */
export function getCreditCost(operationType: CreditOperationType): number {
  return CREDIT_COSTS[operationType] || 0;
}

/**
 * Get operation description
 */
export function getOperationDescription(operationType: CreditOperationType): string {
  return OPERATION_DESCRIPTIONS[operationType] || operationType;
}

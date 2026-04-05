/**
 * Trigger system — barrel exports.
 */

export { register, unregister, unregisterAll, fire, getRegisteredTriggers } from './registry';
export type { RegisteredTrigger } from './registry';
export { evaluateCondition } from './conditions';
export type { ConditionOp } from './conditions';
export { ACTIONS, getAction } from './actions';
export { loadAutomations } from './loader';
export { generateSuggestions } from './suggestions';
export type { AutomationSuggestion } from './suggestions';
export { checkInlineSuggestion, dismissSuggestion, isSuggestionDismissed } from './inline-suggest';

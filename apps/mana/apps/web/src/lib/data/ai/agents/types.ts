/**
 * Webapp-local re-export of Agent types from @mana/shared-ai, plus
 * storage-layer constants.
 *
 * Keeps module code from importing directly from the shared package,
 * so a future rename of the shared path only touches this file.
 */

export type { Agent, AgentState } from '@mana/shared-ai';
export { DEFAULT_AGENT_ID, DEFAULT_AGENT_NAME } from '@mana/shared-ai';

export const AGENTS_TABLE = 'agents';

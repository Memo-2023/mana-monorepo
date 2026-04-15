/**
 * Module config for AI Workbench tables that participate in sync.
 *
 * Sync surface:
 *   - `aiMissions` — long-lived user-authored AI work items (cross-device)
 *   - `agents`     — named AI personas that own Missions (cross-device).
 *                    See docs/plans/multi-agent-workbench.md.
 *
 * NOT in this config:
 *   - `pendingProposals` — intentionally local-only (see proposals/types.ts).
 *     Approvals run the underlying tool which writes through its own module's
 *     sync path, so proposals don't need to travel.
 */

import type { ModuleConfig } from '$lib/data/module-registry';

export const aiModuleConfig: ModuleConfig = {
	appId: 'ai',
	tables: [{ name: 'aiMissions' }, { name: 'agents' }],
};

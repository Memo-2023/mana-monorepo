/**
 * Webapp-local re-export of Mission types from @mana/shared-ai plus
 * storage-layer concerns (Dexie table name, proposal-status bridge).
 *
 * The runtime types themselves live in the shared package so the
 * mana-ai Bun service parses identical rows.
 */

import type { ProposalStatus } from '../proposals/types';
import type { PlanStep } from '@mana/shared-ai';

export type {
	Mission,
	MissionCadence,
	MissionInputRef,
	MissionIteration,
	MissionState,
	MissionGrant,
	GrantDerivation,
	PlanStep,
} from '@mana/shared-ai';

export const MISSIONS_TABLE = 'aiMissions';

/** Helper — derive a summary status for a proposal-id lookup. */
export function planStepStatusFromProposal(status: ProposalStatus): PlanStep['status'] {
	switch (status) {
		case 'pending':
			return 'staged';
		case 'approved':
			return 'approved';
		case 'rejected':
			return 'rejected';
		case 'expired':
			return 'skipped';
	}
}

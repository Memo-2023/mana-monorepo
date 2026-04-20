/**
 * Webapp-local re-export of Mission types from @mana/shared-ai plus
 * storage-layer concerns (Dexie table name).
 *
 * The runtime types themselves live in the shared package so the
 * mana-ai Bun service parses identical rows.
 */

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

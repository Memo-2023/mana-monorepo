/**
 * Actor attribution type — the discriminated union stamped on every
 * event, record, and sync-change row in the Mana system.
 *
 * Runtime helpers (runAs, runAsAsync, ambient context) stay in the webapp
 * because they rely on browser single-threaded semantics and module-level
 * mutable state. The *type* is shared so server-side consumers can parse
 * incoming actors without re-declaring the union.
 */

export type Actor =
	| { readonly kind: 'user' }
	| {
			readonly kind: 'ai';
			readonly missionId: string;
			readonly iterationId: string;
			readonly rationale: string;
	  }
	| {
			readonly kind: 'system';
			readonly source: 'projection' | 'rule' | 'migration';
	  };

export const USER_ACTOR: Actor = Object.freeze({ kind: 'user' });

export function isAiActor(actor: Actor | undefined): boolean {
	return actor?.kind === 'ai';
}

export function isSystemActor(actor: Actor | undefined): boolean {
	return actor?.kind === 'system';
}

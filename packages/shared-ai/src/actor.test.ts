import { describe, it, expect } from 'vitest';
import {
	makeUserActor,
	makeAgentActor,
	makeSystemActor,
	normalizeActor,
	isUserActor,
	isAiActor,
	isSystemActor,
	isFromMissionRunner,
	SYSTEM_PROJECTION,
	SYSTEM_MISSION_RUNNER,
	LEGACY_USER_PRINCIPAL,
	LEGACY_DISPLAY_NAME,
	USER_ACTOR,
} from './actor';

describe('factories', () => {
	it('makeUserActor carries userId + displayName', () => {
		const a = makeUserActor('user-1', 'Till');
		expect(a.kind).toBe('user');
		expect(a.principalId).toBe('user-1');
		expect(a.displayName).toBe('Till');
	});

	it('makeUserActor default displayName is "Du"', () => {
		expect(makeUserActor('u').displayName).toBe('Du');
	});

	it('makeAgentActor carries mission context', () => {
		const a = makeAgentActor({
			agentId: 'agent-1',
			displayName: 'Cashflow Watcher',
			missionId: 'm1',
			iterationId: 'it1',
			rationale: 'weekly review',
		});
		expect(a.kind).toBe('ai');
		expect(a.principalId).toBe('agent-1');
		expect(a.displayName).toBe('Cashflow Watcher');
		expect(a.missionId).toBe('m1');
		expect(a.iterationId).toBe('it1');
		expect(a.rationale).toBe('weekly review');
	});

	it('makeSystemActor picks a default displayName per source', () => {
		expect(makeSystemActor(SYSTEM_PROJECTION).displayName).toBe('Projektion');
		expect(makeSystemActor(SYSTEM_MISSION_RUNNER).displayName).toBe('Mission-Runner');
	});

	it('makeSystemActor accepts a displayName override', () => {
		expect(makeSystemActor(SYSTEM_PROJECTION, 'Streak-Tracker').displayName).toBe('Streak-Tracker');
	});
});

describe('predicates', () => {
	const u = makeUserActor('u');
	const a = makeAgentActor({
		agentId: 'a1',
		displayName: 'x',
		missionId: 'm',
		iterationId: 'i',
		rationale: 'r',
	});
	const s = makeSystemActor(SYSTEM_PROJECTION);
	const mr = makeSystemActor(SYSTEM_MISSION_RUNNER);

	it('identifies kinds', () => {
		expect(isUserActor(u)).toBe(true);
		expect(isUserActor(a)).toBe(false);
		expect(isAiActor(a)).toBe(true);
		expect(isSystemActor(s)).toBe(true);
	});

	it('isFromMissionRunner only fires for mission-runner principalId', () => {
		expect(isFromMissionRunner(mr)).toBe(true);
		expect(isFromMissionRunner(s)).toBe(false);
	});

	it('predicates handle undefined', () => {
		expect(isUserActor(undefined)).toBe(false);
		expect(isAiActor(undefined)).toBe(false);
		expect(isSystemActor(undefined)).toBe(false);
	});
});

describe('normalizeActor', () => {
	it('passes modern actors through unchanged', () => {
		const a = makeUserActor('u', 'Till');
		expect(normalizeActor(a)).toBe(a);
	});

	it('fills in principalId+displayName for legacy {kind:"user"} events', () => {
		const legacy = { kind: 'user' };
		const n = normalizeActor(legacy);
		expect(n.kind).toBe('user');
		expect(n.principalId).toBe(LEGACY_USER_PRINCIPAL);
		expect(n.displayName).toBe('Du');
	});

	it('fills in AI fields for legacy {kind:"ai", missionId, ...} without identity', () => {
		const legacy = { kind: 'ai', missionId: 'm1', iterationId: 'i1', rationale: 'r' };
		const n = normalizeActor(legacy);
		expect(n.kind).toBe('ai');
		expect(n.principalId).toBe('legacy:ai-default');
		expect(n.displayName).toBe(LEGACY_DISPLAY_NAME);
		if (n.kind !== 'ai') throw new Error('narrowed to ai');
		expect(n.missionId).toBe('m1');
	});

	it('maps old system.source field into new system:<source> principalId', () => {
		const legacy = { kind: 'system', source: 'projection' };
		const n = normalizeActor(legacy);
		expect(n.kind).toBe('system');
		expect(n.principalId).toBe('system:projection');
		expect(n.displayName).toBe('Projektion');
	});

	it('handles completely garbage input', () => {
		expect(normalizeActor(null).kind).toBe('user');
		expect(normalizeActor('hello').kind).toBe('user');
		expect(normalizeActor(undefined).principalId).toBe(LEGACY_USER_PRINCIPAL);
		expect(normalizeActor({ kind: 'alien' }).kind).toBe('user');
	});
});

describe('USER_ACTOR legacy export', () => {
	it('uses legacy principal + "Du" display', () => {
		expect(USER_ACTOR.kind).toBe('user');
		expect(USER_ACTOR.principalId).toBe(LEGACY_USER_PRINCIPAL);
		expect(USER_ACTOR.displayName).toBe('Du');
	});
});

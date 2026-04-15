import { describe, it, expect } from 'vitest';
import {
	GRANT_DERIVATION_VERSION,
	canonicalInfoString,
	deriveMissionDataKeyRaw,
	type GrantDerivation,
} from './grant';

const fixedMasterKey = new Uint8Array(32).map((_, i) => i + 1); // 01..20

function derivation(overrides: Partial<GrantDerivation> = {}): GrantDerivation {
	return {
		version: GRANT_DERIVATION_VERSION,
		missionId: 'mission-abc',
		tables: ['notes', 'tasks'],
		recordIds: ['notes:n1', 'tasks:t1'],
		...overrides,
	};
}

describe('canonicalInfoString', () => {
	it('is order-independent in tables and recordIds', () => {
		const a = canonicalInfoString(derivation({ tables: ['notes', 'tasks'] }));
		const b = canonicalInfoString(derivation({ tables: ['tasks', 'notes'] }));
		expect(a).toBe(b);

		const c = canonicalInfoString(derivation({ recordIds: ['notes:n1', 'tasks:t1'] }));
		const d = canonicalInfoString(derivation({ recordIds: ['tasks:t1', 'notes:n1'] }));
		expect(c).toBe(d);
	});

	it('pins the exact string format', () => {
		expect(canonicalInfoString(derivation())).toBe(
			'mana-ai-mission-grant:v1:tables=notes,tasks:ids=notes:n1,tasks:t1'
		);
	});
});

describe('deriveMissionDataKeyRaw', () => {
	it('returns 32 bytes', async () => {
		const mdk = await deriveMissionDataKeyRaw(fixedMasterKey, derivation());
		expect(mdk.length).toBe(32);
	});

	it('is deterministic for the same inputs', async () => {
		const a = await deriveMissionDataKeyRaw(fixedMasterKey, derivation());
		const b = await deriveMissionDataKeyRaw(fixedMasterKey, derivation());
		expect(Array.from(a)).toEqual(Array.from(b));
	});

	it('differs when the mission id changes', async () => {
		const a = await deriveMissionDataKeyRaw(fixedMasterKey, derivation({ missionId: 'm1' }));
		const b = await deriveMissionDataKeyRaw(fixedMasterKey, derivation({ missionId: 'm2' }));
		expect(Array.from(a)).not.toEqual(Array.from(b));
	});

	it('differs when the scope changes', async () => {
		const a = await deriveMissionDataKeyRaw(fixedMasterKey, derivation({ tables: ['notes'] }));
		const b = await deriveMissionDataKeyRaw(
			fixedMasterKey,
			derivation({ tables: ['notes', 'tasks'] })
		);
		expect(Array.from(a)).not.toEqual(Array.from(b));

		const c = await deriveMissionDataKeyRaw(
			fixedMasterKey,
			derivation({ recordIds: ['notes:n1'] })
		);
		const d = await deriveMissionDataKeyRaw(
			fixedMasterKey,
			derivation({ recordIds: ['notes:n1', 'notes:n2'] })
		);
		expect(Array.from(c)).not.toEqual(Array.from(d));
	});

	it('is order-independent in scope', async () => {
		const a = await deriveMissionDataKeyRaw(
			fixedMasterKey,
			derivation({ tables: ['notes', 'tasks'] })
		);
		const b = await deriveMissionDataKeyRaw(
			fixedMasterKey,
			derivation({ tables: ['tasks', 'notes'] })
		);
		expect(Array.from(a)).toEqual(Array.from(b));
	});

	it('rejects unsupported derivation versions', async () => {
		await expect(
			deriveMissionDataKeyRaw(fixedMasterKey, derivation({ version: 'v0' as never }))
		).rejects.toThrow(/unsupported derivation version/);
	});

	it('rejects wrong-length master keys', async () => {
		await expect(deriveMissionDataKeyRaw(new Uint8Array(16), derivation())).rejects.toThrow(
			/expected 32-byte master key/
		);
	});

	it('is stable across runs (golden)', async () => {
		// If this test ever needs updating, the derivation policy has
		// changed — bump GRANT_DERIVATION_VERSION and keep the old
		// branch available for in-flight grants.
		const mdk = await deriveMissionDataKeyRaw(fixedMasterKey, derivation());
		const hex = Array.from(mdk)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		// Golden — recorded from the Web Crypto reference implementation
		// on first green run. If this string changes, the key-derivation
		// policy has changed in a non-backwards-compatible way.
		expect(hex).toMatchInlineSnapshot(
			`"7538df66c51d3ddb667c0135feb4ac7c2800ba372babc7e61e9423d6a9a65628"`
		);
	});
});

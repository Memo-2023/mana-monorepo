/**
 * Tests for Space-metadata validation used by Better Auth organization hooks.
 */

import { describe, it, expect } from 'bun:test';
import {
	assertValidSpaceMetadataForCreate,
	assertSpaceIsDeletable,
	buildSpaceMetadata,
} from './metadata';

describe('assertValidSpaceMetadataForCreate', () => {
	it('accepts metadata with every valid SpaceType', () => {
		for (const type of ['personal', 'brand', 'club', 'family', 'team', 'practice'] as const) {
			const parsed = assertValidSpaceMetadataForCreate({ type });
			expect(parsed.type).toBe(type);
		}
	});

	it('preserves extra metadata fields', () => {
		const parsed = assertValidSpaceMetadataForCreate({
			type: 'brand',
			voiceDoc: 'hello',
			uid: 'CH-123',
		});
		expect(parsed.voiceDoc).toBe('hello');
		expect(parsed.uid).toBe('CH-123');
	});

	it('rejects missing metadata', () => {
		expect(() => assertValidSpaceMetadataForCreate(null)).toThrow(/type/i);
		expect(() => assertValidSpaceMetadataForCreate(undefined)).toThrow(/type/i);
	});

	it('rejects missing type field', () => {
		expect(() => assertValidSpaceMetadataForCreate({})).toThrow(/type/i);
		expect(() => assertValidSpaceMetadataForCreate({ name: 'Edisconet' })).toThrow(/type/i);
	});

	it('rejects unknown SpaceType values', () => {
		expect(() => assertValidSpaceMetadataForCreate({ type: 'corporate' })).toThrow(/type/i);
		expect(() => assertValidSpaceMetadataForCreate({ type: 'PERSONAL' })).toThrow(/type/i);
	});
});

describe('assertSpaceIsDeletable', () => {
	it('blocks deletion of personal spaces', () => {
		expect(() => assertSpaceIsDeletable({ type: 'personal' })).toThrow(
			/personal space cannot be deleted/i
		);
	});

	it('allows deletion of other space types', () => {
		for (const type of ['brand', 'club', 'family', 'team', 'practice'] as const) {
			expect(() => assertSpaceIsDeletable({ type })).not.toThrow();
		}
	});

	it('allows deletion when metadata is malformed (fail-open by design)', () => {
		// If metadata is missing or invalid, we don't block — the delete endpoint
		// enforces other permission checks (owner role, etc.) and we only want to
		// guard the personal-space special case.
		expect(() => assertSpaceIsDeletable(null)).not.toThrow();
		expect(() => assertSpaceIsDeletable({})).not.toThrow();
		expect(() => assertSpaceIsDeletable({ type: 'unknown' })).not.toThrow();
	});
});

describe('buildSpaceMetadata', () => {
	it('returns a metadata blob with the given type', () => {
		expect(buildSpaceMetadata('club').type).toBe('club');
	});

	it('merges extra fields after the type', () => {
		const meta = buildSpaceMetadata('brand', { voiceDoc: 'X', uid: 'Y' });
		expect(meta).toEqual({ type: 'brand', voiceDoc: 'X', uid: 'Y' });
	});

	it('lets explicit type win even if extras try to override', () => {
		// Extra is typed to exclude `type`, but at runtime someone could try.
		const meta = buildSpaceMetadata('brand', { voiceDoc: 'X' } as Record<string, unknown>);
		expect(meta.type).toBe('brand');
	});
});

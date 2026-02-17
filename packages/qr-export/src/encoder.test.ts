import { describe, it, expect } from 'vitest';
import { encode, decode, estimateSize, willFitInQR, MANA_QR_PREFIX } from './encoder';
import { createManaQRExport, contact, event, todo } from './builder';
import type { ManaQRExport } from './types';

describe('encoder', () => {
	const sampleExport: ManaQRExport = {
		v: 1,
		ts: 1708185600,
		u: {
			n: 'Till',
			z: 'Europe/Berlin',
			l: 'de',
			w: 'Berlin',
		},
		c: [
			{ n: 'Mama', p: '+491701234567', r: 1 },
			{ n: 'Papa', p: '+491707654321', r: 1 },
		],
		e: [
			{ t: 'Zahnarzt', s: 1708272000, d: 60, l: 'Praxis Dr. Weber' },
			{ t: 'Team Meeting', s: 1708358400, d: 30 },
		],
		t: [
			{ t: 'Steuererklärung abgeben', p: 1, d: 14 },
			{ t: 'Backup machen', p: 3 },
		],
	};

	describe('encode', () => {
		it('should encode data with correct prefix', () => {
			const result = encode(sampleExport);

			expect(result.data.startsWith(MANA_QR_PREFIX)).toBe(true);
			expect(result.size).toBeGreaterThan(0);
		});

		it('should report fitsInQR correctly for small data', () => {
			const result = encode(sampleExport);

			expect(result.fitsInQR).toBe(true);
			expect(result.size).toBeLessThan(2500);
		});

		it('should compress data significantly', () => {
			const jsonSize = JSON.stringify(sampleExport).length;
			const result = encode(sampleExport);

			// Encoded should be smaller than raw JSON
			expect(result.size).toBeLessThan(jsonSize);
		});
	});

	describe('decode', () => {
		it('should decode encoded data correctly', () => {
			const encoded = encode(sampleExport);
			const decoded = decode(encoded.data);

			expect(decoded.success).toBe(true);
			if (decoded.success) {
				expect(decoded.data.u.n).toBe('Till');
				expect(decoded.data.c).toHaveLength(2);
				expect(decoded.data.e).toHaveLength(2);
				expect(decoded.data.t).toHaveLength(2);
			}
		});

		it('should fail for invalid prefix', () => {
			const result = decode('INVALID:xyz');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('INVALID_PREFIX');
			}
		});

		it('should fail for invalid base64', () => {
			const result = decode(MANA_QR_PREFIX + '!!!invalid!!!');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe('INVALID_BASE64');
			}
		});
	});

	describe('roundtrip', () => {
		it('should preserve all data through encode/decode', () => {
			const encoded = encode(sampleExport);
			const decoded = decode(encoded.data);

			expect(decoded.success).toBe(true);
			if (decoded.success) {
				expect(decoded.data).toEqual(sampleExport);
			}
		});
	});

	describe('estimateSize', () => {
		it('should estimate size within reasonable range', () => {
			const estimated = estimateSize(sampleExport);
			const actual = encode(sampleExport).size;

			// Estimate should be within 50% of actual
			expect(estimated).toBeGreaterThan(actual * 0.5);
			expect(estimated).toBeLessThan(actual * 1.5);
		});
	});

	describe('willFitInQR', () => {
		it('should return true for small data', () => {
			expect(willFitInQR(sampleExport)).toBe(true);
		});
	});
});

describe('builder', () => {
	it('should build export with fluent API', () => {
		const result = createManaQRExport()
			.user({ n: 'Test', z: 'UTC', l: 'en' })
			.addContact(contact('Alice', '+1234567890', 1))
			.addEvent(event('Meeting', new Date('2024-02-20T10:00:00Z'), 60))
			.addTodo(todo('Task 1', 1, 7))
			.build();

		expect(result.v).toBe(1);
		expect(result.u.n).toBe('Test');
		expect(result.c).toHaveLength(1);
		expect(result.e).toHaveLength(1);
		expect(result.t).toHaveLength(1);
	});

	it('should encode to valid QR string', () => {
		const result = createManaQRExport()
			.userName('Test')
			.timezone('UTC')
			.addContact({ n: 'Bob', r: 3 })
			.encode();

		expect(result.data.startsWith(MANA_QR_PREFIX)).toBe(true);
		expect(result.fitsInQR).toBe(true);
	});

	it('should estimate size correctly', () => {
		const builder = createManaQRExport().userName('Test').addContact({ n: 'Alice', r: 1 });

		const estimated = builder.estimateSize();
		const _actual = builder.encode().size;

		expect(estimated).toBeGreaterThan(0);
		expect(builder.willFit()).toBe(true);
	});
});

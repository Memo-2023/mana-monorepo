import { describe, expect, it } from 'bun:test';
import { generateAvatarSvg, __TEST__ } from './avatar';
import {
	createDisplayHash,
	generateDisplayName,
} from '../../../services/mana-analytics/src/lib/pseudonym';

describe('avatar', () => {
	const SAMPLE_HASH = 'a3f4e1d2c5b6a798e0f1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f7a8b';

	it('is deterministic — same hash always yields same SVG', () => {
		expect(generateAvatarSvg(SAMPLE_HASH)).toBe(generateAvatarSvg(SAMPLE_HASH));
	});

	it('produces different SVGs for different hashes', () => {
		const a = generateAvatarSvg(SAMPLE_HASH);
		const b = generateAvatarSvg('b3f4e1d2c5b6a798e0f1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f7a8b');
		expect(a).not.toBe(b);
	});

	it('returns a self-contained SVG with viewBox + fill', () => {
		const svg = generateAvatarSvg(SAMPLE_HASH);
		expect(svg.startsWith('<svg')).toBe(true);
		expect(svg).toContain('viewBox="0 0 100 100"');
		expect(svg).toContain('fill="hsl(');
		expect(svg.endsWith('</svg>')).toBe(true);
	});

	it('background and foreground colors differ', () => {
		const svg = generateAvatarSvg(SAMPLE_HASH);
		const colors = [...svg.matchAll(/fill="(hsl\([^"]+\))"/g)].map((m) => m[1]);
		expect(colors.length).toBeGreaterThanOrEqual(2);
		expect(colors[0]).not.toBe(colors[1]);
	});

	it('cells are left-mirrored (col[i] === col[GRID-1-i] for all rows in left half)', () => {
		const { cells } = __TEST__.rendering(SAMPLE_HASH);
		const GRID = __TEST__.GRID;
		expect(cells).toHaveLength(GRID);
		for (let row = 0; row < GRID; row++) {
			for (let col = 0; col < 2; col++) {
				expect(cells[row][col]).toBe(cells[row][GRID - 1 - col]);
			}
		}
	});

	it('survives short / malformed hashes via padding', () => {
		expect(() => generateAvatarSvg('abc')).not.toThrow();
		expect(() => generateAvatarSvg('')).not.toThrow();
		expect(() => generateAvatarSvg('not-hex-at-all-just-random-text')).not.toThrow();
	});

	it('integrates with the pseudonym generator (same userId → same avatar AND name)', () => {
		const hash = createDisplayHash('user-42', 'fixed-secret');
		const name1 = generateDisplayName(hash);
		const name2 = generateDisplayName(hash);
		const svg1 = generateAvatarSvg(hash);
		const svg2 = generateAvatarSvg(hash);
		expect(name1).toBe(name2);
		expect(svg1).toBe(svg2);
	});

	it('cell density is reasonable (not all-on, not all-off)', () => {
		// Sample 50 different hashes — none should produce a totally blank
		// or totally full grid (would mean the bit-extraction is broken).
		let allOnCount = 0;
		let allOffCount = 0;
		const GRID = __TEST__.GRID;
		for (let i = 0; i < 50; i++) {
			const hash = createDisplayHash(`user-${i}`, 'secret');
			const { cells } = __TEST__.rendering(hash);
			const total = GRID * GRID;
			let on = 0;
			for (const row of cells) for (const c of row) if (c) on++;
			if (on === total) allOnCount++;
			if (on === 0) allOffCount++;
		}
		expect(allOnCount).toBe(0);
		expect(allOffCount).toBe(0);
	});
});

describe('avatar __TEST__ exports', () => {
	it('exports the GRID constant', () => {
		expect(__TEST__.GRID).toBe(5);
	});

	it('exports hexToBytes that handles non-hex chars', () => {
		const bytes = __TEST__.hexToBytes('xx-aa-bb-cc-yy');
		expect(bytes).toEqual([0xaa, 0xbb, 0xcc]);
	});
});

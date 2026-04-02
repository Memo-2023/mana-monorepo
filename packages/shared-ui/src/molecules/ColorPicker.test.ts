import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ColorPicker from './ColorPicker.svelte';
import { COLORS_12, COLORS_16, DEFAULT_COLOR, getRandomColor } from './ColorPicker.constants';

const testColors = ['#ef4444', '#3b82f6', '#22c55e'];

describe('ColorPicker', () => {
	it('renders all provided colors as radio buttons', () => {
		render(ColorPicker, { props: { colors: testColors, onColorChange: vi.fn() } });
		const radios = screen.getAllByRole('radio');
		expect(radios).toHaveLength(3);
	});

	it('marks selected color as checked', () => {
		render(ColorPicker, {
			props: { colors: testColors, selectedColor: '#3b82f6', onColorChange: vi.fn() },
		});
		const blue = screen.getByRole('radio', { name: '#3b82f6' });
		expect(blue.getAttribute('aria-checked')).toBe('true');
	});

	it('calls onColorChange when clicked', async () => {
		const onColorChange = vi.fn();
		render(ColorPicker, { props: { colors: testColors, onColorChange } });
		await fireEvent.click(screen.getByRole('radio', { name: '#22c55e' }));
		expect(onColorChange).toHaveBeenCalledWith('#22c55e');
	});

	it('supports keyboard selection', async () => {
		const onColorChange = vi.fn();
		render(ColorPicker, { props: { colors: testColors, onColorChange } });
		await fireEvent.keyDown(screen.getByRole('radio', { name: '#ef4444' }), { key: 'Enter' });
		expect(onColorChange).toHaveBeenCalledWith('#ef4444');
	});

	it('has accessible radiogroup role', () => {
		render(ColorPicker, { props: { colors: testColors, onColorChange: vi.fn() } });
		expect(screen.getByRole('radiogroup')).toBeInTheDocument();
	});

	it('uses custom label', () => {
		render(ColorPicker, {
			props: { colors: testColors, onColorChange: vi.fn(), label: 'Pick a color' },
		});
		expect(screen.getByRole('radiogroup', { name: 'Pick a color' })).toBeInTheDocument();
	});
});

describe('Color constants', () => {
	it('COLORS_12 has 12 entries', () => {
		expect(COLORS_12).toHaveLength(12);
	});

	it('COLORS_16 has 16 entries', () => {
		expect(COLORS_16).toHaveLength(16);
	});

	it('DEFAULT_COLOR is blue', () => {
		expect(DEFAULT_COLOR).toBe('#3b82f6');
	});

	it('getRandomColor returns a color from COLORS_12', () => {
		const validColors = new Set(COLORS_12);
		for (let i = 0; i < 30; i++) {
			expect(validColors.has(getRandomColor() as (typeof COLORS_12)[number])).toBe(true);
		}
	});
});

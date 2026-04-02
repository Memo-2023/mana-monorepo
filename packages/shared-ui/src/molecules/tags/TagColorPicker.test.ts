import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagColorPicker from './TagColorPicker.svelte';
import { TAG_COLORS, DEFAULT_TAG_COLOR } from './constants';

describe('TagColorPicker', () => {
	it('renders all 12 color options', () => {
		render(TagColorPicker, { props: { onColorChange: vi.fn() } });
		const radioGroup = screen.getByRole('radiogroup');
		const buttons = radioGroup.querySelectorAll('button');
		expect(buttons).toHaveLength(12);
	});

	it('each button has hex color as aria-label', () => {
		render(TagColorPicker, { props: { onColorChange: vi.fn() } });
		for (const color of TAG_COLORS) {
			expect(screen.getByRole('radio', { name: color.hex })).toBeInTheDocument();
		}
	});

	it('marks default color as selected', () => {
		render(TagColorPicker, {
			props: { selectedColor: DEFAULT_TAG_COLOR, onColorChange: vi.fn() },
		});
		const blueBtn = screen.getByRole('radio', { name: '#3b82f6' });
		expect(blueBtn.getAttribute('aria-checked')).toBe('true');
	});

	it('marks non-selected colors as unchecked', () => {
		render(TagColorPicker, {
			props: { selectedColor: '#ef4444', onColorChange: vi.fn() },
		});
		const blueBtn = screen.getByRole('radio', { name: '#3b82f6' });
		expect(blueBtn.getAttribute('aria-checked')).toBe('false');
		const redBtn = screen.getByRole('radio', { name: '#ef4444' });
		expect(redBtn.getAttribute('aria-checked')).toBe('true');
	});

	it('calls onColorChange when a color is clicked', async () => {
		const onColorChange = vi.fn();
		render(TagColorPicker, { props: { onColorChange } });
		const greenBtn = screen.getByRole('radio', { name: '#22c55e' });
		await fireEvent.click(greenBtn);
		expect(onColorChange).toHaveBeenCalledWith('#22c55e');
	});

	it('supports keyboard selection with Enter', async () => {
		const onColorChange = vi.fn();
		render(TagColorPicker, { props: { onColorChange } });
		const tealBtn = screen.getByRole('radio', { name: '#14b8a6' });
		await fireEvent.keyDown(tealBtn, { key: 'Enter' });
		expect(onColorChange).toHaveBeenCalledWith('#14b8a6');
	});

	it('supports keyboard selection with Space', async () => {
		const onColorChange = vi.fn();
		render(TagColorPicker, { props: { onColorChange } });
		const pinkBtn = screen.getByRole('radio', { name: '#ec4899' });
		await fireEvent.keyDown(pinkBtn, { key: ' ' });
		expect(onColorChange).toHaveBeenCalledWith('#ec4899');
	});

	it('renders different sizes', () => {
		const { container: smContainer } = render(TagColorPicker, {
			props: { onColorChange: vi.fn(), size: 'sm' },
		});
		const smBtn = smContainer.querySelector('button')!;
		expect(smBtn.classList.contains('w-6')).toBe(true);

		const { container: lgContainer } = render(TagColorPicker, {
			props: { onColorChange: vi.fn(), size: 'lg' },
		});
		const lgBtn = lgContainer.querySelector('button')!;
		expect(lgBtn.classList.contains('w-10')).toBe(true);
	});
});

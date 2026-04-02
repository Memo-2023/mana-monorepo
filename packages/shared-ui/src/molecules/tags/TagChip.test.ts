import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TagChip from './TagChip.svelte';

describe('TagChip', () => {
	it('renders tag name', () => {
		render(TagChip, { props: { name: 'Arbeit' } });
		expect(screen.getByText('Arbeit')).toBeInTheDocument();
	});

	it('renders as a span element', () => {
		const { container } = render(TagChip, { props: { name: 'Test', color: '#ef4444' } });
		const chip = container.querySelector('span');
		expect(chip).toBeInTheDocument();
		expect(chip!.textContent?.trim()).toBe('Test');
	});

	it('has compact chip styling classes', () => {
		const { container } = render(TagChip, { props: { name: 'Tag' } });
		const chip = container.querySelector('span')!;
		expect(chip.classList.contains('rounded-full')).toBe(true);
		expect(chip.classList.contains('text-[0.625rem]')).toBe(true);
		expect(chip.classList.contains('font-medium')).toBe(true);
		expect(chip.classList.contains('px-1.5')).toBe(true);
		expect(chip.classList.contains('py-0.5')).toBe(true);
	});

	it('renders different tag names', () => {
		render(TagChip, { props: { name: 'Arbeit' } });
		expect(screen.getByText('Arbeit')).toBeInTheDocument();
	});
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagBadge from './TagBadge.svelte';

describe('TagBadge', () => {
	it('renders tag name from name field', () => {
		render(TagBadge, { props: { tag: { name: 'Wichtig', color: '#ef4444' } } });
		expect(screen.getByText('Wichtig')).toBeInTheDocument();
	});

	it('renders tag name from text field (compat)', () => {
		render(TagBadge, { props: { tag: { text: 'Fallback' } } });
		expect(screen.getByText('Fallback')).toBeInTheDocument();
	});

	it('reads color from style.color (new format)', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Test', style: { color: '#22c55e' } } },
		});
		const badge = container.querySelector('span')!;
		expect(badge.style.color).toBe('rgb(34, 197, 94)');
	});

	it('reads color from color field (old format)', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Test', color: '#f97316' } },
		});
		const badge = container.querySelector('span')!;
		expect(badge.style.color).toBe('rgb(249, 115, 22)');
	});

	it('defaults to blue when no color', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'NoColor' } },
		});
		const badge = container.querySelector('span')!;
		expect(badge.style.color).toBe('rgb(59, 130, 246)');
	});

	it('shows color dot indicator', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Test', color: '#ef4444' } },
		});
		const dot = container.querySelector('.rounded-full.h-2.w-2');
		expect(dot).toBeInTheDocument();
	});

	it('shows remove button when removable', () => {
		const onRemove = vi.fn();
		render(TagBadge, {
			props: { tag: { name: 'Remove Me' }, removable: true, onRemove },
		});
		const removeBtn = screen.getByRole('button', { name: 'Remove tag' });
		expect(removeBtn).toBeInTheDocument();
	});

	it('calls onRemove when remove button clicked', async () => {
		const onRemove = vi.fn();
		render(TagBadge, {
			props: { tag: { name: 'Remove Me' }, removable: true, onRemove },
		});
		const removeBtn = screen.getByRole('button', { name: 'Remove tag' });
		await fireEvent.click(removeBtn);
		expect(onRemove).toHaveBeenCalledOnce();
	});

	it('is clickable when clickable prop is set', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Click' }, clickable: true, onClick: vi.fn() },
		});
		const badge = container.querySelector('[role="button"]');
		expect(badge).toBeInTheDocument();
	});

	it('calls onClick when clicked in clickable mode', async () => {
		const onClick = vi.fn();
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Click' }, clickable: true, onClick },
		});
		const badge = container.querySelector('[role="button"]')!;
		await fireEvent.click(badge);
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('is not clickable by default', () => {
		const { container } = render(TagBadge, {
			props: { tag: { name: 'Static' } },
		});
		const badge = container.querySelector('[role="button"]');
		expect(badge).not.toBeInTheDocument();
	});
});

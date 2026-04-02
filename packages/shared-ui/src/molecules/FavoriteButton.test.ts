import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FavoriteButton from './FavoriteButton.svelte';

describe('FavoriteButton', () => {
	it('renders with heart icon by default', () => {
		const { container } = render(FavoriteButton, {
			props: { active: false, onclick: vi.fn() },
		});
		expect(container.querySelector('button')).toBeInTheDocument();
	});

	it('has correct aria-label when inactive', () => {
		render(FavoriteButton, {
			props: { active: false, onclick: vi.fn() },
		});
		expect(screen.getByRole('button', { name: 'Favorit' })).toBeInTheDocument();
	});

	it('has correct aria-label when active', () => {
		render(FavoriteButton, {
			props: { active: true, onclick: vi.fn() },
		});
		expect(screen.getByRole('button', { name: 'Favorit entfernen' })).toBeInTheDocument();
	});

	it('calls onclick when clicked', async () => {
		const onclick = vi.fn();
		render(FavoriteButton, { props: { active: false, onclick } });
		await fireEvent.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('uses pin labels for pin variant', () => {
		render(FavoriteButton, {
			props: { active: false, onclick: vi.fn(), variant: 'pin' },
		});
		expect(screen.getByRole('button', { name: 'Anpinnen' })).toBeInTheDocument();
	});

	it('uses custom label when provided', () => {
		render(FavoriteButton, {
			props: { active: false, onclick: vi.fn(), label: 'Custom' },
		});
		expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
	});
});

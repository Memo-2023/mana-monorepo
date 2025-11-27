/**
 * Example Svelte 5 Component Test
 *
 * This demonstrates best practices for testing Svelte 5 components:
 * - Test component rendering with runes
 * - Test user interactions
 * - Test reactive state ($state, $derived, $effect)
 * - Test events
 * - Test props
 */

import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Button from '../Button.svelte';
import userEvent from '@testing-library/user-event';

describe('Button (Svelte 5)', () => {
	const user = userEvent.setup();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with text content', () => {
			render(Button, { props: { children: 'Click Me' } });

			expect(screen.getByText('Click Me')).toBeTruthy();
		});

		it('should render with variant classes', () => {
			const { container } = render(Button, {
				props: {
					variant: 'primary',
					children: 'Primary Button',
				},
			});

			const button = container.querySelector('button');
			expect(button?.className).toContain('btn-primary');
		});

		it('should render with custom class', () => {
			const { container } = render(Button, {
				props: {
					class: 'custom-class',
					children: 'Button',
				},
			});

			const button = container.querySelector('button');
			expect(button?.className).toContain('custom-class');
		});

		it('should render loading state', () => {
			render(Button, {
				props: {
					loading: true,
					children: 'Submit',
				},
			});

			expect(screen.getByTestId('loading-spinner')).toBeTruthy();
		});

		it('should render disabled state', () => {
			const { container } = render(Button, {
				props: {
					disabled: true,
					children: 'Disabled',
				},
			});

			const button = container.querySelector('button');
			expect(button?.disabled).toBe(true);
		});
	});

	describe('User Interactions', () => {
		it('should call onclick when clicked', async () => {
			const onclick = vi.fn();

			render(Button, {
				props: {
					onclick,
					children: 'Click Me',
				},
			});

			await user.click(screen.getByText('Click Me'));

			expect(onclick).toHaveBeenCalledOnce();
		});

		it('should not call onclick when disabled', async () => {
			const onclick = vi.fn();

			render(Button, {
				props: {
					onclick,
					disabled: true,
					children: 'Disabled',
				},
			});

			await user.click(screen.getByText('Disabled'));

			expect(onclick).not.toHaveBeenCalled();
		});

		it('should not call onclick when loading', async () => {
			const onclick = vi.fn();

			render(Button, {
				props: {
					onclick,
					loading: true,
					children: 'Loading',
				},
			});

			const button = screen.getByRole('button');
			await user.click(button);

			expect(onclick).not.toHaveBeenCalled();
		});

		it('should handle keyboard events', async () => {
			const onclick = vi.fn();

			render(Button, {
				props: {
					onclick,
					children: 'Press Enter',
				},
			});

			const button = screen.getByRole('button');
			button.focus();
			await user.keyboard('{Enter}');

			expect(onclick).toHaveBeenCalled();
		});
	});

	describe('Reactive State (Svelte 5 Runes)', () => {
		it('should react to prop changes', async () => {
			const { component, rerender } = render(Button, {
				props: {
					loading: false,
					children: 'Submit',
				},
			});

			expect(screen.queryByTestId('loading-spinner')).toBeNull();

			// Update props
			await rerender({ loading: true });

			expect(screen.getByTestId('loading-spinner')).toBeTruthy();
		});

		it('should derive styles based on variant', () => {
			const { container, rerender } = render(Button, {
				props: {
					variant: 'primary',
					children: 'Button',
				},
			});

			let button = container.querySelector('button');
			expect(button?.className).toContain('btn-primary');

			rerender({ variant: 'secondary' });

			button = container.querySelector('button');
			expect(button?.className).toContain('btn-secondary');
			expect(button?.className).not.toContain('btn-primary');
		});
	});

	describe('Accessibility', () => {
		it('should have button role', () => {
			render(Button, { props: { children: 'Button' } });

			expect(screen.getByRole('button')).toBeTruthy();
		});

		it('should support aria-label', () => {
			render(Button, {
				props: {
					'aria-label': 'Close dialog',
					children: 'X',
				},
			});

			expect(screen.getByLabelText('Close dialog')).toBeTruthy();
		});

		it('should indicate disabled state to screen readers', () => {
			render(Button, {
				props: {
					disabled: true,
					children: 'Disabled',
				},
			});

			const button = screen.getByRole('button');
			expect(button.getAttribute('aria-disabled')).toBe('true');
		});

		it('should indicate loading state to screen readers', () => {
			render(Button, {
				props: {
					loading: true,
					children: 'Loading',
				},
			});

			const button = screen.getByRole('button');
			expect(button.getAttribute('aria-busy')).toBe('true');
		});
	});

	describe('Variants', () => {
		it.each([
			['primary', 'btn-primary'],
			['secondary', 'btn-secondary'],
			['danger', 'btn-danger'],
			['ghost', 'btn-ghost'],
		])('should render %s variant with %s class', (variant, expectedClass) => {
			const { container } = render(Button, {
				props: {
					variant,
					children: 'Button',
				},
			});

			const button = container.querySelector('button');
			expect(button?.className).toContain(expectedClass);
		});
	});

	describe('Sizes', () => {
		it.each([
			['sm', 'btn-sm'],
			['md', 'btn-md'],
			['lg', 'btn-lg'],
		])('should render %s size with %s class', (size, expectedClass) => {
			const { container } = render(Button, {
				props: {
					size,
					children: 'Button',
				},
			});

			const button = container.querySelector('button');
			expect(button?.className).toContain(expectedClass);
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid clicks (debouncing)', async () => {
			vi.useFakeTimers();
			const onclick = vi.fn();

			render(Button, {
				props: {
					onclick,
					debounce: 500,
					children: 'Click',
				},
			});

			const button = screen.getByRole('button');

			// Rapid clicks
			await user.click(button);
			await user.click(button);
			await user.click(button);

			// Should only call once
			expect(onclick).toHaveBeenCalledTimes(1);

			// Wait for debounce
			vi.advanceTimersByTime(500);

			// Click again
			await user.click(button);

			expect(onclick).toHaveBeenCalledTimes(2);

			vi.useRealTimers();
		});

		it('should handle async onclick handlers', async () => {
			const asyncOnclick = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			});

			render(Button, {
				props: {
					onclick: asyncOnclick,
					children: 'Async Click',
				},
			});

			await user.click(screen.getByText('Async Click'));

			expect(asyncOnclick).toHaveBeenCalled();

			// Wait for async handler to complete
			await vi.waitFor(() => {
				expect(asyncOnclick).toHaveReturnedWith(expect.any(Promise));
			});
		});

		it('should handle null children gracefully', () => {
			render(Button, { props: {} });

			expect(screen.getByRole('button')).toBeTruthy();
		});
	});

	describe('Slots', () => {
		it('should render icon slot', () => {
			render(Button, {
				props: {
					children: 'With Icon',
				},
				// Note: Testing slots in Vitest requires different approach
				// This is a simplified example
			});

			expect(screen.getByText('With Icon')).toBeTruthy();
		});
	});

	describe('Events', () => {
		it('should dispatch custom event on click', async () => {
			const { component } = render(Button, {
				props: {
					children: 'Custom Event',
				},
			});

			const customEventHandler = vi.fn();
			component.$on('customClick', customEventHandler);

			await user.click(screen.getByText('Custom Event'));

			expect(customEventHandler).toHaveBeenCalled();
		});
	});
});

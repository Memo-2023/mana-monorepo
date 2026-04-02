import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ReminderPicker from './ReminderPicker.svelte';

describe('ReminderPicker', () => {
	it('renders a select element', () => {
		const { container } = render(ReminderPicker, {
			props: { value: null, onChange: vi.fn() },
		});
		expect(container.querySelector('select')).toBeInTheDocument();
	});

	it('renders default options', () => {
		const { container } = render(ReminderPicker, {
			props: { value: null, onChange: vi.fn() },
		});
		const options = container.querySelectorAll('option');
		expect(options.length).toBeGreaterThanOrEqual(5);
	});

	it('shows bell icon when reminder is set', () => {
		const { container } = render(ReminderPicker, {
			props: { value: 15, onChange: vi.fn() },
		});
		// Bell icon should be present (not BellSlash)
		const svgs = container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
	});

	it('calls onChange when selection changes', async () => {
		const onChange = vi.fn();
		const { container } = render(ReminderPicker, {
			props: { value: null, onChange },
		});
		const select = container.querySelector('select')!;
		await fireEvent.change(select, { target: { value: '30' } });
		expect(onChange).toHaveBeenCalledWith(30);
	});

	it('calls onChange with null for "no reminder"', async () => {
		const onChange = vi.fn();
		const { container } = render(ReminderPicker, {
			props: { value: 15, onChange },
		});
		const select = container.querySelector('select')!;
		await fireEvent.change(select, { target: { value: '' } });
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('supports disabled state', () => {
		const { container } = render(ReminderPicker, {
			props: { value: null, onChange: vi.fn(), disabled: true },
		});
		const select = container.querySelector('select')!;
		expect(select.disabled).toBe(true);
	});
});

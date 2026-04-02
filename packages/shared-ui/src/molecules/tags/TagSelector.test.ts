import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagSelector from './TagSelector.svelte';
import type { Tag } from './constants';

const mockTags: Tag[] = [
	{ id: '1', name: 'Arbeit', color: '#3b82f6' },
	{ id: '2', name: 'Persönlich', color: '#22c55e' },
	{ id: '3', name: 'Familie', color: '#ec4899' },
	{ id: '4', name: 'Wichtig', color: '#ef4444' },
];

describe('TagSelector', () => {
	it('renders add-tag button', () => {
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange: vi.fn() },
		});
		expect(screen.getByText('Tag hinzufügen')).toBeInTheDocument();
	});

	it('renders selected tags as badges', () => {
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [mockTags[0], mockTags[2]],
				onTagsChange: vi.fn(),
			},
		});
		expect(screen.getByText('Arbeit')).toBeInTheDocument();
		expect(screen.getByText('Familie')).toBeInTheDocument();
	});

	it('opens dropdown on button click', async () => {
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange: vi.fn() },
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		expect(screen.getByPlaceholderText('Tag suchen...')).toBeInTheDocument();
	});

	it('shows unselected tags in dropdown', async () => {
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [mockTags[0]],
				onTagsChange: vi.fn(),
			},
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		// Should not show already selected
		const dropdownItems = screen.getAllByRole('button');
		const itemNames = dropdownItems.map((b) => b.textContent?.trim());
		expect(itemNames).not.toContain('Arbeit');
		expect(itemNames).toContain('Persönlich');
	});

	it('calls onTagsChange when a tag is selected', async () => {
		const onTagsChange = vi.fn();
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange },
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		await fireEvent.click(screen.getByText('Wichtig'));
		expect(onTagsChange).toHaveBeenCalledWith([mockTags[3]]);
	});

	it('calls onTagsChange when a tag is removed', async () => {
		const onTagsChange = vi.fn();
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [mockTags[0], mockTags[1]],
				onTagsChange,
			},
		});
		// Click the remove button on Arbeit badge
		const removeButtons = screen.getAllByRole('button', { name: 'Remove tag' });
		await fireEvent.click(removeButtons[0]);
		expect(onTagsChange).toHaveBeenCalledWith([mockTags[1]]);
	});

	it('filters tags by search query', async () => {
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange: vi.fn() },
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		const searchInput = screen.getByPlaceholderText('Tag suchen...');
		await fireEvent.input(searchInput, { target: { value: 'Wich' } });
		expect(screen.getByText('Wichtig')).toBeInTheDocument();
		expect(screen.queryByText('Arbeit')).not.toBeInTheDocument();
	});

	it('hides add button when maxTags reached', () => {
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [mockTags[0], mockTags[1]],
				onTagsChange: vi.fn(),
				maxTags: 2,
			},
		});
		expect(screen.queryByText('Tag hinzufügen')).not.toBeInTheDocument();
	});

	it('shows create button when onCreateTag is provided', async () => {
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [],
				onTagsChange: vi.fn(),
				onCreateTag: vi.fn(),
			},
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		expect(screen.getByText('Neuen Tag erstellen')).toBeInTheDocument();
	});

	it('does not show create button when onCreateTag is not provided', async () => {
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange: vi.fn() },
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		expect(screen.queryByText('Neuen Tag erstellen')).not.toBeInTheDocument();
	});

	it('supports custom labels', () => {
		render(TagSelector, {
			props: {
				tags: mockTags,
				selectedTags: [],
				onTagsChange: vi.fn(),
				addTagLabel: 'Label hinzufügen',
			},
		});
		expect(screen.getByText('Label hinzufügen')).toBeInTheDocument();
	});

	it('closes dropdown on Escape', async () => {
		render(TagSelector, {
			props: { tags: mockTags, selectedTags: [], onTagsChange: vi.fn() },
		});
		await fireEvent.click(screen.getByText('Tag hinzufügen'));
		expect(screen.getByPlaceholderText('Tag suchen...')).toBeInTheDocument();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(screen.queryByPlaceholderText('Tag suchen...')).not.toBeInTheDocument();
	});
});

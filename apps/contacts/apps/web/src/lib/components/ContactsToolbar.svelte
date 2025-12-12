<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { viewModeStore, type ViewMode } from '$lib/stores/view-mode.svelte';
	import {
		PillToolbar,
		PillToolbarButton,
		PillToolbarDivider,
		PillViewSwitcher,
	} from '@manacore/shared-ui';
	import FilterBar, {
		type ContactFilter,
		type BirthdayFilter,
	} from '$lib/components/FilterBar.svelte';
	import type { Contact } from '$lib/api/contacts';

	export type SortField = 'firstName' | 'lastName';

	interface Props {
		contacts: Contact[];
		sortField: SortField;
		onSortFieldChange: (field: SortField) => void;
		contactFilter: ContactFilter;
		onContactFilterChange: (filter: ContactFilter) => void;
		birthdayFilter: BirthdayFilter;
		onBirthdayFilterChange: (filter: BirthdayFilter) => void;
		selectedTagId: string | null;
		onTagChange: (tagId: string | null) => void;
		selectedCompany: string | null;
		onCompanyChange: (company: string | null) => void;
		/** Selection mode state */
		selectionMode: boolean;
		/** Toggle selection mode callback */
		onToggleSelectionMode: () => void;
	}

	let {
		contacts,
		sortField,
		onSortFieldChange,
		contactFilter,
		onContactFilterChange,
		birthdayFilter,
		onBirthdayFilterChange,
		selectedTagId,
		onTagChange,
		selectedCompany,
		onCompanyChange,
		selectionMode,
		onToggleSelectionMode,
	}: Props = $props();

	// Count favorites for quick filter button
	let favoritesCount = $derived(contactsStore.contacts.filter((c) => c.isFavorite).length);
	let showFavorites = $derived(contactFilter === 'favorites');

	// Sort options
	const sortOptions = [
		{ id: 'firstName', label: $_('sort.firstName'), title: $_('sort.firstName') },
		{ id: 'lastName', label: $_('sort.lastName'), title: $_('sort.lastName') },
	];

	// View mode options
	const viewOptions = [
		{ id: 'list', label: '', title: $_('views.list'), icon: 'list' },
		{ id: 'grid', label: '', title: $_('views.grid'), icon: 'grid' },
		{ id: 'alphabet', label: '', title: $_('views.alphabet'), icon: 'alphabet' },
	];

	function toggleFavorites() {
		if (contactFilter === 'favorites') {
			onContactFilterChange('all');
		} else {
			onContactFilterChange('favorites');
		}
	}

	function handleSortChange(value: string) {
		onSortFieldChange(value as SortField);
	}

	function handleViewModeChange(value: string) {
		viewModeStore.setMode(value as ViewMode);
	}
</script>

<PillToolbar topOffset="70px">
	<!-- New Contact Button -->
	<PillToolbarButton onclick={() => goto('/contacts/new')} title={$_('contacts.new')}>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		<span class="btn-label">{$_('contacts.new')}</span>
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Selection Mode Toggle -->
	<PillToolbarButton
		onclick={onToggleSelectionMode}
		active={selectionMode}
		title={selectionMode ? 'Auswahl beenden' : 'Mehrere auswählen'}
	>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
			/>
		</svg>
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Favorites Toggle -->
	<PillToolbarButton
		onclick={toggleFavorites}
		active={showFavorites}
		title={$_('filters.contact.favorites')}
	>
		<svg fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
			/>
		</svg>
		{#if favoritesCount > 0}
			<span class="count">{favoritesCount}</span>
		{/if}
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Filter Dropdown -->
	<FilterBar
		{contacts}
		{selectedTagId}
		{onTagChange}
		{contactFilter}
		{onContactFilterChange}
		{birthdayFilter}
		{onBirthdayFilterChange}
		{selectedCompany}
		{onCompanyChange}
		embedded={true}
	/>

	<PillToolbarDivider />

	<!-- Sort Toggle -->
	<PillViewSwitcher
		options={sortOptions}
		value={sortField}
		onChange={handleSortChange}
		primaryColor="#6366f1"
		embedded={true}
	/>

	<PillToolbarDivider />

	<!-- View Mode -->
	<div class="view-mode-buttons">
		<button
			type="button"
			class="view-btn"
			class:active={viewModeStore.mode === 'list'}
			onclick={() => viewModeStore.setMode('list')}
			title={$_('views.list')}
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>
		<button
			type="button"
			class="view-btn"
			class:active={viewModeStore.mode === 'grid'}
			onclick={() => viewModeStore.setMode('grid')}
			title={$_('views.grid')}
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
				/>
			</svg>
		</button>
		<button
			type="button"
			class="view-btn"
			class:active={viewModeStore.mode === 'alphabet'}
			onclick={() => viewModeStore.setMode('alphabet')}
			title={$_('views.alphabet')}
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
				/>
			</svg>
		</button>
	</div>
</PillToolbar>

<style>
	.btn-label {
		display: none;
	}

	@media (min-width: 640px) {
		.btn-label {
			display: inline;
		}
	}

	.count {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.view-mode-buttons {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: #374151;
		transition: all 0.15s ease;
	}

	:global(.dark) .view-btn {
		color: #f3f4f6;
	}

	.view-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .view-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.view-btn.active {
		background: color-mix(in srgb, #6366f1 15%, transparent 85%);
		color: #6366f1;
	}

	.view-btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}
</style>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { PillViewSwitcher } from '@manacore/shared-ui';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import type { Contact } from '$lib/api/contacts';

	interface Props {
		contacts: Contact[];
	}

	let { contacts }: Props = $props();

	// Sort options
	const sortOptions = [
		{ id: 'firstName', label: $_('sort.firstName'), title: $_('sort.firstName') },
		{ id: 'lastName', label: $_('sort.lastName'), title: $_('sort.lastName') },
	];

	function handleSortChange(value: string) {
		contactsFilterStore.setSortField(value as 'firstName' | 'lastName');
	}
</script>

<div class="toolbar-content-inner">
	<!-- Filter Dropdown -->
	<FilterBar
		{contacts}
		selectedTagId={contactsFilterStore.selectedTagId}
		onTagChange={(id) => contactsFilterStore.setSelectedTagId(id)}
		contactFilter={contactsFilterStore.contactFilter}
		onContactFilterChange={(f) => contactsFilterStore.setContactFilter(f)}
		birthdayFilter={contactsFilterStore.birthdayFilter}
		onBirthdayFilterChange={(f) => contactsFilterStore.setBirthdayFilter(f)}
		selectedCompany={contactsFilterStore.selectedCompany}
		onCompanyChange={(c) => contactsFilterStore.setSelectedCompany(c)}
		embedded={true}
	/>

	<div class="toolbar-divider"></div>

	<!-- Sort Toggle -->
	<PillViewSwitcher
		options={sortOptions}
		value={contactsFilterStore.sortField}
		onChange={handleSortChange}
		primaryColor="#3b82f6"
		embedded={true}
	/>

	<div class="toolbar-divider"></div>

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
</div>

<style>
	.toolbar-content-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: hsl(var(--color-border));
		margin: 0 0.25rem;
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
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
	}

	.view-btn :global(svg) {
		width: 1rem;
		height: 1rem;
	}
</style>

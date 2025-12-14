<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { PillViewSwitcher, FilterDropdown, type FilterDropdownOption } from '@manacore/shared-ui';
	import { ZoomIn, ZoomOut, RotateCcw, Focus, X } from 'lucide-svelte';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import { networkStore } from '$lib/stores/network.svelte';
	import { tagsApi, type ContactTag, type Contact } from '$lib/api/contacts';
	import type { ContactFilter, BirthdayFilter } from '$lib/components/FilterBar.svelte';

	interface Props {
		contacts: Contact[];
	}

	let { contacts }: Props = $props();

	// Tags for filter
	let tags = $state<ContactTag[]>([]);

	// Tag options for FilterDropdown
	let tagOptions = $derived<FilterDropdownOption[]>(
		tags.map((tag) => ({ value: tag.id, label: tag.name }))
	);

	// Contact filter options
	let contactFilterOptions = $derived<FilterDropdownOption[]>([
		{ value: 'all', label: $_('filters.contact.all') },
		{ value: 'favorites', label: $_('filters.contact.favorites') },
		{ value: 'hasPhone', label: $_('filters.contact.hasPhone') },
		{ value: 'hasEmail', label: $_('filters.contact.hasEmail') },
		{ value: 'incomplete', label: $_('filters.contact.incomplete') },
	]);

	// Birthday filter options
	let birthdayFilterOptions = $derived<FilterDropdownOption[]>([
		{ value: 'all', label: $_('filters.birthday.all') },
		{ value: 'today', label: $_('filters.birthday.today') },
		{ value: 'thisWeek', label: $_('filters.birthday.thisWeek') },
		{ value: 'thisMonth', label: $_('filters.birthday.thisMonth') },
	]);

	// Extract unique companies from contacts
	let companies = $derived.by(() => {
		const companySet = new Set<string>();
		for (const contact of contacts) {
			if (contact.company) {
				companySet.add(contact.company);
			}
		}
		return Array.from(companySet).sort((a, b) => a.localeCompare(b, 'de'));
	});

	// Company options for FilterDropdown
	let companyOptions = $derived<FilterDropdownOption[]>(
		companies.map((company) => ({ value: company, label: company }))
	);

	// Count active filters
	let activeFilterCount = $derived.by(() => {
		let count = 0;
		if (contactsFilterStore.selectedTagId) count++;
		if (contactsFilterStore.contactFilter !== 'all') count++;
		if (contactsFilterStore.birthdayFilter !== 'all') count++;
		if (contactsFilterStore.selectedCompany) count++;
		return count;
	});

	async function loadTags() {
		try {
			const response = await tagsApi.list();
			tags = response.tags || [];
		} catch (e) {
			console.error('Failed to load tags:', e);
		}
	}

	function clearAllFilters() {
		contactsFilterStore.setSelectedTagId(null);
		contactsFilterStore.setContactFilter('all');
		contactsFilterStore.setBirthdayFilter('all');
		contactsFilterStore.setSelectedCompany(null);
	}

	// Network strength state
	let strengthValue = $state(networkStore.minStrength);

	// Sync strength with store
	$effect(() => {
		strengthValue = networkStore.minStrength;
	});

	// Sort options
	const sortOptions = [
		{ id: 'firstName', label: $_('sort.firstName'), title: $_('sort.firstName') },
		{ id: 'lastName', label: $_('sort.lastName'), title: $_('sort.lastName') },
	];

	function handleSortChange(value: string) {
		contactsFilterStore.setSortField(value as 'firstName' | 'lastName');
	}

	function handleStrengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		strengthValue = parseInt(target.value, 10);
		networkStore.setMinStrength(strengthValue);
	}

	function clearNetworkFilters() {
		strengthValue = 0;
		networkStore.clearFilters();
	}

	const hasActiveNetworkFilters = $derived(networkStore.minStrength > 0);

	// Check if in network mode
	const isNetworkMode = $derived(viewModeStore.mode === 'network');

	onMount(() => {
		loadTags();
	});
</script>

<div class="toolbar-content-inner">
	{#if isNetworkMode}
		<!-- Network Mode Controls -->

		<!-- Strength Filter -->
		<div class="strength-group">
			<label for="network-strength-filter" class="strength-label">
				{$_('network.strength')}: {strengthValue}%
			</label>
			<input
				id="network-strength-filter"
				type="range"
				min="0"
				max="100"
				step="10"
				value={strengthValue}
				oninput={handleStrengthChange}
				class="strength-slider"
				title={$_('network.minStrength')}
			/>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Zoom Controls -->
		<div class="zoom-controls">
			<button
				onclick={() => networkStore.zoomIn()}
				class="control-btn"
				aria-label={$_('network.zoomIn')}
				title={$_('network.zoomIn')}
			>
				<ZoomIn size={16} />
			</button>
			<button
				onclick={() => networkStore.zoomOut()}
				class="control-btn"
				aria-label={$_('network.zoomOut')}
				title={$_('network.zoomOut')}
			>
				<ZoomOut size={16} />
			</button>
			<button
				onclick={() => networkStore.resetZoom()}
				class="control-btn"
				aria-label={$_('network.resetZoom')}
				title={$_('network.resetZoom')}
			>
				<RotateCcw size={16} />
			</button>
			<button
				onclick={() => networkStore.focusOnSelected()}
				class="control-btn"
				aria-label={$_('network.focusSelected')}
				title={$_('network.focusSelected')}
			>
				<Focus size={16} />
			</button>
		</div>

		<!-- Clear Filters -->
		{#if hasActiveNetworkFilters}
			<div class="toolbar-divider"></div>
			<button onclick={clearNetworkFilters} class="clear-btn" title={$_('common.clearFilters')}>
				<X size={14} />
				<span>{$_('common.clearFilters')}</span>
			</button>
		{/if}

		<!-- Stats -->
		<div class="stats">
			<span class="stat">{networkStore.nodes.length} {$_('contacts.contactsPlural')}</span>
			<span class="stat-divider">•</span>
			<span class="stat">{networkStore.links.length} {$_('network.connections')}</span>
		</div>
	{:else}
		<!-- Standard Mode Controls (Grid/Alphabet) -->

		<!-- Filter Dropdowns -->
		<div class="filter-group">
			<!-- Tags Filter -->
			<FilterDropdown
				options={tagOptions}
				value={contactsFilterStore.selectedTagId}
				onChange={(v) => contactsFilterStore.setSelectedTagId(typeof v === 'string' ? v : null)}
				placeholder={$_('filters.allTags')}
				embedded={true}
				direction="up"
			/>

			<!-- Contact Info Filter -->
			<FilterDropdown
				options={contactFilterOptions}
				value={contactsFilterStore.contactFilter}
				onChange={(v) =>
					contactsFilterStore.setContactFilter(
						(typeof v === 'string' ? v : 'all') as ContactFilter
					)}
				placeholder={$_('filters.contact.all')}
				embedded={true}
				direction="up"
			/>

			<!-- Birthday Filter -->
			<FilterDropdown
				options={birthdayFilterOptions}
				value={contactsFilterStore.birthdayFilter}
				onChange={(v) =>
					contactsFilterStore.setBirthdayFilter(
						(typeof v === 'string' ? v : 'all') as BirthdayFilter
					)}
				placeholder={$_('filters.birthday.all')}
				embedded={true}
				direction="up"
			/>

			<!-- Company Filter (only if companies exist) -->
			{#if companyOptions.length > 0}
				<FilterDropdown
					options={companyOptions}
					value={contactsFilterStore.selectedCompany}
					onChange={(v) => contactsFilterStore.setSelectedCompany(typeof v === 'string' ? v : null)}
					placeholder={$_('filters.allCompanies')}
					embedded={true}
					direction="up"
				/>
			{/if}

			<!-- Clear Filters Button -->
			{#if activeFilterCount > 0}
				<button onclick={clearAllFilters} class="clear-btn" title={$_('filters.clearAll')}>
					<X size={14} />
				</button>
			{/if}
		</div>

		<div class="toolbar-divider"></div>

		<!-- Sort Toggle -->
		<PillViewSwitcher
			options={sortOptions}
			value={contactsFilterStore.sortField}
			onChange={handleSortChange}
			embedded={true}
		/>
	{/if}
</div>

<style>
	.toolbar-content-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: hsl(var(--color-border));
		margin: 0 0.25rem;
	}

	/* Network-specific styles */
	.strength-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.strength-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}

	.strength-slider {
		width: 80px;
		height: 4px;
		border-radius: 2px;
		background: hsl(var(--color-muted));
		appearance: none;
		cursor: pointer;
	}

	.strength-slider::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
		transition: transform 0.1s;
	}

	.strength-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.strength-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border: none;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.control-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.control-btn:active {
		transform: scale(0.95);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		background: hsl(var(--destructive) / 0.1);
		border: none;
		border-radius: 0.5rem;
		color: hsl(var(--destructive));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-btn:hover {
		background: hsl(var(--destructive) / 0.15);
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.stat-divider {
		opacity: 0.5;
	}

	/* Filter Group */
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	@media (max-width: 640px) {
		.stats {
			display: none;
		}

		.strength-group {
			flex: 1;
			min-width: 120px;
		}

		.strength-slider {
			flex: 1;
		}
	}
</style>

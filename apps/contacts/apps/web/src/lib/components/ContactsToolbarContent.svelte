<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { PillViewSwitcher, FilterDropdown, type FilterDropdownOption } from '@manacore/shared-ui';
	import { X } from '@manacore/shared-icons';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
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

	// Sort options
	const sortOptions = [
		{ id: 'firstName', label: $_('sort.firstName'), title: $_('sort.firstName') },
		{ id: 'lastName', label: $_('sort.lastName'), title: $_('sort.lastName') },
	];

	function handleSortChange(value: string) {
		contactsFilterStore.setSortField(value as 'firstName' | 'lastName');
	}

	onMount(() => {
		loadTags();
	});
</script>

<div class="toolbar-content-inner">
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
				contactsFilterStore.setContactFilter((typeof v === 'string' ? v : 'all') as ContactFilter)}
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

	/* Filter Group */
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
</style>

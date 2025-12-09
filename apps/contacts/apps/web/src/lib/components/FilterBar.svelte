<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { groupsApi, type ContactGroup, type Contact } from '$lib/api/contacts';

	export type ContactFilter = 'all' | 'favorites' | 'hasPhone' | 'hasEmail' | 'incomplete';
	export type BirthdayFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

	interface Props {
		contacts: Contact[];
		selectedGroupId: string | null;
		onGroupChange: (groupId: string | null) => void;
		contactFilter: ContactFilter;
		onContactFilterChange: (filter: ContactFilter) => void;
		birthdayFilter: BirthdayFilter;
		onBirthdayFilterChange: (filter: BirthdayFilter) => void;
		selectedCompany: string | null;
		onCompanyChange: (company: string | null) => void;
	}

	let {
		contacts,
		selectedGroupId,
		onGroupChange,
		contactFilter,
		onContactFilterChange,
		birthdayFilter,
		onBirthdayFilterChange,
		selectedCompany,
		onCompanyChange,
	}: Props = $props();

	let groups = $state<ContactGroup[]>([]);
	let showFilters = $state(false);
	let loadingGroups = $state(true);

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

	// Count active filters
	let activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedGroupId) count++;
		if (contactFilter !== 'all') count++;
		if (birthdayFilter !== 'all') count++;
		if (selectedCompany) count++;
		return count;
	});

	async function loadGroups() {
		try {
			const response = await groupsApi.list();
			groups = response.groups || [];
		} catch (e) {
			console.error('Failed to load groups:', e);
		} finally {
			loadingGroups = false;
		}
	}

	function clearAllFilters() {
		onGroupChange(null);
		onContactFilterChange('all');
		onBirthdayFilterChange('all');
		onCompanyChange(null);
	}

	onMount(() => {
		loadGroups();
	});
</script>

<div class="filter-bar">
	<!-- Filter Toggle Button -->
	<button
		type="button"
		class="filter-toggle"
		class:active={showFilters || activeFilterCount > 0}
		onclick={() => (showFilters = !showFilters)}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
			/>
		</svg>
		<span>{$_('filters.title')}</span>
		{#if activeFilterCount > 0}
			<span class="filter-badge">{activeFilterCount}</span>
		{/if}
	</button>

	<!-- Filter Pills (shown when filters are active) -->
	{#if activeFilterCount > 0 && !showFilters}
		<div class="active-filters">
			{#if selectedGroupId}
				{@const group = groups.find((g) => g.id === selectedGroupId)}
				{#if group}
					<button type="button" class="filter-pill" onclick={() => onGroupChange(null)}>
						<span class="pill-color" style="background: {group.color || '#6366f1'}"></span>
						{group.name}
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				{/if}
			{/if}
			{#if contactFilter !== 'all'}
				<button type="button" class="filter-pill" onclick={() => onContactFilterChange('all')}>
					{$_(`filters.contact.${contactFilter}`)}
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
			{#if birthdayFilter !== 'all'}
				<button type="button" class="filter-pill" onclick={() => onBirthdayFilterChange('all')}>
					{$_(`filters.birthday.${birthdayFilter}`)}
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
			{#if selectedCompany}
				<button type="button" class="filter-pill" onclick={() => onCompanyChange(null)}>
					{selectedCompany}
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
			<button type="button" class="clear-all-btn" onclick={clearAllFilters}>
				{$_('filters.clearAll')}
			</button>
		</div>
	{/if}

	<!-- Expanded Filter Panel -->
	{#if showFilters}
		<div class="filter-panel">
			<!-- Groups Filter -->
			<div class="filter-section">
				<label class="filter-label">{$_('filters.group')}</label>
				<select
					class="filter-select"
					value={selectedGroupId || ''}
					onchange={(e) => onGroupChange(e.currentTarget.value || null)}
				>
					<option value="">{$_('filters.allGroups')}</option>
					{#each groups as group}
						<option value={group.id}>{group.name}</option>
					{/each}
				</select>
			</div>

			<!-- Contact Info Filter -->
			<div class="filter-section">
				<label class="filter-label">{$_('filters.contactInfo')}</label>
				<select
					class="filter-select"
					value={contactFilter}
					onchange={(e) => onContactFilterChange(e.currentTarget.value as ContactFilter)}
				>
					<option value="all">{$_('filters.contact.all')}</option>
					<option value="favorites">{$_('filters.contact.favorites')}</option>
					<option value="hasPhone">{$_('filters.contact.hasPhone')}</option>
					<option value="hasEmail">{$_('filters.contact.hasEmail')}</option>
					<option value="incomplete">{$_('filters.contact.incomplete')}</option>
				</select>
			</div>

			<!-- Birthday Filter -->
			<div class="filter-section">
				<label class="filter-label">{$_('filters.birthdayLabel')}</label>
				<select
					class="filter-select"
					value={birthdayFilter}
					onchange={(e) => onBirthdayFilterChange(e.currentTarget.value as BirthdayFilter)}
				>
					<option value="all">{$_('filters.birthday.all')}</option>
					<option value="today">{$_('filters.birthday.today')}</option>
					<option value="thisWeek">{$_('filters.birthday.thisWeek')}</option>
					<option value="thisMonth">{$_('filters.birthday.thisMonth')}</option>
				</select>
			</div>

			<!-- Company Filter -->
			{#if companies.length > 0}
				<div class="filter-section">
					<label class="filter-label">{$_('filters.company')}</label>
					<select
						class="filter-select"
						value={selectedCompany || ''}
						onchange={(e) => onCompanyChange(e.currentTarget.value || null)}
					>
						<option value="">{$_('filters.allCompanies')}</option>
						{#each companies as company}
							<option value={company}>{company}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Clear Filters -->
			{#if activeFilterCount > 0}
				<button type="button" class="clear-filters-btn" onclick={clearAllFilters}>
					{$_('filters.clearAll')}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-toggle:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--border));
	}

	.filter-toggle.active {
		color: hsl(var(--primary));
		border-color: hsl(var(--primary) / 0.5);
		background: hsl(var(--primary) / 0.1);
	}

	.filter-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--primary-foreground));
		background: hsl(var(--primary));
		border-radius: 9999px;
	}

	.active-filters {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		background: hsl(var(--muted));
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-pill:hover {
		background: hsl(var(--muted-foreground) / 0.2);
	}

	.pill-color {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
	}

	.clear-all-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}

	.clear-all-btn:hover {
		color: hsl(var(--foreground));
	}

	.filter-panel {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		width: 100%;
		padding: 1rem;
		margin-top: 0.5rem;
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: var(--radius-lg);
		flex-wrap: wrap;
	}

	.filter-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 150px;
		flex: 1;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.filter-select:hover {
		border-color: hsl(var(--primary) / 0.5);
	}

	.filter-select:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.clear-filters-btn {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--muted));
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.clear-filters-btn:hover {
		color: hsl(var(--foreground));
		background: hsl(var(--muted-foreground) / 0.2);
	}

	@media (max-width: 768px) {
		.filter-panel {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-section {
			min-width: auto;
		}
	}
</style>

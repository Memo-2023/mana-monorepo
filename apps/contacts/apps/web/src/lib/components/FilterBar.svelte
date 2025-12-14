<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { tagsApi, type ContactTag, type Contact } from '$lib/api/contacts';

	export type ContactFilter = 'all' | 'favorites' | 'hasPhone' | 'hasEmail' | 'incomplete';
	export type BirthdayFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

	interface Props {
		contacts: Contact[];
		selectedTagId: string | null;
		onTagChange: (tagId: string | null) => void;
		contactFilter: ContactFilter;
		onContactFilterChange: (filter: ContactFilter) => void;
		birthdayFilter: BirthdayFilter;
		onBirthdayFilterChange: (filter: BirthdayFilter) => void;
		selectedCompany: string | null;
		onCompanyChange: (company: string | null) => void;
		/** When embedded in a toolbar, renders as just a button without background container */
		embedded?: boolean;
	}

	let {
		contacts,
		selectedTagId,
		onTagChange,
		contactFilter,
		onContactFilterChange,
		birthdayFilter,
		onBirthdayFilterChange,
		selectedCompany,
		onCompanyChange,
		embedded = false,
	}: Props = $props();

	let tags = $state<ContactTag[]>([]);
	let showFilters = $state(false);
	let loadingTags = $state(true);

	// Portal action - moves element to body to escape overflow constraints
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	// For embedded mode: trigger button ref and dropdown position
	let triggerRef: HTMLButtonElement | undefined = $state();
	let dropdownPosition = $state({ top: 0, left: 0 });

	function toggleFilters() {
		if (!showFilters && triggerRef) {
			const rect = triggerRef.getBoundingClientRect();
			dropdownPosition = {
				top: rect.top - 8, // Position above the button
				left: rect.left + rect.width / 2, // Center horizontally
			};
		}
		showFilters = !showFilters;
	}

	function closeFilters() {
		showFilters = false;
	}

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

	// Count active filters (excluding favorites since it has its own quick button)
	let activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedTagId) count++;
		if (contactFilter !== 'all' && contactFilter !== 'favorites') count++;
		if (birthdayFilter !== 'all') count++;
		if (selectedCompany) count++;
		return count;
	});

	async function loadTags() {
		try {
			const response = await tagsApi.list();
			tags = response.tags || [];
		} catch (e) {
			console.error('Failed to load tags:', e);
		} finally {
			loadingTags = false;
		}
	}

	function clearAllFilters() {
		onTagChange(null);
		// Keep favorites filter if active (controlled by separate quick button)
		if (contactFilter !== 'favorites') {
			onContactFilterChange('all');
		}
		onBirthdayFilterChange('all');
		onCompanyChange(null);
	}

	onMount(() => {
		loadTags();
	});
</script>

{#if embedded}
	<!-- Embedded mode: just the button for use in a toolbar -->
	<div class="filter-bar-embedded">
		<button
			bind:this={triggerRef}
			type="button"
			class="filter-toggle-embedded"
			class:active={showFilters || activeFilterCount > 0}
			onclick={toggleFilters}
			title={$_('filters.title')}
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
				/>
			</svg>
			{#if activeFilterCount > 0}
				<span class="filter-badge-embedded">{activeFilterCount}</span>
			{/if}
		</button>

		<!-- Portal: Backdrop for click-outside -->
		{#if showFilters}
			<button
				use:portal
				type="button"
				class="filter-backdrop"
				onclick={closeFilters}
				aria-label="Close filters"
			></button>

			<!-- Portal: Dropdown panel -->
			<div
				use:portal
				class="filter-dropdown-portal"
				style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
				transition:fly={{ duration: 150, y: 8 }}
			>
				<!-- Tags Filter -->
				<div class="filter-section">
					<label class="filter-label">{$_('filters.tag')}</label>
					<select
						class="filter-select"
						value={selectedTagId || ''}
						onchange={(e) => onTagChange(e.currentTarget.value || null)}
					>
						<option value="">{$_('filters.allTags')}</option>
						{#each tags as tag}
							<option value={tag.id}>{tag.name}</option>
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
{:else}
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
				{#if selectedTagId}
					{@const tag = tags.find((t) => t.id === selectedTagId)}
					{#if tag}
						<button type="button" class="filter-pill" onclick={() => onTagChange(null)}>
							<span class="pill-color" style="background: {tag.color || '#6366f1'}"></span>
							{tag.name}
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
				{#if contactFilter !== 'all' && contactFilter !== 'favorites'}
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
				<!-- Tags Filter -->
				<div class="filter-section">
					<label class="filter-label">{$_('filters.tag')}</label>
					<select
						class="filter-select"
						value={selectedTagId || ''}
						onchange={(e) => onTagChange(e.currentTarget.value || null)}
					>
						<option value="">{$_('filters.allTags')}</option>
						{#each tags as tag}
							<option value={tag.id}>{tag.name}</option>
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
{/if}

<style>
	/* Embedded mode styles */
	.filter-bar-embedded {
		position: relative;
		display: flex;
		align-items: center;
	}

	.filter-toggle-embedded {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: #374151;
		transition: all 0.15s ease;
	}

	:global(.dark) .filter-toggle-embedded {
		color: #f3f4f6;
	}

	.filter-toggle-embedded:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .filter-toggle-embedded:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.filter-toggle-embedded.active {
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
	}

	.filter-toggle-embedded :global(svg) {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.filter-badge-embedded {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		color: white;
		background: #3b82f6;
		border-radius: 9999px;
	}

	/* Portal backdrop - full screen invisible button for click-outside */
	:global(.filter-backdrop) {
		position: fixed;
		inset: 0;
		z-index: 99990;
		background: transparent;
		border: none;
		cursor: default;
	}

	/* Portal dropdown - unified with ContextMenu design */
	:global(.filter-dropdown-portal) {
		position: fixed;
		transform: translate(-50%, -100%);
		min-width: 280px;
		max-width: 320px;
		padding: 0.375rem;
		background: var(--color-surface-elevated-3, hsl(var(--color-surface)));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.15),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
		z-index: 99991;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	/* Portal dropdown sections - unified with ContextMenu item design */
	:global(.filter-dropdown-portal) .filter-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: var(--radius-md, 0.5rem);
	}

	:global(.filter-dropdown-portal) .filter-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.filter-dropdown-portal) .filter-select {
		width: 100%;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-muted) / 0.5);
		border: 1px solid transparent;
		border-radius: var(--radius-md, 0.5rem);
		cursor: pointer;
		transition: all 100ms ease;
	}

	:global(.filter-dropdown-portal) .filter-select:hover {
		background: hsl(var(--color-muted));
	}

	:global(.filter-dropdown-portal) .filter-select:focus {
		outline: none;
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-muted));
	}

	:global(.filter-dropdown-portal) .clear-filters-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin-top: 0.25rem;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: var(--radius-md, 0.5rem);
		cursor: pointer;
		transition: all 100ms ease;
	}

	:global(.filter-dropdown-portal) .clear-filters-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	/* Standard mode styles */
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

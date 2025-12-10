<script lang="ts">
	import type { CommunityTheme, CommunityThemeQuery } from '@manacore/shared-theme';
	import {
		MagnifyingGlass,
		SortAscending,
		Funnel,
		Star,
		Fire,
		Clock,
		DownloadSimple,
		CaretLeft,
		CaretRight,
	} from '@manacore/shared-icons';
	import ThemeCommunityCard from './ThemeCommunityCard.svelte';

	interface Props {
		/** List of community themes */
		themes: CommunityTheme[];
		/** Pagination info */
		pagination?: {
			page: number;
			totalPages: number;
			total: number;
		};
		/** Current query */
		currentQuery?: CommunityThemeQuery;
		/** Loading state */
		loading?: boolean;
		/** Current user's effective mode */
		effectiveMode?: 'light' | 'dark';
		/** Callback when query changes */
		onQueryChange?: (query: CommunityThemeQuery) => void;
		/** Callback when theme is selected */
		onSelectTheme?: (theme: CommunityTheme) => void;
		/** Callback when download is clicked */
		onDownloadTheme?: (theme: CommunityTheme) => void;
		/** Callback when favorite is toggled */
		onToggleFavorite?: (theme: CommunityTheme) => void;
		/** Callback when theme is rated */
		onRateTheme?: (theme: CommunityTheme, rating: number) => void;
	}

	let {
		themes,
		pagination = { page: 1, totalPages: 1, total: 0 },
		currentQuery = {},
		loading = false,
		effectiveMode = 'light',
		onQueryChange,
		onSelectTheme,
		onDownloadTheme,
		onToggleFavorite,
		onRateTheme,
	}: Props = $props();

	// Local state for search input
	let searchInput = $state(currentQuery.search ?? '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Sort options
	const sortOptions: { value: CommunityThemeQuery['sort']; label: string; icon: typeof Star }[] = [
		{ value: 'popular', label: 'Beliebt', icon: Fire },
		{ value: 'recent', label: 'Neueste', icon: Clock },
		{ value: 'rating', label: 'Bestbewertet', icon: Star },
		{ value: 'downloads', label: 'Downloads', icon: DownloadSimple },
	];

	// Common tags for filtering
	const commonTags = ['minimal', 'dark', 'colorful', 'professional', 'nature', 'warm', 'cool'];

	// Handle search with debounce
	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchInput = target.value;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			onQueryChange?.({ ...currentQuery, search: searchInput || undefined, page: 1 });
		}, 300);
	}

	function handleSortChange(sort: CommunityThemeQuery['sort']) {
		onQueryChange?.({ ...currentQuery, sort, page: 1 });
	}

	function handleTagToggle(tag: string) {
		const currentTags = currentQuery.tags ?? [];
		const newTags = currentTags.includes(tag)
			? currentTags.filter((t) => t !== tag)
			: [...currentTags, tag];

		onQueryChange?.({ ...currentQuery, tags: newTags.length ? newTags : undefined, page: 1 });
	}

	function handleFeaturedToggle() {
		onQueryChange?.({
			...currentQuery,
			featuredOnly: !currentQuery.featuredOnly,
			page: 1,
		});
	}

	function handlePageChange(page: number) {
		if (page < 1 || page > pagination.totalPages) return;
		onQueryChange?.({ ...currentQuery, page });
	}

	function clearFilters() {
		searchInput = '';
		onQueryChange?.({ page: 1, sort: 'popular' });
	}

	// Check if any filters are active
	let hasActiveFilters = $derived(
		!!currentQuery.search || !!currentQuery.tags?.length || !!currentQuery.featuredOnly
	);
</script>

<div class="flex flex-col gap-4">
	<!-- Search & Filters -->
	<div class="flex flex-wrap gap-3 items-center">
		<!-- Search -->
		<div class="flex-1 min-w-[200px] relative">
			<MagnifyingGlass
				size={18}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
			/>
			<input
				type="search"
				class="w-full py-2.5 px-3 pl-10 text-sm bg-input border border-border rounded-lg text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
				placeholder="Themes suchen..."
				value={searchInput}
				oninput={handleSearchInput}
			/>
		</div>

		<!-- Sort -->
		<div class="flex items-center gap-2">
			<SortAscending size={16} class="text-muted-foreground" />
			<select
				class="py-2 px-3 text-sm bg-input border border-border rounded-lg text-foreground cursor-pointer focus:outline-none focus:border-primary"
				value={currentQuery.sort ?? 'popular'}
				onchange={(e) =>
					handleSortChange((e.target as HTMLSelectElement).value as CommunityThemeQuery['sort'])}
			>
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<!-- Featured Toggle -->
		<button
			type="button"
			class="flex items-center gap-1.5 py-2 px-3 text-sm font-medium border rounded-lg cursor-pointer transition-all
			{currentQuery.featuredOnly
				? 'bg-primary/10 border-primary text-primary'
				: 'bg-muted border-border text-foreground hover:bg-muted/80'}"
			onclick={handleFeaturedToggle}
		>
			<Star size={16} weight={currentQuery.featuredOnly ? 'fill' : 'regular'} />
			Featured
		</button>
	</div>

	<!-- Tag Filters -->
	<div class="flex flex-wrap items-center gap-2">
		<Funnel size={14} class="text-muted-foreground" />
		{#each commonTags as tag}
			<button
				type="button"
				class="px-2.5 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all
				{currentQuery.tags?.includes(tag)
					? 'bg-primary/10 border border-primary/30 text-primary'
					: 'bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}"
				onclick={() => handleTagToggle(tag)}
			>
				{tag}
			</button>
		{/each}

		{#if hasActiveFilters}
			<button
				type="button"
				class="px-2.5 py-1.5 text-xs font-medium bg-transparent border border-dashed border-border rounded-full text-muted-foreground cursor-pointer transition-all hover:border-primary hover:text-primary"
				onclick={clearFilters}
			>
				Filter löschen
			</button>
		{/if}
	</div>

	<!-- Results Info -->
	<div class="py-2">
		{#if loading}
			<span class="text-sm text-muted-foreground">Lade...</span>
		{:else}
			<span class="text-sm text-muted-foreground">{pagination.total} Themes gefunden</span>
		{/if}
	</div>

	<!-- Theme Grid -->
	<div
		class="grid gap-4 transition-opacity duration-200
		{loading ? 'opacity-60 pointer-events-none' : ''}
		grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
	>
		{#if themes.length === 0 && !loading}
			<div class="col-span-full text-center py-12">
				<p class="text-lg font-semibold text-foreground mb-2">Keine Themes gefunden</p>
				<p class="text-sm text-muted-foreground mb-4">Versuche andere Suchbegriffe oder Filter.</p>
				{#if hasActiveFilters}
					<button
						type="button"
						class="py-2 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						onclick={clearFilters}
					>
						Filter zurücksetzen
					</button>
				{/if}
			</div>
		{:else}
			{#each themes as theme (theme.id)}
				<ThemeCommunityCard
					{theme}
					{effectiveMode}
					onSelect={onSelectTheme}
					onDownload={onDownloadTheme}
					{onToggleFavorite}
					onRate={onRateTheme}
				/>
			{/each}
		{/if}
	</div>

	<!-- Pagination -->
	{#if pagination.totalPages > 1}
		<div class="flex justify-center items-center gap-4 pt-4">
			<button
				type="button"
				class="flex items-center justify-center w-9 h-9 bg-muted border border-border rounded-lg text-foreground transition-all hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={pagination.page <= 1}
				onclick={() => handlePageChange(pagination.page - 1)}
				aria-label="Vorherige Seite"
			>
				<CaretLeft size={18} />
			</button>

			<div class="flex items-center gap-1 text-sm">
				<span class="font-semibold text-foreground">{pagination.page}</span>
				<span class="text-muted-foreground">/</span>
				<span class="text-muted-foreground">{pagination.totalPages}</span>
			</div>

			<button
				type="button"
				class="flex items-center justify-center w-9 h-9 bg-muted border border-border rounded-lg text-foreground transition-all hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={pagination.page >= pagination.totalPages}
				onclick={() => handlePageChange(pagination.page + 1)}
				aria-label="Nächste Seite"
			>
				<CaretRight size={18} />
			</button>
		</div>
	{/if}
</div>

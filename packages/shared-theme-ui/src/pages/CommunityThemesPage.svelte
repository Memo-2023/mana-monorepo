<script lang="ts">
	import type {
		CommunityTheme,
		CommunityThemeQuery,
		PaginatedCommunityThemes,
		CustomThemesStore,
	} from '@manacore/shared-theme';
	import { ArrowLeft, Heart, DownloadSimple } from '@manacore/shared-icons';
	import CommunityThemeGallery from '../components/community/CommunityThemeGallery.svelte';

	type TabType = 'browse' | 'favorites' | 'downloaded';

	interface Props {
		/** Custom themes store */
		store: CustomThemesStore;
		/** Current effective mode */
		effectiveMode?: 'light' | 'dark';
		/** Callback to navigate back */
		onBack?: () => void;
		/** Callback when a theme is selected for details */
		onSelectTheme?: (theme: CommunityTheme) => void;
		/** Page title */
		title?: string;
		/** Initial tab */
		initialTab?: TabType;
	}

	let {
		store,
		effectiveMode = 'light',
		onBack,
		onSelectTheme,
		title = 'Community Themes',
		initialTab = 'browse',
	}: Props = $props();

	// Active tab
	let activeTab = $state<TabType>(initialTab);

	// Current query for browsing
	let currentQuery = $state<CommunityThemeQuery>({
		page: 1,
		sort: 'popular',
	});

	// Load data based on active tab
	$effect(() => {
		if (activeTab === 'browse') {
			store.browseCommunity(currentQuery);
		} else if (activeTab === 'favorites') {
			store.loadFavorites();
		} else if (activeTab === 'downloaded') {
			store.loadDownloaded();
		}
	});

	function handleQueryChange(query: CommunityThemeQuery) {
		currentQuery = query;
		store.browseCommunity(query);
	}

	async function handleDownload(theme: CommunityTheme) {
		await store.downloadTheme(theme.id);
	}

	async function handleToggleFavorite(theme: CommunityTheme) {
		await store.toggleFavorite(theme.id);
	}

	async function handleRate(theme: CommunityTheme, rating: number) {
		await store.rateTheme(theme.id, rating);
	}

	function handleApplyTheme(theme: CommunityTheme) {
		store.applyCustomTheme(theme);
	}

	// Tab definitions
	const tabs: { id: TabType; label: string; icon: typeof Heart }[] = [
		{ id: 'browse', label: 'Entdecken', icon: DownloadSimple },
		{ id: 'favorites', label: 'Favoriten', icon: Heart },
		{ id: 'downloaded', label: 'Installiert', icon: DownloadSimple },
	];

	// Get themes for current tab
	let displayThemes = $derived(() => {
		switch (activeTab) {
			case 'browse':
				return store.communityThemes;
			case 'favorites':
				return store.favorites;
			case 'downloaded':
				return store.downloaded;
			default:
				return [];
		}
	});
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="flex items-start gap-4 p-6 border-b border-border bg-surface">
		{#if onBack}
			<button
				type="button"
				class="flex items-center justify-center w-10 h-10 bg-muted rounded-lg text-foreground hover:bg-muted/80 transition-colors flex-shrink-0"
				onclick={onBack}
				aria-label="Zurück"
			>
				<ArrowLeft size={20} weight="bold" />
			</button>
		{/if}
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-foreground">{title}</h1>
			<p class="text-sm text-muted-foreground mt-1">Entdecke von der Community erstellte Themes</p>
		</div>
	</header>

	<!-- Tabs -->
	<div class="bg-surface border-b border-border px-6">
		<nav class="flex gap-2 overflow-x-auto" role="tablist">
			{#each tabs as tab}
				<button
					type="button"
					class="flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
					{activeTab === tab.id
						? 'text-primary border-primary'
						: 'text-muted-foreground border-transparent hover:text-foreground'}"
					onclick={() => (activeTab = tab.id)}
					role="tab"
					aria-selected={activeTab === tab.id}
				>
					<svelte:component
						this={tab.icon}
						size={16}
						weight={activeTab === tab.id ? 'fill' : 'regular'}
					/>
					{tab.label}
					{#if tab.id === 'favorites' && store.favorites.length > 0}
						<span
							class="px-2 py-0.5 text-xs font-semibold rounded-full
						{activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted'}"
						>
							{store.favorites.length}
						</span>
					{:else if tab.id === 'downloaded' && store.downloaded.length > 0}
						<span
							class="px-2 py-0.5 text-xs font-semibold rounded-full
						{activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted'}"
						>
							{store.downloaded.length}
						</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Content -->
	<div class="p-6 max-w-6xl mx-auto">
		{#if activeTab === 'browse'}
			<CommunityThemeGallery
				themes={store.communityThemes}
				pagination={store.pagination}
				{currentQuery}
				loading={store.loading}
				{effectiveMode}
				onQueryChange={handleQueryChange}
				{onSelectTheme}
				onDownloadTheme={handleDownload}
				onToggleFavorite={handleToggleFavorite}
				onRateTheme={handleRate}
			/>
		{:else if activeTab === 'favorites'}
			{#if store.favorites.length === 0 && !store.loading}
				<div class="text-center py-16 text-muted-foreground">
					<Heart size={48} weight="light" class="mx-auto mb-4" />
					<h3 class="text-xl font-semibold text-foreground mb-2">Keine Favoriten</h3>
					<p class="text-sm mb-6">Themes, die du favorisierst, werden hier angezeigt.</p>
					<button
						type="button"
						class="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						onclick={() => (activeTab = 'browse')}
					>
						Themes entdecken
					</button>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each store.favorites as theme (theme.id)}
						{@const colors = effectiveMode === 'dark' ? theme.darkColors : theme.lightColors}
						<div
							class="cursor-pointer outline-none group"
							onclick={() => onSelectTheme?.(theme)}
							onkeypress={(e) => e.key === 'Enter' && onSelectTheme?.(theme)}
							role="button"
							tabindex="0"
						>
							<div
								class="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 transition-all hover:border-border-strong hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2"
							>
								<div class="flex gap-1">
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.primary})"
									></div>
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.background})"
									></div>
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.surface})"
									></div>
								</div>
								<div class="flex-1 flex items-center gap-2 min-w-0">
									<span class="text-xl">{theme.emoji}</span>
									<span class="font-semibold text-foreground truncate">{theme.name}</span>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										class="px-3 py-2 text-xs font-medium bg-muted border border-border rounded-md text-foreground hover:bg-muted/80 transition-colors"
										onclick={(e) => {
											e.stopPropagation();
											handleApplyTheme(theme);
										}}
									>
										Anwenden
									</button>
									<button
										type="button"
										class="p-2 text-red-500 bg-muted border border-border rounded-md hover:bg-red-500/10 transition-colors"
										onclick={(e) => {
											e.stopPropagation();
											handleToggleFavorite(theme);
										}}
									>
										<Heart size={18} weight="fill" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'downloaded'}
			{#if store.downloaded.length === 0 && !store.loading}
				<div class="text-center py-16 text-muted-foreground">
					<DownloadSimple size={48} weight="light" class="mx-auto mb-4" />
					<h3 class="text-xl font-semibold text-foreground mb-2">Keine installierten Themes</h3>
					<p class="text-sm mb-6">Themes, die du installierst, werden hier angezeigt.</p>
					<button
						type="button"
						class="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
						onclick={() => (activeTab = 'browse')}
					>
						Themes entdecken
					</button>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each store.downloaded as theme (theme.id)}
						{@const colors = effectiveMode === 'dark' ? theme.darkColors : theme.lightColors}
						<div
							class="cursor-pointer outline-none group"
							onclick={() => onSelectTheme?.(theme)}
							onkeypress={(e) => e.key === 'Enter' && onSelectTheme?.(theme)}
							role="button"
							tabindex="0"
						>
							<div
								class="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 transition-all hover:border-border-strong hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2"
							>
								<div class="flex gap-1">
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.primary})"
									></div>
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.background})"
									></div>
									<div
										class="w-5 h-5 rounded-full border border-border"
										style="background-color: hsl({colors.surface})"
									></div>
								</div>
								<div class="flex-1 flex items-center gap-2 min-w-0">
									<span class="text-xl">{theme.emoji}</span>
									<span class="font-semibold text-foreground truncate">{theme.name}</span>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										class="px-3 py-2 text-xs font-medium bg-primary text-primary-foreground border border-primary rounded-md hover:bg-primary/90 transition-colors"
										onclick={(e) => {
											e.stopPropagation();
											handleApplyTheme(theme);
										}}
									>
										Anwenden
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

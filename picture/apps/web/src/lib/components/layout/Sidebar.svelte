<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentTheme } from '$lib/stores/theme';
	import { viewMode, cycleViewMode, type ViewMode } from '$lib/stores/view';
	import { isSidebarCollapsed, setSidebarCollapsed } from '$lib/stores/sidebar';
	import {
		exploreSearchQuery,
		exploreSortBy,
		isLoadingExplore,
		exploreImages,
		currentExplorePage,
		hasMoreExplore,
		showExploreFavoritesOnly
	} from '$lib/stores/explore';
	import { tags, selectedTags } from '$lib/stores/tags';
	import { showFavoritesOnly } from '$lib/stores/images';
	import { searchPublicImages, getPublicImages } from '$lib/api/explore';
	import { showKeyboardShortcuts } from '$lib/stores/ui';
	import TagPills from '$lib/components/tags/TagPills.svelte';

	let showUserMenu = $state(false);
	let searchInput = $state('');
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/auth/login');
	}

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	function getViewModeIcon(mode: ViewMode) {
		switch (mode) {
			case 'single':
				return 'M4 6h16M4 12h16M4 18h16';
			case 'grid3':
				return 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z';
			case 'grid5':
				return 'M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5z';
		}
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchInput = target.value;

		if (searchTimeout) clearTimeout(searchTimeout);

		searchTimeout = setTimeout(async () => {
			exploreSearchQuery.set(searchInput);
			if (searchInput.trim()) {
				isLoadingExplore.set(true);
				try {
					const results = await searchPublicImages(searchInput, 1, 20, $showExploreFavoritesOnly);
					exploreImages.set(results);
					currentExplorePage.set(1);
					hasMoreExplore.set(results.length === 20);
				} catch (error) {
					console.error('Search error:', error);
				} finally {
					isLoadingExplore.set(false);
				}
			} else {
				isLoadingExplore.set(true);
				try {
					const data = await getPublicImages({
						page: 1,
						sortBy: $exploreSortBy,
						favoritesOnly: $showExploreFavoritesOnly
					});
					exploreImages.set(data);
					currentExplorePage.set(1);
					hasMoreExplore.set(data.length === 20);
				} finally {
					isLoadingExplore.set(false);
				}
			}
		}, 300);
	}

	async function handleSortChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		exploreSortBy.set(target.value as 'recent' | 'popular' | 'trending');
		isLoadingExplore.set(true);
		try {
			const data = await getPublicImages({
				page: 1,
				sortBy: target.value as any,
				favoritesOnly: $showExploreFavoritesOnly
			});
			exploreImages.set(data);
			currentExplorePage.set(1);
			hasMoreExplore.set(data.length === 20);
		} finally {
			isLoadingExplore.set(false);
		}
	}

	interface NavItem {
		path: string;
		label: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{
			path: '/app/gallery',
			label: 'Galerie',
			icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
		},
		{
			path: '/app/board',
			label: 'Moodboards',
			icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z'
		},
		{
			path: '/app/explore',
			label: 'Entdecken',
			icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
		},
		{
			path: '/app/generate',
			label: 'Generieren',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z'
		},
		{
			path: '/app/upload',
			label: 'Upload',
			icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
		},
		{
			path: '/app/tags',
			label: 'Tags',
			icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
		},
		{
			path: '/app/archive',
			label: 'Archiv',
			icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
		},
		{
			path: '/app/subscription',
			label: 'Abonnement',
			icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		}
	];
</script>

<!-- Sidebar Toggle Button (collapsed) -->
<button
	onclick={() => setSidebarCollapsed(false)}
	class="fixed bottom-8 left-4 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-blue-700/90 dark:bg-blue-500/90 dark:hover:bg-blue-600/90 lg:flex"
	class:-translate-x-[calc(100%+2rem)]={!$isSidebarCollapsed}
	aria-label="Sidebar öffnen"
>
	<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
	</svg>
</button>

<!-- Sidebar for Desktop -->
<aside
	class="fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-64 flex-col overflow-hidden rounded-3xl border border-gray-200/50 bg-white/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:border-gray-700/50 dark:bg-gray-900/80 lg:flex"
	class:-translate-x-[calc(100%+2rem)]={$isSidebarCollapsed}
>
	<!-- Logo & Collapse Button -->
	<div class="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200/50 px-6 dark:border-gray-700/50">
		<a href="/app/gallery" class="text-2xl font-bold text-gray-900 dark:text-gray-100">
			Picture
		</a>
		<button
			onclick={() => setSidebarCollapsed(true)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 backdrop-blur-xl transition-colors hover:bg-gray-100/80 hover:text-gray-600 dark:hover:bg-gray-800/80 dark:hover:text-gray-300"
			aria-label="Sidebar schließen"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={item.path}
				class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all {active
					? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
			>
				<svg
					class="h-5 w-5 {active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span>{item.label}</span>
			</a>
		{/each}

		<!-- Divider -->
		<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

		<!-- Help / Keyboard Shortcuts -->
		<button
			onclick={() => showKeyboardShortcuts.set(true)}
			class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
		>
			<svg
				class="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>Tastaturkürzel</span>
		</button>

		<!-- Divider -->
		<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

		<!-- View Mode Switcher -->
		<div class="px-3 py-2">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
				Ansicht
			</p>
			<div class="grid grid-cols-3 gap-2">
				<button
					onclick={() => viewMode.set('single')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode === 'single'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Liste"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<button
					onclick={() => viewMode.set('grid3')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode === 'grid3'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Mittel"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
					</svg>
				</button>
				<button
					onclick={() => viewMode.set('grid5')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode === 'grid5'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Klein"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM10 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM16 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Explore Controls (only on explore page) -->
		{#if isActive('/app/explore')}
			<div class="space-y-3 px-3 py-2">
				<div class="border-t border-gray-200 pb-2 dark:border-gray-700"></div>

				<div>
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Filter
						</p>
						{#if $showExploreFavoritesOnly}
							<button
								onclick={() => showExploreFavoritesOnly.set(false)}
								class="text-xs text-blue-600 hover:underline dark:text-blue-400"
							>
								Zurücksetzen
							</button>
						{/if}
					</div>

					<!-- Favorites Toggle -->
					<button
						onclick={() => showExploreFavoritesOnly.update(v => !v)}
						class="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {$showExploreFavoritesOnly
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
					>
						<svg
							class="h-4 w-4"
							fill={$showExploreFavoritesOnly ? 'currentColor' : 'none'}
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
						<span>Favoriten</span>
					</button>
				</div>

				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Suchen
					</p>
					<div class="relative">
						<input
							type="text"
							value={searchInput}
							oninput={handleSearchInput}
							placeholder="Prompts..."
							class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
						/>
						<svg
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
				</div>

				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Sortieren
					</p>
					<select
						value={$exploreSortBy}
						onchange={handleSortChange}
						class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					>
						<option value="recent">Neueste</option>
						<option value="popular">Beliebt</option>
						<option value="trending">Im Trend</option>
					</select>
				</div>
			</div>
		{/if}

		<!-- Gallery Filters (only on gallery page) -->
		{#if isActive('/app/gallery')}
			<div class="space-y-3 px-3 py-2">
				<div class="border-t border-gray-200 pb-2 dark:border-gray-700"></div>

				<div>
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Filter
						</p>
						{#if $selectedTags.length > 0 || $showFavoritesOnly}
							<button
								onclick={() => {
									selectedTags.set([]);
									showFavoritesOnly.set(false);
								}}
								class="text-xs text-blue-600 hover:underline dark:text-blue-400"
							>
								Zurücksetzen
							</button>
						{/if}
					</div>

					<!-- Favorites Toggle -->
					<button
						onclick={() => showFavoritesOnly.update(v => !v)}
						class="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {$showFavoritesOnly
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
					>
						<svg
							class="h-4 w-4"
							fill={$showFavoritesOnly ? 'currentColor' : 'none'}
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
						<span>Favoriten</span>
					</button>

					{#if $tags.length > 0}
						<TagPills />
					{:else}
						<p class="text-xs text-gray-500 dark:text-gray-400">
							Keine Tags vorhanden
						</p>
					{/if}
				</div>

				{#if $selectedTags.length > 0 || $showFavoritesOnly}
					<div class="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
						<p class="text-xs font-medium text-blue-900 dark:text-blue-100">
							{#if $showFavoritesOnly && $selectedTags.length > 0}
								Favoriten + {$selectedTags.length} {$selectedTags.length === 1 ? 'Tag' : 'Tags'}
							{:else if $showFavoritesOnly}
								Favoriten
							{:else}
								{$selectedTags.length} {$selectedTags.length === 1 ? 'Tag' : 'Tags'} ausgewählt
							{/if}
						</p>
					</div>
				{/if}
			</div>
		{/if}

	</nav>

	<!-- User Section -->
	<div class="flex-shrink-0 border-t border-gray-200/50 p-3 dark:border-gray-700/50">
		<div class="relative">
			<button
				onclick={() => (showUserMenu = !showUserMenu)}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
			>
				<div
					class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
					style="background-color: {$currentTheme.primary.default};"
				>
					{$user?.email?.charAt(0).toUpperCase()}
				</div>
				<div class="flex-1 overflow-hidden text-left">
					<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
						{$user?.email?.split('@')[0]}
					</p>
					<p class="truncate text-xs text-gray-500 dark:text-gray-400">Account</p>
				</div>
				<svg
					class="h-4 w-4 text-gray-400 transition-transform {showUserMenu ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if showUserMenu}
				<div
					class="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-gray-200/50 bg-white/95 shadow-lg backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95"
				>
					<a
						href="/app/profile"
						onclick={() => (showUserMenu = false)}
						class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						Profil & Einstellungen
					</a>
					<button
						onclick={handleLogout}
						class="flex w-full items-center gap-3 border-t border-gray-200 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-red-400 dark:hover:bg-gray-700"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
						Abmelden
					</button>
				</div>
			{/if}
		</div>
	</div>
</aside>

<!-- Mobile Header -->
<header class="fixed left-0 right-0 top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:hidden">
	<div class="flex h-16 items-center justify-between px-4">
		<!-- Logo -->
		<a href="/app/gallery" class="text-xl font-bold text-gray-900 dark:text-gray-100">
			Picture
		</a>

		<!-- User Avatar -->
		<button
			onclick={() => (showUserMenu = !showUserMenu)}
			class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
			style="background-color: {$currentTheme.primary.default};"
		>
			{$user?.email?.charAt(0).toUpperCase()}
		</button>
	</div>

	<!-- Mobile User Menu -->
	{#if showUserMenu}
		<div class="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
			<nav class="flex flex-col">
				{#each navItems as item}
					{@const active = isActive(item.path)}
					<a
						href={item.path}
						onclick={() => (showUserMenu = false)}
						class="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm font-medium transition-colors last:border-b-0 {active
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}"
					>
						<svg
							class="h-5 w-5 {active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						{item.label}
					</a>
				{/each}
				<a
					href="/app/profile"
					onclick={() => (showUserMenu = false)}
					class="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					Profil & Einstellungen
				</a>
				<button
					onclick={handleLogout}
					class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-800"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					Abmelden
				</button>
			</nav>
		</div>
	{/if}
</header>

<!-- Mobile Bottom Navigation -->
<nav
	class="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white pb-safe dark:border-gray-700 dark:bg-gray-900 lg:hidden"
>
	<div class="grid grid-cols-4 gap-1 px-2 py-2">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={item.path}
				class="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors {active
					? 'text-blue-600 dark:text-blue-400'
					: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span class="text-xs font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

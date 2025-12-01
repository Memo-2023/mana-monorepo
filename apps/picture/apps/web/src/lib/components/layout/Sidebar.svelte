<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { viewMode, cycleViewMode, type ViewMode } from '$lib/stores/view';
	import { isSidebarCollapsed, setSidebarCollapsed } from '$lib/stores/sidebar';
	import {
		exploreSearchQuery,
		exploreSortBy,
		isLoadingExplore,
		exploreImages,
		currentExplorePage,
		hasMoreExplore,
		showExploreFavoritesOnly,
	} from '$lib/stores/explore';
	import { tags, selectedTags } from '$lib/stores/tags';
	import { showFavoritesOnly } from '$lib/stores/images';
	import { searchPublicImages, getPublicImages } from '$lib/api/explore';
	import { showKeyboardShortcuts } from '$lib/stores/ui';
	import TagPills from '$lib/components/tags/TagPills.svelte';
	import {
		List,
		Image,
		SquaresFour,
		Square,
		MagnifyingGlass,
		Lightning,
		CloudArrowUp,
		Tag,
		Archive,
		Question,
		CaretLeft,
		CaretDown,
		User,
		SignOut,
		Heart,
	} from '@manacore/shared-icons';

	let showUserMenu = $state(false);
	let searchInput = $state('');
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	async function handleLogout() {
		await authStore.signOut();
		goto('/auth/login');
	}

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	type IconName =
		| 'gallery'
		| 'board'
		| 'explore'
		| 'generate'
		| 'upload'
		| 'tags'
		| 'archive'
		| 'mana';

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
						favoritesOnly: $showExploreFavoritesOnly,
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
				favoritesOnly: $showExploreFavoritesOnly,
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
		iconName: IconName;
	}

	const navItems: NavItem[] = [
		{ path: '/app/gallery', label: 'Galerie', iconName: 'gallery' },
		{ path: '/app/board', label: 'Moodboards', iconName: 'board' },
		{ path: '/app/explore', label: 'Entdecken', iconName: 'explore' },
		{ path: '/app/generate', label: 'Generieren', iconName: 'generate' },
		{ path: '/app/upload', label: 'Upload', iconName: 'upload' },
		{ path: '/app/tags', label: 'Tags', iconName: 'tags' },
		{ path: '/app/archive', label: 'Archiv', iconName: 'archive' },
		{ path: '/app/mana', label: 'Mana', iconName: 'mana' },
	];
</script>

<!-- Sidebar Toggle Button (collapsed) -->
<button
	onclick={() => setSidebarCollapsed(false)}
	class="fixed bottom-8 left-4 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-blue-700/90 lg:flex dark:bg-blue-500/90 dark:hover:bg-blue-600/90"
	class:-translate-x-[calc(100%+2rem)]={!$isSidebarCollapsed}
	aria-label="Sidebar öffnen"
>
	<List size={24} weight="bold" />
</button>

<!-- Sidebar for Desktop -->
<aside
	class="fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-64 flex-col overflow-hidden rounded-3xl border border-gray-200/50 bg-white/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:flex dark:border-gray-700/50 dark:bg-gray-900/80"
	class:-translate-x-[calc(100%+2rem)]={$isSidebarCollapsed}
>
	<!-- Logo & Collapse Button -->
	<div
		class="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200/50 px-6 dark:border-gray-700/50"
	>
		<a href="/app/gallery" class="text-2xl font-bold text-gray-900 dark:text-gray-100"> Picture </a>
		<button
			onclick={() => setSidebarCollapsed(true)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 backdrop-blur-xl transition-colors hover:bg-gray-100/80 hover:text-gray-600 dark:hover:bg-gray-800/80 dark:hover:text-gray-300"
			aria-label="Sidebar schließen"
		>
			<CaretLeft size={20} weight="bold" />
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
				<span
					class={active
						? 'text-blue-600 dark:text-blue-400'
						: 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}
				>
					{#if item.iconName === 'gallery'}
						<Image size={20} />
					{:else if item.iconName === 'board'}
						<SquaresFour size={20} />
					{:else if item.iconName === 'explore'}
						<MagnifyingGlass size={20} />
					{:else if item.iconName === 'generate'}
						<Lightning size={20} />
					{:else if item.iconName === 'upload'}
						<CloudArrowUp size={20} />
					{:else if item.iconName === 'tags'}
						<Tag size={20} />
					{:else if item.iconName === 'archive'}
						<Archive size={20} />
					{:else if item.iconName === 'mana'}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12.3 1c.03.05 7.3 9.67 7.3 13.7 0 4.03-3.27 7.3-7.3 7.3S5 18.73 5 14.7C5 10.66 12.3 1 12.3 1zm0 6.4c-.02.03-3.65 4.83-3.65 6.84 0 2.02 1.64 3.65 3.65 3.65s3.65-1.64 3.65-3.65c0-2.01-3.62-6.81-3.65-6.84z"
							/>
						</svg>
					{/if}
				</span>
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
			<span
				class="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
			>
				<Question size={20} />
			</span>
			<span>Tastaturkürzel</span>
		</button>

		<!-- Divider -->
		<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

		<!-- View Mode Switcher -->
		<div class="px-3 py-2">
			<p
				class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
			>
				Ansicht
			</p>
			<div class="grid grid-cols-3 gap-2">
				<button
					onclick={() => viewMode.set('single')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode ===
					'single'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Liste"
				>
					<List size={20} weight="bold" />
				</button>
				<button
					onclick={() => viewMode.set('grid3')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode ===
					'grid3'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Mittel"
				>
					<SquaresFour size={20} weight="bold" />
				</button>
				<button
					onclick={() => viewMode.set('grid5')}
					class="flex items-center justify-center rounded-lg p-2 backdrop-blur-xl transition-colors {$viewMode ===
					'grid5'
						? 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
						: 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300'}"
					title="Klein"
				>
					<Square size={20} weight="bold" />
				</button>
			</div>
		</div>

		<!-- Explore Controls (only on explore page) -->
		{#if isActive('/app/explore')}
			<div class="space-y-3 px-3 py-2">
				<div class="border-t border-gray-200 pb-2 dark:border-gray-700"></div>

				<div>
					<div class="mb-2 flex items-center justify-between">
						<p
							class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
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
						onclick={() => showExploreFavoritesOnly.update((v) => !v)}
						class="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {$showExploreFavoritesOnly
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
					>
						<Heart size={16} weight={$showExploreFavoritesOnly ? 'fill' : 'regular'} />
						<span>Favoriten</span>
					</button>
				</div>

				<div>
					<p
						class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
					>
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
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
							<MagnifyingGlass size={16} />
						</span>
					</div>
				</div>

				<div>
					<p
						class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
					>
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
						<p
							class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
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
						onclick={() => showFavoritesOnly.update((v) => !v)}
						class="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {$showFavoritesOnly
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
					>
						<Heart size={16} weight={$showFavoritesOnly ? 'fill' : 'regular'} />
						<span>Favoriten</span>
					</button>

					{#if $tags.length > 0}
						<TagPills />
					{:else}
						<p class="text-xs text-gray-500 dark:text-gray-400">Keine Tags vorhanden</p>
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
					style="background-color: hsl(var(--color-primary));"
				>
					{authStore.user?.email?.charAt(0).toUpperCase()}
				</div>
				<div class="flex-1 overflow-hidden text-left">
					<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
						{authStore.user?.email?.split('@')[0]}
					</p>
					<p class="truncate text-xs text-gray-500 dark:text-gray-400">Account</p>
				</div>
				<span class="text-gray-400 transition-transform {showUserMenu ? 'rotate-180' : ''}">
					<CaretDown size={16} />
				</span>
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
						<User size={16} />
						Profil & Einstellungen
					</a>
					<button
						onclick={handleLogout}
						class="flex w-full items-center gap-3 border-t border-gray-200 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-red-400 dark:hover:bg-gray-700"
					>
						<SignOut size={16} />
						Abmelden
					</button>
				</div>
			{/if}
		</div>
	</div>
</aside>

<!-- Mobile Header -->
<header
	class="fixed left-0 right-0 top-0 z-30 border-b border-gray-200 bg-white lg:hidden dark:border-gray-700 dark:bg-gray-900"
>
	<div class="flex h-16 items-center justify-between px-4">
		<!-- Logo -->
		<a href="/app/gallery" class="text-xl font-bold text-gray-900 dark:text-gray-100"> Picture </a>

		<!-- User Avatar -->
		<button
			onclick={() => (showUserMenu = !showUserMenu)}
			class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
			style="background-color: hsl(var(--color-primary));"
		>
			{authStore.user?.email?.charAt(0).toUpperCase()}
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
						<span class={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
							{#if item.iconName === 'gallery'}
								<Image size={20} />
							{:else if item.iconName === 'board'}
								<SquaresFour size={20} />
							{:else if item.iconName === 'explore'}
								<MagnifyingGlass size={20} />
							{:else if item.iconName === 'generate'}
								<Lightning size={20} />
							{:else if item.iconName === 'upload'}
								<CloudArrowUp size={20} />
							{:else if item.iconName === 'tags'}
								<Tag size={20} />
							{:else if item.iconName === 'archive'}
								<Archive size={20} />
							{:else if item.iconName === 'mana'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12.3 1c.03.05 7.3 9.67 7.3 13.7 0 4.03-3.27 7.3-7.3 7.3S5 18.73 5 14.7C5 10.66 12.3 1 12.3 1zm0 6.4c-.02.03-3.65 4.83-3.65 6.84 0 2.02 1.64 3.65 3.65 3.65s3.65-1.64 3.65-3.65c0-2.01-3.62-6.81-3.65-6.84z"
									/>
								</svg>
							{/if}
						</span>
						{item.label}
					</a>
				{/each}
				<a
					href="/app/profile"
					onclick={() => (showUserMenu = false)}
					class="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					<span class="text-gray-400">
						<User size={20} />
					</span>
					Profil & Einstellungen
				</a>
				<button
					onclick={handleLogout}
					class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-800"
				>
					<SignOut size={20} />
					Abmelden
				</button>
			</nav>
		</div>
	{/if}
</header>

<!-- Mobile Bottom Navigation -->
<nav
	class="pb-safe fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden dark:border-gray-700 dark:bg-gray-900"
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
				{#if item.iconName === 'gallery'}
					<Image size={24} />
				{:else if item.iconName === 'board'}
					<SquaresFour size={24} />
				{:else if item.iconName === 'explore'}
					<MagnifyingGlass size={24} />
				{:else if item.iconName === 'generate'}
					<Lightning size={24} />
				{:else if item.iconName === 'upload'}
					<CloudArrowUp size={24} />
				{:else if item.iconName === 'tags'}
					<Tag size={24} />
				{:else if item.iconName === 'archive'}
					<Archive size={24} />
				{:else if item.iconName === 'mana'}
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12.3 1c.03.05 7.3 9.67 7.3 13.7 0 4.03-3.27 7.3-7.3 7.3S5 18.73 5 14.7C5 10.66 12.3 1 12.3 1zm0 6.4c-.02.03-3.65 4.83-3.65 6.84 0 2.02 1.64 3.65 3.65 3.65s3.65-1.64 3.65-3.65c0-2.01-3.62-6.81-3.65-6.84z"
						/>
					</svg>
				{/if}
				<span class="text-xs font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

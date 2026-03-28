<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { useAllFavorites, getFavoriteIds } from '$lib/data/queries';
	import { api } from '$lib/api';

	// Live query for favorites — auto-updates on IndexedDB changes
	const allFavorites = useAllFavorites();
	let favoriteIds = $derived(getFavoriteIds(allFavorites.value));

	interface Location {
		id: string;
		slug?: string;
		name: string;
		category: string;
		description: string;
		imageUrl?: string;
	}

	interface Collection {
		id: string;
		name: string;
		description?: string;
		locationIds: string[];
		createdAt: string;
	}

	let allLocations = $state<Location[]>([]);
	let collections = $state<Collection[]>([]);
	let loading = $state(true);
	let activeTab = $state<'favorites' | 'collections'>('favorites');

	// Collection form state
	let showCreateForm = $state(false);
	let newCollectionName = $state('');
	let newCollectionDescription = $state('');
	let creatingCollection = $state(false);

	// Collection detail view
	let selectedCollection = $state<Collection | null>(null);

	let favoriteLocations = $derived(allLocations.filter((l) => favoriteIds.has(l.id)));

	let selectedCollectionLocations = $derived(
		selectedCollection
			? allLocations.filter((l) => (selectedCollection!.locationIds || []).includes(l.id))
			: []
	);

	onMount(async () => {
		try {
			const res = await fetch(api('/locations'));
			const data = await res.json();
			allLocations = data.locations;
		} catch (err) {
			console.error('Failed to load locations:', err);
		} finally {
			loading = false;
		}

		if (authStore.isAuthenticated) {
			await loadCollections();
		}
	});

	async function loadCollections() {
		try {
			const token = await authStore.getValidToken();
			if (!token) return;
			const res = await fetch(api('/collections'), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				collections = data.collections;
			}
		} catch {
			// ignore
		}
	}

	async function handleCreateCollection() {
		if (!newCollectionName.trim() || creatingCollection) return;
		creatingCollection = true;
		try {
			const token = await authStore.getValidToken();
			if (!token) return;
			const res = await fetch(api('/collections'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: newCollectionName.trim(),
					description: newCollectionDescription.trim() || undefined,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				collections = [...collections, data.collection];
				newCollectionName = '';
				newCollectionDescription = '';
				showCreateForm = false;
			}
		} catch {
			// ignore
		} finally {
			creatingCollection = false;
		}
	}

	async function handleDeleteCollection(id: string) {
		try {
			const token = await authStore.getValidToken();
			if (!token) return;
			const res = await fetch(api(`/collections/${id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				collections = collections.filter((c) => c.id !== id);
				if (selectedCollection?.id === id) {
					selectedCollection = null;
				}
			}
		} catch {
			// ignore
		}
	}

	function handleRemove(e: MouseEvent, locationId: string) {
		e.preventDefault();
		e.stopPropagation();
		favoritesStore.toggle(locationId);
	}
</script>

<svelte:head>
	<title>{$_('favorites.title')} - CityCorners</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold text-foreground">{$_('favorites.title')}</h1>
	<p class="text-foreground-secondary">{$_('favorites.subtitle')}</p>
</header>

{#if !authStore.isAuthenticated}
	<div class="rounded-xl border border-border bg-background-card p-8 text-center">
		<p class="mb-4 text-foreground-secondary">{$_('favorites.loginRequired')}</p>
		<a
			href="/login"
			class="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
		>
			{$_('settings.login')}
		</a>
	</div>
{:else}
	<!-- Tabs -->
	<div class="mb-6 flex gap-2">
		<button
			class="rounded-full px-4 py-2 text-sm transition-colors {activeTab === 'favorites'
				? 'bg-primary text-white'
				: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
			onclick={() => {
				activeTab = 'favorites';
				selectedCollection = null;
			}}
		>
			{$_('favorites.tabFavorites')}
		</button>
		<button
			class="rounded-full px-4 py-2 text-sm transition-colors {activeTab === 'collections'
				? 'bg-primary text-white'
				: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
			onclick={() => {
				activeTab = 'collections';
				selectedCollection = null;
			}}
		>
			{$_('favorites.tabCollections')}
		</button>
	</div>

	{#if activeTab === 'favorites'}
		{#if loading}
			<p class="text-foreground-secondary">{$_('home.loading')}</p>
		{:else if favoriteLocations.length === 0}
			<div class="rounded-xl border border-border bg-background-card p-8 text-center">
				<span class="mb-2 block text-4xl">&#x1F499;</span>
				<p class="text-foreground-secondary">{$_('favorites.empty')}</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each favoriteLocations as location}
					<a
						href="/locations/{location.slug || location.id}"
						class="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-background-card p-4 transition-shadow hover:shadow-lg"
					>
						{#if location.imageUrl}
							<img
								src={location.imageUrl}
								alt={location.name}
								class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
							/>
						{:else}
							<div
								class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-background-card-hover"
							>
								<span class="text-2xl">&#x1F4CD;</span>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<span class="text-xs text-primary">{$_(`category.${location.category}`)}</span>
							<h3 class="truncate font-semibold text-foreground group-hover:text-primary">
								{location.name}
							</h3>
						</div>
						<button
							class="flex-shrink-0 p-1 text-red-500 transition-colors hover:text-red-600"
							onclick={(e) => handleRemove(e, location.id)}
							title={$_('favorites.remove')}
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
								/>
							</svg>
						</button>
					</a>
				{/each}
			</div>
		{/if}
	{:else if selectedCollection}
		<!-- Collection detail view -->
		<div class="mb-4">
			<button
				onclick={() => (selectedCollection = null)}
				class="text-sm text-foreground-secondary hover:text-primary transition-colors"
			>
				&larr; {$_('collections.back')}
			</button>
		</div>
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-foreground">{selectedCollection.name}</h2>
				{#if selectedCollection.description}
					<p class="text-sm text-foreground-secondary">{selectedCollection.description}</p>
				{/if}
			</div>
			<button
				onclick={() => handleDeleteCollection(selectedCollection!.id)}
				class="text-sm text-red-500 hover:text-red-600 transition-colors"
			>
				{$_('collections.delete')}
			</button>
		</div>
		{#if selectedCollectionLocations.length === 0}
			<div class="rounded-xl border border-border bg-background-card p-8 text-center">
				<p class="text-foreground-secondary">{$_('collections.noLocations')}</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each selectedCollectionLocations as location}
					<a
						href="/locations/{location.slug || location.id}"
						class="group flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-background-card p-4 transition-shadow hover:shadow-lg"
					>
						{#if location.imageUrl}
							<img
								src={location.imageUrl}
								alt={location.name}
								class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
							/>
						{:else}
							<div
								class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-background-card-hover"
							>
								<span class="text-2xl">&#x1F4CD;</span>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<span class="text-xs text-primary">{$_(`category.${location.category}`)}</span>
							<h3 class="truncate font-semibold text-foreground group-hover:text-primary">
								{location.name}
							</h3>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Collections list -->
		<div class="mb-4">
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
			>
				{$_('collections.create')}
			</button>
		</div>

		{#if showCreateForm}
			<div class="mb-6 rounded-xl border border-border bg-background-card p-4 space-y-3">
				<div>
					<label for="col-name" class="mb-1 block text-sm font-medium text-foreground"
						>{$_('collections.name')}</label
					>
					<input
						id="col-name"
						type="text"
						bind:value={newCollectionName}
						placeholder={$_('collections.namePlaceholder')}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div>
					<label for="col-desc" class="mb-1 block text-sm font-medium text-foreground"
						>{$_('collections.description')}</label
					>
					<input
						id="col-desc"
						type="text"
						bind:value={newCollectionDescription}
						placeholder={$_('collections.descriptionPlaceholder')}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => (showCreateForm = false)}
						class="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground-secondary hover:bg-background-card-hover"
					>
						{$_('collections.cancel')}
					</button>
					<button
						onclick={handleCreateCollection}
						disabled={!newCollectionName.trim() || creatingCollection}
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
					>
						{$_('collections.save')}
					</button>
				</div>
			</div>
		{/if}

		{#if collections.length === 0}
			<div class="rounded-xl border border-border bg-background-card p-8 text-center">
				<p class="text-foreground-secondary">{$_('collections.empty')}</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each collections as collection}
					<button
						onclick={() => (selectedCollection = collection)}
						class="text-left overflow-hidden rounded-xl border border-border bg-background-card p-4 transition-shadow hover:shadow-lg"
					>
						<h3 class="font-semibold text-foreground">{collection.name}</h3>
						{#if collection.description}
							<p class="mt-1 text-sm text-foreground-secondary line-clamp-2">
								{collection.description}
							</p>
						{/if}
						<p class="mt-2 text-xs text-foreground-secondary">
							{$_('collections.locations', {
								values: { count: (collection.locationIds || []).length },
							})}
						</p>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
{/if}

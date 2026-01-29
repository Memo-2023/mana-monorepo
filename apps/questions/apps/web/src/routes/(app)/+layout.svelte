<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, collectionsStore, questionsStore } from '$lib/stores';
	import { apiClient } from '$lib/api/client';
	import {
		Search,
		Plus,
		FolderOpen,
		Settings,
		LogOut,
		Moon,
		Sun,
		HelpCircle,
		ChevronRight,
	} from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';

	let { children } = $props();
	let sidebarOpen = $state(true);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		const token = await authStore.getValidToken();
		apiClient.setAccessToken(token);

		// Load initial data
		await collectionsStore.load();
		await questionsStore.load();
	});

	async function handleSignOut() {
		await authStore.signOut();
		apiClient.setAccessToken(null);
		goto('/login');
	}

	function selectCollection(id: string | null) {
		collectionsStore.select(id);
		if (id) {
			questionsStore.load({ collectionId: id });
		} else {
			questionsStore.load();
		}
	}
</script>

<div class="flex min-h-screen">
	<!-- Sidebar -->
	<aside
		class="flex w-64 flex-col border-r border-border bg-card transition-all duration-200"
		class:w-64={sidebarOpen}
		class:w-16={!sidebarOpen}
	>
		<!-- Header -->
		<div class="flex h-16 items-center justify-between border-b border-border px-4">
			{#if sidebarOpen}
				<h1 class="text-xl font-bold text-primary">Questions</h1>
			{/if}
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
			>
				<ChevronRight class="h-5 w-5 transition-transform" class:rotate-180={sidebarOpen} />
			</button>
		</div>

		<!-- New Question Button -->
		<div class="p-4">
			<a
				href="/new"
				class="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
			>
				<Plus class="h-5 w-5" />
				{#if sidebarOpen}
					<span>New Question</span>
				{/if}
			</a>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-1 px-2">
			<button
				onclick={() => selectCollection(null)}
				class="collection-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-foreground"
				class:active={!collectionsStore.selectedId}
			>
				<HelpCircle class="h-5 w-5" />
				{#if sidebarOpen}
					<span>All Questions</span>
					<span class="ml-auto text-xs text-muted-foreground">{questionsStore.total}</span>
				{/if}
			</button>

			{#if sidebarOpen}
				<div class="my-4 px-3 text-xs font-semibold uppercase text-muted-foreground">
					Collections
				</div>
			{/if}

			{#each collectionsStore.collections as collection}
				<button
					onclick={() => selectCollection(collection.id)}
					class="collection-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-foreground"
					class:active={collectionsStore.selectedId === collection.id}
				>
					<FolderOpen class="h-5 w-5" style="color: {collection.color}" />
					{#if sidebarOpen}
						<span class="truncate">{collection.name}</span>
						<span class="ml-auto text-xs text-muted-foreground">{collection.questionCount || 0}</span
						>
					{/if}
				</button>
			{/each}

			{#if sidebarOpen}
				<a
					href="/collections"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
				>
					<Plus class="h-5 w-5" />
					<span>Manage Collections</span>
				</a>
			{/if}
		</nav>

		<!-- Footer -->
		<div class="border-t border-border p-2">
			<button
				onclick={() => theme.toggle()}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
			>
				{#if theme.current === 'dark'}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
				{#if sidebarOpen}
					<span>Toggle Theme</span>
				{/if}
			</button>

			<a
				href="/settings"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
			>
				<Settings class="h-5 w-5" />
				{#if sidebarOpen}
					<span>Settings</span>
				{/if}
			</a>

			<button
				onclick={handleSignOut}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
			>
				<LogOut class="h-5 w-5" />
				{#if sidebarOpen}
					<span>Sign Out</span>
				{/if}
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>

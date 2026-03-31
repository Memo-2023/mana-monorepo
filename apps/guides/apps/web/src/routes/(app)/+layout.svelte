<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, setContext } from 'svelte';
	import { AuthGate } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { guidesStore } from '$lib/stores/guides.svelte';
	import { guidesStore as dbStore } from '$lib/data/local-store.js';
	import { BookOpen, StackSimple, ClockCounterClockwise, Plus } from '@manacore/shared-icons';

	let { children } = $props();

	// Context for child pages
	let showCreateModal = $state(false);
	setContext('openCreateGuide', () => { showCreateModal = true; });

	// Nav items
	const navItems = [
		{ href: '/', icon: BookOpen, label: 'Bibliothek' },
		{ href: '/collections', icon: StackSimple, label: 'Sammlungen' },
		{ href: '/history', icon: ClockCounterClockwise, label: 'Verlauf' },
	];

	let currentPath = $derived($page.url.pathname);
	let isActive = (href: string) =>
		href === '/' ? currentPath === '/' : currentPath.startsWith(href);

	onMount(async () => {
		await dbStore.initialize();
		if (authStore.isLoggedIn) {
			dbStore.startSync(() => authStore.getValidToken());
		}
	});
</script>

<AuthGate requiredTier="beta" allowGuest={true}>
	<div class="flex h-screen overflow-hidden">
		<!-- Sidebar (desktop) -->
		<aside class="hidden w-56 flex-shrink-0 flex-col border-r border-border bg-surface md:flex">
			<div class="flex items-center gap-2 px-4 py-5">
				<span class="text-xl">📖</span>
				<span class="text-lg font-semibold text-foreground">Guides</span>
			</div>

			<nav class="flex flex-1 flex-col gap-1 px-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
						{isActive(item.href)
							? 'bg-primary/10 text-primary font-medium'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
					>
						<item.icon class="h-4 w-4" />
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="p-3">
				<button
					onclick={() => (showCreateModal = true)}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					<Plus class="h-4 w-4" />
					Neue Anleitung
				</button>
			</div>
		</aside>

		<!-- Main content -->
		<main class="flex flex-1 flex-col overflow-hidden">
			<div class="flex-1 overflow-y-auto pb-20 md:pb-0">
				{@render children()}
			</div>
		</main>
	</div>

	<!-- Bottom nav (mobile) -->
	<nav class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface md:hidden">
		<div class="flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors
					{isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}"
				>
					<item.icon class="h-5 w-5" />
					{item.label}
				</a>
			{/each}
		</div>
	</nav>

	<!-- FAB (mobile) -->
	<button
		onclick={() => (showCreateModal = true)}
		class="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
		aria-label="Neue Anleitung erstellen"
	>
		<Plus class="h-6 w-6" />
	</button>
</AuthGate>

{#if showCreateModal}
	<!-- GuideEditModal dynamically imported to keep bundle small -->
	{#await import('$lib/components/GuideEditModal.svelte') then { default: GuideEditModal }}
		<GuideEditModal
			open={true}
			onClose={() => (showCreateModal = false)}
			onSave={async (data) => {
				await guidesStore.createGuide(data);
				showCreateModal = false;
			}}
		/>
	{/await}
{/if}

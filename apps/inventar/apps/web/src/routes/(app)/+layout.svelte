<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import { setContext } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { theme } from '$lib/stores/theme';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { inventarStore } from '$lib/data/local-store';
	import {
		useAllCollections,
		useAllItems,
		useAllLocations,
		useAllCategories,
	} from '$lib/data/queries';

	let { children } = $props();

	let showNav = $state(true);
	let initialized = $state(false);
	let showGuestWelcome = $state(false);

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allCollections = useAllCollections();
	const allItems = useAllItems();
	const allLocations = useAllLocations();
	const allCategories = useAllCategories();

	// Provide data to child components via Svelte context
	setContext('collections', allCollections);
	setContext('items', allItems);
	setContext('locations', allLocations);
	setContext('categories', allCategories);

	async function handleAuthReady() {
		// Initialize local-first database
		await inventarStore.initialize();

		// If authenticated, start syncing
		if (authStore.isAuthenticated) {
			inventarStore.startSync(() => authStore.getValidToken());
		}

		// Initialize view preferences (still localStorage-based, not data)
		viewStore.initialize();
		initialized = true;

		// Show guest welcome on first visit
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('inventar')) {
			showGuestWelcome = true;
		}
	}

	const navItems = [
		{ href: '/', label: 'Sammlungen', icon: 'archive' },
		{ href: '/items', label: 'Alle Items', icon: 'list' },
		{ href: '/locations', label: 'Standorte', icon: 'map-pin' },
		{ href: '/categories', label: 'Kategorien', icon: 'tag' },
		{ href: '/search', label: 'Suche', icon: 'search' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/mana', label: 'Mana', icon: 'star' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	function handleLogout() {
		authStore.signOut();
		goto('/login');
	}
</script>

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="flex min-h-screen flex-col">
		<!-- Top Navigation -->
		{#if showNav}
			<nav
				class="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/0.95] backdrop-blur"
			>
				<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
					<!-- Logo -->
					<a href="/" class="flex items-center gap-2">
						<span class="text-xl">📦</span>
						<span class="text-lg font-bold text-[hsl(var(--foreground))]">Inventar</span>
					</a>

					<!-- Nav Items -->
					<div class="hidden items-center gap-1 md:flex">
						{#each navItems.slice(0, 5) as item}
							<a
								href={item.href}
								class="rounded-lg px-3 py-1.5 text-sm transition-colors {$page.url.pathname ===
									item.href ||
								($page.url.pathname.startsWith(item.href) && item.href !== '/')
									? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
									: 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/0.1)] hover:text-[hsl(var(--foreground))]'}"
							>
								{item.label}
							</a>
						{/each}
					</div>

					<!-- Right side -->
					<div class="flex items-center gap-2">
						<!-- Language -->
						<select
							class="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-xs text-[hsl(var(--muted-foreground))]"
							onchange={(e) => setLocale((e.target as HTMLSelectElement).value as any)}
						>
							{#each supportedLocales as loc}
								<option value={loc}>{loc.toUpperCase()}</option>
							{/each}
						</select>

						<!-- User menu -->
						<a
							href="/profile"
							class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</a>

						<button
							onclick={handleLogout}
							class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
							title="Abmelden"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
						</button>
					</div>
				</div>

				<!-- Mobile nav -->
				<div class="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
					{#each navItems.slice(0, 5) as item}
						<a
							href={item.href}
							class="shrink-0 rounded-full px-3 py-1 text-xs transition-colors {$page.url
								.pathname === item.href
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}

		<!-- Content -->
		<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
			{@render children()}
		</main>
	</div>

	<!-- FAB for mobile - New Item -->
	<button
		onclick={() => goto('/items?action=new')}
		class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transition-transform hover:scale-105 md:hidden"
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
	</button>

	<!-- Guest Welcome Modal -->
	<GuestWelcomeModal
		appId="inventar"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale="de"
	/>
</AuthGate>

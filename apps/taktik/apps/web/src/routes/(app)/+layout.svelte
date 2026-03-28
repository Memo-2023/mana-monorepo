<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import { setContext } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { theme } from '$lib/stores/theme';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { SyncIndicator } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { taktikStore } from '$lib/data/local-store';
	import {
		useAllClients,
		useAllProjects,
		useAllTimeEntries,
		useAllTags,
		useAllTemplates,
		useSettings,
	} from '$lib/data/queries';

	let { children } = $props();

	let showNav = $state(true);
	let initialized = $state(false);
	let showGuestWelcome = $state(false);

	// Live queries
	const allClients = useAllClients();
	const allProjects = useAllProjects();
	const allTimeEntries = useAllTimeEntries();
	const allTags = useAllTags();
	const allTemplates = useAllTemplates();
	const settings = useSettings();

	// Provide data to child components
	setContext('clients', allClients);
	setContext('projects', allProjects);
	setContext('timeEntries', allTimeEntries);
	setContext('tags', allTags);
	setContext('templates', allTemplates);
	setContext('settings', settings);

	async function handleAuthReady() {
		await taktikStore.initialize();

		if (authStore.isAuthenticated) {
			taktikStore.startSync(() => authStore.getValidToken());
		}

		viewStore.initialize();
		initialized = true;

		if (!authStore.isAuthenticated && shouldShowGuestWelcome('taktik')) {
			showGuestWelcome = true;
		}
	}

	const navItems = [
		{ href: '/', label: $_('nav.timer'), icon: 'play-circle' },
		{ href: '/entries', label: $_('nav.entries'), icon: 'list' },
		{ href: '/projects', label: $_('nav.projects'), icon: 'folder' },
		{ href: '/clients', label: $_('nav.clients'), icon: 'buildings' },
		{ href: '/reports', label: $_('nav.reports'), icon: 'chart-bar' },
		{ href: '/settings', label: $_('nav.settings'), icon: 'settings' },
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
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]"
						>
							<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<span class="text-lg font-bold text-[hsl(var(--foreground))]">Taktik</span>
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
						<select
							class="rounded-lg border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-xs text-[hsl(var(--muted-foreground))]"
							onchange={(e) => setLocale((e.target as HTMLSelectElement).value as any)}
						>
							{#each supportedLocales as loc}
								<option value={loc}>{loc.toUpperCase()}</option>
							{/each}
						</select>

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

	<!-- FAB for mobile - Start Timer -->
	<button
		onclick={() => goto('/?action=start')}
		class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transition-transform hover:scale-105 md:hidden"
	>
		<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
			<polygon points="5 3 19 12 5 21 5 3" />
		</svg>
	</button>

	<GuestWelcomeModal
		appId="taktik"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale="de"
	/>
	<SyncIndicator />
</AuthGate>

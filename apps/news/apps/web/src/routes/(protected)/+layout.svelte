<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	const navItems = [
		{ href: '/feed', label: 'Feed', icon: 'feed' },
		{ href: '/summaries', label: 'Zusammenfassungen', icon: 'summaries' },
		{ href: '/in-depth', label: 'In-Depth', icon: 'indepth' },
		{ href: '/saved', label: 'Gespeichert', icon: 'saved' },
	];

	async function handleLogout() {
		await authStore.logout();
		goto('/auth/login');
	}
</script>

<div class="min-h-screen flex">
	<!-- Sidebar -->
	<aside class="w-64 bg-background-card border-r border-border flex flex-col">
		<!-- Logo -->
		<div class="p-4 border-b border-border">
			<a href="/feed" class="flex items-center gap-2">
				<svg
					class="w-8 h-8 text-primary"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
					/>
				</svg>
				<span class="font-bold text-lg">News Hub</span>
			</a>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 p-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {$page.url.pathname.startsWith(
						item.href
					)
						? 'bg-primary/10 text-primary'
						: 'text-text-secondary hover:bg-background-card-hover hover:text-text-primary'}"
				>
					{#if item.icon === 'feed'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
							/>
						</svg>
					{:else if item.icon === 'summaries'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
							/>
						</svg>
					{:else if item.icon === 'indepth'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					{:else if item.icon === 'saved'}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
							/>
						</svg>
					{/if}
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- User Menu -->
		<div class="p-4 border-t border-border">
			<a
				href="/profile"
				class="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-background-card-hover hover:text-text-primary transition-colors"
			>
				<div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
					<span class="text-primary text-sm font-medium">
						{authStore.user?.name?.[0]?.toUpperCase() ||
							authStore.user?.email?.[0]?.toUpperCase() ||
							'?'}
					</span>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium truncate">{authStore.user?.name || 'User'}</p>
					<p class="text-xs text-text-muted truncate">{authStore.user?.email}</p>
				</div>
			</a>
			<button
				onclick={handleLogout}
				class="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				<span>Abmelden</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>

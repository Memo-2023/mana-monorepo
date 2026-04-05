<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ShieldCheck } from '@mana/shared-icons';

	let { children }: { children: Snippet } = $props();

	// Guard: redirect non-admin users
	let isAdmin = $derived(authStore.user?.role === 'admin');
	$effect(() => {
		if (authStore.initialized && !authStore.loading && !isAdmin) {
			goto('/');
		}
	});

	const tabs = [
		{ href: '/admin', label: 'Overview', icon: 'home' },
		{ href: '/admin/users', label: 'Users', icon: 'users' },
		{ href: '/admin/user-data', label: 'User Data', icon: 'database' },
		{ href: '/admin/system', label: 'System', icon: 'server' },
	];

	const icons: Record<string, string> = {
		home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
		users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`,
		database: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />`,
		server: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />`,
	};

	function isActive(href: string, pathname: string): boolean {
		if (href === '/admin') {
			return pathname === '/admin';
		}
		return pathname.startsWith(href);
	}
</script>

{#if !isAdmin}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<div class="mb-4 text-5xl">🔒</div>
		<h3 class="mb-2 text-lg font-medium">Zugriff verweigert</h3>
		<p class="text-muted-foreground">Du hast keine Admin-Berechtigung.</p>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">Admin Dashboard</h1>
				<p class="text-muted-foreground">System monitoring and management</p>
			</div>
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
				<ShieldCheck size={20} class="text-red-600 dark:text-red-400" />
				<span class="text-sm font-medium text-red-600 dark:text-red-400">Admin</span>
			</div>
		</div>

		<nav class="flex gap-1 border-b pb-px">
			{#each tabs as tab}
				{@const active = isActive(tab.href, $page.url.pathname)}
				<a
					href={tab.href}
					class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
					{active
						? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{@html icons[tab.icon]}
					</svg>
					{tab.label}
				</a>
			{/each}
		</nav>

		<div>
			{@render children()}
		</div>
	</div>
{/if}

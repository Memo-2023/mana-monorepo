<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	let mobileMenuOpen = $state(false);

	$effect(() => {
		if (!data.session) {
			goto('/login');
		}
	});

	const navigation = [
		{ name: 'Dashboard', href: '/dashboard' },
		{ name: 'Organizations', href: '/organizations' },
		{ name: 'Teams', href: '/teams' },
		{ name: 'Subscription', href: '/subscription' },
		{ name: 'Settings', href: '/settings' }
	];

	async function handleSignOut() {
		await data.supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Navigation -->
	<nav class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<h1 class="text-xl font-bold text-primary-600">ManaCore</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						{#each navigation as item}
							<a
								href={item.href}
								class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium {$page.url.pathname.startsWith(item.href)
									? 'border-primary-500 text-gray-900 dark:text-white'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
							>
								{item.name}
							</a>
						{/each}
					</div>
				</div>
				<div class="hidden sm:ml-6 sm:flex sm:items-center">
					<button
						type="button"
						onclick={handleSignOut}
						class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Sign out
					</button>
				</div>
				<div class="-mr-2 flex items-center sm:hidden">
					<button
						type="button"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
					>
						<span class="sr-only">Open main menu</span>
						{#if !mobileMenuOpen}
							<svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						{:else}
							<svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>

		{#if mobileMenuOpen}
			<div class="sm:hidden">
				<div class="space-y-1 pb-3 pt-2">
					{#each navigation as item}
						<a
							href={item.href}
							class="block border-l-4 py-2 pl-3 pr-4 text-base font-medium {$page.url.pathname.startsWith(item.href)
								? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
								: 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
						>
							{item.name}
						</a>
					{/each}
					<button
						type="button"
						onclick={handleSignOut}
						class="block w-full border-l-4 border-transparent py-2 pl-3 pr-4 text-left text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
					>
						Sign out
					</button>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main content -->
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{@render children()}
	</main>
</div>

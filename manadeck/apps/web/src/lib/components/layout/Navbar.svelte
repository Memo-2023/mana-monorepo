<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore.svelte';

	const navItems = [
		{ label: 'Decks', href: '/decks', icon: '📚' },
		{ label: 'Explore', href: '/explore', icon: '🔍' },
		{ label: 'Progress', href: '/progress', icon: '📊' },
		{ label: 'Profile', href: '/profile', icon: '👤' }
	];

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}

	function isActive(href: string) {
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="border-b border-border bg-surface-elevated">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/decks" class="flex items-center space-x-2">
					<span class="text-2xl">🎴</span>
					<span class="text-xl font-bold">Manadeck</span>
				</a>
			</div>

			<!-- Navigation Links -->
			<div class="hidden md:flex items-center space-x-1">
				{#each navItems as item}
					<a
						href={item.href}
						class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
							isActive(item.href)
								? 'bg-primary text-primary-foreground'
								: 'text-foreground hover:bg-accent hover:text-accent-foreground'
						}`}
					>
						<span class="mr-2">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</div>

			<!-- User Menu -->
			<div class="flex items-center space-x-4">
				<div class="text-sm text-muted-foreground">
					{authStore.user?.email || 'Guest'}
				</div>
				<button
					onclick={handleSignOut}
					class="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
				>
					Sign Out
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Navigation -->
	<div class="md:hidden border-t border-border">
		<div class="flex justify-around py-2">
			{#each navItems as item}
				<a
					href={item.href}
					class={`flex flex-col items-center px-3 py-2 text-xs ${
						isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
					}`}
				>
					<span class="text-xl mb-1">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</div>
	</div>
</nav>

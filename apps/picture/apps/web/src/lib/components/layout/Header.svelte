<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let showUserMenu = $state(false);
	let showMobileMenu = $state(false);

	async function handleLogout() {
		await authStore.signOut();
		goto('/auth/login');
	}

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
</script>

<header class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<a href="/app/gallery" class="text-xl font-bold text-gray-900 dark:text-gray-100">
				Picture
			</a>

			<!-- Mobile Menu Button -->
			<button
				onclick={() => (showMobileMenu = !showMobileMenu)}
				class="flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
				aria-label="Menu"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={showMobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					/>
				</svg>
			</button>

			<!-- Desktop Navigation -->
			<nav class="hidden items-center gap-6 md:flex">
				<a
					href="/app/gallery"
					class="text-sm font-medium transition-colors {isActive('/app/gallery')
						? 'text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
				>
					Gallery
				</a>
				<a
					href="/app/explore"
					class="text-sm font-medium transition-colors {isActive('/app/explore')
						? 'text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
				>
					Entdecken
				</a>
				<a
					href="/app/generate"
					class="text-sm font-medium transition-colors {isActive('/app/generate')
						? 'text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
				>
					Generieren
				</a>
				<a
					href="/app/archive"
					class="text-sm font-medium transition-colors {isActive('/app/archive')
						? 'text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
				>
					Archiv
				</a>
			</nav>

			<!-- User Menu -->
			<div class="relative">
				<button
					onclick={() => (showUserMenu = !showUserMenu)}
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500"
					>
						{authStore.user?.email?.charAt(0).toUpperCase()}
					</div>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{#if showUserMenu}
					<div
						class="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{authStore.user?.email}</p>
						</div>
						<a
							href="/app/profile"
							class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Profile
						</a>
						<button
							onclick={handleLogout}
							class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
						>
							Sign Out
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if showMobileMenu}
			<div class="border-t border-gray-200 pb-4 pt-2 md:hidden dark:border-gray-700">
				<nav class="flex flex-col space-y-1">
					<a
						href="/app/gallery"
						onclick={() => (showMobileMenu = false)}
						class="block px-4 py-2 text-sm font-medium transition-colors {isActive('/app/gallery')
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						Gallery
					</a>
					<a
						href="/app/explore"
						onclick={() => (showMobileMenu = false)}
						class="block px-4 py-2 text-sm font-medium transition-colors {isActive('/app/explore')
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						Entdecken
					</a>
					<a
						href="/app/generate"
						onclick={() => (showMobileMenu = false)}
						class="block px-4 py-2 text-sm font-medium transition-colors {isActive('/app/generate')
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						Generieren
					</a>
					<a
						href="/app/archive"
						onclick={() => (showMobileMenu = false)}
						class="block px-4 py-2 text-sm font-medium transition-colors {isActive('/app/archive')
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						Archiv
					</a>
					<a
						href="/app/profile"
						onclick={() => (showMobileMenu = false)}
						class="block px-4 py-2 text-sm font-medium transition-colors {isActive('/app/profile')
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
							: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						Profil
					</a>
				</nav>
			</div>
		{/if}
	</div>
</header>

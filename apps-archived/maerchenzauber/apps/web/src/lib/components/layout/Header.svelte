<script lang="ts">
	import { authStore } from '$lib/stores/authStore.svelte';
	import ManaCounter from '$lib/components/credits/ManaCounter.svelte';

	interface Props {
		onMenuClick?: () => void;
		onLogout?: () => void;
	}

	let { onMenuClick, onLogout }: Props = $props();

	// Icon paths
	const menuIcon = 'M4 6h16M4 12h16M4 18h16';
	const userIcon =
		'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z';
</script>

<header
	class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-pink-200/50 bg-white/80 px-4 backdrop-blur-xl lg:px-6 dark:border-gray-700/50 dark:bg-gray-900/80"
>
	<!-- Left: Mobile Menu Button -->
	<div class="flex items-center gap-4">
		<button
			onclick={onMenuClick}
			class="rounded-lg p-2 text-gray-500 hover:bg-pink-100 hover:text-pink-600 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-pink-400"
			aria-label="Menü öffnen"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={menuIcon} />
			</svg>
		</button>

		<!-- Page Title (optional - can be passed as prop later) -->
		<h1 class="hidden text-lg font-semibold text-gray-800 lg:block dark:text-gray-200">
			Willkommen zurück!
		</h1>
	</div>

	<!-- Right: Mana Counter & User Menu -->
	<div class="flex items-center gap-3">
		<!-- Mana Counter -->
		<ManaCounter />

		<!-- User Avatar/Menu -->
		<div class="relative">
			<button
				class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:from-pink-200 hover:to-purple-200 dark:from-gray-800 dark:to-gray-700 dark:text-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600"
			>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={userIcon} />
					</svg>
				</div>
				<span class="hidden max-w-[120px] truncate sm:inline">
					{authStore.user?.email?.split('@')[0] || 'Benutzer'}
				</span>
			</button>
		</div>
	</div>
</header>

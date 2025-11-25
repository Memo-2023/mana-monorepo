<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';

	// Stats
	let storyCount = $state(0);
	let characterCount = $state(0);
	let loadingStats = $state(true);

	// Theme
	let isDarkMode = $state(false);

	onMount(async () => {
		// Load stats
		try {
			const [stories, characters] = await Promise.all([
				dataService.getStories(),
				dataService.getCharacters(),
			]);
			storyCount = stories.filter((s) => !s.archived).length;
			characterCount = characters.filter((c) => !c.archived).length;
		} catch (err) {
			console.error('[Settings] Failed to load stats:', err);
		} finally {
			loadingStats = false;
		}

		// Check current theme
		isDarkMode = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<svelte:head>
	<title>Einstellungen | Märchenzauber</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Einstellungen</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Verwalte dein Konto und deine Einstellungen
		</p>
	</div>

	<!-- Stats Section -->
	<section class="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white shadow-lg">
		<h2 class="mb-4 text-lg font-semibold">Deine Statistiken</h2>
		<div class="grid grid-cols-2 gap-4">
			<div class="rounded-xl bg-white/20 p-4 backdrop-blur">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
					</div>
					<div>
						<p class="text-2xl font-bold">{loadingStats ? '...' : storyCount}</p>
						<p class="text-sm text-white/80">Geschichten</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl bg-white/20 p-4 backdrop-blur">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					</div>
					<div>
						<p class="text-2xl font-bold">{loadingStats ? '...' : characterCount}</p>
						<p class="text-sm text-white/80">Charaktere</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Preferences Section -->
	<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Einstellungen</h2>

		<div class="space-y-4">
			<!-- Dark Mode Toggle -->
			<div class="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
						{#if isDarkMode}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						{/if}
					</div>
					<div>
						<p class="font-medium text-gray-800 dark:text-gray-200">Dunkelmodus</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">{isDarkMode ? 'Aktiviert' : 'Deaktiviert'}</p>
					</div>
				</div>
				<button
					onclick={toggleTheme}
					class="relative h-7 w-12 rounded-full transition-colors {isDarkMode ? 'bg-pink-500' : 'bg-gray-300'}"
				>
					<span
						class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all {isDarkMode ? 'left-5.5' : 'left-0.5'}"
						style="left: {isDarkMode ? '1.375rem' : '0.125rem'}"
					></span>
				</button>
			</div>
		</div>
	</section>

	<!-- Account Section -->
	<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Konto</h2>

		<div class="space-y-4">
			<!-- Email -->
			<div class="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">E-Mail</p>
					<p class="text-gray-800 dark:text-gray-200">{authStore.user?.email || '-'}</p>
				</div>
			</div>

			<!-- User ID -->
			<div class="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Benutzer-ID</p>
					<p class="font-mono text-xs text-gray-600 dark:text-gray-400">{authStore.user?.id || '-'}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Subscription Section -->
	<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Abonnement</h2>

		<a
			href="/subscription"
			class="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 p-4 transition-all hover:from-amber-200 hover:to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/50"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
					</svg>
				</div>
				<div>
					<p class="font-medium text-gray-800 dark:text-gray-200">Mana verwalten</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">Abonnement und Guthaben</p>
				</div>
			</div>
			<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</a>
	</section>

	<!-- Actions Section -->
	<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Aktionen</h2>

		<div class="space-y-2">
			<!-- Archive -->
			<a
				href="/archive"
				class="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
					</svg>
				</div>
				<div class="flex-1">
					<p class="font-medium text-gray-800 dark:text-gray-200">Archiv</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Archivierte Geschichten und Charaktere</p>
				</div>
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<!-- Help -->
			<a
				href="/help"
				class="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="flex-1">
					<p class="font-medium text-gray-800 dark:text-gray-200">Hilfe</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">FAQ und Support</p>
				</div>
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>

			<!-- Logout -->
			<button
				onclick={async () => {
					await authStore.signOut();
					goto('/login');
				}}
				class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
			>
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</div>
				<div class="flex-1">
					<p class="font-medium text-red-600 dark:text-red-400">Abmelden</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Von deinem Konto abmelden</p>
				</div>
			</button>
		</div>
	</section>
</div>

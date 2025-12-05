<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/themes/themeStore';

	let { data } = $props();

	let themeMode = $state<'light' | 'dark' | 'system'>('system');

	$effect(() => {
		const stored = localStorage.getItem('themeMode');
		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			themeMode = stored;
		} else {
			themeMode = 'system';
		}
	});

	function handleThemeChange(mode: 'light' | 'dark' | 'system') {
		themeMode = mode;
		localStorage.setItem('themeMode', mode);

		if (mode === 'system') {
			const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			theme.setTheme(systemPrefersDark ? 'dark' : 'light');
		} else {
			theme.setTheme(mode);
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-8 text-2xl font-bold text-theme-text-primary">Einstellungen</h1>

	<div class="divide-y divide-gray-200 rounded-lg bg-theme-surface shadow dark:divide-gray-700">
		<div class="px-4 py-5 sm:p-6">
			<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Konto</h2>

			{#if data.user}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-theme-text-primary">E-Mail-Adresse</label>
						<p class="mt-1 text-sm text-theme-text-primary">{data.user.email}</p>
					</div>

					<div>
						<form method="POST" action="/auth/logout">
							<button
								type="submit"
								class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
							>
								<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Abmelden
							</button>
						</form>
					</div>
				</div>
			{:else}
				<p class="text-sm text-theme-text-secondary">Nicht angemeldet</p>
				<a
					href="/auth/login"
					class="mt-2 inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2"
				>
					Anmelden
				</a>
			{/if}
		</div>

		<div class="px-4 py-5 sm:p-6">
			<h2 class="mb-4 text-lg font-medium text-theme-text-primary">Erscheinungsbild</h2>

			<div class="space-y-4">
				<label class="block text-sm font-medium text-theme-text-primary">Farbschema</label>
				<div class="grid max-w-md grid-cols-3 gap-3">
					<button
						onclick={() => handleThemeChange('light')}
						class="flex flex-col items-center justify-center rounded-lg border px-4 py-3 transition-all {themeMode ===
						'light'
							? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
							: 'border-slate-200 text-theme-text-primary hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'}"
					>
						<svg class="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
						<span class="text-sm font-medium">Hell</span>
					</button>

					<button
						onclick={() => handleThemeChange('dark')}
						class="flex flex-col items-center justify-center rounded-lg border px-4 py-3 transition-all {themeMode ===
						'dark'
							? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
							: 'border-slate-200 text-theme-text-primary hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'}"
					>
						<svg class="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
						<span class="text-sm font-medium">Dunkel</span>
					</button>

					<button
						onclick={() => handleThemeChange('system')}
						class="flex flex-col items-center justify-center rounded-lg border px-4 py-3 transition-all {themeMode ===
						'system'
							? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
							: 'border-slate-200 text-theme-text-primary hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500'}"
					>
						<svg class="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						<span class="text-sm font-medium">System</span>
					</button>
				</div>
				<p class="text-sm text-theme-text-secondary">
					{#if themeMode === 'system'}
						Verwendet die Systemeinstellung deines Geräts
					{:else if themeMode === 'light'}
						Helles Farbschema aktiviert
					{:else}
						Dunkles Farbschema aktiviert
					{/if}
				</p>
			</div>
		</div>
	</div>
</div>

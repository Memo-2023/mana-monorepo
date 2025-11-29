<script lang="ts">
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import '$lib/i18n';

	let showDropdown = $state(false);

	const languages = [
		{ code: 'en', name: 'English', flag: '🇬🇧' },
		{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
	];

	let currentLanguage = $state(languages[0]);

	// Get current language on mount
	$effect(() => {
		if (browser) {
			const currentCode = get(locale) || 'en';
			currentLanguage = languages.find((lang) => lang.code === currentCode) || languages[0];
		}
	});

	function changeLanguage(langCode: string) {
		if (browser) {
			// Save preference
			localStorage.setItem('preferred-language', langCode);
			// Update svelte-i18n locale
			locale.set(langCode);
			// Update current language display
			currentLanguage = languages.find((lang) => lang.code === langCode) || languages[0];
			// Close dropdown
			showDropdown = false;
		}
	}
</script>

<div class="relative">
	<button
		onclick={() => (showDropdown = !showDropdown)}
		class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
		aria-label="Change language"
	>
		<span class="text-lg">{currentLanguage.flag}</span>
		<span class="hidden sm:inline">{currentLanguage.name}</span>
		<svg
			class="h-4 w-4 transition-transform {showDropdown ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if showDropdown}
		<div
			class="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-theme-border bg-white shadow-lg dark:bg-gray-800"
		>
			{#each languages as lang}
				<button
					onclick={() => changeLanguage(lang.code)}
					class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 {lang.code ===
					currentLanguage.code
						? 'bg-gray-50 dark:bg-gray-700/50'
						: ''}"
				>
					<span class="text-lg">{lang.flag}</span>
					<span class="text-theme-text">{lang.name}</span>
					{#if lang.code === currentLanguage.code}
						<svg class="ml-auto h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<svelte:window
	onclick={(e) => {
		// Close dropdown when clicking outside
		if (showDropdown && !(e.target as HTMLElement)?.closest('.relative')) {
			showDropdown = false;
		}
	}}
/>

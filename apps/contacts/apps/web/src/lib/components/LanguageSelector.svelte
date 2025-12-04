<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import type { SupportedLocale } from '$lib/i18n';

	const languageLabels: Record<SupportedLocale, string> = {
		de: 'Deutsch',
		en: 'English',
		it: 'Italiano',
		fr: 'Français',
		es: 'Español',
	};

	let isOpen = $state(false);

	function handleSelect(lang: SupportedLocale) {
		setLocale(lang);
		isOpen = false;
	}
</script>

<div class="relative">
	<button
		onclick={() => (isOpen = !isOpen)}
		class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
	>
		{languageLabels[$locale as SupportedLocale] || 'Language'}
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div class="absolute right-0 mt-2 w-40 rounded-md border border-border bg-card shadow-lg z-50">
			{#each supportedLocales as lang}
				<button
					onclick={() => handleSelect(lang)}
					class="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
					class:bg-accent={$locale === lang}
				>
					{languageLabels[lang]}
				</button>
			{/each}
		</div>
	{/if}
</div>

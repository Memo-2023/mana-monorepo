<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';
	import type { SupportedLanguage } from '@zitare/content';
	import { APP_VERSION } from '$lib/version';

	// Language options for quotes
	const languageOptions: { value: SupportedLanguage; label: string }[] = [
		{ value: 'de', label: 'Deutsch' },
		{ value: 'en', label: 'English' },
		{ value: 'it', label: 'Italiano' },
		{ value: 'fr', label: 'Français' },
		{ value: 'es', label: 'Español' },
		{ value: 'original', label: 'Original' },
	];

	function handleLanguageChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const lang = select.value as SupportedLanguage;
		quotesStore.setLanguage(lang);
		ZitareEvents.quoteLanguageChanged(lang);
	}
</script>

<svelte:head>
	<title>Zitare - {$_('nav.settings')}</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold text-foreground mb-8">{$_('nav.settings')}</h1>

	<div class="space-y-6">
		<!-- Quote Language -->
		<div class="bg-surface-elevated rounded-2xl p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">{$_('settings.quoteLanguage')}</h2>
			<p class="text-foreground-secondary text-sm mb-4">
				{$_('settings.quoteLanguageDescription')}
			</p>
			<select
				value={quotesStore.language}
				onchange={handleLanguageChange}
				class="w-full p-3 rounded-lg bg-surface border border-border text-foreground"
			>
				{#each languageOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<!-- About -->
		<div class="bg-surface-elevated rounded-2xl p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">{$_('settings.about')}</h2>
			<p class="text-foreground-secondary text-sm">
				{$_('settings.aboutDescription')}
			</p>
			<p class="text-foreground-muted text-sm mt-4">
				{$_('settings.stats', {
					values: { quotes: quotesStore.totalCount, categories: 10, languages: 6 },
				})}
			</p>
		</div>
	</div>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</div>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import type { SupportedLanguage } from '@zitare/content';

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
		quotesStore.setLanguage(select.value as SupportedLanguage);
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
			<h2 class="text-lg font-semibold text-foreground mb-4">Zitat-Sprache</h2>
			<p class="text-foreground-secondary text-sm mb-4">
				Wähle die Sprache, in der die Zitate angezeigt werden sollen.
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
			<h2 class="text-lg font-semibold text-foreground mb-4">Über Zitare</h2>
			<p class="text-foreground-secondary text-sm">
				Zitare bietet dir täglich inspirierende Zitate von den größten Denkern der Geschichte.
				Speichere deine Favoriten und erstelle eigene Listen.
			</p>
			<p class="text-foreground-muted text-sm mt-4">
				{quotesStore.totalCount} Zitate · 10 Kategorien · 6 Sprachen
			</p>
		</div>
	</div>
</div>

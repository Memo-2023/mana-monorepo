<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { zitareSettings } from '$lib/stores/settings.svelte';
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

	const fontSizeOptions = [
		{ value: 0.85, label: 'settings.fontSizeSmall' },
		{ value: 1, label: 'settings.fontSizeNormal' },
		{ value: 1.15, label: 'settings.fontSizeLarge' },
		{ value: 1.3, label: 'settings.fontSizeXLarge' },
	];

	function handleLanguageChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const lang = select.value as SupportedLanguage;
		quotesStore.setLanguage(lang);
		ZitareEvents.quoteLanguageChanged(lang);
	}

	function handleFontSizeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		zitareSettings.update({ fontSizeMultiplier: parseFloat(select.value) });
	}

	function toggleShowCategory() {
		zitareSettings.update({ showCategory: !zitareSettings.showCategory });
	}

	function toggleShowSource() {
		zitareSettings.update({ showSource: !zitareSettings.showSource });
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

		<!-- Display Settings -->
		<div class="bg-surface-elevated rounded-2xl p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">{$_('settings.display')}</h2>
			<div class="space-y-4">
				<!-- Show Category -->
				<label class="flex items-center justify-between cursor-pointer">
					<div>
						<p class="text-foreground font-medium">{$_('settings.showCategory')}</p>
						<p class="text-foreground-secondary text-sm">
							{$_('settings.showCategoryDescription')}
						</p>
					</div>
					<button
						onclick={toggleShowCategory}
						class="relative w-11 h-6 rounded-full transition-colors {zitareSettings.showCategory
							? 'bg-primary'
							: 'bg-border'}"
						role="switch"
						aria-checked={zitareSettings.showCategory}
					>
						<span
							class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {zitareSettings.showCategory
								? 'translate-x-5'
								: ''}"
						></span>
					</button>
				</label>

				<!-- Show Source -->
				<label class="flex items-center justify-between cursor-pointer">
					<div>
						<p class="text-foreground font-medium">{$_('settings.showSource')}</p>
						<p class="text-foreground-secondary text-sm">
							{$_('settings.showSourceDescription')}
						</p>
					</div>
					<button
						onclick={toggleShowSource}
						class="relative w-11 h-6 rounded-full transition-colors {zitareSettings.showSource
							? 'bg-primary'
							: 'bg-border'}"
						role="switch"
						aria-checked={zitareSettings.showSource}
					>
						<span
							class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform {zitareSettings.showSource
								? 'translate-x-5'
								: ''}"
						></span>
					</button>
				</label>

				<!-- Font Size -->
				<div>
					<p class="text-foreground font-medium mb-2">{$_('settings.fontSize')}</p>
					<select
						value={zitareSettings.fontSizeMultiplier}
						onchange={handleFontSizeChange}
						class="w-full p-3 rounded-lg bg-surface border border-border text-foreground"
					>
						{#each fontSizeOptions as option}
							<option value={option.value}>{$_(option.label)}</option>
						{/each}
					</select>
				</div>
			</div>
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

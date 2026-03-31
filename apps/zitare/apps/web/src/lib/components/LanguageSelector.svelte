<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { CaretDown } from '@manacore/shared-icons';

	const languageLabels: Record<string, string> = {
		de: 'Deutsch',
		en: 'English',
	};

	let isOpen = $state(false);

	function handleSelect(lang: string) {
		setLocale(lang as 'de' | 'en');
		isOpen = false;
	}
</script>

<div class="relative">
	<button
		onclick={() => (isOpen = !isOpen)}
		class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-surface transition-colors"
	>
		{languageLabels[$locale || 'de']}
		<CaretDown size={16} />
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-1 py-1 bg-surface-elevated border border-border rounded-lg shadow-lg z-50"
		>
			{#each supportedLocales as lang}
				<button
					onclick={() => handleSelect(lang)}
					class="w-full px-4 py-2 text-left text-sm hover:bg-surface transition-colors"
					class:text-primary={$locale === lang}
				>
					{languageLabels[lang]}
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if isOpen}
	<button
		class="fixed inset-0 z-40 bg-transparent"
		onclick={() => (isOpen = false)}
		aria-label="Close menu"
	></button>
{/if}

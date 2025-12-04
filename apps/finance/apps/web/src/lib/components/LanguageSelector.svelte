<script lang="ts">
	let isOpen = $state(false);
	let currentLang = $state('de');

	const languages = [
		{ code: 'de', label: 'Deutsch', flag: '🇩🇪' },
		{ code: 'en', label: 'English', flag: '🇬🇧' },
	];

	function selectLanguage(code: string) {
		currentLang = code;
		isOpen = false;
		// TODO: Implement language switching
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.language-selector')) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="language-selector relative">
	<button
		onclick={() => (isOpen = !isOpen)}
		class="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-accent"
		aria-label="Select language"
	>
		<span class="text-lg">{languages.find((l) => l.code === currentLang)?.flag}</span>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-lg"
		>
			{#each languages as lang}
				<button
					onclick={() => selectLanguage(lang.code)}
					class="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent {currentLang ===
					lang.code
						? 'bg-accent'
						: ''}"
				>
					<span class="text-lg">{lang.flag}</span>
					<span class="text-sm">{lang.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import { themeStore } from '$lib/themes/theme-store';
	import { themes } from '$lib/themes/presets';
	import { get } from 'svelte/store';
	
	// Subscribe to stores for reactive values
	let isDark = $state(false);
	let preset = $state('');
	
	$effect(() => {
		const unsubscribeDark = themeStore.isDark.subscribe(value => isDark = value);
		const unsubscribePreset = themeStore.preset.subscribe(value => preset = value);
		
		return () => {
			unsubscribeDark();
			unsubscribePreset();
		};
	});

	let showDropdown = $state(false);
	let dropdownElement: HTMLDivElement;

	function toggleDropdown(event: MouseEvent) {
		event.stopPropagation();
		showDropdown = !showDropdown;
	}

	function selectTheme(themeId: string, event: MouseEvent) {
		event.stopPropagation();
		themeStore.setPreset(themeId);
		showDropdown = false;
	}

	function toggleDarkMode(event: MouseEvent) {
		event.stopPropagation();
		themeStore.toggle();
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			showDropdown = false;
		}
	}

	$effect(() => {
		if (showDropdown) {
			// Use setTimeout to avoid immediate closing
			const timer = setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);

			return () => {
				clearTimeout(timer);
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative" bind:this={dropdownElement}>
	<button
		onclick={(e) => toggleDropdown(e)}
		class="rounded-lg p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
		aria-label="Theme settings"
		title="Theme settings"
	>
		<svg
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			></path>
		</svg>
	</button>

	{#if showDropdown}
		<div
			class="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-theme-border bg-theme-surface shadow-lg"
		>
			<!-- Dark Mode Toggle -->
			<div class="border-b border-theme-border p-3">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-theme-text">Dark Mode</span>
					<button
						onclick={(e) => toggleDarkMode(e)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {themeStore.isDark
							? 'bg-theme-accent'
							: 'bg-theme-border'}"
						aria-label="Toggle dark mode"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {themeStore.isDark
								? 'translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
				</div>
			</div>

			<!-- Theme Selection -->
			<div class="p-2">
				<p class="mb-2 px-2 text-xs font-medium text-theme-text-muted">Choose Theme</p>
				<div class="space-y-1">
					{#each Object.values(themes) as theme}
						<button
							onclick={(e) => selectTheme(theme.id, e)}
							class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover {themeStore.preset ===
							theme.id
								? 'bg-theme-surface-hover'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<!-- Theme Preview Colors -->
								<div class="flex gap-1">
									<div
										class="h-4 w-4 rounded-full border border-theme-border"
										style="background-color: {themeStore.isDark
											? theme.colors.dark.primary
											: theme.colors.light.primary}"
									></div>
									<div
										class="h-4 w-4 rounded-full border border-theme-border"
										style="background-color: {themeStore.isDark
											? theme.colors.dark.accent
											: theme.colors.light.accent}"
									></div>
								</div>
								<div>
									<span class="block text-sm font-medium text-theme-text">{theme.name}</span>
									<span class="block text-xs text-theme-text-muted">{theme.description}</span>
								</div>
							</div>
							{#if themeStore.preset === theme.id}
								<svg
									class="h-4 w-4 text-theme-accent"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

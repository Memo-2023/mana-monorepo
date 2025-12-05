<script lang="ts">
	import { theme, type ThemeName, type ThemeMode } from '$lib/themes/themeStore';

	let showDropdown = $state(false);
	let themes = theme.getAvailableThemes();

	// Get current state reactively
	let currentTheme = $state<ThemeName>('default');
	let currentMode = $state<ThemeMode>('light');

	// Subscribe to theme changes
	theme.subscribe((state) => {
		currentTheme = state.theme;
		currentMode = state.mode;
	});

	function selectTheme(themeId: ThemeName) {
		theme.setTheme(themeId);
		showDropdown = false;
	}

	function toggleMode() {
		theme.toggleMode();
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.theme-switcher')) {
			showDropdown = false;
		}
	}

	$effect(() => {
		if (showDropdown) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	// Theme icons mapping
	const themeIcons: Record<ThemeName, string> = {
		default: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
    </svg>`,
		forest: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>`,
		ocean: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>`,
	};

	// Mode icons
	const modeIcons: Record<ThemeMode, string> = {
		light: `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>`,
		dark: `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>`,
	};
</script>

<div class="theme-switcher relative flex items-center gap-1">
	<!-- Mode toggle button -->
	<button
		onclick={toggleMode}
		class="rounded-lg p-2 text-theme-text-secondary transition-colors hover:bg-theme-interactive-hover hover:text-theme-text-primary"
		aria-label="Toggle {currentMode === 'light' ? 'dark' : 'light'} mode"
		title={currentMode === 'light' ? 'Zu Dark Mode wechseln' : 'Zu Light Mode wechseln'}
	>
		{@html modeIcons[currentMode]}
	</button>

	<!-- Theme selector -->
	<button
		onclick={() => (showDropdown = !showDropdown)}
		class="rounded-lg p-2 text-theme-text-secondary transition-colors hover:bg-theme-interactive-hover hover:text-theme-text-primary"
		aria-label="Theme auswählen"
		aria-expanded={showDropdown}
		title="Theme: {themes.find((t) => t.id === currentTheme)?.name}"
	>
		{@html themeIcons[currentTheme] || themeIcons.default}
	</button>

	{#if showDropdown}
		<div
			class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-theme-border-subtle bg-theme-surface shadow-lg"
		>
			<div class="py-1">
				<div
					class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-theme-text-secondary"
				>
					Themes
				</div>
				{#each themes as themeOption}
					<button
						onclick={() => selectTheme(themeOption.id)}
						class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-theme-text-primary transition-colors hover:bg-theme-interactive-hover
                   {currentTheme === themeOption.id ? 'bg-theme-interactive-active' : ''}"
					>
						<span class="flex-shrink-0">
							{@html themeIcons[themeOption.id]}
						</span>
						<span class="flex-1">{themeOption.name}</span>
						{#if currentTheme === themeOption.id}
							<div class="flex items-center gap-1">
								{@html modeIcons[currentMode]}
								<svg
									class="h-4 w-4 flex-shrink-0 text-theme-primary-500"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<div class="border-t border-theme-border-subtle px-3 py-2">
				<div class="text-xs text-theme-text-tertiary">
					Aktuell: {themes.find((t) => t.id === currentTheme)?.name} ({currentMode === 'light'
						? 'Hell'
						: 'Dunkel'})
				</div>
			</div>
		</div>
	{/if}
</div>

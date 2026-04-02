<script lang="ts">
	import { theme } from '$lib/stores/theme';

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');

	function toggleTheme() {
		theme.toggleMode();
	}
</script>

<button
	onclick={toggleTheme}
	class="rounded-xl p-2 transition-all hover:translate-y-[-1px]"
	style="background-color: {isDark
		? 'rgba(255, 255, 255, 0.1)'
		: 'rgba(255, 255, 255, 0.6)'}; border: 1px solid {isDark
		? 'rgba(255, 255, 255, 0.2)'
		: 'rgba(0, 0, 0, 0.1)'}; backdrop-filter: blur(10px);"
	aria-label="Toggle theme"
	title={currentTheme.effectiveMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
	{#if currentTheme.effectiveMode === 'light'}
		<!-- Moon Icon (Dark Mode) -->
		<svg class="h-5 w-5 text-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	{:else}
		<!-- Sun Icon (Light Mode) -->
		<svg class="h-5 w-5 text-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>
	{/if}
</button>

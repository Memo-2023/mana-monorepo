<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { initI18n } from '$lib/i18n';

	// Initialize i18n
	initI18n();

	let { children } = $props();

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');

	// Get page background based on theme variant
	let pageBackground = $derived(() => {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors: Record<string, string> = {
				lume: '#101010',
				nature: '#121212',
				stone: '#121212',
				ocean: '#121212'
			};
			return colors[variant];
		} else {
			const colors: Record<string, string> = {
				lume: '#dddddd',
				nature: '#FBFDF8',
				stone: '#F5F7F9',
				ocean: '#F5FCFF'
			};
			return colors[variant];
		}
	});

	// Initialize theme on mount
	onMount(() => {
		const cleanup = theme.initialize();
		return cleanup;
	});

	// Update body and html background when theme changes
	$effect(() => {
		if (typeof document !== 'undefined') {
			const bgColor = pageBackground();
			document.documentElement.style.backgroundColor = bgColor;
			document.body.style.backgroundColor = bgColor;
		}
	});
</script>

{@render children?.()}

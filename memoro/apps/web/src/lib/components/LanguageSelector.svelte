<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { LanguageSelector } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { theme, type ThemeVariant } from '$lib/stores/theme';

	let currentTheme = $derived(theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');
	let currentLocale = $derived($locale || 'en');

	const variantColors: Record<ThemeVariant, { light: string; dark: string }> = {
		lume: { light: '#f8d62b', dark: '#f8d62b' },
		nature: { light: '#4CAF50', dark: '#4CAF50' },
		stone: { light: '#607D8B', dark: '#78909C' },
		ocean: { light: '#039BE5', dark: '#039BE5' }
	};

	function getPrimaryColor(): string {
		const variant = currentTheme.variant;
		const colors = variantColors[variant];
		return isDark ? colors.dark : colors.light;
	}

	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
</script>

<LanguageSelector
	{currentLocale}
	{supportedLocales}
	onLocaleChange={handleLocaleChange}
	{isDark}
	primaryColor={getPrimaryColor()}
/>

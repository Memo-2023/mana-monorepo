<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { LanguageSelector } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { actualMode } from '$lib/stores/theme';

	let isDark = $derived($actualMode === 'dark');
	let currentLocale = $derived($locale || 'de');

	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
</script>

<LanguageSelector
	{currentLocale}
	{supportedLocales}
	onLocaleChange={handleLocaleChange}
	{isDark}
	primaryColor="#3b82f6"
/>

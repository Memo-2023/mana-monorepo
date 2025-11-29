<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { PillDropdown } from '@manacore/shared-ui';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';

	let currentLocale = $derived($locale || 'de');

	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}

	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLabel = $derived(getCurrentLanguageLabel(currentLocale));
</script>

<PillDropdown items={languageItems} label={currentLabel} direction="down" />

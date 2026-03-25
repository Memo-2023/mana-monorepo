<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getStorageHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getStorageHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Storage kennen'
					: 'Find answers and learn how to use Storage',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Storage</title>
</svelte:head>

<HelpPage
	{content}
	appName="Storage"
	appId="storage"
	{translations}
	showBackButton
	onBack={() => goto('/files')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

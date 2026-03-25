<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getPhotosHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getPhotosHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Photos kennen'
					: 'Find answers and learn how to use Photos',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Photos</title>
</svelte:head>

<HelpPage
	{content}
	appName="Photos"
	appId="photos"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

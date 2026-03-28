<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getCityCornersHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getCityCornersHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne CityCorners kennen'
					: 'Find answers and learn how to use CityCorners',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | CityCorners</title>
</svelte:head>

<HelpPage
	{content}
	appName="CityCorners"
	appId="citycorners"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

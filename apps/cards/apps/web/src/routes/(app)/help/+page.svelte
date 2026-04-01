<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getCardsHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getCardsHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Cards kennen'
					: 'Find answers and learn how to use Cards',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Cards</title>
</svelte:head>

<HelpPage
	{content}
	appName="Cards"
	appId="cards"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

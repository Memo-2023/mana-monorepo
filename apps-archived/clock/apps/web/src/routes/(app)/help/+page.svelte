<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getClockHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getClockHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Clock kennen'
					: 'Find answers and learn how to use Clock',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Clock</title>
</svelte:head>

<HelpPage
	{content}
	appName="Clock"
	appId="clock"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

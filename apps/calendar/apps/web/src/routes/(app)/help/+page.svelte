<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getCalendarHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getCalendarHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne den Kalender kennen'
					: 'Find answers and learn how to use Calendar',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Kalender</title>
</svelte:head>

<HelpPage
	{content}
	appName="Kalender"
	appId="calendar"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

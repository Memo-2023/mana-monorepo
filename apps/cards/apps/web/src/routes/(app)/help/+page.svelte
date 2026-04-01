<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getManaDeckHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getManaDeckHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne ManaDeck kennen'
					: 'Find answers and learn how to use ManaDeck',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | ManaDeck</title>
</svelte:head>

<HelpPage
	{content}
	appName="ManaDeck"
	appId="manadeck"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

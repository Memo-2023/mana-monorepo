<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getNutriPhiHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getNutriPhiHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne NutriPhi kennen'
					: 'Find answers and learn how to use NutriPhi',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | NutriPhi</title>
</svelte:head>

<HelpPage
	{content}
	appName="NutriPhi"
	appId="nutriphi"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

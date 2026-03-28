<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getContextHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getContextHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Context kennen'
					: 'Find answers and learn how to use Context',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Context</title>
</svelte:head>

<HelpPage
	{content}
	appName="Context"
	appId="context"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

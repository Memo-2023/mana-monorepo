<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getPresiHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getPresiHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Presi kennen'
					: 'Find answers and learn how to use Presi',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Presi</title>
</svelte:head>

<HelpPage
	{content}
	appName="Presi"
	appId="presi"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

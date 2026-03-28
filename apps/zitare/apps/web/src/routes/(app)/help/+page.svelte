<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getZitareHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getZitareHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Zitare kennen'
					: 'Find answers and learn how to use Zitare',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Zitare</title>
</svelte:head>

<HelpPage
	{content}
	appName="Zitare"
	appId="zitare"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showShortcuts={false}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/help';
	import { getManaCoreHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getManaCoreHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne ManaCore kennen'
					: 'Find answers and learn how to use ManaCore',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | ManaCore</title>
</svelte:head>

<HelpPage
	{content}
	appName="ManaCore"
	appId="manacore"
	{translations}
	showBackButton
	onBack={() => goto('/dashboard')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

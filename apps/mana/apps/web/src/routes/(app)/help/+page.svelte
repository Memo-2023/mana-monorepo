<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@mana/help';
	import { getManaHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getManaHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Mana kennen'
					: 'Find answers and learn how to use Mana',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Mana</title>
</svelte:head>

<HelpPage
	{content}
	appName="Mana"
	appId="mana"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

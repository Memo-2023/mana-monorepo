<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getManalinkHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getManalinkHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Manalink kennen'
					: 'Find answers and learn how to use Manalink',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Manalink</title>
</svelte:head>

<HelpPage
	{content}
	appName="Manalink"
	appId="matrix"
	{translations}
	showBackButton
	onBack={() => goto('/')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>

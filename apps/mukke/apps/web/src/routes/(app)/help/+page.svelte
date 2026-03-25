<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { HelpPage, getHelpTranslations } from '@manacore/shared-help-ui';
	import { getMukkeHelpContent } from '$lib/content/help/index.js';

	const content = $derived(getMukkeHelpContent($locale ?? 'de'));
	const translations = $derived(
		getHelpTranslations($locale ?? 'de', {
			subtitle:
				$locale === 'de'
					? 'Finde Antworten und lerne Mukke kennen'
					: 'Find answers and learn how to use Mukke',
		})
	);
</script>

<svelte:head>
	<title>{translations.title} | Mukke</title>
</svelte:head>

<HelpPage
	{content}
	appName="Mukke"
	appId="mukke"
	{translations}
	showBackButton
	onBack={() => goto('/dashboard')}
	showGettingStarted={false}
	showChangelog={false}
	defaultSection="faq"
/>
